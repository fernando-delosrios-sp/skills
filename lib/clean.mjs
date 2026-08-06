import kleur from 'kleur';
import { cleanTmp } from './tmp.mjs';

export async function runClean({
  clones = true,
  manifests = false,
  appliedManifestsOnly = true,
  skill = null,
  all = false,
} = {}) {
  const result = await cleanTmp({
    clones: all ? false : clones,
    manifests,
    appliedManifestsOnly,
    skill,
    all,
  });

  if (all) {
    if (result.clones.length > 0) {
      console.log(kleur.green('Removed .tmp/'));
    } else {
      console.log(kleur.dim('Nothing to clean (.tmp/ not present)'));
    }
    return result;
  }

  if (result.clones.length === 0 && result.manifests.length === 0) {
    console.log(kleur.dim('Nothing to clean'));
    return result;
  }

  if (result.clones.length > 0) {
    console.log(kleur.green(`Removed ${result.clones.length} clone cache(s):`));
    for (const name of result.clones) {
      console.log(kleur.dim(`  .tmp/${name}/`));
    }
  }

  if (result.manifests.length > 0) {
    console.log(kleur.green(`Removed ${result.manifests.length} overlay manifest(s):`));
    for (const name of result.manifests) {
      console.log(kleur.dim(`  .tmp/overlay-apply/${name}.md`));
    }
  }

  return result;
}
