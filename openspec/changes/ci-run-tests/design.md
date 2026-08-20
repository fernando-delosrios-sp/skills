## Context

Maintainers already run `npm test` locally (`node --test test/**/*.test.mjs` via `package.json`). GitHub Actions Validate workflow (`.github/workflows/validate.yaml`) checks out the repo, sets up Node 20, runs `npm ci`, then `npm run validate` only. Overlay apply order is unchanged: **sync → static → audit → restore → remerge → apply**. This change does not touch `lib/` or overlay scripts; it wires the existing test entry point into the merge-gate job.

## Goals / Non-Goals

**Goals:**

- Fail Validate workflow when `npm test` exits non-zero
- Keep full validate (structure + blend) on the same job; blend warnings still do not fail validate
- Document that this repo’s merge gate is tests + full validate, not `--structure-only`

**Non-Goals:**

- Changing `.github/workflows/sync.yaml`
- Adding ESLint, Prettier, typecheck, or git hooks
- Changing `npm run validate` default to `--structure-only` or renaming `package.json` scripts
- Repairing a red local suite (STOP; later plans)
- Extra GitHub permissions, secrets, `fetch-depth: 0`, or network access for tests

## Decisions

### D1: Same job, not a new workflow

- **Choice**: Add a Test step to the existing `validate` job
- **Reason**: Reuses checkout, Node 20, and `npm ci`; one merge-gate status
- **Considered alternatives**: Separate tests workflow (duplicate setup); `sync.yaml` (manual dispatch, deferred)

### D2: Test before validate

- **Choice**: After `npm ci`, run `npm test`, then `npm run validate`
- **Reason**: Suite failures fail faster; validate still runs when tests pass
- **Considered alternatives**: Tests after validate (works, slower feedback)

### D3: Command is `npm test`

- **Choice**: Step `run: npm test` (not watch, not a new script)
- **Reason**: Matches `package.json` `"test"`; reviewer check from plan 001
- **Considered alternatives**: `npm run test -- --watch` (would hang CI)

### D4: Full validate remains the job’s second gate

- **Choice**: `npm run validate` with no `--structure-only`
- **Reason**: Existing spec: blend warnings exit 0; this repo currently runs full validate and should keep doing so
- **Considered alternatives**: Switch CI to `--structure-only` (contradicts plan 001; README already overstates that path)

### D5: README one-liner only

- **Choice**: Correct the structure-only CI implication; do not rewrite maintainer catalog
- **Reason**: Plan 005 owns catalog; this change must not invent a structure-only CI job
- **Considered alternatives**: Leave README entirely (allowed by plan; rejected because the current sentence is already wrong)

### D6: Workflow action pin

- **Choice**: Keep `actions/checkout@v4`, `actions/setup-node@v4`, `node-version: '20'`
- **Reason**: Repo convention; no extra git history needed for tests
- **Considered alternatives**: `fetch-depth: 0` (needed only if CI were blend-audit via shallow-clone issues; not this change)

## Risks / Trade-offs

- **[Risk] Local suite already failing on HEAD** → Mitigation: apply STOP — do not change YAML until `npm test` exits 0; do not “fix the suite” in this change
- **[Risk] `npm test` already present in validate.yaml** → Mitigation: mark plan 001 REJECTED as already present; no duplicate step
- **[Risk] Later tests clone remotes or need secrets** → Mitigation: this suite must stay network-free; extra permissions are a STOP
- **[Trade-off] Full validate on every PR is slower than `--structure-only`** → Reason for acceptance: blend warnings stay visible; structure-only is a local/opt-in flag, not this merge gate
- **[Trade-off] Plan 001 said no new unit tests** → Reason for acceptance: added `test/validate-workflow.test.mjs` named after spec scenarios so CI YAML cannot regress without a failing test; glossary terms still wait for archive

## Migration Plan

1. Confirm `npm test` and `npm run validate` exit 0 on HEAD
2. Edit `validate.yaml`; optionally README
3. Re-run the same local commands; assert YAML contains `run: npm test` and `npm run validate`
4. Changelog via changelog-generator; set plan 001 DONE in `plans/README.md`
5. Rollback: remove the Test step; restore README sentence

Acceptance: Validate workflow YAML has Test then Validate skills; local tests and validate pass; no files outside in-scope list except changelog and plan index.

## Open Questions

None.
