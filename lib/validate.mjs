import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, basename } from 'node:path';
import { parse } from 'yaml';
import { loadSkills, validateSkills } from './index.mjs';

async function walkSkillsDir(dir, depth = 0) {
  const results = [];
  let entries;

  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    const fullPath = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      const markerPath = resolve(fullPath, 'SKILL.md');
      try {
        await stat(markerPath);
        results.push({ dir: fullPath, name: basename(fullPath) });
      } catch {
        // No SKILL.md, recurse one level deeper for category layout
        if (depth < 1) {
          const nested = await walkSkillsDir(fullPath, depth + 1);
          results.push(...nested);
        }
      }
    }
  }

  return results;
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  try {
    return parse(match[1]);
  } catch {
    return null;
  }
}

export async function validateRepo() {
  const errors = [];

  // 1. Validate skills.yaml
  let skills;
  try {
    skills = await loadSkills();
    const yamlErrors = validateSkills(skills);
    errors.push(...yamlErrors.map((e) => ({ type: 'skills.yaml', ...e })));
  } catch (err) {
    errors.push({ type: 'skills.yaml', message: err.message });
    return errors;
  }

  // 2. Check all SKILL.md files under skills/
  const skillsRoot = resolve(process.cwd(), 'skills');
  const skillDirs = await walkSkillsDir(skillsRoot);

  const indexedPaths = new Set(
    skills.map((s) => resolve(skillsRoot, s.category, s.name))
  );

  for (const { dir, name } of skillDirs) {
    // Check orphaned: directory exists in filesystem but not in skills.yaml
    if (!indexedPaths.has(dir)) {
      errors.push({
        type: 'orphan',
        message: `Orphaned directory: ${dir} — exists on disk but not in skills.yaml`,
      });
      continue;
    }

    const skillFile = resolve(dir, 'SKILL.md');
    let content;
    try {
      content = await readFile(skillFile, 'utf8');
    } catch {
      errors.push({
        type: 'frontmatter',
        message: `Missing SKILL.md in ${dir}`,
        skill: name,
      });
      continue;
    }

    const frontmatter = parseFrontmatter(content);
    if (!frontmatter) {
      errors.push({
        type: 'frontmatter',
        message: `Invalid or missing frontmatter in ${skillFile}`,
        skill: name,
      });
      continue;
    }

    if (!frontmatter.name) {
      errors.push({
        type: 'frontmatter',
        message: `Missing "name" in frontmatter of ${skillFile}`,
        skill: name,
      });
    }

    if (!frontmatter.description) {
      errors.push({
        type: 'frontmatter',
        message: `Missing "description" in frontmatter of ${skillFile}`,
        skill: name,
      });
    }
  }

  // 3. Check for indexed skills not on disk
  for (const skill of skills) {
    const expectedDir = resolve(skillsRoot, skill.category, skill.name);
    const expectedFile = resolve(expectedDir, 'SKILL.md');
    try {
      await stat(expectedFile);
    } catch {
      errors.push({
        type: 'missing',
        message: `Skill "${skill.name}" listed in skills.yaml but SKILL.md not found at ${expectedFile}`,
        skill: skill.name,
      });
    }
  }

  return errors;
}
