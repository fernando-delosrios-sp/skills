## Scope

In: sync the README Categories table to Manifest names per Category (alphabetical within each row); fail Structure validation with error type `readme-catalog` when the table’s name sets differ from `loadSkills()` grouped by Category, or when the table is missing; add a test covering that check. Out: regenerating the whole README; marketplace Manifest; CHANGELOG content except the usual changelog-generator entry; moving skills between Categories.

## Language

**README category catalog** (`promote`):
The Categories markdown table in `README.md` that lists Skill names grouped by Category for humans browsing the repo. It is a cache of Manifest names, not the Install source of truth.
_Avoid_: treating README as the catalog; marketplace listing; INSTALL.md schema catalog

**Category** (`conflicts-with-canonical`): none — reuse canonical **Category**.

**Manifest** (`conflicts-with-canonical`): none — reuse canonical **Manifest**.

**Structure validation** (`conflicts-with-canonical`):
Canonical glossary lists manifests, SKILL.md, overlays, generators, and marketplace — not the README category catalog. This change extends Structure validation to include that table as a fail-closed check.
_Avoid_: calling the check Blend validation; making it a warning that CI ignores

**Install** (`conflicts-with-canonical`): none — reuse canonical **Install**. README is not the Install source of truth (`skills/` / Canonical tree remains).

## Decisions

**Context:** Plan 005 at commit `829de43`. The README Categories table lists `graphify` (removed) and `writing-great-skills` (not in productivity Manifest), omits several engineering skills and `structured-choices`, and puts `wayfinder` under productivity.

**Q1:** Warning or error on drift?
→ **Chosen:** error (`type: 'readme-catalog'`). CI fail-closed so the table cannot rot. Warning only if documented; this change assumes error.

**Q2:** Table order vs Manifest file order?
→ **Chosen:** alphabetical Skill names within each Category row (stable diffs; matches how `npm run install` sorts choices).

**Q3:** Hardcode engineering / productivity / internal?
→ **Chosen:** compare every Category discovered from `loadSkills()`, not a hardcoded list of three. If a Category has no matching table row, that is a mismatch.

**Q4:** Missing table?
→ **Chosen:** emit a `readme-catalog` error; do not skip.

**Q5:** Unparseable table?
→ **Chosen:** STOP at apply if the row format no longer matches `| **<category>** |` — do not scrape the whole README.

**Q6:** Test shape?
→ **Chosen:** live-repo assertion that `validateStructure()` has no `readme-catalog` errors, plus a pure `compareReadmeCatalog(readmeText, skills)` helper tested with a stub README missing a known name.

## Open questions

None — locked by `plans/005-readme-catalog.md`. Assumption: apply branch `advisor/005-readme-catalog`; `plans/README.md` row 005 marked DONE at apply.

## Scenarios discussed

- README Categories table name set equals Manifest names per Category → Structure validation has no `readme-catalog` error.
- README lists a name absent from that Category’s Manifest (e.g. `graphify`) → `readme-catalog` error naming extras.
- Manifest lists a name absent from the table (e.g. `tdd`) → `readme-catalog` error naming missing.
- `wayfinder` under productivity in README while Manifest Category is engineering → extra in productivity, missing in engineering.
- README has no Categories table / no `| **engineering** |` (or other Category) row → `readme-catalog` error; do not skip.
- New Category appears under `skills/` with a Manifest → table must gain a row; check is not limited to three names.
- Table cell order is not alphabetical → documentation/display requirement on README; set equality is the validation contract (order is a maintainer convention, not a validate error unless we choose to check order — **Chosen:** set equality only).
- Marketplace Manifest and INSTALL.md `--skill` catalog checks stay separate (`install-skill`).
