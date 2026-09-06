## Scope

In: collapse ferspec apply verify-aligned + verify-fix into one **verify** last gate (`/opsx:verify` with empty CRITICAL/WARNING/SUGGESTION); add `operations.apply.guidance`; prune ghost `openspec-verify-change` name; update apply-code-changes skill; bump ferspec bundle to 1.2.0. Out: restore verify.md artifact; edit global `~/.cursor/commands/opsx-*.md`; superpowers-bridge changes.

## Language

**verify** (`promote`): The single apply last gate — run `/opsx:verify` on the verification ref until CRITICAL, WARNING, and SUGGESTION tiers are all empty.

**confirmation scorecard** (`draft`): A scorecard-only re-run of `/opsx:verify` that must not invent new SUGGESTIONs from unchanged code.

## Decisions

**Q1:** Bound for handoff?
→ **Chosen:** drain all three tiers (CRITICAL, WARNING, SUGGESTION).

**Q2:** Restore verify.md?
→ **Chosen:** no — keep DAG lean; tasks Verification N.2 is coverage evidence.

**Q3:** Where does slash-command guidance live?
→ **Chosen:** `operations.apply.guidance` in config.yaml (same seam as archive).

## Open questions

None.

## Scenarios discussed

- Apply completes → standalone `/opsx:verify` must be empty in all three tiers.
- Worktree venue → squash merge before verify.
- `/opsx:apply` says "all tasks complete" → guidance says that is not handoff.
