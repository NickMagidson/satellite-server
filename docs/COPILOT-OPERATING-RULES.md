# Copilot Operating Rules

Repository-specific rules for AI-assisted development in Satellite Server.

## Task sources

Work may begin from either:

1. **GitHub issue** — read the full issue before coding.
2. **Direct prompt** — the user's message is the specification.

Both follow the same documentation workflow ([`WORKFLOW.md`](./WORKFLOW.md)).

## Required reading order

1. Task (issue or prompt)
2. [`.github/copilot-instructions.md`](../.github/copilot-instructions.md)
3. This file
4. [`TASK-CLASSIFICATION.md`](./TASK-CLASSIFICATION.md)
5. Required skills from [`SKILLS.md`](./SKILLS.md)
6. [`GUARDRAILS.md`](./GUARDRAILS.md)

Load [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`DECISIONS.md`](./DECISIONS.md), and [`STYLES.md`](./STYLES.md) only when needed.

## Core principles

- **Smallest safe change** — satisfy the task, nothing more.
- **Pattern first** — find how the repo already does it before inventing.
- **Correct workspace** — API for propagation, frontend for UI, `packages/db` for schema.
- **Validate before done** — run applicable test/lint/build commands.
- **Ask when blocked** — scope creep, breaking changes, or unclear ownership.

## Implementation rules

- Do not commit, push, or open PRs unless the user asks.
- Do not add dependencies without clear need.
- Do not refactor unrelated code.
- Do not duplicate SGP4 or OMM validation on the frontend.
- Do not commit secrets or `.env` files.

## Delivery rules

| Context | Branch naming | PR |
|---------|---------------|-----|
| GitHub issue `#N` | `issue-N` or `feat/issue-N-short-desc` | Include `Closes #N` |
| Prompt only | Descriptive slug, e.g. `feat/globe-labels` | No issue link required |

- Commit messages: plain language, state **why**.
- PR body: summary + test plan with commands actually run.
- Draft PRs when human review is expected before merge.

## Validation minimums

| Changed workspace | Before PR |
|-------------------|-----------|
| `apps/api/` | `npm run test`, `npm run typecheck`, `npm run build` |
| `apps/frontend/` | `npm --workspace apps/frontend run lint`, `npm --workspace apps/frontend run build` |
| `packages/db/` | `npm run db:generate`; migrate in dev |

See [`skills/SKILL-REPOSITORY-VALIDATION.md`](./skills/SKILL-REPOSITORY-VALIDATION.md) for detail.

## Documentation maintenance

Update docs when the task changes patterns, endpoints, or workflows. See step 8 in [`WORKFLOW.md`](./WORKFLOW.md).

## Related

- [`AGENTS.md`](../AGENTS.md) — fallback for tools that read `AGENTS.md` only
- [`workflow/WORKFLOW-PRS.md`](./workflow/WORKFLOW-PRS.md) — PR specifics
