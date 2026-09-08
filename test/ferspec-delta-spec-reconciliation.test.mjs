import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parse } from 'yaml';
import { ROOT } from '../lib/index.mjs';

const applySkillPath = resolve(ROOT, 'skills/engineering/apply-code-changes/SKILL.md');
const ferspecDir = resolve(ROOT, 'skills/engineering/openspec-init/schemas/ferspec');
const configPath = resolve(ROOT, 'openspec/config.yaml');
const configReferencePath = resolve(
  ROOT,
  'skills/engineering/openspec-init/references/config.md'
);

async function readUtf8(path) {
  return readFile(path, 'utf8');
}

describe('Design fork re-resolved during apply', () => {
  it('apply skill makes delta spec reconciliation a step 3 obligation', async () => {
    const skill = await readUtf8(applySkillPath);
    assert.match(skill, /#### Delta spec reconciliation/);
    assert.match(skill, /\*\*Reconcile the delta spec\*\* whenever shipped behavior differs/);
    assert.match(skill, /Rewrite the steps \*\*and\*\* rename the title/);
    assert.match(skill, /Delete the superseded scenario — never leave it beside its replacement/);
  });

  it('ferspec schema assigns reconciliation to apply and excludes it from spec sync', async () => {
    const schema = await readUtf8(resolve(ferspecDir, 'schema.yaml'));
    assert.match(schema, /\*\*Delta spec reconciliation\*\* \(apply owns this\)/);
    assert.match(schema, /Editing this change's own delta specs is not spec sync/);
    assert.match(
      schema,
      /Done when verify tiers are empty, delta specs match shipped behavior/
    );
  });
});

describe('Verify PRECHECK rejects inconsistent delta specs', () => {
  it('PRECHECK requires self-consistent delta specs and matching language entries', async () => {
    const skill = await readUtf8(applySkillPath);
    assert.match(skill, /\*\*Delta specs self-consistent\*\*/);
    assert.match(skill, /no superseded titles, no duplicate scenarios/);
    assert.match(
      skill,
      /Ubiquitous-language delta entries name behavior this change actually ships/
    );
  });
});

describe('Verify finding deferred to a later phase', () => {
  it('apply skill forbids restating a finding as future work', async () => {
    const skill = await readUtf8(applySkillPath);
    assert.match(skill, /restating it is not fixing it/);
    assert.match(skill, /do not defer to the user or to a later phase/);
  });

  it('ferspec docs and routing fragment name the deferral anti-pattern', async () => {
    const readme = await readUtf8(resolve(ferspecDir, 'README.md'));
    const fragment = await readUtf8(
      resolve(ferspecDir, 'templates/adopters/AGENTS.md.fragment.md')
    );
    assert.match(readme, /### Delta spec reconciliation \(apply owns it\)/);
    assert.match(readme, /is still apply's to fix when the fix lives inside the change directory/);
    assert.match(
      fragment,
      /Leaving superseded scenario titles or duplicate scenarios in a change's delta specs/
    );
  });
});

describe('Apply guidance carries reconciliation', () => {
  it('config.yaml and the config reference declare both reconciliation lines', async () => {
    const guidance = parse(await readUtf8(configPath)).operations.apply.guidance;
    const reference = await readUtf8(configReferencePath);

    for (const pattern of [
      /Apply owns delta spec reconciliation/,
      /still apply's to fix when the fix lives inside the change directory/,
    ]) {
      assert.ok(
        guidance.some((line) => pattern.test(line)),
        `missing operations.apply.guidance line matching ${pattern}`
      );
      assert.match(reference, pattern);
    }
  });
});
