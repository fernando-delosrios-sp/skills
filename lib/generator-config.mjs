import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parse } from 'yaml';
import { ROOT } from './index.mjs';
import { hasOverlay, loadOverlay } from './overlays.mjs';

export const GLOBAL_OVERLAY_PATH = resolve(ROOT, 'overlays', 'OVERLAY.yaml');

function validateGeneratorEntry(entry, context) {
  if (!entry?.id) {
    throw new Error(`${context}: generator entries must have an "id"`);
  }
  if (!String(entry.instructions ?? '').trim()) {
    throw new Error(`${context}: generator "${entry.id}" requires "instructions"`);
  }
}

function normalizeGenerator(entry) {
  const normalized = {
    id: entry.id,
    instructions: String(entry.instructions).trim(),
    description: entry.description,
  };
  if (entry.file) {
    normalized.file = entry.file;
  }
  return normalized;
}

export async function loadGlobalOverlay() {
  let raw;
  try {
    raw = await readFile(GLOBAL_OVERLAY_PATH, 'utf8');
  } catch {
    throw new Error('Missing overlays/OVERLAY.yaml');
  }

  const doc = parse(raw);
  if (!doc || typeof doc !== 'object') {
    throw new Error('Invalid overlays/OVERLAY.yaml');
  }
  if (!Array.isArray(doc.generators)) {
    throw new Error('overlays/OVERLAY.yaml must contain a "generators" array');
  }

  for (const entry of doc.generators) {
    validateGeneratorEntry(entry, `overlays/OVERLAY.yaml generator "${entry?.id ?? '?'}"`);
  }

  return doc;
}

function validatePerSkillGenerators(generators, skillName) {
  if (!generators || typeof generators !== 'object') return;

  if (generators.disable !== undefined) {
    if (!Array.isArray(generators.disable)) {
      throw new Error(`OVERLAY.yaml for ${skillName}: generators.disable must be an array`);
    }
  }

  if (generators.add !== undefined) {
    if (!Array.isArray(generators.add)) {
      throw new Error(`OVERLAY.yaml for ${skillName}: generators.add must be an array`);
    }
    for (const entry of generators.add) {
      if (typeof entry !== 'object' || entry === null) {
        throw new Error(
          `OVERLAY.yaml for ${skillName}: generators.add entries must be objects with id and instructions`
        );
      }
      validateGeneratorEntry(entry, `OVERLAY.yaml for ${skillName} generator "${entry.id ?? '?'}"`);
    }
  }
}

export async function resolveGeneratorsForSkill(skillName) {
  const global = await loadGlobalOverlay();
  const resolved = new Map(
    global.generators.map((g) => [g.id, normalizeGenerator(g)])
  );

  if (await hasOverlay(skillName)) {
    const overlay = await loadOverlay(skillName);
    validatePerSkillGenerators(overlay.generators, skillName);

    if (overlay.generators?.disable) {
      for (const disabledId of overlay.generators.disable) {
        resolved.delete(disabledId);
      }
    }

    if (overlay.generators?.add) {
      for (const entry of overlay.generators.add) {
        resolved.set(entry.id, normalizeGenerator(entry));
      }
    }
  }

  return [...resolved.values()];
}

export async function getGeneratedPathsForSkill(skillName) {
  const generators = await resolveGeneratorsForSkill(skillName);
  return generators.flatMap((g) => (g.file ? [g.file] : []));
}

export async function isGeneratedPathForSkill(skillName, relPath) {
  const paths = await getGeneratedPathsForSkill(skillName);
  return paths.includes(relPath);
}

export async function expectedContentForPath() {
  return null;
}

export async function validateGlobalOverlay() {
  const errors = [];
  try {
    await loadGlobalOverlay();
  } catch (err) {
    errors.push({ type: 'overlay', message: err.message });
  }
  return errors;
}

export async function validateSkillGenerators(skills) {
  const errors = [];

  for (const skill of skills) {
    if (!(await hasOverlay(skill.name))) continue;
    try {
      await resolveGeneratorsForSkill(skill.name);
    } catch (err) {
      errors.push({ type: 'overlay', message: err.message, skill: skill.name });
    }
  }

  return errors;
}
