import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, access, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { applyStaticOverlay } from '../lib/overlay-static.mjs';

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function makeFixture({ action = 'add', extraFile = false } = {}) {
  const overlayDir = await mkdtemp(join(tmpdir(), 'overlay-static-ov-'));
  const skillDir = await mkdtemp(join(tmpdir(), 'overlay-static-sk-'));
  await mkdir(join(overlayDir, 'files'), { recursive: true });
  await writeFile(join(overlayDir, 'files', 'extra.md'), 'hello', 'utf8');
  if (extraFile) {
    await writeFile(join(skillDir, 'gone.md'), 'bye', 'utf8');
  }

  const overlay = {
    _dir: overlayDir,
    changes:
      action === 'remove'
        ? [{ action: 'remove', file: 'gone.md' }]
        : [{ action, file: 'extra.md', from: 'files/extra.md' }],
  };

  const deps = {
    loadOverlayFn: async () => overlay,
    findSkillFn: async () => ({ name: 'fixture-skill', category: 'engineering' }),
    getSkillDirFn: () => skillDir,
  };

  return { overlayDir, skillDir, deps };
}

describe('applyStaticOverlay static add writes payload', () => {
  it('creates extra.md from the overlay files payload', async () => {
    const { overlayDir, skillDir, deps } = await makeFixture();
    try {
      await applyStaticOverlay('fixture-skill', { dryRun: false, ...deps });
      assert.equal(await readFile(join(skillDir, 'extra.md'), 'utf8'), 'hello');
    } finally {
      await rm(overlayDir, { recursive: true, force: true });
      await rm(skillDir, { recursive: true, force: true });
    }
  });
});

describe('applyStaticOverlay dry run does not write', () => {
  it('does not create extra.md when dryRun is true', async () => {
    const { overlayDir, skillDir, deps } = await makeFixture();
    try {
      await applyStaticOverlay('fixture-skill', { dryRun: true, ...deps });
      assert.equal(await exists(join(skillDir, 'extra.md')), false);
    } finally {
      await rm(overlayDir, { recursive: true, force: true });
      await rm(skillDir, { recursive: true, force: true });
    }
  });
});

describe('applyStaticOverlay static remove deletes a file', () => {
  it('removes the named file', async () => {
    const { overlayDir, skillDir, deps } = await makeFixture({ action: 'remove', extraFile: true });
    try {
      await applyStaticOverlay('fixture-skill', { dryRun: false, ...deps });
      assert.equal(await exists(join(skillDir, 'gone.md')), false);
    } finally {
      await rm(overlayDir, { recursive: true, force: true });
      await rm(skillDir, { recursive: true, force: true });
    }
  });
});

describe('applyStaticOverlay missing static source throws', () => {
  it('throws when from does not exist', async () => {
    const overlayDir = await mkdtemp(join(tmpdir(), 'overlay-static-missing-'));
    const skillDir = await mkdtemp(join(tmpdir(), 'overlay-static-sk-'));
    try {
      const overlay = {
        _dir: overlayDir,
        changes: [{ action: 'add', file: 'extra.md', from: 'files/missing.md' }],
      };
      await assert.rejects(
        () =>
          applyStaticOverlay('fixture-skill', {
            dryRun: false,
            loadOverlayFn: async () => overlay,
            findSkillFn: async () => ({ name: 'fixture-skill' }),
            getSkillDirFn: () => skillDir,
          }),
        /Static source not found/
      );
    } finally {
      await rm(overlayDir, { recursive: true, force: true });
      await rm(skillDir, { recursive: true, force: true });
    }
  });
});
