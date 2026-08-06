import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateBlendState } from '../lib/validate.mjs';
import { loadSkills } from '../lib/index.mjs';
import { validateOverlays } from '../lib/overlay-pipeline.mjs';

describe('validateBlendState', () => {
  it('emits overlay-lock warning for pending source skill without blended_ref', async () => {
    const skills = [
      {
        name: 'git-commit',
        category: 'engineering',
        source: { repo: 'owner/repo', path: 'skills/git-commit' },
      },
    ];

    const result = await validateBlendState({
      skills,
      auditSkill: async () => ({ route: 'remerge', blended_ref: null }),
    });

    assert.ok(
      result.warnings.some(
        (w) =>
          w.type === 'overlay-lock' &&
          w.skill === 'git-commit' &&
          w.message.includes('pending remerge')
      )
    );
  });

  it('skips local-only skills', async () => {
    const skills = [{ name: 'local-skill', category: 'internal' }];

    const result = await validateBlendState({
      skills,
      auditSkill: async () => {
        throw new Error('auditSkill should not run for local-only skills');
      },
    });

    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.warnings, []);
  });

  it('skips skills with route none', async () => {
    const skills = [
      {
        name: 'plain-skill',
        category: 'engineering',
        source: { repo: 'owner/repo', path: 'skills/plain-skill' },
      },
    ];

    const result = await validateBlendState({
      skills,
      auditSkill: async () => ({ route: 'none', blended_ref: null }),
    });

    assert.deepEqual(result.warnings, []);
  });
});

describe('validateOverlays structure-only', () => {
  it('does not emit overlay route audit warnings', async () => {
    const skills = await loadSkills();
    const result = await validateOverlays(skills);

    assert.ok(
      !result.warnings.some((w) => /^Overlay "[^"]+" pending /.test(w.message))
    );
  });
});
