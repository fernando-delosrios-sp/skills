# AGENTS.md blocks

Canonical User gates text for **structured-choices Install**. The ferspec adopters fragment omits User gates — Install owns that content after setup-matt-pocock-skills.

## Standalone — `## User gates`

Use when the target file has no `## Agent skills` section. Append at end, or update an existing `## User gates` in place.

```markdown
## User gates

When presenting forks, confirmations, or permission pauses, follow the **structured-choices** skill — one gate per message; never duplicate options as numbered lists in chat.

A gate is a call to the host's question tool — Cursor `AskQuestion`, elsewhere `prompt_user_decision` — made as your first move, since the call is the check. When a call comes back as an error, structured-choices covers what to do instead.
```

## Under Agent skills — `### User gates`

Use when `## Agent skills` already exists. Add or update this subsection (after `### Domain docs` when present, else at end of the block).

```markdown
### User gates

Present forks and confirmations via **structured-choices** — a gate is a call to the host's question tool (Cursor: `AskQuestion`), made as your first move since the call is the check; one gate per message, options never as prose lists.
```
