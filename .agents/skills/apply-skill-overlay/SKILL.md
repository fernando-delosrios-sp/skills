---
name: apply-skill-overlay
description: >-
  Apply semantic skill overlays and agent generators on top of upstream-canonical skill trees.
  Use after `npm run sync` when overlays are pending, or when the user asks
  to apply/customize/reconcile a skill overlay or generators. Triggers include "apply overlay",
  "apply generators", "customize skill", "reconcile skill changes", or a skill name with pending
  overlay status from sync output.
disable-model-invocation: false
---

# Apply Skill Overlay

Merge local **intent** from overlay config into freshly synced **upstream** skill files, then apply **generators** (derived outputs). Overlays encode behavioral requirements, not brittle patches.

**In scope:** semantic `{ file, instructions }` changes, and all resolved generators `{ id, instructions, file? }` (universal + per-skill).

**Out of scope:** static file ops (`npm run overlay -- static`), upstream fetching (`npm run sync`), overlay authoring (`npm run extract-overlay`).

## Invocation

Apply order: **sync → static changes → semantic changes → generators (agent)**

Overlay authoring reference: [README.md#skill-overlays](../../../README.md#skill-overlays)

```bash
npm run update
# Or step-by-step:
npm run sync
npm run overlay -- static          # optional if prepare runs it
npm run overlay -- prepare         # writes .tmp/overlay-apply/<skill>.md
# In Cursor: "Apply overlay for git-commit" or "Reconcile pending skill overlays"
npm run validate
git diff
git commit
```

For skills without a per-skill overlay (generators only):

```bash
npm run overlay -- prepare-generators --skill <name>
# In Cursor: apply generators for <name>
```

Activates when the user names a skill sync flagged as pending, references `.tmp/overlay-apply/<skill>.md`, or asks to apply/customize/reconcile a skill or its generators.

## Preconditions

Verify all before applying. Stop with the remediation below — do not partially apply.

| Check | Remediation |
|-------|-------------|
| Per-skill overlay expected but `overlays/<skill>/OVERLAY.yaml` missing | Create overlay or verify skill name; for generators-only use `prepare-generators` |
| `skills/<category>/<skill>/SKILL.md` missing | Run `npm run sync -- --skill <name>` |
| Static `action: add` target missing from skill dir | Run `npm run overlay -- static -- --skill <name>` |

**Done when:** all checks pass, or you stop with a specific remediation message.

## Inputs

| Input | Resolution |
|-------|------------|
| Skill name (e.g. `git-commit`) | Look up category in `skills/<category>/skills.json`; overlay in `overlays/<name>/` when present |
| Manifest (`.tmp/overlay-apply/<skill>.md`) | Read first when provided or present from `npm run overlay -- prepare` or `prepare-generators` |
| "All pending" | Skills where overlay exists and `overlay_applied_at < synced_at` in `.locks/upstream.json` |

When multiple skills are pending, apply **one at a time** and confirm before the next — unless the user explicitly asked for all.

## Workflow

### 1. Load context

- Read `overlays/<skill>/OVERLAY.yaml` when it exists
- Read universal `overlays/OVERLAY.yaml` generator defaults
- Resolve full generator list for this skill (universal minus `disable`, plus `generators.add`)
- Read `.locks/upstream.json` entry when present (`sha`, `synced_at`, `overlay_applied_at`)
- List all files in `skills/<category>/<skill>/` (post-static tree)
- Use manifest as working brief when available

**Done when:** overlay instructions, resolved generators, lock state, and current skill tree are loaded.

### 2. Apply semantic changes (overlay order)

When per-skill overlay has semantic `{ file, instructions }` entries:

1. Read the **current** file (upstream-canonical + static ops)
2. Interpret `instructions` as behavioral **intent**, not literal search/replace
3. Edit to satisfy intent while preserving upstream structure where instructions don't contradict it
4. On conflict: honor the instruction's behavioral goal; adapt to upstream structure — note in report

**Done when:** every semantic entry in OVERLAY.yaml has been edited (or there are none).

### 3. Apply generators (overlay order)

For each resolved generator (`id`, `instructions`, optional `file`):

1. When `file` is set: skip if a static `add/replace` pinned that path and instructions don't require regeneration
2. When `file` is set: read the **current** target file if it exists (may be absent on first apply)
3. Interpret `instructions` as behavioral **intent** for derived output (path from `file` or from instructions when omitted)
4. Create or edit file(s) using the merged skill tree as context (especially `SKILL.md`)

**Done when:** every resolved generator has been addressed — output at `file` when set, or per instructions when not (or intentionally skipped).

### 4. Self-check

- [ ] Every semantic change in OVERLAY.yaml addressed (when applicable)
- [ ] Every resolved generator addressed
- [ ] `SKILL.md` frontmatter has valid `name` and `description`
- [ ] No placeholder text from drafting
- [ ] Cross-references between files resolve
- [ ] Instruction intent met — not just diff minimization

**Done when:** every checkbox passes.

### 5. Validate

Run `npm run validate`. Fix apply-caused issues and re-run.

**Done when:** validation passes.

### 6. Update lock and clean up

When a per-skill overlay exists and was applied, set `overlay_applied_at` to the current ISO timestamp in `.locks/upstream.json`. Do **not** change `sha` or `synced_at`.

Remove the apply manifest for this skill:

```bash
npm run clean -- --skill <skill>
```

Or delete `.tmp/overlay-apply/<skill>.md` directly. Keep manifests for skills whose overlay apply is still pending.

**Done when:** lock updated when applicable, manifest removed, and validation still passes.

### 7. Report

```markdown
## Overlay applied: <skill>

**Upstream SHA:** <sha or n/a>
**Overlay:** overlays/<skill>/OVERLAY.yaml (or universal generators only)

### Files changed
- <file> — <summary>

### Generators applied
- <id> → <file> — <summary>

### Adaptations
- <upstream structure changes mapped to intent>

### Static ops (pre-applied)
- <list or "none">

### Next steps
- Review: `git diff skills/<category>/<skill>/`
- Manifest cleaned via `npm run clean -- --skill <skill>` (or delete `.tmp/overlay-apply/<skill>.md`)
- Commit when satisfied
```

**Done when:** report emitted.

## Merge principles

1. **Upstream is the base.** Start from synced files, not memory of old forks.
2. **Overlay encodes intent.** Instructions describe *what behavior to enforce*, not *exact final text*.
3. **Minimize gratuitous diffs.** Don't rewrite upstream prose that already satisfies intent.
4. **Prefer integration over insertion.** Merge intent into upstream's new sections rather than duplicating.
5. **Explicit overrides win.** If instructions say "replace X with Y", find the equivalent upstream location and replace.
6. **Flag uncertainty.** Ask one focused question before guessing.

## Error handling

| Situation | Behavior |
|-----------|----------|
| Target file missing | Check if static op should have created it; stop if unrecoverable |
| Upstream section removed | Map intent to nearest equivalent; document in Adaptations |
| Multiple semantic changes to same file | Apply in overlay order; each pass sees prior edits |
| Validation fails after apply | Fix and re-validate; do not update lock until pass |
| Generators-only skill (no per-skill overlay) | Apply generators from manifest; skip lock update unless overlay exists |
| Static-only overlay | Skip semantic apply; apply generators; update lock after verifying static ops |

## Related tools

| Tool | Role |
|------|------|
| `npm run overlay -- prepare` | Write apply manifest (semantic + generators) for overlay skills |
| `npm run overlay -- prepare-generators` | Write generator manifests for any skill |
| `npm run extract-overlay` | Drafts overlays — does not apply them |
| `npm run validate` | Gate before lock update |
| `npm run clean` | Remove `.tmp` clone caches; `--manifests` for applied overlay manifests |
| [README.md#skill-overlays](../../../README.md#skill-overlays) | OVERLAY.yaml authoring reference |

## Example

**User:** "Apply overlay for git-commit"

1. Confirm overlay or generator manifest exists
2. Run static ops if needed: `npm run overlay -- static -- --skill git-commit`
3. Apply semantic instructions to `SKILL.md` when present
4. Apply all resolved generators (e.g. `openai-manifest`, `commit-helper-config`)
5. Validate, update lock when overlay exists, report
