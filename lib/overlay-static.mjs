import { mkdir, rm, cp, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { loadSkills, findSkillByName, getSkillDir } from './index.mjs';
import {
  loadOverlay,
  partitionChanges,
  hasOverlay,
  discoverOverlays,
} from './overlay-model.mjs';

export async function applyStaticOverlay(
  skillName,
  {
    dryRun = false,
    loadOverlayFn = loadOverlay,
    findSkillFn,
    getSkillDirFn = getSkillDir,
  } = {}
) {
  const overlay = await loadOverlayFn(skillName);
  const skill = findSkillFn
    ? await findSkillFn(skillName)
    : findSkillByName(await loadSkills(), skillName);
  if (!skill) {
    throw new Error(`Skill "${skillName}" not found in skills.json`);
  }

  const { staticOps } = partitionChanges(overlay.changes);
  const skillDir = getSkillDirFn(skill);
  const applied = [];

  for (const op of staticOps) {
    const targetPath = resolve(skillDir, op.file);
    if (op.action === 'add' || op.action === 'replace') {
      if (!op.from) {
        throw new Error(`Static ${op.action} for ${op.file} requires "from"`);
      }
      const sourcePath = resolve(overlay._dir, op.from);
      try {
        await access(sourcePath);
      } catch {
        throw new Error(`Static source not found: ${op.from} (overlay ${skillName})`);
      }
      if (!dryRun) {
        await mkdir(dirname(targetPath), { recursive: true });
        await cp(sourcePath, targetPath);
      }
      applied.push({ action: op.action, file: op.file, from: op.from });
    } else if (op.action === 'remove') {
      if (!dryRun) {
        await rm(targetPath, { force: true });
      }
      applied.push({ action: 'remove', file: op.file });
    } else {
      throw new Error(`Unknown static action: ${op.action}`);
    }
  }

  const { semantic } = partitionChanges(overlay.changes);
  return { applied, hasSemantic: semantic.length > 0, semanticCount: semantic.length };
}

export async function applyStaticOverlays({
  skillName = null,
  dryRun = false,
} = {}) {
  let targets;
  if (skillName) {
    targets = (await hasOverlay(skillName)) ? [skillName] : [];
  } else {
    targets = await discoverOverlays();
  }

  const results = [];

  for (const name of targets) {
    const result = await applyStaticOverlay(name, { dryRun });
    results.push({ skill: name, ...result });
  }

  return results;
}
