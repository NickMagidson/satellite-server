# Pull Request Workflow

How to prepare pull requests for Satellite Server (from a GitHub issue or a completed prompt task).

## When to open a PR

- When the user explicitly asks for a PR or merge-ready branch.
- When the task is complete and validation has passed.

## Branch naming

| Context | Pattern | Example |
|---------|---------|---------|
| GitHub issue | `issue-{number}` or `feat/issue-{number}-short-desc` | `issue-42`, `feat/issue-42-cesium-camera` |
| Prompt only | descriptive slug | `feat/globe-default-view` |

## Commits

- Plain language summarizing **why**, not just what changed.
- One logical change per commit when possible.

## PR description

Include:

- **Summary** — what changed and why (1–3 bullets).
- **Test plan** — commands run and manual checks performed.
- **Issue link** — `Closes #42` when applicable; omit for prompt-only work.

## Validation evidence

Document which checks were run, for example:

- `npm run test`
- `npm run typecheck`
- `npm --workspace apps/frontend run lint`
- `npm --workspace apps/frontend run build`

## Draft PRs

- Keep agent-created PRs in draft until a human reviews, when that workflow applies.

## Related

- [`WORKFLOW.md`](../WORKFLOW.md) — full task lifecycle
- [`skills/SKILL-PULL-REQUEST-PREPARATION.md`](../skills/SKILL-PULL-REQUEST-PREPARATION.md) — PR procedure
- [`skills/SKILL-REPOSITORY-VALIDATION.md`](../skills/SKILL-REPOSITORY-VALIDATION.md) — validation matrix
