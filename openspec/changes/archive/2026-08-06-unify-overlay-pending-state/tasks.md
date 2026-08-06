## 1. Pipeline entry point

- [x] 1.1 Add `isPendingApply(skillName, deps?)` to `lib/overlay-audit.mjs` — delegate to `auditSkill` + `isOverlayRoutePending`
- [x] 1.2 Re-export `isPendingApply` from `lib/overlay-pipeline.mjs` audit group
- [x] 1.3 Re-export `isPendingApply` from `lib/overlays.mjs` backward-compatible barrel (if barrel still exists)

## 2. Migrate call sites

- [x] 2.1 Update `lib/sync.mjs` — replace `isOverlayPending` with `isPendingApply` on unchanged-upstream path; remove `hasOverlay &&` guard
- [x] 2.2 Update `lib/tmp.mjs` — replace `isOverlayPending` with `isPendingApply` in `cleanOverlayApplyManifests` skip logic
- [x] 2.3 Grep repo for remaining `isOverlayPending` imports and remove all usages

## 3. Remove deprecated API

- [x] 3.1 Delete `isOverlayPending` function and `@deprecated` JSDoc from `lib/locks.mjs`
- [x] 3.2 Verify `getOverlayRoute` and `isOverlayRoutePending` remain exported unchanged

## 4. Tests

- [x] 4.1 Add `test/overlay-pending.test.mjs` — fresh, remerge, restore, none routes via injected deps
- [x] 4.2 Add test case: timestamp says applied but route is remerge → `isPendingApply` returns true
- [x] 4.3 Add test case: generator-only skill pending on unchanged upstream
- [x] 4.4 Run full test suite (`npm test` or project equivalent)

## 5. Documentation

- [x] 5.1 Update `AGENTS.md` layout section — note `isPendingApply` as pending authority; remove any `isOverlayPending` references
- [x] 5.2 Append Overlay route and Pending apply term entries to `openspec/specs/ubiquitous-language/spec.md` (per delta spec)
- [x] 5.3 Update `CHANGELOG.md` with pending-state unification note (behavior alignment for generator-only and invalid blended_ref edge cases)

## 6. Validation

- [x] 6.1 Run `npm run validate` — must pass
- [x] 6.2 Manual smoke: `npm run sync` on unchanged upstream with overlay skill — verify pending list matches `npm run overlay -- audit`
