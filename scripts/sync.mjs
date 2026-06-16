#!/usr/bin/env node

import { Command } from 'commander';
import { importSkill, importAllSkills } from '../lib/import.mjs';
import { syncAllSkills, applyLocalChanges } from '../lib/sync.mjs';
import { validateRepo } from '../lib/validate.mjs';
import { loadSkills } from '../lib/index.mjs';
import { commitFiles, openPR, addLabels, createBranch, getOctokit, parseRepoRef, enableAutoMerge, getDefaultBranch } from '../lib/github.mjs';
import { mkdir, writeFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import kleur from 'kleur';

const ROOT = process.cwd();

async function generatePRBody(results) {
  const lines = ['## Sync results\n'];

  for (const r of results) {
    switch (r.status) {
      case 'unchanged':
        lines.push(`- **${r.skill}**: no changes`);
        break;
      case 'changed': {
        const label = r.custom ? '[custom: true — manual review]' : '[auto-merge]';
        lines.push(`- **${r.skill}** ${label}`);
        for (const change of r.changes) {
          lines.push(`  - ${change.action}: \`${change.path}\``);
        }
        break;
      }
      case 'alert':
        lines.push(`- **${r.skill}**: ${kleur.yellow('⚠')} ${r.reason}`);
        break;
      case 'error':
        lines.push(`- **${r.skill}**: ${kleur.red('✗')} ${r.reason}`);
        break;
      case 'skipped':
        break;
    }
  }

  return lines.join('\n');
}

const program = new Command();

program
  .name('skills-tool')
  .description('Manage the agent skills collection')
  .version('0.1.0');

program
  .command('import')
  .description('Import a foreign skill into the repo')
  .requiredOption('--repo <owner/repo>', 'Source repo (e.g. vercel-labs/agent-skills)')
  .option('--path <path>', 'Path within the source repo to a single skill or search root for --all')
  .requiredOption('--category <category>', 'Local category for the skill(s)')
  .option('--all', 'Import all discoverable skills from the repo')
  .action(async (options) => {
    if (options.all) {
      try {
        await importAllSkills(options.repo, options.category, options.path || null);
      } catch (err) {
        console.error(kleur.red(`Error: ${err.message}`));
        process.exit(1);
      }
      return;
    }

    if (!options.path) {
      console.error(kleur.red('Error: --path is required unless --all is used'));
      process.exit(1);
    }

    try {
      await importSkill(options.repo, options.path, options.category);
    } catch (err) {
      console.error(kleur.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('sync')
  .description('Sync all foreign skills with upstream (local mode by default; CI mode in GitHub Actions)')
  .option('--dry-run', 'Check for changes without committing or opening a PR')
  .action(async (options) => {
    console.log(kleur.bold('Syncing skills...\n'));

    const results = await syncAllSkills();
    const changed = results.filter((r) => r.status === 'changed');
    const autoMerge = changed.filter((r) => !r.custom);
    const manualReview = changed.filter((r) => r.custom);

    // Print summary
    console.log();
    console.log(kleur.bold('Summary:'));
    console.log(kleur.dim(`  Total skills checked: ${results.length}`));
    console.log(kleur.green(`  Unchanged: ${results.filter((r) => r.status === 'unchanged').length}`));
    console.log(kleur.yellow(`  Changed (auto-merge): ${autoMerge.length}`));
    console.log(kleur.yellow(`  Changed (manual review): ${manualReview.length}`));
    console.log(kleur.red(`  Alerts: ${results.filter((r) => r.status === 'alert').length}`));
    console.log(kleur.red(`  Errors: ${results.filter((r) => r.status === 'error').length}`));

    const alerts = results.filter((r) => r.status === 'alert');
    for (const alert of alerts) {
      console.log(kleur.yellow(`  ⚠ ${alert.skill}: ${alert.reason}`));
    }

    const errors = results.filter((r) => r.status === 'error');
    for (const error of errors) {
      console.log(kleur.red(`  ✗ ${error.skill}: ${error.reason}`));
    }

    if (changed.length === 0) {
      console.log(kleur.green('\nNo changes to sync.'));
      return;
    }

    if (options.dryRun) {
      console.log(kleur.yellow('\nDry run — no changes applied.'));
      for (const r of changed) {
        console.log(kleur.dim(`\n  ${r.skill}:`));
        for (const change of r.changes) {
          console.log(kleur.dim(`    ${change.action}: ${change.path}`));
        }
      }
      return;
    }

    const isCI = process.env.GITHUB_ACTIONS === 'true';

    if (!isCI) {
      console.log(kleur.dim('\nApplying changes locally...'));
      await applyLocalChanges(results);
      console.log(kleur.green(`\nApplied changes to ${changed.length} skill(s) locally.`));

      const customChanged = changed.filter((r) => r.custom);
      if (customChanged.length > 0) {
        console.log(kleur.yellow('\nThe following customized skills were updated locally; review before committing:'));
        for (const r of customChanged) {
          console.log(kleur.yellow(`  - ${r.skill}`));
        }
      }

      console.log(kleur.dim('Run git diff to review the changes before committing.'));
      return;
    }

    // GitHub Actions mode
    if (!process.env.GITHUB_TOKEN) {
      console.error(kleur.red('\nGITHUB_TOKEN not set. Cannot sync in GitHub Actions mode.'));
      process.exit(1);
    }

    const octokit = getOctokit();
    const { owner, repo } = parseRepoRef(process.env.GITHUB_REPOSITORY || 'fernando-delosrios-sp/skills');

    // Get the event ref (branch or PR head)
    const ref = process.env.GITHUB_REF || 'refs/heads/main';
    const baseBranch = ref.replace('refs/heads/', '');

    const today = new Date().toISOString().slice(0, 10);
    const branchName = `sync/${today}`;

    // Apply file changes locally for each changed skill
    for (const r of changed) {
      for (const upFile of r.upstreamFiles) {
        const relPath = upFile.path.replace(upFile.upstreamRoot + '/', '');
        const localPath = resolve(r.localSkillDir, relPath);
        await mkdir(resolve(localPath, '..'), { recursive: true });
        await writeFile(localPath, upFile.content, 'utf8');
      }
    }

    // Read all changed files to prepare the commit
    const filesToCommit = [];
    for (const r of changed) {
      for (const upFile of r.upstreamFiles) {
        const relPath = upFile.path.replace(upFile.upstreamRoot + '/', '');
        const repoRelPath = `skills/${r.skill}/${relPath}`;
        filesToCommit.push({ path: repoRelPath, content: upFile.content });
      }
    }

    console.log(kleur.dim(`\nCreating branch ${branchName}...`));
    await createBranch(octokit, { owner, repo }, branchName, baseBranch);

    console.log(kleur.dim(`Committing ${filesToCommit.length} files...`));
    const skillNames = changed.map((r) => r.skill).join(', ');
    await commitFiles(
      octokit,
      { owner, repo },
      branchName,
      filesToCommit,
      `sync: update ${skillNames}`
    );

    // Build PR body
    const body = await generatePRBody(results);

    // Determine PR title
    const title = autoMerge.length > 0
      ? `sync: update ${changed.map((r) => r.skill).join(', ')}`
      : `sync: review customized skills (${changed.map((r) => r.skill).join(', ')})`;

    console.log(kleur.dim('Opening PR...'));
    const pr = await openPR(octokit, { owner, repo }, branchName, baseBranch, title, body);
    console.log(kleur.green(`\nPR opened: ${pr.html_url}`));

    // Add labels
    const labels = ['sync'];
    if (manualReview.length > 0) labels.push('customized');
    if (autoMerge.length > 0) labels.push('auto-merge');
    await addLabels(octokit, { owner, repo }, pr.number, labels);

    // Enable auto-merge for the PR (GitHub will auto-merge after CI passes)
    if (autoMerge.length > 0 && manualReview.length === 0) {
      try {
        await enableAutoMerge(octokit, { owner, repo }, pr.number);
        console.log(kleur.dim('Auto-merge enabled'));
      } catch (err) {
        console.log(kleur.yellow(`Could not enable auto-merge: ${err.message}`));
      }
    }

    if (manualReview.length > 0) {
      console.log(kleur.yellow('\nThe following skills have custom: true and need manual review:'));
      for (const r of manualReview) {
        console.log(kleur.yellow(`  - ${r.skill}`));
      }
    }
  });

program
  .command('validate')
  .description('Validate skills.yaml and all SKILL.md files')
  .action(async () => {
    const errors = await validateRepo();

    if (errors.length === 0) {
      console.log(kleur.green('✓ All validations passed'));
      return;
    }

    console.log(kleur.red(`\n${errors.length} validation error(s):\n`));
    for (const err of errors) {
      const prefix = err.type ? kleur.dim(`[${err.type}]`) : '';
      console.log(`  ${prefix} ${err.message}`);
    }
    process.exit(1);
  });

program.parse();
