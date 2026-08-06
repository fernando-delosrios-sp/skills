## Why

`generator-config.mjs` and the overlay pipeline still form a logical circular dependency: generator resolution needs per-skill overlay YAML, while manifest preparation and extract need generator path detection back from generator-config. Extract breaks the static import cycle with runtime `import()` patches, and `expectedContentForPath` is an exported stub that always returns `null`, so extract cannot skip generator diffs by derived content. After the overlay lifecycle split (#1), this is the next seam to deepen — isolate YAML + generator merge resolution so tests and extract no longer depend on a runtime cycle breaker.

## What Changes

- Introduce `lib/overlay-yaml.mjs` owning overlay YAML load/validate/partition and **generator merge resolution** (global defaults + per-skill `generators.add` / `generators.disable`) with no git I/O
- Slim `generator-config.mjs` to validation and thin wrappers that delegate resolution to `overlay-yaml.mjs`; remove its direct coupling to overlay pipeline modules beyond the YAML layer
- Replace dynamic `import('./generator-config.mjs')` in `overlay-extract.mjs` with static imports from `overlay-yaml.mjs` for `isGeneratedPathForSkill` and path classification
- Resolve `expectedContentForPath`: **implement** deterministic derivation for repo-known generator outputs (starting with `openai-manifest` → `agents/openai.yaml` from SKILL.md frontmatter) **or** delete the export and simplify extract skip logic — design chooses one path
- Update `overlay-manifest.mjs` to resolve generators via `overlay-yaml.mjs` instead of `generator-config.mjs`
- Refactor `overlay-model.mjs` to re-export or delegate YAML primitives to `overlay-yaml.mjs` so call sites have one YAML authority without duplicating load/validate logic
- Add unit tests for generator merge resolution and generated-path detection isolated from git audit

## Capabilities

### New Capabilities

- `overlay-yaml`: Shared overlay YAML and generator resolution module — load, validate, partition, merge global + per-skill generators, classify generated paths; no git or manifest I/O

### Modified Capabilities

- `overlay-pipeline`: Extract submodule MUST use static imports from the YAML layer; no runtime dynamic-import cycle breaker; manifest preparation resolves generators through `overlay-yaml`
- `overlays`: Generator resolution source of truth moves to `overlay-yaml`; extract skip behavior for generated paths defined explicitly
- `tooling`: Extract-overlay command behavior for generator-managed paths documented when `expectedContentForPath` is implemented or removed
- `ubiquitous-language`: Add **Generator** glossary entry (agent manifest producer from universal/per-skill overlay generator config)

## Impact

- **Code**: `lib/overlay-yaml.mjs` (new), `lib/generator-config.mjs`, `lib/overlay-model.mjs`, `lib/overlay-extract.mjs`, `lib/overlay-manifest.mjs`, `lib/validate.mjs` (if import paths change), `lib/overlays.mjs` barrel re-exports
- **Tests**: New tests for generator merge and generated-path helpers; existing overlay/extract tests must pass without dynamic import
- **Workflows**: No change to npm script surface or overlay apply order; extract may skip more generator diffs once `expectedContentForPath` is implemented
- **Skills affected**: All source skills with overlays or universal generators; local-only skills unaffected
