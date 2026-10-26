## ADDED Requirements

### Requirement: Hybrid quota inspection

The harness proxy SHALL discover and query live subscription usage across Cursor, Antigravity, and OpenCode Go using local cached session credentials, falling back to a local accounting ledger when tokens are absent or rate-limited.

#### Scenario: Live provider query with cached credentials

- **GIVEN** valid authentication tokens exist in local provider caches (`~/.cursor`, `~/.config/opencode`, or gcloud/Antigravity)
- **WHEN** the quota engine inspects provider allowances
- **THEN** it MUST query the respective usage endpoint
- **AND** MUST cache the returned allowance and reset timestamp in `~/.config/harness-proxy/cache/quota.json`

#### Scenario: Fallback to local accounting ledger

- **GIVEN** a provider's live quota endpoint is unreachable, returns 401/403, or rate limits requests
- **WHEN** the quota engine determines provider availability
- **THEN** it MUST calculate remaining allowance using the local `ledger.json` historical consumption data against configured monthly caps
- **AND** MUST flag the provider balance as an estimate

### Requirement: Local quota accounting ledger

The harness proxy SHALL record all delegated invocations, estimated token counts, and provider responses in a persistent local ledger file.

#### Scenario: Logging delegated executions

- **GIVEN** a delegated sub-task completes or fails
- **WHEN** the run finishes
- **THEN** the system MUST append an entry to `~/.config/harness-proxy/ledger.json` recording timestamp, provider name, model used, estimated prompt/completion tokens, and outcome
- **AND** MUST update the running usage total for the billing cycle

### Requirement: Quota status reporting

The harness proxy SHALL provide a CLI command and agent inspection tool to display remaining subscription quotas, reset countdowns, and provider health.

#### Scenario: Displaying unified quota summary

- **GIVEN** a user runs `harness-proxy quota`
- **WHEN** the command executes
- **THEN** the system MUST display a formatted table showing each provider's status, remaining requests/tokens, percentage consumed, and time until reset
