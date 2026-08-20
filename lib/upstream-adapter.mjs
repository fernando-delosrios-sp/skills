/**
 * Upstream git adapter — single seam for clone, tree read, and HEAD SHA.
 *
 * Public interface:
 *   cloneRepo(repoRef, destDir, options?)
 *   readSkillTree(rootDir, { skillPath, fs }?)
 *   getHeadSha(cloneDir)
 *
 * Pass optional `fs` ({ readdir, readFile }) to readSkillTree for unit tests
 * without network access or real git clones.
 */

import { readFile, readdir, mkdir } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { runGit } from './git-exec.mjs';

const DEFAULT_FS = { readdir, readFile };

const OWNER_REPO = /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/;
const URL_UNSAFE = /["`$;\n\r]/;

export function normalizeRepoUrl(repoRef) {
  if (typeof repoRef !== 'string' || repoRef.length === 0) {
    throw new Error('unsafe repo ref');
  }
  if (repoRef.startsWith('https://') || repoRef.startsWith('git@')) {
    if (repoRef.startsWith('-') || URL_UNSAFE.test(repoRef)) {
      throw new Error('unsafe repo ref');
    }
    return repoRef;
  }
  if (!OWNER_REPO.test(repoRef)) {
    throw new Error('unsafe repo ref');
  }
  return `https://github.com/${repoRef}.git`;
}

export async function cloneRepo(repoRef, destDir, { timeout = 60000 } = {}) {
  const url = normalizeRepoUrl(repoRef);
  await mkdir(destDir, { recursive: true });
  runGit(['clone', '--depth', '1', url, '.'], {
    cwd: destDir,
    timeout,
    encoding: 'buffer',
  });
}

async function walkTree(dir, baseDir, fs) {
  const result = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === '.git') continue;
    const fullPath = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...(await walkTree(fullPath, baseDir, fs)));
    } else {
      const content = await fs.readFile(fullPath, 'utf8');
      result.push({ relPath: relative(baseDir, fullPath), content });
    }
  }

  return result;
}

export async function readSkillTree(rootDir, { skillPath, fs } = {}) {
  const fileSystem = fs ?? DEFAULT_FS;
  const baseDir = skillPath ? resolve(rootDir, skillPath) : rootDir;
  return walkTree(baseDir, baseDir, fileSystem);
}

export function getHeadSha(cloneDir) {
  return runGit(['rev-parse', 'HEAD'], { cwd: cloneDir }).trim();
}
