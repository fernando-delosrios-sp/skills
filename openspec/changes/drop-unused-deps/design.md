## Context

`npm run install` (`scripts/install.mjs`) drives category selection via `lib/category-checkbox-prompt.mjs`, which imports `@inquirer/core`, `@inquirer/ansi`, and `@inquirer/figures`. Those packages are not Direct dependencies today; they arrive through `@inquirer/prompts`. `package.json` also lists `@clack/prompts`, `@inquirer/prompts`, `prompts`, and `simple-git` with no production imports in `lib/` or `scripts/`. Overlay apply order is unchanged (**sync → static → audit → restore → remerge → apply**). No overlay or catalog tree is touched.

No C4 diagram: one Node process, no new containers.

## Goals / Non-Goals

**Goals:**

- Drop the four unused Direct dependencies.
- Declare the three `@inquirer/*` packages the Install prompt already imports so a fresh `npm install` still resolves `lib/category-checkbox-prompt.mjs`.
- Keep the `skills` npm package pin used by Install (`npx skills add`).
- Refresh `package-lock.json` only via npm; versions for the three packages come from the existing lockfile.

**Non-Goals:**

- Removing `skills`.
- Switching git/`npx` to `execFile` (plan 006).
- Adding ESLint.
- Changing category-checkbox prompt logic (unless an import path changes after the pin — it should not).
- Requiring interactive `npm run install` as a CI/non-TTY gate.
- Adding new automated tests (regression: existing suite + ESM import of the prompt module).

## Decisions

### D1: Promote imported `@inquirer/*` before dropping `@inquirer/prompts`

- **Choice**: Add `@inquirer/core`, `@inquirer/ansi`, and `@inquirer/figures` as Direct dependencies, then remove `@inquirer/prompts` (along with `@clack/prompts`, `prompts`, `simple-git`).
- **Reason**: Install would break if `@inquirer/prompts` were removed while the prompt file still imported nested packages.
- **Considered alternatives**: Remove unused packages only — rejected (breaks Install). Keep `@inquirer/prompts` as the umbrella pin — rejected (unused API; hides the real imports).

### D2: Pin versions from the current lockfile

- **Choice**: Read `package-lock.json` `packages['node_modules/@inquirer/{core,ansi,figures}'].version` and add with `^` (or exact lockfile versions). Do not invent majors.
- **Reason**: stay on the majors already resolved in this tree.
- **Considered alternatives**: Latest majors from the registry — rejected (unrelated upgrade). Hand-edit lockfile — rejected.

### D3: Apply via npm uninstall then npm install

- **Choice**: `npm uninstall @clack/prompts @inquirer/prompts prompts simple-git` then `npm install @inquirer/core @inquirer/ansi @inquirer/figures`. If uninstall already dropped transitives, install the three explicitly.
- **Reason**: lockfile stays npm-owned; accidental major bumps of `commander` / `yaml` / `@octokit/rest` can be reverted.
- **Considered alternatives**: Hand-edit `package.json` and lockfile — rejected. Leave `simple-git` until plan 006 — rejected (already unused).

### D4: Verification without interactive Install

- **Choice**: Confirm zero production imports with `rg` (STOP if found). After install: `package.json` `dependencies` must omit the four unused names and include the three `@inquirer/*` plus `skills`. `npm test` and `node -e "import './lib/category-checkbox-prompt.mjs'"` exit 0.
- **Reason**: TTY Install is not a CI-safe gate; loading the prompt module is the resolvability check.
- **Considered alternatives**: New unit tests for `package.json` contents — rejected (plan: no new tests). Interactive `npm run install` in CI — rejected.

## Risks / Trade-offs

[Risk] `rg` finds a real production import of a package about to be removed → Mitigation: STOP; do not improvise a replacement.

[Risk] Peer conflict installing `@inquirer/core` as a Direct dependency → Mitigation: STOP.

[Risk] Lockfile includes unrelated major bumps of `commander` / `yaml` / `@octokit/rest` → Mitigation: revert those; only intended deps.

[Risk] `skills` accidentally dropped during uninstall → Mitigation: post-check `dependencies` MUST contain `skills`; reviewer skims lockfile.

[Trade-off] No new tests; only import + existing suite → Reason for acceptance: this change is declaration-only; prompt behavior is unchanged.

## Migration Plan

N/A — no deployment or public API change. Apply on `advisor/004-unused-deps`. Do not push unless asked. Commit message: `chore(deps): drop unused prompt libs and simple-git`.

Acceptance: four unused packages gone; three `@inquirer/*` plus `skills` are Direct dependencies; `npm test` exits 0; prompt module imports; `plans/README.md` row 004 DONE.

## Open Questions

None. STOP conditions (import found, peer conflict, unrelated majors) are apply-time gates, not open design forks.
