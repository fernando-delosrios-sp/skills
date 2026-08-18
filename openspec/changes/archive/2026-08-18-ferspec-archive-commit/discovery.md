## Scope

In: ferspec archive phase MUST commit synced specs and moved change folders after `/opsx:archive`; wire via `operations.archive.guidance`, README, INSTALL, AGENTS fragment, and openspec-init config template. Out: changing apply phase (archive stays manual); OpenSpec CLI fork.

## Language

**Archive post-commit gate** (`promote`):
Blocking verification after archive commit — clean `git status --porcelain` and latest commit includes synced specs plus archive folder paths.
_Avoid_: "archive done", "archive complete" without commit

**Operation guidance** (`promote`):
Advisory strings from `openspec/config.yaml` → `operations.archive.guidance`, surfaced by `openspec instructions archive --json` for `/opsx:archive` agents.
_Avoid_: schema instruction (OpenSpec schema.yaml has no archive block)

**Archive output commit** (`draft`):
Required git commit staging `openspec/specs/` and `openspec/changes/` after sync and move; CLI does not commit.
_Avoid_: optional commit, defer to user

## Decisions

**Context:** ferspec README said "commit archive output" but had no concrete steps; OpenSpec `/opsx:archive` ends after move with no commit.

**Q1:** Where to encode archive commit steps?
→ **Chosen:** `operations.archive.guidance` in config.yaml (OpenSpec 1.8+ `openspec instructions archive`) plus ferspec README sub-steps A/B/C. **Rejected:** schema.yaml `archive:` block — OpenSpec SchemaYamlSchema has no archive key.

**Q2:** Keep archive separate from apply?
→ **Yes.** ferspec invariant unchanged; commit runs during manual `/opsx:archive`, not `/opsx:apply`.

**Q3:** git-commit skill required?
→ **Preferred** via Skill tool; **manual fallback** conventional commit when absent — same pattern as superpowers-bridge 5d.

## Open questions

None — scope locked.

## Scenarios discussed

- Re-run archive when change already under `archive/` but spec sync uncommitted → commit step still required.
- Porcelain empty after move (no delta specs) → skip commit creation, still run gate.
- git-commit skill missing → manual `docs(openspec): archive <name> and sync specs` — not skippable when porcelain non-empty.
