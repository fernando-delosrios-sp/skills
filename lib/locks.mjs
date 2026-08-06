import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const LOCKS_PATH = resolve(ROOT, '.locks', 'upstream.json');

export function getLocksPath() {
  return LOCKS_PATH;
}

export async function loadLocks() {
  try {
    const raw = await readFile(LOCKS_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function saveLocks(locks) {
  await mkdir(dirname(LOCKS_PATH), { recursive: true });
  await writeFile(LOCKS_PATH, JSON.stringify(locks, null, 2) + '\n', 'utf8');
}

export async function getLockEntry(skillName) {
  const locks = await loadLocks();
  return locks[skillName] ?? null;
}

export async function updateLockEntry(skillName, patch) {
  const locks = await loadLocks();
  locks[skillName] = { ...(locks[skillName] ?? {}), ...patch };
  await saveLocks(locks);
  return locks[skillName];
}

export function isOverlayPending(lockEntry) {
  if (!lockEntry?.synced_at) return false;
  if (!lockEntry.overlay_applied_at) return true;
  return new Date(lockEntry.overlay_applied_at) < new Date(lockEntry.synced_at);
}
