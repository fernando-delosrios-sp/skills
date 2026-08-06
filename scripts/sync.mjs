#!/usr/bin/env node

import { Command } from 'commander';
import { importSkill, importAllSkills } from '../lib/import.mjs';
import { syncAllSkills, printSyncSummary } from '../lib/sync.mjs';
import {
  applyStaticOverlays,
  prepareOverlays,
  prepareAllGeneratorManifests,
  extractOverlay,
  extractAllOverlays,
  auditAllSkills,
  restoreAllSkills,
  printOverlayApplyPrompt,
} from '../lib/overlay-pipeline.mjs';
import { runUpdate } from '../lib/update.mjs';
import { runClean } from '../lib/clean.mjs';
import { validateRepo, validateStructure } from '../lib/validate.mjs';
import kleur from 'kleur';

const program = new Command();

program
  .name('skills-tool')
  .description('Manage the agent skills collection')
  .version('0.2.0');

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
  .description('Sync all foreign skills with upstream (local-only; overwrites skill dirs)')
  .option('--dry-run', 'Check for upstream changes without writing files')
  .action(async (options) => {
    console.log(kleur.bold('Syncing skills...\n'));

    const results = await syncAllSkills({ dryRun: options.dryRun });
    printSyncSummary(results);

    if (options.dryRun) {
      console.log(kleur.yellow('\nDry run — no changes applied.'));
    } else {
      const updated = results.filter((r) => r.status === 'updated' || r.status === 'updated_clean');
      if (updated.length > 0) {
        console.log(kleur.dim('\nRun git diff to review upstream changes before committing.'));
      }
    }
  });

const overlay = program
  .command('overlay')
  .description('Apply or prepare skill overlays');

overlay
  .command('static')
  .description('Apply static overlay file ops (add/remove/replace)')
  .option('--skill <name>', 'Apply for a single skill')
  .option('--dry-run', 'Report ops without writing files')
  .action(async (options) => {
    try {
      const results = await applyStaticOverlays({
        skillName: options.skill || null,
        dryRun: options.dryRun,
      });

      if (results.length === 0) {
        console.log(kleur.yellow('No overlays found.'));
      } else {
        for (const r of results) {
          console.log(kleur.bold(`\n${r.skill}:`));
          if (r.applied.length === 0) {
            console.log(kleur.dim('  No static ops'));
          } else {
            for (const op of r.applied) {
              console.log(kleur.green(`  ${op.action}: ${op.file}`));
            }
          }
          if (r.hasSemantic) {
            console.log(kleur.yellow(`  ${r.semanticCount} semantic change(s) still pending`));
          }
        }
      }

      if (!options.dryRun) {
        console.log(kleur.dim('\nNext: npm run overlay prepare'));
      }
    } catch (err) {
      console.error(kleur.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

overlay
  .command('audit')
  .description('Audit overlay routing (restore vs remerge) per skill')
  .option('--skill <name>', 'Audit a single skill')
  .option('--json', 'Emit JSON only')
  .action(async (options) => {
    try {
      const results = await auditAllSkills({ skillName: options.skill || null });

      if (options.json) {
        console.log(JSON.stringify(results, null, 2));
        return;
      }

      if (results.length === 0) {
        console.log(kleur.yellow('No overlaid or generator skills to audit.'));
        return;
      }

      console.log(kleur.bold('\nOverlay audit:'));
      for (const r of results) {
        const color =
          r.route === 'restore'
            ? kleur.green
            : r.route === 'remerge' || r.route === 'fresh'
              ? kleur.yellow
              : kleur.dim;
        console.log(color(`  ${r.skill}: ${r.route} — ${r.reason}`));
        if (r.upstream_changed || r.overlay_changed) {
          console.log(
            kleur.dim(
              `    upstream_changed=${r.upstream_changed} overlay_changed=${r.overlay_changed}`
            )
          );
        }
      }
    } catch (err) {
      console.error(kleur.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

overlay
  .command('restore')
  .description('Restore blended skills from git when upstream and overlay are unchanged')
  .option('--skill <name>', 'Restore a single skill')
  .option('--dry-run', 'Report restore candidates without checking out files')
  .action(async (options) => {
    try {
      const results = await restoreAllSkills({
        skillName: options.skill || null,
        dryRun: options.dryRun || false,
      });

      const restored = results.filter((r) => r.status === 'restored' || r.status === 'dry_run');
      const skipped = results.filter((r) => r.status === 'skipped');
      const errors = results.filter((r) => r.status === 'error');

      if (restored.length > 0) {
        console.log(kleur.bold(`\n${options.dryRun ? 'Would restore' : 'Restored'}:`));
        for (const r of restored) {
          console.log(kleur.green(`  ${r.skill} ← ${r.blended_ref}`));
        }
      }

      if (skipped.length > 0) {
        console.log(kleur.dim('\nSkipped:'));
        for (const r of skipped) {
          console.log(kleur.dim(`  ${r.skill}: ${r.reason}`));
        }
      }

      for (const r of errors) {
        console.log(kleur.red(`  ${r.skill}: ${r.reason}`));
      }

      if (results.length === 0) {
        console.log(kleur.yellow('No skills to restore.'));
      }
    } catch (err) {
      console.error(kleur.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

overlay
  .command('prepare')
  .description('Run static ops and write agent apply manifests')
  .option('--skill <name>', 'Prepare for a single skill')
  .option('--no-static', 'Skip static ops (assume already applied)')
  .action(async (options) => {
    try {
      const results = await prepareOverlays({
        skillName: options.skill || null,
        runStatic: options.static !== false,
      });

      if (results.length === 0) {
        console.log(kleur.yellow('No overlays to prepare.'));
        return;
      }

      console.log(kleur.bold('\nManifests written:'));
      for (const r of results) {
        console.log(kleur.green(`  ${r.skill}: ${r.manifestPath}`));
        console.log(
          kleur.dim(
            `    ${r.semanticCount} semantic, ${r.staticCount} static, ${r.generatorCount ?? 0} generators`
          )
        );
      }

      printOverlayApplyPrompt({
        skillNames: options.skill ? [options.skill] : results.map((result) => result.skill),
      });
    } catch (err) {
      console.error(kleur.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

overlay
  .command('prepare-generators')
  .description('Write generator apply manifests for skills (all skills or one)')
  .option('--skill <name>', 'Prepare for a single skill')
  .option('--all', 'Prepare manifests for every skill with configured generators')
  .action(async (options) => {
    try {
      let results;
      if (options.all) {
        results = await prepareAllGeneratorManifests();
      } else if (options.skill) {
        results = await prepareOverlays({ skillName: options.skill, runStatic: false });
      } else {
        console.error(kleur.red('Error: pass --skill <name> or --all'));
        process.exit(1);
      }

      if (results.length === 0) {
        console.log(kleur.yellow('No generator manifests to write.'));
        return;
      }

      console.log(kleur.bold('\nManifests written:'));
      for (const r of results) {
        console.log(kleur.green(`  ${r.skill}: ${r.manifestPath}`));
        console.log(kleur.dim(`    ${r.generatorCount ?? 0} generator(s)`));
      }

      printOverlayApplyPrompt({
        skillNames: options.skill ? [options.skill] : results.map((result) => result.skill),
      });
    } catch (err) {
      console.error(kleur.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('update')
  .description('Sync upstream, apply static overlays, audit, auto-restore, prepare remerge manifests')
  .option('--dry-run', 'Report changes without writing files')
  .option('--skill <name>', 'Update a single skill')
  .option('--skip-sync', 'Skip upstream sync (overlay static and prepare only)')
  .option('--no-prepare', 'Skip writing overlay apply manifests')
  .action(async (options) => {
    try {
      await runUpdate({
        dryRun: options.dryRun || false,
        skillName: options.skill || null,
        skipSync: options.skipSync || false,
        skipPrepare: options.noPrepare || false,
      });
    } catch (err) {
      console.error(kleur.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('extract-overlay')
  .description('Draft overlay(s) from local customizations vs upstream')
  .option('--skill <name>', 'Extract for a single skill (default: all sourced skills)')
  .option('--from-agents', 'Compare against .agents/skills/ instead of skills/')
  .option('--from-commit <ref>', 'Compare against a git ref (default: working tree; use HEAD for last commit)')
  .option('--force', 'Overwrite existing OVERLAY.yaml')
  .action(async (options) => {
    try {
      const fromCommit = options.fromCommit || null;

      if (options.skill) {
        const result = await extractOverlay(options.skill, {
          fromAgents: options.fromAgents,
          fromCommit,
          force: options.force || false,
        });

        if (result.status === 'skipped') {
          console.log(kleur.yellow(`\n${result.skill}: ${result.reason}`));
          return;
        }

        console.log(kleur.green(`\nDraft overlay written to overlays/${result.skill}/`));
        console.log(kleur.dim(`  ${result.changeCount} change(s) detected`));
      } else {
        console.log(kleur.bold('Extracting overlays...\n'));
        const results = await extractAllOverlays({
          fromCommit,
          fromAgents: options.fromAgents,
          force: options.force || false,
        });

        const created = results.filter((r) => r.status === 'created');
        const skipped = results.filter((r) => r.status === 'skipped');
        const errors = results.filter((r) => r.status === 'error');

        for (const result of created) {
          console.log(kleur.green(`  ${result.skill}: ${result.changeCount} change(s)`));
        }
        for (const result of skipped) {
          console.log(kleur.dim(`  ${result.skill}: ${result.reason}`));
        }
        for (const result of errors) {
          console.log(kleur.red(`  ${result.skill}: ${result.reason}`));
        }

        console.log(kleur.dim(`\n${created.length} created, ${skipped.length} skipped, ${errors.length} error(s)`));
      }

      console.log(kleur.yellow('\nReview and refine OVERLAY.yaml files before relying on them.'));
    } catch (err) {
      console.error(kleur.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('clean')
  .description('Remove .tmp clone caches and optional overlay apply manifests')
  .option('--manifests', 'Also remove overlay apply manifests (applied overlays only by default)')
  .option('--pending-manifests', 'Remove manifests even when overlay apply is still pending')
  .option('--skill <name>', 'Remove overlay manifest for one skill (implies --manifests)')
  .option('--all', 'Remove entire .tmp directory')
  .option('--no-clones', 'Skip clone cache cleanup')
  .action(async (options) => {
    try {
      await runClean({
        clones: options.clones !== false && !options.all,
        manifests: options.manifests || Boolean(options.skill),
        appliedManifestsOnly: !options.pendingManifests,
        skill: options.skill || null,
        all: options.all || false,
      });
    } catch (err) {
      console.error(kleur.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate skills.json manifests, SKILL.md files, and overlays')
  .option('--structure-only', 'Run structure validation only (no git blend checks)')
  .action(async (options) => {
    const { errors, warnings } = options.structureOnly
      ? await validateStructure()
      : await validateRepo();

    for (const warn of warnings) {
      const prefix = warn.type ? kleur.dim(`[${warn.type}]`) : '';
      console.log(kleur.yellow(`  ${prefix} ${warn.message}`));
    }

    if (errors.length === 0) {
      console.log(kleur.green('✓ All validations passed'));
      if (warnings.length > 0) {
        console.log(kleur.yellow(`  (${warnings.length} warning(s))`));
      }
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
