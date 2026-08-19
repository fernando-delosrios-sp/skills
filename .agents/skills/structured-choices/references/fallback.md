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

A host that consumes `<decision_prompt>` JSON ([contract](payload-examples.md#universal-contract)) gets that block instead. To every other reader it is unreadable JSON, so it stays out of a human-facing gate.
