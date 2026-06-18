# Guardrails

Hard safety rules for AI-assisted changes in Satellite Server. These override convenience — when a task conflicts with a guardrail, stop and ask.

## Change scope

- Implement the **smallest change** that satisfies the task ([`skills/SKILL-SMALLEST-SAFE-CHANGE.md`](./skills/SKILL-SMALLEST-SAFE-CHANGE.md)).
- Do not refactor, rename, reformat, or reorder code outside the task scope.
- Do not fix unrelated lint warnings, typos, or "improvements" unless the task includes them.
- Do not introduce new dependencies without clear need and user awareness.
- Do not change public API response shapes or route paths unless the task requires it.
- Do not commit, push, or open PRs unless the user explicitly asks.

## Module boundaries

| Workspace | Owns | Must not contain |
|-----------|------|------------------|
| `apps/api` | HTTP routes, OMM validation, SGP4 propagation, position cache, Prisma access | React/UI code, client-side orbit math |
| `apps/frontend` | Routes, components, hooks, API client, Cesium viewer | SGP4 propagation, OMM validation, direct DB access |
| `packages/db` | Prisma schema, migrations, generate scripts | HTTP handlers, business logic, UI |

**Cross-boundary rules:**

- Propagation runs on the API via `satellite.js`; the frontend consumes REST positions only.
- OMM validation lives in `apps/api/src/validation/` — do not duplicate in the frontend.
- Database writes for OMM records go through `ommRecordStore.ts`, not ad hoc SQL.
- Do not add TanStack Start server API routes for satellite data — HTTP API stays in `apps/api`.

## Architecture

- Do not introduce new workspaces, microservices, or shared packages without explicit instruction.
- Do not move logic across module boundaries to "clean up" without explicit instruction.
- Prefer extending existing services (`SatelliteCatalog`, `propagationService`) over parallel implementations.
- Prefer existing patterns in the target file ([`skills/SKILL-PATTERN-LOOKUP.md`](./skills/SKILL-PATTERN-LOOKUP.md)).

## Data and API contracts

- OMM input accepts: single object, array, or `{ "satellites": [...] }` — preserve this unless the task changes ingestion.
- Each OMM record must include:
  - `NORAD_CAT_ID` (identifier)
  - `EPOCH` (ISO timestamp string)
  - Numeric SGP4 fields: `MEAN_MOTION`, `ECCENTRICITY`, `INCLINATION`, `RA_OF_ASC_NODE`, `ARG_OF_PERICENTER`, `MEAN_ANOMALY`, `BSTAR`, `MEAN_MOTION_DOT`, `MEAN_MOTION_DDOT` (see `apps/api/src/types.ts` `REQUIRED_NUMBER_FIELDS`)
- Position responses use `status: 'ok' | 'propagation_failed'` — handle both on the frontend.
- `POST /api/satellites/omms` returns **202 Accepted** with a message and current snapshot.
- Coordinates are in **kilometers** from the API; Cesium expects **meters** — convert at the UI boundary.

## Environment and secrets

- Do not commit `.env`, tokens, or credentials.
- `.env.example` may contain sample values; real secrets belong in local `.env` only.
- `VITE_*` variables are exposed to the browser — never put secrets there.

## Testing and validation

- Run applicable checks before calling work done ([`skills/SKILL-REPOSITORY-VALIDATION.md`](./skills/SKILL-REPOSITORY-VALIDATION.md)).
- Do not disable tests or loosen types to make CI pass without documenting why.
- API logic changes should include or update Vitest coverage when non-trivial.

## Documentation

- Do not rewrite unrelated documentation.
- Update docs when the task introduces new patterns, endpoints, or workflows.
- Keep [`README.md`](../README.md) accurate for setup and endpoints when those change.

## When to stop and ask

- Task requires breaking API changes or new dependencies.
- Module ownership is unclear.
- Task spans API + frontend + DB with ambiguous order of work.
- Validation fails and the fix would expand scope significantly.

## Related

- [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- [`DECISIONS.md`](./DECISIONS.md)
- [`WORKFLOW.md`](./WORKFLOW.md)
