import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { npxSkillsAddArgs } from '../scripts/install.mjs';

describe('npxSkillsAddArgs', () => {
  it('returns argv for npx without joining into a shell string', () => {
    assert.deepEqual(npxSkillsAddArgs(['git-commit', 'tdd']), [
      'skills',
      'add',
      '.',
      '--skill',
      'git-commit',
      '--skill',
      'tdd',
    ]);
  });

  it('returns the base argv when no skills are selected', () => {
    assert.deepEqual(npxSkillsAddArgs([]), ['skills', 'add', '.']);
  });
});
