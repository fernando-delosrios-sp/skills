## Why

`package.json` lists `@clack/prompts`, `@inquirer/prompts`, `prompts`, and `simple-git`, but no `lib/` or `scripts/` file imports them. The Install prompt in `lib/category-checkbox-prompt.mjs` imports `@inquirer/core`, `@inquirer/ansi`, and `@inquirer/figures`, which are only transitive today. Removing `@inquirer/prompts` without declaring those three packages would break `npm run install`. Declaring them as Direct dependencies and dropping the unused packages shrinks the tree and keeps Install resolvable after a fresh `npm install`.

## What Changes

**Unused production packages**
- From: `@clack/prompts`, `@inquirer/prompts`, `prompts`, and `simple-git` are Direct dependencies
- To: those four MUST NOT appear in `package.json` `dependencies`
- Reason: no production import; `simple-git` is unused (git is already `execSync`; plan 006 changes how, not this pin)
- Impact: non-breaking for catalog users; maintainers get a smaller install graph

**Install prompt `@inquirer/*` pins**
- From: `@inquirer/core`, `@inquirer/ansi`, and `@inquirer/figures` resolve only as transitives of `@inquirer/prompts`
- To: those three MUST be Direct dependencies, versions taken from the current lockfile (caret or exact; no invented majors)
- Reason: Install must still load `lib/category-checkbox-prompt.mjs` after `@inquirer/prompts` is removed
- Impact: non-breaking; `npm run install` keeps working after `npm install`

**Kept packages**
- Keep `skills` (npx pin for Install), `commander`, `kleur`, `yaml`, `@octokit/rest`
- Do not change prompt logic unless an import path changes after the pin (should not)

## Capabilities

### New Capabilities

<!-- None — dependency hygiene for existing Install/tooling, not a new domain folder. -->

### Modified Capabilities

- `distribution`: Require packages imported by the Install category checkbox prompt (`@inquirer/core`, `@inquirer/ansi`, `@inquirer/figures`) to be Direct dependencies; require `skills` to remain a Direct dependency; require unused `@clack/prompts`, `@inquirer/prompts`, `prompts`, and `simple-git` not to be Direct dependencies

## Impact

- **Primary files**: `package.json`; `package-lock.json` (via `npm uninstall` / `npm install`, not hand-edited)
- **Secondary files**: `CHANGELOG.md` (maintainer-facing if changelog-generator includes it); `plans/README.md` row 004 marked DONE at apply
- **Skill types affected**:
  - **Foreign/source skills**: unchanged trees
  - **Customized skills (overlays)**: overlay apply pipeline unchanged
  - **Local-only skills**: unaffected
- **Dependencies**: remove four unused packages; add three `@inquirer/*` Direct dependencies; keep `skills`
- **STOP / deferred**: production import of a package about to be removed; peer conflict on `@inquirer/core`; unrelated major bumps of `commander` / `yaml` / `@octokit/rest` (revert those); `execFile` for git/npx (plan 006); ESLint; interactive `npm run install` as a CI gate
