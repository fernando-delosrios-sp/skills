/**
 * Backward-compatible barrel re-export of the overlay pipeline and model layers.
 * Prefer importing from overlay-pipeline.mjs or overlay-model.mjs directly.
 */
export {
  printOverlayApplyPrompt,
  auditSkill,
  auditAllSkills,
  restoreSkill,
  restoreAllSkills,
  listPendingOverlaySkills,
  applyStaticOverlay,
  applyStaticOverlays,
  prepareOverlayManifest,
  prepareGeneratorManifest,
  prepareAllGeneratorManifests,
  prepareOverlays,
  extractOverlay,
  extractAllOverlays,
  validateOverlays,
  isBlendedRefValid,
  getCurrentOverlayHashes,
} from './overlay-pipeline.mjs';

export {
  discoverOverlays,
  loadOverlay,
  partitionChanges,
  hasOverlay,
  hashOverlay,
  hashUniversalOverlay,
} from './overlay-model.mjs';
