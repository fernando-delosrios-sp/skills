import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { rm } from 'node:fs/promises';
import { partitionChanges } from '../lib/overlay-model.mjs';
import { auditSkill } from '../lib/overlay-audit.mjs';
import {
  restoreSkill,
  prepareGeneratorManifest,
  extractOverlay,
} from '../lib/overlay-pipeline.mjs';

describe('partitionChanges', () => {
  it('splits semantic and static changes', () => {
    const changes = [
      { action: 'add', file: 'foo.md', from: 'files/foo.md' },
      { file: 'SKILL.md', instructions: 'Update intro' },
    ];
    const { semantic, staticOps } = partitionChanges(changes);
    assert.equal(semantic.length, 1);
    assert.equal(staticOps.length, 1);
    assert.equal(semantic[0].file, 'SKILL.md');
    assert.equal(staticOps[0].action, 'add');
  });

  it('throws on invalid change entries', () => {
    assert.throws(
      () => partitionChanges([{ file: 'SKILL.md' }]),
      /Each change must be semantic/
    );
  });

  it('returns empty arrays for empty input', () => {
    const { semantic, staticOps } = partitionChanges([]);
    assert.deepEqual(semantic, []);
    assert.deepEqual(staticOps, []);
  });
});

describe('auditSkill route determination', () => {
  const skillName = 'git-commit';

  it('returns none route when no overlay or generators', async () => {
    const result = await auditSkill(skillName, {
      lockLookup: async () => null,
      hashProvider: async () => ({
        hasPerSkillOverlay: false,
        hasGenerators: false,
        overlayHash: null,
        universalOverlayHash: null,
      }),
    });

    assert.equal(result.route, 'none');
    assert.equal(result.reason, 'no overlay or generators');
  });

  it('returns remerge route when overlay hash changed', async () => {
    const result = await auditSkill(skillName, {
      lockLookup: async () => ({
        synced_at: '2026-01-01T00:00:00.000Z',
        overlay_applied_at: '2026-01-01T00:00:00.000Z',
        blended_ref: 'abc123',
        overlay_hash: 'old-hash',
        universal_overlay_hash: 'old-universal',
        sha: 'upstream-sha',
        applied_upstream_sha: 'upstream-sha',
      }),
      hashProvider: async () => ({
        hasPerSkillOverlay: true,
        hasGenerators: true,
        overlayHash: 'new-hash',
        universalOverlayHash: 'old-universal',
      }),
      blendedRefValidator: () => true,
    });

    assert.equal(result.route, 'remerge');
    assert.equal(result.overlay_changed, true);
  });

  it('returns restore route when upstream unchanged and overlay unchanged', async () => {
    const result = await auditSkill(skillName, {
      lockLookup: async () => ({
        synced_at: '2026-01-01T00:00:00.000Z',
        overlay_applied_at: '2026-01-01T00:00:00.000Z',
        blended_ref: 'abc123',
        overlay_hash: 'same-hash',
        universal_overlay_hash: 'same-universal',
        sha: 'upstream-sha',
        applied_upstream_sha: 'upstream-sha',
      }),
      hashProvider: async () => ({
        hasPerSkillOverlay: true,
        hasGenerators: false,
        overlayHash: 'same-hash',
        universalOverlayHash: null,
      }),
      blendedRefValidator: () => true,
    });

    assert.equal(result.route, 'restore');
    assert.equal(result.upstream_changed, false);
    assert.equal(result.overlay_changed, false);
  });
});

describe('restoreSkill', () => {
  const skillName = 'git-commit';
  const restoreAudit = {
    route: 'restore',
    reason: 'inputs unchanged',
    blended_ref: 'abc123',
    overlayHash: 'hash',
    universalOverlayHash: null,
    current_upstream_sha: 'upstream-sha',
  };

  it('restores without git checkout when deps are injected', async () => {
    let checkoutCalled = false;
    let blendRecorded = false;

    const result = await restoreSkill(skillName, {
      auditFn: async () => restoreAudit,
      checkoutFn: () => {
        checkoutCalled = true;
      },
      recordBlendFn: async () => {
        blendRecorded = true;
      },
    });

    assert.equal(result.status, 'restored');
    assert.equal(checkoutCalled, true);
    assert.equal(blendRecorded, true);
    assert.equal(result.blended_ref, 'abc123');
  });

  it('skips when audit route is not restore', async () => {
    let checkoutCalled = false;

    const result = await restoreSkill(skillName, {
      auditFn: async () => ({ ...restoreAudit, route: 'remerge', reason: 'overlay changed' }),
      checkoutFn: () => {
        checkoutCalled = true;
      },
    });

    assert.equal(result.status, 'skipped');
    assert.equal(checkoutCalled, false);
  });
});

describe('prepareGeneratorManifest', () => {
  it('produces a generator-only manifest without semantic changes', async () => {
    const result = await prepareGeneratorManifest('git-commit');

    assert.equal(result.skill, 'git-commit');
    assert.equal(result.semanticCount, 0);
    assert.ok(result.generatorCount > 0);
    assert.match(result.manifestPath, /git-commit\.md$/);

    await rm(result.manifestPath, { force: true });
  });
});

describe('extractOverlay', () => {
  it('skips when overlay already exists without force', async () => {
    const result = await extractOverlay('domain-modeling', { force: false });

    assert.equal(result.status, 'skipped');
    assert.equal(result.reason, 'overlay already exists');
  });
});
