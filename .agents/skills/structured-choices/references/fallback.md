# Fallback

Reached only after a question-tool call came back as an error. A judgement about your tool list is not an error — go back and make the call.

## Ask in prose

Open with the question itself. Then one short line per option, `id` first so the user can answer with a word, recommended option first. Halt and wait.

```markdown
Where should issues live for this repo?

- **github** — GitHub; the remote already points there (recommended)
- **local-md** — local markdown files under `.scratch/`
- **other** — name the tracker and I'll adapt
```

The host's plumbing is yours to handle, not the user's to hear about: the question stands on its own, and any line explaining which tools you have costs the user a read and tells them nothing they can act on.

Map the answer back to an option `id` before continuing, exactly as with a tool call.

## Hosts that parse the contract

A host you know consumes `<decision_prompt>` JSON gets the block below instead of the prose above. Everyone else reads it as unreadable JSON, so a human-facing gate stays with prose.

```markdown
<decision_prompt>
{
  "type": "button_group",
  "question": "<one sentence>",
  "options": [
    { "id": "<value>", "label": "<display> (Recommended)", "detail": "<optional>" }
  ],
  "allow_custom_input": true,
  "recommended": "<id>"
}
</decision_prompt>
```

`type`: `button_group` | `select` | `confirm_dialog` | `multi_select`
