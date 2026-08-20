## 1. Preflight

- [x] 1.1 Confirm zero production imports: `rg -n "@clack/prompts|@inquirer/prompts|from 'prompts'|from \"prompts\"|simple-git" lib scripts --glob '*.mjs'` — no matches; if a real import exists, STOP
- [x] 1.2 Read lockfile versions for `@inquirer/core`, `@inquirer/ansi`, and `@inquirer/figures` from `package-lock.json` (do not invent majors)

## 2. Adjust dependencies

- [x] 2.1 `npm uninstall @clack/prompts @inquirer/prompts prompts simple-git`
- [x] 2.2 `npm install @inquirer/core @inquirer/ansi @inquirer/figures` (if uninstall already dropped transitives, install the three explicitly; pin with `^` on lockfile versions or exact)
- [x] 2.3 Do not hand-edit `package-lock.json`; do not remove `skills`; do not change `lib/category-checkbox-prompt.mjs` unless an import path changes after the pin
- [x] 2.4 If `npm install` cannot resolve `@inquirer/core` as a Direct dependency (peer conflict), STOP
- [x] 2.5 If the lockfile diff includes unrelated major bumps of `commander` / `yaml` / `@octokit/rest`, revert those

## 3. Verification

- [x] 3.1 Confirm canonical test command: `npm test` (exit 0)
- [x] 3.2 Run `npm run validate` (exit 0)
- [x] 3.3 Assert `package.json` `dependencies` contain `@inquirer/core`, `@inquirer/ansi`, `@inquirer/figures`, and `skills`, and do not contain `@clack/prompts`, `@inquirer/prompts`, `prompts`, or `simple-git` (covers scenarios: Prompt modules listed as direct dependencies; Unused prompt and git packages omitted)
- [x] 3.4 `node -e "import './lib/category-checkbox-prompt.mjs'"` exits 0 (covers scenario: Category checkbox prompt module loads). Do not run interactive `npm run install` as a required non-TTY gate
- [x] 3.5 No new `test/*.test.mjs` files (design: declaration-only; named coverage is 3.3–3.4 plus `npm test`)

## 4. Documentation

- [x] 4.1 No README / CLI user-facing changes (maintainer dependency graph only)
- [x] 4.2 Set plan 004 status to DONE in `plans/README.md`
- [x] 4.3 No API / JSDoc / connector docs (no public surface change)

## 5. Changelog

- [x] 5.1 Create or update changelog entry for this change via **changelog-generator**
- [x] 5.2 Confirm the entry covers dropping unused prompt/`simple-git` packages and declaring the Install prompt’s `@inquirer/*` Direct dependencies, with `skills` kept
