# Ubiquitous Language

## Purpose

Shared domain vocabulary for this project. All specs, design docs, code identifiers,
and user-facing copy MUST align with the terms defined here.
## Requirements
### Requirement: Glossary maintenance

The project SHALL maintain an authoritative glossary of domain terms with unambiguous
definitions, preferred spellings, and known aliases.

#### Scenario: New term introduced in a change

- **GIVEN** a change proposal introduces a new domain concept or renames an existing one
- **WHEN** the change is approved for implementation
- **THEN** the term MUST be added or updated in this spec before the change archives

#### Scenario: Term used in a spec

- **GIVEN** a capability spec references a domain noun or verb
- **WHEN** the term is not yet defined in this glossary
- **THEN** the author MUST add the definition here or reuse an existing term instead

### Requirement: Consistent naming

Implementation artifacts (types, functions, API fields, database columns, UI labels)
SHALL use glossary terms verbatim unless a documented alias applies.

#### Scenario: Code review against glossary

- **GIVEN** an implementation uses a domain label visible to other systems or users
- **WHEN** the label differs from the glossary preferred spelling without an alias entry
- **THEN** the implementation MUST be corrected or the glossary MUST be updated first

### Requirement: Bounded context boundaries

When the same word means different things in different areas, each meaning MUST be
listed as a separate entry with its bounded context noted.

#### Scenario: Homonym disambiguation

- **GIVEN** two subsystems use the same word with different meanings
- **WHEN** both meanings appear in specs or code
- **THEN** each meaning MUST have its own glossary entry naming the bounded context

### Requirement: Overlay route glossary entry

The glossary SHALL define **Overlay route** as the audit-determined next action for a customized source skill.

#### Scenario: Route values documented

- **GIVEN** a maintainer reads the ubiquitous-language spec
- **WHEN** they look up Overlay route
- **THEN** the definition MUST list the four values: `restore`, `remerge`, `fresh`, `none`
- **AND** MUST note the bounded context is overlays / overlay-pipeline

### Requirement: Pending apply glossary entry

The glossary SHALL define **Pending apply** as the state where a source skill needs semantic overlay merge or first-time blend.

#### Scenario: Pending apply definition

- **GIVEN** a maintainer reads the ubiquitous-language spec
- **WHEN** they look up Pending apply
- **THEN** the definition MUST state it corresponds to overlay routes `fresh` or `remerge`
- **AND** MUST explicitly note that lock timestamp comparison is not the authority

### Requirement: Generator glossary entry

The glossary SHALL define **Generator** as an agent manifest producer declared in overlay generator configuration.

#### Scenario: Generator definition

- **GIVEN** a maintainer reads the ubiquitous-language spec
- **WHEN** they look up Generator
- **THEN** the definition MUST state generators are declared in universal `overlays/OVERLAY.yaml` and MAY be overridden per skill via `generators.add` / `generators.disable`
- **AND** MUST note the bounded context is overlays / overlay-yaml
- **AND** MUST reference that merge resolution lives in `overlay-yaml.mjs`

### Requirement: Canonical tree glossary entry

The glossary SHALL define **Canonical tree** as the install source-of-truth skill directory under `skills/<category>/<name>/`.

#### Scenario: Canonical tree definition

- **GIVEN** a maintainer reads the ubiquitous-language spec
- **WHEN** they look up Canonical tree
- **THEN** the definition MUST state it is overwritten on sync for source skills
- **AND** MUST note path resolution lives in `lib/skill-paths.mjs` as `canonicalDir`

### Requirement: Agents tree glossary entry

The glossary SHALL define **Agents tree** as the flat dev working copy under `.agents/skills/<name>/`.

#### Scenario: Agents tree definition

- **GIVEN** a maintainer reads the ubiquitous-language spec
- **WHEN** they look up Agents tree
- **THEN** the definition MUST state it is used by `extract-overlay --from-agents`
- **AND** MUST note it is NOT the install source of truth
- **AND** MUST note path resolution lives in `lib/skill-paths.mjs` as `agentsDir`

### Requirement: Structure validation glossary entry

The glossary SHALL define **Structure validation** as checks that the repository is well-formed without inspecting git blend state. Notes MAY mention `npm run validate -- --structure-only` as an optional flag. Notes MUST NOT claim that this repository’s Validate workflow is structure-only.

#### Scenario: Structure validation definition

- **GIVEN** a maintainer reads the ubiquitous-language spec
- **WHEN** they look up Structure validation
- **THEN** the definition MUST list: manifests, SKILL.md frontmatter, overlay YAML shape, static file refs, generator output presence, and marketplace sync
- **AND** MUST explicitly state it does not call `auditSkill` or inspect `blended_ref`

#### Scenario: Structure-only is not the Validate workflow

- **GIVEN** a maintainer reads Structure validation notes
- **WHEN** they compare them to the Validate workflow
- **THEN** `--structure-only` MUST be described as an optional CLI flag
- **AND** MUST NOT be equated with this repository’s Validate workflow merge gate

### Requirement: Validate workflow glossary entry

The glossary SHALL define **Validate workflow** as the GitHub Actions workflow in `.github/workflows/validate.yaml` that is this repository’s merge gate on push and pull request to `main`.

#### Scenario: Validate workflow definition

- **GIVEN** a maintainer reads the ubiquitous-language spec
- **WHEN** they look up Validate workflow
- **THEN** the definition MUST name `.github/workflows/validate.yaml`
- **AND** MUST state it is the merge gate for this repository
- **AND** MUST distinguish it from the Sync workflow in `.github/workflows/sync.yaml`

#### Scenario: Merge gate steps documented

- **GIVEN** the glossary entry for Validate workflow
- **WHEN** notes describe what the job runs
- **THEN** they MUST state the job runs `npm test` then full `npm run validate`
- **AND** MUST NOT describe this repo’s merge gate as structure-only validate

### Requirement: Blend validation glossary entry

The glossary SHALL define **Blend validation** as checks that overlay lock routing and `blended_ref` state are consistent with pending apply semantics.

#### Scenario: Blend validation definition

- **GIVEN** a maintainer reads the ubiquitous-language spec
- **WHEN** they look up Blend validation
- **THEN** the definition MUST state it covers audit routes, `blended_ref` presence, and pending remerge detection
- **AND** MUST note the bounded context is tooling / validate blend layer
- **AND** MUST reference `validateBlendState()` as the implementation entry point

### Requirement: Runtime visibility domain terms

The glossary SHALL define **Runtime visibility**, **Tier-1 visibility**, **Tier-2 visibility**, **Read chain**, and **Runtime visibility tooling** for the deploy-mate bounded context.

#### Scenario: Glossary includes runtime visibility terms

- **GIVEN** a maintainer reads the ubiquitous-language spec
- **WHEN** they look up deploy-mate visibility terms
- **THEN** all five term entries MUST appear under Term entries
- **AND** each entry MUST follow the Term entry format (Context, Definition, Aliases, Notes)

### Requirement: Archive post-commit gate term

The ubiquitous language spec MUST define **Archive post-commit gate** as the blocking verification after archive commit: empty working tree and latest commit includes synced specs and archive folder paths.

#### Scenario: Term used in ferspec archive docs

- **GIVEN** ferspec README or agent routing references archive completion
- **WHEN** the archive post-commit gate is described
- **THEN** documentation MUST use **Archive post-commit gate** consistently
- **AND** MUST NOT describe archive as complete without this gate passing

### Requirement: Operation guidance term

The ubiquitous language spec MUST define **Operation guidance** as advisory strings from `openspec/config.yaml` per-operation `guidance` arrays, loaded by `openspec instructions archive` or apply.

#### Scenario: Term distinguishes from schema instructions

- **GIVEN** ferspec archive commit steps are documented
- **WHEN** referring to config-driven archive strings
- **THEN** documentation MUST use **Operation guidance**
- **AND** MUST NOT conflate with `schema.yaml` apply instruction blocks

### Requirement: Characterization test glossary entry

The glossary SHALL define **Characterization test** as a Node unit test that records current filesystem mutation behavior of Sync write, Import copy, static overlay apply, and Update orchestration so later refactors can detect drift.

#### Scenario: Characterization test definition

- **GIVEN** a maintainer reads the ubiquitous-language spec
- **WHEN** they look up Characterization test
- **THEN** the definition MUST state it records existing mutation behavior without changing that behavior
- **AND** MUST note tests MUST exercise real filesystem writes or deletes on temporary trees, not only source greps
- **AND** MUST note the bounded context is tooling / upstream-sync

#### Scenario: Term listed in glossary

- **GIVEN** the ubiquitous-language spec glossary
- **WHEN** a reader looks for Characterization test
- **THEN** a `### Term: Characterization test` entry MUST exist

## Term entries

### Term: Skill
**Context**: global
**Definition**: An agent capability package defined by a SKILL.md file and optional supporting files (references, scripts, templates, agent manifests).
**Aliases**: agent skill
**Notes**: Installable via `npx skills add`. Each skill has a unique name across the whole repository.

### Term: Category
**Context**: skill-catalog
**Definition**: A filesystem grouping under `skills/<category>/` that owns a `skills.json` manifest. Categories are free-form (e.g., engineering, productivity, internal).
**Aliases**: none
**Notes**: Category is implied by manifest path, not repeated on each skill entry.

### Term: Manifest
**Context**: skill-catalog
**Definition**: The `skills.json` file in a category directory listing all skills in that category, optionally with upstream `source` references.
**Aliases**: skills.json, category manifest
**Notes**: Validates skill name uniqueness repo-wide.

### Term: Source skill
**Context**: upstream-sync
**Definition**: A skill tracked from an external Git repository via a `source` block in skills.json (`repo`, `path`). Overwritten on sync.
**Aliases**: foreign skill, upstream skill
**Notes**: Contrasts with local-only skills that omit `source`.

### Term: Local-only skill
**Context**: skill-catalog
**Definition**: A skill authored and maintained entirely in this repository with no `source` block in skills.json.
**Aliases**: native skill
**Notes**: Not overwritten by sync.

### Term: Overlay
**Context**: overlays
**Definition**: A customization layer defined in `overlays/<name>/OVERLAY.yaml` that modifies a synced skill via semantic merge, static file ops, and/or generators.
**Aliases**: skill overlay
**Notes**: Applied after sync; requires update-skills skill for semantic reconciliation.

### Term: Sync
**Context**: upstream-sync
**Definition**: The process of pulling upstream-canonical content from foreign repos into `skills/`, overwriting skills that have a `source` reference.
**Aliases**: none
**Notes**: Invoked via `npm run sync`. Part of the broader `npm run update` pipeline.

### Term: Update
**Context**: upstream-sync
**Definition**: The full maintenance pipeline: sync → static overlay → audit → restore (unchanged) → prepare remerge manifests → apply/reconcile.
**Aliases**: none
**Notes**: Invoked via `npm run update`.

### Term: Install
**Context**: distribution
**Definition**: Copying selected skills from this repository into a user's local agent environment via `npm run install` or `npx skills add`.
**Aliases**: none
**Notes**: Source of truth for install is `skills/`, not `.agents/skills/`.

### Term: Working copy
**Context**: global
**Definition**: A skill tree under `.agents/skills/` used during active development before changes land in `skills/`.
**Aliases**: agents skill copy (see Agents tree)
**Notes**: Not the canonical install path. Prefer **Agents tree** when referring to the flat dev tree at `.agents/skills/<name>/`.

### Term: Canonical tree
**Context**: skill-paths / skill-catalog
**Definition**: The install source-of-truth skill directory at `skills/<category>/<name>/`. Overwritten on sync for source skills.
**Aliases**: canonical skill tree
**Notes**: Resolved as `canonicalDir` by `lib/skill-paths.mjs`.

### Term: Agents tree
**Context**: skill-paths / tooling
**Definition**: A flat dev working copy at `.agents/skills/<name>/` used during active development before changes land in the canonical tree.
**Aliases**: agents skill copy (see Working copy)
**Notes**: Resolved as `agentsDir` by `lib/skill-paths.mjs`. Used by `extract-overlay --from-agents`. Not the install source of truth.

### Term: Overlay route
**Context**: overlay-pipeline
**Definition**: The audit-determined next action for a customized source skill: `restore` (inputs unchanged, re-checkout blend), `remerge` (upstream or overlay changed, needs semantic merge), `fresh` (never applied), or `none` (no overlay or generators).
**Aliases**: overlay routing
**Notes**: Resolved by `getOverlayRoute` in `locks.mjs`; full audit via `auditSkill`.

### Term: Pending apply
**Context**: overlays
**Definition**: A source skill that needs semantic overlay merge or first-time blend after sync. Equivalent to overlay routes `fresh` or `remerge`.
**Aliases**: overlay pending
**Notes**: Authoritative check is `isPendingApply(skillName)` — not `overlay_applied_at` vs `synced_at` timestamp comparison.

### Term: Generator
**Context**: overlays / overlay-yaml
**Definition**: An agent manifest producer declared in universal `overlays/OVERLAY.yaml` and optionally overridden per skill via `generators.add` or `generators.disable` in `overlays/<name>/OVERLAY.yaml`.
**Aliases**: overlay generator
**Notes**: Merge resolution lives in `lib/overlay-yaml.mjs`; outputs are agent-applied via the update-skills skill, not executed by npm scripts.

### Term: Validate workflow
**Context**: tooling
**Definition**: The GitHub Actions workflow in `.github/workflows/validate.yaml` that is this repository’s merge gate on push and pull request to `main`.
**Aliases**: none
**Notes**: Runs `npm test` then full `npm run validate`. Distinct from the Sync workflow (`.github/workflows/sync.yaml`). Not structure-only validate.

### Term: Structure validation
**Context**: tooling
**Definition**: Validation that manifests, SKILL.md frontmatter, overlay YAML shape, static file references, generator outputs, and marketplace sync are well-formed — without git audit or `blended_ref` inspection.
**Aliases**: structure-only validate
**Notes**: Implemented by `validateStructure()`. `npm run validate -- --structure-only` is an optional CLI flag. This repository’s Validate workflow is not structure-only.

### Term: Blend validation
**Context**: tooling / overlays
**Definition**: Validation that overlay lock routing, `blended_ref` presence, and pending apply state are consistent for source skills after sync.
**Aliases**: blend-state validate
**Notes**: Implemented by `validateBlendState()`; uses `auditSkill` and `isOverlayRoutePending`; opt-in warnings for maintainers, not CI structure gates.

### Term: Runtime visibility
**Context**: deploy-mate
**Definition**: Prepared read paths from deployed components back to the agent or user — health, platform status, logs, and error signals — so post-deploy state can be verified and debugged.
**Aliases**: feedback loop, observability readiness
**Notes**: Distinct from Verify (execution) and from full metrics/APM stacks.

### Term: Tier-1 visibility
**Context**: deploy-mate
**Definition**: Hard-gate visibility signal for a component: HTTP health check and/or platform status CLI, evaluated runtime-first before deploy is allowed and as the first Verify checks after deploy.
**Aliases**: tier-1, hard visibility
**Notes**: Non-HTTP components use platform process/container status as minimum tier-1.

### Term: Tier-2 visibility
**Context**: deploy-mate
**Definition**: Soft-gate visibility signal for a component: structured log access and CI workflow conclusion, run after tier-1 during Verify; may be deferred with explicit user acknowledgment.
**Aliases**: tier-2, soft visibility
**Notes**: CI confirmation is tier-2 and runs after runtime signals when CI deploys the app.

### Term: Read chain
**Context**: deploy-mate
**Definition**: The ordered sequence of visibility checks after deploy: runtime signals first, then CI confirmation when applicable.
**Aliases**: visibility chain, check order
**Notes**: Default order is runtime first, CI second.

### Term: Runtime visibility tooling
**Context**: deploy-mate
**Definition**: The third tooling table in `configuration.md` mapping CLIs and MCPs used to execute tier-1 and tier-2 read paths, verified for platform access during `arm visibility`.
**Aliases**: feedback tooling, visibility tooling
**Notes**: Distinct from Deploy tooling and Collection tooling.

### Term: Archive post-commit gate
**Context**: ferspec-workflow
**Definition**: Blocking verification after archive commit — empty `git status --porcelain` and the latest commit includes synced specs plus archive folder paths under `openspec/changes/archive/`.
**Aliases**: none
**Notes**: Archive MUST NOT be reported complete until this gate passes. Avoid describing archive as "done" without commit and gate.

### Term: Operation guidance
**Context**: ferspec-workflow / openspec-config
**Definition**: Advisory strings from `openspec/config.yaml` per-operation `guidance` arrays (e.g. `operations.archive.guidance`), loaded by `openspec instructions archive --change "<name>" --json` and surfaced as `operationGuidance` for workflow agents.
**Aliases**: archive guidance
**Notes**: Distinct from `schema.yaml` apply instruction blocks. Agents treat applicable guidance as additive to built-in workflow steps.

### Term: Characterization test
**Context**: tooling / upstream-sync
**Definition**: A Node unit test that records current filesystem mutation behavior of Sync write, Import copy, static overlay apply, and Update orchestration so later refactors can detect drift, without changing that behavior.
**Aliases**: none
**Notes**: Tests MUST exercise real filesystem writes or deletes on temporary trees, not only source greps. They MUST NOT clone GitHub or write the live canonical catalog or `.locks/upstream.json`.

