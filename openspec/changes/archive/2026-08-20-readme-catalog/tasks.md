## 1. Preflight

- [x] 1.1 Run drift check: `git diff --stat 829de43..HEAD -- README.md lib/validate.mjs test/validate.test.mjs skills/*/skills.json` — if in-scope files changed, compare plan 005 “Current state” to live code; STOP on mismatch
- [x] 1.2 Confirm README Categories rows still match `| **<category>** | … |` — if not, STOP (do not scrape the whole README)
- [x] 1.3 List Categories from Manifests (`loadSkills()` / `skills/*/skills.json`); if any Category is not engineering, productivity, or internal, still include it in the check (do not hardcode only three)

## 2. Compare helper and tests

- [x] 2.1 Export `compareReadmeCatalog(readmeText, skills)` from `lib/validate.mjs` returning `{ type: 'readme-catalog', message }[]` — parse `| **<category>** |` rows; split names on commas; compare sets per Category from `skills` (D2, D3)
- [x] 2.2 Errors MUST use `type: 'readme-catalog'` and list missing and extra names; missing table or missing Category row MUST error, not skip; MUST NOT be warnings (D1; covers: Extra or missing names fail structure validation; Missing table fails rather than skip; Every loaded category is checked)
- [x] 2.3 Add `test/validate.test.mjs` cases: stub README missing `tdd` yields `readme-catalog`; empty/missing table yields `readme-catalog`; live `validateStructure()` has zero `readme-catalog` errors after README is synced (covers: Matching catalog produces no readme-catalog error)

## 3. Wire structure validation and README

- [x] 3.1 In `validateStructure()`, after skills load, read `README.md` via `ROOT` (`lib/skill-paths.mjs` / `lib/index.mjs`) and push `compareReadmeCatalog` results onto structure errors — no git, no `auditSkill` (covers: Structure layer is git-free; README category catalog structure check)
- [x] 3.2 Replace README Categories skill lists with exact Manifest `name` values, comma-separated, alphabetical within each Category; drop `graphify` and `writing-great-skills`; put `wayfinder` under engineering (covers: Table names equal manifest names per category; Names sorted alphabetically in each row)
- [x] 3.3 Do not change Install to read README; Canonical trees under `skills/` remain Install source of truth (covers: README is not the install source of truth)

## 4. Verification

- [x] 4.1 Confirm canonical test command: `npm test` (exit 0)
- [x] 4.2 Run `npm run validate -- --structure-only` (exit 0)
- [x] 4.3 Run `npm run validate` (exit 0)
- [x] 4.4 All delta spec scenarios named in 2.2, 2.3, and 3.x have automated coverage or an explicit no-code assertion (3.3)

## 5. Documentation

- [x] 5.1 README Categories table updated in 3.2 (user-visible catalog cache); do not regenerate the rest of README
- [x] 5.2 Set plan 005 status to DONE in `plans/README.md`
- [x] 5.3 No API / JSDoc / connector / CLI `--help` changes unless `compareReadmeCatalog` is documented as a public export (it is test-facing; skip extra docs)

## 6. Changelog

- [x] 6.1 Create or update changelog entry for this change via **changelog-generator**
- [x] 6.2 Confirm the entry covers syncing the README category catalog with Manifests and fail-closed Structure validation on drift
