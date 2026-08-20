import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { join } from 'node:path';
import {
  validateBlendState,
  validateStructure,
  collectLocalInstallSkillNames,
  compareReadmeCatalog,
} from '../lib/validate.mjs';
import { loadSkills, findSkillByName } from '../lib/index.mjs';
import { getCanonicalDir } from '../lib/skill-paths.mjs';
import { validateOverlays } from '../lib/overlay-pipeline.mjs';

describe('validateBlendState', () => {
  it('emits overlay-lock warning for pending source skill without blended_ref', async () => {
    const skills = [
      {
        name: 'git-commit',
        category: 'engineering',
        source: { repo: 'owner/repo', path: 'skills/git-commit' },
      },
    ];

    const result = await validateBlendState({
      skills,
      auditSkill: async () => ({ route: 'remerge', blended_ref: null }),
    });

    assert.ok(
      result.warnings.some(
        (w) =>
          w.type === 'overlay-lock' &&
          w.skill === 'git-commit' &&
          w.message.includes('pending remerge')
      )
    );
  });

  it('skips local-only skills', async () => {
    const skills = [{ name: 'local-skill', category: 'internal' }];

    const result = await validateBlendState({
      skills,
      auditSkill: async () => {
        throw new Error('auditSkill should not run for local-only skills');
      },
    });

    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.warnings, []);
  });

  it('skips skills with route none', async () => {
    const skills = [
      {
        name: 'plain-skill',
        category: 'engineering',
        source: { repo: 'owner/repo', path: 'skills/plain-skill' },
      },
    ];

    const result = await validateBlendState({
      skills,
      auditSkill: async () => ({ route: 'none', blended_ref: null }),
    });

    assert.deepEqual(result.warnings, []);
  });
});

describe('validateStructure orphans', () => {
  it('does not report skill directories missing from category manifests', async () => {
    const result = await validateStructure();
    const orphans = result.errors.filter((e) => e.type === 'orphan');
    assert.deepEqual(orphans, []);
  });
});

describe('validateOverlays structure-only', () => {
  it('does not emit overlay route audit warnings', async () => {
    const skills = await loadSkills();
    const result = await validateOverlays(skills);

    assert.ok(
      !result.warnings.some((w) => /^Overlay "[^"]+" pending /.test(w.message))
    );
  });
});

describe('collectLocalInstallSkillNames', () => {
  it('extracts unique --skill flags from this package', () => {
    const markdown = [
      'npx skills add fernando-delosrios-sp/skills --skill setup-matt-pocock-skills',
      'npx skills add fernando-delosrios-sp/skills --skill tdd',
      'npx skills add fernando-delosrios-sp/skills --skill setup-matt-pocock-skills',
      'npx skills add obra/superpowers --skill tdd',
    ].join('\n');

    assert.deepEqual(collectLocalInstallSkillNames(markdown), [
      'setup-matt-pocock-skills',
      'tdd',
    ]);
  });
});

describe('README category catalog', () => {
  const catalogSkills = [
    { name: 'tdd', category: 'engineering' },
    { name: 'c4-diagram', category: 'engineering' },
    { name: 'caveman', category: 'productivity' },
    { name: 'update-skills', category: 'internal' },
  ];

  it('extra or missing names fail structure validation', () => {
    const readme = [
      '| Category | Skills |',
      '|----------|--------|',
      '| **engineering** | c4-diagram, graphify |',
      '| **productivity** | caveman |',
      '| **internal** | update-skills |',
    ].join('\n');

    const errors = compareReadmeCatalog(readme, catalogSkills);
    const catalogErrors = errors.filter((e) => e.type === 'readme-catalog');
    assert.equal(catalogErrors.length, 1);
    assert.match(catalogErrors[0].message, /missing: tdd/);
    assert.match(catalogErrors[0].message, /extra: graphify/);
  });

  it('missing table fails rather than skip', () => {
    const errors = compareReadmeCatalog('# Skills\n\nNo table here.\n', catalogSkills);
    const catalogErrors = errors.filter((e) => e.type === 'readme-catalog');
    assert.ok(catalogErrors.length >= 1);
    assert.equal(
      catalogErrors.every((e) => e.type === 'readme-catalog'),
      true
    );
  });

  it('every loaded category is checked', () => {
    const skills = [
      ...catalogSkills,
      { name: 'extra-skill', category: 'experimental' },
    ];
    const readme = [
      '| **engineering** | tdd, c4-diagram |',
      '| **productivity** | caveman |',
      '| **internal** | update-skills |',
    ].join('\n');

    const errors = compareReadmeCatalog(readme, skills);
    const catalogErrors = errors.filter((e) => e.type === 'readme-catalog');
    assert.ok(catalogErrors.some((e) => /experimental/.test(e.message)));
  });

  it('matching catalog produces no readme-catalog error', async () => {
    const result = await validateStructure();
    const catalogErrors = result.errors.filter((e) => e.type === 'readme-catalog');
    assert.deepEqual(catalogErrors, []);
  });
});

describe('schema INSTALL.md catalog', () => {
  it('every this-package --skill flag has a catalog entry and SKILL.md', async () => {
    const skills = await loadSkills();
    const result = await validateStructure();
    const installErrors = result.errors.filter((e) => e.type === 'install-skill');

    assert.deepEqual(installErrors, []);

    const setup = findSkillByName(skills, 'setup-matt-pocock-skills');
    assert.ok(setup, 'setup-matt-pocock-skills must be listed in skills.json');
    await access(join(getCanonicalDir(setup), 'SKILL.md'));
  });
});
