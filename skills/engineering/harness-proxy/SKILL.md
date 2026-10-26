---
name: harness-proxy
description: Delegate sub-tasks to isolated AI coding agent harnesses in a single command.
argument-hint: "[--agent <name>] '<prompt>'"
disable-model-invocation: true
---

# harness-proxy

Delegate tasks directly to isolated agent harnesses. The `harness-proxy` CLI autonomously manages git worktrees, quota balancing, task classification, model selection, live progress streaming, tier failover, and auto-merging.

## Execution

Execute `harness-proxy run` immediately as your single, direct action:

```bash
harness-proxy run [--agent <name>] "<task description with clear acceptance criteria>"
```

### Directives

- **Immediate dispatch**: Run `harness-proxy run` as your first and only action. All preparatory work (worktree management, quota checking, subagent resolution, routing) is handled internally by the binary.
- **Subagent selection**: Pass `--agent <name>` when targeting a known specialized agent (e.g., `--agent codebase-advisor`); otherwise omit `--agent`.
- **User reporting**: Relay the CLI's results and configuration details (harness, model, tier) directly from the command output.
