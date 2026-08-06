import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';
import {
  resolveGeneratorsForSkill,
  getGeneratedPathsForSkill,
  isGeneratedPathForSkill,
  expectedContentForPath,
  partitionChanges,
  loadGlobalOverlay,
} from '../lib/overlay-yaml.mjs';
import { ROOT, getSkillDir } from '../lib/index.mjs';

describe('partitionChanges', () => {
  it('splits semantic and static changes', () => {
    const changes = [
      { action: 'add', file: 'foo.md', from: 'files/foo.md' },
      { file: 'SKILL.md', instructions: 'Update intro' },
    ];
    const { semantic, staticOps } = partitionChanges(changes);
    assert.equal(semantic.length, 1);
    assert.equal(staticOps.length, 1);
  });
});

describe('loadGlobalOverlay', () => {
  it('loads universal generators', async () => {
    const doc = await loadGlobalOverlay();
    assert.ok(Array.isArray(doc.generators));
    assert.ok(doc.generators.some((g) => g.id === 'openai-manifest'));
  });
});

describe('resolveGeneratorsForSkill', () => {
  it('returns universal defaults for skills without per-skill overlay', async () => {
    const generators = await resolveGeneratorsForSkill('git-commit');
    assert.ok(generators.some((g) => g.id === 'openai-manifest'));
    assert.equal(generators.find((g) => g.id === 'openai-manifest')?.file, 'agents/openai.yaml');
  });

  it('applies disable and add from a per-skill overlay', async () => {
    const skillName = 'overlay-yaml-fixture';
    const overlayDir = resolve(ROOT, 'overlays', skillName);
    await mkdir(overlayDir, { recursive: true });
    await writeFile(
      join(overlayDir, 'OVERLAY.yaml'),
      `skill: ${skillName}
generators:
  disable:
    - openai-manifest
  add:
    - id: custom-gen
      file: custom/out.yaml
      instructions: Write custom output
`
    );

    try {
      const generators = await resolveGeneratorsForSkill(skillName);
      assert.ok(!generators.some((g) => g.id === 'openai-manifest'));
      assert.ok(generators.some((g) => g.id === 'custom-gen'));
    } finally {
      await rm(overlayDir, { recursive: true, force: true });
    }
  });

  it('keeps universal generators for overlays without generator overrides', async () => {
    const generators = await resolveGeneratorsForSkill('domain-modeling');
    assert.ok(generators.some((g) => g.id === 'openai-manifest'));
  });
});

describe('generated path classification', () => {
  it('identifies agents/openai.yaml for git-commit', async () => {
    assert.equal(await isGeneratedPathForSkill('git-commit', 'agents/openai.yaml'), true);
    assert.equal(await isGeneratedPathForSkill('git-commit', 'SKILL.md'), false);
  });

  it('lists generated paths', async () => {
    const paths = await getGeneratedPathsForSkill('git-commit');
    assert.deepEqual(paths, ['agents/openai.yaml']);
  });
});

describe('expectedContentForPath', () => {
  const skill = { name: 'git-commit', category: 'engineering' };

  it('derives openai-manifest from SKILL.md frontmatter', async () => {
    const skillDir = getSkillDir(skill);
    const derived = await expectedContentForPath(skill, 'agents/openai.yaml', { skillDir });
    assert.notEqual(derived, null);

    const doc = parse(derived);
    assert.equal(doc.interface.display_name, 'Git Commit');
    assert.ok(doc.interface.short_description.length > 0);
    assert.ok(doc.interface.short_description.length <= 72);
    assert.equal(doc.policy, undefined);
  });

  it('returns null for non-generator paths', async () => {
    const skillDir = getSkillDir(skill);
    const derived = await expectedContentForPath(skill, 'SKILL.md', { skillDir });
    assert.equal(derived, null);
  });

  it('includes policy when disable-model-invocation is true', async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), 'overlay-yaml-derive-'));
    const skillDir = join(tempRoot, 'skills', 'test-cat', 'test-skill');
    await mkdir(skillDir, { recursive: true });
    await writeFile(
      join(skillDir, 'SKILL.md'),
      `---
name: test-skill
description: A test skill for derivation.
disable-model-invocation: true
---
# Body
`
    );

    const testSkill = { name: 'test-skill', category: 'test-cat' };
    const derived = await expectedContentForPath(testSkill, 'agents/openai.yaml', { skillDir });
    assert.notEqual(derived, null);

    const doc = parse(derived);
    assert.equal(doc.policy?.allow_implicit_invocation, false);

    await rm(tempRoot, { recursive: true, force: true });
  });
});

describe('module graph', () => {
  it('overlay-yaml does not import pipeline or generator-config', async () => {
    const source = await readFile(new URL('../lib/overlay-yaml.mjs', import.meta.url), 'utf8');
    assert.doesNotMatch(source, /from '\.\/overlay-extract\.mjs'/);
    assert.doesNotMatch(source, /from '\.\/overlay-manifest\.mjs'/);
    assert.doesNotMatch(source, /from '\.\/overlay-audit\.mjs'/);
    assert.doesNotMatch(source, /from '\.\/generator-config\.mjs'/);
  });
});
