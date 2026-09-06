## Why

Agent replies often run long and bury the point in headings, preamble, and optional detail. That clutters context and makes answers hard to scan. The existing `caveman` skill compresses tokens via fragments and abbreviations — useful for cost, but not for clarity. A separate clarity-first skill lets installed agents default to plain, complete, scannable answers while the user can still ask for more depth.

## What Changes

**New productivity skill `plain-and-simple`**
- From: no repo skill governing clarity-first default communication
- To: local-only skill at `skills/productivity/plain-and-simple/` with model-invoked `description`, compact reference body, and generated `agents/openai.yaml`
- Reason: give agents a single, always-discoverable rule set for succinct plain-English responses
- Impact: non-breaking; optional install via `npm run install`; distinct from `caveman`

**Communication rules (SKILL.md body)**
- From: unconstrained verbosity and heavy markdown by default
- To: lead with the conclusion; plain English; shortest complete answer; minimal adaptive formatting; example only when it clarifies faster than more prose; exact technical terms with brief gloss when unfamiliar; expand only when asked; no standing expansion footer
- Reason: optimize comprehension and context efficiency together
- Impact: behavior change only when the skill is installed and model-invoked

**Catalog and validation**
- From: `plain-and-simple` absent from productivity manifest and README category catalog
- To: entry in `skills/productivity/skills.json`; README row updated; passes `npm run validate`
- Reason: repo conventions require manifest completeness and README cache alignment
- Impact: maintainer-only

## Capabilities

### New Capabilities

- `productivity-plain-and-simple`: plain-and-simple skill behavior — model invocation, communication rules, coverage, examples, formatting, technical terms, and expansion-on-request

### Modified Capabilities

- `skill-catalog`: require `plain-and-simple` in the productivity manifest as a local-only entry (no `source`)
- `ubiquitous-language`: add **plain-and-simple**, **shortest complete answer**, and **minimal adaptive formatting**

## Impact

- **Skill type**: local-only productivity skill (no upstream `source`, no overlay)
- **Primary files**: `skills/productivity/plain-and-simple/SKILL.md`, `skills/productivity/plain-and-simple/agents/openai.yaml` (generator), `skills/productivity/skills.json`
- **Secondary files**: `README.md` Categories table (productivity row), `CHANGELOG.md` (changelog-generator at apply)
- **Unchanged**: `caveman` skill; `lib/`; npm scripts; overlay pipeline
- **Dependencies**: none
