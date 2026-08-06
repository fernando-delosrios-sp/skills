import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import kleur from 'kleur';
import {
  loadSkills,
  findSkillByName,
  getSkillDir,
  getOverlayManifestDir,
} from './index.mjs';
import { getLockEntry } from './locks.mjs';
import { resolveGeneratorsForSkill } from './generator-config.mjs';
import {
  loadOverlay,
  partitionChanges,
  hasOverlay,
  discoverOverlays,
} from './overlay-model.mjs';
import { applyStaticOverlay } from './overlay-static.mjs';
import { auditSkill, listPendingOverlaySkills } from './overlay-audit.mjs';

const APPLY_CHECKLIST = `- [ ] Every semantic change in OVERLAY.yaml was addressed
- [ ] Every generator in the resolved generator list was addressed
- [ ] SKILL.md frontmatter has valid name and description
- [ ] No placeholder text left from drafting
- [ ] Cross-references between files still resolve
- [ ] Instruction intent is met — not just diff minimization
- [ ] Run \`npm run validate\` and fix any issues before updating the lock file
- [ ] Record blend in \`.locks/upstream.json\`: applied_upstream_sha, overlay_hash, universal_overlay_hash, overlay_applied_at, blended_ref (git rev-parse HEAD after commit)`;

async function appendGeneratorManifestLines(lines, skillDir, generators) {
  lines.push('', '## Generators', '');

  if (generators.length === 0) {
    lines.push('_None configured for this skill._');
    return;
  }

  lines.push(
    'Create or update these derived files after semantic changes (when present). Each entry is identified by `id` in overlay generator config.',
    ''
  );

  for (const [i, gen] of generators.entries()) {
    const heading = gen.file ? `${gen.file} (\`${gen.id}\`)` : `\`${gen.id}\``;
    lines.push(`### ${i + 1}. ${heading}`, '', '**Instructions:**', '', gen.instructions.trim(), '');

    if (gen.file) {
      const filePath = resolve(skillDir, gen.file);
      let content;
      try {
        content = await readFile(filePath, 'utf8');
      } catch {
        content = '_(file not found — create from instructions)_';
      }

      lines.push('**Current file content:**', '', '```markdown', content, '```', '');
    }
  }
}

export async function prepareOverlayManifest(skillName, { runStatic = true } = {}) {
  if (runStatic) {
    await applyStaticOverlay(skillName);
  }

  const overlay = await loadOverlay(skillName);
  const skills = await loadSkills();
  const skill = findSkillByName(skills, skillName);
  if (!skill) {
    throw new Error(`Skill "${skillName}" not found in skills.json`);
  }

  const lock = await getLockEntry(skillName);
  const audit = await auditSkill(skillName);
  const { semantic } = partitionChanges(overlay.changes);
  const skillDir = getSkillDir(skill);
  const { staticOps } = partitionChanges(overlay.changes);
  const generators = await resolveGeneratorsForSkill(skillName);

  const lines = [
    `# Overlay apply manifest: ${skillName}`,
    '',
    `**Overlay:** overlays/${skillName}/OVERLAY.yaml`,
    `**Description:** ${overlay.description ?? '(none)'}`,
    `**Skill dir:** skills/${skill.category}/${skillName}/`,
    `**Upstream SHA:** ${lock?.sha ?? 'unknown'}`,
    `**Synced at:** ${lock?.synced_at ?? 'unknown'}`,
    `**Audit route:** ${audit.route} (${audit.reason})`,
    `**Upstream changed:** ${audit.upstream_changed}`,
    `**Overlay changed:** ${audit.overlay_changed}`,
    '',
    'Apply semantic changes using the **skill-overlay** skill (apply mode).',
    '',
    '**Merge rules:** Upstream post-sync + static ops is the merge base. Do NOT paste previous blended output from git history or extract drafts.',
    '',
    '## Static ops (already applied)',
    '',
  ];

  if (staticOps.length === 0) {
    lines.push('_None_');
  } else {
    for (const op of staticOps) {
      lines.push(`- ${op.action}: \`${op.file}\`${op.from ? ` from \`${op.from}\`` : ''}`);
    }
  }

  lines.push('', '## Semantic changes', '');

  if (semantic.length === 0) {
    lines.push('_None — static-only overlay. Update lock file after verifying static ops._');
  } else {
    for (const [i, change] of semantic.entries()) {
      const filePath = resolve(skillDir, change.file);
      let content;
      try {
        content = await readFile(filePath, 'utf8');
      } catch {
        content = '_(file not found — check static ops or upstream sync)_';
      }

      lines.push(`### ${i + 1}. ${change.file}`, '', '**Instructions:**', '', change.instructions.trim(), '', '**Current file content:**', '', '```markdown', content, '```', '');
    }
  }

  await appendGeneratorManifestLines(lines, skillDir, generators);

  lines.push('## Completion checklist', '', APPLY_CHECKLIST, '');

  const manifestDir = getOverlayManifestDir();
  await mkdir(manifestDir, { recursive: true });
  const manifestPath = resolve(manifestDir, `${skillName}.md`);
  const manifestContent = lines.join('\n');
  await writeFile(manifestPath, manifestContent, 'utf8');

  return {
    skill: skillName,
    manifestPath,
    semanticCount: semantic.length,
    staticCount: staticOps.length,
    generatorCount: generators.length,
  };
}

export async function prepareGeneratorManifest(skillName) {
  const skills = await loadSkills();
  const skill = findSkillByName(skills, skillName);
  if (!skill) {
    throw new Error(`Skill "${skillName}" not found in skills.json`);
  }

  const generators = await resolveGeneratorsForSkill(skillName);
  if (generators.length === 0) {
    throw new Error(`Skill "${skillName}" has no generators configured`);
  }

  const skillDir = getSkillDir(skill);
  const lock = await getLockEntry(skillName);

  const lines = [
    `# Generator apply manifest: ${skillName}`,
    '',
    `**Skill dir:** skills/${skill.category}/${skillName}/`,
    `**Upstream SHA:** ${lock?.sha ?? 'unknown'}`,
    `**Synced at:** ${lock?.synced_at ?? 'unknown'}`,
    '',
    'Apply generators using the **skill-overlay** skill (apply mode).',
    '',
    '## Semantic changes',
    '',
    '_None — generators only._',
  ];

  await appendGeneratorManifestLines(lines, skillDir, generators);

  lines.push('## Completion checklist', '', APPLY_CHECKLIST.replace(
    '- [ ] Every semantic change in OVERLAY.yaml was addressed\n',
    ''
  ), '');

  const manifestDir = getOverlayManifestDir();
  await mkdir(manifestDir, { recursive: true });
  const manifestPath = resolve(manifestDir, `${skillName}.md`);
  await writeFile(manifestPath, lines.join('\n'), 'utf8');

  return {
    skill: skillName,
    manifestPath,
    semanticCount: 0,
    staticCount: 0,
    generatorCount: generators.length,
  };
}

async function prepareManifestForSkill(skillName, { runStatic = true } = {}) {
  if (await hasOverlay(skillName)) {
    return prepareOverlayManifest(skillName, { runStatic });
  }

  const generators = await resolveGeneratorsForSkill(skillName);
  if (generators.length === 0) {
    return null;
  }

  return prepareGeneratorManifest(skillName);
}

export async function prepareAllGeneratorManifests() {
  const skills = await loadSkills();
  const results = [];

  for (const skill of skills) {
    const manifest = await prepareManifestForSkill(skill.name, { runStatic: false });
    if (manifest) {
      results.push(manifest);
    }
  }

  return results;
}

export async function prepareOverlays({ skillName = null, runStatic = true } = {}) {
  if (skillName) {
    const manifest = await prepareManifestForSkill(skillName, { runStatic });
    if (!manifest) {
      throw new Error(`Skill "${skillName}" has no overlay or generators configured`);
    }
    return [manifest];
  }

  const targets = await listPendingOverlaySkills();
  if (targets.length === 0) {
    const all = await discoverOverlays();
    if (all.length === 0) return [];
    throw new Error('No pending overlays. Pass --skill to prepare a specific overlay.');
  }

  const results = [];
  for (const name of targets) {
    const manifest = await prepareManifestForSkill(name, { runStatic });
    if (manifest) {
      results.push(manifest);
    } else {
      console.warn(
        kleur.yellow(
          `Skipping ${name}: pending overlay route but no overlay or generators configured`
        )
      );
    }
  }
  return results;
}
