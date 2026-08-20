## Scope

In: drop unused production dependencies `@clack/prompts`, `@inquirer/prompts`, `prompts`, and `simple-git` from `package.json`; declare `@inquirer/core`, `@inquirer/ansi`, and `@inquirer/figures` as direct dependencies so the Install prompt in `lib/category-checkbox-prompt.mjs` still resolves after `@inquirer/prompts` is removed; refresh `package-lock.json` via `npm install`. Out: removing the `skills` npm package; switching git/`npx` to `execFile` (plan 006); adding ESLint; logic changes in the category checkbox prompt unless an import path changes after the version pin (it should not).

## Language

**Direct dependency** (`draft`):
A package listed in this repository’s `package.json` `dependencies` so Node resolution does not rely on another package’s nested install.
_Avoid_: treating a transitive `@inquirer/*` as a declared contract; promoting this general npm term

**skills npm package** (`draft`):
The published `skills` CLI pin (`skills` in `package.json`) that `scripts/install.mjs` shells out to via `npx skills add`. Distinct from glossary **Skill** (an agent capability package).
_Avoid_: removing `skills` as if it were unused like `simple-git`; conflating with **Skill** / **Install**

**Install** (`conflicts-with-canonical`): none — reuse canonical **Install**. This change keeps `npm run install` working by declaring the `@inquirer/*` modules the category checkbox prompt already imports.

**Skill** (`conflicts-with-canonical`): none — reuse canonical **Skill**. Do not treat the `skills` npm package as a Skill in the catalog.

## Decisions

**Context:** Plan 004 at commit `829de43`. `package.json` lists four unused prompt/git libraries. The Install UI imports `@inquirer/core`, `@inquirer/ansi`, and `@inquirer/figures` from `lib/category-checkbox-prompt.mjs`; those are transitive via `@inquirer/prompts` today. Git is already `execSync` (plan 006 changes how, not this dependency).

**Q1:** Remove unused packages without promoting `@inquirer/*`?
→ **Chosen:** no. Removing `@inquirer/prompts` without adding the three imported packages as Direct dependencies would break `npm run install`.

**Q2:** Which packages leave vs stay?
→ **Chosen remove:** `@clack/prompts`, `@inquirer/prompts`, `prompts`, `simple-git`. **Chosen keep:** `skills`, `commander`, `kleur`, `yaml`, `@octokit/rest`.

**Q3:** How to pick `@inquirer/*` versions?
→ **Chosen:** read current versions from `package-lock.json` (`node_modules/@inquirer/{core,ansi,figures}`); add with `^` on those versions (or exact lockfile versions). Do not invent majors.

**Q4:** How to apply the lockfile?
→ **Chosen:** `npm uninstall` the four unused packages, then `npm install` the three `@inquirer/*` packages. Do not hand-edit `package-lock.json`. If uninstall already dropped transitives, install the three explicitly.

**Q5:** New tests or interactive Install in CI?
→ **Chosen:** no new tests. Regression: existing `npm test` plus ESM import of `lib/category-checkbox-prompt.mjs`. Do not require interactive `npm run install` in CI/non-TTY.

**Q6:** If `rg` finds a production import of a package about to be removed?
→ **Chosen:** STOP (plan STOP condition). Do not improvise a replacement in this change.

## Open questions

None — locked by `plans/004-drop-unused-deps.md`. Assumption: apply branch `advisor/004-unused-deps`; `plans/README.md` row 004 marked DONE at apply.

## Scenarios discussed

- Zero production imports of the four unused packages in `lib/` and `scripts/` (`*.mjs`); if any exist, STOP.
- After change, `package.json` `dependencies` MUST NOT contain `@clack/prompts`, `@inquirer/prompts`, `prompts`, or `simple-git`.
- After change, `package.json` `dependencies` MUST contain `@inquirer/core`, `@inquirer/ansi`, `@inquirer/figures`, and `skills`.
- `node -e "import './lib/category-checkbox-prompt.mjs'"` exits 0 (prompt module still loads).
- `npm test` exits 0.
- Lockfile diff MUST NOT include unrelated major bumps of `commander` / `yaml` / `@octokit/rest`; revert those if they appear.
- Peer conflict resolving `@inquirer/core` as a Direct dependency → STOP.
- Reviewer skims lockfile so `skills` was not accidentally removed.
