import { syncAllSkills, printSyncSummary } from './sync.mjs';
import { applyStaticOverlays, prepareOverlays, hasOverlay } from './overlays.mjs';
import kleur from 'kleur';

export async function runUpdate({
  dryRun = false,
  skillName = null,
  skipSync = false,
  skipPrepare = false,
} = {}) {
  console.log(kleur.bold('Updating skills...\n'));

  let syncResults = [];
  if (!skipSync) {
    syncResults = await syncAllSkills({ dryRun });
    printSyncSummary(syncResults);
  }

  let staticResults = [];
  if (skillName) {
    if (await hasOverlay(skillName)) {
      staticResults = await applyStaticOverlays({
        skillName,
        dryRun,
      });
    }
  } else {
    staticResults = await applyStaticOverlays({
      dryRun,
    });
  }

  if (staticResults.length > 0) {
    console.log(kleur.bold('\nStatic overlays:'));
    for (const result of staticResults) {
      console.log(kleur.bold(`  ${result.skill}:`));
      if (result.applied.length === 0) {
        console.log(kleur.dim('    No static ops'));
      } else {
        for (const op of result.applied) {
          console.log(kleur.green(`    ${op.action}: ${op.file}`));
        }
      }
    }
  }

  let prepareResults = [];
  if (!skipPrepare && !dryRun) {
    try {
      prepareResults = await prepareOverlays({
        skillName,
        runStatic: false,
      });
    } catch (err) {
      if (!err.message.includes('No pending overlays') && !err.message.includes('No overlays to prepare')) {
        throw err;
      }
    }
  }

  if (prepareResults.length > 0) {
    console.log(kleur.bold('\nOverlay apply manifests:'));
    for (const result of prepareResults) {
      console.log(kleur.green(`  ${result.skill}: ${result.manifestPath}`));
      console.log(
        kleur.dim(`    ${result.semanticCount} semantic, ${result.staticCount} static, ${result.generatorCount ?? 0} generators`)
      );
    }
    console.log(kleur.dim('\nIn Cursor: "Apply overlay for <skill-name>"'));
  }

  if (dryRun) {
    console.log(kleur.yellow('\nDry run — no changes applied.'));
  }

  return { syncResults, staticResults, prepareResults };
}
