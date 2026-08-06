## Why

Upstream git access — shallow clone, URL normalization, tree walking, and HEAD SHA resolution — is copy-pasted across `lib/sync.mjs`, `lib/import.mjs`, and `lib/overlay-extract.mjs`. Each module defines its own `shallowClone` (with inconsistent timeout values) and `collectFiles` (with incompatible return shapes: absolute paths vs relative paths). This duplication leaks git and filesystem details into every orchestrator, blocks dry-run testing without network access, and forces clone-strategy changes to be applied in three places. Consolidating behind a single upstream adapter now follows the overlay lifecycle split and prepares for skill-paths centralization.

## What Changes

- Introduce `lib/upstream-adapter.mjs` as the single deep module for upstream git operations with a public interface: `cloneRepo`, `readSkillTree`, `getHeadSha`
- Normalize repo URL handling in one place (`owner/repo`, bare HTTPS, `git@` forms)
- Unify skill tree reading into one return shape (`{ relPath, content }[]`) regardless of caller
- Inject a filesystem adapter (real `node:fs/promises` in production, in-memory fixture in tests) so orchestrators stay free of I/O details
- Remove three duplicate `shallowClone` implementations from `sync.mjs`, `import.mjs`, and `overlay-extract.mjs`
- Remove duplicate `collectFiles` from `sync.mjs` and consolidate with `overlay-model.mjs` / `overlay-extract.mjs` variants via the adapter
- No user-facing behavior change — same npm scripts, same sync/import/extract workflows, same lock SHA semantics

## Capabilities

### New Capabilities

<!-- No new domain specs — adapter interface requirements land in upstream-sync delta. -->

### Modified Capabilities

- `upstream-sync`: Add requirements for a single upstream git adapter seam (`cloneRepo`, `readSkillTree`, `getHeadSha`), URL normalization, and testable filesystem injection. Sync, import, and extract MUST use this adapter instead of inline git I/O.

## Impact

- **Primary files**: new `lib/upstream-adapter.mjs`; refactored `lib/sync.mjs`, `lib/import.mjs`, `lib/overlay-extract.mjs`
- **Secondary files**: `lib/overlay-model.mjs` (may delegate tree walking to adapter or share helper); `lib/tmp.mjs` (clone cache paths unchanged)
- **Skill types affected**:
  - **Foreign/source skills**: sync and import paths use adapter — behavior unchanged, internals consolidated
  - **Customized skills (overlays)**: extract path uses adapter for upstream clone and tree read
  - **Local-only skills**: unaffected
- **Dependencies**: `node:child_process` (git exec) moves behind adapter; no new npm packages
- **Tests**: New unit tests with injected filesystem fixture — no network required for adapter tests
- **Deferred**: skill-paths centralization (#5), validation layering (#6) — adapter accepts paths from callers today
