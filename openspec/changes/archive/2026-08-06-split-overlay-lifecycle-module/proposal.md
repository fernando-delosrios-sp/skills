## Why

`lib/overlays.mjs` has grown into a shallow 1,095-line module with 23 exports spanning audit, restore, static apply, manifest generation, extract, validation, git I/O, and clone helpers. Recent commits (overlay audit/restore routing, batch apply, generator-only prepare, category manifests) all concentrate change in this single file, making bugs hard to localize and blocking deeper refactors (upstream adapter, pending-state unification, validation layering). Splitting at natural seams now reduces coupling before the next wave of overlay work.

## What Changes

- Split `lib/overlays.mjs` into four internal modules:
  - `lib/overlay-model.mjs` — overlay discovery, YAML load/validate, change partitioning, hashing
  - `lib/overlay-static.mjs` — static add/replace/remove file operations
  - `lib/overlay-manifest.mjs` — remerge and generator manifest preparation
  - `lib/overlay-extract.mjs` — overlay draft extraction from local diffs
- Introduce `lib/overlay-pipeline.mjs` as the single deep public interface exposing: `audit`, `restore`, `prepare`, `static`, `extract`
- Re-export the pipeline interface from `lib/overlays.mjs` (or replace imports) so CLI scripts and `update.mjs` call one seam
- Move git I/O and clone helpers out of the overlay model layer (internal to pipeline or deferred to upstream-adapter change)
- Remove overlay knowledge leakage from `lib/sync.mjs` — sync imports only `hasOverlay` and `printOverlayApplyPrompt`, not audit/restore internals
- Add unit-test seam targeting audit/restore routing through the pipeline module
- No user-facing behavior change — same npm scripts, same overlay workflow order

## Capabilities

### New Capabilities

- `overlay-pipeline`: Internal module architecture defining the deep pipeline interface (`audit`, `restore`, `prepare`, `static`, `extract`) and the four internal submodules that implement it. Documents module boundaries, export policy (pipeline public, internals private), and the call-site contract for CLI and orchestrators.

### Modified Capabilities

<!-- No spec-level behavior changes. Overlay workflow order, static ops, semantic merge, and generator apply remain unchanged per overlays/spec.md. This is an in-process refactor only. -->

## Impact

- **Primary files**: `lib/overlays.mjs` (split/re-export), new `lib/overlay-{model,static,manifest,extract,pipeline}.mjs`
- **Call sites updated**: `lib/update.mjs`, `lib/validate.mjs`, `lib/import.mjs`, `lib/sync.mjs`, `scripts/sync.mjs`, `lib/generator-config.mjs` (imports may shift to overlay-model)
- **Skill types affected**: All skills with overlays (foreign/customized); upstream-only and local-only skills unaffected except via shared validate/update paths
- **Dependencies**: `locks.mjs`, `generator-config.mjs`, `tmp.mjs`, `index.mjs` — import paths change but contracts stay the same
- **Deferred**: Upstream git adapter (#2), pending-state unification (#3), generator cycle break (#4), skill-paths centralization (#5) — this change enables but does not include them
- **Tests**: New unit tests at audit/restore pipeline seam; existing validate/sync integration behavior must pass unchanged
