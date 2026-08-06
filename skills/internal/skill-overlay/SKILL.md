---
name: skill-overlay
description: >-
  Full lifecycle for skill overlays: audit routing, apply/reconcile semantic merges and generators,
  extract overlay drafts, and document restore. Use after `npm run update` for remerge/fresh skills,
  or when the user asks to apply, extract, reconcile, or audit overlays. Triggers include
  "skill-overlay", "apply overlay", "extract overlay", "reconcile overlay", and pending remerge
  manifests from update output.
disable-model-invocation: false
---

# Skill Overlay

Manage the full overlay lifecycle: **audit → restore (npm) → apply/reconcile (agent) → extract**.

Overlays encode **behavioral intent** on upstream-canonical skill trees. Never paste previous blended output when upstream or overlay inputs changed.

Overlay reference: [README.md#skill-overlays](../../../README.md#skill-overlays)

## Mode routing

| Trigger | Mode | Executor |
|---------|------|----------|
| `npm run overlay -- audit` route = `restore` | restore | npm (`overlay restore`) — skill documents only |
| `npm run overlay -- audit` route = `remerge` or `fresh` | apply | agent |
| User asks to draft/refine overlay from local diffs | extract | agent guides `npm run extract-overlay` |
| Remerge with stale or unmapped instructions | reconcile | agent |
| User asks what changed / routing state | audit | agent reads `npm run overlay -- audit` |

**Apply order:** sync → static → audit → restore (unchanged) → prepare remerge manifests → apply/reconcile (agent)

```bash
npm run update
# auto: sync → static → audit → restore unchanged → prepare remerge manifests

npm run overlay -- audit [--skill <name>]
npm run overlay -- restore [--skill <name>]

# Cursor, remerge/fresh only:
# "skill-overlay apply all pending overlays"

npm run validate
git diff
git commit   # blended_ref must point at this commit for future restores
```

After `npm run update`, apply **all pending overlays** in one Cursor session unless the user scoped to a single skill (`--skill <name>`).

## Shared rules (all modes)

1. **Never literal-restore on changed inputs.** If `upstream_changed` or `overlay_changed`, do not copy prior blended files from git history, manifests, or extract drafts.
2. **Upstream post-sync + static is the merge base** for apply/reconcile.
3. **Overlay instructions = intent**, not exact final text.
4. **Restore is npm-only** when audit route = `restore` (both inputs unchanged).

## Preconditions

Verify before apply/reconcile. Stop with remediation — do not partially apply.

| Check | Remediation |
|-------|-------------|
| Audit route = `restore` | Stop — run `npm run overlay -- restore --skill <name>` |
| Per-skill overlay expected but missing | Create overlay or use `prepare-generators` for generators-only |
| `skills/<category>/<skill>/SKILL.md` missing | Run `npm run sync` |
| Static `add` target missing | Run `npm run overlay -- static --skill <name>` |
| Manifest missing for remerge skill | Run `npm run overlay -- prepare --skill <name>` |

## Inputs

| Input | Resolution |
|-------|------------|
| Skill name | Category from `skills/<category>/skills.json`; overlay in `overlays/<name>/` when present |
| Audit | `npm run overlay -- audit [--skill <name>]` |
| Manifest | `.tmp/overlay-apply/<skill>.md` from prepare |
| Lock | `.locks/upstream.json`: `sha`, `applied_upstream_sha`, `overlay_hash`, `universal_overlay_hash`, `blended_ref`, `overlay_applied_at` |

---

## Mode: audit

Explain overlay routing for one or all skills.

1. Run `npm run overlay -- audit [--skill <name>]`
2. Summarize per skill: route, upstream_changed, overlay_changed, reason, blended_ref
3. Recommend next step: `restore` (npm), `apply`, or no action

**Done when:** user understands routing and next command.

---

## Mode: restore

npm executes restore; the skill documents outcomes.

When `npm run overlay -- restore` runs successfully:
- Blended tree checked out from `blended_ref`
- Lock updated via `recordBlend` (applied_upstream_sha, hashes, overlay_applied_at, blended_ref)

Tell the user restore means **inputs were identical** — no agent merge was needed.

---

## Mode: apply

Re-merge overlay intent onto fresh upstream when audit route = `remerge` or `fresh`.

### Batch apply (default after `npm run update`)

When the user says **"skill-overlay apply all pending overlays"** (or equivalent):

1. List manifests in `.tmp/overlay-apply/` (or read `npm run overlay -- audit` for remerge/fresh skills)
2. Apply each skill in manifest order — semantic changes, then generators per skill
3. Run `npm run validate` once after all skills are blended
4. Commit all blended skill dirs in one commit
5. `recordBlend` for **each** skill with current `sha`, hashes, and shared `blended_ref`
6. Clean manifests: `npm run clean -- --manifests` (or `--skill <name>` per skill)
7. Report a summary table of all skills processed

Use single-skill apply only when the user names one skill or passed `--skill <name>` to npm.

### 1. Confirm routing

- Run or read audit output — route must be `remerge` or `fresh`
- If route = `restore`, stop and direct user to `npm run overlay -- restore`
- Read manifest when present

### 2. Load context

- `overlays/<skill>/OVERLAY.yaml` (when exists)
- Universal `overlays/OVERLAY.yaml` generators
- Resolved generator list (universal minus disable, plus add)
- Post-static files in `skills/<category>/<skill>/`
- **Ignore** previous blended content from git except as intent reference in OVERLAY.yaml

### 3. Apply semantic changes

For each `{ file, instructions }` in overlay order:

1. Read **current** file (upstream + static)
2. Satisfy instruction **intent**; preserve upstream structure where not contradicted
3. Document adaptations when upstream structure shifted

### 4. Apply generators

For each resolved generator (`id`, `instructions`, optional `file`):

1. Skip pinned static paths unless instructions require regeneration
2. Create/update derived files from merged skill context

### 5. Self-check, validate, record blend

- Run `npm run validate`; fix and re-run until pass
- Ensure blended skill dir is **committed** (or warn restore will fail next update)
- Record blend in lock:

```bash
git rev-parse HEAD   # → blended_ref
```

Set in `.locks/upstream.json` via `recordBlend` fields:
- `applied_upstream_sha` = current `sha`
- `overlay_hash` = per-skill overlay fingerprint (when overlay exists)
- `universal_overlay_hash` = universal overlay fingerprint (when generators exist)
- `overlay_applied_at` = now
- `blended_ref` = HEAD after commit

Remove manifest: `npm run clean -- --skill <skill>`

### Apply report

```markdown
## skill-overlay apply: <skill>

**Route:** remerge | fresh
**Upstream SHA:** <sha>
**Upstream changed:** <bool>
**Overlay changed:** <bool>

### Files changed
- <file> — <summary>

### Generators applied
- <id> → <file>

### Adaptations
- <intent mapped to new upstream structure>

### Next steps
- Commit blended result so blended_ref is valid for restore
- `git diff skills/<category>/<skill>/`
```

---

## Mode: extract

Draft or refine `OVERLAY.yaml` from local customizations.

1. Run `npm run extract-overlay -- --skill <name>` (add `--force` to overwrite draft)
2. Refine drafted `instructions`:
   - Remove literal file content blobs
   - Express behavioral intent only
   - Move local-only files to static `add` ops
3. Do **not** apply — hand off to apply mode after user review

Optional: `npm run extract-overlay -- --from-commit HEAD` for batch inference.

---

## Mode: reconcile

When remerge reveals overlay instructions no longer map to upstream:

1. Best-effort apply per instruction intent
2. Document adaptations in report
3. Propose `OVERLAY.yaml` edits aligning instructions with new upstream structure
4. Ask user to approve overlay updates before `recordBlend`

Use when user explicitly asks to reconcile, or apply surfaces structural conflicts.

---

## Merge principles

1. **Upstream is the base** for remerge — not memory of old forks.
2. **Overlay encodes intent** — not exact final text.
3. **Minimize gratuitous diffs** when upstream already satisfies intent.
4. **Prefer integration over insertion** into new upstream sections.
5. **Explicit overrides win** — find equivalent upstream location.
6. **Flag uncertainty** — one focused question before guessing.

## Error handling

| Situation | Behavior |
|-----------|----------|
| route = restore during apply | Stop; run npm restore |
| upstream_changed or overlay_changed | Never paste old blended output |
| blended_ref invalid | remerge; warn |
| Target file missing | Check static ops; stop if unrecoverable |
| Upstream section removed | Map intent; document in Adaptations; consider reconcile |
| Validation fails | Fix; do not recordBlend until pass |
| Generators-only skill | Apply generators; record universal_overlay_hash |
| Static-only overlay | Skip semantic; apply generators; recordBlend |

## Related tools

| Tool | Role |
|------|------|
| `npm run update` | sync + static + audit + restore + prepare remerge |
| `npm run overlay -- audit` | Routing: restore vs remerge |
| `npm run overlay -- restore` | Git checkout when inputs unchanged |
| `npm run overlay -- static` | Deterministic file ops |
| `npm run overlay -- prepare` | Remerge manifests |
| `npm run extract-overlay` | Draft OVERLAY.yaml |
| `npm run validate` | Gate before recordBlend |
| `npm run clean -- --skill <name>` | Remove apply manifest |

## Example

**User:** "skill-overlay apply all pending overlays"

1. Audit — collect all skills with route remerge/fresh
2. For each manifest in `.tmp/overlay-apply/`, merge semantic instructions and apply generators
3. Validate, commit once, recordBlend for each skill, clean manifests, report summary

**User:** "skill-overlay apply domain-modeling" (single-skill scope)

1. Audit — route must be remerge/fresh
2. Read manifest + OVERLAY.yaml
3. Merge semantic instructions onto post-sync upstream
4. Apply generators
5. Validate, commit, recordBlend with blended_ref, clean manifest, report
