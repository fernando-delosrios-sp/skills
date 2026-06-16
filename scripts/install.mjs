#!/usr/bin/env node

import { loadSkills } from '../lib/index.mjs';
import kleur from 'kleur';
import prompts from 'prompts';
import { execSync } from 'node:child_process';

async function main() {
  const skills = await loadSkills();

  const byCategory = {};
  for (const skill of skills) {
    if (!byCategory[skill.category]) {
      byCategory[skill.category] = [];
    }
    byCategory[skill.category].push(skill);
  }

  const categories = Object.keys(byCategory).sort();

  console.log(kleur.bold('\nSelect skills to install:\n'));

  const selectedSkills = [];

  for (const category of categories) {
    const categorySkills = byCategory[category].sort((a, b) => a.name.localeCompare(b.name));

    const choices = categorySkills.map((skill) => ({
      title: `${skill.name}${skill.custom ? kleur.yellow(' *') : ''}`,
      value: skill.name,
      description: skill.custom ? 'custom' : '',
    }));

    const response = await prompts({
      type: 'multiselect',
      name: 'skills',
      message: kleur.cyan(category),
      choices,
      hint: '- space to toggle, return to confirm',
    });

    if (response.skills && response.skills.length > 0) {
      selectedSkills.push(...response.skills);
    }
  }

  if (selectedSkills.length === 0) {
    console.log(kleur.yellow('\nNo skills selected.'));
    process.exit(0);
  }

  console.log(kleur.dim(`\nInstalling ${selectedSkills.length} skill(s)...\n`));

  try {
    execSync(`skills add . --skill ${selectedSkills.join(',')}`, { stdio: 'inherit' });
  } catch (err) {
    process.exit(1);
  }
}

main();
