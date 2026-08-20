---
name: update-skills
description: >-
  Update this skills repo from upstream and apply pending overlays. Also apply-only
  after `npm run update`, extract overlay drafts, audit overlay routing, or reconcile
  overlay instructions that no longer map.
disable-model-invocation: false
---

# Update Skills

Sync upstream skills, apply pending overlays, validate, and optionally commit.

Overlays encode **behavioral intent** on upstream-canonical skill trees. Never paste previous blended output when upstream or overlay inputs changed.

Overlay reference: [README.md#skill-overlays](../../../README.md#skill-overlays)

## Mode routing

| Trigger | Mode | Executor |
|---------|------|----------|
| Default — update skills / sync upstream | update | agent (this path) |
| User already ran update, or names apply without sync | apply-only | agent |
| User asks to draft/refine overlay from local diffs | extract | agent guides `npm run extract-overlay` |
| Remerge with stale or unmapped instructions | reconcile | agent |
| User asks what changed / routing state | audit | agent reads `npm run overlay -- audit` |
| Audit route = `restore` | restore | npm (`overlay restore`) — skill documents only |

**Pipeline order:** sync → static → audit → restore (unchanged) → prepare remerge manifests → apply/reconcile (agent)

---

## Default: update

Run the full maintainer pipeline unless the user scoped to apply-only (see below).

### 1. Update from upstream

Run `npm run update` — sync, static, audit, restore unchanged inputs, prepare remerge manifests.

**Done when:** command exits. Skills routed `restore` are already blended.

### 2. Classify pending overlays

Run or read `npm run overlay -- audit` and list `.tmp/overlay-apply/` manifests.

**Done when:** every customized skill is classified `restore` / `none` vs `remerge` / `fresh`.

### 3. Apply pending overlays

For each skill with route `remerge` or `fresh`:

1. Confirm routing — if route = `restore`, stop and direct user to `npm run overlay -- restore --skill <name>`
2. Load context: `overlays/<skill>/OVERLAY.yaml`, universal generators, post-static files in `skills/<category>/<skill>/`. **Ignore** previous blended content from git except as intent reference in OVERLAY.yaml
3. Apply semantic changes — read current file, satisfy instruction **intent**, document adaptations
4. Apply generators — skip pinned static paths unless instructions require regeneration
5. Capture **change summary** for this skill (see [Change summary](#change-summary)) — done before moving to the next skill
6. Remove manifest: `npm run clean -- --skill <skill>` after blend recorded

Apply each skill in manifest order — semantic changes, then generators per skill. Use single-skill scope only when the user names one skill or passed `--skill <name>`.

**Done when:** every pending skill is blended.

### 4. Validate

Run `npm run validate`; fix and re-run until pass. Do not `recordBlend` until validation passes.

**Done when:** validate exits clean.

### 5. Commit gate

One structured-choices gate:

- **Commit** — invoke **git-commit** so `blended_ref` is HEAD after commit
- **Commit and push** — commit then push to remote
- **Do nothing** — warn that restore will fail next cycle without a blend commit

After commit (when chosen): `recordBlend` for **each** blended skill with current `sha`, hashes, and shared `blended_ref`. Clean remaining manifests: `npm run clean -- --manifests`.

Set in `.locks/upstream.json` via `recordBlend` fields:
- `applied_upstream_sha` = current `sha`
- `overlay_hash` = per-skill overlay fingerprint (when overlay exists)
- `universal_overlay_hash` = universal overlay fingerprint (when generators exist)
- `overlay_applied_at` = now
- `blended_ref` = HEAD after commit

**Done when:** user chose an option and any commit/push requested is complete.

### 6. Report

Present the [update report](#update-report) to the user — routing table plus per-skill change summaries and semantic deltas. Do not skip remerge/fresh skills with empty deltas when `upstream_changed` is true.

**Done when:** user has a readable summary of what changed and why.

---

## Change summary

For every skill processed during update or apply-only, record what changed and **why** — not just file lists.

### Sources

| Source | Lock / audit field | Use |
|--------|-------------------|-----|
| Last blend | `blended_ref` | Prior customized tree the maintainer shipped |
| Last upstream at blend | `applied_upstream_sha` | Upstream base used for the last blend |
| Current upstream | `sha` (after sync) | Fresh upstream canonical |
| Final tree | working tree after apply | New blend |
| Overlay intent | `overlays/<skill>/OVERLAY.yaml` | What local customization must preserve |

Use `git diff` between these refs on the skill dir (`skills/<category>/<skill>/`). Read audit flags (`upstream_changed`, `overlay_changed`, `route`) from manifest or `npm run overlay -- audit`.

### Per-skill delta classes

Classify each meaningful difference:

| Class | Meaning | Example phrasing |
|-------|---------|------------------|
| **Upstream** | New upstream content adopted as-is or integrated | "Upstream added HITL loop step; kept verbatim" |
| **Overlay** | Local intent applied on top of new upstream | "Overlay requires Spanish examples; added under Examples" |
| **Adaptation** | Intent preserved but target moved because upstream structure shifted | "Intent was 'require tests'; mapped to new Verification section" |
| **Generator** | Derived file created/updated from generator instructions | "Regenerated agents/openai.yaml from frontmatter" |
| **Unchanged** | Route `restore` or remerge with no material diff | "Inputs unchanged — restored from blended_ref" |

For route `fresh`, treat the delta as overlay + generator applied onto current upstream — no prior blend to diff.

For skills synced without overlay (no remerge), note upstream-only changes when `git diff` shows material edits under `skills/`.

### Per-skill capture (during apply)

Before moving to the next skill, draft:

- **Upstream delta** — what changed upstream since last blend (`applied_upstream_sha` → `sha`), in plain language
- **Overlay delta** — what overlay intent added, removed, or altered vs post-sync upstream
- **Adaptations** — any instruction that no longer mapped cleanly; how intent was satisfied instead
- **Files touched** — paths changed in the final blend vs `blended_ref` (or vs post-sync tree for `fresh`)

---

## Update report

```markdown
## update-skills

**Update:** npm run update completed
**Pending applied:** <count> skills (remerge/fresh)
**Restored (npm):** <count> skills
**Validated:** pass

### Skills processed
| Skill | Route | One-line |
|-------|-------|----------|
| <name> | remerge \| fresh \| restore \| none | <headline delta> |

### Change summary

#### <skill-name>

**Route:** <route> · **Upstream changed:** <bool> · **Overlay changed:** <bool>
**SHAs:** `<applied_upstream_sha>` → `<sha>` · **Prior blend:** `<blended_ref>`

**Upstream delta**
- <what upstream changed since last blend — behavior, sections, constraints>

**Overlay delta**
- <what local intent added or changed vs new upstream>

**Adaptations** _(omit section when none)_
- <intent → how it was mapped when structure shifted>

**Files touched**
- `<path>` — <upstream \| overlay \| generator \| adaptation>

_(Repeat per skill with remerge/fresh, or per skill with material upstream-only sync changes.)_

### Commit
<committed SHA | skipped — restore will fail next cycle without blend commit>
```

---

## Apply-only

When the user already ran `npm run update`, references `.tmp/overlay-apply/<skill>.md`, or asks to apply pending overlays without syncing — skip step 1; run steps 2–6 of the default path.

---

## Shared rules (apply modes)

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
3. Recommend next step: `restore` (npm), apply via update-skills, or no action

**Done when:** user understands routing and next command.

---

## Mode: restore

npm executes restore; the skill documents outcomes.

When `npm run overlay -- restore` runs successfully:
- Blended tree checked out from `blended_ref`
- Lock updated via `recordBlend` (applied_upstream_sha, hashes, overlay_applied_at, blended_ref)

Tell the user restore means **inputs were identical** — no agent merge was needed.

---

## Mode: extract

Draft or refine `OVERLAY.yaml` from local customizations.

1. Run `npm run extract-overlay -- --skill <name>` (add `--force` to overwrite draft)
2. Refine drafted `instructions`:
   - Remove literal file content blobs
   - Express behavioral intent only
   - Move local-only files to static `add` ops
3. Do **not** apply — hand off to default update path after user review

Optional: `npm run extract-overlay -- --from-commit HEAD` for batch inference.

---

## Mode: reconcile

When remerge reveals overlay instructions no longer map to upstream:

1. Best-effort apply per instruction intent
2. Document adaptations in the per-skill change summary (Adaptations section)
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
| Upstream section removed | Map intent; document under Adaptations in change summary; consider reconcile |
| Validation fails | Fix; do not recordBlend until pass |
| Generators-only skill | Apply generators; record universal_overlay_hash |
| Static-only overlay | Skip semantic; apply generators; recordBlend |

## Examples

**User:** "update skills"

1. `npm run update`
2. Apply all remerge/fresh manifests; capture change summary per skill
3. Validate
4. Report with semantic deltas
5. Commit gate

**User:** "apply pending overlays" (update already ran)

1. Audit — collect remerge/fresh skills
2. Apply each manifest; capture change summary per skill
3. Validate, report, commit gate

**User:** "update-skills apply domain-modeling" (single-skill scope)

1. Audit — route must be remerge/fresh
2. Read manifest + OVERLAY.yaml, merge semantic instructions, apply generators, capture change summary
3. Validate, report, commit gate

**User:** "extract overlay for domain-modeling"

1. Run extract-overlay, refine instructions, hand off to update path after review
