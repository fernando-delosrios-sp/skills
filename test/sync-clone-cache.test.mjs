import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { access, mkdir, writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { syncSkill } from '../lib/sync.mjs';
import { TMP_DIR, repoCloneDirName, cleanRepoClone } from '../lib/tmp.mjs';

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function uniqueRepo(label) {
  return `plan008-${label}-${Math.random().toString(36).slice(2, 10)}/upstream`;
}

function cloneDirFor(repo) {
  return resolve(TMP_DIR, repoCloneDirName(repo));
}

/**
 * Stand-in for cloneRepo that builds a real git repo with two skill paths, so
 * getHeadSha and readSkillTree run unmocked without touching the network.
 */
function makeCloneStub(paths) {
  const calls = [];
  async function cloneRepoStub(repo, destDir) {
    calls.push({ repo, destDir });
    await mkdir(destDir, { recursive: true });
    for (const [path, body] of Object.entries(paths)) {
      await mkdir(resolve(destDir, path), { recursive: true });
      await writeFile(resolve(destDir, path, 'SKILL.md'), body, 'utf8');
    }
    execSync('git init', { cwd: destDir, stdio: 'pipe' });
    execSync('git config user.email "test@example.com"', { cwd: destDir, stdio: 'pipe' });
    execSync('git config user.name "Test"', { cwd: destDir, stdio: 'pipe' });
    execSync('git add -A', { cwd: destDir, stdio: 'pipe' });
    execSync('git commit -m "init"', { cwd: destDir, stdio: 'pipe' });
  }
  return { cloneRepoStub, calls };
}

const TWO_PATHS = {
  'skills/alpha': '# alpha\n',
  'skills/beta': '# beta\n',
};

function skillRecord(name, repo, path) {
  return { name, category: 'plan008', source: { repo, path } };
}

describe('syncSkill clone cache shares one clone per repo', () => {
  it('clones once for two skills from the same repo and keeps their paths distinct', async () => {
    const repo = uniqueRepo('same-repo');
    const { cloneRepoStub, calls } = makeCloneStub(TWO_PATHS);
    const cloneCache = new Map();
    const locks = {};

    try {
      const alpha = await syncSkill(skillRecord('plan008-alpha', repo, 'skills/alpha'), locks, {
        cloneCache,
        cloneRepoFn: cloneRepoStub,
      });
      const beta = await syncSkill(skillRecord('plan008-beta', repo, 'skills/beta'), locks, {
        cloneCache,
        cloneRepoFn: cloneRepoStub,
      });

      assert.equal(calls.length, 1, 'expected a single clone for one repo');
      assert.equal(alpha.status, 'pending_update');
      assert.equal(beta.status, 'pending_update');
      assert.deepEqual(
        alpha.upstreamFiles,
        [{ relPath: 'SKILL.md', content: '# alpha\n' }],
        'alpha must read its own source.path'
      );
      assert.deepEqual(
        beta.upstreamFiles,
        [{ relPath: 'SKILL.md', content: '# beta\n' }],
        'beta must read its own source.path'
      );
    } finally {
      await cleanRepoClone(repo);
    }
  });

  it('clones once per distinct repo', async () => {
    const repoA = uniqueRepo('repo-a');
    const repoB = uniqueRepo('repo-b');
    const { cloneRepoStub, calls } = makeCloneStub(TWO_PATHS);
    const cloneCache = new Map();
    const locks = {};

    try {
      await syncSkill(skillRecord('plan008-a', repoA, 'skills/alpha'), locks, {
        cloneCache,
        cloneRepoFn: cloneRepoStub,
      });
      await syncSkill(skillRecord('plan008-b', repoB, 'skills/beta'), locks, {
        cloneCache,
        cloneRepoFn: cloneRepoStub,
      });

      assert.equal(calls.length, 2);
      assert.deepEqual(new Set(calls.map((c) => c.repo)), new Set([repoA, repoB]));
    } finally {
      await cleanRepoClone(repoA);
      await cleanRepoClone(repoB);
    }
  });
});

describe('syncSkill clone cache defers cleanup to its owner', () => {
  it('leaves the clone in place between skills and cleanRepoClone removes it', async () => {
    const repo = uniqueRepo('no-mid-loop-delete');
    const { cloneRepoStub } = makeCloneStub(TWO_PATHS);
    const cloneCache = new Map();
    const locks = {};
    const tmpDir = cloneDirFor(repo);

    try {
      await syncSkill(skillRecord('plan008-alpha', repo, 'skills/alpha'), locks, {
        cloneCache,
        cloneRepoFn: cloneRepoStub,
      });
      assert.equal(await exists(tmpDir), true, 'clone must survive for the next skill');

      await syncSkill(skillRecord('plan008-beta', repo, 'skills/beta'), locks, {
        cloneCache,
        cloneRepoFn: cloneRepoStub,
      });
      assert.equal(await exists(tmpDir), true, 'clone must survive the whole loop');

      assert.deepEqual([...cloneCache.keys()], [repo]);

      for (const cachedRepo of cloneCache.keys()) {
        await cleanRepoClone(cachedRepo);
      }
      assert.equal(await exists(tmpDir), false, 'cache cleanup must remove the clone dir');
    } finally {
      await cleanRepoClone(repo);
    }
  });
});

describe('syncSkill without a clone cache keeps per-call clone and cleanup', () => {
  it('clones per call and removes the clone in finally', async () => {
    const repo = uniqueRepo('no-cache');
    const { cloneRepoStub, calls } = makeCloneStub(TWO_PATHS);
    const locks = {};
    const tmpDir = cloneDirFor(repo);

    try {
      const alpha = await syncSkill(skillRecord('plan008-alpha', repo, 'skills/alpha'), locks, {
        cloneRepoFn: cloneRepoStub,
      });
      assert.equal(alpha.status, 'pending_update');
      assert.equal(await exists(tmpDir), false, 'clone must be cleaned without a cache');

      await syncSkill(skillRecord('plan008-beta', repo, 'skills/beta'), locks, {
        cloneRepoFn: cloneRepoStub,
      });
      assert.equal(calls.length, 2, 'no cache means one clone per call');
      assert.equal(await exists(tmpDir), false);
    } finally {
      await cleanRepoClone(repo);
    }
  });
});

describe('syncSkill clone failure', () => {
  it('reports an error result and does not cache the failed repo', async () => {
    const repo = uniqueRepo('clone-fails');
    const cloneCache = new Map();

    const result = await syncSkill(skillRecord('plan008-alpha', repo, 'skills/alpha'), {}, {
      cloneCache,
      cloneRepoFn: async () => {
        throw new Error('network down');
      },
    });

    assert.equal(result.status, 'error');
    assert.match(result.reason, /Failed to clone/);
    assert.equal(cloneCache.has(repo), false);
  });
});
