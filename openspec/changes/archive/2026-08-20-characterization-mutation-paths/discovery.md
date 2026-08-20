## Scope

In: characterization tests for sync write (`applySyncResult`), import copy (`copySkillDir` / optional `doImport`), static overlay apply, and `runUpdate` call order, plus the smallest named exports and optional deps bags needed to run those tests against tmp dirs. Out: changing mutation behavior; git argv / `rm -rf` (plan 006); path `..` confinement (plan 007); clone-once cache (plan 008); `scripts/install.mjs`; real `npm run sync` against GitHub; writing the live `skills/` catalog or `.locks/upstream.json`.

## Language

**Characterization test** (`promote`):
A Node unit test that records current filesystem mutation behavior of Sync write, Import copy, static overlay apply, and Update orchestration so later refactors can detect drift. Tests MUST exercise real `writeFile` / `rm` / `cp` (or equivalent) on tmp trees — not only source greps.
_Avoid_: tests that mock away all filesystem writes; calling this a new product feature; conflating with Validate workflow (CI) itself

**Mutation path** (`draft`):
One of the four write/orchestrate surfaces this change covers: `applySyncResult` (canonical tree + lock object), `copySkillDir` / `doImport`, `applyStaticOverlay`, `runUpdate`. Informal planning name, not a glossary term.
_Avoid_: treating “mutation path” as a user-facing command

**Sync** (`conflicts-with-canonical`): none — reuse canonical **Sync**. Tests characterize overwrite/delete extras on a tmp `localSkillDir`, matching “Sync overwrites source skills,” not “preserve local files.”

**Update** (`conflicts-with-canonical`): none — reuse canonical **Update**. Tests assert stage order: sync → static overlay → audit → restore → prepare with `runStatic: false`.

**Injectable deps** (`draft`):
An optional function bag on `runUpdate`, `applyStaticOverlay`, and (if needed) `doImport` that defaults to current imports so production behavior is unchanged. General test-seam pattern; do not promote.
_Avoid_: a global mock of `loadSkills` / `saveSkills`; rewriting `lib/index.mjs` solely for tests

## Decisions

**Context:** Plan 002 at commit `829de43`. `test/upstream-orchestrators.test.mjs` greps `cloneRepo` imports; `test/overlay-pipeline.test.mjs` covers `partitionChanges` and mocked `restoreSkill`, not `applyStaticOverlay`. No import of `runUpdate`. Plans 006–008 will change these modules.

**Q1:** Export `writeUpstreamToLocal` vs test through `applySyncResult`?
→ **Chosen:** prefer `applySyncResult` with a tmp `localSkillDir`. Export `writeUpstreamToLocal` only if tests cannot reach writes otherwise.

**Q2:** How to test import without live manifests?
→ **Chosen:** export `copySkillDir` (and `doImport` if used). Prefer a small deps object on `doImport` (`cwd` / `loadSkills` / `saveSkills`) defaulting to current behavior. If injection requires rewriting `saveSkills` globally, skip `doImport` tests; still export/test `copySkillDir`.

**Q3:** How to test static overlay without live `overlays/` / `skills/`?
→ **Chosen:** optional deps on `applyStaticOverlay` (`loadOverlayFn`, `findSkillFn`, `getSkillDirFn`) defaulting to current functions, modeled on `restoreSkill` injection. If that looks larger than effort M, STOP and ship sync + runUpdate only; mark static BLOCKED.

**Q4:** How to test `runUpdate` order without GitHub?
→ **Chosen:** optional `deps` bag: `syncAllSkills`, `applyStaticOverlays`, `hasOverlay`, `auditAllSkills`, `restoreAllSkills`, `prepareOverlays`, `printSyncSummary`, `printOverlayApplyPrompt`. Keep `kleur` console output.

**Q5:** Isolation?
→ **Chosen:** `mkdtemp` under `os.tmpdir()`. Do not clone GitHub. Do not write this repo’s real `skills/` or `.locks/upstream.json`. Tests that only mock `writeFile`/`rm` are rejectable.

## Open questions

None — locked by `plans/002-characterization-mutation-paths.md`. Assumption: `doImport` gets a small deps object unless STOP condition fires; `plans/README.md` row 002 is marked DONE at apply.

## Scenarios discussed

- `applySyncResult` with `pending_update`: writes new/nested files, deletes orphans, sets lock `sha` / `synced_at`; non-pending status is a no-op.
- `copySkillDir`: copies `SKILL.md`; destination has no `.git` when source had `.git/config`.
- `doImport` duplicate name returns an error without writing the live catalog (or skipped if injection blocked).
- Static add creates the payload file; `dryRun: true` does not; remove deletes; missing `from` throws.
- `runUpdate` default order: sync → static → audit → restore → prepare `{ runStatic: false }`.
- `dryRun: true`: sync and static called with `{ dryRun: true }`; audit/restore/prepare not called.
- `skipSync: true`: sync not called; static still called.
- Full `npm test` and `npm run validate -- --structure-only` pass; `git diff -- skills .locks` empty.
