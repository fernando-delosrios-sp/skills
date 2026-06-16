import { cp, readFile, access, mkdir, readdir, stat, rm, writeFile } from 'node:fs/promises';
import { resolve, relative, basename, dirname } from 'node:path';
import { execSync } from 'node:child_process';
import { loadSkills, getSkillDir } from './index.mjs';
import kleur from 'kleur';

const TMP_DIR = resolve(process.cwd(), '.tmp');

async function shallowClone(repoUrl, dest) {
  const url = repoUrl.startsWith('https://') || repoUrl.startsWith('git@')
    ? repoUrl
    : `https://github.com/${repoUrl}.git`;

  await mkdir(dest, { recursive: true });
  execSync(`git clone --depth 1 "${url}" .`, {
    cwd: dest,
    stdio: 'pipe',
    timeout: 30000,
  });
}

async function collectFiles(dir) {
  const result = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = resolve(dir, entry.name);
    if (entry.name === '.git') continue;

    if (entry.isDirectory()) {
      const children = await collectFiles(fullPath);
      result.push(...children);
    } else {
      const content = await readFile(fullPath, 'utf8');
      result.push({ path: fullPath, content });
    }
  }

  return result;
}

function diffFiles(upstream, local) {
  const upstreamMap = new Map();
  for (const f of upstream) {
    upstreamMap.set(relative(f.upstreamRoot || '', f.path), f);
  }

  const localMap = new Map();
  for (const f of local) {
    localMap.set(f.relPath, f);
  }

  const changes = [];

  // Check for new or changed files in upstream
  for (const [relPath, upFile] of upstreamMap) {
    const localFile = localMap.get(relPath);
    if (!localFile) {
      changes.push({ path: relPath, action: 'added' });
    } else if (localFile.content !== upFile.content) {
      changes.push({ path: relPath, action: 'modified' });
    }
  }

  // Check for deleted files (in local but not upstream)
  for (const [relPath] of localMap) {
    if (!upstreamMap.has(relPath)) {
      changes.push({ path: relPath, action: 'deleted' });
    }
  }

  return changes;
}

export async function syncSkill(skill) {
  if (!skill.source) {
    return { skill: skill.name, status: 'skipped', reason: 'no source (custom skill)' };
  }

  const tmpDir = resolve(TMP_DIR, skill.source.repo.replace('/', '_'));

  // Clean and clone
  try {
    execSync(`rm -rf "${tmpDir}"`, { stdio: 'pipe' });
  } catch {}
  await mkdir(TMP_DIR, { recursive: true });

  try {
    await shallowClone(skill.source.repo, tmpDir);
  } catch (err) {
    return {
      skill: skill.name,
      status: 'error',
      reason: `Failed to clone ${skill.source.repo}: ${err.message}`,
    };
  }

  const upstreamSkillDir = resolve(tmpDir, skill.source.path);
  const localSkillDir = getSkillDir(skill);

  // Check if upstream skill still exists
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

  // Collect upstream files
  const upstreamFiles = await collectFiles(upstreamSkillDir);
  for (const f of upstreamFiles) {
    f.upstreamRoot = upstreamSkillDir;
  }

  // Collect local files
  let localFiles = [];
  try {
    localFiles = await collectFiles(localSkillDir);
    for (const f of localFiles) {
      f.relPath = relative(localSkillDir, f.path);
    }
  } catch {
    // Local skill dir doesn't exist yet (first sync)
    localFiles = [];
  }

  const changes = diffFiles(upstreamFiles, localFiles);

  if (changes.length === 0) {
    return { skill: skill.name, status: 'unchanged' };
  }

  return {
    skill: skill.name,
    status: 'changed',
    custom: skill.custom,
    changes,
    upstreamFiles,
    localSkillDir,
  };
}

export async function syncAllSkills() {
  const skills = await loadSkills();
  const results = [];

  for (const skill of skills) {
    console.log(kleur.dim(`Checking ${skill.name}...`));
    const result = await syncSkill(skill);
    results.push(result);
  }

  return results;
}

export async function applyLocalChanges(results) {
  const changed = results.filter((r) => r.status === 'changed');

  for (const r of changed) {
    for (const change of r.changes) {
      const localPath = resolve(r.localSkillDir, change.path);

      if (change.action === 'deleted') {
        await rm(localPath, { force: true });
        continue;
      }

      const upFile = r.upstreamFiles.find(
        (f) => relative(f.upstreamRoot, f.path) === change.path
      );
      if (!upFile) {
        throw new Error(`Could not find upstream content for ${change.path}`);
      }

      await mkdir(dirname(localPath), { recursive: true });
      await writeFile(localPath, upFile.content, 'utf8');
    }
  }

  return changed;
}
