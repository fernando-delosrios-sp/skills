import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSkills, ROOT } from './index.mjs';

export const MARKETPLACE_PATH = resolve(ROOT, '.claude-plugin/marketplace.json');

export async function buildMarketplaceManifest() {
  const skills = await loadSkills();
  const byCategory = {};

  for (const skill of skills) {
    if (!byCategory[skill.category]) {
      byCategory[skill.category] = [];
    }
    byCategory[skill.category].push(skill.name);
  }

  const plugins = Object.keys(byCategory)
    .sort()
    .map((category) => ({
      name: category,
      source: `./skills/${category}`,
      skills: byCategory[category]
        .sort((a, b) => a.localeCompare(b))
        .map((name) => `./${name}`),
    }));

  return {
    plugins,
  };
}

export function serializeMarketplaceManifest(manifest) {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

export async function writeMarketplaceManifest() {
  const manifest = await buildMarketplaceManifest();
  const content = serializeMarketplaceManifest(manifest);
  await mkdir(dirname(MARKETPLACE_PATH), { recursive: true });
  await writeFile(MARKETPLACE_PATH, content, 'utf8');
  return manifest;
}

export async function validateMarketplaceManifest() {
  const expected = serializeMarketplaceManifest(await buildMarketplaceManifest());
  let actual;

  try {
    actual = await readFile(MARKETPLACE_PATH, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      return {
        ok: false,
        message: 'Missing .claude-plugin/marketplace.json — run: node lib/marketplace-manifest.mjs',
      };
    }
    throw err;
  }

  if (actual !== expected) {
    return {
      ok: false,
      message:
        '.claude-plugin/marketplace.json is out of sync with skills.json manifests — run: node lib/marketplace-manifest.mjs',
    };
  }

  return { ok: true };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const manifest = await writeMarketplaceManifest();
  console.log(`Wrote ${MARKETPLACE_PATH} (${manifest.plugins.length} categories)`);
}
