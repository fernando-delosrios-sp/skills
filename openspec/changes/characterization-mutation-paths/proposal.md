## Why

Sync overwrites canonical skill trees, import appends manifests, static overlay copies or removes files, and Update sequences those stages. Today tests mostly grep imports or mock restore — they never hit those writes. Plans 006–008 will change the same modules; without characterization tests, executors cannot tell whether they preserved behavior. Small optional deps bags and named exports make the existing mutations testable on tmp trees without changing production defaults.

## What Changes

**Sync write characterization**
- From: `writeUpstreamToLocal` unexported; no test of overwrite/orphan delete/lock SHA via `applySyncResult`
- To: `test/sync-write.test.mjs` drives `applySyncResult` on a tmp `localSkillDir`; export `writeUpstreamToLocal` only if that is impossible
- Reason: lock in overwrite-and-delete-extras before argv/path/cache work
- Impact: non-breaking; production Sync path unchanged

**Import copy characterization**
- From: `copySkillDir` / `doImport` unexported; no isolation from live `saveSkills`
- To: named export `copySkillDir`; optional deps on `doImport` if tests cover duplicate-name without rewriting `lib/index.mjs`; `test/import-copy.test.mjs`
- Reason: import must not leak `.git` and must not write the live catalog in tests
- Impact: non-breaking public test surface; CLI import behavior unchanged

**Static overlay characterization**
- From: `applyStaticOverlay` always loads live overlay/catalog
- To: optional `loadOverlayFn` / `findSkillFn` / `getSkillDirFn`; `test/overlay-static.test.mjs` for add, remove, dryRun, missing `from`. STOP if injection exceeds effort M
- Reason: static ops must be asserted on tmp trees, not live `skills/`
- Impact: non-breaking; defaults remain current loaders

**Update orchestrator characterization**
- From: `runUpdate` hardcoded imports; no call-order test
- To: optional deps bag defaulting to current pipeline functions; `test/run-update.test.mjs` for default order, `dryRun`, `skipSync`
- Reason: later pipeline edits need a regression net for stage order
- Impact: non-breaking; production defaults still call the real pipeline

## Capabilities

### New Capabilities

<!-- None — characterization is tooling/test seams on existing domains. -->

### Modified Capabilities

- `upstream-sync`: Require characterization of `applySyncResult` writes/locks; export import copy for tests; optional `doImport` injection; optional `runUpdate` deps and documented call order for dryRun/skipSync
- `overlays`: Require static add/replace/remove (and dryRun / missing source) to be unit-testable without mutating the live catalog
- `overlay-pipeline`: Add a static-apply test seam analogous to audit/restore injection
- `tooling`: Require the unit test suite to include characterization tests that use tmp dirs and MUST NOT clone GitHub or write live `skills/` / `.locks/upstream.json`
- `ubiquitous-language`: Add **Characterization test**

## Impact

- **Primary files**: `test/sync-write.test.mjs`, `test/import-copy.test.mjs`, `test/overlay-static.test.mjs`, `test/run-update.test.mjs`; `lib/sync.mjs` (export only if needed); `lib/import.mjs` (exports / optional `doImport` deps); `lib/overlay-static.mjs` (optional deps); `lib/update.mjs` (optional deps)
- **Secondary files**: `CHANGELOG.md`; `plans/README.md` row 002 DONE
- **Skill types affected**:
  - **Foreign/source skills**: no tree or overlay YAML changes; tests must not touch live canonical trees
  - **Customized skills (overlays)**: static apply production behavior unchanged; tests use fixtures/tmp overlays
  - **Local-only skills**: unaffected
- **Dependencies**: none; no GitHub clones in tests
- **Deferred**: plan 006 git argv; plan 007 path confinement cases; plan 008 clone cache; `scripts/install.mjs`; real `npm run sync`
- **Docs**: no README/CLI user-facing behavior change; Changelog notes maintainer-test coverage
