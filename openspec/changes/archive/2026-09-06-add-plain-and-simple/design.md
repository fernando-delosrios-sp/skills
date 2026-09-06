## Context

Agents in this repo have no local-only skill that defaults to clarity-first brevity. `caveman` already exists as a token-saving, fragment-heavy mode with `disable-model-invocation: true`. This change adds a separate productivity skill **plain-and-simple** so installed agents can model-invoke readable, short, complete answers.

Implementation is catalog + skill tree only: Canonical tree under `skills/productivity/plain-and-simple/`, Manifest entry without `source`, README category catalog row, generated `agents/openai.yaml` from the universal **openai-manifest** Generator. Overlay apply order (**sync → static → audit → restore → remerge → apply**) is unchanged and does not run for this local-only skill. No `lib/` or npm script changes.

No C4 diagram: one skill package, no new containers. Omit Architecture.

## Goals / Non-Goals

**Goals:**

- Ship a local-only productivity skill named `plain-and-simple` with a compact SKILL.md that encodes discovery communication rules.
- Make it model-invoked (`description` present; no `disable-model-invocation`).
- List it in the productivity Manifest without `source`; keep the README category catalog in set equality with Manifests.
- Generate `agents/openai.yaml` from SKILL.md frontmatter via the existing openai-manifest Generator (omit `policy` because implicit invocation is allowed).
- Leave `caveman` unchanged.

**Non-Goals:**

- Rewriting or overlaying `caveman`.
- Fixed word or sentence caps.
- Mandatory examples on every answer.
- A standing “ask me to expand” footer.
- Overlay YAML, `lib/` modules, or npm script changes.
- Runtime LLM evaluation of prose quality.

## Decisions

### D1: Separate Canonical tree, not a caveman rewrite

- **Choice**: Add `skills/productivity/plain-and-simple/` as a **Local-only skill**. Do not edit `caveman`.
- **Reason**: Discovery Q1 — different goal (comprehension vs token compression).
- **Considered alternatives**: Rewrite caveman — rejected (would break token-saving users). Overlay on caveman — rejected (not a Source skill customization).

### D2: Model invocation via description only

- **Choice**: Frontmatter has `name` and `description`. Do not set `disable-model-invocation`. Generated `agents/openai.yaml` omits `policy` (implicit invocation allowed).
- **Reason**: Discovery Q2 — apply broadly when installed; user can still name the skill.
- **Considered alternatives**: `disable-model-invocation: true` like caveman/wait-what — rejected (one-shot toggle, not default mode). Session persistence flag — rejected (not a toggle skill).

### D3: Compact SKILL.md as the behavior module

- **Choice**: Put all communication rules in SKILL.md (frontmatter + short body). No extra reference files unless apply proves the body cannot stay scannable.
- **Reason**: Small interface: agents load one file. Depth lives in the rule set, not in tooling.
- **Considered alternatives**: Split references/ — rejected unless the body would exceed a compact skill. Encode rules in `lib/` — rejected (out of scope).

### D4: Adaptive budget encoded as shortest complete answer

- **Choice**: SKILL.md states the size bound as **shortest complete answer** — no numeric cap. Preserve full text for code blocks, exact errors, and irreversible-action warnings.
- **Reason**: Discovery Q3–Q4.
- **Considered alternatives**: Three-sentence / word-count limits — rejected (too brittle). TL;DR footer — rejected (Discovery Q8).

### D5: Catalog and generator via existing seams

- **Choice**: Append `{ "name": "plain-and-simple" }` to `skills/productivity/skills.json` (alphabetical among productivity names in README). Write `agents/openai.yaml` to match `expectedContentForPath` / openai-manifest rules. No per-skill Overlay.
- **Reason**: Local-only skills omit `source`; universal Generator already covers openai.yaml. Overlay pipeline is unused here.
- **Considered alternatives**: `source` pointing at this repo — rejected (not foreign). Hand-written openai.yaml that diverges from generator rules — rejected (structure validation would fail).

### D6: Tests assert artifacts, not prose quality

- **Choice**: Automated tests check Manifest shape, SKILL.md frontmatter, generated openai.yaml, README catalog membership, and that caveman is unmodified. Communication-rule scenarios are covered by SKILL.md content assertions (required phrases / absences).
- **Reason**: No LLM-in-the-loop in `npm test`. Apply still needs named tests per spec scenario.
- **Considered alternatives**: Snapshot an example agent transcript — rejected (non-deterministic). Skip tests for behavior specs — rejected (verify-aligned gate).

## Risks / Trade-offs

[Risk] Model invocation competes with other communication skills (caveman, wait-what) → Mitigation: description states clarity-first brevity and contrasts caveman; caveman stays explicit-only.

[Risk] Agents over-shorten and drop warnings → Mitigation: SKILL.md MUST require full irreversible-action warnings, exact errors, and unchanged code blocks.

[Trade-off] Behavior is specified as skill text, not an executable style linter → Reason for acceptance: agent skills are prompts; tests lock the contract in the file, not runtime wording.

[Trade-off] Adding a skill requires README + Manifest edits or CI fails → Reason for acceptance: existing README category catalog contract.

## Migration Plan

N/A — no deployment, endpoints, or database. Apply on the current branch.

Sequence at apply:

1. Add Canonical tree `skills/productivity/plain-and-simple/SKILL.md`.
2. Add Manifest entry (no `source`).
3. Write `agents/openai.yaml` from openai-manifest rules (or `npm run overlay -- prepare-generators --skill plain-and-simple` then apply generator output).
4. Update README productivity row (alphabetical names).
5. Add tests named after spec scenarios.
6. `npm test` and `npm run validate` exit 0.
7. Changelog via changelog-generator.

Rollback: delete the skill directory, revert Manifest/README/tests.

## Open Questions

None.
