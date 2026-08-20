## Scope

In: `loadLocks` treats a missing `.locks/upstream.json` as empty locks and treats unreadable or invalid JSON (including non-object roots) as an error so a later `saveLocks` cannot wipe blend metadata. Out: file locking / atomic write; `saveLocks` format; `validateBlendState` empty catch; relocating `ROOT` from `locks.mjs` to `skill-paths.mjs`.

## Language

**Upstream lock** (`promote`):
The JSON object stored in `.locks/upstream.json` mapping skill name to sync and overlay blend metadata (including last-synced SHA, `blended_ref`, overlay hashes, and `applied_upstream_sha`).
_Avoid_: treating a truncated or invalid file as “no locks”; calling this OS file locking

**Fail-closed lock load** (`draft`):
Load of the Upstream lock that returns `{}` only when the file is missing (`ENOENT`); parse failures and other I/O errors abort. Informal name for this change’s behavior — do not promote (general fail-closed I/O).
_Avoid_: swallowing every `loadLocks` exception as `{}`

**Pending apply** (`conflicts-with-canonical`): none — reuse canonical **Pending apply**. A silent empty load after corrupt JSON would drop `blended_ref` and look like Overlay route `fresh`.

**Overlay route** (`conflicts-with-canonical`): none — reuse canonical **Overlay route**.

## Decisions

**Context:** Plan 003 at commit `829de43`. `loadLocks()` catches all errors and returns `{}`. The next `saveLocks` writes a new file and drops blend metadata. OpenSpec `upstream-sync` already requires recording SHAs; `overlays` pending apply depends on Overlay route, which depends on lock blend metadata.

**Q1:** Missing file vs corrupt file?
→ **Chosen:** `ENOENT` → `{}` (first clone without `.locks/` yet). Invalid JSON, non-object JSON, and other `readFile` errors (e.g. `EACCES`) → throw. JSON error message MUST include `.locks/upstream.json` and `invalid JSON` and MUST NOT include file contents.

**Q2:** How to test without overwriting the live lock file?
→ **Chosen:** export `parseLocksJson(raw)` used after read, **or** `loadLocksFromPath(path)` for missing-file tests under `mkdtemp`. Do not monkey-patch `readFile` globally. Do not `writeFile` repo `.locks/upstream.json`. Existing committed-overlay lock tests keep passing.

**Q3:** Atomic write / file locking?
→ **Chosen:** rejected (plan out of scope).

**Q4:** Relocate `ROOT`?
→ **Chosen:** no — second `ROOT` in `locks.mjs` stays (plans 009 / architecture polish).

## Open questions

None — locked by `plans/003-locks-fail-closed.md`. Assumption: apply branch `advisor/003-locks-fail-closed`; `plans/README.md` row 003 marked DONE at apply.

## Scenarios discussed

- Missing file (`ENOENT`): `loadLocks` / path helper returns `{}`.
- Truncated / invalid JSON (`{`): throw; message names path and `invalid JSON`; no file contents in message.
- JSON that is not a non-null object (`[]`, `null`, number): throw similarly. Locks are a map of skill name → entry.
- Valid object `{"a":{}}`: parse returns `{ a: {} }`.
- Other I/O errors: rethrow (not treated as empty).
- Existing `test/locks.test.mjs` blend-metadata cases against the real committed file still pass.
- Full `npm test` passes.
