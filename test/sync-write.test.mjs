import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, access, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { applySyncResult } from '../lib/sync.mjs';

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

describe('applySyncResult pending update writes files and deletes orphans', () => {
  it('writes upstream files, removes extras, and sets lock sha', async () => {
    const localSkillDir = await mkdtemp(join(tmpdir(), 'sync-write-'));
    try {
      await writeFile(join(localSkillDir, 'keep.md'), 'old\n', 'utf8');
      await writeFile(join(localSkillDir, 'orphan.md'), 'gone\n', 'utf8');

      const result = {
        skill: 'example-skill',
        status: 'pending_update',
        localSkillDir,
        upstreamFiles: [
          { relPath: 'keep.md', content: 'new\n' },
          { relPath: 'nested/a.md', content: 'a\n' },
        ],
        upstreamSha: 'abc123',
        syncedAt: '2026-08-20T00:00:00.000Z',
        source: { repo: 'owner/repo', path: 'skills/example-skill' },
        hasOverlay: false,
      };
      const locks = {};

      const applied = await applySyncResult(result, locks);

      assert.equal(await readFile(join(localSkillDir, 'keep.md'), 'utf8'), 'new\n');
      assert.equal(await readFile(join(localSkillDir, 'nested/a.md'), 'utf8'), 'a\n');
      assert.equal(await exists(join(localSkillDir, 'orphan.md')), false);
      assert.equal(locks['example-skill'].sha, 'abc123');
      assert.equal(locks['example-skill'].synced_at, '2026-08-20T00:00:00.000Z');
      assert.equal(applied.status, 'updated_clean');
    } finally {
      await rm(localSkillDir, { recursive: true, force: true });
    }
  });
});

describe('applySyncResult non-pending status is a no-op', () => {
  it('leaves the skill directory and locks unchanged', async () => {
    const localSkillDir = await mkdtemp(join(tmpdir(), 'sync-noop-'));
    try {
      await writeFile(join(localSkillDir, 'keep.md'), 'old\n', 'utf8');
      const locks = { other: { sha: 'stay' } };

      const applied = await applySyncResult(
        {
          skill: 'example-skill',
          status: 'unchanged',
          localSkillDir,
          upstreamFiles: [{ relPath: 'keep.md', content: 'new\n' }],
          upstreamSha: 'abc123',
          syncedAt: '2026-08-20T00:00:00.000Z',
          source: { repo: 'owner/repo', path: 'skills/example-skill' },
          hasOverlay: false,
        },
        locks
      );

      assert.equal(await readFile(join(localSkillDir, 'keep.md'), 'utf8'), 'old\n');
      assert.deepEqual(locks, { other: { sha: 'stay' } });
      assert.equal(applied.status, 'unchanged');
    } finally {
      await rm(localSkillDir, { recursive: true, force: true });
    }
  });
});
