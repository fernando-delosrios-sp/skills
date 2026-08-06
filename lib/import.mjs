import { readFile, mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import { resolve, relative, join } from 'node:path';
import { execSync } from 'node:child_process';
import { loadSkills, saveSkills, findSkillByName } from './index.mjs';
import { parseFrontmatter } from './skill-md.mjs';
import { prepareGeneratorManifest } from './overlay-pipeline.mjs';
import { cloneRepo } from './upstream-adapter.mjs';
import { TMP_DIR, cleanRepoClone } from './tmp.mjs';
import kleur from 'kleur';

const GIT_EXCLUDES = new Set(['.git', '.gitmodules', '.gitattributes', '.gitignore']);

async function cloneRepoToTmp(repoOwner) {
  const tmpDir = resolve(TMP_DIR, repoOwner.replace('/', '_'));

  try {
    execSync(`rm -rf "${tmpDir}"`, { stdio: 'pipe' });
  } catch {}

  await mkdir(TMP_DIR, { recursive: true });
  await cloneRepo(repoOwner, tmpDir);
  return tmpDir;
}

/**
 * Walk a directory tree, returning every SKILL.md with its relative source path.
 * The source path is the directory containing the SKILL.md, relative to clone root.
 */
async function discoverSkillPaths(cloneRoot, searchDir) {
  const results = [];

  let entries;
  try {
    entries = await readdir(searchDir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

    const fullPath = join(searchDir, entry.name);

    if (entry.isDirectory()) {
      const skillFile = join(fullPath, 'SKILL.md');
      try {
        await stat(skillFile);
        const relDir = relative(cloneRoot, fullPath);
        results.push(relDir);
      } catch {
        // No SKILL.md here, recurse one level for catalog layout
        // (don't recurse deeper than one level beyond the search dir)
        const childEntries = await readdir(fullPath, { withFileTypes: true }).catch(() => []);
        for (const child of childEntries) {
          if (child.name.startsWith('.')) continue;
          if (child.isDirectory()) {
            const nestedFile = join(fullPath, child.name, 'SKILL.md');
            try {
              await stat(nestedFile);
              const relDir = relative(cloneRoot, join(fullPath, child.name));
              results.push(relDir);
            } catch {}
          }
        }
      }
    }
  }

  return results;
}

/**
 * Recursively copy a skill directory, excluding any git metadata.
 * This prevents imported skills from leaking their upstream git history.
 */
async function copySkillDir(src, dest) {
  await mkdir(dest, { recursive: true });

  const entries = await readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    if (GIT_EXCLUDES.has(entry.name)) continue;

    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      await copySkillDir(srcPath, destPath);
    } else if (entry.isFile() || entry.isSymbolicLink()) {
      const content = await readFile(srcPath);
      await writeFile(destPath, content);
    }
  }
}

async function doImport(cloneRoot, repoOwner, upstreamPath, category, existingNames) {
  const upstreamSkillDir = resolve(cloneRoot, upstreamPath);
  let upstreamSkillFile;

  try {
    upstreamSkillFile = await readFile(resolve(upstreamSkillDir, 'SKILL.md'), 'utf8');
  } catch {
    return { error: `No SKILL.md found at ${upstreamPath}` };
  }

  const frontmatter = parseFrontmatter(upstreamSkillFile);
  if (!frontmatter || !frontmatter.name) {
    return { error: `SKILL.md at ${upstreamPath} is missing a valid frontmatter with "name"` };
  }

  const upstreamName = frontmatter.name;

  if (existingNames.has(upstreamName)) {
    return { error: `Skill "${upstreamName}" already exists in skills.json`, name: upstreamName };
  }

  const localSkillDir = resolve(process.cwd(), 'skills', category, upstreamName);

  await mkdir(localSkillDir, { recursive: true });
  await copySkillDir(upstreamSkillDir, localSkillDir);

  // Append to skills/<category>/skills.json
  const skills = await loadSkills();
  skills.push({
    name: upstreamName,
    category,
    source: {
      repo: repoOwner,
      path: upstreamPath,
    },
  });
  await saveSkills(skills);

  console.log(kleur.green(`Imported "${upstreamName}" → skills/${category}/${upstreamName}/`));
  console.log(kleur.dim(`  source: ${repoOwner}:${upstreamPath}`));

  return { name: upstreamName, category };
}

async function logGeneratorManifest(skillName, { indent = '  ', showCursorHint = false } = {}) {
  try {
    const manifest = await prepareGeneratorManifest(skillName);
    console.log(kleur.dim(`${indent}Generator manifest: ${manifest.manifestPath}`));
    if (showCursorHint) {
      console.log(kleur.dim('  In Cursor: skill-overlay apply <name>'));
    }
  } catch (err) {
    console.log(kleur.dim(`${indent}Generators: ${err.message}`));
  }
}

export async function importSkill(repoOwner, repoPath, category) {
  console.log(kleur.dim(`Cloning ${repoOwner}...`));
  let cloneRoot;
  try {
    cloneRoot = await cloneRepoToTmp(repoOwner);

    const skills = await loadSkills();
    const existingNames = new Set(skills.map((s) => s.name));

    const result = await doImport(cloneRoot, repoOwner, repoPath, category, existingNames);
    if (result.error) {
      throw new Error(result.error);
    }

    await logGeneratorManifest(result.name, { showCursorHint: true });
    return result;
  } finally {
    await cleanRepoClone(repoOwner);
  }
}

export async function importAllSkills(repoOwner, category, searchPath) {
  console.log(kleur.dim(`Cloning ${repoOwner}...`));
  let cloneRoot;
  try {
    cloneRoot = await cloneRepoToTmp(repoOwner);

    const skills = await loadSkills();
    const existingNames = new Set(skills.map((s) => s.name));

    // Determine where to search for skills
    const searchDir = searchPath
      ? resolve(cloneRoot, searchPath)
      : resolve(cloneRoot, 'skills');

    console.log(kleur.dim(`Discovering skills under ${searchPath || 'skills/'}...`));
    const discoveredPaths = await discoverSkillPaths(cloneRoot, searchDir);

    if (discoveredPaths.length === 0) {
      console.log(kleur.yellow('No skills discovered.'));
      return { imported: [], skipped: [] };
    }

    console.log(kleur.dim(`Found ${discoveredPaths.length} skill(s)\n`));

    const imported = [];
    const skipped = [];

    for (const upstreamPath of discoveredPaths) {
      const result = await doImport(cloneRoot, repoOwner, upstreamPath, category, existingNames);
      if (result.error) {
        console.log(kleur.yellow(`  Skipped: ${result.error}`));
        skipped.push({ path: upstreamPath, error: result.error });
      } else {
        imported.push(result);
        existingNames.add(result.name);
        await logGeneratorManifest(result.name, { indent: '    ' });
      }
    }

    console.log();
    console.log(kleur.bold('Import summary:'));
    console.log(kleur.green(`  Imported: ${imported.length}`));
    console.log(kleur.yellow(`  Skipped: ${skipped.length}`));

    return { imported, skipped };
  } finally {
    await cleanRepoClone(repoOwner);
  }
}
