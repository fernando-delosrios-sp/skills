## ADDED Requirements

### Requirement: Generator glossary entry

The glossary SHALL define **Generator** as an agent manifest producer declared in overlay generator configuration.

#### Scenario: Generator definition

- **GIVEN** a maintainer reads the ubiquitous-language spec
- **WHEN** they look up Generator
- **THEN** the definition MUST state generators are declared in universal `overlays/OVERLAY.yaml` and MAY be overridden per skill via `generators.add` / `generators.disable`
- **AND** MUST note the bounded context is overlays / overlay-yaml
- **AND** MUST reference that merge resolution lives in `overlay-yaml.mjs`
