# Skills

Curated [agent skills](https://github.com/vercel-labs/skills) collection compatible with `npx skills`. Skills are organized by category, synced from upstream repos where noted, and customized locally via overlays.

## Quick start

Install skills from this repo into your local agent environment:

```bash
npx skills add fernando-delosrios-sp/skills
```

Or clone and pick skills interactively:

```bash
git clone https://github.com/fernando-delosrios-sp/skills.git
cd skills
npm install
npm run install
```

`npm run install` prompts by category and runs `skills add . --skill <names>` for your selection.

## Categories

| Category | Skills |
|----------|--------|
| **engineering** | c4-diagram, changelog-generator, code-simplification, codebase-design, deploy-mate, diagnosing-bugs, domain-modeling, gherkin-authoring, git-commit, graphify, improve, improve-codebase-architecture, openspec-init, zoom-out |
| **productivity** | caveman, grill-me, grilling, handoff, risen-prompt, search, teach, to-questionnaire, wait-what, wayfinder, writing-for-agents, writing-great-skills |
| **internal** | apply-skill-overlay |

Each skill lives at `skills/<category>/<name>/SKILL.md` and is listed in `skills/<category>/skills.json`.

## Repository layout

```
skills/
  <category>/
    skills.json           # category manifest
    <name>/
      SKILL.md            # skill definition (required)
      agents/             # generated or pinned agent manifests
      ...                 # references, scripts, templates

overlays/
  OVERLAY.yaml            # universal — repo-wide generator defaults
  <name>/
    OVERLAY.yaml          # per-skill customizations
    files/                # static file payloads for add/replace ops

lib/                      # sync, import, overlay, validate tooling
scripts/                  # CLI entry points
.locks/upstream.json      # last-synced upstream SHAs and overlay apply timestamps
```

- **`skills/`** — upstream-canonical skill trees (overwritten on sync when `source` is set)
- **`overlays/`** — local customizations and derived outputs layered on top of upstream
- **`.agents/skills/`** — working copies used during development (not the install source of truth)

## Skills manifest (`skills.json`)

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

- Local-only skills omit `source`.
- Category is implied by the manifest path (`skills/<category>/skills.json`), not repeated on each entry.
- Skill `name` must be unique across the whole repo.
- Skills with an overlay in `overlays/<name>/OVERLAY.yaml` are customized after sync using the **apply-skill-overlay** skill.

## Maintainer commands

```bash
# Import one foreign skill
npm run import -- --repo owner/repo --path skills/name --category my-category

# Import all discoverable skills from a repo
npm run import -- --repo owner/repo --category my-category --all

# Validate skills.json manifests, SKILL.md files, and overlays
npm run validate

# Sync foreign skills (overwrites skills/ from upstream)
npm run sync

# Full update: sync + static overlays + prepare semantic apply
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

# Remove .tmp clone caches (and optional overlay manifests)
npm run clean
npm run clean -- --manifests                    # also remove manifests for applied overlays
npm run clean -- --skill git-commit               # remove one overlay manifest
npm run clean -- --all                            # remove entire .tmp/

# Install this repo's skills into your local agents
npm run install
```

Requires Node.js ≥ 18.

## Skill overlays

Overlays define local customizations and derived outputs on top of upstream-canonical skill trees in `skills/`.

**Apply order:**

```
sync → static changes → semantic changes → generators (agent)
```

See also [AGENTS.md](AGENTS.md) for agent-specific instructions and workflow routing.

### Overlay layout

```
overlays/
  OVERLAY.yaml              # universal — repo-wide generator defaults
  git-commit/
    OVERLAY.yaml            # per-skill — optional generator overrides + changes
    files/                  # static file payloads (optional)
```

### Overview

Two tiers share the same filename (`OVERLAY.yaml`) with complementary roles:

| Tier | Path | Purpose |
|------|------|---------|
| Universal | `overlays/OVERLAY.yaml` | Generator defaults for **all** skills |
| Per-skill | `overlays/<name>/OVERLAY.yaml` | Customizations and generator overrides for one skill |

- **`generators`** — derived outputs created by the agent from `{ id, instructions, file? }` entries
- **`changes`** — customization intent: static file ops + semantic merge instructions

Generators are a sibling section to `changes`, not a `changes.action`.

### Generator schema (universal and per-skill)

Every generator entry requires:

| Field | Required | Description |
|-------|----------|-------------|
| `id` | yes | Stable label (e.g. `openai-manifest`, `commit-helper-config`) |
| `instructions` | yes | Agent execution intent for creating/updating output(s) |
| `file` | no | Skill-relative output path — enables validate, manifest current-content, extract-overlay skip, static-pin skip |
| `description` | no | Human note for overlay authoring |

All generators are **agent-applied** via the **apply-skill-overlay** skill. Config is resolved and validated by [`lib/generator-config.mjs`](lib/generator-config.mjs) — no code execution.

### Universal overlay — `overlays/OVERLAY.yaml`

Applied to every skill in `skills/<category>/skills.json` unless a per-skill overlay disables a generator.

```yaml
description: Repo-wide derived files for all skills

generators:
  - id: openai-manifest
    file: agents/openai.yaml
    description: Agent interface manifest from SKILL.md frontmatter
    instructions: |
      Build agents/openai.yaml from this skill's SKILL.md frontmatter:
      - interface.display_name: hyphenated name → Title Case words
      - interface.short_description: first sentence of description, ~72 chars max
      - policy.allow_implicit_invocation: false when disable-model-invocation is true
```

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `description` | yes | string | Why these repo-wide generators exist |
| `generators` | yes | array | List of `{ id, instructions, file?, description? }` applied to all skills |

| Rule | Detail |
|------|--------|
| No `skill` field | Not tied to a skill directory |
| No `changes` in v1 | Repo-wide semantic/static customizations are out of scope |
| `instructions` | Required on every generator entry |

### Per-skill overlay — `overlays/<name>/OVERLAY.yaml`

```yaml
skill: git-commit
description: Session-scoped staging and conventional commits

generators:
  add:
    - id: commit-helper-config
      file: agents/commit-helper.yaml
      instructions: |
        Derive a commit-helper agent config from the merged SKILL.md:
        session-scoped staging rules, conventional commit types, and scope-clarification triggers.

changes:
  - file: SKILL.md
    instructions: |
      Behavioral intent to merge into upstream.
  - action: add
    file: agents/openai.yaml
    from: files/agents/openai.yaml
```

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `skill` | yes | string | Must match directory name and `skills.json` entry |
| `description` | yes | string | Why this overlay exists |
| `generators` | no | object | `{ disable: [id], add: [...] }` — overrides universal defaults |
| `changes` | no | array | Static and/or semantic customizations |

#### Per-skill `generators` object

| Field | Type | Description |
|-------|------|-------------|
| `disable` | string[] | Universal generator ids to skip for this skill |
| `add` | array | Extra generators (`{ id, instructions, file? }`) for this skill |

Per-skill `generators.add` entries **add to** universal generators. Omit `generators` entirely to inherit all universal defaults.

#### `changes` — semantic entry

Applied by the **apply-skill-overlay** skill in Cursor.

| Field | Required | Description |
|-------|----------|-------------|
| `file` | yes | Skill-relative path to merge |
| `instructions` | yes | Behavioral intent (not literal search/replace) |

#### `changes` — static entry

Applied by `npm run overlay -- static`.

| Field | Required | Description |
|-------|----------|-------------|
| `action` | yes | `add`, `remove`, or `replace` |
| `file` | yes | Skill-relative target path |
| `from` | add/replace | Path relative to overlay dir (usually under `files/`) |

Static ops run before semantic apply. A static `add/replace` for a generated path pins a custom file — skip generator apply for that path unless instructions explicitly require regeneration.

### Generated files (`agents/openai.yaml`)

Declared in universal [`overlays/OVERLAY.yaml`](overlays/OVERLAY.yaml) as an agent generator. Applied by **apply-skill-overlay** after semantic merge. Typical output derived from each skill's `SKILL.md` frontmatter:

- `interface.display_name` — title-cased skill name
- `interface.short_description` — first sentence of the description
- `policy.allow_implicit_invocation: false` — when `disable-model-invocation: true`

Per-skill overlays may add more generators in `generators.add` or opt out via `generators.disable`.

The **apply-skill-overlay** skill performs intelligent semantic merging. It activates when sync flags a pending overlay, the user references `.tmp/overlay-apply/<skill>.md`, or asks to apply/customize/reconcile a skill overlay.

### When to use which mechanism

| Need | Mechanism |
|------|-----------|
| Same derived file for all skills | Universal `overlays/OVERLAY.yaml` → `generators` list |
| Skill-specific derived file with tooling hooks | Per-skill `generators.add` with `{ id, instructions, file }` |
| Skill-specific derived output (instructions-only) | Per-skill `generators.add` with `{ id, instructions }` — author names path in instructions |
| Opt out of a repo default | Per-skill `generators.disable` |
| Pinned custom file, never recomputed | Per-skill `changes` static `action: add/replace` |
| Behavioral merge into upstream text | Per-skill `changes` semantic `{ file, instructions }` |

### Workflows

#### After upstream changes

```bash
npm run update                              # sync + static + prepare manifests
# In Cursor: "Apply overlay for <skill>" (semantic + generators)
npm run validate
git diff
git commit
```

Step-by-step:

```bash
npm run sync
npm run overlay -- static
npm run overlay -- prepare
# In Cursor: "Apply overlay for <skill>"
npm run validate
```

#### Apply generators for all skills

```bash
npm run overlay -- prepare-generators --all
# In Cursor: apply generators per skill via apply-skill-overlay
npm run validate
```

#### Import a new skill

```bash
npm run import -- --repo owner/repo --path skills/foo --category productivity
# Writes generator manifest; apply via apply-skill-overlay
npm run validate
```

#### Extract an overlay from local diffs

```bash
npm run extract-overlay -- --skill git-commit
npm run extract-overlay -- --from-commit HEAD
```

Generated paths are excluded from extracted overlays automatically (no deterministic expected content).

Clone caches from sync, import, and extract are removed automatically when each command finishes. Overlay apply manifests persist until apply completes — then remove with `npm run clean -- --skill <name>` or `npm run clean -- --manifests`.

### Worked examples

#### Example 1 — Universal overlay only

Most skills have no per-skill overlay and inherit universal generators:

```yaml
# overlays/OVERLAY.yaml
description: Repo-wide derived files for all skills

generators:
  - id: openai-manifest
    file: agents/openai.yaml
    instructions: |
      Build agents/openai.yaml from SKILL.md frontmatter (display_name, short_description, policy).
```

#### Example 2 — Semantic-only per-skill overlay

```yaml
skill: git-commit
description: Session-scoped staging and conventional commit messages

changes:
  - file: SKILL.md
    instructions: |
      Enforce session-scoped staging: only stage files touched in this session.
      Commit message must follow conventional commits format.
```

Universal `openai-manifest` generator still applies unless disabled.

#### Example 3 — Static-only per-skill overlay

```yaml
skill: improve-codebase-architecture
description: Markdown report format instead of upstream HTML report template

changes:
  - action: remove
    file: HTML-REPORT.md
  - action: add
    file: LANGUAGE.md
    from: files/LANGUAGE.md
  - action: add
    file: MARKDOWN-REPORT.md
    from: files/MARKDOWN-REPORT.md
```

#### Example 4 — Pinned custom manifest

Static `add` pins a custom file; skip generator apply for that path:

```yaml
skill: my-skill
description: Custom OpenAI manifest — do not regenerate from frontmatter

changes:
  - action: add
    file: agents/openai.yaml
    from: files/agents/openai.yaml
```

#### Example 5 — Opt out of a universal generator

```yaml
skill: local-only-skill
description: No agent manifest needed

generators:
  disable:
    - openai-manifest
```

#### Example 6 — Combined generators + semantic + static

```yaml
skill: git-commit
description: Customized git-commit with helper config and pinned script

generators:
  add:
    - id: commit-helper-config
      file: agents/commit-helper.yaml
      instructions: |
        Derive commit-helper config from merged SKILL.md session-scoping and conventional commit rules.

changes:
  - file: SKILL.md
    instructions: |
      Session-scoped staging only. Conventional commit format required.
  - action: add
    file: scripts/pre-commit-check.sh
    from: files/scripts/pre-commit-check.sh
```

### Generator commands

```bash
# Overlay with semantic changes + generators (pending overlays, or --skill)
npm run overlay -- prepare
npm run overlay -- prepare --skill wait-what

# Generator manifests only (any skill, including those without per-skill overlay)
npm run overlay -- prepare-generators --skill wait-what
npm run overlay -- prepare-generators --all
```

### Troubleshooting

| Warning / issue | Fix |
|-----------------|-----|
| `Missing agents/openai.yaml (generator: openai-manifest)` | `npm run overlay -- prepare-generators --skill <name>`, then apply via apply-skill-overlay |
| `generator requires instructions` in OVERLAY.yaml | Add non-empty `instructions` to every generator entry |
| Custom manifest keeps getting regenerated | Pin with static `action: add` in per-skill overlay |
| Overlay pending apply | Run semantic + generator apply via apply-skill-overlay, update lock |

### Adding a new generator

1. Add `{ id, instructions, file? }` to universal `overlays/OVERLAY.yaml` (all skills) or per-skill `generators.add`
2. Run `npm run overlay -- prepare-generators --skill <name>` or `--all`
3. Apply via **apply-skill-overlay** in Cursor

## Rules

- Skill `name` must be unique across the whole repo.
- Categories are free-form strings used only for filesystem layout.
- `npm run sync` updates the working tree directly; review before committing.
- Skills with overlays need semantic apply after sync — see apply-skill-overlay skill.
- Run `npm run validate` before committing.

## Further reading

- [AGENTS.md](AGENTS.md) — agent instructions, commands, and OpenSpec workflow routing

