import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { getOverlayRoute, loadLocks } from '../lib/locks.mjs';
import { loadSkills, ROOT } from '../lib/index.mjs';
import { hasOverlay } from '../lib/overlay-yaml.mjs';

describe('getOverlayRoute', () => {
  const hashes = {
    overlayHash: 'overlay-hash',
    universalOverlayHash: 'universal-hash',
  };

  const opts = {
    hasPerSkillOverlay: true,
    hasGenerators: true,
    blendedRefValid: true,
  };

  it('routes fresh when overlay_applied_at is missing even if a prior blended_ref exists', () => {
    const route = getOverlayRoute(
      {
        synced_at: '2026-08-20T08:55:40.469Z',
        sha: 'new-upstream',
        applied_upstream_sha: 'old-upstream',
        overlay_applied_at: null,
        overlay_hash: 'overlay-hash',
        universal_overlay_hash: 'universal-hash',
        blended_ref: '33d281a70e78fc943b1d779b0c2b2f7c48d743ba',
      },
      hashes,
      opts
    );

    assert.equal(route.route, 'fresh');
    assert.equal(route.reason, 'never applied');
  });

  it('routes restore when blend metadata matches current inputs', () => {
    const route = getOverlayRoute(
      {
        synced_at: '2026-08-20T08:55:40.469Z',
        sha: 'upstream-sha',
        applied_upstream_sha: 'upstream-sha',
        overlay_applied_at: '2026-08-20T09:11:18.260Z',
        overlay_hash: 'overlay-hash',
        universal_overlay_hash: 'universal-hash',
        blended_ref: 'd141af2956cef3f9296964b40f0760a60b8dff60',
      },
      hashes,
      opts
    );

    assert.equal(route.route, 'restore');
  });
});

describe('committed overlay locks', () => {
  it('records blend metadata for customized source skills', async () => {
    const skills = await loadSkills();
    const locks = await loadLocks();

    const customized = [];
    for (const skill of skills) {
      if (!skill.source) continue;
      if (!(await hasOverlay(skill.name))) continue;
      customized.push(skill);
    }

    assert.ok(customized.length > 0, 'expected at least one customized source skill');

    for (const skill of customized) {
      const lock = locks[skill.name];
      assert.ok(lock?.overlay_applied_at, `${skill.name} is missing overlay_applied_at`);
      assert.equal(
        lock.applied_upstream_sha,
        lock.sha,
        `${skill.name} applied_upstream_sha does not match current sha`
      );
      assert.ok(lock.blended_ref, `${skill.name} is missing blended_ref`);
    }
  });
});

describe('update-skills commit gate', () => {
  it('defers push until after the overlay lock commit', async () => {
    const skill = await readFile(resolve(ROOT, 'skills/internal/update-skills/SKILL.md'), 'utf8');
    const gate = skill.slice(skill.indexOf('### 5. Commit gate'), skill.indexOf('### 6. Report'));

    assert.equal(gate.includes('commit then push'), false);
    assert.match(gate, /one push of HEAD after the lock commit/);
    assert.match(gate, /push after step 3 so the remote includes the lock commit/);
  });
});

describe('update-skills rename', () => {
  it('does not leave skill-overlay trees beside update-skills', async () => {
    const skills = await loadSkills();
    assert.ok(skills.some((s) => s.name === 'update-skills'));
    assert.equal(
      skills.some((s) => s.name === 'skill-overlay'),
      false
    );

    await assert.rejects(
      () => access(resolve(ROOT, 'skills/internal/skill-overlay/SKILL.md')),
      { code: 'ENOENT' }
    );
    await assert.rejects(
      () => access(resolve(ROOT, '.agents/skills/skill-overlay/SKILL.md')),
      { code: 'ENOENT' }
    );
  });
});
