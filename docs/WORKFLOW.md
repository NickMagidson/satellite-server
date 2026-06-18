# Workflow

Lifecycle for completing a task in Satellite Server. Applies equally to **GitHub issues** and **direct prompts**.

## Overview

```text
Read task
    ↓
Classify (TASK-CLASSIFICATION)
    ↓
Load skills (SKILLS)
    ↓
Guardrails + architecture (when needed)
    ↓
Implement (smallest safe change)
    ↓
Validate
    ↓
PR (when asked)
    ↓
Doc review
```

## Steps

### 1. Read the task

- **Issue:** title, description, acceptance criteria, linked context.
- **Prompt:** treat the message as requirements; ask only when ambiguous or risky to assume.

Do not start coding until you know what "done" means.

### 2. Classify

Use [`TASK-CLASSIFICATION.md`](./TASK-CLASSIFICATION.md) to pick one primary category and note any secondary workspaces (API + frontend, etc.).

### 3. Load skills

From [`SKILLS.md`](./SKILLS.md):

1. Always: smallest safe change, pattern lookup.
2. Category skills (testing, linting, domain skills).
3. Before sign-off: repository validation.
4. If PR requested: pull request preparation.

Do not load architecture docs unless boundaries or placement are unclear.

### 4. Consult constraints (when needed)

| Document | When |
|----------|------|
| [`GUARDRAILS.md`](./GUARDRAILS.md) | Before any code change |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Unsure where code belongs |
| [`DECISIONS.md`](./DECISIONS.md) | Tempted to change an intentional pattern |
| [`STYLES.md`](./STYLES.md) | Writing new files or components |

### 5. Implement

- Work in the correct workspace first (usually API/DB before frontend).
- Follow [`skills/SKILL-SMALLEST-SAFE-CHANGE.md`](./skills/SKILL-SMALLEST-SAFE-CHANGE.md).
- Match patterns from [`skills/SKILL-PATTERN-LOOKUP.md`](./skills/SKILL-PATTERN-LOOKUP.md).

### 6. Validate

Run checks from [`skills/SKILL-REPOSITORY-VALIDATION.md`](./skills/SKILL-REPOSITORY-VALIDATION.md):

| If you changed… | Minimum |
|-----------------|---------|
| `apps/api/` | `npm run test`, `npm run typecheck`, `npm run build` |
| `apps/frontend/` | `npm --workspace apps/frontend run lint`, `npm --workspace apps/frontend run build` |
| `packages/db/` | `npm run db:generate`; migrate in dev if schema changed |
| User-visible behavior | Manual smoke: `npm run dev` or `make dev` |

### 7. Pull request (when asked)

Follow [`skills/SKILL-PULL-REQUEST-PREPARATION.md`](./skills/SKILL-PULL-REQUEST-PREPARATION.md) and [`workflow/WORKFLOW-PRS.md`](./workflow/WORKFLOW-PRS.md).

Only commit or push when the user explicitly requests it.

### 8. Documentation review

After the task, check whether any of these need updates:

- New endpoint or env var → [`README.md`](../README.md)
- New pattern or boundary → [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`DECISIONS.md`](./DECISIONS.md)
- New repeatable procedure → new skill under `docs/skills/` + [`SKILLS.md`](./SKILLS.md)
- Task category gap → [`TASK-CLASSIFICATION.md`](./TASK-CLASSIFICATION.md)

Skip doc updates for trivial bug fixes that don't change patterns.

## Quick command reference

```sh
npm run dev              # API :3000 + frontend :5173 (host)
make dev                 # Docker full stack (API + frontend + Postgres)
docker compose up -d --build   # API + Postgres only (no frontend)
```

Validation:

```sh
npm run test             # API tests
npm run typecheck        # API types
npm run build            # API compile
npm --workspace apps/frontend run lint
npm --workspace apps/frontend run build
```

## Related

- [`.github/copilot-instructions.md`](../.github/copilot-instructions.md) — AI entry point
- [`COPILOT-OPERATING-RULES.md`](./COPILOT-OPERATING-RULES.md) — operating rules
- [`AGENTS.md`](../AGENTS.md) — compatibility fallback
