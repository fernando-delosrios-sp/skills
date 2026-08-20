## Context

`README.md` § Categories is a human index of Skill names by Category. Canonical names live in `skills/<category>/skills.json` (`loadSkills()` / Manifest). Install still reads Canonical trees under `skills/`, not README. Overlay apply order is unchanged (**sync → static → audit → restore → remerge → apply**).

`lib/validate.mjs` `validateStructure()` already loads skills, then checks manifests, overlays, generators, INSTALL.md `--skill` names (`collectLocalInstallSkillNames`), and marketplace. The README table is unchecked. Pattern to follow: parse a markdown cache, compare to catalog, push typed errors.

No C4 diagram: one Node process, no new containers. Omit Architecture.

## Goals / Non-Goals

**Goals:**

- Make the README category catalog match Manifest names per Category.
- Fail Structure validation (`type: 'readme-catalog'`) on set mismatch or missing table.
- Discover Categories from `loadSkills()`, not a hardcoded trio.
- Keep the check git-free (structure layer only).

**Non-Goals:**

- Regenerating the rest of README.
- Marketplace Manifest or INSTALL.md `--skill` logic changes.
- Moving skills between Categories.
- Treating README as Install source of truth.
- Fail on sort order (alphabetical is a write convention; validate is set equality).
- Blend validation / `auditSkill`.

## Decisions

### D1: Error, not warning

- **Choice**: Push structure **errors** with `type: 'readme-catalog'`. Missing names and extra names appear in the message.
- **Reason**: Plan 001 CI runs structure checks; a warning would let the table rot.
- **Considered alternatives**: Warning only — rejected (CI would stay green). Dual warning+error — rejected (noise).

### D2: Parse Categories table rows, not the whole README

- **Choice**: Find markdown table rows whose first cell is `| **<category>** |`. Split the second cell on commas, trim. Categories come from unique `skill.category` on `loadSkills()` results.
- **Reason**: Matches the current table; STOP if that shape is gone rather than heuristic scrape.
- **Considered alternatives**: HTML comment markers — rejected (not present). Hardcode engineering/productivity/internal — rejected (STOP in the plan if more Categories exist; discovery already lists all from `loadSkills()`).

### D3: Pure compare helper plus live-repo gate

- **Choice**: Export `compareReadmeCatalog(readmeText, skills)` returning `{ type: 'readme-catalog', message }[]`. `validateStructure` reads `README.md` via `ROOT` from `lib/skill-paths.mjs` (re-exported by `lib/index.mjs`) and calls the helper. Tests: (1) live `validateStructure()` has no `readme-catalog` errors; (2) helper with stub README missing `tdd` yields that error.
- **Reason**: INSTALL.md catalog tests the live tree; a stub proves missing-name detection without rewriting README in the test.
- **Considered alternatives**: Inject README path into `validateStructure` — optional, not required if the helper is exported. Live-only test — weaker coverage of the mismatch path.

### D4: Alphabetical write, set-equal validate

- **Choice**: When editing README, sort names alphabetically within each Category. Validator compares sets only.
- **Reason**: Stable diffs and Install-like ordering without failing on equivalent permutations.
- **Considered alternatives**: Enforce sort in validate — rejected (discovery: set equality is the contract).

## Risks / Trade-offs

[Risk] README table markup changes so `| **category** |` rows disappear → Mitigation: STOP at apply; do not scrape.

[Risk] A Category exists in Manifests with no table row → Mitigation: treat as missing names for that Category (same error type).

[Trade-off] Adding a Skill requires a README edit or CI fails → Reason for acceptance: that is the point of a fail-closed cache.

[Trade-off] Validate does not enforce alphabetical order → Reason for acceptance: set equality is the user-facing truth; sort is maintainer hygiene in the README edit task.

## Migration Plan

N/A — no deployment. Apply on `advisor/005-readme-catalog`. Do not push unless asked. Commit message: `docs(readme): sync category table with skills.json`.

Acceptance: table matches Manifests; `npm run validate -- --structure-only` and `npm test` exit 0; `plans/README.md` row 005 DONE.

## Open Questions

None. Unparseable table is an apply-time STOP, not a design fork.
