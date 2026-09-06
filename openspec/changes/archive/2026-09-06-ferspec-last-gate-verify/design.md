## Context

ferspec dropped verify.md to stay lean. apply-code-changes owns venue/bind/handoff. `/opsx:verify` is the real verifier (CRITICAL/WARNING/SUGGESTION). Schema and skill duplicated an 8-row mechanical gate plus a separate verify-fix loop.

## Goals / Non-Goals

**Goals:**
- One last gate: `/opsx:verify` empty in all three tiers before handoff.
- Prune verify-aligned, verify-fix, openspec-verify-change from ferspec + apply-code-changes.
- `operations.apply.guidance` for `/opsx:apply` completion semantics.
- Confirmation scorecard stabilizes drain-all.

**Non-Goals:**
- verify.md artifact; superpowers-bridge; editing global opsx commands.

## Decisions

### D1: Single verify gate

- **Choice**: Merge steps 5–6 in apply-code-changes into one **verify** step.
- **Reason**: One leading word; PRECHECK rows live inside verify pass.

### D2: operations.apply.guidance

- **Choice**: Mirror archive guidance pattern in config.yaml.
- **Reason**: `/opsx:apply` already loads `operationGuidance` from instructions apply JSON.

### D3: No verify.md

- **Choice**: Checkable bound = `/opsx:verify` report + tasks N.2 scenario coverage checkbox.

## Risks / Trade-offs

[Risk] Drain-all + heuristic verify may loop → Mitigation: confirmation scorecard-only pass must not invent new SUGGESTIONs.

## Migration Plan

Bundle 1.1.1 → 1.2.0 prose-only (graph v1). In-flight changes unaffected. Re-run apply uses new last gate.

## Open Questions

None.
