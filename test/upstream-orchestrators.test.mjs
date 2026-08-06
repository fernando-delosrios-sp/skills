import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getHeadSha } from '../lib/upstream-adapter.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const libDir = resolve(__dirname, '../lib');

const ORCHESTRATORS = [
  {
    file: 'sync.mjs',
    imports: ['cloneRepo', 'getHeadSha', 'readSkillTree'],
    forbidden: ['shallowClone', 'git clone'],
  },
  {
    file: 'import.mjs',
    imports: ['cloneRepo'],
    forbidden: ['shallowClone', 'git clone'],
  },
  {
    file: 'overlay-extract.mjs',
    imports: ['cloneRepo', 'readSkillTree'],
    forbidden: ['shallowClone', 'git clone'],
  },
];

describe('upstream orchestrator adapter contract', () => {
  for (const { file, imports, forbidden } of ORCHESTRATORS) {
    it(`${file} imports upstream adapter and avoids inline git clone`, async () => {
      const source = await readFile(join(libDir, file), 'utf8');

      assert.match(source, /from '\.\/upstream-adapter\.mjs'/);
      for (const name of imports) {
        assert.match(source, new RegExp(`\\b${name}\\b`));
      }
      for (const pattern of forbidden) {
        assert.doesNotMatch(source, new RegExp(pattern));
      }
    });
  }
});

describe('getHeadSha', () => {
  it('returns HEAD SHA from a local git repository', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'upstream-adapter-'));
    try {
      execSync('git init', { cwd: dir, stdio: 'pipe' });
      execSync('git config user.email "test@example.com"', { cwd: dir, stdio: 'pipe' });
      execSync('git config user.name "Test"', { cwd: dir, stdio: 'pipe' });
      await writeFile(join(dir, 'SKILL.md'), '# test\n');
      execSync('git add SKILL.md', { cwd: dir, stdio: 'pipe' });
      execSync('git commit -m "init"', { cwd: dir, stdio: 'pipe' });

      const expected = execSync('git rev-parse HEAD', { cwd: dir, encoding: 'utf8' }).trim();
      assert.equal(getHeadSha(dir), expected);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
