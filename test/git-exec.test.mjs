import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertSafeGitRef, runGit } from '../lib/git-exec.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

describe('runGit', () => {
  it('returns true for rev-parse --is-inside-work-tree in this repo', () => {
    const out = runGit(['rev-parse', '--is-inside-work-tree'], { cwd: repoRoot });
    assert.equal(out, 'true\n');
  });

  it('rejects a non-array args value', () => {
    assert.throws(
      () => runGit('rev-parse --is-inside-work-tree', { cwd: repoRoot }),
      /string argument array/
    );
  });

  it('rejects an args array that contains a non-string', () => {
    assert.throws(() => runGit(['rev-parse', 1], { cwd: repoRoot }), /string argument array/);
  });
});

describe('assertSafeGitRef', () => {
  it('accepts a hex object name', () => {
    assert.equal(assertSafeGitRef('abc123'), undefined);
  });

  it('rejects a ref that contains a semicolon', () => {
    assert.throws(() => assertSafeGitRef('abc123;id'), /unsafe git ref/);
  });

  it('rejects a ref that contains a colon', () => {
    assert.throws(() => assertSafeGitRef('abc123:path'), /unsafe git ref/);
  });
});
