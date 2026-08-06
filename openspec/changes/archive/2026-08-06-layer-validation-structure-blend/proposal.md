## Why

`validateRepo()` couples two distinct questions: "is the repo well-formed?" (manifests, SKILL.md frontmatter, overlay YAML shape, static file refs, marketplace sync) and "what is the current git blend state?" (overlay audit routes, `blended_ref` presence, pending remerge). The blend loop re-runs `auditSkill` per source skill and `validateOverlays` already performs overlapping audit checks — so CI and local `npm run validate` pay git/audit cost for structure-only checks. With overlay pipeline split, pending unification, and skill-paths centralization underway or complete, separating validation layers lets CI run structure checks without git history while maintainers opt into blend warnings.

## What Changes

- Extract shared `parseFrontmatter` into `lib/skill-md.mjs`; migrate callers in `lib/validate.mjs`, `lib/import.mjs`, and `lib/overlay-yaml.mjs`
- Split `validateRepo()` into `validateStructure()` (no git audit) and `validateBlendState()` (audit routes, `blended_ref`, pending apply)
- Keep `validateRepo()` as a convenience wrapper that runs both layers (backward compatible for existing call sites)
- Remove blend/audit checks from `validateOverlays()` — structure-only overlay YAML and static ref validation stays there; route/`blended_ref` warnings move to `validateBlendState()`
- Add `--structure-only` flag to `npm run validate` for CI; default remains full validation (structure + blend)
- Add glossary entries for **Structure validation** and **Blend validation**
- No change to sync/update/import workflow order — only validate command layering

## Capabilities

### New Capabilities

- `skill-md`: Shared SKILL.md frontmatter parsing used by validate, import, and overlay-yaml

### Modified Capabilities

- `tooling`: Layer validate command into structure and blend checks; add `--structure-only` flag; require CI-friendly structure-only path
- `overlay-pipeline`: Restrict `validateOverlays` to structural overlay checks; remove audit/route warnings from that function
- `ubiquitous-language`: Add **Structure validation** and **Blend validation** glossary entries

## Impact

- **Primary files**: new `lib/skill-md.mjs`; refactored `lib/validate.mjs`, `lib/overlay-pipeline.mjs` (`validateOverlays`), `scripts/sync.mjs` (validate command flags)
- **Secondary files**: `lib/import.mjs`, `lib/overlay-yaml.mjs` (import `parseFrontmatter` from skill-md)
- **Skill types affected**:
  - **Customized skills (overlays)**: blend warnings surface only when full validate or `validateBlendState()` runs — structure checks unchanged
  - **Foreign/source skills without overlay**: structure validation only; blend layer skips (no lock entry)
  - **Local-only skills**: structure validation only; unaffected by blend layer
  - **Generator-only skills**: structure checks include generator output file presence; blend layer applies when lock entry exists
- **Dependencies**: Builds on completed overlay-pipeline split and pending unification; complements in-flight skill-paths centralization (validate path construction may migrate separately)
- **Deferred**: no new npm packages; no change to audit/restore/prepare pipeline semantics
