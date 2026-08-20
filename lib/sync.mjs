import { access, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { loadSkills, getSkillDir } from './index.mjs';
import { loadLocks, saveLocks } from './locks.mjs';
import { hasOverlay, printOverlayApplyPrompt, isPendingApply } from './overlay-pipeline.mjs';
import { cloneRepo, readSkillTree, getHeadSha } from './upstream-adapter.mjs';
import { TMP_DIR, cleanRepoClone } from './tmp.mjs';
import kleur from 'kleur';

async function writeUpstreamToLocal(localSkillDir, upstreamFiles) {
  const upstreamRelPaths = new Set();

  for (const f of upstreamFiles) {
    upstreamRelPaths.add(f.relPath);
    const localPath = resolve(localSkillDir, f.relPath);
    await mkdir(dirname(localPath), { recursive: true });
    await writeFile(localPath, f.content, 'utf8');
  }

  // Remove local files not present upstream
  let localEntries;
  try {
    localEntries = await readdir(localSkillDir, { withFileTypes: true });
  } catch {
    return;
  }

  async function removeExtras(dir, relPrefix = '') {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const relPath = relPrefix ? `${relPrefix}/${entry.name}` : entry.name;
      const fullPath = resolve(dir, entry.name);
      if (entry.isDirectory()) {
        await removeExtras(fullPath, relPath);
        try {
          const remaining = await readdir(fullPath);
          if (remaining.length === 0) {
            await rm(fullPath, { recursive: true });
          }
        } catch {}
      } else if (!upstreamRelPaths.has(relPath)) {
        await rm(fullPath, { force: true });
      }
    }
  }

  await removeExtras(localSkillDir);
}

export async function syncSkill(skill, locks) {
  if (!skill.source) {
    return { skill: skill.name, status: 'skipped', reason: 'no source (local skill)' };
  }

  const tmpDir = resolve(TMP_DIR, skill.source.repo.replace('/', '_'));

  try {
    await rm(tmpDir, { recursive: true, force: true });
    await mkdir(TMP_DIR, { recursive: true });

    try {
      await cloneRepo(skill.source.repo, tmpDir);
    } catch (err) {
      return {
        skill: skill.name,
        status: 'error',
        reason: `Failed to clone ${skill.source.repo}: ${err.message}`,
      };
    }

    const upstreamSha = getHeadSha(tmpDir);
    const upstreamSkillDir = resolve(tmpDir, skill.source.path);
    const localSkillDir = getSkillDir(skill);
    const existingLock = locks[skill.name];

    let upstreamExists = true;
    try {
      await access(resolve(upstreamSkillDir, 'SKILL.md'));
    } catch {
      upstreamExists = false;
    }

    if (!upstreamExists) {
      return {
        skill: skill.name,
        status: 'alert',
        reason: `Upstream skill deleted: ${skill.source.repo}/${skill.source.path}`,
      };
    }

    if (existingLock?.sha === upstreamSha) {
      const pending = await isPendingApply(skill.name);
      return {
        skill: skill.name,
        status: 'unchanged',
        overlayPending: pending,
      };
    }

    const upstreamFiles = await readSkillTree(tmpDir, { skillPath: skill.source.path });
    const syncedAt = new Date().toISOString();

    return {
      skill: skill.name,
      status: 'pending_update',
      upstreamSha,
      upstreamSkillDir,
      localSkillDir,
      upstreamFiles,
      syncedAt,
      hasOverlay: await hasOverlay(skill.name),
      source: skill.source,
    };
  } finally {
    await cleanRepoClone(skill.source.repo);
  }
}

export async function applySyncResult(result, locks) {
  if (result.status !== 'pending_update') return result;

  await writeUpstreamToLocal(result.localSkillDir, result.upstreamFiles);

  locks[result.skill] = {
    ...(locks[result.skill] ?? {}),
    repo: result.source?.repo ?? locks[result.skill]?.repo ?? null,
    path: result.source?.path ?? locks[result.skill]?.path ?? null,
    sha: result.upstreamSha,
    synced_at: result.syncedAt,
    overlay_applied_at: result.hasOverlay ? null : result.syncedAt,
  };

  const status = result.hasOverlay ? 'updated' : 'updated_clean';
  return {
    skill: result.skill,
    status,
    overlayPending: result.hasOverlay,
    upstreamSha: result.upstreamSha,
  };
}

export async function syncAllSkills({ dryRun = false } = {}) {
  const skills = await loadSkills();
  const locks = await loadLocks();
  const results = [];

  for (const skill of skills) {
    console.log(kleur.dim(`Checking ${skill.name}...`));
    const result = await syncSkill(skill, locks);

    if (result.status === 'pending_update' && !dryRun) {
      const applied = await applySyncResult(result, locks);
      results.push(applied);
    } else if (result.status === 'pending_update' && dryRun) {
      results.push({
        skill: result.skill,
        status: result.hasOverlay ? 'updated' : 'updated_clean',
        overlayPending: result.hasOverlay,
        upstreamSha: result.upstreamSha,
        dryRun: true,
      });
    } else {
      results.push(result);
    }
  }

  if (!dryRun) {
    await saveLocks(locks);
  }

  return results;
}

export function printSyncSummary(results) {
  const unchanged = results.filter((r) => r.status === 'unchanged');
  const updated = results.filter((r) => r.status === 'updated');
  const updatedClean = results.filter((r) => r.status === 'updated_clean');
  const skipped = results.filter((r) => r.status === 'skipped');
  const alerts = results.filter((r) => r.status === 'alert');
  const errors = results.filter((r) => r.status === 'error');

  const overlayPending = results.filter(
    (r) => r.overlayPending || (r.status === 'unchanged' && r.overlayPending)
  );

  console.log();
  console.log(kleur.bold('Summary:'));
  console.log(kleur.dim(`  Total skills checked: ${results.length}`));
  console.log(kleur.green(`  Unchanged: ${unchanged.length}`));
  console.log(kleur.yellow(`  Updated (overlay pending): ${updated.length}`));
  console.log(kleur.green(`  Updated (clean): ${updatedClean.length}`));
  console.log(kleur.dim(`  Skipped (local): ${skipped.length}`));
  console.log(kleur.red(`  Alerts: ${alerts.length}`));
  console.log(kleur.red(`  Errors: ${errors.length}`));

  for (const alert of alerts) {
    console.log(kleur.yellow(`  ⚠ ${alert.skill}: ${alert.reason}`));
  }
  for (const error of errors) {
    console.log(kleur.red(`  ✗ ${error.skill}: ${error.reason}`));
  }

  if (overlayPending.length > 0) {
    console.log(kleur.yellow('\nOverlays pending apply:'));
    for (const r of overlayPending) {
      console.log(kleur.yellow(`  - ${r.skill}`));
    }
    console.log(kleur.dim('\nNext: npm run update -- --skip-sync  (or npm run overlay -- static && npm run overlay -- prepare)'));
    printOverlayApplyPrompt({ skillNames: overlayPending.map((result) => result.skill) });
  }

  return { overlayPending };
}
