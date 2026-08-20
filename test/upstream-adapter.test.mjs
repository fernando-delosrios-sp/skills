import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { normalizeRepoUrl, readSkillTree } from '../lib/upstream-adapter.mjs';

describe('normalizeRepoUrl', () => {
  it('normalizes owner/repo to GitHub HTTPS with .git', () => {
    assert.equal(normalizeRepoUrl('owner/repo'), 'https://github.com/owner/repo.git');
  });

  it('passes through HTTPS URLs unchanged', () => {
    assert.equal(
      normalizeRepoUrl('https://github.com/owner/repo'),
      'https://github.com/owner/repo'
    );
    assert.equal(
      normalizeRepoUrl('https://github.com/owner/repo.git'),
      'https://github.com/owner/repo.git'
    );
  });

  it('passes through git@ SSH URLs unchanged', () => {
    assert.equal(
      normalizeRepoUrl('git@github.com:owner/repo.git'),
      'git@github.com:owner/repo.git'
    );
  });

  it('rejects an owner/repo value that contains a double quote', () => {
    assert.throws(() => normalizeRepoUrl('owner/repo"; echo hi'), /unsafe repo ref/);
  });
});

describe('readSkillTree', () => {
  const root = resolve('/virtual/upstream-root');
  const subRoot = resolve(root, 'skills', 'my-skill');

  const dirEntries = {
    [root]: [
      { name: 'skills', isDirectory: () => true },
      { name: '.git', isDirectory: () => true },
    ],
    [resolve(root, 'skills')]: [{ name: 'my-skill', isDirectory: () => true }],
    [subRoot]: [
      { name: 'SKILL.md', isDirectory: () => false },
      { name: 'refs', isDirectory: () => true },
    ],
    [resolve(subRoot, 'refs')]: [{ name: 'link.md', isDirectory: () => false }],
  };

  const fileContents = {
    [resolve(subRoot, 'SKILL.md')]: '---\nname: my-skill\n---\n',
    [resolve(subRoot, 'refs', 'link.md')]: 'see also',
  };

  const fs = {
    readdir: async (dir, { withFileTypes }) => {
      assert.ok(withFileTypes);
      return dirEntries[dir] ?? [];
    },
    readFile: async (path) => fileContents[path],
  };

  it('returns relPath/content pairs relative to skill root', async () => {
    const result = await readSkillTree(root, { skillPath: 'skills/my-skill', fs });
    assert.deepEqual(result, [
      { relPath: 'SKILL.md', content: '---\nname: my-skill\n---\n' },
      { relPath: 'refs/link.md', content: 'see also' },
    ]);
  });

  it('skips .git directories', async () => {
    const flatRoot = resolve('/virtual/flat-root');
    const flatFs = {
      readdir: async (dir, { withFileTypes }) => {
        assert.ok(withFileTypes);
        if (dir === flatRoot) {
          return [
            { name: 'SKILL.md', isDirectory: () => false },
            { name: '.git', isDirectory: () => true },
          ];
        }
        return [];
      },
      readFile: async (path) => {
        if (path === resolve(flatRoot, 'SKILL.md')) return 'content';
        throw new Error(`unexpected read: ${path}`);
      },
    };

    const result = await readSkillTree(flatRoot, { fs: flatFs });
    assert.deepEqual(result, [{ relPath: 'SKILL.md', content: 'content' }]);
  });

  it('walks a real directory with the default filesystem adapter', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'upstream-adapter-tree-'));
    try {
      await writeFile(join(dir, 'SKILL.md'), 'skill content');
      await mkdir(join(dir, '.git'));
      await writeFile(join(dir, '.git', 'HEAD'), 'ref: refs/heads/main\n');

      const result = await readSkillTree(dir);
      assert.deepEqual(result, [{ relPath: 'SKILL.md', content: 'skill content' }]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
