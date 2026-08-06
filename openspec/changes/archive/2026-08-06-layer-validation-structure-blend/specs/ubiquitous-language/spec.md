## ADDED Requirements

### Requirement: Structure validation glossary entry

The glossary SHALL define **Structure validation** as checks that the repository is well-formed without inspecting git blend state.

#### Scenario: Structure validation definition

- **GIVEN** a maintainer reads the ubiquitous-language spec
- **WHEN** they look up Structure validation
- **THEN** the definition MUST list: manifests, SKILL.md frontmatter, overlay YAML shape, static file refs, generator output presence, and marketplace sync
- **AND** MUST explicitly state it does not call `auditSkill` or inspect `blended_ref`

### Requirement: Blend validation glossary entry

The glossary SHALL define **Blend validation** as checks that overlay lock routing and `blended_ref` state are consistent with pending apply semantics.

#### Scenario: Blend validation definition

- **GIVEN** a maintainer reads the ubiquitous-language spec
- **WHEN** they look up Blend validation
- **THEN** the definition MUST state it covers audit routes, `blended_ref` presence, and pending remerge detection
- **AND** MUST note the bounded context is tooling / validate blend layer
- **AND** MUST reference `validateBlendState()` as the implementation entry point

## Term entries

### Term: Structure validation
**Context**: tooling
**Definition**: Validation that manifests, SKILL.md frontmatter, overlay YAML shape, static file references, generator outputs, and marketplace sync are well-formed — without git audit or `blended_ref` inspection.
**Aliases**: structure-only validate
**Notes**: Implemented by `validateStructure()`; CI may run via `npm run validate -- --structure-only`.

### Term: Blend validation
**Context**: tooling / overlays
**Definition**: Validation that overlay lock routing, `blended_ref` presence, and pending apply state are consistent for source skills after sync.
**Aliases**: blend-state validate
**Notes**: Implemented by `validateBlendState()`; uses `auditSkill` and `isOverlayRoutePending`; opt-in warnings for maintainers, not CI structure gates.
