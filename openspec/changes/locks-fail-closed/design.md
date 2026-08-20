## Context

`lib/locks.mjs` owns `.locks/upstream.json` (Upstream lock): last-synced SHAs plus overlay blend metadata used by Overlay route (`getOverlayRoute`) and Pending apply. Overlay apply order remains **sync → static → audit → restore → remerge → apply**. Audit/route reads lock entries; a silent empty load after corrupt JSON makes customized source skills look like Overlay route `fresh`.

Today `loadLocks()` wraps `readFile` + `JSON.parse` in one catch and returns `{}`. `LOCKS_PATH` is `resolve(ROOT, '.locks', 'upstream.json')` with a second `ROOT` inside this module — do not relocate in this change. `test/locks.test.mjs` already calls `loadLocks()` against the committed file for blend-metadata assertions.

No C4 diagram: one Node process, no new containers.

## Goals / Non-Goals

**Goals:**

- Distinguish missing file (`ENOENT` → `{}`) from invalid JSON, non-object JSON, and other I/O errors (throw).
- Keep error messages free of lock-file contents; include path and `invalid JSON` on parse failure.
- Test parse and missing-file behavior without writing repo `.locks/upstream.json`.
- Leave existing committed-overlay lock tests passing.

**Non-Goals:**

- File locking or atomic `saveLocks`.
- Changing `saveLocks` JSON shape.
- Fixing `validateBlendState` empty catch.
- Importing `ROOT` from `skill-paths.mjs`.
- Making `npm run validate` report corrupt lock JSON as a structure error (follow-up).

## Decisions

### D1: Split read vs parse; ENOENT is the only empty-lock case

- **Choice**: `readFile` catch: if `err.code === 'ENOENT'` return `{}`; otherwise rethrow. Then `JSON.parse`; on throw, wrap as `Error` whose message includes `LOCKS_PATH` and `invalid JSON` (and the parse `err.message`), not the raw file body. If parse succeeds but the value is not a non-null object (`null`, array, number), throw similarly.
- **Reason**: first clone without `.locks/` is empty; crash/merge truncation must abort so `saveLocks` cannot wipe blend metadata.
- **Considered alternatives**: keep swallow-all `{}` — rejected (silent reset). Treat `EACCES` as empty — rejected (hides a real failure).

### D2: Export `parseLocksJson`; add `loadLocksFromPath` for missing-file tests

- **Choice**: named export `parseLocksJson(raw)` used by `loadLocks` after a successful read. Named export `loadLocksFromPath(path)` (or equivalent `{ path }` only if needed) for `ENOENT` under `mkdtemp`. Production `loadLocks()` keeps using `LOCKS_PATH`. Do not monkey-patch `readFile` globally.
- **Reason**: plan STOP: if tests cannot inject a path, export `parseLocksJson`; do not overwrite the live lock file.
- **Considered alternatives**: only `parseLocksJson` and skip missing-file I/O — weaker than a tmp missing path. Fixture overwrite of `.locks/upstream.json` — rejected.

### D3: Do not change save or ROOT

- **Choice**: `saveLocks` format unchanged; `ROOT` stays local to `locks.mjs`.
- **Reason**: out of scope; atomic write and path centralization are other plans.
- **Considered alternatives**: atomic write — rejected in plan. Import ROOT from skill-paths — deferred.

## Risks / Trade-offs

[Risk] Existing tests or CLI that assumed corrupt JSON → `{}` now throw → Mitigation: only a well-formed committed file is used in current tests; new tests assert throws. Maintainers with a truncated lock must restore or re-sync rather than silently continuing.

[Risk] New tests accidentally call `saveLocks` / write the live path → Mitigation: tmp paths only; reviewer confirms no `writeFile` of repo `.locks/upstream.json`.

[Trade-off] Extra exports (`parseLocksJson`, path helper) widen the module surface → Reason for acceptance: cheaper and safer than global `readFile` mocks.

[Trade-off] Validate still may not surface the JSON error as a structure error → Reason for acceptance: follow-up; this change only stops silent wipe.

## Migration Plan

N/A — no deployment or npm script contract change. Apply on `advisor/003-locks-fail-closed`. `node --test test/locks.test.mjs` then `npm test` must pass. Do not push unless asked. Commit message: `fix(locks): refuse to parse corrupt upstream.json`.

Acceptance: corrupt JSON no longer yields `{}`; missing file still yields `{}`; error messages omit contents; plan 003 DONE in `plans/README.md`.

## Open Questions

None. STOP conditions (production already fail-closed; tests cannot inject a path) are apply-time gates, not open design forks.
