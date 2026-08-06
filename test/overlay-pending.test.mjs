import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isPendingApply } from '../lib/overlay-audit.mjs';

describe('isPendingApply', () => {
  const skillName = 'git-commit';

  const baseLock = {
    synced_at: '2026-01-01T00:00:00.000Z',
    sha: 'upstream-sha',
    applied_upstream_sha: 'upstream-sha',
  };

  it('returns false when route is none', async () => {
    const pending = await isPendingApply(skillName, {
      lockLookup: async () => null,
      hashProvider: async () => ({
        hasPerSkillOverlay: false,
        hasGenerators: false,
        overlayHash: null,
        universalOverlayHash: null,
      }),
    });

    assert.equal(pending, false);
  });

  it('returns true when route is fresh', async () => {
    const pending = await isPendingApply(skillName, {
      lockLookup: async () => ({
        ...baseLock,
        overlay_applied_at: null,
      }),
      hashProvider: async () => ({
        hasPerSkillOverlay: true,
        hasGenerators: false,
        overlayHash: 'overlay-hash',
        universalOverlayHash: null,
      }),
      blendedRefValidator: () => false,
    });

    assert.equal(pending, true);
  });

  it('returns true when route is remerge', async () => {
    const pending = await isPendingApply(skillName, {
      lockLookup: async () => ({
        ...baseLock,
        overlay_applied_at: '2026-01-01T00:00:00.000Z',
        blended_ref: 'abc123',
        overlay_hash: 'old-hash',
        universal_overlay_hash: 'old-universal',
      }),
      hashProvider: async () => ({
        hasPerSkillOverlay: true,
        hasGenerators: true,
        overlayHash: 'new-hash',
        universalOverlayHash: 'old-universal',
      }),
      blendedRefValidator: () => true,
    });

    assert.equal(pending, true);
  });

  it('returns false when route is restore', async () => {
    const pending = await isPendingApply(skillName, {
      lockLookup: async () => ({
        ...baseLock,
        overlay_applied_at: '2026-01-01T00:00:00.000Z',
        blended_ref: 'abc123',
        overlay_hash: 'same-hash',
        universal_overlay_hash: 'same-universal',
      }),
      hashProvider: async () => ({
        hasPerSkillOverlay: true,
        hasGenerators: false,
        overlayHash: 'same-hash',
        universalOverlayHash: null,
      }),
      blendedRefValidator: () => true,
    });

    assert.equal(pending, false);
  });

  it('returns true when timestamps say applied but overlay hash changed', async () => {
    const pending = await isPendingApply(skillName, {
      lockLookup: async () => ({
        ...baseLock,
        overlay_applied_at: '2026-01-02T00:00:00.000Z',
        synced_at: '2026-01-01T00:00:00.000Z',
        blended_ref: 'abc123',
        overlay_hash: 'old-hash',
        universal_overlay_hash: 'same-universal',
      }),
      hashProvider: async () => ({
        hasPerSkillOverlay: true,
        hasGenerators: true,
        overlayHash: 'new-hash',
        universalOverlayHash: 'same-universal',
      }),
      blendedRefValidator: () => true,
    });

    assert.equal(pending, true);
  });

  it('returns true for generator-only skill never applied', async () => {
    const pending = await isPendingApply(skillName, {
      lockLookup: async () => ({
        ...baseLock,
        overlay_applied_at: null,
      }),
      hashProvider: async () => ({
        hasPerSkillOverlay: false,
        hasGenerators: true,
        overlayHash: null,
        universalOverlayHash: 'universal-hash',
      }),
      blendedRefValidator: () => false,
    });

    assert.equal(pending, true);
  });
});
