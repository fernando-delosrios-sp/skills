import { readFile, writeFile, readdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(__dirname, '..');
export const SKILLS_ROOT = resolve(ROOT, 'skills');
export const CATEGORY_MANIFEST = 'skills.json';

async function discoverCategories() {
  let entries;
  try {
    entries = await readdir(SKILLS_ROOT, { withFileTypes: true });
  } catch {
    return [];
  }

  return entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .sort();
}

export function getCategoryManifestPath(category) {
  return resolve(SKILLS_ROOT, category, CATEGORY_MANIFEST);
}

export async function loadCategorySkills(category) {
  const manifestPath = getCategoryManifestPath(category);
  let raw;
  try {
    raw = await readFile(manifestPath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`Missing ${CATEGORY_MANIFEST} at skills/${category}/${CATEGORY_MANIFEST}`);
    }
    throw err;
  }

  let doc;
  try {
    doc = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Invalid JSON in skills/${category}/${CATEGORY_MANIFEST}: ${err.message}`);
  }

  if (!doc || !Array.isArray(doc.skills)) {
    throw new Error(`skills/${category}/${CATEGORY_MANIFEST} must contain a top-level "skills" array`);
  }

  return doc.skills.map((skill) => ({ ...skill, category }));
}

export async function loadSkills() {
  const categories = await discoverCategories();
  const skills = [];

  for (const category of categories) {
    const manifestPath = getCategoryManifestPath(category);
    try {
      await readFile(manifestPath, 'utf8');
    } catch (err) {
      if (err.code === 'ENOENT') {
        continue;
      }
      throw err;
    }

    skills.push(...(await loadCategorySkills(category)));
  }

  return skills;
}

export async function saveCategorySkills(category, categorySkills) {
  const manifest = {
    skills: categorySkills.map(({ name, source }) => {
      const entry = { name };
      if (source) {
        entry.source = source;
      }
      return entry;
    }),
  };

  const content = `${JSON.stringify(manifest, null, 2)}\n`;
  await writeFile(getCategoryManifestPath(category), content, 'utf8');
}

export async function saveSkills(skills) {
  const byCategory = new Map();

  for (const skill of skills) {
    if (!skill.category) {
      throw new Error(`Skill "${skill.name}" is missing "category"`);
    }
    if (!byCategory.has(skill.category)) {
      byCategory.set(skill.category, []);
    }
    byCategory.get(skill.category).push(skill);
  }

  for (const [category, categorySkills] of byCategory) {
    categorySkills.sort((a, b) => a.name.localeCompare(b.name));
    await saveCategorySkills(category, categorySkills);
  }
}

export function validateSkills(skills, { category = null } = {}) {
  const errors = [];
  const names = new Set();
  const prefixRoot = category ? `skills/${category}/${CATEGORY_MANIFEST}` : 'skills';

  if (!Array.isArray(skills)) {
    return [{ message: `${prefixRoot}: skills must be an array` }];
  }

  for (const [i, skill] of skills.entries()) {
    const prefix = `${prefixRoot} skills[${i}]`;

    if (!skill.name || typeof skill.name !== 'string') {
      errors.push({ message: `${prefix}: "name" is required and must be a string` });
      continue;
    }

    if (names.has(skill.name)) {
      errors.push({ message: `${prefix}: duplicate name "${skill.name}"` });
    }
    names.add(skill.name);

    if (category) {
      if (skill.category && skill.category !== category) {
        errors.push({
          message: `${prefix}: category "${skill.category}" does not match manifest directory "${category}"`,
        });
      }
    } else if (!skill.category || typeof skill.category !== 'string') {
      errors.push({ message: `${prefix}: "category" is required` });
    }

    if (skill.source) {
      if (!skill.source.repo || typeof skill.source.repo !== 'string') {
        errors.push({ message: `${prefix}: source.repo is required` });
      }
      if (!skill.source.path || typeof skill.source.path !== 'string') {
        errors.push({ message: `${prefix}: source.path is required` });
      }
    }
  }

  return errors;
}

export { getCanonicalDir as getSkillDir, getOverlayDir } from './skill-paths.mjs';

export function getOverlayManifestDir() {
  return resolve(ROOT, '.tmp', 'overlay-apply');
}

export { TMP_DIR, OVERLAY_APPLY_DIR } from './tmp.mjs';

export function findSkillByName(skills, name) {
  return skills.find((s) => s.name === name);
}
