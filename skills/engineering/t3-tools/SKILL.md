---
name: t3-tools
description: Use T3 Code's t3-code MCP tools for thread, project, worktree, delegation, preview, PR-linking, and scheduling work. Use when the user asks to delegate to a T3 child, list or read T3 threads or projects, link or watch a PR, or mentions T3 tools, orchestrator_capabilities, delegate_task, or t3-code.
disable-model-invocation: true
---

# T3 Code tools

T3 Code exposes its tools through the `t3-code` MCP server. A skill cannot start that server. These instructions only apply when `t3-code` tools appear in the tool catalog.

## Before you call anything

1. Check that `t3-code` tools are loaded. Use `GetDynamicTools` with `namespace: "t3-code"`. If the namespace is missing or empty, the server is not connected. Tell the user and stop. Do not try alternate routes.
2. Read `reference.md` in this folder for the exact tool names, required parameters, and descriptions.

## Common workflows

- **Delegation**: call `orchestrator_capabilities` once per thread, before the first `delegate_task`. Put model settings in `target.options`. Use `task_status` only to inspect; follow a running delegate's `next` instead of polling. Stop unneeded runs with `task_cancel`, not `t3_thread_interrupt`.
- **Thread lookup**: `t3_thread_list` to find threads, `t3_thread_read` before answering questions about a thread id, `t3_thread_search` for titles.
- **Projects and worktrees**: `t3_project_list` / `t3_project_read`, `t3_worktree_list` / `t3_worktree_status`.
- **PR linking**: after creating, taking over, or pushing to a PR, call `link_pull_request` (or `link_pull_requests` for several) with the full URL before ending the turn. Use `watch_pull_request` only when asked to monitor, and `unwatch_pull_request` before handback.
- **Secrets**: call `request_secret` yourself. Never ask for a secret in chat.
- **Scheduling**: `schedule_task` only schedules. It does not run the prompt.

## Rules

- Thread references in replies use the thread's `link`, verbatim. Never use a bare title or id.
- Do not start subagents or child threads unless the user asked for delegation.
- `preview_*` tools are for browser work the user requested, not for checking your own edits.
- Full parameter lists and descriptions: see [reference.md](reference.md).
