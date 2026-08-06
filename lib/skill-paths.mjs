/**
 * Skill path resolution — pure helpers for on-disk and git-relative skill locations.
 *
 * Resolves four path values for a skill record:
 *   canonicalDir — skills/<category>/<name>/ (sync/install source of truth)
 *   agentsDir    — .agents/skills/<name>/ (flat dev working copy)
 *   overlayDir   — overlays/<name>/ (customization intent + static payloads)
 *   gitPrefix    — skills/<category>/<name> (repo-relative, forward slashes)
 *
 * No filesystem I/O, git operations, or manifest loading.
 */
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(__dirname, '..');
export const SKILLS_ROOT = resolve(ROOT, 'skills');

export function resolveSkillPaths(skill) {
  const canonicalDir = resolve(SKILLS_ROOT, skill.category, skill.name);
  const agentsDir = resolve(ROOT, '.agents', 'skills', skill.name);
  const overlayDir = resolve(ROOT, 'overlays', skill.name);
  const gitPrefix = `skills/${skill.category}/${skill.name}`;

  return { canonicalDir, agentsDir, overlayDir, gitPrefix };
}

export function getCanonicalDir(skill) {
  return resolveSkillPaths(skill).canonicalDir;
}

export function getAgentsDir(skill) {
  return resolveSkillPaths(skill).agentsDir;
}

export function getOverlayDir(skillName) {
  return resolve(ROOT, 'overlays', skillName);
}

export function getGitSkillPrefix(skill) {
  return resolveSkillPaths(skill).gitPrefix;
}
