## Context

`lib/validate.mjs` exports a single `validateRepo()` function that mixes structure checks (manifests, frontmatter, overlay YAML, marketplace) with blend-state checks (`auditSkill` per source skill for `blended_ref` and pending routes). `parseFrontmatter` is duplicated in three modules (`validate.mjs`, `import.mjs`, `overlay-yaml.mjs`). `validateOverlays()` in `overlay-pipeline.mjs` also calls `auditSkill` when a lock entry exists — duplicating blend warnings that `validateRepo()` emits in its own loop.

Prior architecture changes (overlay pipeline split, pending unification, upstream adapter) are complete or in flight. Skill-paths centralization may land in parallel; this change focuses on validation layering and frontmatter deduplication.

## Goals / Non-Goals

**Goals:**

- Split validation into `validateStructure()` and `validateBlendState()` with clear responsibility boundaries
- Deduplicate `parseFrontmatter` in `lib/skill-md.mjs`
- Remove audit/route logic from `validateOverlays()` — structure only
- Add `--structure-only` CLI flag for CI-friendly checks without git
- Keep `validateRepo()` as backward-compatible wrapper (structure + blend)
- Add ubiquitous-language terms for the two validation layers

**Non-Goals:**

- Changing audit/restore/prepare pipeline semantics
- Adding new npm packages
- Replacing `npm run validate` default behavior (full validation remains default)
- Moving path resolution (deferred to skill-paths change if not yet merged)

## Decisions

### 1. Two functions + wrapper, not a options object on one function

**Choice:** Export `validateStructure()` and `validateBlendState()` separately; `validateRepo()` calls both.

**Rationale:** Matches architecture review diagram; call sites can import only what they need. Clearer than a `{ blend: false }` flag buried in one mega-function.

**Alternative considered:** Single `validateRepo({ layers: ['structure'] })` — rejected as over-abstracted for two fixed layers.

### 2. Remove audit from `validateOverlays`, consolidate blend in `validateBlendState`

**Choice:** Strip lines 210–219 (lock + audit loop) from `validateOverlays`; move all blend warnings to `validateBlendState()`.

**Rationale:** Eliminates duplicate pending-route warnings from two code paths. `validateOverlays` stays in overlay-pipeline as a structure helper; blend authority stays in validate module.

**Alternative considered:** Keep audit in `validateOverlays` and remove the loop from `validateRepo` — rejected because it keeps blend logic inside pipeline module named for overlay structure validation.

### 3. `skill-md.mjs` as minimal shared module

**Choice:** Single export `parseFrontmatter(content)` — same regex and yaml.parse behavior as today.

**Rationale:** Smallest seam; no SKILL.md body parsing or file I/O. Matches architecture review "shared: skill-md.mjs".

**Alternative considered:** Broader `skill-md` with `readSkillMd(path)` — rejected; file reads stay in callers.

### 4. CLI flag `--structure-only` on existing validate command

**Choice:** `npm run validate -- --structure-only` runs `validateStructure()` only.

**Rationale:** No new npm script; passes through existing `scripts/sync.mjs validate` subcommand. CI can gate on structure without git.

**Alternative considered:** Separate `npm run validate:structure` script — rejected to avoid package.json proliferation.

### 5. Default validate unchanged (structure + blend)

**Choice:** No flag → `validateRepo()` → both layers.

**Rationale:** Maintainers keep current workflow; blend warnings remain visible by default. Only CI opts out.

## Risks / Trade-offs

- **[Risk] Warning text or ordering changes when deduplicating audit loops** → Compare validate output before/after on this repo; preserve message types (`overlay-lock`, `overlay`) and skill names in warnings
- **[Risk] CI runs full validate today and depends on blend warnings failing** → Blend warnings are warnings (exit 0), not errors — no CI breakage expected; document `--structure-only` for new CI configs
- **[Risk] skill-paths change lands first and touches validate.mjs** → Rebase order: either merge skill-paths first and use `canonicalDir` in structure layer, or keep inline paths and follow up in skill-paths apply
- **[Trade-off] Structure-only validate cannot catch pending remerge** → By design; maintainers run full validate locally or in a separate maintainer CI job

## Migration Plan

1. Add `lib/skill-md.mjs`; migrate three callers; add unit tests for parser edge cases
2. Extract structure body from `validateRepo` into `validateStructure()`
3. Extract blend loop into `validateBlendState()`; remove audit block from `validateOverlays`
4. Implement `validateRepo` as `{ ...await validateStructure(), ...await validateBlendState() }` merge of errors/warnings
5. Add `--structure-only` to validate command in `scripts/sync.mjs`
6. Run `npm run validate` and `npm run validate -- --structure-only`; compare output
7. Run `npm run test`; update any tests that mock `validateOverlays` audit behavior

**Rollback:** Revert module split; restore monolithic `validateRepo` and audit in `validateOverlays`.

## Open Questions

- None blocking — `--structure-only` naming and default full-validate behavior are settled above.
