## ADDED Requirements

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

_The following entries MUST be appended to the Term entries section of `openspec/specs/ubiquitous-language/spec.md` at archive time:_

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
