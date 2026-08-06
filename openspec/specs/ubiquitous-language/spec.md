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
**Notes**: Applied after sync; requires skill-overlay skill for semantic reconciliation.

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
**Aliases**: agents skill copy
**Notes**: Not the canonical install path.
