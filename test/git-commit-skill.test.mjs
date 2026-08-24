import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ROOT } from '../lib/index.mjs';

const skillPath = resolve(ROOT, 'skills/engineering/git-commit/SKILL.md');
const privateDataPath = resolve(
  ROOT,
  'skills/engineering/git-commit/references/private-data.md'
);

describe('git-commit changelog ownership', () => {
  it('proceeds from private-data to commit message without a changelog-generator gate', async () => {
    const skill = await readFile(skillPath, 'utf8');

    assert.doesNotMatch(skill, /### \d+\. Changelog gate/);
    assert.doesNotMatch(
      skill,
      /Read and follow the \*\*changelog-generator\*\* skill/
    );

    const afterPrivate = skill.slice(skill.indexOf('### 4. Private-data gate'));
    const headings = afterPrivate.match(/^### \d+\. .+$/gm);
    assert.ok(headings && headings.length >= 2, 'expected a step after private-data');
    assert.match(headings[1], /Generate commit message/);
  });

  it('private-data proceed continues to commit, not a changelog update', async () => {
    const body = await readFile(privateDataPath, 'utf8');
    assert.match(body, /Continue to commit/);
    assert.doesNotMatch(body, /Continue to changelog/);
  });

  it('apply keeps changelog-generator on the Changelog group, not each git-commit', async () => {
    const apply = await readFile(
      resolve(ROOT, 'skills/engineering/apply-code-changes/SKILL.md'),
      'utf8'
    );
    assert.match(apply, /changelog-generator\*\* runs in the Changelog group/);
    assert.match(apply, /Changelog group: invoke \*\*changelog-generator\*\*/);
  });
});
