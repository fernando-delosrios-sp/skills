## 1. Preflight (STOP before YAML)

- [x] 1.1 Run `npm test` on HEAD; if exit is non-zero, STOP — do not edit YAML or “fix the suite” (later plans)
- [x] 1.2 Confirm `.github/workflows/validate.yaml` does not already contain `run: npm test`; if it does, STOP and mark plan 001 REJECTED as already present

## 2. Validate workflow

- [x] 2.1 After `npm ci`, add a step `name: Test` with `run: npm test` (not `--watch`) before `Validate skills`
- [x] 2.2 Keep `actions/checkout@v4`, `actions/setup-node@v4`, and `node-version: '20'`; do not add `fetch-depth: 0`
- [x] 2.3 Leave the Validate skills step as `npm run validate` with no `--structure-only`
- [x] 2.4 Do not modify `.github/workflows/sync.yaml`

## 3. Verification

- [x] 3.1 Confirm canonical test command: `npm test` (exit 0)
- [x] 3.2 Run `npm run validate` and confirm exit 0 (warnings allowed)
- [x] 3.3 Assert YAML: `python3 -c "import pathlib; t=pathlib.Path('.github/workflows/validate.yaml').read_text(); assert 'run: npm test' in t; assert '--watch' not in t; assert 'npm run validate' in t; assert '--structure-only' not in t"` — covers Test step after npm ci, no watch, full validate, test failures fail the job (default step failure)
- [x] 3.4 Confirm `git diff --stat -- .github/workflows/sync.yaml` is empty (Sync workflow out of scope)
- [x] 3.5 Glossary scenarios (Validate workflow term; Structure validation notes) land at archive via delta specs; YAML/README scenarios covered by `test/validate-workflow.test.mjs`

## 4. Documentation

- [x] 4.1 In `README.md`, add that this repo’s Validate workflow runs `npm test` then full `npm run validate`; do not invent a structure-only CI job
- [x] 4.2 Confirm `rg -n "npm test" README.md` has at least one match
- [x] 4.3 Set plan 001 status to DONE in `plans/README.md` (unless a reviewer maintains the index)
- [x] 4.4 No API/CLI help changes (`package.json` scripts unchanged)

## 5. Changelog

- [x] 5.1 Create or update changelog entry for this change via **changelog-generator**
- [x] 5.2 Confirm the entry states the Validate workflow now runs unit tests before full validate
