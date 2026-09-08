import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import { parse } from 'yaml';
import { ROOT } from '../lib/index.mjs';

const execFileAsync = promisify(execFile);

const applySkillPath = resolve(ROOT, 'skills/engineering/apply-code-changes/SKILL.md');
const schemaPath = resolve(
  ROOT,
  'skills/engineering/openspec-init/schemas/ferspec/schema.yaml'
);
const configPath = resolve(ROOT, 'openspec/config.yaml');

async function readUtf8(path) {
  return readFile(path, 'utf8');
}

describe('Verify blocks handoff', () => {
  it('apply skill and schema forbid handoff while verify tiers have issues', async () => {
    const skill = await readUtf8(applySkillPath);
    const schema = await readUtf8(schemaPath);
    const agentsFragment = await readUtf8(
      resolve(
        ROOT,
        'skills/engineering/openspec-init/schemas/ferspec/templates/adopters/AGENTS.md.fragment.md'
      )
    );
    assert.match(skill, /Run verify to empty CRITICAL\/WARNING\/SUGGESTION tiers before handoff/);
    assert.match(skill, /\*\*Done when:\*\* verify tiers empty and the venue handoff row below completes/);
    assert.match(schema, /\*\*Verify\*\* \(blocking last gate before handoff\)/);
    assert.match(schema, /until CRITICAL, WARNING, and SUGGESTION are all empty/);
    assert.match(
      agentsFragment,
      /Reporting apply complete while `\/opsx:verify` still has CRITICAL, WARNING, or SUGGESTION issues/
    );
    assert.doesNotMatch(skill, /verify-fix loop/);
    assert.doesNotMatch(schema, /openspec-verify-change/);
  });
});

describe('Post-apply verify is empty', () => {
  it('apply skill requires a later standalone /opsx:verify to stay empty in all three tiers', async () => {
    const skill = await readUtf8(applySkillPath);
    assert.match(
      skill,
      /standalone `\/opsx:verify` after this step has no CRITICAL, WARNING, or SUGGESTION issues/
    );
    assert.match(skill, /confirmation scorecard/i);
  });
});

describe('Worktree verify runs on original branch', () => {
  it('merge gate squash-merges apply ref onto ORIGINAL_BRANCH before verify', async () => {
    const skill = await readUtf8(applySkillPath);
    const schema = await readUtf8(schemaPath);
    assert.match(skill, /Do not run verify on the worktree checkout/);
    assert.match(skill, /squash to \*\*`ORIGINAL_BRANCH`\*\* before step 5/);
    assert.match(schema, /Worktree: squash `apply-<name>` → `ORIGINAL_BRANCH` on main repo before verify/);
  });
});

async function firstActiveChange() {
  const { stdout } = await execFileAsync('openspec', ['list', '--changes', '--json'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  const { changes } = JSON.parse(stdout);
  return changes?.[0]?.name ?? changes?.[0]?.id ?? null;
}

describe('Instructions apply loads guidance', () => {
  it('config.yaml declares operations.apply.guidance', async () => {
    const config = parse(await readUtf8(configPath));
    const guidance = config?.operations?.apply?.guidance;
    assert.ok(Array.isArray(guidance) && guidance.length > 0);
    assert.ok(
      guidance.some((line) => /empty CRITICAL, WARNING, and SUGGESTION/.test(line)),
      'expected last-gate verify wording in operations.apply.guidance'
    );
  });

  it('instructions apply JSON surfaces every guidance line', async (t) => {
    const change = await firstActiveChange();
    if (!change) {
      t.skip('no active change in openspec/changes — CLI guidance surfacing not exercisable');
      return;
    }

    const config = parse(await readUtf8(configPath));
    const guidance = config.operations.apply.guidance;
    const { stdout } = await execFileAsync(
      'openspec',
      ['instructions', 'apply', '--change', change, '--json'],
      { cwd: ROOT, encoding: 'utf8' }
    );
    const payload = JSON.parse(stdout);
    assert.ok(Array.isArray(payload.operationGuidance));
    for (const line of guidance) {
      assert.ok(
        payload.operationGuidance.includes(line),
        `missing operationGuidance line: ${line}`
      );
    }
  });
});
