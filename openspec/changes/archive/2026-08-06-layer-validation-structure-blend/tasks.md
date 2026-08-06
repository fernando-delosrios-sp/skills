## 1. Shared frontmatter module

- [x] 1.1 Create `lib/skill-md.mjs` exporting `parseFrontmatter(content)` with same behavior as current inline implementations
- [x] 1.2 Replace local `parseFrontmatter` in `lib/validate.mjs` with import from `skill-md.mjs`
- [x] 1.3 Replace local `parseFrontmatter` in `lib/import.mjs` with import from `skill-md.mjs`
- [x] 1.4 Replace local `parseFrontmatter` in `lib/overlay-yaml.mjs` with import from `skill-md.mjs`
- [x] 1.5 Add unit tests for `parseFrontmatter` edge cases (valid, missing delimiters, invalid YAML)

## 2. Validation layer split

- [x] 2.1 Extract current structure checks from `validateRepo()` into exported `validateStructure()` in `lib/validate.mjs`
- [x] 2.2 Extract blend audit loop into exported `validateBlendState()` using `auditSkill` and `isOverlayRoutePending`
- [x] 2.3 Refactor `validateRepo()` to merge results from `validateStructure()` and `validateBlendState()`
- [x] 2.4 Remove `getLockEntry` / `auditSkill` block from `validateOverlays()` in `lib/overlay-pipeline.mjs` (structure-only)
- [x] 2.5 Add unit tests for `validateStructure()` (no audit calls) and `validateBlendState()` (blend warnings only for source skills)

## 3. CLI and documentation

- [x] 3.1 Add `--structure-only` flag to validate subcommand in `scripts/sync.mjs`; wire to `validateStructure()` only
- [x] 3.2 Update `README.md` validate section to document structure vs blend layers and `--structure-only` flag
- [x] 3.3 Update `AGENTS.md` lib/ layout comment to mention `skill-md.mjs` and validation layering
- [x] 3.4 Run `npm run validate` and `npm run validate -- --structure-only`; confirm structure-only skips blend warnings
- [x] 3.5 Run `npm run test` and `npm run validate`; fix any regressions
