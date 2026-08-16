import { readdir, readFile, stat, access } from 'node:fs/promises';
import { resolve, basename } from 'node:path';
import {
  loadSkills,
  loadCategorySkills,
  validateSkills,
  SKILLS_ROOT,
  CATEGORY_MANIFEST,
  getCategoryManifestPath,
} from './index.mjs';
import { validateOverlays, auditSkill } from './overlay-pipeline.mjs';
import { isOverlayRoutePending } from './locks.mjs';
import { resolveGeneratorsForSkill } from './overlay-yaml.mjs';
import { validateGlobalOverlay, validateSkillGenerators } from './generator-config.mjs';
import { validateMarketplaceManifest } from './marketplace-manifest.mjs';
import { getCanonicalDir } from './skill-paths.mjs';
import { parseFrontmatter } from './skill-md.mjs';

const LOCAL_INSTALL_SKILL_RE =
  /npx skills add fernando-delosrios-sp\/skills --skill ([A-Za-z0-9._-]+)/g;

export function collectLocalInstallSkillNames(markdown) {
  const names = [];
  const seen = new Set();
  for (const match of markdown.matchAll(LOCAL_INSTALL_SKILL_RE)) {
    const name = match[1];
    if (!seen.has(name)) {
      seen.add(name);
      names.push(name);
    }
  }
  return names;
}

async function validateSchemaInstallSkills(skills, errors) {
  const catalog = new Map(skills.map((s) => [s.name, s]));
  const schemasRoot = resolve(SKILLS_ROOT, 'engineering', 'openspec-init', 'schemas');
  let schemaDirs;
  try {
    schemaDirs = await readdir(schemasRoot, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of schemaDirs) {
    if (!entry.isDirectory()) continue;

    const installPath = resolve(schemasRoot, entry.name, 'INSTALL.md');
    let content;
    try {
      content = await readFile(installPath, 'utf8');
    } catch {
      continue;
    }

    const relPath = `skills/engineering/openspec-init/schemas/${entry.name}/INSTALL.md`;
    for (const name of collectLocalInstallSkillNames(content)) {
      const skill = catalog.get(name);
      if (!skill) {
        errors.push({
          type: 'install-skill',
          message: `${relPath} installs "${name}" from this package, but it is not listed in skills/<category>/skills.json`,
          skill: name,
        });
        continue;
      }

      const expectedFile = resolve(getCanonicalDir(skill), 'SKILL.md');
      try {
        await stat(expectedFile);
      } catch {
        errors.push({
          type: 'install-skill',
          message: `${relPath} installs "${name}" from this package, but SKILL.md is missing at ${expectedFile}`,
          skill: name,
        });
      }
    }
  }
}

async function walkSkillsDir(dir, depth = 0) {
  const results = [];
  let entries;

  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    const fullPath = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      const markerPath = resolve(fullPath, 'SKILL.md');
      try {
        await stat(markerPath);
        results.push({ dir: fullPath, name: basename(fullPath) });
      } catch {
        if (depth < 1) {
          const nested = await walkSkillsDir(fullPath, depth + 1);
          results.push(...nested);
        }
      }
    }
  }

  return results;
}

export async function validateStructure() {
  const errors = [];
  const warnings = [];

  let skills;
  try {
    skills = await loadSkills();

    const globalErrors = validateSkills(skills);
    errors.push(...globalErrors.map((e) => ({ type: 'skills.json', ...e })));

    errors.push(...(await validateGlobalOverlay()));
    errors.push(...(await validateSkillGenerators(skills)));
    await validateSchemaInstallSkills(skills, errors);

    let categoryEntries;
    try {
      categoryEntries = await readdir(SKILLS_ROOT, { withFileTypes: true });
    } catch {
      categoryEntries = [];
    }

    for (const entry of categoryEntries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;

      const manifestPath = getCategoryManifestPath(entry.name);
      try {
        await stat(manifestPath);
      } catch {
        continue;
      }

      try {
        const categorySkills = await loadCategorySkills(entry.name);
        const categoryErrors = validateSkills(categorySkills, { category: entry.name });
        errors.push(...categoryErrors.map((e) => ({ type: 'skills.json', ...e })));
      } catch (err) {
        errors.push({ type: 'skills.json', message: err.message });
      }
    }
  } catch (err) {
    errors.push({ type: 'skills.json', message: err.message });
    return { errors, warnings };
  }

  const skillDirs = await walkSkillsDir(SKILLS_ROOT);

  const indexedPaths = new Set(skills.map((s) => getCanonicalDir(s)));

  const skillByName = new Map(skills.map((s) => [s.name, s]));

  for (const { dir, name } of skillDirs) {
    if (!indexedPaths.has(dir)) {
      errors.push({
        type: 'orphan',
        message: `Orphaned directory: ${dir} — exists on disk but not in skills/<category>/${CATEGORY_MANIFEST}`,
      });
      continue;
    }

    const skillFile = resolve(dir, 'SKILL.md');
    let content;
    try {
      content = await readFile(skillFile, 'utf8');
    } catch {
      errors.push({
        type: 'frontmatter',
        message: `Missing SKILL.md in ${dir}`,
        skill: name,
      });
      continue;
    }

    const frontmatter = parseFrontmatter(content);
    if (!frontmatter) {
      errors.push({
        type: 'frontmatter',
        message: `Invalid or missing frontmatter in ${skillFile}`,
        skill: name,
      });
      continue;
    }

    for (const field of ['name', 'description']) {
      if (!frontmatter[field]) {
        errors.push({
          type: 'frontmatter',
          message: `Missing "${field}" in frontmatter of ${skillFile}`,
          skill: name,
        });
      }
    }

    const skill = skillByName.get(name);
    if (skill) {
      const generators = await resolveGeneratorsForSkill(name);
      for (const gen of generators) {
        if (!gen.file) continue;
        const outputFile = resolve(dir, gen.file);
        try {
          await access(outputFile);
        } catch {
          warnings.push({
            type: 'generated-file',
            message: `Missing ${gen.file} in ${name} (generator: ${gen.id}) — run npm run overlay -- prepare-generators and apply via skill-overlay`,
            skill: name,
          });
        }
      }
    }
  }

  for (const skill of skills) {
    const expectedDir = getCanonicalDir(skill);
    const expectedFile = resolve(expectedDir, 'SKILL.md');
    try {
      await stat(expectedFile);
    } catch {
      errors.push({
        type: 'missing',
        message: `Skill "${skill.name}" listed in skills/${skill.category}/${CATEGORY_MANIFEST} but SKILL.md not found at ${expectedFile}`,
        skill: skill.name,
      });
    }
  }

  const overlayResult = await validateOverlays(skills);
  errors.push(...overlayResult.errors);
  warnings.push(...overlayResult.warnings);

  const marketplaceResult = await validateMarketplaceManifest();
  if (!marketplaceResult.ok) {
    errors.push({ type: 'marketplace', message: marketplaceResult.message });
  }

  return { errors, warnings };
}

export async function validateBlendState(deps = {}) {
  const runAudit = deps.auditSkill ?? auditSkill;
  const errors = [];
  const warnings = [];

  let skills = deps.skills;
  if (!skills) {
    try {
      skills = await loadSkills();
    } catch {
      return { errors, warnings };
    }
  }

  for (const skill of skills) {
    if (!skill.source) continue;
    try {
      const audit = await runAudit(skill.name);
      if (audit.route === 'none') continue;
      if (isOverlayRoutePending(audit.route) && !audit.blended_ref) {
        warnings.push({
          type: 'overlay-lock',
          message: `Skill "${skill.name}" pending ${audit.route} with no blended_ref — apply via skill-overlay then commit`,
          skill: skill.name,
        });
      }
    } catch {
      // skill may not exist in audit context
    }
  }

  return { errors, warnings };
}

export async function validateRepo() {
  const structure = await validateStructure();
  const blend = await validateBlendState();

  return {
    errors: [...structure.errors, ...blend.errors],
    warnings: [...structure.warnings, ...blend.warnings],
  };
}
