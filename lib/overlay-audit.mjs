import { execSync } from 'node:child_process';
import { ROOT, loadSkills, findSkillByName } from './index.mjs';
import { getLockEntry, isOverlayRoutePending, getOverlayRoute } from './locks.mjs';
import { resolveGeneratorsForSkill } from './overlay-yaml.mjs';
import { hasOverlay, hashOverlay, hashUniversalOverlay } from './overlay-model.mjs';
import { getGitSkillPrefix } from './skill-paths.mjs';

export function isBlendedRefValid(blendedRef, skill) {
  if (!blendedRef) return false;
  const gitPath = `${getGitSkillPrefix(skill)}/SKILL.md`;
  try {
    execSync(`git cat-file -e ${blendedRef}:${gitPath.replace(/'/g, "'\\''")}`, {
      cwd: ROOT,
      stdio: 'pipe',
    });
    return true;
  } catch {
    return false;
  }
}

export async function getCurrentOverlayHashes(skillName, { hashProvider } = {}) {
  if (hashProvider) {
    return hashProvider(skillName);
  }

  const hasPerSkillOverlay = await hasOverlay(skillName);
  const generators = await resolveGeneratorsForSkill(skillName);
  const hasGenerators = generators.length > 0;

  return {
    hasPerSkillOverlay,
    hasGenerators,
    overlayHash: hasPerSkillOverlay ? await hashOverlay(skillName) : null,
    universalOverlayHash: hasGenerators ? await hashUniversalOverlay() : null,
  };
}

export async function auditSkill(skillName, deps = {}) {
  const lockLookup = deps.lockLookup ?? getLockEntry;
  const hashProvider = deps.hashProvider ?? null;
  const blendedRefValidator = deps.blendedRefValidator ?? isBlendedRefValid;

  const skills = await loadSkills();
  const skill = findSkillByName(skills, skillName);
  if (!skill) {
    throw new Error(`Skill "${skillName}" not found in skills.json`);
  }

  const lock = await lockLookup(skillName);
  const hashes = await getCurrentOverlayHashes(skillName, { hashProvider });

  if (!hashes.hasPerSkillOverlay && !hashes.hasGenerators) {
    return {
      skill: skillName,
      route: 'none',
      upstream_changed: false,
      overlay_changed: false,
      reason: 'no overlay or generators',
      blended_ref: lock?.blended_ref ?? null,
      ...hashes,
    };
  }

  const blendedRefValid = blendedRefValidator(lock?.blended_ref, skill);
  const routeInfo = getOverlayRoute(lock, hashes, {
    hasPerSkillOverlay: hashes.hasPerSkillOverlay,
    hasGenerators: hashes.hasGenerators,
    blendedRefValid,
  });

  return {
    skill: skillName,
    category: skill.category,
    git_skill_path: getGitSkillPrefix(skill),
    blended_ref: lock?.blended_ref ?? null,
    applied_upstream_sha: lock?.applied_upstream_sha ?? null,
    current_upstream_sha: lock?.sha ?? null,
    ...hashes,
    ...routeInfo,
  };
}

export async function auditAllSkills({ skillName = null, deps = {} } = {}) {
  if (skillName) {
    return [await auditSkill(skillName, deps)];
  }

  const skills = await loadSkills();
  const results = [];

  for (const skill of skills) {
    if (!skill.source) continue;
    const hashes = await getCurrentOverlayHashes(skill.name, {
      hashProvider: deps.hashProvider,
    });
    if (hashes.hasPerSkillOverlay || hashes.hasGenerators) {
      results.push(await auditSkill(skill.name, deps));
    }
  }

  return results;
}

export async function listPendingOverlaySkills(deps = {}) {
  const audits = await auditAllSkills({ deps });
  return audits
    .filter((a) => isOverlayRoutePending(a.route))
    .filter((a) => a.hasPerSkillOverlay || a.hasGenerators)
    .map((a) => a.skill);
}

export async function isPendingApply(skillName, deps = {}) {
  const audit = await auditSkill(skillName, deps);
  return isOverlayRoutePending(audit.route);
}

