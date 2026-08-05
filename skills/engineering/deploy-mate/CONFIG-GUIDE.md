# deploy-mate — configuration & Harvest

Per-variable playbook for **Document** (obtain steps) and **Harvest** (value collection). **Vague obtain instructions fail the Document gate.**

## Variable classes

| Class | Examples | Harvest notes |
|-------|----------|---------------|
| `secret` | API keys, DB passwords, signing keys | Never echo value in chat after collection; confirm shape only |
| `config` | `PORT`, region, feature flags | May have defaults; state default vs required override |
| `derived` | Connection URL built from parts | Document formula; collect parts, not the assembled URL unless user prefers |

## Per-variable block (required in configuration.md)

Use one block per var — not a single summary table row.

```markdown
### `VAR_NAME`

| Field | Value |
|-------|-------|
| Class | secret \| config \| derived |
| Required | yes \| no (default: `<value>`) |
| Consumed by | `<service>` — cite `file:line` or deploy config |
| Purpose | One sentence: what breaks without it |
| Collection method | mcp \| skill \| cli \| manual |
| Tool | MCP: `<server>/<tool>` · Skill: `<name>` · CLI: `<command>` |
| Primary chain | e.g. `cli → mcp → manual` — from Arm map |
| Scaffold dependency | `<resource from registry>` \| none |

#### How to obtain

Minimum **5 numbered steps**. Each step is one concrete action — a click path, CLI command, or paste target. Reject blocks with fewer than 5 steps or any step lacking **Where**, **Action**, or **Copy target**.

| Step | Where | Action | Copy target |
|------|-------|--------|-------------|
| 1 | `<Product>` → `<Console path>` OR terminal | `<exact click, command, or navigation>` | `<field name or CLI flag that holds the value>` |
| 2 | … | **Prerequisite:** account / role / scaffold resource | … |
| 3 | … | **Create or locate:** UI clicks, API endpoint, or CLI flags | … |
| 4 | … | **Copy:** name the field (not "the key") | `<VAR_NAME>` |
| 5 | … | **Scope:** project/app/environment this credential belongs to | … |

**Console URL:** `https://…` (full path when possible — include hash/route if needed)

**CLI (agent runs when Arm-ready status is `ready`):**
```bash
# exact command — prefer --json / structured output
# reference scaffold IDs from Scaffold registry when applicable
```

#### Format & validation

- **Shape:** `<pattern>` — e.g. `sk_live_…` (51 chars), UUID, base64 32 bytes
- **Constraints:** min/max length, charset, prefix
- **Verify:**
```bash
# command or curl that proves the value works (no secret in output)
```

#### Deploy mapping

| Target | How injected |
|--------|--------------|
| `<platform>` | `.env` → `<platform secret name>` / GitHub Actions secret / … |

#### Harvest status

- [ ] Documented
- [ ] Tool attempted — MCP / skill / **CLI** per [TOOLING.md](TOOLING.md)
- [ ] Collected in `.env`
- [ ] Validated
- Via: `<mcp-server/tool | skill-name | cli | manual>`
- Blocker: `<none | describe — include what user must do>`
- Round: `<harvest round number when last attempted>`
```

## Acceptable vs rejected "How to obtain"

| Rejected (blocks Document) | Acceptable |
|----------------------------|------------|
| "Get from Stripe dashboard" | 1. Open `https://dashboard.stripe.com/test/apikeys` → 2. Developers → API keys → 3. **Secret key** row → Reveal test key → 4. Copy `sk_test_…` (51 chars) → 5. Scope: `<env>` uses test mode |
| "Ask DevOps" | 1. **Owner:** `<team/person>` → 2. **Ticket:** request `VAR_NAME` for `<env>` → 3. **Vault path:** `<path>` → 4. **Field:** `<key name in vault>` → 5. **Fallback:** manual paste when ticket pending |
| "Set DATABASE_URL" | 1. Neon console → Project `<name from Scaffold registry>` → 2. Connection details → 3. **Pooled connection** tab → 4. Copy password field separately → 5. Assemble per derived formula OR copy full URI |
| "Generate a secret" | 1. Run `openssl rand -base64 32` in terminal → 2. Copy stdout (44 chars incl. padding) → 3. Store as `VAR_NAME` → 4. Verify: length check → 5. Scope: app session signing for `<env>` |
| Steps without Copy target | Every step names what to copy or which CLI output field to read |

## Scaffold

Create platform shells **before** Harvest when obtain paths require existing resources. Record every resource in `configuration.md` → **Scaffold registry**.

| Platform | Typical scaffold | CLI example | Unblocks |
|----------|------------------|-------------|----------|
| Fly.io | App shell (no deploy) | `fly apps create <name> --org <org>` | `FLY_APP_NAME`, org slug |
| Neon | Project + database | `neonctl projects create --name <env>` | `DATABASE_URL`, project ID |
| Vercel | Project link | `vercel link` / create project | `VERCEL_PROJECT_ID`, team ID |
| AWS | SSM prefix, S3 bucket, IAM role | `aws s3 mb s3://<bucket>` | bucket name, ARNs |
| Stripe | Restricted key (test) | Dashboard or `stripe restricted_keys create` | `STRIPE_*` keys |
| GitHub | Environment, repo | `gh repo create` / `gh api …/environments` | `GITHUB_TOKEN`, env secrets path |

Rules:

1. **List first** — always check existing resources before creating
2. **User approval** — confirm name, region, org before create
3. **Minimal** — empty shell only; no app code deploy
4. **Record** — ID, name, region, CLI output summary in Scaffold registry
5. **Re-enter during Harvest** — when Blocker is "resource missing", mini Scaffold pass then retry collection

## Harvest protocol (Phase 4b)

Requires **Arm-ready** — mapped tools installed and verified (or opted out). See [TOOLING.md](TOOLING.md).

Run **after** each var's Document block exists. **Iterative** — repeat rounds until user declares Harvest **finished**. **Hold between rounds** — never advance to Forge or start artifact generation from within Harvest.

### Anti-rush rules

| Forbidden | Why |
|-----------|-----|
| Enter Forge while Harvest is in-progress | Strategy and files wait for finished Harvest |
| Mark Harvest finished without user saying so | Only the user closes the loop |
| Skip pending **Required: yes** vars in a round | Every pending required var gets an attempt or Blocker update |
| Start next round in the same turn as the report | User must reply first |
| Treat partial collection as "good enough" | Report must list **every** Catalog var |

### Each round

1. **Review blockers** — read Harvest status; ask user what they unblocked since last round
2. **Scaffold** — create any newly approved resources (see § Scaffold)
3. **Collect by service cluster** — infrastructure → third-party APIs → platform creds → app-generated → optional config
4. **Per var:** MCP → skill → **CLI** per primary chain when status is `ready`. Agent **runs** CLI commands. Vars still `pending` must be attempted — record Blocker if all methods fail
5. **Manual fallback** — Document steps only when all automated methods failed or opt-out
6. **Validate** — run Verify command from the block
7. **Write** to `.deploy-mate/<env>/.env` (`chmod 600`). Diff before overwrite. Record `Via:` and `Round:`
8. **Report** — table listing **every** var: Collected / Validated / Blocker / pending. Specific user actions for each blocker
9. **Stop** — ask: "Continue Harvest or mark finished?" **End the turn.** Do not continue until user replies

User may paste values, grant access, or create resources between rounds — re-run affected vars next round.

### Completion

Harvest ends when **both**:

- User explicitly declares Harvest **finished**
- Every **Required: yes** var is Collected + Validated (with `via:`) or has a Blocker the user accepts

Record final round in `<env>/progress.md` → Harvest rounds table. Only then may Forge begin.

## Grouping order

1. Infrastructure the app depends on (DB, cache, object storage)
2. Third-party APIs (payment, email, auth)
3. Platform/deploy credentials (Fly token, AWS keys, GitHub Actions secrets)
4. App-generated secrets (JWT secret, session key) — use Generate steps
5. Optional / config vars last

## Delegation

- `find-docs` — vendor obtain steps when no MCP covers the source service
- `find-skills` — discover MCP/skill when Arm map is empty for a service
- Platform MCPs — install and call per [TOOLING.md](TOOLING.md)
- **Local CLIs** — install, auth, run per [TOOLING.md](TOOLING.md); primary path for many services
- `env-secrets-manager` — vault sync when user prefers over local `.env`

