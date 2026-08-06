## Context

`lib/overlays.mjs` is a 1,095-line monolith exporting 23 functions used by six call sites (`scripts/sync.mjs`, `lib/update.mjs`, `lib/validate.mjs`, `lib/import.mjs`, `lib/sync.mjs`, `lib/generator-config.mjs`). It mixes concerns that belong at different layers:

| Concern | Current exports | Target module |
|---|---|---|
| YAML model | `discoverOverlays`, `loadOverlay`, `partitionChanges`, `hasOverlay`, `hashOverlay`, `hashUniversalOverlay` | `overlay-model.mjs` |
| Audit/restore | `auditSkill`, `auditAllSkills`, `restoreSkill`, `restoreAllSkills`, `listPendingOverlaySkills`, `isBlendedRefValid`, `getCurrentOverlayHashes` | `overlay-pipeline.mjs` (orchestrates model + locks + git) |
| Static ops | `applyStaticOverlay`, `applyStaticOverlays` | `overlay-static.mjs` |
| Manifests | `prepareOverlayManifest`, `prepareGeneratorManifest`, `prepareAllGeneratorManifests`, `prepareOverlays` | `overlay-manifest.mjs` |
| Extract | `extractOverlay`, `extractAllOverlays` | `overlay-extract.mjs` |
| Validation | `validateOverlays` | `overlay-pipeline.mjs` (delegates to model + audit) |
| UX helper | `printOverlayApplyPrompt` | `overlay-pipeline.mjs` |

Git helpers (`shallowClone`, `collectFiles`, `gitShow`, `gitLsTree`, `collectFilesFromGitRef`, `getGitSkillPrefix`) and diff logic currently live inside extract and audit paths. This change keeps git I/O inside pipeline/extract internals; extracting an upstream-adapter (#2) is deferred.

The circular dependency between `generator-config.mjs` and `overlays.mjs` is partially addressed by moving `hasOverlay`/`loadOverlay` to `overlay-model.mjs`, breaking the import cycle at the model layer. Full cycle resolution (#4) remains out of scope.

## Goals / Non-Goals

**Goals:**

- Split `overlays.mjs` into four internal modules plus one deep pipeline facade
- Shrink the public import surface: CLI and orchestrators call pipeline; `generator-config` calls model only
- Preserve identical npm script behavior and overlay workflow order (sync → static → audit → restore → prepare → apply)
- Enable unit tests on audit/restore routing without real git operations
- Keep `lib/overlays.mjs` as a backward-compatible re-export barrel during migration

**Non-Goals:**

- Upstream git adapter extraction (#2)
- Pending-state unification (`isOverlayPending` → `getOverlayRoute`) (#3)
- Full generator ↔ overlay cycle break (#4)
- Centralized `skill-paths` module (#5)
- Validation layering split (#6)
- Changing overlay YAML schema, lock file format, or manifest content

## Decisions

### 1. Pipeline as facade, not god module

**Decision:** `overlay-pipeline.mjs` orchestrates submodules but does not absorb their implementation logic.

**Rationale:** A facade keeps the deep interface small (5 operation groups) while each submodule stays focused. Audit/restore naturally spans model + locks + git, so pipeline owns orchestration there.

**Alternative considered:** Keep audit/restore in a fifth submodule (`overlay-audit.mjs`). Rejected — audit and restore are tightly coupled and share route logic; splitting them adds indirection without reducing complexity.

### 2. Model layer has no git I/O

**Decision:** `overlay-model.mjs` handles only filesystem reads/writes on overlay directories and YAML parsing/validation.

**Rationale:** Matches the architecture review's "overlay-model" seam. Enables `generator-config` to import model without pulling git dependencies. `isBlendedRefValid` stays in pipeline (git-dependent).

### 3. Extract owns clone and diff helpers (for now)

**Decision:** `shallowClone`, `collectFiles`, `summarizeDiff`, `diffToOverlayChanges`, and related helpers move to `overlay-extract.mjs` as private functions.

**Rationale:** These are only used by extract today. Duplicated clone logic in sync/import stays until upstream-adapter (#2).

**Alternative considered:** Extract clone helpers immediately into a shared module. Rejected — scope creep; this change focuses on overlay lifecycle only.

### 4. Backward-compatible barrel re-export

**Decision:** `lib/overlays.mjs` becomes a thin re-export of `overlay-pipeline.mjs` + `overlay-model.mjs` public symbols. Call sites migrate incrementally; barrel deleted in a follow-up if desired.

**Rationale:** Minimizes diff size and risk. All 23 current exports remain available at the same path.

### 5. Dependency injection for audit testing

**Decision:** Pipeline audit functions accept optional `{ lockLookup, blendedRefValidator, hashProvider }` overrides defaulting to real implementations.

**Rationale:** Enables route tests without git. Defaults preserve production behavior; tests pass mocks.

### 6. validateOverlays stays at pipeline level

**Decision:** `validateOverlays` orchestrates model validation + audit warnings; lives in pipeline, not model.

**Rationale:** Validation includes blend-state warnings (`isOverlayRoutePending`) which require audit. Structure-only validation split (#6) is deferred.

## Module dependency graph

```text
scripts/sync.mjs ──> overlay-pipeline.mjs
lib/update.mjs   ──> overlay-pipeline.mjs
lib/validate.mjs ──> overlay-pipeline.mjs
lib/import.mjs   ──> overlay-pipeline.mjs (prepare only)
lib/sync.mjs     ──> overlay-model.mjs (hasOverlay) + overlay-pipeline.mjs (printOverlayApplyPrompt)

overlay-pipeline.mjs
  ├── overlay-model.mjs
  ├── overlay-static.mjs
  ├── overlay-manifest.mjs
  ├── overlay-extract.mjs
  ├── locks.mjs
  └── generator-config.mjs

overlay-manifest.mjs
  ├── overlay-model.mjs
  ├── overlay-static.mjs
  ├── overlay-pipeline.mjs (auditSkill — consider internal import to avoid cycle)
  └── generator-config.mjs

overlay-extract.mjs
  ├── overlay-model.mjs
  ├── generator-config.mjs (dynamic import retained until #4)
  └── tmp.mjs

generator-config.mjs
  └── overlay-model.mjs (was overlays.mjs)
```

**Cycle note:** `overlay-manifest` calls audit for route info in manifest headers. Pipeline calls manifest for prepare. Break the cycle by having manifest import `auditSkill` from an internal `overlay-audit.mjs` helper or by inlining a lightweight route lookup that doesn't call prepare. Preferred: extract `computeAuditResult` into model+locks without manifest dependency.

## Risks / Trade-offs

- **[Circular import between pipeline ↔ manifest]** → Extract shared `auditSkill` logic into a small internal `overlay-audit.mjs` used by both pipeline and manifest; pipeline re-exports it
- **[Large migration diff]** → Use barrel re-export; migrate call sites in one commit but keep old path working
- **[Extract dynamic import of generator-config]** → Retain dynamic import in extract for now; address in #4
- **[Test gap during split]** → Run `npm run validate` and manual update dry-run before merging; add audit route unit tests as part of this change
- **[Missed private helper]** → Map all 23 exports and ~15 private functions before moving; use grep to verify no orphan references

## Migration Plan

1. Create `overlay-model.mjs` — move model functions; update `generator-config.mjs` imports
2. Create `overlay-static.mjs` — move static apply functions
3. Create `overlay-manifest.mjs` — move prepare functions; resolve audit import cycle
4. Create `overlay-extract.mjs` — move extract + private clone/diff helpers
5. Create `overlay-pipeline.mjs` — move audit, restore, validate, printOverlayApplyPrompt; wire submodules
6. Replace `overlays.mjs` body with re-exports from pipeline + model
7. Update call sites to import from pipeline/model directly (optional in same PR)
8. Run `npm run validate`; smoke-test `npm run update -- --dry-run` if supported
9. Add unit tests for audit route determination with injected deps

**Rollback:** Revert to single `overlays.mjs` — no data migration, no lock file changes.

## Open Questions

- Should `overlay-audit.mjs` be a separate internal module to break the pipeline ↔ manifest cycle, or inline route lookup in manifest?
- Delete `overlays.mjs` barrel in this change or defer to a cleanup PR after call-site migration?
- Where do `getGitSkillPrefix` and `resolveLocalFiles` live long-term — extract module or future `skill-paths` (#5)?
