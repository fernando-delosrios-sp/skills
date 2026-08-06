import { readFile, writeFile, readdir, mkdir, access } from 'node:fs/promises';
import { resolve, relative, dirname, join } from 'node:path';
import { execSync } from 'node:child_process';
import { stringify } from 'yaml';
import { ROOT, loadSkills, findSkillByName, getSkillDir, getOverlayDir } from './index.mjs';
import {
  hasOverlay,
  isGeneratedPathForSkill,
  expectedContentForPath,
} from './overlay-yaml.mjs';
import { cloneRepo, readSkillTree } from './upstream-adapter.mjs';
import { TMP_DIR, cleanExtractClone } from './tmp.mjs';

function summarizeDiff(upstreamFiles, localFiles) {
  const upMap = new Map(upstreamFiles.map((f) => [f.relPath, f.content]));
  const localMap = new Map(localFiles.map((f) => [f.relPath, f.content]));
  const changes = [];

  for (const [path, content] of upMap) {
    if (!localMap.has(path)) {
      changes.push({ type: 'upstream_only', file: path, content });
    } else if (localMap.get(path) !== content) {
      changes.push({ type: 'modify', file: path, upstream: content, local: localMap.get(path) });
    }
  }

  for (const [path, content] of localMap) {
    if (!upMap.has(path)) {
      changes.push({ type: 'local_only', file: path, content });
    }
  }

  return changes;
}

function gitShow(ref, path) {
  try {
    return execSync(`git show ${ref}:${path.replace(/'/g, "'\\''")}`, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch {
    return null;
  }
}

function gitLsTree(ref, prefix) {
  try {
    return execSync(`git ls-tree -r ${ref} --name-only ${prefix}`, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    })
      .trim()
      .split('\n')
      .filter(Boolean);
  } catch {
    return [];
  }
}

async function collectFilesFromGitRef(gitPrefix, ref = 'HEAD') {
  const files = [];
  for (const rel of gitLsTree(ref, gitPrefix)) {
    const content = gitShow(ref, rel);
    if (content !== null) {
      files.push({ relPath: relative(gitPrefix, rel), content });
    }
  }
  return files;
}

async function shouldSkipLocalOnlyFile(change, upstreamFiles, skillName) {
  if (!(await isGeneratedPathForSkill(skillName, change.file))) return false;
  return !upstreamFiles.some((f) => f.relPath === change.file);
}

export async function diffToOverlayChanges(
  diff,
  { upstreamFiles, skillName, localFiles, skill, skillDir: skillDirOverride } = {}
) {
  const overlayChanges = [];

  for (const change of diff) {
    if (change.type === 'local_only') {
      if (await shouldSkipLocalOnlyFile(change, upstreamFiles, skillName)) continue;
      overlayChanges.push({
        action: 'add',
        file: change.file,
        from: join('files', change.file),
        _content: change.content,
      });
    } else if (change.type === 'upstream_only') {
      if (await isGeneratedPathForSkill(skillName, change.file)) continue;
      overlayChanges.push({ action: 'remove', file: change.file });
    } else if (change.type === 'modify') {
      if (skill && (await isGeneratedPathForSkill(skillName, change.file))) {
        const skillDir = skillDirOverride ?? getSkillDir(skill);
        const derived = await expectedContentForPath(skill, change.file, { skillDir });
        if (derived !== null && derived.trim() === change.local.trim()) continue;
      }
      overlayChanges.push({
        file: change.file,
        instructions: draftInstructions(change),
      });
    }
  }

  return overlayChanges;
}

async function writeOverlayFromChanges(
  skillName,
  overlayChanges,
  { description, sourceLabel = 'local customizations' }
) {
  const overlayDir = getOverlayDir(skillName);
  const filesDir = resolve(overlayDir, 'files');
  await mkdir(overlayDir, { recursive: true });

  for (const change of overlayChanges) {
    if (change._content !== undefined) {
      const dest = resolve(filesDir, change.file);
      await mkdir(dirname(dest), { recursive: true });
      await writeFile(dest, change._content, 'utf8');
      delete change._content;
    }
  }

  const overlayDoc = {
    skill: skillName,
    description,
    changes: overlayChanges.map(({ _content, ...rest }) => rest),
  };

  await writeFile(
    resolve(overlayDir, 'OVERLAY.yaml'),
    stringify(overlayDoc, { lineWidth: 0 }),
    'utf8'
  );

  return { skill: skillName, overlayDir, changeCount: overlayChanges.length };
}

function draftInstructions(change) {
  if (change.type === 'local_only') {
    return `This file exists locally but not in upstream. Keep it via a static overlay add action instead of a semantic change.`;
  }
  if (change.type === 'upstream_only') {
    return `Remove this file from the skill tree (upstream includes it but local customization removes it).`;
  }

  const localLines = change.local.split('\n');
  const upstreamLines = change.upstream.split('\n');
  const hints = [];

  if (localLines[0]?.startsWith('---') && upstreamLines[0]?.startsWith('---')) {
    hints.push('- Review and adapt frontmatter differences.');
  }

  hints.push('- Express behavioral intent only — do not embed literal file content.');
  hints.push('- Merge local behavioral intent into the upstream file structure.');
  hints.push('- Preserve upstream sections not contradicted by local customizations.');

  const localAdded = localLines.filter((line) => !upstreamLines.includes(line)).slice(0, 8);
  const upstreamRemoved = upstreamLines.filter((line) => !localLines.includes(line)).slice(0, 8);

  if (localAdded.length > 0) {
    hints.push('', 'Lines added locally (summarize intent, do not copy verbatim):');
    for (const line of localAdded) {
      if (line.trim()) hints.push(`- ${line.trim().slice(0, 120)}`);
    }
  }

  if (upstreamRemoved.length > 0) {
    hints.push('', 'Upstream lines removed locally (summarize intent):');
    for (const line of upstreamRemoved) {
      if (line.trim()) hints.push(`- ${line.trim().slice(0, 120)}`);
    }
  }

  return hints.join('\n');
}

async function getUpstreamFiles(skill, cloneCache = new Map()) {
  const key = `${skill.source.repo}:${skill.source.path}`;
  if (cloneCache.has(key)) return cloneCache.get(key);

  const tmpDir = resolve(TMP_DIR, `extract_${skill.source.repo.replace('/', '_')}`);
  if (!cloneCache.has(`cloned:${skill.source.repo}`)) {
    try {
      execSync(`rm -rf "${tmpDir}"`, { stdio: 'pipe' });
    } catch {}
    await mkdir(TMP_DIR, { recursive: true });
    await cloneRepo(skill.source.repo, tmpDir);
    cloneCache.set(`cloned:${skill.source.repo}`, tmpDir);
  }

  const repoDir = cloneCache.get(`cloned:${skill.source.repo}`);
  const upstreamDir = resolve(repoDir, skill.source.path);

  try {
    await access(upstreamDir);
  } catch {
    throw new Error(`upstream path not found: ${skill.source.repo}/${skill.source.path}`);
  }

  const files = await readSkillTree(repoDir, { skillPath: skill.source.path });
  cloneCache.set(key, files);
  return files;
}

async function resolveLocalFiles(skill, { fromAgents = false, fromCommit = null } = {}) {
  if (fromCommit) {
    const gitPrefix = `skills/${skill.category}/${skill.name}`;
    const files = await collectFilesFromGitRef(gitPrefix, fromCommit);
    if (files.length > 0) return files;
    return null;
  }

  const localDir = fromAgents
    ? resolve(ROOT, '.agents', 'skills', skill.name)
    : getSkillDir(skill);
  return readSkillTree(localDir);
}

export async function extractOverlay(
  skillName,
  { fromAgents = false, fromCommit = null, force = false } = {}
) {
  const skills = await loadSkills();
  const skill = findSkillByName(skills, skillName);
  if (!skill?.source) {
    throw new Error(`Skill "${skillName}" has no upstream source`);
  }

  if (!force && (await hasOverlay(skillName))) {
    return { skill: skillName, status: 'skipped', reason: 'overlay already exists' };
  }

  try {
    const upstreamFiles = await getUpstreamFiles(skill);
    const localFiles = await resolveLocalFiles(skill, { fromAgents, fromCommit });

    if (!localFiles || localFiles.length === 0) {
      return {
        skill: skillName,
        status: 'skipped',
        reason: fromCommit ? `skill not present at ${fromCommit}` : 'local skill tree empty',
      };
    }

    const diff = summarizeDiff(upstreamFiles, localFiles);
    if (diff.length === 0) {
      return { skill: skillName, status: 'skipped', reason: 'identical to upstream' };
    }

    const overlayChanges = await diffToOverlayChanges(diff, {
      upstreamFiles,
      skillName,
      localFiles,
      skill,
    });

    if (overlayChanges.length === 0) {
      return { skill: skillName, status: 'skipped', reason: 'no overlay-worthy differences' };
    }

    const sourceLabel = fromCommit
      ? `customizations at ${fromCommit}`
      : fromAgents
        ? 'customizations in .agents/skills'
        : 'local customizations';

    const result = await writeOverlayFromChanges(skillName, overlayChanges, {
      description: `Draft overlay extracted from ${sourceLabel} — refine instructions before use`,
      sourceLabel,
    });

    return {
      ...result,
      status: 'created',
      fromCommit,
      fromAgents,
    };
  } finally {
    await cleanExtractClone(skill.source.repo);
  }
}

export async function extractAllOverlays({
  fromCommit = null,
  fromAgents = false,
  force = false,
} = {}) {
  const skills = await loadSkills();
  const cloneCache = new Map();
  const results = [];

  for (const skill of skills) {
    if (!skill.source) continue;
    try {
      if (!force && (await hasOverlay(skill.name))) {
        results.push({ skill: skill.name, status: 'skipped', reason: 'overlay already exists' });
        continue;
      }

      const upstreamFiles = await getUpstreamFiles(skill, cloneCache);
      const localFiles = await resolveLocalFiles(skill, { fromAgents, fromCommit });

      if (!localFiles || localFiles.length === 0) {
        results.push({
          skill: skill.name,
          status: 'skipped',
          reason: fromCommit ? `skill not present at ${fromCommit}` : 'local skill tree empty',
        });
        continue;
      }

      const diff = summarizeDiff(upstreamFiles, localFiles);
      if (diff.length === 0) {
        results.push({ skill: skill.name, status: 'skipped', reason: 'identical to upstream' });
        continue;
      }

      const overlayChanges = await diffToOverlayChanges(diff, {
        upstreamFiles,
        skillName: skill.name,
        localFiles,
        skill,
      });

      if (overlayChanges.length === 0) {
        results.push({ skill: skill.name, status: 'skipped', reason: 'no overlay-worthy differences' });
        continue;
      }

      const sourceLabel = fromCommit
        ? `customizations at ${fromCommit}`
        : fromAgents
          ? 'customizations in .agents/skills'
          : 'local customizations';

      const result = await writeOverlayFromChanges(skill.name, overlayChanges, {
        description: `Draft overlay extracted from ${sourceLabel} — refine instructions before use`,
        sourceLabel,
      });

      results.push({ ...result, status: 'created', fromCommit, fromAgents });
    } catch (err) {
      results.push({ skill: skill.name, status: 'error', reason: err.message });
    }
  }

  const repos = new Set(
    skills.filter((s) => s.source).map((s) => s.source.repo)
  );
  for (const repo of repos) {
    await cleanExtractClone(repo);
  }

  return results;
}

