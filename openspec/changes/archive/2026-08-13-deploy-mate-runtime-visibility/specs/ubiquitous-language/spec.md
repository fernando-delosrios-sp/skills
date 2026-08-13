## ADDED Requirements

### Requirement: Runtime visibility domain terms

The ubiquitous-language spec SHALL include the following deploy-mate terms under Term entries:

#### Term: Runtime visibility
**Context**: deploy-mate
**Definition**: Prepared read paths from deployed components back to the agent or user — health, platform status, logs, and error signals — so post-deploy state can be verified and debugged.
**Aliases**: feedback loop, observability readiness
**Notes**: Distinct from Verify (execution) and from full metrics/APM stacks.

#### Term: Tier-1 visibility
**Context**: deploy-mate
**Definition**: Hard-gate visibility signal for a component: HTTP health check and/or platform status CLI, evaluated runtime-first before deploy is allowed and as the first Verify checks after deploy.
**Aliases**: tier-1, hard visibility
**Notes**: Non-HTTP components use platform process/container status as minimum tier-1.

#### Term: Tier-2 visibility
**Context**: deploy-mate
**Definition**: Soft-gate visibility signal for a component: structured log access and CI workflow conclusion, run after tier-1 during Verify; may be deferred with explicit user acknowledgment.
**Aliases**: tier-2, soft visibility
**Notes**: CI confirmation is tier-2 and runs after runtime signals when CI deploys the app.

#### Term: Read chain
**Context**: deploy-mate
**Definition**: The ordered sequence of visibility checks after deploy: runtime signals first, then CI confirmation when applicable.
**Aliases**: visibility chain, check order
**Notes**: Default order is runtime first, CI second.

#### Term: Runtime visibility tooling
**Context**: deploy-mate
**Definition**: The third tooling table in `configuration.md` mapping CLIs and MCPs used to execute tier-1 and tier-2 read paths, verified for platform access during `arm visibility`.
**Aliases**: feedback tooling, visibility tooling
**Notes**: Distinct from Deploy tooling and Collection tooling.

#### Scenario: Glossary includes runtime visibility terms

- **WHEN** a maintainer archives this change into `openspec/specs/ubiquitous-language/spec.md`
- **THEN** all five term entries above MUST appear under Term entries
- **AND** each entry MUST follow the Term entry format (Context, Definition, Aliases, Notes)
