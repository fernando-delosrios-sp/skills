import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import {
  listBranches,
  deleteBranch,
  isBranchMerged,
  getOpenSyncPRHeads,
  cleanupSyncBranches,
} from '../lib/github.mjs';

const repoRef = { owner: 'acme', repo: 'skills' };

function createOctokit(handlers) {
  return {
    paginate: async (method, params) => {
      if (method === handlers.listBranches) {
        return handlers.listBranches(params);
      }
      if (method === handlers.listPulls) {
        return handlers.listPulls(params);
      }
      throw new Error(`Unexpected paginate method: ${method.name}`);
    },
    repos: {
      listBranches: handlers.listBranches,
      get: handlers.reposGet,
      compareCommitsWithBasehead: handlers.compareCommitsWithBasehead,
    },
    git: {
      deleteRef: handlers.deleteRef,
    },
    pulls: {
      list: handlers.listPulls,
    },
  };
}

describe('listBranches', () => {
  it('returns branch names filtered by prefix', async () => {
    const octokit = createOctokit({
      listBranches: async () => [
        { name: 'main' },
        { name: 'sync/2026-08-05' },
        { name: 'sync/2026-08-06' },
        { name: 'feature/foo' },
      ],
    });

    const branches = await listBranches(octokit, repoRef, { prefix: 'sync/' });
    assert.deepEqual(branches, ['sync/2026-08-05', 'sync/2026-08-06']);
  });
});

describe('deleteBranch', () => {
  it('deletes a remote branch ref', async () => {
    const deleteRef = mock.fn(async () => ({}));
    const octokit = createOctokit({ deleteRef });

    const removed = await deleteBranch(octokit, repoRef, 'sync/2026-08-05');
    assert.equal(removed, true);
    assert.equal(deleteRef.mock.calls.length, 1);
    assert.deepEqual(deleteRef.mock.calls[0].arguments[0], {
      owner: 'acme',
      repo: 'skills',
      ref: 'heads/sync/2026-08-05',
    });
  });

  it('returns false when ref is already gone', async () => {
    const deleteRef = mock.fn(async () => {
      const err = new Error('Reference does not exist');
      err.status = 422;
      throw err;
    });
    const octokit = createOctokit({ deleteRef });

    const removed = await deleteBranch(octokit, repoRef, 'sync/2026-08-05');
    assert.equal(removed, false);
  });
});

describe('isBranchMerged', () => {
  it('returns true when branch is behind default', async () => {
    const compareCommitsWithBasehead = mock.fn(async () => ({
      data: { status: 'behind' },
    }));
    const octokit = createOctokit({ compareCommitsWithBasehead });

    const merged = await isBranchMerged(
      octokit,
      repoRef,
      'sync/2026-08-05',
      'main'
    );
    assert.equal(merged, true);
  });

  it('returns true when branch is identical to default', async () => {
    const compareCommitsWithBasehead = mock.fn(async () => ({
      data: { status: 'identical' },
    }));
    const octokit = createOctokit({ compareCommitsWithBasehead });

    const merged = await isBranchMerged(
      octokit,
      repoRef,
      'sync/2026-08-07',
      'main'
    );
    assert.equal(merged, true);
  });

  it('returns false when branch is ahead of default', async () => {
    const compareCommitsWithBasehead = mock.fn(async () => ({
      data: { status: 'ahead' },
    }));
    const octokit = createOctokit({ compareCommitsWithBasehead });

    const merged = await isBranchMerged(
      octokit,
      repoRef,
      'sync/2026-08-07',
      'main'
    );
    assert.equal(merged, false);
  });
});

describe('getOpenSyncPRHeads', () => {
  it('returns open PR head refs under sync/', async () => {
    const listPulls = async () => [
      { head: { ref: 'sync/2026-08-07' } },
      { head: { ref: 'feature/other' } },
      { head: { ref: 'sync/2026-08-08' } },
    ];
    const octokit = createOctokit({ listPulls });

    const heads = await getOpenSyncPRHeads(octokit, repoRef);
    assert.deepEqual([...heads], ['sync/2026-08-07', 'sync/2026-08-08']);
  });
});

describe('cleanupSyncBranches', () => {
  it('deletes merged sync branches and skips open PR branches', async () => {
    const deleteRef = mock.fn(async () => ({}));
    const compareCommitsWithBasehead = mock.fn(async ({ basehead }) => {
      const branch = basehead.split('...')[1];
      if (branch === 'sync/2026-08-05') {
        return { data: { status: 'behind' } };
      }
      if (branch === 'sync/2026-08-06') {
        return { data: { status: 'ahead' } };
      }
      return { data: { status: 'identical' } };
    });

    const octokit = createOctokit({
      listBranches: async () => [
        { name: 'sync/2026-08-05' },
        { name: 'sync/2026-08-06' },
        { name: 'sync/2026-08-07' },
      ],
      listPulls: async () => [{ head: { ref: 'sync/2026-08-07' } }],
      reposGet: async () => ({ data: { default_branch: 'main' } }),
      compareCommitsWithBasehead,
      deleteRef,
    });

    const result = await cleanupSyncBranches(octokit, repoRef);

    assert.deepEqual(
      result.deleted.map((entry) => entry.branch),
      ['sync/2026-08-05']
    );
    assert.deepEqual(result.skipped.sort((a, b) => a.branch.localeCompare(b.branch)), [
      { branch: 'sync/2026-08-06', reason: 'not merged' },
      { branch: 'sync/2026-08-07', reason: 'open PR' },
    ]);
    assert.equal(result.errors.length, 0);
    assert.equal(deleteRef.mock.calls.length, 1);
  });

  it('dry-run reports branches without calling deleteRef', async () => {
    const deleteRef = mock.fn(async () => ({}));
    const octokit = createOctokit({
      listBranches: async () => [{ name: 'sync/2026-08-05' }],
      listPulls: async () => [],
      reposGet: async () => ({ data: { default_branch: 'main' } }),
      compareCommitsWithBasehead: async () => ({ data: { status: 'behind' } }),
      deleteRef,
    });

    const result = await cleanupSyncBranches(octokit, repoRef, { dryRun: true });

    assert.deepEqual(result.deleted, [
      { branch: 'sync/2026-08-05', dryRun: true },
    ]);
    assert.equal(deleteRef.mock.calls.length, 0);
  });

  it('deletes same-day orphan branch when identical to default (no PR opened)', async () => {
    const deleteRef = mock.fn(async () => ({}));
    const octokit = createOctokit({
      listBranches: async () => [{ name: 'sync/2026-08-07' }],
      listPulls: async () => [],
      reposGet: async () => ({ data: { default_branch: 'main' } }),
      compareCommitsWithBasehead: async () => ({ data: { status: 'identical' } }),
      deleteRef,
    });

    const result = await cleanupSyncBranches(octokit, repoRef);

    assert.deepEqual(result.deleted, [{ branch: 'sync/2026-08-07' }]);
    assert.equal(result.skipped.length, 0);
    assert.equal(deleteRef.mock.calls.length, 1);
  });

  it('skips branches listed in excludeBranches', async () => {
    const deleteRef = mock.fn(async () => ({}));
    const octokit = createOctokit({
      listBranches: async () => [
        { name: 'sync/2026-08-05' },
        { name: 'sync/2026-08-06' },
      ],
      listPulls: async () => [],
      reposGet: async () => ({ data: { default_branch: 'main' } }),
      compareCommitsWithBasehead: async () => ({ data: { status: 'behind' } }),
      deleteRef,
    });

    const result = await cleanupSyncBranches(octokit, repoRef, {
      excludeBranches: ['sync/2026-08-06'],
    });

    assert.deepEqual(result.deleted, [{ branch: 'sync/2026-08-05' }]);
    assert.deepEqual(result.skipped, [
      { branch: 'sync/2026-08-06', reason: 'excluded' },
    ]);
    assert.equal(deleteRef.mock.calls.length, 1);
  });
});
