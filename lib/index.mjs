import { readFile, writeFile } from 'node:fs/promises';
import { parse, stringify } from 'yaml';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

export async function loadSkills() {
  const raw = await readFile(resolve(ROOT, 'skills.yaml'), 'utf8');
  const doc = parse(raw);
  if (!doc || !Array.isArray(doc.skills)) {
    throw new Error('skills.yaml must contain a top-level "skills" array');
  }
  return doc.skills;
}

export async function saveSkills(skills) {
  const content = stringify({ skills }, null, 2);
  await writeFile(resolve(ROOT, 'skills.yaml'), content, 'utf8');
}

export function validateSkills(skills) {
  const errors = [];
  const names = new Set();

  if (!Array.isArray(skills)) {
    return [{ message: 'skills must be an array' }];
  }

  for (const [i, skill] of skills.entries()) {
    const prefix = `skills[${i}]`;

    if (!skill.name || typeof skill.name !== 'string') {
      errors.push({ message: `${prefix}: "name" is required and must be a string` });
      continue;
    }

    if (names.has(skill.name)) {
      errors.push({ message: `${prefix}: duplicate name "${skill.name}"` });
    }
    names.add(skill.name);

    if (!skill.category || typeof skill.category !== 'string') {
      errors.push({ message: `${prefix}: "category" is required` });
    }

    if (typeof skill.custom !== 'boolean') {
      errors.push({ message: `${prefix}: "custom" is required and must be a boolean` });
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

export function getSkillDir(skill) {
  return resolve(ROOT, 'skills', skill.category, skill.name);
}

export function findSkillByName(skills, name) {
  return skills.find((s) => s.name === name);
}
