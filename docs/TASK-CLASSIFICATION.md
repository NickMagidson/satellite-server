# Task Classification

Use this document to determine what kind of task you are solving before loading skills or architecture docs.

Work may start from a **GitHub issue** or a **direct prompt** — classification steps are the same.

## How to classify

1. Read the task (issue or user prompt).
2. Identify the **primary** area of change (one category).
3. Load skills in this order:
   - Always: smallest safe change, pattern lookup
   - Category skills (below)
   - Before done/PR: repository validation (+ linting, testing, build as applicable)
   - When opening a PR: pull request preparation

## Categories

| Category | Typical locations | Skills to load |
|----------|-------------------|----------------|
| API change | `apps/api/src/routes/`, `services/`, `validation/` | Core + [Testing](./skills/SKILL-TESTING.md), [Build](./skills/SKILL-BUILD.md) |
| Data model change | `packages/db/prisma/` | Core + [Build](./skills/SKILL-BUILD.md) (`db:generate`, migrate); [Testing](./skills/SKILL-TESTING.md) if API store logic changes |
| Frontend UI change | `apps/frontend/src/components/`, shared layout | Core + [Linting](./skills/SKILL-LINTING.md), [Build](./skills/SKILL-BUILD.md) |
| Routing change | `apps/frontend/src/routes/` | Core + [Linting](./skills/SKILL-LINTING.md), [Build](./skills/SKILL-BUILD.md) |
| Data fetching (frontend) | `hooks/`, `lib/`, route loaders | Core + [Pattern lookup](./skills/SKILL-PATTERN-LOOKUP.md), [Linting](./skills/SKILL-LINTING.md), [Build](./skills/SKILL-BUILD.md) |
| Cesium / globe change | `CesiumViewer.tsx`, `routes/globe.tsx` | Core + [Cesium viewer](./skills/SKILL-CESIUM-VIEWER-CHANGE.md), [Linting](./skills/SKILL-LINTING.md), [Build](./skills/SKILL-BUILD.md) |
| Satellite propagation / domain | `apps/api/src/services/` (propagation, catalog, OMM) | Core + [Propagation basics](./skills/SKILL-SATELLITE-PROPAGATION-BASICS.md), [Testing](./skills/SKILL-TESTING.md), [Build](./skills/SKILL-BUILD.md) |
| Docker / infra change | `docker-compose*.yml`, `Makefile`, `Dockerfile` | Core + [Repository validation](./skills/SKILL-REPOSITORY-VALIDATION.md); smoke-test with `make dev` when behavior changes |
| Repository tooling | root `package.json`, lint/CI config | Core + applicable validation skills for touched workspaces |
| Documentation only | `docs/`, `README.md` | [Smallest safe change](./skills/SKILL-SMALLEST-SAFE-CHANGE.md) only |

## Cross-cutting tasks

If a task spans multiple categories (e.g. new API endpoint + frontend consumer):

1. Classify by the **data owner** first (usually API or DB).
2. Implement API/DB before frontend.
3. Load skills for each workspace you touch.

## When unsure

- Prefer the category that matches the **smallest boundary** containing the change.
- Read [`GUARDRAILS.md`](./GUARDRAILS.md) before architectural decisions.
- Read [`ARCHITECTURE.md`](./ARCHITECTURE.md) when module ownership is unclear.

## Related

- [`SKILLS.md`](./SKILLS.md) — full skill index
- [`WORKFLOW.md`](./WORKFLOW.md) — task lifecycle
