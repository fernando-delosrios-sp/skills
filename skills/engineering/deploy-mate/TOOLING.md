# deploy-mate — MCP, skill & CLI tooling

Install, configure, and **use** mapped tools during **Arm-ready** and **Harvest**. Manual console paste is the last resort.

## Arm — map tools to source services

For **each source service** from Catalog, add a row to `configuration.md` → **Collection tooling** with up to three layers:

| Source service | Vars | MCP / skill | Local CLI | Primary method |
|----------------|------|-------------|-----------|----------------|
| Fly.io | `FLY_API_TOKEN` | — | `flyctl` | cli |
| Stripe | `STRIPE_*` | Stripe MCP | `stripe` | mcp → cli |
| Neon | `DATABASE_URL` | Neon MCP | `neonctl` | cli → mcp |
| AWS | `AWS_*` | — | `aws` | cli |
| GitHub | `GITHUB_TOKEN` | — | `gh` | cli |

Also map **deploy tooling** per deploy target. Every var must trace to at least one automated path (`mcp`, `skill`, or `cli`) before `manual`.

Use `find-docs` for current CLI install/auth commands when unsure. Use `find-skills` when no MCP/skill exists.

## Arm-ready — install & configure (required before Scaffold and Harvest)

**Independent preliminary process.** **Collaborate with the user** — auth often requires their browser, credentials, or approval. Do not enter Scaffold or Harvest until complete.

**Default: do not skip.** Proceed only when every mapped MCP, skill, **and CLI** is `ready` or explicitly `opt-out` per service.

### A. MCP & skills

For each mapped MCP or skill:

1. **Discover** — `GetMcpTools` (MCP) or read skill `SKILL.md`
2. **Install** — skill: `npx skills add …`; MCP: `.cursor/mcp.json` or Cursor Settings → MCP
3. **Configure** — document auth env vars (names only)
4. **Authenticate** — `mcp_auth` when status is `needsAuth`; **wait for user** if browser flow required
5. **Verify** — read-only tool call; record in setup notes
6. **Status** — `ready | needs-auth | install-failed | opt-out`

### B. Local CLIs (required when mapped)

For each mapped CLI:

1. **Detect** — run `which <cli>` and `<cli> --version` (or equivalent)
2. **Install** — if missing, guide user and run install when approved:

   | CLI | Typical install (macOS) | Verify |
   |-----|-------------------------|--------|
   | `flyctl` | `brew install flyctl` | `fly version` |
   | `vercel` | `npm i -g vercel` | `vercel --version` |
   | `aws` | `brew install awscli` | `aws --version` |
   | `gh` | `brew install gh` | `gh --version` |
   | `stripe` | `brew install stripe/stripe-cli/stripe` | `stripe --version` |
   | `neonctl` | `npm i -g neonctl` | `neonctl --version` |
   | `terraform` | `brew install terraform` | `terraform version` |
   | `kubectl` | `brew install kubectl` | `kubectl version --client` |
   | `docker` | Docker Desktop / `brew install docker` | `docker --version` |

   Prefer official install docs via `find-docs` when the table doesn't cover the platform (Linux, Windows).

3. **Authenticate** — run or guide login; **user completes interactive flows**:

   | CLI | Auth command | Notes |
   |-----|--------------|-------|
   | `flyctl` | `fly auth login` | Opens browser |
   | `vercel` | `vercel login` | Opens browser |
   | `aws` | `aws configure` / `aws sso login` | Access key or SSO profile |
   | `gh` | `gh auth login` | Scopes: `repo`, `read:org` as needed |
   | `stripe` | `stripe login` | Pairs CLI to account |
   | `neonctl` | `neonctl auth` | Opens browser |

4. **Verify** — read-only command proving access:

   ```bash
   fly apps list
   vercel whoami
   aws sts get-caller-identity
   gh auth status
   stripe config --list
   neonctl projects list
   ```

5. **Record** — CLI path, version, auth profile, verify output (redact secrets) in `configuration.md` → CLI setup notes
6. **Status** — `ready | needs-auth | not-installed | opt-out`

7. **Confirm with user** — present tooling status table; get explicit ack before Scaffold/Harvest

### MCP config template (project-local)

```json
{
  "mcpServers": {
    "<server-id>": {
      "command": "npx",
      "args": ["-y", "<package>"],
      "env": {
        "API_KEY": "${env:VAR_NAME}"
      }
    }
  }
}
```

### When user opts out

Record `opt-out` with reason. Downgrade affected vars to the next available method (`cli` → `manual`). Update each var block.

## Scaffold — platform resource staging

Uses Arm-ready CLIs. See [CONFIG-GUIDE.md](CONFIG-GUIDE.md) § Scaffold for platform table and rules.

Agent **runs** scaffold commands when CLI status is `ready`. Record results in **Scaffold registry**.

```bash
# Fly — app shell only
fly apps create <app-name> --org <org>

# Neon — project + branch
neonctl projects create --name <env>-<app>

# Vercel — link or create
vercel link --yes

# AWS — bucket
aws s3 mb s3://<env>-<app>-assets --region <region>
```

Re-run Scaffold during Harvest when blockers reference missing resources. **Never** run deploy commands (`fly deploy`, `vercel deploy`, `slack run`, …) — see [CONFIG-GUIDE.md](CONFIG-GUIDE.md) § Deploy scope.

## Harvest — tool-first collection

Collect **deploy-critical** vars only. Skip `local-dev` and `runtime-derived` — mark excluded per [CONFIG-GUIDE.md](CONFIG-GUIDE.md) § Deploy scope.

For each deploy-critical var, attempt methods in order until value retrieved. **Skip none that are mapped and `ready`.**

| Priority | Method | Action |
|----------|--------|--------|
| 1 | `mcp` | Call mapped MCP tool. `GetMcpTools` first if schema unknown. |
| 2 | `skill` | Invoke mapped skill (`find-docs`, `env-secrets-manager`, …). |
| 3 | `cli` | Run mapped CLI commands — prefer structured output (`--json`, `-o json`). |
| 4 | `manual` | Document steps from CONFIG-GUIDE; user pastes value. |

When Primary method is `cli` and no MCP/skill mapped, start at priority 3.

### CLI collection examples

Document exact commands in each var's **How to obtain** block:

```bash
# Fly — create/read deploy token
fly tokens create deploy -a <app-name>

# Neon — connection string (use Scaffold registry project ID)
neonctl connection-string --project-id <id> --database-name <db> --pooled

# AWS — fetch SSM parameter
aws ssm get-parameter --name "/<env>/DATABASE_URL" --with-decryption --query Parameter.Value --output text

# GitHub — fine-grained token (guide user) or gh api for repo secrets metadata
gh auth token   # only when user explicitly approves; prefer creating named token

# Stripe — restricted key via API (stripe CLI)
stripe api_keys list
```

Agent **runs** these commands when CLI status is `ready` — do not only print them for the user.

After retrieval:

1. Confirm shape (prefix, length) — never echo full secret in chat
2. Run **Verify** command from var block
3. Write to `.deploy-mate/<env>/.env` (`chmod 600`); diff before overwrite
4. Update Harvest status + `Via:` (`flyctl`, `neon-mcp`, `manual`, …) + `Round:`

### Failure handling

| Failure | Action |
|---------|--------|
| MCP `needsAuth` | `mcp_auth`, retry |
| CLI not installed | Run Arm-ready install; retry |
| CLI auth failed | Re-run login with user; record blocker if stuck |
| Permission denied | Record blocker; fall back to next method |
| Resource missing | Scaffold mini-pass; retry |
| All automated failed | Manual Document steps; leave Blocker for next Harvest round |

## Skills install reference

```bash
npx skills add fernando-delosrios-sp/skills --skill find-docs
npx skills search <keyword>
```

## Collection tooling section (configuration.md)

```markdown
## Collection tooling

| Source service | MCP / skill | Local CLI | Primary | Status |
|----------------|-------------|-----------|---------|--------|
| Neon | neon-mcp | `neonctl` | cli | ready |

## MCP setup notes
…

## CLI setup notes

### neonctl
- Installed: `/opt/homebrew/bin/neonctl` (v2.x)
- Auth: `neonctl auth` — profile `<user@email>`
- Verified: `neonctl projects list` → 3 projects
```

