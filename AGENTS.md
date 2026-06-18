# Agent Instructions

This file exists as a compatibility fallback for tools that support `AGENTS.md`.

Primary repository instructions are still defined in:

- `.github/copilot-instructions.md`
- `docs/COPILOT-OPERATING-RULES.md`

## Task Entry Points

Work may start from either:

1. **A GitHub issue** — read the issue title, description, and acceptance criteria first.
2. **A direct prompt** — treat the user's message as the task; ask clarifying questions only when requirements are ambiguous or unsafe to guess.

In both cases, follow the same documentation workflow below.

## Required Order

1. Read the task (issue or user prompt).
2. Read `.github/copilot-instructions.md`.
3. Read `docs/COPILOT-OPERATING-RULES.md`.
4. Classify with `docs/TASK-CLASSIFICATION.md`.
5. Load only required skills from `docs/SKILLS.md`.
6. Follow `docs/GUARDRAILS.md`.

## Delivery Rules

- Reference the GitHub issue number in branch names, commits, and PR descriptions when an issue exists (e.g. `issue-42`, `AB#42` is not used).
- For prompt-only work with no issue, use descriptive branch names (e.g. `feat/cesium-camera-defaults`).
- Use commit messages that state the purpose of the change in plain language.
- Run relevant validation before opening a PR (see `docs/skills/` and `docs/WORKFLOW.md`).
- Keep agent-created PRs in draft until human review when the workflow calls for it.
