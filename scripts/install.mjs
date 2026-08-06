#!/usr/bin/env node

import { loadSkills } from '../lib/index.mjs';
import { discoverOverlays } from '../lib/overlays.mjs';
import { categoryCheckbox } from '../lib/category-checkbox-prompt.mjs';
import kleur from 'kleur';
import { execSync } from 'node:child_process';

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

  const skillArgs = selectedSkills.flatMap((name) => ['--skill', name]);

  try {
    execSync(['npx', 'skills', 'add', '.', ...skillArgs].join(' '), { stdio: 'inherit' });
  } catch (err) {
    process.exit(1);
  }
}

main();

