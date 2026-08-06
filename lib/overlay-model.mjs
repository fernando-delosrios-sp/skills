import { readFile, readdir, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, relative } from 'node:path';
import { ROOT } from './index.mjs';
import { getOverlayDir } from './skill-paths.mjs';
import { hasOverlay } from './overlay-yaml.mjs';

export { loadOverlay, partitionChanges, hasOverlay } from './overlay-yaml.mjs';

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

