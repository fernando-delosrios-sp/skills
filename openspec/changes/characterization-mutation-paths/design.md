## Context

Maintainer CLI (`lib/sync.mjs`, `lib/import.mjs`, `lib/overlay-static.mjs`, `lib/update.mjs`) already implements Sync overwrite, Import copy, static overlay file ops, and Update. Overlay apply order remains **sync → static → audit → restore → remerge → apply**. `npm run update` (`runUpdate`) runs sync → static → audit → restore → prepare (`runStatic: false`); semantic apply is still the update-skills skill, not this change.

Characterization is a test-and-seam layer: `node:test` files under `test/`, optional deps defaulting to current imports. Tests use `mkdtemp` under `os.tmpdir()` and real filesystem writes. They MUST NOT clone GitHub or write this repo’s live `skills/` or `.locks/upstream.json`.

No C4 diagram: one Node process, no new containers.

## Goals / Non-Goals

**Goals:**

- Lock current write behavior of `applySyncResult`, `copySkillDir` (and `doImport` when injectable), `applyStaticOverlay`, and `runUpdate` stage order in named tests.
- Keep production defaults identical (optional deps / named exports only).
- Give plans 006–008 a regression net that still hits `writeFile` / `rm` / `cp`.

**Non-Goals:**

- Changing Sync, Import, static overlay, or Update behavior.
- Git argv / shell `rm -rf` (006); `..` path rejection (007); clone-once cache (008).
- `scripts/install.mjs`; live `npm run sync`.
- Stripping `kleur` logs from `runUpdate`.
- Asserting the shell string used for tmp clone cleanup.

## Decisions

### D1: Characterize sync write through `applySyncResult`

- **Choice**: Call exported `applySyncResult(result, locks)` with a tmp `localSkillDir` and in-memory `locks`. Pass every field the function reads (`skill`, `status`, `upstreamFiles`, `localSkillDir`, `upstreamSha`, `syncedAt`, `source`, `hasOverlay`). Prefer not exporting `writeUpstreamToLocal`.
- **Reason**: Avoids extra public API; lock SHA/`synced_at` are part of the mutation.
- **Considered alternatives**: Export `writeUpstreamToLocal` first — only if `applySyncResult` cannot be driven without live catalog/locks files.

### D2: Named export `copySkillDir`; small deps on `doImport` if cheap

- **Choice**: `export { copySkillDir }` (and `doImport` when tested). Optional deps `{ cwd, loadSkills, saveSkills }` defaulting to `process.cwd()` and current `index.mjs` functions. Duplicate-name test injects an in-memory names set / fake save.
- **Reason**: Isolation without a global `loadSkills` mock.
- **Considered alternatives**: Skip `doImport` entirely (STOP condition if `saveSkills` cannot be injected without rewriting `index.mjs`). Do not mix both approaches.

### D3: Optional deps on `applyStaticOverlay`

- **Choice**: `applyStaticOverlay(skillName, { dryRun, loadOverlayFn, findSkillFn, getSkillDirFn } = {})` with defaults `loadOverlay`, `findSkillByName` after `loadSkills`, `getSkillDir`. Tests supply a tmp overlay dir (`_dir` + `changes`) and tmp skill dir. Model after `restoreSkill` in `test/overlay-pipeline.test.mjs`.
- **Reason**: Live `loadOverlay` / `loadSkills` would mutate or depend on the real catalog.
- **Considered alternatives**: Second overlay loader or fixture under `overlays/` — rejected (touches live overlays). If deps exceed effort M, STOP; ship sync + runUpdate only.

### D4: Optional deps on `runUpdate`

- **Choice**: Second argument or options field `deps` with `syncAllSkills`, `applyStaticOverlays`, `hasOverlay`, `auditAllSkills`, `restoreAllSkills`, `prepareOverlays`, `printSyncSummary`, `printOverlayApplyPrompt`. Default each to current imports. Tests use `mock.fn` and record call order. Keep `kleur` logging.
- **Reason**: `runUpdate` has hardcoded imports; order/dryRun/skipSync cannot be tested without GitHub otherwise.
- **Considered alternatives**: Refactor into a class or pipeline object — larger than characterization.

### D5: Isolation and STOP conditions

- **Choice**: `os.tmpdir()` + `mkdtemp`. No GitHub. No writes to repo `skills/` or `.locks/upstream.json`. Reviewers reject tests that mock away all `writeFile`/`rm`. If static injection is too large, mark static BLOCKED in `plans/README.md` and still land the other three files.
- **Reason**: Characterization that never hits disk is worthless for 006–008.
- **Considered alternatives**: Chroot/fixture repo in-tree — still a risk of accidental catalog edits.

## Risks / Trade-offs

[Risk] `doImport` always uses `process.cwd()` and `saveSkills` against the live catalog → Mitigation: inject deps; if that requires rewriting `index.mjs`, skip `doImport` tests and still export `copySkillDir`.

[Risk] `applyStaticOverlay` discovery is too coupled for a small deps bag → Mitigation: STOP static; ship sync + runUpdate; note BLOCKED on plan 002 static.

[Trade-off] Exporting internals (`copySkillDir`, optional deps) slightly widens the module surface → Reason for acceptance: defaults preserve production; cheaper than a full DI framework.

[Trade-off] `runUpdate` order tests mock pipeline stages, so they do not write skill trees → Reason for acceptance: write coverage lives in sync/import/static tests; orchestrator tests only lock call order and flags.

## Migration Plan

N/A — no deployment or npm script contract change. Apply on a feature branch (`advisor/002-characterization-mutation-paths`); `npm test` and `npm run validate -- --structure-only` must pass; revert any accidental `skills/` or `.locks/` diffs.

Acceptance: four new test files (or three plus BLOCKED static); production `runUpdate()` with no `deps` still calls real pipeline functions.

## Open Questions

None. STOP conditions in the plan are apply-time gates, not open design forks.
