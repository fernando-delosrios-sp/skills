## Context

ferspec is a lean OpenSpec schema: discovery → proposal/design/specs → tasks → apply. Archive is manual via `/opsx:archive`, never part of apply. OpenSpec CLI 1.8+ loads archive advisory inputs from `openspec/config.yaml` → `operations.archive.guidance` via `openspec instructions archive --change "<name>" --json`. The built-in `/opsx:archive` skill template stops at move + summary — no commit step.

Prior art: superpowers-bridge apply step 5d/5e embeds commit inside apply's archive sub-phase. ferspec keeps archive manual but adopts the same commit + gate semantics.

## Goals / Non-Goals

**Goals:**
- Archive incomplete until synced specs and archive folder are committed and gated
- Guidance loadable by agents at archive time without reading README
- openspec-init seeds `operations.archive` for new ferspec projects
- Bundle semver bump (1.1.0) for template/guidance release

**Non-Goals:**
- Add `archive:` block to schema.yaml (unsupported by OpenSpec schema parser)
- Move archive into apply phase
- Change OpenSpec CLI `/opsx:archive` built-in steps 1–5
- Fork or patch `@fission-ai/openspec`

## Decisions

### D1: Config vs schema for archive instructions

- **Choice**: `operations.archive.guidance` in `openspec/config.yaml` + prose in ferspec README
- **Reason**: OpenSpec `generateArchiveInstructions()` reads project config only; schema has `apply` but no `archive` phase key
- **Considered alternatives**: schema.yaml top-level `archive:` — rejected (SchemaYamlSchema validation would fail or ignore)

### D2: Commit delegation

- **Choice**: Prefer **git-commit** skill; manual conventional commit fallback
- **Reason**: Matches superpowers-bridge 5d and repo conventions in config rules
- **Considered alternatives**: Always manual commit — rejected (inconsistent with apply)

### D3: Archive remains manual

- **Choice**: User runs `/opsx:archive` after merge or when ready; apply-code-changes unchanged
- **Reason**: ferspec design principle — process ceremony after shipping, not during apply handoff
- **Considered alternatives**: Fold commit into apply handoff — rejected (explicit user request to keep archive separate)

## Risks / Trade-offs

[Trade-off] Guidance is advisory in OpenSpec — agents could ignore `operationGuidance` → Mitigation: README MUST language, AGENTS anti-pattern, blocking gate steps in README table

[Trade-off] Existing ferspec projects need config refresh on openspec-init update → Mitigation: UPDATE.md lists `operations.archive` in config refresh scope

## Migration Plan

1. Ship ferspec bundle 1.1.0 and local `openspec/config.yaml` update
2. Projects on ferspec run openspec-init update path to merge `operations.archive` (preserve custom context/rules)
3. No graph version bump — in-flight changes unaffected
4. Rollback: revert bundle + remove `operations.archive` block from config

## Open Questions

None.
