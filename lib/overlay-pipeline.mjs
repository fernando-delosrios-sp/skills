/**
 * Overlay pipeline — deep public interface for overlay lifecycle operations.
 *
 * Operation groups:
 *   audit   — route determination, hash comparison, blended-ref validation
 *   restore — git checkout of unchanged blended inputs
 *   static  — add/replace/remove file payloads from overlay files/
 *   prepare — remerge and generator apply manifests in .tmp/overlay-apply/
 *   extract — draft OVERLAY.yaml from local diffs
 *
 * Internal submodules (not exported here):
 *   overlay-yaml, overlay-model, overlay-audit, overlay-static, overlay-manifest, overlay-extract
 */
import { readdir, access } from 'node:fs/promises';
import { runGit, assertSafeGitRef } from './git-exec.mjs';
import { resolve } from 'node:path';
import kleur from 'kleur';
import { ROOT, loadSkills, findSkillByName } from './index.mjs';
import { recordBlend } from './locks.mjs';
import {
  discoverOverlays,
  loadOverlay,
  partitionChanges,
  hasOverlay,
} from './overlay-model.mjs';
import {
  auditSkill,
  auditAllSkills,
  isBlendedRefValid,
  getCurrentOverlayHashes,
  listPendingOverlaySkills,
  isPendingApply,
} from './overlay-audit.mjs';
import { getGitSkillPrefix } from './skill-paths.mjs';
import { applyStaticOverlay, applyStaticOverlays } from './overlay-static.mjs';
import {
  prepareOverlayManifest,
  prepareGeneratorManifest,
  prepareAllGeneratorManifests,
  prepareOverlays,
} from './overlay-manifest.mjs';
import { extractOverlay, extractAllOverlays } from './overlay-extract.mjs';

export function printOverlayApplyPrompt({ skillNames = [] } = {}) {
  const prompt =
    skillNames.length === 1
      ? `update-skills apply ${skillNames[0]}`
      : 'update-skills apply pending';

  console.log('');
  console.log(kleur.bold(kleur.yellow('Next in Cursor:')));
  console.log(kleur.bold(kleur.cyan(`  "${prompt}"`)));
  if (skillNames.length > 1) {
    console.log(
      kleur.dim(`  ${skillNames.length} remerge manifests in .tmp/overlay-apply/`)
    );
  }
}

function defaultCheckout(gitPrefix, blendedRef) {
  assertSafeGitRef(blendedRef);
  runGit(['checkout', blendedRef, '--', gitPrefix], { cwd: ROOT, encoding: 'buffer' });
}

export async function restoreSkill(
  skillName,
  { dryRun = false, auditFn, checkoutFn, recordBlendFn, auditDeps } = {}
) {
  const runAudit = auditFn ?? auditSkill;
  const runCheckout = checkoutFn ?? defaultCheckout;
  const runRecordBlend = recordBlendFn ?? recordBlend;

  const audit = await runAudit(skillName, auditDeps);

  if (audit.route !== 'restore') {
    return {
      skill: skillName,
      status: 'skipped',
      reason: `route is ${audit.route}, not restore (${audit.reason})`,
      audit,
    };
  }

  const skills = await loadSkills();
  const skill = findSkillByName(skills, skillName);
  const gitPrefix = getGitSkillPrefix(skill);

  if (!dryRun) {
    try {
      runCheckout(gitPrefix, audit.blended_ref);
    } catch (err) {
      return {
        skill: skillName,
        status: 'error',
        reason: `git checkout failed: ${err.message}`,
        audit,
      };
    }

    await runRecordBlend(skillName, {
      blendedRef: audit.blended_ref,
      overlayHash: audit.overlayHash,
      universalOverlayHash: audit.universalOverlayHash,
      appliedUpstreamSha: audit.current_upstream_sha,
    });
  }

  return {
    skill: skillName,
    status: dryRun ? 'dry_run' : 'restored',
    blended_ref: audit.blended_ref,
    audit,
  };
}

export async function restoreAllSkills({
  skillName = null,
  dryRun = false,
  auditFn,
  checkoutFn,
  recordBlendFn,
  auditDeps,
} = {}) {
  const audits = await auditAllSkills({ skillName, deps: auditDeps });
  const results = [];
  const restoreOpts = { dryRun, auditFn, checkoutFn, recordBlendFn, auditDeps };

  for (const audit of audits) {
    if (audit.route !== 'restore') {
      results.push({
        skill: audit.skill,
        status: 'skipped',
        reason: `route is ${audit.route}`,
        audit,
      });
      continue;
    }
    results.push(await restoreSkill(audit.skill, restoreOpts));
  }

  return results;
}

export async function validateOverlays(skills) {
  const errors = [];
  const warnings = [];
  const skillNames = new Set(skills.map((s) => s.name));
  const overlayNames = await discoverOverlays();
  const overlaySet = new Set(overlayNames);

  for (const name of overlayNames) {
    if (!skillNames.has(name)) {
      errors.push({
        type: 'overlay',
        message: `Overlay "${name}" has no matching skill in skills.json`,
      });
      continue;
    }

    let overlay;
    try {
      overlay = await loadOverlay(name);
    } catch (err) {
      errors.push({ type: 'overlay', message: err.message });
      continue;
    }

    const { staticOps, semantic } = partitionChanges(overlay.changes);

    for (const op of staticOps) {
      if ((op.action === 'add' || op.action === 'replace') && op.from) {
        const sourcePath = resolve(overlay._dir, op.from);
        try {
          await access(sourcePath);
        } catch {
          errors.push({
            type: 'overlay',
            message: `Overlay "${name}": static source not found: ${op.from}`,
          });
        }
      }
      if (!['add', 'remove', 'replace'].includes(op.action)) {
        errors.push({
          type: 'overlay',
          message: `Overlay "${name}": unknown action "${op.action}"`,
        });
      }
    }

    const hasChanges = semantic.length > 0 || staticOps.length > 0;
    const hasGeneratorOverrides =
      overlay.generators?.disable?.length || overlay.generators?.add?.length;

    if (!hasChanges && !overlay.generators) {
      warnings.push({
        type: 'overlay',
        message: `Overlay "${name}" has no changes or generators defined`,
      });
    } else if (!hasChanges && overlay.generators && !hasGeneratorOverrides) {
      warnings.push({
        type: 'overlay',
        message: `Overlay "${name}" has empty generators overrides and no changes`,
      });
    }
  }

  const overlaysRoot = resolve(ROOT, 'overlays');
  try {
    const entries = await readdir(overlaysRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
      if (!overlaySet.has(entry.name)) {
        try {
          await access(resolve(overlaysRoot, entry.name, 'OVERLAY.yaml'));
        } catch {
          warnings.push({
            type: 'overlay',
            message: `Orphan overlay directory without OVERLAY.yaml: overlays/${entry.name}/`,
          });
        }
      }
    }
  } catch {}

  return { errors, warnings };
}

export {
  hasOverlay,
  discoverOverlays,
  auditSkill,
  auditAllSkills,
  isBlendedRefValid,
  getCurrentOverlayHashes,
  listPendingOverlaySkills,
  isPendingApply,
  applyStaticOverlay,
  applyStaticOverlays,
  prepareOverlayManifest,
  prepareGeneratorManifest,
  prepareAllGeneratorManifests,
  prepareOverlays,
  extractOverlay,
  extractAllOverlays,
  getGitSkillPrefix,
};



