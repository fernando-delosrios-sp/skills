## Why

The README Categories table is hand-maintained and already disagrees with Manifests: engineering still lists `graphify` and omits several skills; productivity lists `wayfinder` and `writing-great-skills` in the wrong places and omits `structured-choices`. Maintainers and `npx skills add` browsers pick from a lying cache. Structure validation does not catch this, so the table will rot again after the next import.

## What Changes

**README category catalog table**
- From: three Category rows whose Skill name lists are incomplete, stale, and mis-grouped
- To: each Category row lists exact Manifest `name` values, comma-separated and sorted alphabetically
- Reason: humans browsing README must see the same names as `skills/<category>/skills.json`
- Impact: non-breaking for Install (`skills/` remains source of truth); docs-only for consumers

**Structure validation drift check**
- From: `validateStructure()` does not compare README to Manifests
- To: after skills load, parse the Categories table and fail with `{ type: 'readme-catalog' }` on set mismatch or missing table; check every Category from `loadSkills()`
- Reason: fail-closed in CI so the cache cannot drift
- Impact: adding a Skill now requires a README row update or validate fails (intended)

**Tests**
- From: INSTALL.md `--skill` catalog is checked; README is not
- To: live-repo has zero `readme-catalog` errors; `compareReadmeCatalog(readmeText, skills)` covers a stub README missing a name
- Reason: parse/compare is unit-testable without mutating the live README
- Impact: maintainer test suite only

## Capabilities

### New Capabilities

<!-- None — README cache alignment is an extension of skill-catalog and tooling. -->

### Modified Capabilities

- `skill-catalog`: Require the README category catalog to list the same Skill names as each Category Manifest (set equality); display order in the table MUST be alphabetical within a Category
- `tooling`: Require Structure validation to emit `readme-catalog` errors when the README category catalog mismatches Manifests or the table is missing; MUST NOT skip; MUST NOT treat as Blend validation
- `ubiquitous-language`: Add **README category catalog**; extend **Structure validation** to include that check

## Impact

- **Primary files**: `README.md` Categories table; `lib/validate.mjs`; `test/validate.test.mjs`
- **Secondary files**: `CHANGELOG.md` (changelog-generator); `plans/README.md` row 005 DONE at apply
- **Skill types affected**:
  - **Foreign/source skills**: trees unchanged; names must appear in the README row for their Category
  - **Customized skills (overlays)**: overlay apply order unchanged (**sync → static → audit → restore → remerge → apply**)
  - **Local-only skills**: same README listing requirement as other Manifest entries
- **Dependencies**: none
- **STOP / deferred**: README table format no longer matches `| **<category>** |` rows — STOP, do not scrape the whole file; marketplace and full README rewrite out of scope
