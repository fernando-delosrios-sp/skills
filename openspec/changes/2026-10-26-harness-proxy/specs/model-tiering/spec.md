## ADDED Requirements

### Requirement: Model tiering classification matrix

The harness proxy SHALL maintain a `tiers.yaml` configuration matrix that organizes provider models into `frontier`, `workhorse`, and `lightweight` capability tiers.

#### Scenario: Tier definition structure

- **GIVEN** `~/.config/harness-proxy/tiers.yaml` exists
- **WHEN** inspected by the routing engine
- **THEN** it MUST contain definitions for `frontier`, `workhorse`, and `lightweight`
- **AND** each tier MUST list mapped models for Cursor, Antigravity, and OpenCode Go

#### Scenario: User customization preserved

- **GIVEN** a user manually pins or reassigns a model to a specific tier in `tiers.yaml`
- **WHEN** automatic synchronization runs
- **THEN** user-pinned assignments MUST NOT be overwritten without explicit confirmation

### Requirement: Jev task complexity classification

The harness proxy SHALL score incoming task prompts through a Jev classifier to assign the appropriate model tier.

#### Scenario: Local Jev scoring

- **GIVEN** a running local Jev endpoint (Ollama/llama.cpp)
- **WHEN** a task prompt is evaluated
- **THEN** Jev MUST return a structured score mapping to `frontier`, `workhorse`, or `lightweight`
- **AND** the routing engine MUST route delegation to that tier

#### Scenario: Fallback when Jev endpoint is unreachable

- **GIVEN** the configured Jev endpoint is unavailable, unconfigured, or returns an error
- **WHEN** a task prompt is evaluated
- **THEN** the classifier MUST fall back to rule-based prompt and keyword heuristics

### Requirement: Public benchmark synchronization

The harness proxy SHALL synchronize model rankings against Artificial Analysis or LiveCodeBench public benchmark APIs with a 7-day TTL cache.

#### Scenario: Background benchmark caching

- **GIVEN** the cached benchmark data in `~/.config/harness-proxy/cache/benchmarks.json` is older than 7 days
- **WHEN** a synchronization check runs
- **THEN** the system MUST fetch updated coding intelligence indices from the benchmark API
- **AND** MUST update the cache timestamp and refresh model percentiles

#### Scenario: Manual model synchronization

- **GIVEN** a user executes `harness-proxy sync-models`
- **WHEN** the command completes
- **THEN** it MUST discover available models from installed provider CLIs (`agent models`, `agy models`, `opencode models`)
- **AND** MUST correlate them against benchmark percentiles
- **AND** MUST print proposed tier reassignments and prompt for user confirmation before writing to `tiers.yaml`
