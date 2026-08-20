#!/usr/bin/env node

import { loadSkills } from '../lib/index.mjs';
import { discoverOverlays } from '../lib/overlay-pipeline.mjs';
import { categoryCheckbox } from '../lib/category-checkbox-prompt.mjs';
import kleur from 'kleur';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

function buildSkillChoice(skill, overlayNames) {
  const tags = [];
  if (!skill.source) tags.push('local');
  if (overlayNames.has(skill.name)) tags.push('overlay');
  const suffix = tags.length ? kleur.yellow(` (${tags.join(', ')})`) : '';
  return {
    name: `${skill.name}${suffix}`,
    value: skill.name,
    description: tags.join(', ') || undefined,
  };
}

export function npxSkillsAddArgs(skillNames) {
  return ['skills', 'add', '.', ...skillNames.flatMap((name) => ['--skill', name])];
}

async function main() {
  const skills = await loadSkills();
  const overlayNames = new Set(await discoverOverlays());

  const byCategory = {};
  for (const skill of skills) {
    if (!byCategory[skill.category]) {
      byCategory[skill.category] = [];
    }
    byCategory[skill.category].push(skill);
  }

  const categories = Object.keys(byCategory)
    .sort()
    .map((category) => ({
      name: category,
      choices: byCategory[category]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((skill) => buildSkillChoice(skill, overlayNames)),
    }));

  let selectedSkills = [];

  try {
    selectedSkills = await categoryCheckbox({
      message: 'Select skills to install',
      categories,
      required: false,
    });
  } catch (err) {
    if (err.name === 'ExitPromptError') {
      process.exit(0);
    }
    throw err;
  }

  if (selectedSkills.length === 0) {
    console.log(kleur.yellow('\nNo skills selected.'));
    process.exit(0);
  }

  console.log(kleur.dim(`\nInstalling ${selectedSkills.length} skill(s)...\n`));

  try {
    execFileSync('npx', npxSkillsAddArgs(selectedSkills), { stdio: 'inherit', shell: false });
  } catch {
    process.exit(1);
  }
}

const isDirectRun =
  process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isDirectRun) {
  main();
}
