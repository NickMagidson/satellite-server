# Agent Instructions

This file exists as a compatibility fallback for tools that support `AGENTS.md`.

Primary repository instructions are still defined in:

- `.github/copilot-instructions.md`
- `docs/COPILOT-OPERATING-RULES.md`

## Required Order

1. Read the assigned GitHub issue and Azure metadata.
2. Read `.github/copilot-instructions.md`.
3. Read `docs/COPILOT-OPERATING-RULES.md`.
4. Classify with `docs/TASK-CLASSIFICATION.md`.
5. Load only required skills from `docs/SKILLS.md`.
6. Follow `docs/GUARDRAILS.md`.

## Delivery Rules

- Use `AB#{TaskId} AB#{UserStoryId}` in issue and PR descriptions.
- Use branch names `copilot/{UserStoryId}` or `copilot/{UserStoryId}.{iteration}`.
- Use commit format `AB#{TaskId} AB#{UserStoryId} - <summary>`.
- Initialize and maintain the report bundle at `.github/reports/Task-{TaskId}/`:
  - `REPORT.md`
  - `SUMMARY.md`
  - `CHANGE_PROPOSAL.md`
  - `INSTRUCTIONS.md`
- Keep Copilot-created PRs in draft until human handoff.
