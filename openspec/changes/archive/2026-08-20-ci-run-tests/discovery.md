## Scope

In: add `npm test` to the Validate workflow (`.github/workflows/validate.yaml`) after `npm ci` and before full `npm run validate`; correct README so it does not imply this repo’s CI is structure-only. Out: `sync.yaml`, lint/typecheck/hooks, changing validate’s default flag, `package.json` script names, and fixing a failing local test suite (STOP — later plans).

## Language

**Validate workflow** (`promote`):
The GitHub Actions workflow in `.github/workflows/validate.yaml` that is this repository’s merge gate on push and pull request to `main`.
_Avoid_: “CI” as a synonym for structure-only validate; conflating with the Sync workflow (`.github/workflows/sync.yaml`)

**Structure validation** (`conflicts-with-canonical`):
Canonical notes say CI *may* run `--structure-only`. This change does not redefine Structure validation; it clarifies that **this repo’s Validate workflow** runs full validate (structure + blend), not structure-only.
_Avoid_: treating `--structure-only` as what `validate.yaml` does today

**Unit test suite** (`draft`):
The existing `npm test` script (`node --test test/**/*.test.mjs`). Local Node tests; no GitHub secrets or network.
_Avoid_: watch mode; a separate CI-only test command

## Decisions

**Context:** `package.json` already defines `test`; Validate workflow runs `npm ci` then `npm run validate` only. Overlay/sync/import regressions can merge if manifests still parse. Plan 001 at commit `829de43`.

**Q1:** Tests in Validate workflow vs a new workflow?
→ **Chosen:** same `validate` job. **Rejected:** new workflow (duplicates checkout/setup); wiring tests into `sync.yaml` (deferred).

**Q2:** Step order?
→ **Chosen:** `npm test` after `npm ci`, before `npm run validate` so a red suite fails faster.

**Q3:** `--structure-only` in this job?
→ **No.** Keep full `npm run validate`. Blend warnings MUST NOT fail validate (existing tooling spec); test failures MUST fail the job.

**Q4:** README?
→ **Yes, one sentence.** Plan 005 owns a fuller catalog; this change only corrects the line that implies CI is structure-only.

**Q5:** Action versions / fetch-depth?
→ **Keep** `actions/checkout@v4`, `actions/setup-node@v4`, Node 20. Do not add `fetch-depth: 0`.

## Open questions

None — locked by `plans/001-ci-run-tests.md`. Assumption: include the preferred README one-liner.

## Scenarios discussed

- Validate workflow has a Test step that runs `npm test` (not `npm run test -- --watch`).
- Full `npm run validate` still runs; job does not switch to `--structure-only`.
- Local `npm test` must already pass on HEAD before YAML is changed; if not, STOP (do not fix the suite here).
- If `npm test` is already in the workflow, treat the change as already present (reject implementation, not this proposal).
- Tests needing extra GitHub permissions, secrets, or network → STOP; suite is local Node only.
- `sync.yaml` unchanged.
