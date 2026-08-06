# Agent Instructions

This is a skills repo for `npx skills add fernando-delosrios-sp/skills`.

Every skill lives under `skills/<category>/<name>/SKILL.md` and is listed in `skills/<category>/skills.json`.

## skills.json

Each category directory owns a manifest at `skills/<category>/skills.json`:

```json
{
  "skills": [
    { "name": "my-skill" },

    {
      "name": "foreign-skill",
      "source": {
        "repo": "owner/repo",
        "path": "skills/foreign-skill"
      }
    },

    {
      "name": "customized-foreign",
      "source": {
        "repo": "owner/repo",
        "path": "skills/foo"
      }
    }
  ]
}
```

Local-only skills omit `source`. Category is implied by the manifest path (`skills/<category>/skills.json`), not repeated on each entry.

Skills with an overlay in `overlays/<name>/OVERLAY.yaml` are customized after sync using the **skill-overlay** skill.

## Commands

```bash
# Import one foreign skill
npm run import -- --repo owner/repo --path skills/name --category my-category

# Import all discoverable skills from a repo
npm run import -- --repo owner/repo --category my-category --all

# Validate skills.json manifests, SKILL.md files, and overlays
npm run validate

# Sync foreign skills (overwrites skills/ from upstream)
npm run sync

# Full update: sync + static overlays + audit + auto-restore + prepare remerge manifests
npm run update

# Apply static overlay file ops (add/remove/replace)
npm run overlay -- static

# Prepare overlay or generator apply manifests
npm run overlay -- prepare

# Prepare generator manifests for all skills or one skill
npm run overlay -- prepare-generators --all
npm run overlay -- prepare-generators --skill <name>

# Draft an overlay from local customizations vs upstream
npm run extract-overlay -- --skill git-commit --from-agents
npm run extract-overlay -- --from-commit HEAD   # infer all overlays from last commit

# Remove .tmp clone caches and optional overlay manifests
npm run clean
npm run clean -- --manifests
npm run clean -- --skill <name>

# Install this repo's skills into your local agents
npm run install
```

## Overlay workflow

Apply order: **sync → static → audit → restore (unchanged) → remerge manifests → apply/reconcile (agent)**

Sync, import, and extract commands remove their clone caches automatically when they finish. Overlay apply manifests in `.tmp/overlay-apply/` are removed after apply via `npm run clean -- --skill <name>` (see skill-overlay skill). Use `npm run clean` to prune stale clone caches; `--manifests` removes manifests for overlays that are no longer pending.

See [README.md](README.md#skill-overlays) for the full `OVERLAY.yaml` reference.

After upstream changes:

```bash
npm run update                  # sync + static + audit + restore + prepare remerge
# Or step-by-step:
npm run sync
npm run overlay -- static
npm run overlay -- audit
npm run overlay -- restore      # unchanged inputs only
npm run overlay -- prepare      # remerge manifests
# In Cursor — invoke skill-overlay skill:
#   "skill-overlay apply git-commit"
npm run validate
git diff
git commit                      # blended_ref must reference this commit
```

### Generated files (`agents/openai.yaml`)

Declared in universal [`overlays/OVERLAY.yaml`](overlays/OVERLAY.yaml) as an agent generator (`{ id, instructions, file? }`). Applied by **skill-overlay** after semantic merge. Typical output derived from each skill's `SKILL.md` frontmatter:

- `interface.display_name` — title-cased skill name
- `interface.short_description` — first sentence of the description
- `policy.allow_implicit_invocation: false` — when `disable-model-invocation: true`

Per-skill overlays may add more generators in `generators.add` or opt out via `generators.disable`.

Overlay static `add/replace` for a custom manifest pins that file — skip generator apply for that path unless instructions require regeneration.

The **skill-overlay** skill performs intelligent semantic merging. It activates when sync flags a pending overlay, the user references `.tmp/overlay-apply/<skill>.md`, or asks to apply/customize/reconcile a skill overlay.

### Layout

- `skills/` — upstream-canonical skill trees (overwritten on sync when `source` is set)
- `overlays/OVERLAY.yaml` — universal generator defaults for all skills
- `overlays/<name>/OVERLAY.yaml` — per-skill customization intent (semantic + static ops + generator overrides)
- `overlays/<name>/files/` — static file payloads for add/replace ops
- `.locks/upstream.json` — last-synced upstream SHAs and overlay apply timestamps
- `lib/locks.mjs` — pure overlay route helpers (`getOverlayRoute`, `isOverlayRoutePending`); pending authority is `isPendingApply` on the pipeline
- `lib/upstream-adapter.mjs` — upstream git seam (`cloneRepo`, `readSkillTree`, `getHeadSha`); used by sync, import, and overlay extract
- `lib/overlay-pipeline.mjs` — deep public interface for overlay lifecycle (`audit`, `restore`, `static`, `prepare`, `extract`); exposes `isPendingApply(skillName)` as single pending check for sync and cleanup
- `lib/overlay-yaml.mjs` — overlay YAML load/validate/partition and generator merge resolution; generated-path helpers (internal)
- `lib/overlay-model.mjs` — overlay discovery and content hashing; delegates YAML primitives to overlay-yaml (internal)
- `lib/generator-config.mjs` — generator validation for `npm run validate`; re-exports resolution from overlay-yaml
- `lib/overlay-audit.mjs` — route determination, hash comparison, and `isPendingApply` (internal; re-exported via pipeline)
- `lib/overlay-static.mjs` — static add/replace/remove file ops (internal)
- `lib/overlay-manifest.mjs` — remerge and generator apply manifests (internal)
- `lib/overlay-extract.mjs` — overlay draft extraction from diffs (internal)
- `lib/overlays.mjs` — backward-compatible re-export barrel; prefer `overlay-pipeline.mjs` for new imports

## Rules

- Skill `name` must be unique across the whole repo.
- Categories are free-form strings used only for filesystem layout.
- `npm run sync` updates the working tree directly; review before committing.
- Skills with overlays need semantic apply after sync — see skill-overlay skill.
- Run `npm run validate` before committing.

<!-- Source: superpowers-bridge/templates/adopters/AGENTS.md.fragment.md -->
<!-- Drop this section into your project's AGENTS.md so agents route future work using this schema correctly. -->
<!-- Adjust the schema name and bridge repo URL if you customized them; otherwise keep as-is. -->

## Agent communication

- Use **plain English** — avoid jargon unless the user already uses it.
- Keep explanations **succinct**. State the conclusion first; add detail only when it helps a decision.
- When a topic could go deep, **offer to develop it further** — do not unprompted long dissertations or essay-length replies.
- When you need input, **ask one question at a time** and wait for the answer before the next.

## Workflow routing (read on session start)

This repo uses [`superpowers-bridge`](https://github.com/JiangWay/openspec-schemas/tree/main/superpowers-bridge) to bridge OpenSpec and Superpowers. Integration rules (language, artifact paths, PRECHECK) follow that bridge's README; this section is the routing guidance for agents.

### Entry routing

| Trigger you observe | What to do |
|---|---|
| User starts a narrative "design discussion / let's brainstorm" | Run verbal `superpowers:brainstorming`, but **do NOT** write to `docs/superpowers/specs/`. Once the conversation converges per the 5 criteria below, promote to `/opsx:propose` |
| User invokes `/opsx:new` / `/opsx:ff` / `/opsx:propose` directly | Follow the schema's flow; artifact instructions inject at each step |
| User explicitly says bug fix / typo / config tweak / doc update | Direct PR — **do NOT** open a change (see skip rules below) |
| User is mid-change | Advance with `/opsx:continue`, `/opsx:apply`, `/opsx:verify`, or `/opsx:archive` |

### When NOT to use opsx (direct PR)

| Scenario | Direct PR? |
|---|---|
| New feature / new capability / architectural change / breaking change | ❌ Use opsx |
| Bug fix (no contract change) / test backfill / linter tweak / non-breaking upgrade / typo / docs / config value tweak | ✅ Direct PR |

Principle: **process ceremony scales with risk**. External contracts / schema / cross-system integration / compliance → opsx. Otherwise → direct PR.

### Verbal brainstorm → opsx promotion criteria

All 5 must hold before promoting (any missing → keep brainstorming, **never** write to `docs/superpowers/specs/`):

1. **Scope locked** — one sentence describes what's in / out
2. **Major design forks resolved** — alternatives weighed; remaining TBDs have an owner and impact-scope statement
3. **Cross-system dependencies mapped** — ready / mockable / genuinely unknown — pick one per dep
4. **Acceptance criteria stateable** — concrete pass conditions (e.g., `./mvnw clean verify` passes + N deliverables)
5. **Conversation converging** — recent turns are confirmations, not new alternatives

When all 5 hold → proactively suggest "ready to `/opsx:propose`?" — wait for user ack. Never auto-trigger.

### Front-door anti-patterns (don't do)

- Letting brainstorming write to `docs/superpowers/specs/`
- Letting writing-plans write to `docs/superpowers/plans/`
- Promoting to opsx with unresolved blocking TBDs
- Opening a change for bug fix / typo

Full detail: [superpowers-bridge README §Entry & exit gates](https://github.com/JiangWay/openspec-schemas/blob/main/superpowers-bridge/README.md#entry--exit-gates).
