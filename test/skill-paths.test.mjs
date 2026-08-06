import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolve, sep } from 'node:path';
import {
  ROOT,
  resolveSkillPaths,
  getCanonicalDir,
  getAgentsDir,
  getOverlayDir,
  getGitSkillPrefix,
} from '../lib/skill-paths.mjs';

const fixtureSkill = { name: 'git-commit', category: 'engineering' };

describe('resolveSkillPaths', () => {
  it('returns all four path values for a fixture skill', () => {
    const paths = resolveSkillPaths(fixtureSkill);

    assert.equal(paths.canonicalDir, resolve(ROOT, 'skills', 'engineering', 'git-commit'));
    assert.equal(paths.agentsDir, resolve(ROOT, '.agents', 'skills', 'git-commit'));
    assert.equal(paths.overlayDir, resolve(ROOT, 'overlays', 'git-commit'));
    assert.equal(paths.gitPrefix, 'skills/engineering/git-commit');
  });
});

describe('getCanonicalDir', () => {
  it('matches resolveSkillPaths canonicalDir', () => {
    assert.equal(getCanonicalDir(fixtureSkill), resolveSkillPaths(fixtureSkill).canonicalDir);
  });
});

describe('getAgentsDir', () => {
  it('is flat — name only, no category segment', () => {
    const agentsDir = getAgentsDir(fixtureSkill);

    assert.ok(!agentsDir.includes(`${sep}engineering${sep}`));
    assert.ok(agentsDir.endsWith(`${sep}.agents${sep}skills${sep}git-commit`));
  });
});

describe('getGitSkillPrefix', () => {
  it('uses forward slashes on all platforms', () => {
    const prefix = getGitSkillPrefix(fixtureSkill);

    assert.equal(prefix, 'skills/engineering/git-commit');
    assert.ok(!prefix.includes('\\'));
  });
});

describe('getOverlayDir', () => {
  it('accepts skill name without full record', () => {
    assert.equal(getOverlayDir('git-commit'), resolve(ROOT, 'overlays', 'git-commit'));
  });
});
