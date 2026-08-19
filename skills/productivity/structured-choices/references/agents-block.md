# AGENTS.md blocks

Canonical User gates text for **structured-choices Install**. The ferspec adopters fragment omits User gates — Install owns that content after setup-matt-pocock-skills.

## Standalone — `## User gates`

Use when the target file has no `## Agent skills` section. Append at end, or update an existing `## User gates` in place.

```markdown
## User gates

When presenting forks, confirmations, or permission pauses, follow the **structured-choices** skill — one gate per message; never duplicate options as numbered lists in chat.

Call the host's question tool — Cursor `AskQuestion`, elsewhere `prompt_user_decision` or whatever tool presents choices to the user. Hosts without one fall back per the **structured-choices** skill.
```

## Under Agent skills — `### User gates`

Use when `## Agent skills` already exists. Add or update this subsection (after `### Domain docs` when present, else at end of the block).

```markdown
### User gates

Present forks and confirmations via **structured-choices** — call the host's question tool (Cursor: `AskQuestion`); one gate per message, options never as prose lists.
```
