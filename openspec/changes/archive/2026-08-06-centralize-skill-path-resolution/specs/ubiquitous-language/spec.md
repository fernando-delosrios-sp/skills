## ADDED Requirements

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

## MODIFIED Requirements

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

## ADDED Term entries (implementation note)

_The following entries MUST be appended or updated in the Term entries section of `openspec/specs/ubiquitous-language/spec.md` at archive time:_

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

_Update **Working copy** term Notes to reference Agents tree as preferred alias._
