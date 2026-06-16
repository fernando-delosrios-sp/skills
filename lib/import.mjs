import { readFile, mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import { resolve, relative, join } from 'node:path';
import { execSync } from 'node:child_process';
import { parse } from 'yaml';
import { loadSkills, saveSkills, findSkillByName } from './index.mjs';
import kleur from 'kleur';

const TMP_DIR = resolve(process.cwd(), '.tmp');

const GIT_EXCLUDES = new Set(['.git', '.gitmodules', '.gitattributes', '.gitignore']);

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  try {
    return parse(match[1]);
  } catch {
    return null;
  }
}

async function shallowClone(repoUrl, dest) {
  const url = repoUrl.startsWith('https://') || repoUrl.startsWith('git@')
    ? repoUrl
    : `https://github.com/${repoUrl}.git`;

  await mkdir(dest, { recursive: true });
  execSync(`git clone --depth 1 "${url}" .`, {
    cwd: dest,
    stdio: 'pipe',
    timeout: 30000,
  });
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

async function cloneRepo(repoOwner) {
  const tmpDir = resolve(TMP_DIR, repoOwner.replace('/', '_'));

  try {
    execSync(`rm -rf "${tmpDir}"`, { stdio: 'pipe' });
  } catch {}

  await mkdir(TMP_DIR, { recursive: true });
  await shallowClone(`https://github.com/${repoOwner}`, tmpDir);
  return tmpDir;
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
    return { error: `Skill "${upstreamName}" already exists in skills.yaml`, name: upstreamName };
  }

  const localSkillDir = resolve(process.cwd(), 'skills', category, upstreamName);

  await mkdir(localSkillDir, { recursive: true });
  await copySkillDir(upstreamSkillDir, localSkillDir);

  // Append to skills.yaml
  const skills = await loadSkills();
  skills.push({
    name: upstreamName,
    category,
    source: {
      repo: repoOwner,
      path: upstreamPath,
    },
    custom: false,
  });
  await saveSkills(skills);

  console.log(kleur.green(`Imported "${upstreamName}" → skills/${category}/${upstreamName}/`));
  console.log(kleur.dim(`  source: ${repoOwner}:${upstreamPath}`));

  return { name: upstreamName, category };
}

export async function importSkill(repoOwner, repoPath, category) {
  console.log(kleur.dim(`Cloning ${repoOwner}...`));
  const cloneRoot = await cloneRepo(repoOwner);

  const skills = await loadSkills();
  const existingNames = new Set(skills.map((s) => s.name));

  const result = await doImport(cloneRoot, repoOwner, repoPath, category, existingNames);
  if (result.error) {
    throw new Error(result.error);
  }
  return result;
}

export async function importAllSkills(repoOwner, category, searchPath) {
  console.log(kleur.dim(`Cloning ${repoOwner}...`));
  const cloneRoot = await cloneRepo(repoOwner);

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
    }
  }

  console.log();
  console.log(kleur.bold('Import summary:'));
  console.log(kleur.green(`  Imported: ${imported.length}`));
  console.log(kleur.yellow(`  Skipped: ${skipped.length}`));

  return { imported, skipped };
}
