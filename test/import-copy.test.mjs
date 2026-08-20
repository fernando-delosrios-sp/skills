import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, access, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { copySkillDir, doImport } from '../lib/import.mjs';

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

describe('copySkillDir copy excludes git metadata', () => {
  it('copies SKILL.md and omits .git', async () => {
    const src = await mkdtemp(join(tmpdir(), 'import-src-'));
    const dest = await mkdtemp(join(tmpdir(), 'import-dest-'));
    try {
      await writeFile(join(src, 'SKILL.md'), '---\nname: foo\n---\n# Foo\n', 'utf8');
      await mkdir(join(src, '.git'), { recursive: true });
      await writeFile(join(src, '.git', 'config'), '[core]\n', 'utf8');

      await copySkillDir(src, dest);

      assert.match(await readFile(join(dest, 'SKILL.md'), 'utf8'), /name: foo/);
      assert.equal(await exists(join(dest, '.git')), false);
    } finally {
      await rm(src, { recursive: true, force: true });
      await rm(dest, { recursive: true, force: true });
    }
  });
});

describe('doImport duplicate import name errors without live catalog write', () => {
  it('returns an error and does not call saveSkills', async () => {
    const cloneRoot = await mkdtemp(join(tmpdir(), 'import-clone-'));
    const cwd = await mkdtemp(join(tmpdir(), 'import-cwd-'));
    try {
      await mkdir(join(cloneRoot, 'skills', 'foo'), { recursive: true });
      await writeFile(
        join(cloneRoot, 'skills', 'foo', 'SKILL.md'),
        '---\nname: foo\n---\n# Foo\n',
        'utf8'
      );

      let saved = false;
      const result = await doImport(cloneRoot, 'owner/repo', 'skills/foo', 'engineering', new Set(['foo']), {
        cwd,
        loadSkillsFn: async () => [],
        saveSkillsFn: async () => {
          saved = true;
        },
      });

      assert.equal(result.error, 'Skill "foo" already exists in skills.json');
      assert.equal(saved, false);
      assert.equal(await exists(join(cwd, 'skills', 'engineering', 'foo')), false);
    } finally {
      await rm(cloneRoot, { recursive: true, force: true });
      await rm(cwd, { recursive: true, force: true });
    }
  });
});
