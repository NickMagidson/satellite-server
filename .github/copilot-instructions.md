# Copilot Instructions

AI entry point for **Satellite Server** — a monorepo with an Express propagation API (`apps/api`), TanStack Start frontend (`apps/frontend`), and Prisma DB package (`packages/db`).

Stay short: route into `docs/` for procedures. Do not improvise patterns.

## Task entry

Work starts from a **GitHub issue** or a **direct prompt**. In both cases:

1. Understand what "done" means before editing code.
2. Ask only when requirements are ambiguous or unsafe to guess.

## Workflow

```text
Task → classify → load skills → guardrails → implement → validate → PR (if asked)
```

| Step | Document |
|------|----------|
| Classify the task | [`docs/TASK-CLASSIFICATION.md`](../docs/TASK-CLASSIFICATION.md) |
| Load procedural skills | [`docs/SKILLS.md`](../docs/SKILLS.md) |
| Hard safety rules | [`docs/GUARDRAILS.md`](../docs/GUARDRAILS.md) |
| Operating rules | [`docs/COPILOT-OPERATING-RULES.md`](../docs/COPILOT-OPERATING-RULES.md) |
| Full lifecycle | [`docs/WORKFLOW.md`](../docs/WORKFLOW.md) |
| Pull requests | [`docs/workflow/WORKFLOW-PRS.md`](../docs/workflow/WORKFLOW-PRS.md) |

Load [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md), [`docs/DECISIONS.md`](../docs/DECISIONS.md), and [`docs/STYLES.md`](../docs/STYLES.md) only when placement, patterns, or conventions are unclear.

## Non-negotiables

- **Smallest safe change** — no drive-by refactors ([`docs/skills/SKILL-SMALLEST-SAFE-CHANGE.md`](../docs/skills/SKILL-SMALLEST-SAFE-CHANGE.md)).
- **Pattern first** — match existing code before adding new abstractions ([`docs/skills/SKILL-PATTERN-LOOKUP.md`](../docs/skills/SKILL-PATTERN-LOOKUP.md)).
- **Server propagates, client displays** — SGP4 and OMM validation stay in `apps/api`; frontend consumes REST positions.
- **Validate before done** — run applicable checks ([`docs/skills/SKILL-REPOSITORY-VALIDATION.md`](../docs/skills/SKILL-REPOSITORY-VALIDATION.md)).
- **No git actions unless asked** — do not commit, push, or open PRs without explicit user request.

## Quick validation

| Changed | Run |
|---------|-----|
| `apps/api/` | `npm run test` · `npm run typecheck` · `npm run build` |
| `apps/frontend/` | `npm --workspace apps/frontend run lint` · `npm --workspace apps/frontend run build` |
| `packages/db/` | `npm run db:generate` (+ migrate in dev) |

## Repo map

```text
apps/api/src/routes/      HTTP endpoints
apps/api/src/services/    catalog, propagation, OMM load/store
apps/frontend/src/routes/ TanStack Router pages
apps/frontend/src/components/  UI + CesiumViewer
packages/db/prisma/       schema + migrations
```

Setup and endpoints: [`README.md`](../README.md). Full doc index: [`docs/README.md`](../docs/README.md).

## Compatibility

Tools that read `AGENTS.md` instead of this file: see [`AGENTS.md`](../AGENTS.md).
