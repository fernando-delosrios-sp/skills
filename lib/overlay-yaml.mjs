import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parse, stringify } from 'yaml';
import { ROOT } from './index.mjs';
import { getOverlayDir } from './skill-paths.mjs';
import { parseFrontmatter } from './skill-md.mjs';

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

export function validatePerSkillGenerators(generators, skillName) {
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

export async function loadOverlay(skillName) {
  const overlayDir = getOverlayDir(skillName);
  const overlayFile = resolve(overlayDir, 'OVERLAY.yaml');
  const raw = await readFile(overlayFile, 'utf8');
  const doc = parse(raw);
  if (!doc || typeof doc !== 'object') {
    throw new Error(`Invalid OVERLAY.yaml for ${skillName}`);
  }
  if (doc.skill !== skillName) {
    throw new Error(
      `OVERLAY.yaml skill "${doc.skill}" does not match directory "${skillName}"`
    );
  }
  if (doc.changes !== undefined && !Array.isArray(doc.changes)) {
    throw new Error(`OVERLAY.yaml for ${skillName}: "changes" must be an array when present`);
  }
  if (doc.generators !== undefined && typeof doc.generators !== 'object') {
    throw new Error(`OVERLAY.yaml for ${skillName}: "generators" must be an object when present`);
  }
  return { ...doc, changes: doc.changes ?? [], _dir: overlayDir };
}

export function partitionChanges(changes) {
  const semantic = [];
  const staticOps = [];
  for (const change of changes) {
    if (change.action) {
      staticOps.push(change);
    } else if (change.file && change.instructions) {
      semantic.push(change);
    } else {
      throw new Error(
        'Each change must be semantic { file, instructions } or static { action, file }'
      );
    }
  }
  return { semantic, staticOps };
}

export async function hasOverlay(skillName) {
  try {
    await access(resolve(getOverlayDir(skillName), 'OVERLAY.yaml'));
    return true;
  } catch {
    return false;
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

function titleCaseFromSkillName(name) {
  return name
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function firstSentence(text, maxLen = 72) {
  const trimmed = String(text ?? '').trim();
  if (!trimmed) return '';
  const match = trimmed.match(/^[^.!?]+(?:[.!?]|$)/);
  const sentence = (match ? match[0] : trimmed).trim();
  if (sentence.length <= maxLen) return sentence;
  return sentence.slice(0, maxLen).trimEnd();
}

function deriveOpenAiManifest(skill, frontmatter) {
  const doc = {
    interface: {
      display_name: titleCaseFromSkillName(skill.name),
      short_description: firstSentence(frontmatter.description),
    },
  };

  if (frontmatter['disable-model-invocation'] === true) {
    doc.policy = { allow_implicit_invocation: false };
  }

  return `${stringify(doc).trimEnd()}\n`;
}

export async function expectedContentForPath(skill, relPath, { skillDir } = {}) {
  if (!skill?.name || relPath !== 'agents/openai.yaml') {
    return null;
  }

  const generators = await resolveGeneratorsForSkill(skill.name);
  const openaiGen = generators.find((g) => g.id === 'openai-manifest' && g.file === relPath);
  if (!openaiGen) {
    return null;
  }

  const dir = skillDir ?? resolve(ROOT, 'skills', skill.category, skill.name);
  let skillMd;
  try {
    skillMd = await readFile(resolve(dir, 'SKILL.md'), 'utf8');
  } catch {
    return null;
  }

  const frontmatter = parseFrontmatter(skillMd);
  if (!frontmatter?.description) {
    return null;
  }

  return deriveOpenAiManifest(skill, frontmatter);
}

