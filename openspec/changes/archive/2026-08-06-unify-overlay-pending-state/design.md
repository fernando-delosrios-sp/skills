## Context

The overlay lifecycle already routes skills through `getOverlayRoute` in `lib/locks.mjs`, producing one of four routes: `restore`, `remerge`, `fresh`, or `none`. Audit (`overlay-audit.mjs`), prepare, validate, and `listPendingOverlaySkills` all use `isOverlayRoutePending(route)` — true for `fresh` and `remerge`.

However, two call sites still use the deprecated timestamp heuristic `isOverlayPending(lockEntry)`:

| Call site | Usage |
|-----------|-------|
| `sync.mjs` | Sets `overlayPending` when upstream SHA is unchanged |
| `tmp.mjs` | Skips manifest removal when `appliedManifestsOnly` and lock looks pending |

`isOverlayPending` returns true when `overlay_applied_at` is missing or older than `synced_at`. This ignores overlay hash changes, missing blend metadata, invalid `blended_ref`, and generator-only skills. The models can disagree, causing sync summary and manifest cleanup to diverge from audit/prepare.

The overlay pipeline split (archived) established `auditSkill` as the deep routing entry point with injectable deps. This change adds a thin pending wrapper and migrates the two stale call sites.

## Goals / Non-Goals

**Goals:**

- Single pending authority: route-based (`fresh` \| `remerge`) everywhere
- One public `isPendingApply(skillName)` on the overlay pipeline for sync and tmp
- Remove `isOverlayPending` deprecated export
- Keep `getOverlayRoute` and `isOverlayRoutePending` pure in `locks.mjs` (no filesystem/git)
- Unit tests proving sync/tmp pending matches audit route

**Non-Goals:**

- Changing route determination logic in `getOverlayRoute`
- Moving lock persistence or `recordBlend` semantics
- Breaking the generator ↔ overlay circular dependency (#4)
- Splitting validate into structure vs blend (#6)
- Batch-optimizing pending checks across all skills during sync (acceptable to audit per skill on unchanged upstream; optimize later if slow)

## Decisions

### 1. `isPendingApply` lives in `overlay-audit.mjs`, re-exported from `overlay-pipeline.mjs`

**Choice:** Implement in `overlay-audit.mjs` alongside `auditSkill` and `listPendingOverlaySkills`; export via pipeline barrel.

**Rationale:** Pending is derived from audit route, not lock timestamps. Pipeline is the public seam per archived split-overlay change. `listPendingOverlaySkills` already filters by route — `isPendingApply` is the single-skill equivalent.

**Alternative considered:** Put on `locks.mjs` — rejected because route resolution needs overlay hashes and blended-ref validation (I/O), violating pure locks seam.

### 2. `isPendingApply` signature: `(skillName, deps?) => Promise<boolean>`

**Choice:** Async boolean wrapper; optional `deps` mirror `auditSkill` injection for tests.

**Rationale:** Matches existing audit test seam (`lockLookup`, `hashProvider`, `blendedRefValidator`). Sync and tmp call without deps in production.

**Alternative considered:** Sync reads lock + calls `getOverlayRoute` directly — rejected; duplicates hash/blended-ref assembly already in `auditSkill`.

### 3. Sync unchanged-upstream path calls `isPendingApply` instead of `isOverlayPending`

**Choice:** Replace lines 95–96 in `sync.mjs`:

```javascript
// Before
const pending = overlayExists && isOverlayPending(existingLock);

// After
const pending = await isPendingApply(skill.name);
```

**Rationale:** `isPendingApply` internally checks for overlay/generators presence (route `none` when absent). The redundant `hasOverlay` guard can be removed — generator-only skills become correctly pending.

**Behavior change:** Generator-only skills with unchanged upstream may now show `overlayPending: true` where timestamp heuristic returned false. This aligns with audit/prepare and is intentional.

### 4. Tmp manifest cleanup uses `isPendingApply` for skip logic

**Choice:** In `cleanOverlayApplyManifests`, when `appliedOnly` is true, skip removal when `await isPendingApply(skillName)` is true (still pending apply).

**Rationale:** Preserves manifests for skills that still need semantic apply. Route-based check prevents deleting manifests when timestamps say applied but route says remerge.

### 5. Delete `isOverlayPending`; no re-export from `overlays.mjs` barrel

**Choice:** Remove export entirely after migrating call sites. Grep repo for any remaining imports.

**Rationale:** Deprecated since route model landed; keeping it invites regression.

### 6. `overlay_applied_at` remains in lock schema for blend recording

**Choice:** Do not remove the timestamp field — `recordBlend` still writes it. It is audit metadata, not pending authority.

**Rationale:** May be useful for human debugging; route model does not depend on removing it.

## Risks / Trade-offs

- **[Performance] Sync checks unchanged skills with full audit per skill** → Acceptable for typical catalog size (~20–50 skills). If slow, add batch hash cache in a follow-up; out of scope here.
- **[Behavior change] Generator-only pending on unchanged upstream** → Correct per route model; update sync summary expectations in tests.
- **[Behavior change] Skills with applied timestamps but invalid blended_ref** → Previously timestamp said applied; route says remerge. Sync now correctly flags pending — desired fix.
- **[Test coupling] isPendingApply needs injectable deps** → Reuse audit test fixtures; add focused tests in `test/overlay-pending.test.mjs`.

## Migration Plan

1. Add `isPendingApply` to `overlay-audit.mjs`; re-export from `overlay-pipeline.mjs` and `overlays.mjs` barrel
2. Update `sync.mjs` — remove `isOverlayPending` import; use `isPendingApply`
3. Update `tmp.mjs` — remove `isOverlayPending` import; use `isPendingApply`
4. Remove `isOverlayPending` from `locks.mjs`
5. Add unit tests; run `npm run validate` and existing test suite
6. Update ubiquitous-language spec with glossary entries
7. No lock file migration required — route model reads existing fields

**Rollback:** Revert commit; `isOverlayPending` restored if needed (single commit revert).

## Open Questions

- None blocking. Batch pending optimization deferred unless sync latency is measured as problematic.
