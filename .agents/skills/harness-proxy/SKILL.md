---
name: harness-proxy
description: Delegate sub-tasks across AI coding agent harnesses inside isolated Git worktrees.
argument-hint: "run [--agent <name>] '<prompt>'"
disable-model-invocation: true
---

# harness-proxy

Delegate tasks to isolated agent harnesses. The CLI binary autonomously handles task complexity classification, quota balancing, model selection, git worktree sandboxing, tier failover, and auto-merging.

## Instructions for Agent

You have **one single action**: invoke `harness-proxy run`.

### 1. Subagent Selection (Optional)
Check `.agents/agents/*.md` (or `.claude/agents/*.md`). Read each file's frontmatter `description`:
- If an agent's specialization fits the task domain (e.g., auditing/optimization, architecture, testing, review), pass `--agent <name>`.
- If none match, omit `--agent`.

### 2. Execution
Run the task directly:
```bash
# General task
harness-proxy run "<task description with clear acceptance criteria>"

# Specialized task
harness-proxy run --agent codebase-advisor "<task description with clear acceptance criteria>"
```

### 3. Rules
- **NEVER** run `quota`, `models`, `tiers`, or inspect config files before running a task. All routing and quota balancing is handled automatically inside `harness-proxy run`.
- **Do not** manually create worktrees or switch branches; the binary manages sandboxing and merging automatically.
