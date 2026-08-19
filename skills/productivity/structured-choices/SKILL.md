---
name: structured-choices
description: Present user gates as structured interactive choices at forks, confirmations, and permission pauses. Run install to wire User gates into AGENTS.md or CLAUDE.md. Triggers include "install" and "install structured-choices".
---

## Install

Run when the user asks to **install** or **set up** structured-choices for this repo — including right after `npx skills add`. Do not gate; write agent config.

### 1. Explore

- `AGENTS.md` and `CLAUDE.md` at repo root — which exists? Is `## User gates` or `### User gates` already present?
- `## Agent skills` section — if present, prefer the subsection block (see [agents-block.md](./references/agents-block.md)).

### 2. Pick target file

- If `CLAUDE.md` exists, edit it.
- Else if `AGENTS.md` exists, edit it.
- If neither exists, create `AGENTS.md` unless the user names another file.

Never create `AGENTS.md` when `CLAUDE.md` already exists (or vice versa).

### 3. Choose block

From [agents-block.md](./references/agents-block.md):

- **`## Agent skills` present** → add or update **`### User gates`** (short block).
- **Otherwise** → add or update **`## User gates`** (full block).

Update in place when a User gates section already exists; do not append a duplicate.

### 4. Confirm and write

Show the section draft. After confirmation, write to the target file. Report which file was updated.

**Done when:** User gates section is present and matches the chosen block from agents-block.md.

---

## Gates (runtime)

At each **_gate_** — a fork, confirmation, or permission pause before you proceed — present choices structurally. Options live in a question-tool call, not as numbered prose the user must retype.

### When to gate

- Named-option forks (schema, library, strategy, path among candidates)
- Destructive or irreversible actions (delete, overwrite, force push)
- Permission pauses (install packages/skills, modify config)
- Ambiguous requirements the request or codebase cannot resolve

**Skip the gate** when only one sensible path exists, the question is genuinely open-ended ("What should I call you?"), or the host is non-interactive (CI) — pick a documented default and note the assumption.

### Gate rules

- **One gate per assistant message** — halt until the user responds. A gate may contain multiple questions when another skill composes it (e.g. grilling rounds).
- **Two or more fixed options** — do not fake a choice.
- **Record by `id`** — proceed using the option `id`, not paraphrased label text.
- **Recommended first** — list the suggested option first and suffix its `label` with `(Recommended)`.
- **No duplicate lists** — never also print "1. foo 2. bar" in prose when using a tool or block.

**Candidate count:** 1 match → inline one-line confirm; 2+ matches → full gate.

### Emit the gate

**Call the host's question tool** — Cursor names it `AskQuestion`, other hosts `prompt_user_decision`. If one is in your tool list, call it directly: no discovery step, no wrapper, no probing other tools first. Only a tool call renders real buttons, so it wins whenever one exists. Field mapping: [`payload-examples.md`](references/payload-examples.md#adapter-mapping).

**No question tool in your tool list** — say so in one line, then ask in plain prose: the question, one short line per option, and halt. Keep the `<decision_prompt>` block ([contract](references/payload-examples.md#universal-contract)) for hosts that actually parse it — to a human it is unreadable JSON.

### Carve-outs

- **Grilling rounds** — [`grilling`](../grilling/SKILL.md) composes this skill: one multi-question gate per round (native tool `questions` array or equivalent). Not a prose-list exception.
- Async questionnaires for third parties — use [`to-questionnaire`](../to-questionnaire/SKILL.md), not this skill.
