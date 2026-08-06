## Context

Architecture review item #4 targets the remaining **generator ↔ overlay** coupling after the overlay lifecycle split (`split-overlay-lifecycle-module`). Today:

```text
generator-config.mjs ──imports──> overlay-model.mjs (hasOverlay, loadOverlay)
        ▲
        │ static import
overlay-manifest.mjs

overlay-extract.mjs ──dynamic import()──> generator-config.mjs  (cycle breaker)
```

`resolveGeneratorsForSkill` lives in `generator-config.mjs` but needs overlay YAML. `overlay-manifest.mjs` and `overlay-extract.mjs` need generator path detection back. Extract uses runtime `import()` to avoid a static cycle. `expectedContentForPath` is exported but always returns `null`, so extract never skips modify diffs that match frontmatter-derived generator output.

The overlay pipeline spec already requires generator-config to load `overlay-model` only — this change completes the decoupling by centralizing YAML + generator merge in `overlay-yaml.mjs`.

## Goals / Non-Goals

**Goals:**

- Eliminate runtime dynamic-import cycle breakers in `overlay-extract.mjs`
- Single authority for generator merge resolution testable without git
- Implement deterministic `expectedContentForPath` for `openai-manifest` (matches universal generator instructions in `overlays/OVERLAY.yaml`)
- Preserve npm script surface and overlay apply order (sync → static → audit → restore → prepare → apply)

**Non-Goals:**

- Changing universal generator instruction text or skill-overlay apply behavior
- Adding new generator types beyond implementing derivation for existing `openai-manifest`
- Replacing semantic merge with deterministic generation for all overlay changes
- Renaming or removing `generator-config.mjs` entirely (it remains the validation entry for `npm run validate`)

## Decisions

### 1. Introduce `overlay-yaml.mjs` rather than bloating `overlay-model.mjs`

**Choice:** New module `lib/overlay-yaml.mjs` owns YAML load/validate/partition + generator merge + generated-path helpers. `overlay-model.mjs` keeps discovery and hashing, re-exporting YAML primitives.

**Rationale:** Matches architecture review naming; keeps model focused on content fingerprints while YAML + generator rules form a cohesive, testable unit. Avoids generator-config importing model while model would import generator logic.

**Alternative considered:** Put everything in `overlay-model.mjs` — rejected because hashing/discovery and generator merge have different consumers and test seams.

### 2. Move `resolveGeneratorsForSkill` from generator-config to overlay-yaml

**Choice:** Cut/paste merge logic (global load, per-skill disable/add, normalization) into `overlay-yaml.mjs`. `generator-config.mjs` re-exports or thin-wraps for backward compatibility during migration.

**Rationale:** Manifest and extract import YAML layer directly; generator-config no longer sits in the middle of the pipeline graph.

### 3. Implement `expectedContentForPath` for openai-manifest (not delete)

**Choice:** Implement deterministic derivation in `overlay-yaml.mjs` aligned with universal generator instructions:

- `interface.display_name` — hyphenated skill name → Title Case
- `interface.short_description` — first sentence of description, ~72 chars
- `policy.allow_implicit_invocation: false` when `disable-model-invocation: true`

Reuse or extract shared frontmatter parsing (consider small `skill-md.mjs` helper if `parseFrontmatter` is duplicated — optional follow-on, not required for this change).

**Alternative considered:** Delete `expectedContentForPath` and always emit semantic changes for generator paths — rejected because architecture review explicitly calls out the stub and extract quality suffers.

### 4. Static imports only in overlay-extract

**Choice:** Replace `await import('./generator-config.mjs')` with top-level imports from `overlay-yaml.mjs`.

**Rationale:** Proves the cycle is structurally broken; failures surface at load time in tests.

### 5. generator-config becomes validation-focused

**Choice:** Keep `validateGlobalOverlay`, `validateSkillGenerators`, and `loadGlobalOverlay` validation paths; delegate resolution to overlay-yaml. Deprecate direct use of generator-config for resolution in internal modules (manifest, extract).

## Risks / Trade-offs

- **[Risk] Frontmatter parser drift** — derivation rules diverge from skill-overlay agent apply → Mitigation: unit tests with fixture SKILL.md files; mirror rules verbatim from `overlays/OVERLAY.yaml` instructions
- **[Risk] Duplicate YAML load paths** during migration → Mitigation: model re-exports yaml layer; delete duplicated parse blocks in same PR
- **[Risk] Breaking external importers of generator-config** — repo is internal tooling → Mitigation: keep re-exports on generator-config for one release; update internal call sites in same change
- **[Trade-off] Partial derivation** — only openai-manifest supported initially; other generators return `null` and behave as today

## Migration Plan

1. Create `overlay-yaml.mjs` with moved functions + new `expectedContentForPath` implementation
2. Refactor `overlay-model.mjs` to delegate/re-export YAML primitives
3. Slim `generator-config.mjs`; update `validate.mjs` imports if needed
4. Switch `overlay-manifest.mjs` imports to overlay-yaml
5. Replace dynamic imports in `overlay-extract.mjs` with static overlay-yaml imports
6. Add unit tests for merge resolution, path classification, and openai derivation
7. Run `npm run validate` and existing test suite
8. Update AGENTS.md module list if module boundaries changed

**Rollback:** Revert single commit; no data migration or lock format changes.

## Open Questions

- None blocking apply. Optional follow-on: shared `skill-md.mjs` for frontmatter parsing (architecture review #6) — can land separately if duplication is minimal.
