import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ROOT } from '../lib/index.mjs';

describe('Validate workflow', () => {
  async function loadValidateYaml() {
    return readFile(resolve(ROOT, '.github/workflows/validate.yaml'), 'utf8');
  }

  it('Test step after npm ci', async () => {
    const yaml = await loadValidateYaml();
    const ci = yaml.indexOf('run: npm ci');
    const test = yaml.indexOf('run: npm test');
    const validate = yaml.indexOf('run: npm run validate');
    assert.ok(ci >= 0, 'expected npm ci');
    assert.ok(test > ci, 'npm test must follow npm ci');
    assert.ok(validate > test, 'npm run validate must follow npm test');
  });

  it('Test failures fail the job', async () => {
    const yaml = await loadValidateYaml();
    const testBlock = yaml.slice(yaml.indexOf('- name: Test'), yaml.indexOf('- name: Validate skills'));
    assert.match(testBlock, /run: npm test/);
    assert.equal(testBlock.includes('continue-on-error'), false);
  });

  it('No watch mode', async () => {
    const yaml = await loadValidateYaml();
    const testBlock = yaml.slice(yaml.indexOf('- name: Test'), yaml.indexOf('- name: Validate skills'));
    assert.match(testBlock, /run: npm test\n/);
    assert.equal(testBlock.includes('--watch'), false);
  });

  it('Full validate on the merge gate', async () => {
    const yaml = await loadValidateYaml();
    assert.match(yaml, /run: npm run validate\n/);
    assert.equal(yaml.includes('--structure-only'), false);
  });

  it('Sync workflow out of scope', async () => {
    const sync = await readFile(resolve(ROOT, '.github/workflows/sync.yaml'), 'utf8');
    assert.equal(sync.includes('run: npm test'), false);
  });
});

describe('Validate workflow docs', () => {
  it('Merge gate steps documented', async () => {
    const readme = await readFile(resolve(ROOT, 'README.md'), 'utf8');
    assert.match(readme, /npm test/);
    assert.match(readme, /npm run validate/);
    assert.match(readme, /Validate workflow/);
  });
});
