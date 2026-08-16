# Payload examples

Universal `<decision_prompt>` shapes and platform adapter mapping.

## Schema selection

```json
{
  "type": "button_group",
  "question": "Which OpenSpec schema should we install?",
  "options": [
    { "id": "superpowers-bridge", "label": "superpowers-bridge (Recommended)", "detail": "OpenSpec + Superpowers orchestration" },
    { "id": "minimalist", "label": "minimalist", "detail": "Fast spec-to-tasks path" },
    { "id": "behaviour-driven", "label": "behaviour-driven", "detail": "Gherkin-style specs" }
  ],
  "allow_custom_input": true,
  "recommended": "superpowers-bridge"
}
```

## Permission confirm

```json
{
  "type": "confirm_dialog",
  "question": "Install recommended behavioral skills for this schema?",
  "options": [
    { "id": "yes", "label": "Yes, install (Recommended)" },
    { "id": "skip", "label": "Skip — I will install manually" }
  ],
  "allow_custom_input": false,
  "recommended": "yes"
}
```

## Multi-select domains

```json
{
  "type": "multi_select",
  "question": "Confirm the domain specs to create (select all that apply):",
  "options": [
    { "id": "billing", "label": "billing", "detail": "Payments and subscriptions" },
    { "id": "identity", "label": "identity", "detail": "Auth and users" },
    { "id": "catalog", "label": "catalog", "detail": "Products and inventory" }
  ],
  "allow_custom_input": true,
  "recommended": null
}
```

## Adapter mapping

| Universal field | Cursor `AskQuestion` | Generic decision tool |
| --- | --- | --- |
| `question` | `prompt` | `prompt_text` |
| `options[].id` | option `id` | `options[].value` |
| `options[].label` | option `label` | `options[].label` |
| `options[].detail` | (append to label or omit) | `options[].description` |
| `multi_select` type | `allow_multiple: true` | `input_type: "select"` + multi flag |
| `confirm_dialog` type | two-option `AskQuestion` | `input_type: "confirm_dialog"` |
| `allow_custom_input` | built-in "Other" (always available) | `allow_custom_input` param |

After the user responds, map their selection back to `id` before continuing.
