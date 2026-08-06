## 1. Extract overlay model layer

- [x] 1.1 Create `lib/overlay-model.mjs` with `discoverOverlays`, `loadOverlay`, `partitionChanges`, `hasOverlay`, `hashOverlay`, `hashUniversalOverlay`, and private `hashEntries`/`collectFiles` helpers
- [x] 1.2 Move `hashUniversalOverlay` dependency on `GLOBAL_OVERLAY_PATH` from `generator-config.mjs` import into model layer
- [x] 1.3 Update `lib/generator-config.mjs` to import `hasOverlay` and `loadOverlay` from `overlay-model.mjs` instead of `overlays.mjs`
- [x] 1.4 Verify no git I/O remains in `overlay-model.mjs`

## 2. Extract static operations submodule

- [x] 2.1 Create `lib/overlay-static.mjs` with `applyStaticOverlay` and `applyStaticOverlays`
- [x] 2.2 Wire static module to import `loadOverlay`, `partitionChanges` from `overlay-model.mjs` and skill paths from `index.mjs`

## 3. Extract audit logic (internal helper)

- [x] 3.1 Create internal `lib/overlay-audit.mjs` with `auditSkill`, `auditAllSkills`, `isBlendedRefValid`, `getCurrentOverlayHashes`, and `listPendingOverlaySkills`
- [x] 3.2 Add optional dependency injection params (`lockLookup`, `blendedRefValidator`, `hashProvider`) with defaults to real implementations
- [x] 3.3 Keep `getGitSkillPrefix` in audit module for now (defer to skill-paths #5)

## 4. Extract manifest preparation submodule

- [x] 4.1 Create `lib/overlay-manifest.mjs` with `prepareOverlayManifest`, `prepareGeneratorManifest`, `prepareAllGeneratorManifests`, `prepareOverlays`, and private helpers (`prepareManifestForSkill`, `appendGeneratorManifestLines`, `APPLY_CHECKLIST`)
- [x] 4.2 Import `auditSkill` from `overlay-audit.mjs` (not pipeline) to avoid circular dependency
- [x] 4.3 Import static apply from `overlay-static.mjs` when `runStatic: true`

## 5. Extract overlay draft extraction submodule

- [x] 5.1 Create `lib/overlay-extract.mjs` with `extractOverlay`, `extractAllOverlays`, and private helpers (`shallowClone`, `collectFiles`, `summarizeDiff`, `gitShow`, `gitLsTree`, `collectFilesFromGitRef`, `diffToOverlayChanges`, `writeOverlayFromChanges`, `draftInstructions`, `getUpstreamFiles`, `resolveLocalFiles`, `shouldSkipLocalOnlyFile`)
- [x] 5.2 Retain dynamic import of `generator-config.mjs` in extract diff logic until cycle-break change (#4)
- [x] 5.3 Import `hasOverlay` from `overlay-model.mjs` and `cleanExtractClone` from `tmp.mjs`

## 6. Create pipeline facade

- [x] 6.1 Create `lib/overlay-pipeline.mjs` exporting five operation groups: audit (re-export audit module), restore (`restoreSkill`, `restoreAllSkills`), static (re-export static module), prepare (re-export manifest module), extract (re-export extract module)
- [x] 6.2 Move `validateOverlays` and `printOverlayApplyPrompt` into pipeline (validate delegates to model + audit)
- [x] 6.3 Wire restore functions to call audit then git checkout + `recordBlend` from `locks.mjs`

## 7. Replace monolith with barrel re-export

- [x] 7.1 Replace `lib/overlays.mjs` body with re-exports of all 23 public symbols from pipeline, model, and audit modules
- [x] 7.2 Run `rg "from './overlays|from '../lib/overlays"` to confirm no broken imports

## 8. Migrate call sites to pipeline/model

- [x] 8.1 Update `lib/update.mjs` imports to use `overlay-pipeline.mjs`
- [x] 8.2 Update `scripts/sync.mjs` imports to use `overlay-pipeline.mjs`
- [x] 8.3 Update `lib/validate.mjs` imports to use `overlay-pipeline.mjs`
- [x] 8.4 Update `lib/import.mjs` to import `prepareGeneratorManifest` from `overlay-manifest.mjs` or pipeline
- [x] 8.5 Confirm `lib/sync.mjs` imports only `hasOverlay` (from model) and `printOverlayApplyPrompt` (from pipeline)

## 9. Tests and validation

- [x] 9.1 Add unit tests for audit route determination with injected lock/hash/blended-ref mocks
- [x] 9.2 Add unit test for `partitionChanges` edge cases in model layer
- [x] 9.3 Run `npm run validate` and confirm exit code 0
- [x] 9.4 Smoke-test overlay CLI commands: `overlay audit`, `overlay static --dry-run`, `overlay prepare --skill <name>` (if overlays exist)

## 10. Documentation

- [x] 10.1 Update `AGENTS.md` Layout section to list new `lib/overlay-*.mjs` modules and note pipeline as the deep interface
- [x] 10.2 Add brief module map comment block at top of `lib/overlay-pipeline.mjs` documenting the five operation groups and internal submodules
- [x] 10.3 No README.md or CHANGELOG.md update required — no user-facing behavior change
