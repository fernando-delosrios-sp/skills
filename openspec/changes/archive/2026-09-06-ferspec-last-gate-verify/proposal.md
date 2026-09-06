## Why

Apply often hands off while `/opsx:verify` still surfaces CRITICAL/WARNING/SUGGESTION items. Two competing gates (verify-aligned + verify-fix) and a ghost skill name (`openspec-verify-change`) invite premature completion.

## What Changes

**ferspec apply last gate**
- From: verify-aligned 8-row gate + verify-fix loop + openspec-verify-change
- To: single **verify** gate via `/opsx:verify` until all three tiers empty; confirmation scorecard-only pass
- Reason: one checkable bound; lighter schema prose
- Impact: apply-code-changes skill step merge; config guidance

**Config seam**
- From: archive guidance only
- To: `operations.apply.guidance` surfaced as `operationGuidance` for `/opsx:apply`
- Reason: slash command loads apply instructions JSON
- Impact: openspec-init config template + this repo config.yaml

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `ferspec-workflow`: replace verify-fix requirement with last-gate verify bound; add apply operation guidance requirement

## Impact

- **Primary**: `skills/engineering/openspec-init/schemas/ferspec/`, `skills/engineering/apply-code-changes/`
- **Dogfood**: `openspec/schemas/ferspec/`, `openspec/config.yaml`, `AGENTS.md`
- **Spec**: `openspec/specs/ferspec-workflow/spec.md`
- **Bundle**: VERSION 1.2.0 (graph version 1 unchanged)
