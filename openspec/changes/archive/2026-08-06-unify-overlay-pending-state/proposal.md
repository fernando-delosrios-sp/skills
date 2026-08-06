## Why

Two incompatible pending models coexist in the overlay lifecycle: timestamp-based `isOverlayPending` (deprecated but still used by `sync.mjs` and `tmp.mjs` manifest cleanup) and route-based `getOverlayRoute` (used by audit, prepare, and validate). These can disagree — for example when blend metadata is missing but timestamps look applied, or when upstream is unchanged but `overlay_applied_at < synced_at` from a prior sync. Sync summary output and manifest cleanup therefore can diverge from audit/prepare routing, confusing maintainers and risking premature manifest deletion. With the overlay pipeline split complete, unifying pending truth at one seam is the natural next step.

## What Changes

- Make `getOverlayRoute` the single authority for whether a skill needs semantic apply (`fresh` or `remerge` routes)
- Add `isPendingApply(skillName)` to the overlay pipeline public interface — wraps `auditSkill` + `isOverlayRoutePending`
- Migrate `lib/sync.mjs` off `isOverlayPending` — use `isPendingApply` for the `overlayPending` flag on unchanged upstream
- Migrate `lib/tmp.mjs` manifest cleanup off `isOverlayPending` — use `isPendingApply` when `appliedManifestsOnly` is true
- Remove deprecated `isOverlayPending` export from `lib/locks.mjs`
- Keep `getOverlayRoute` and `isOverlayRoutePending` in `locks.mjs` as pure routing helpers (no I/O)
- Add glossary entries for **Pending apply** and **Overlay route**
- No npm script surface change — same commands, same workflow order; pending detection semantics align with audit

## Capabilities

### New Capabilities

<!-- No new domain specs — pending unification extends existing overlay and pipeline specs. -->

### Modified Capabilities

- `overlay-pipeline`: Add requirement for a single `isPendingApply(skillName)` entry point that call sites (sync, tmp cleanup) MUST use instead of timestamp heuristics
- `overlays`: Clarify that pending apply is determined exclusively by overlay route (`fresh` or `remerge`), not lock timestamps
- `ubiquitous-language`: Add **Pending apply** and **Overlay route** glossary entries

## Impact

- **Primary files**: `lib/locks.mjs` (remove deprecated export), `lib/overlay-audit.mjs` or `lib/overlay-pipeline.mjs` (add `isPendingApply`), `lib/sync.mjs`, `lib/tmp.mjs`
- **Secondary files**: `lib/validate.mjs` (already route-based — verify no regression), `test/` (new unit tests for pending unification)
- **Skill types affected**:
  - **Customized skills (overlays)**: pending detection aligns with audit route — may fix edge cases where timestamp and route disagreed
  - **Generator-only skills** (universal overlay, no per-skill YAML): included in route-based pending when generators apply
  - **Foreign skills without overlay**: unaffected (`route: none`)
  - **Local-only skills**: unaffected (no lock entry)
- **Dependencies**: Builds on completed overlay-pipeline split; no new npm packages
- **Deferred**: generator ↔ overlay cycle break (#4), skill-paths centralization (#5), validation layering (#6)
