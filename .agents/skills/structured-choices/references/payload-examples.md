# Gate payloads (Cursor and T3 Code / Antigravity)

Call shapes for a gate. Below are literal argument objects for Cursor (`AskQuestion`) and T3 Code / Antigravity (`ask_question`).

- In **Cursor**, an option carries `id` and `label` only, so anything explanatory rides inside the `label`.
- In **T3 Code / Antigravity**, `options` is an array of strings formatted as `"<id>: <label>"`, with `(Recommended)` prefix on the suggested choice. `toolAction` and `toolSummary` are required.

Running on another host: [`other-hosts.md`](other-hosts.md).

## Single choice

### Cursor (`AskQuestion`)

```json
{
  "questions": [
    {
      "id": "schema",
      "prompt": "Which OpenSpec schema should we install?",
      "options": [
        { "id": "superpowers-bridge", "label": "superpowers-bridge — OpenSpec + Superpowers orchestration (Recommended)" },
        { "id": "minimalist", "label": "minimalist — fast spec-to-tasks path" },
        { "id": "behaviour-driven", "label": "behaviour-driven — Gherkin-style specs" }
      ]
    }
  ]
}
```

### T3 Code / Antigravity (`ask_question`)

```json
{
  "questions": [
    {
      "question": "Which OpenSpec schema should we install?",
      "options": [
        "(Recommended) superpowers-bridge: OpenSpec + Superpowers orchestration",
        "minimalist: fast spec-to-tasks path",
        "behaviour-driven: Gherkin-style specs"
      ],
      "is_multi_select": false
    }
  ],
  "toolAction": "Selecting OpenSpec schema",
  "toolSummary": "Schema selection"
}
```

## Confirm

Two options, recommended first.

### Cursor (`AskQuestion`)

```json
{
  "questions": [
    {
      "id": "install-skills",
      "prompt": "Install recommended behavioral skills for this schema?",
      "options": [
        { "id": "yes", "label": "Yes, install (Recommended)" },
        { "id": "skip", "label": "Skip — I will install manually" }
      ]
    }
  ]
}
```

### T3 Code / Antigravity (`ask_question`)

```json
{
  "questions": [
    {
      "question": "Install recommended behavioral skills for this schema?",
      "options": [
        "(Recommended) yes: Yes, install",
        "skip: Skip — I will install manually"
      ],
      "is_multi_select": false
    }
  ],
  "toolAction": "Confirming skill installation",
  "toolSummary": "Skill installation confirmation"
}
```

## Multi-select

Allows the user to pick more than one option (`allow_multiple: true` in Cursor, `is_multi_select: true` in T3 Code).

### Cursor (`AskQuestion`)

```json
{
  "title": "Domain specs",
  "questions": [
    {
      "id": "domains",
      "prompt": "Confirm the domain specs to create:",
      "allow_multiple": true,
      "options": [
        { "id": "billing", "label": "billing — payments and subscriptions" },
        { "id": "identity", "label": "identity — auth and users" },
        { "id": "catalog", "label": "catalog — products and inventory" }
      ]
    }
  ]
}
```

### T3 Code / Antigravity (`ask_question`)

```json
{
  "questions": [
    {
      "question": "Confirm the domain specs to create:",
      "options": [
        "billing: billing — payments and subscriptions",
        "identity: identity — auth and users",
        "catalog: catalog — products and inventory"
      ],
      "is_multi_select": true
    }
  ],
  "toolAction": "Selecting domain specs",
  "toolSummary": "Domain specs selection"
}
```

## Multi-question round

One gate per grilling round — one `questions` entry per frontier decision. The user answers each in sequence inside the single gate.

### Cursor (`AskQuestion`)

```json
{
  "title": "Grilling — round 1",
  "questions": [
    {
      "id": "auth-strategy",
      "prompt": "How should unauthenticated users reach the dashboard?",
      "options": [
        { "id": "redirect-login", "label": "Redirect to login (Recommended)" },
        { "id": "public-readonly", "label": "Public read-only view — cached summary, no PII" },
        { "id": "block-404", "label": "Return 404 — hide that the dashboard exists" }
      ]
    },
    {
      "id": "session-store",
      "prompt": "Where should sessions live?",
      "options": [
        { "id": "redis", "label": "Redis — shared across app instances (Recommended)" },
        { "id": "cookie", "label": "Signed cookie — stateless; size limits apply" },
        { "id": "postgres", "label": "Postgres — reuse existing DB; heavier ops" }
      ]
    }
  ]
}
```

### T3 Code / Antigravity (`ask_question`)

```json
{
  "questions": [
    {
      "question": "How should unauthenticated users reach the dashboard?",
      "options": [
        "(Recommended) redirect-login: Redirect to login",
        "public-readonly: Public read-only view — cached summary, no PII",
        "block-404: Return 404 — hide that the dashboard exists"
      ],
      "is_multi_select": false
    },
    {
      "question": "Where should sessions live?",
      "options": [
        "(Recommended) redis: Redis — shared across app instances",
        "cookie: Signed cookie — stateless; size limits apply",
        "postgres: Postgres — reuse existing DB; heavier ops"
      ],
      "is_multi_select": false
    }
  ],
  "toolAction": "Conducting grilling round",
  "toolSummary": "Grilling round 1"
}
```

Record each answer by question `id` and option `id` before recomputing the frontier.

## Free-text answers

Both Cursor and T3 Code / Antigravity offer the user a built-in "Other" write-in escape hatch in the interactive modal, so a gate accepts a typed answer without any extra field. Map whatever they type back to an option `id` where it fits, or treat it as a new constraint where it does not.
