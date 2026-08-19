# Question tool payloads

Call shapes for the host's question tool. Cursor `AskQuestion` is the reference host — every example below is a literal argument object for it. Other hosts take the same content through [Adapter mapping](#adapter-mapping).

Cursor options carry `id` and `label` only. Anything explanatory rides inside the `label`, since an unknown property can be rejected and cost you the gate.

## Single choice

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

## Confirm

Two options, recommended first.

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

## Multi-select

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

## Multi-question round

One gate per grilling round — one `questions` entry per frontier decision. The user answers each in sequence inside the single gate.

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

Record each answer by question `id` and option `id` before recomputing the frontier.

## Adapter mapping

| Need | Cursor `AskQuestion` | Generic decision tool |
| --- | --- | --- |
| The question | `questions[].prompt` | `prompt_text` |
| Option value | `options[].id` | `options[].value` |
| Option display | `options[].label` | `options[].label` |
| Explanatory detail | fold into `label` | `options[].description` |
| Several answers | `allow_multiple: true` | `input_type: "select"` + multi flag |
| Confirm | two-option question | `input_type: "confirm_dialog"` |
| Free-text answer | built-in "Other" (always available) | `allow_custom_input` param |
| Round of questions | `questions` array | repeat gate or host-specific batch API |

After the user responds, map their selection back to `id` before continuing.
