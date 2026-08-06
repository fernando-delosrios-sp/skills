import { readFile, readdir, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, relative } from 'node:path';
import { parse } from 'yaml';
import { ROOT, getOverlayDir } from './index.mjs';

const UNIVERSAL_OVERLAY_PATH = resolve(ROOT, 'overlays', 'OVERLAY.yaml');

export async function discoverOverlays() {
  const overlaysRoot = resolve(ROOT, 'overlays');
  let entries;
  try {
    entries = await readdir(overlaysRoot, { withFileTypes: true });
  } catch {
    return [];
  }

  const overlays = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
    const overlayFile = resolve(overlaysRoot, entry.name, 'OVERLAY.yaml');
    try {
      await access(overlayFile);
      overlays.push(entry.name);
    } catch {}
  }
  return overlays;
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

function hashEntries(entries) {
  const hash = createHash('sha256');
  for (const { relPath, content } of [...entries].sort((a, b) =>
    a.relPath.localeCompare(b.relPath)
  )) {
    hash.update(relPath);
    hash.update('\0');
    hash.update(content);
    hash.update('\0');
  }
  return hash.digest('hex');
}

async function collectFiles(dir, baseDir = dir) {
  const result = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === '.git') continue;
    const fullPath = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...(await collectFiles(fullPath, baseDir)));
    } else {
      const content = await readFile(fullPath, 'utf8');
      result.push({ relPath: relative(baseDir, fullPath), content });
    }
  }
  return result;
}

export async function hashOverlay(skillName) {
  if (!(await hasOverlay(skillName))) return null;

  const overlayDir = getOverlayDir(skillName);
  const entries = [
    {
      relPath: 'OVERLAY.yaml',
      content: await readFile(resolve(overlayDir, 'OVERLAY.yaml'), 'utf8'),
    },
  ];

  const filesDir = resolve(overlayDir, 'files');
  try {
    await access(filesDir);
    entries.push(...(await collectFiles(filesDir, filesDir)));
  } catch {}

  return hashEntries(entries);
}

export async function hashUniversalOverlay() {
  const content = await readFile(UNIVERSAL_OVERLAY_PATH, 'utf8');
  return createHash('sha256').update(content).digest('hex');
}
