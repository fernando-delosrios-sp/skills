## Why

`loadLocks()` treats every failure (missing file, permission, invalid JSON) as `{}`. The next `saveLocks` then writes a new file and drops blend metadata (`blended_ref`, overlay hashes, `applied_upstream_sha`). Overlay routing then looks like a first-time `fresh` apply. A truncated lock file during a crash or bad merge should abort, not silently reset. Missing file (`ENOENT`) should still mean empty locks — first clone without `.locks/` yet.

## What Changes

**Fail-closed Upstream lock load**
- From: any `loadLocks` exception returns `{}`
- To: `ENOENT` returns `{}`; invalid JSON, non-object JSON, and other I/O errors throw. JSON errors name `.locks/upstream.json` and `invalid JSON` without embedding file contents
- Reason: preserve blend metadata so Overlay route / Pending apply cannot masquerade as `fresh`
- Impact: non-breaking for a well-formed lock file; corrupt files now fail instead of wiping on the next save

**Testable parse without live file overwrite**
- From: tests only load the committed `.locks/upstream.json`
- To: exported `parseLocksJson` and/or `loadLocksFromPath`; new cases in `test/locks.test.mjs` using tmp paths. Existing committed-overlay assertions stay
- Reason: cannot inject a path without a new export; do not monkey-patch `readFile` globally
- Impact: non-breaking public test surface

## Capabilities

### New Capabilities

<!-- None — load semantics belong on existing upstream-sync / overlays / tooling. -->

### Modified Capabilities

- `upstream-sync`: Extend **Upstream lock tracking** so load is fail-closed except missing file
- `overlays`: Corrupt or unreadable Upstream lock MUST NOT be treated as empty / never-applied when evaluating Overlay route
- `tooling`: Unit tests for parse and missing-file load MUST NOT write the live `.locks/upstream.json`
- `ubiquitous-language`: Add **Upstream lock**

## Impact

- **Primary files**: `lib/locks.mjs` (`loadLocks`, optional `parseLocksJson` / `loadLocksFromPath`); `test/locks.test.mjs`
- **Secondary files**: `CHANGELOG.md`; `plans/README.md` row 003 DONE
- **Skill types affected**:
  - **Foreign/source skills**: Overlay route stays honest when the lock file is truncated; no skill-tree edits
  - **Customized skills (overlays)**: blend metadata no longer silently dropped on corrupt JSON
  - **Local-only skills**: unaffected (no overlay lock routing)
- **Dependencies**: none
- **Deferred**: atomic `saveLocks`; `validateBlendState` empty catch; ROOT import from `skill-paths.mjs`; validate surfacing the JSON error as a structure error
- **Docs**: no README/CLI user-facing change unless changelog notes maintainer fail-closed load
