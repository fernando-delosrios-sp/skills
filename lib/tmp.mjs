import { rm, readdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadLocks, isOverlayPending } from './locks.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

export const TMP_DIR = resolve(ROOT, '.tmp');
export const OVERLAY_APPLY_DIR = resolve(TMP_DIR, 'overlay-apply');

const RESERVED_DIRS = new Set(['overlay-apply']);

export function repoCloneDirName(repo) {
  return repo.replace('/', '_');
}

export function extractCloneDirName(repo) {
  return `extract_${repo.replace('/', '_')}`;
}

async function removePath(path) {
  try {
    await rm(path, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}

export async function cleanRepoClone(repo) {
  if (await removePath(resolve(TMP_DIR, repoCloneDirName(repo)))) {
    return repoCloneDirName(repo);
  }
  return null;
}

export async function cleanExtractClone(repo) {
  if (await removePath(resolve(TMP_DIR, extractCloneDirName(repo)))) {
    return extractCloneDirName(repo);
  }
  return null;
}

function isRepoCloneDir(name) {
  if (RESERVED_DIRS.has(name)) return false;
  return /^[A-Za-z0-9.-]+_[A-Za-z0-9.-]+(?:_[A-Za-z0-9.-]+)*$/.test(name);
}

function isExtractCloneDir(name) {
  if (!name.startsWith('extract_')) return false;
  return isRepoCloneDir(name.slice('extract_'.length));
}

export async function cleanCloneCaches({ extract = true } = {}) {
  const removed = [];
  let entries;
  try {
    entries = await readdir(TMP_DIR, { withFileTypes: true });
  } catch {
    return removed;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const { name } = entry;
    const isClone = isRepoCloneDir(name) || (extract && isExtractCloneDir(name));
    if (isClone && (await removePath(resolve(TMP_DIR, name)))) {
      removed.push(name);
    }
  }

  return removed;
}

export async function cleanOverlayManifest(skillName) {
  const path = resolve(OVERLAY_APPLY_DIR, `${skillName}.md`);
  if (await removePath(path)) return skillName;
  return null;
}

export async function cleanOverlayManifests({ appliedOnly = true } = {}) {
  const removed = [];
  let entries;
  try {
    entries = await readdir(OVERLAY_APPLY_DIR, { withFileTypes: true });
  } catch {
    return removed;
  }

  const locks = appliedOnly ? await loadLocks() : null;

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
    const skillName = entry.name.replace(/\.md$/, '');
    if (appliedOnly && isOverlayPending(locks[skillName])) continue;
    if (await removePath(resolve(OVERLAY_APPLY_DIR, entry.name))) {
      removed.push(skillName);
    }
  }

  return removed;
}

export async function cleanTmp({
  clones = true,
  manifests = false,
  appliedManifestsOnly = true,
  skill = null,
  all = false,
} = {}) {
  if (all) {
    const removedAll = (await removePath(TMP_DIR)) ? ['.tmp/'] : [];
    return { clones: removedAll, manifests: [] };
  }

  if (skill && manifests) {
    const removed = await cleanOverlayManifest(skill);
    return { clones: [], manifests: removed ? [removed] : [] };
  }

  const cloneRemoved = clones ? await cleanCloneCaches() : [];
  const manifestRemoved = manifests
    ? await cleanOverlayManifests({ appliedOnly: appliedManifestsOnly })
    : [];

  return { clones: cloneRemoved, manifests: manifestRemoved };
}
