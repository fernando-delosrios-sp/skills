import { readdir, readFile, stat, access } from 'node:fs/promises';
import { resolve, basename } from 'node:path';
import { parse } from 'yaml';
import {
  loadSkills,
  loadCategorySkills,
  validateSkills,
  SKILLS_ROOT,
  CATEGORY_MANIFEST,
  getCategoryManifestPath,
} from './index.mjs';
import { validateOverlays } from './overlays.mjs';
import {
  resolveGeneratorsForSkill,
  validateGlobalOverlay,
  validateSkillGenerators,
} from './generator-config.mjs';

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

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  try {
    return parse(match[1]);
  } catch {
    return null;
  }
}

export async function validateRepo() {
  const errors = [];
  const warnings = [];

  let skills;
  try {
    skills = await loadSkills();

    const globalErrors = validateSkills(skills);
    errors.push(...globalErrors.map((e) => ({ type: 'skills.json', ...e })));

    errors.push(...(await validateGlobalOverlay()));
    errors.push(...(await validateSkillGenerators(skills)));

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

  const skillsRoot = SKILLS_ROOT;
  const skillDirs = await walkSkillsDir(skillsRoot);

  const indexedPaths = new Set(
    skills.map((s) => resolve(skillsRoot, s.category, s.name))
  );

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

    if (!frontmatter.name) {
      errors.push({
        type: 'frontmatter',
        message: `Missing "name" in frontmatter of ${skillFile}`,
        skill: name,
      });
    }

    if (!frontmatter.description) {
      errors.push({
        type: 'frontmatter',
        message: `Missing "description" in frontmatter of ${skillFile}`,
        skill: name,
      });
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
            message: `Missing ${gen.file} in ${name} (generator: ${gen.id}) — run npm run overlay -- prepare-generators and apply via apply-skill-overlay`,
            skill: name,
          });
        }
      }
    }
  }

  for (const skill of skills) {
    const expectedDir = resolve(skillsRoot, skill.category, skill.name);
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

  return { errors, warnings };
}
