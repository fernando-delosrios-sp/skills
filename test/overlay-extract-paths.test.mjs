import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { ROOT } from '../lib/index.mjs';
import { getGitSkillPrefix } from '../lib/skill-paths.mjs';

const fixtureSkill = { name: 'git-commit', category: 'engineering' };

describe('extract from-commit git prefix', () => {
  it('uses skill-paths gitPrefix as ls-tree prefix against local repo', () => {
    const gitPrefix = getGitSkillPrefix(fixtureSkill);

    assert.equal(gitPrefix, 'skills/engineering/git-commit');

    const paths = execSync(`git ls-tree -r HEAD --name-only ${gitPrefix}`, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    })
      .trim()
      .split('\n')
      .filter(Boolean);

    assert.ok(
      paths.some((p) => p === `${gitPrefix}/SKILL.md`),
      `expected SKILL.md under ${gitPrefix}/ at HEAD`
    );
  });
});
