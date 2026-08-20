import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

describe('Characterization tests in the unit suite', () => {
  it('includes mutation-path test files', async () => {
    for (const file of [
      'test/sync-write.test.mjs',
      'test/import-copy.test.mjs',
      'test/overlay-static.test.mjs',
      'test/run-update.test.mjs',
    ]) {
      assert.equal(await exists(resolve(root, file)), true, `missing ${file}`);
    }
  });
});

describe('Characterization test glossary entry', () => {
  it('defines Characterization test in the change delta or canonical glossary', async () => {
    const delta = resolve(
      root,
      'openspec/changes/characterization-mutation-paths/specs/ubiquitous-language/spec.md'
    );
    const canonical = resolve(root, 'openspec/specs/ubiquitous-language/spec.md');
    const sources = [];
    if (await exists(delta)) sources.push(await readFile(delta, 'utf8'));
    sources.push(await readFile(canonical, 'utf8'));
    assert.match(sources.join('\n'), /Characterization test/);
  });
});

describe('applyStaticOverlay production defaults unchanged', () => {
  it('defaults loader deps to current production functions', async () => {
    const source = await readFile(resolve(root, 'lib/overlay-static.mjs'), 'utf8');
    assert.match(source, /loadOverlayFn = loadOverlay/);
    assert.match(source, /getSkillDirFn = getSkillDir/);
  });
});

describe('runUpdate production defaults still call the real pipeline', () => {
  it('defaults deps to current imports', async () => {
    const source = await readFile(resolve(root, 'lib/update.mjs'), 'utf8');
    assert.match(source, /syncAllSkills: syncAll = syncAllSkills/);
    assert.match(source, /applyStaticOverlays: applyStatic = applyStaticOverlays/);
    assert.match(source, /prepareOverlays: prepareAll = prepareOverlays/);
  });
});
