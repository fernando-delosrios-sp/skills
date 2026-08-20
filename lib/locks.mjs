import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const LOCKS_PATH = resolve(ROOT, '.locks', 'upstream.json');

export function getLocksPath() {
  return LOCKS_PATH;
}

/**
 * Parse Upstream lock JSON. Throws on invalid JSON or a non-object root.
 * `path` is named in the error only — never include file contents.
 */
export function parseLocksJson(raw, path = LOCKS_PATH) {
  let value;
  try {
    value = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Invalid JSON in ${path}: ${err.message}`);
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Invalid JSON in ${path}: expected a non-null object`);
  }
  return value;
}

/**
 * Load Upstream lock from an explicit path (tests: missing file under mkdtemp).
 */
export async function loadLocksFromPath(path) {
  let raw;
  try {
    raw = await readFile(path, 'utf8');
  } catch (err) {
    if (err && err.code === 'ENOENT') return {};
    throw err;
  }
  return parseLocksJson(raw, path);
}

export async function loadLocks() {
  return loadLocksFromPath(LOCKS_PATH);
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

/**
 * Resolve applied upstream SHA with migration for locks missing the field.
 */
export function resolveAppliedUpstreamSha(lockEntry) {
  if (!lockEntry) return null;
  if (lockEntry.applied_upstream_sha) return lockEntry.applied_upstream_sha;
  if (
    lockEntry.overlay_applied_at &&
    lockEntry.synced_at &&
    lockEntry.overlay_applied_at === lockEntry.synced_at &&
    lockEntry.sha
  ) {
    return lockEntry.sha;
  }
  return null;
}

/**
 * Determine overlay routing: restore | remerge | fresh | none
 */
export function getOverlayRoute(
  lockEntry,
  currentHashes,
  { hasPerSkillOverlay = false, hasGenerators = false, blendedRefValid = false } = {}
) {
  if (!lockEntry?.synced_at) {
    return {
      route: 'none',
      upstream_changed: false,
      overlay_changed: false,
      reason: 'not synced',
    };
  }

  if (!hasPerSkillOverlay && !hasGenerators) {
    return {
      route: 'none',
      upstream_changed: false,
      overlay_changed: false,
      reason: 'no overlay or generators',
    };
  }

  const { overlayHash, universalOverlayHash } = currentHashes;
  const appliedUpstreamSha = resolveAppliedUpstreamSha(lockEntry);
  const upstreamChanged = !appliedUpstreamSha || appliedUpstreamSha !== lockEntry.sha;

  let overlayChanged = false;
  const overlayReasons = [];

  if (hasPerSkillOverlay) {
    if (!lockEntry.overlay_hash || !overlayHash) {
      overlayChanged = true;
      overlayReasons.push('per-skill overlay hash missing');
    } else if (lockEntry.overlay_hash !== overlayHash) {
      overlayChanged = true;
      overlayReasons.push('per-skill overlay changed');
    }
  }

  if (hasGenerators) {
    if (!lockEntry.universal_overlay_hash || !universalOverlayHash) {
      overlayChanged = true;
      overlayReasons.push('universal overlay hash missing');
    } else if (lockEntry.universal_overlay_hash !== universalOverlayHash) {
      overlayChanged = true;
      overlayReasons.push('universal overlay changed');
    }
  }

  const missingBlendMetadata =
    !lockEntry.blended_ref ||
    (hasPerSkillOverlay && !lockEntry.overlay_hash) ||
    (hasGenerators && !lockEntry.universal_overlay_hash);

  if (!lockEntry.overlay_applied_at) {
    return {
      route: 'fresh',
      upstream_changed: upstreamChanged,
      overlay_changed: overlayChanged,
      reason: 'never applied',
      blended_ref: lockEntry.blended_ref ?? null,
    };
  }

  if (missingBlendMetadata) {
    return {
      route: 'remerge',
      upstream_changed: upstreamChanged,
      overlay_changed: overlayChanged,
      reason: 'missing blend metadata (migration)',
      blended_ref: lockEntry.blended_ref ?? null,
    };
  }

  if (!upstreamChanged && !overlayChanged) {
    if (!blendedRefValid) {
      return {
        route: 'remerge',
        upstream_changed: false,
        overlay_changed: false,
        reason: 'blended_ref missing or invalid in git',
        blended_ref: lockEntry.blended_ref ?? null,
      };
    }
    return {
      route: 'restore',
      upstream_changed: false,
      overlay_changed: false,
      reason: 'inputs unchanged',
      blended_ref: lockEntry.blended_ref,
    };
  }

  const reason =
    upstreamChanged && overlayChanged
      ? 'upstream and overlay changed'
      : upstreamChanged
        ? 'upstream changed'
        : overlayReasons.join('; ') || 'overlay changed';

  return {
    route: 'remerge',
    upstream_changed: upstreamChanged,
    overlay_changed: overlayChanged,
    reason,
    blended_ref: lockEntry.blended_ref ?? null,
  };
}

export function isOverlayRoutePending(route) {
  return route === 'remerge' || route === 'fresh';
}

export async function recordBlend(
  skillName,
  { blendedRef, overlayHash = null, universalOverlayHash, appliedUpstreamSha }
) {
  const patch = {
    applied_upstream_sha: appliedUpstreamSha,
    universal_overlay_hash: universalOverlayHash,
    overlay_applied_at: new Date().toISOString(),
    blended_ref: blendedRef,
  };
  if (overlayHash !== null) {
    patch.overlay_hash = overlayHash;
  }
  return updateLockEntry(skillName, patch);
}
