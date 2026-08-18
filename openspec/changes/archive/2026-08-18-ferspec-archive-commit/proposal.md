## Why

ferspec documents archive as manual (`sync → move → commit`) but OpenSpec's built-in `/opsx:archive` workflow syncs specs and moves the change folder without committing. Agents reported archive complete while `openspec/specs/` and `openspec/changes/archive/` remained uncommitted — the same gap superpowers-bridge closes with apply step 5d/5e. ferspec needs explicit, machine-loadable archive commit guidance without folding archive into apply.

## What Changes

**Archive sequence**
- From: README mentions commit in one line; no config guidance; agents stop after move
- To: Sub-steps A (built-in archive) → B (commit) → C (post-commit gate); archive incomplete until C passes
- Reason: CLI leaves synced specs and moved folders uncommitted by design
- Impact: non-breaking; ferspec bundle 1.0.0 → 1.1.0

**Config wiring**
- From: `openspec/config.yaml` has rules only
- To: `operations.archive.guidance` with five advisory strings loaded by `openspec instructions archive`
- Reason: OpenSpec surfaces this as `operationGuidance` for `/opsx:archive`
- Impact: openspec-init config template updated; existing projects refresh on update

**Agent routing**
- From: anti-pattern lists archive inside apply only
- To: add anti-pattern for reporting archive complete without commit
- Impact: AGENTS.md fragment + root AGENTS.md

## Capabilities

### New Capabilities

- `ferspec-workflow`: Requirements for ferspec manual archive — commit archive output and post-commit gate after sync/move

### Modified Capabilities

<!-- None — distribution and tooling unchanged -->

## Impact

- **Primary**: `openspec/schemas/ferspec/README.md`, `VERSION` (1.1.0), `INSTALL.md`, `UPDATE.md`, `templates/adopters/AGENTS.md.fragment.md`
- **Canonical bundle**: `skills/engineering/openspec-init/schemas/ferspec/` (mirrored paths)
- **Config**: `openspec/config.yaml`, `skills/engineering/openspec-init/references/config.md`
- **Agent copies**: `.agents/skills/openspec-init/` mirrors
- **Root**: `AGENTS.md` anti-pattern line
- **Tests**: `npm run validate`; `openspec schema validate ferspec`
- **No runtime code** in `lib/` or `scripts/`
