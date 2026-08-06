import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { diffToOverlayChanges } from '../lib/overlay-extract.mjs';
import { expectedContentForPath } from '../lib/overlay-yaml.mjs';

const skillName = 'git-commit';
const skill = { name: skillName, category: 'engineering' };
const upstreamFiles = [{ relPath: 'SKILL.md', content: '# upstream skill\n' }];

async function fixtureSkillDir(frontmatterExtra = '') {
  const tempRoot = await mkdtemp(join(tmpdir(), 'overlay-extract-'));
  const skillDir = join(tempRoot, 'skills', skill.category, skill.name);
  await mkdir(skillDir, { recursive: true });
  await writeFile(
    join(skillDir, 'SKILL.md'),
    `---
name: ${skill.name}
description: Session-scoped git commit with conventional message analysis and staging.
${frontmatterExtra}---
# Body
`
  );
  return { tempRoot, skillDir };
}

describe('diffToOverlayChanges generator skip', () => {
  it('skips local-only generator output absent from upstream', async () => {
    const diff = [{ type: 'local_only', file: 'agents/openai.yaml', content: 'interface: {}\n' }];
    const changes = await diffToOverlayChanges(diff, { upstreamFiles, skillName, skill });
    assert.equal(changes.length, 0);
  });

  it('skips upstream-only remove for generator output paths', async () => {
    const diff = [{ type: 'upstream_only', file: 'agents/openai.yaml', content: 'old\n' }];
    const changes = await diffToOverlayChanges(diff, { upstreamFiles, skillName, skill });
    assert.equal(changes.length, 0);
  });

  it('skips modify when local content matches derived generator output', async () => {
    const { tempRoot, skillDir } = await fixtureSkillDir();
    try {
      const derived = await expectedContentForPath(skill, 'agents/openai.yaml', { skillDir });
      assert.notEqual(derived, null);

      const diff = [
        {
          type: 'modify',
          file: 'agents/openai.yaml',
          upstream: 'interface: {}\n',
          local: derived,
        },
      ];
      const changes = await diffToOverlayChanges(diff, {
        upstreamFiles,
        skillName,
        skill,
        skillDir,
      });
      assert.equal(changes.length, 0);
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });

  it('emits semantic modify when local content differs from derived output', async () => {
    const { tempRoot, skillDir } = await fixtureSkillDir();
    try {
      const diff = [
        {
          type: 'modify',
          file: 'agents/openai.yaml',
          upstream: 'interface: {}\n',
          local: 'interface:\n  display_name: Custom Title\n',
        },
      ];
      const changes = await diffToOverlayChanges(diff, {
        upstreamFiles,
        skillName,
        skill,
        skillDir,
      });
      assert.equal(changes.length, 1);
      assert.equal(changes[0].file, 'agents/openai.yaml');
      assert.ok(changes[0].instructions);
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });

  it('still adds non-generator local-only files', async () => {
    const diff = [{ type: 'local_only', file: 'notes/local.md', content: 'notes\n' }];
    const changes = await diffToOverlayChanges(diff, { upstreamFiles, skillName, skill });
    assert.equal(changes.length, 1);
    assert.equal(changes[0].action, 'add');
    assert.equal(changes[0].file, 'notes/local.md');
  });
});
