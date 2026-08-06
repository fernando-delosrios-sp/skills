import {
  readFile,
  writeFile,
  readdir,
  mkdir,
  rm,
  cp,
  access,
  stat,
} from 'node:fs/promises';
import { resolve, relative, dirname, join } from 'node:path';
import { parse, stringify } from 'yaml';
import { execSync } from 'node:child_process';
import {
  ROOT,
  loadSkills,
  findSkillByName,
  getSkillDir,
  getOverlayDir,
  getOverlayManifestDir,
} from './index.mjs';
import { loadLocks, getLockEntry, isOverlayPending } from './locks.mjs';
import { resolveGeneratorsForSkill } from './generator-config.mjs';
import { TMP_DIR, cleanExtractClone } from './tmp.mjs';

export async function discoverOverlays() {
  const overlaysRoot = resolve(ROOT, 'overlays');
  let entries;
  try {
    entries = await readdir(overlaysRoot, { withFileTypes: true });
  } catch {
    return [];
  }

  const overlays = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
    const overlayFile = resolve(overlaysRoot, entry.name, 'OVERLAY.yaml');
    try {
      await access(overlayFile);
      overlays.push(entry.name);
    } catch {}
  }
  return overlays;
}

export async function loadOverlay(skillName) {
  const overlayDir = getOverlayDir(skillName);
  const overlayFile = resolve(overlayDir, 'OVERLAY.yaml');
  const raw = await readFile(overlayFile, 'utf8');
  const doc = parse(raw);
  if (!doc || typeof doc !== 'object') {
    throw new Error(`Invalid OVERLAY.yaml for ${skillName}`);
  }
  if (doc.skill !== skillName) {
    throw new Error(
      `OVERLAY.yaml skill "${doc.skill}" does not match directory "${skillName}"`
    );
  }
  if (doc.changes !== undefined && !Array.isArray(doc.changes)) {
    throw new Error(`OVERLAY.yaml for ${skillName}: "changes" must be an array when present`);
  }
  if (doc.generators !== undefined && typeof doc.generators !== 'object') {
    throw new Error(`OVERLAY.yaml for ${skillName}: "generators" must be an object when present`);
  }
  return { ...doc, changes: doc.changes ?? [], _dir: overlayDir };
}

export function partitionChanges(changes) {
  const semantic = [];
  const staticOps = [];
  for (const change of changes) {
    if (change.action) {
      staticOps.push(change);
    } else if (change.file && change.instructions) {
      semantic.push(change);
    } else {
      throw new Error(
        'Each change must be semantic { file, instructions } or static { action, file }'
      );
    }
  }
  return { semantic, staticOps };
}

export async function hasOverlay(skillName) {
  try {
    await access(resolve(getOverlayDir(skillName), 'OVERLAY.yaml'));
    return true;
  } catch {
    return false;
  }
}

export async function listPendingOverlaySkills() {
  const overlayNames = await discoverOverlays();
  const pending = [];
  for (const name of overlayNames) {
    const lock = await getLockEntry(name);
    if (isOverlayPending(lock)) {
      pending.push(name);
    }
  }
  return pending;
}

export async function applyStaticOverlay(skillName, { dryRun = false } = {}) {
  const overlay = await loadOverlay(skillName);
  const skills = await loadSkills();
  const skill = findSkillByName(skills, skillName);
  if (!skill) {
    throw new Error(`Skill "${skillName}" not found in skills.json`);
  }

  const { staticOps } = partitionChanges(overlay.changes);
  const skillDir = getSkillDir(skill);
  const applied = [];

  for (const op of staticOps) {
    const targetPath = resolve(skillDir, op.file);
    if (op.action === 'add' || op.action === 'replace') {
      if (!op.from) {
        throw new Error(`Static ${op.action} for ${op.file} requires "from"`);
      }
      const sourcePath = resolve(overlay._dir, op.from);
      try {
        await access(sourcePath);
      } catch {
        throw new Error(`Static source not found: ${op.from} (overlay ${skillName})`);
      }
      if (!dryRun) {
        await mkdir(dirname(targetPath), { recursive: true });
        await cp(sourcePath, targetPath);
      }
      applied.push({ action: op.action, file: op.file, from: op.from });
    } else if (op.action === 'remove') {
      if (!dryRun) {
        await rm(targetPath, { force: true });
      }
      applied.push({ action: 'remove', file: op.file });
    } else {
      throw new Error(`Unknown static action: ${op.action}`);
    }
  }

  const { semantic } = partitionChanges(overlay.changes);
  return { applied, hasSemantic: semantic.length > 0, semanticCount: semantic.length };
}

export async function applyStaticOverlays({
  skillName = null,
  dryRun = false,
} = {}) {
  let targets;
  if (skillName) {
    targets = (await hasOverlay(skillName)) ? [skillName] : [];
  } else {
    targets = await discoverOverlays();
  }

  const results = [];

  for (const name of targets) {
    const result = await applyStaticOverlay(name, { dryRun });
    results.push({ skill: name, ...result });
  }

  return results;
}

const APPLY_CHECKLIST = `- [ ] Every semantic change in OVERLAY.yaml was addressed
- [ ] Every generator in the resolved generator list was addressed
- [ ] SKILL.md frontmatter has valid name and description
- [ ] No placeholder text left from drafting
- [ ] Cross-references between files still resolve
- [ ] Instruction intent is met — not just diff minimization
- [ ] Run \`npm run validate\` and fix any issues before updating the lock file
- [ ] Update \`.locks/upstream.json\` overlay_applied_at for this skill when applicable`;

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
    '',
    'Apply semantic changes using the **apply-skill-overlay** skill.',
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
    'Apply generators using the **apply-skill-overlay** skill.',
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

export async function prepareAllGeneratorManifests() {
  const skills = await loadSkills();
  const results = [];

  for (const skill of skills) {
    const generators = await resolveGeneratorsForSkill(skill.name);
    if (generators.length === 0) continue;

    if (await hasOverlay(skill.name)) {
      results.push(await prepareOverlayManifest(skill.name, { runStatic: false }));
    } else {
      results.push(await prepareGeneratorManifest(skill.name));
    }
  }

  return results;
}

export async function prepareOverlays({ skillName = null, runStatic = true } = {}) {
  if (skillName) {
    if (await hasOverlay(skillName)) {
      return [await prepareOverlayManifest(skillName, { runStatic })];
    }
    return [await prepareGeneratorManifest(skillName)];
  }

  const targets = await listPendingOverlaySkills();
  if (targets.length === 0) {
    const all = await discoverOverlays();
    if (all.length === 0) return [];
    throw new Error('No pending overlays. Pass --skill to prepare a specific overlay.');
  }

  const results = [];
  for (const name of targets) {
    results.push(await prepareOverlayManifest(name, { runStatic }));
  }
  return results;
}

async function shallowClone(repoUrl, dest) {
  const url = repoUrl.startsWith('https://') || repoUrl.startsWith('git@')
    ? repoUrl
    : `https://github.com/${repoUrl}.git`;

  await mkdir(dest, { recursive: true });
  execSync(`git clone --depth 1 "${url}" .`, {
    cwd: dest,
    stdio: 'pipe',
    timeout: 60000,
  });
}

async function collectFiles(dir, baseDir = dir) {
  const result = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === '.git') continue;
    const fullPath = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...(await collectFiles(fullPath, baseDir)));
    } else {
      const content = await readFile(fullPath, 'utf8');
      result.push({ relPath: relative(baseDir, fullPath), content });
    }
  }
  return result;
}

function summarizeDiff(upstreamFiles, localFiles) {
  const upMap = new Map(upstreamFiles.map((f) => [f.relPath, f.content]));
  const localMap = new Map(localFiles.map((f) => [f.relPath, f.content]));
  const changes = [];

  for (const [path, content] of upMap) {
    if (!localMap.has(path)) {
      changes.push({ type: 'upstream_only', file: path, content });
    } else if (localMap.get(path) !== content) {
      changes.push({ type: 'modify', file: path, upstream: content, local: localMap.get(path) });
    }
  }

  for (const [path, content] of localMap) {
    if (!upMap.has(path)) {
      changes.push({ type: 'local_only', file: path, content });
    }
  }

  return changes;
}

function gitShow(ref, path) {
  try {
    return execSync(`git show ${ref}:${path.replace(/'/g, "'\\''")}`, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch {
    return null;
  }
}

function gitLsTree(ref, prefix) {
  try {
    return execSync(`git ls-tree -r ${ref} --name-only ${prefix}`, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    })
      .trim()
      .split('\n')
      .filter(Boolean);
  } catch {
    return [];
  }
}

async function collectFilesFromGitRef(gitPrefix, ref = 'HEAD') {
  const files = [];
  for (const rel of gitLsTree(ref, gitPrefix)) {
    const content = gitShow(ref, rel);
    if (content !== null) {
      files.push({ relPath: relative(gitPrefix, rel), content });
    }
  }
  return files;
}

async function shouldSkipLocalOnlyFile(change, upstreamFiles, skillName) {
  const { isGeneratedPathForSkill } = await import('./generator-config.mjs');
  if (!(await isGeneratedPathForSkill(skillName, change.file))) return false;
  return !upstreamFiles.some((f) => f.relPath === change.file);
}

async function diffToOverlayChanges(diff, { upstreamFiles, skillName, localFiles, skill }) {
  const { isGeneratedPathForSkill, expectedContentForPath } = await import('./generator-config.mjs');
  const overlayChanges = [];

  for (const change of diff) {
    if (change.type === 'local_only') {
      if (await shouldSkipLocalOnlyFile(change, upstreamFiles, skillName)) continue;
      overlayChanges.push({
        action: 'add',
        file: change.file,
        from: join('files', change.file),
        _content: change.content,
      });
    } else if (change.type === 'upstream_only') {
      if (await isGeneratedPathForSkill(skillName, change.file)) continue;
      overlayChanges.push({ action: 'remove', file: change.file });
    } else if (change.type === 'modify') {
      if (skill && (await isGeneratedPathForSkill(skillName, change.file))) {
        const skillDir = getSkillDir(skill);
        const derived = await expectedContentForPath(skill, change.file, { skillDir });
        if (derived !== null && derived.trim() === change.local.trim()) continue;
      }
      overlayChanges.push({
        file: change.file,
        instructions: draftInstructions(change),
      });
    }
  }

  return overlayChanges;
}

async function writeOverlayFromChanges(
  skillName,
  overlayChanges,
  { description, sourceLabel = 'local customizations' }
) {
  const overlayDir = getOverlayDir(skillName);
  const filesDir = resolve(overlayDir, 'files');
  await mkdir(overlayDir, { recursive: true });

  for (const change of overlayChanges) {
    if (change._content !== undefined) {
      const dest = resolve(filesDir, change.file);
      await mkdir(dirname(dest), { recursive: true });
      await writeFile(dest, change._content, 'utf8');
      delete change._content;
    }
  }

  const overlayDoc = {
    skill: skillName,
    description,
    changes: overlayChanges.map(({ _content, ...rest }) => rest),
  };

  await writeFile(
    resolve(overlayDir, 'OVERLAY.yaml'),
    stringify(overlayDoc, { lineWidth: 0 }),
    'utf8'
  );

  return { skill: skillName, overlayDir, changeCount: overlayChanges.length };
}

function draftInstructions(change) {
  if (change.type === 'local_only') {
    return `This file exists locally but not in upstream. Keep it via a static overlay add action instead of a semantic change.`;
  }
  if (change.type === 'upstream_only') {
    return `Remove this file from the skill tree (upstream includes it but local customization removes it).`;
  }

  const localLines = change.local.split('\n');
  const upstreamLines = change.upstream.split('\n');
  const hints = [];

  if (localLines[0]?.startsWith('---') && upstreamLines[0]?.startsWith('---')) {
    hints.push('- Review and adapt frontmatter differences.');
  }
  hints.push('- Merge local behavioral intent into the upstream file structure.');
  hints.push('- Preserve upstream sections not contradicted by local customizations.');
  hints.push('', 'Key local differences to preserve (review the diff and express intent clearly):');
  hints.push('```');
  hints.push(change.local.slice(0, 2000));
  if (change.local.length > 2000) hints.push('... (truncated)');
  hints.push('```');

  return hints.join('\n');
}

async function getUpstreamFiles(skill, cloneCache = new Map()) {
  const key = `${skill.source.repo}:${skill.source.path}`;
  if (cloneCache.has(key)) return cloneCache.get(key);

  const tmpDir = resolve(TMP_DIR, `extract_${skill.source.repo.replace('/', '_')}`);
  if (!cloneCache.has(`cloned:${skill.source.repo}`)) {
    try {
      execSync(`rm -rf "${tmpDir}"`, { stdio: 'pipe' });
    } catch {}
    await mkdir(TMP_DIR, { recursive: true });
    await shallowClone(skill.source.repo, tmpDir);
    cloneCache.set(`cloned:${skill.source.repo}`, tmpDir);
  }

  const repoDir = cloneCache.get(`cloned:${skill.source.repo}`);
  const upstreamDir = resolve(repoDir, skill.source.path);

  try {
    await access(upstreamDir);
  } catch {
    throw new Error(`upstream path not found: ${skill.source.repo}/${skill.source.path}`);
  }

  const files = await collectFiles(upstreamDir);
  cloneCache.set(key, files);
  return files;
}

async function resolveLocalFiles(skill, { fromAgents = false, fromCommit = null } = {}) {
  if (fromCommit) {
    const gitPrefix = `skills/${skill.category}/${skill.name}`;
    const files = await collectFilesFromGitRef(gitPrefix, fromCommit);
    if (files.length > 0) return files;
    return null;
  }

  const localDir = fromAgents
    ? resolve(ROOT, '.agents', 'skills', skill.name)
    : getSkillDir(skill);
  return collectFiles(localDir);
}

export async function extractOverlay(
  skillName,
  { fromAgents = false, fromCommit = null, force = false } = {}
) {
  const skills = await loadSkills();
  const skill = findSkillByName(skills, skillName);
  if (!skill?.source) {
    throw new Error(`Skill "${skillName}" has no upstream source`);
  }

  if (!force && (await hasOverlay(skillName))) {
    return { skill: skillName, status: 'skipped', reason: 'overlay already exists' };
  }

  try {
    const upstreamFiles = await getUpstreamFiles(skill);
    const localFiles = await resolveLocalFiles(skill, { fromAgents, fromCommit });

    if (!localFiles || localFiles.length === 0) {
      return {
        skill: skillName,
        status: 'skipped',
        reason: fromCommit ? `skill not present at ${fromCommit}` : 'local skill tree empty',
      };
    }

    const diff = summarizeDiff(upstreamFiles, localFiles);
    if (diff.length === 0) {
      return { skill: skillName, status: 'skipped', reason: 'identical to upstream' };
    }

    const overlayChanges = await diffToOverlayChanges(diff, {
      upstreamFiles,
      skillName,
      localFiles,
      skill,
    });

    if (overlayChanges.length === 0) {
      return { skill: skillName, status: 'skipped', reason: 'no overlay-worthy differences' };
    }

    const sourceLabel = fromCommit
      ? `customizations at ${fromCommit}`
      : fromAgents
        ? 'customizations in .agents/skills'
        : 'local customizations';

    const result = await writeOverlayFromChanges(skillName, overlayChanges, {
      description: `Draft overlay extracted from ${sourceLabel} — refine instructions before use`,
      sourceLabel,
    });

    return {
      ...result,
      status: 'created',
      fromCommit,
      fromAgents,
    };
  } finally {
    await cleanExtractClone(skill.source.repo);
  }
}

export async function extractAllOverlays({
  fromCommit = null,
  fromAgents = false,
  force = false,
} = {}) {
  const skills = await loadSkills();
  const cloneCache = new Map();
  const results = [];

  for (const skill of skills) {
    if (!skill.source) continue;
    try {
      if (!force && (await hasOverlay(skill.name))) {
        results.push({ skill: skill.name, status: 'skipped', reason: 'overlay already exists' });
        continue;
      }

      const upstreamFiles = await getUpstreamFiles(skill, cloneCache);
      const localFiles = await resolveLocalFiles(skill, { fromAgents, fromCommit });

      if (!localFiles || localFiles.length === 0) {
        results.push({
          skill: skill.name,
          status: 'skipped',
          reason: fromCommit ? `skill not present at ${fromCommit}` : 'local skill tree empty',
        });
        continue;
      }

      const diff = summarizeDiff(upstreamFiles, localFiles);
      if (diff.length === 0) {
        results.push({ skill: skill.name, status: 'skipped', reason: 'identical to upstream' });
        continue;
      }

      const overlayChanges = await diffToOverlayChanges(diff, {
        upstreamFiles,
        skillName: skill.name,
        localFiles,
        skill,
      });

      if (overlayChanges.length === 0) {
        results.push({ skill: skill.name, status: 'skipped', reason: 'no overlay-worthy differences' });
        continue;
      }

      const sourceLabel = fromCommit
        ? `customizations at ${fromCommit}`
        : fromAgents
          ? 'customizations in .agents/skills'
          : 'local customizations';

      const result = await writeOverlayFromChanges(skill.name, overlayChanges, {
        description: `Draft overlay extracted from ${sourceLabel} — refine instructions before use`,
        sourceLabel,
      });

      results.push({ ...result, status: 'created', fromCommit, fromAgents });
    } catch (err) {
      results.push({ skill: skill.name, status: 'error', reason: err.message });
    }
  }

  const repos = new Set(
    skills.filter((s) => s.source).map((s) => s.source.repo)
  );
  for (const repo of repos) {
    await cleanExtractClone(repo);
  }

  return results;
}

export async function validateOverlays(skills) {
  const errors = [];
  const warnings = [];
  const skillNames = new Set(skills.map((s) => s.name));
  const overlayNames = await discoverOverlays();
  const overlaySet = new Set(overlayNames);

  for (const name of overlayNames) {
    if (!skillNames.has(name)) {
      errors.push({
        type: 'overlay',
        message: `Overlay "${name}" has no matching skill in skills.json`,
      });
      continue;
    }

    let overlay;
    try {
      overlay = await loadOverlay(name);
    } catch (err) {
      errors.push({ type: 'overlay', message: err.message });
      continue;
    }

    const { staticOps, semantic } = partitionChanges(overlay.changes);

    for (const op of staticOps) {
      if ((op.action === 'add' || op.action === 'replace') && op.from) {
        const sourcePath = resolve(overlay._dir, op.from);
        try {
          await access(sourcePath);
        } catch {
          errors.push({
            type: 'overlay',
            message: `Overlay "${name}": static source not found: ${op.from}`,
          });
        }
      }
      if (!['add', 'remove', 'replace'].includes(op.action)) {
        errors.push({
          type: 'overlay',
          message: `Overlay "${name}": unknown action "${op.action}"`,
        });
      }
    }

    if (semantic.length === 0 && staticOps.length === 0 && !overlay.generators) {
      warnings.push({
        type: 'overlay',
        message: `Overlay "${name}" has no changes or generators defined`,
      });
    } else if (
      semantic.length === 0 &&
      staticOps.length === 0 &&
      overlay.generators &&
      !overlay.generators.disable?.length &&
      !overlay.generators.add?.length
    ) {
      warnings.push({
        type: 'overlay',
        message: `Overlay "${name}" has empty generators overrides and no changes`,
      });
    }

    const lock = await getLockEntry(name);
    if (lock && isOverlayPending(lock)) {
      warnings.push({
        type: 'overlay',
        message: `Overlay "${name}" pending apply (synced_at > overlay_applied_at)`,
      });
    }
  }

  // Orphan overlay dirs without OVERLAY.yaml are not in discoverOverlays — check raw dirs
  const overlaysRoot = resolve(ROOT, 'overlays');
  try {
    const entries = await readdir(overlaysRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
      if (!overlaySet.has(entry.name)) {
        const hasYaml = await stat(resolve(overlaysRoot, entry.name, 'OVERLAY.yaml')).then(() => true).catch(() => false);
        if (!hasYaml) {
          warnings.push({
            type: 'overlay',
            message: `Orphan overlay directory without OVERLAY.yaml: overlays/${entry.name}/`,
          });
        }
      }
    }
  } catch {}

  return { errors, warnings };
}
