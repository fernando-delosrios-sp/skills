## ADDED Requirements

### Requirement: Harness proxy glossary entry

The glossary SHALL define **Harness proxy** as a unified dispatcher skill and CLI tool that accepts a coding sub-task, selects the most suitable external agent harness based on quota and complexity, and executes it in isolation. Notes MUST reject subagent forwarder and agent gateway as aliases. Bounded context is engineering / harness-proxy.

#### Scenario: Harness proxy definition

- **GIVEN** a maintainer reads the ubiquitous-language spec
- **WHEN** they look up Harness proxy
- **THEN** a `### Term: Harness proxy` entry MUST exist
- **AND** the definition MUST describe a unified dispatcher skill and CLI tool for cross-subscription task delegation
- **AND** notes MUST reject subagent forwarder and agent gateway as aliases

### Requirement: Target harness glossary entry

The glossary SHALL define **Target harness** as an external AI coding environment or agent runner (specifically Cursor Agent CLI `agent`, Antigravity CLI `agy`, or OpenCode Go CLI `opencode`) invoked headlessly as a child worker. Notes MUST reject worker bot and slave agent as aliases. Bounded context is engineering / harness-proxy.

#### Scenario: Target harness definition

- **GIVEN** a maintainer reads the ubiquitous-language spec
- **WHEN** they look up Target harness
- **THEN** a `### Term: Target harness` entry MUST exist
- **AND** the definition MUST list Cursor `agent`, Antigravity `agy`, and OpenCode Go `opencode` as the supported runners
- **AND** notes MUST reject worker bot and slave agent as aliases

### Requirement: Model tier glossary entry

The glossary SHALL define **Model tier** as a standardized capability classification (`frontier`, `workhorse`, `lightweight`) grouping models from different providers based on external coding benchmark percentiles. Notes MUST reject model level and intelligence grade as aliases. Bounded context is engineering / harness-proxy.

#### Scenario: Model tier definition

- **GIVEN** a maintainer reads the ubiquitous-language spec
- **WHEN** they look up Model tier
- **THEN** a `### Term: Model tier` entry MUST exist
- **AND** the definition MUST describe the three standard tiers: frontier, workhorse, and lightweight

### Requirement: Jev classifier glossary entry

The glossary SHALL define **Jev classifier** as a fast, lightweight task complexity evaluation engine running on a configurable endpoint (local Ollama/llama.cpp by default, falling back to cheap cloud models or heuristics) that scores task difficulty to assign a model tier. Notes MUST reject prompt router and complexity analyzer as aliases. Bounded context is engineering / harness-proxy.

#### Scenario: Jev classifier definition

- **GIVEN** a maintainer reads the ubiquitous-language spec
- **WHEN** they look up Jev classifier
- **THEN** a `### Term: Jev classifier` entry MUST exist
- **AND** the definition MUST state it scores task difficulty on a configurable endpoint to assign model tiers

### Requirement: Quota ledger glossary entry

The glossary SHALL define **Quota ledger** as a persistent local storage file tracking token spend, timestamps, and estimated consumption against known provider allowances when live provider endpoints are unavailable. Notes MUST reject usage database and token tracker as aliases. Bounded context is engineering / harness-proxy.

#### Scenario: Quota ledger definition

- **GIVEN** a maintainer reads the ubiquitous-language spec
- **WHEN** they look up Quota ledger
- **THEN** a `### Term: Quota ledger` entry MUST exist
- **AND** the definition MUST state it tracks historical consumption in `~/.config/harness-proxy/ledger.json`

### Requirement: Worktree sandbox glossary entry

The glossary SHALL define **Worktree sandbox** as an ephemeral Git worktree created on branch `harness/<task-id>` where a target harness performs edits without touching the developer's active working tree. Notes MUST reject scratch directory and temp workspace as aliases. Bounded context is engineering / harness-proxy.

#### Scenario: Worktree sandbox definition

- **GIVEN** a maintainer reads the ubiquitous-language spec
- **WHEN** they look up Worktree sandbox
- **THEN** a `### Term: Worktree sandbox` entry MUST exist
- **AND** the definition MUST state it is an ephemeral Git worktree on `harness/<task-id>` ensuring clean process isolation
