## Why

The Validate workflow installs dependencies and runs `npm run validate` but never `npm test`, even though the test script already exists. Overlay, sync, and import regressions can merge as long as manifests parse. Later characterization work depends on CI actually running the suite.

## What Changes

**Validate workflow merge gate**
- From: `npm ci` then `npm run validate` only
- To: `npm ci`, then `npm test`, then full `npm run validate` (no `--structure-only`)
- Reason: fail the job on a red unit test suite; keep blend warnings as non-failing validate output
- Impact: non-breaking for local npm scripts; PRs that fail `npm test` will fail CI

**README CI wording**
- From: implies `--structure-only` when “CI only needs structure checks”
- To: one sentence that this repo’s Validate workflow runs `npm test` then full `npm run validate`
- Reason: match actual merge-gate behavior; fuller catalog stays with plan 005
- Impact: non-breaking docs

## Capabilities

### New Capabilities

<!-- None — Validate workflow is tooling CI, not a new domain folder. -->

### Modified Capabilities

- `tooling`: Require the Validate workflow to run `npm test` after `npm ci` and before full `npm run validate`; keep Node 20 and existing action versions; do not switch the job to `--structure-only`
- `ubiquitous-language`: Add **Validate workflow**; clarify that Structure validation’s `--structure-only` flag is not this repo’s merge gate

## Impact

- **Primary files**: `.github/workflows/validate.yaml`; `README.md` (one-line CI correction)
- **Secondary files**: `CHANGELOG.md`; `plans/README.md` status for plan 001 (DONE after apply)
- **Skill types affected**:
  - **Foreign/source skills**: unchanged trees; regressions in overlay/sync/import code now fail CI via `npm test`
  - **Customized skills (overlays)**: overlay apply pipeline unchanged
  - **Local-only skills**: unaffected
- **Dependencies**: none; no extra GitHub permissions, secrets, or network
- **Deferred**: tests on `sync.yaml`; lint/typecheck/hooks; README catalog (plan 005); suite characterization (plan 002+)
