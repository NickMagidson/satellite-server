# Architecture

Structure of the Satellite Server monorepo and how data flows through it.

## Overview

```text
satellite-server-monorepo/
├── apps/
│   ├── api/           Express 5 API — OMM ingest, SGP4, position cache
│   └── frontend/      TanStack Start + React — table UI, Cesium globe
├── packages/
│   └── db/            Prisma schema + migrations (Postgres)
├── docker-compose.yml         Production-oriented compose (api + postgres)
├── docker-compose.dev.yml     Dev overrides (hot reload, frontend)
├── Dockerfile
└── Makefile                   Docker dev workflow shortcuts
```

npm workspaces: `apps/*`, `packages/*`. Package manager is **npm** (not pnpm).

## Workspaces

### `apps/api`

Express HTTP server. Entry: `src/server.ts` → `createApp()` in `src/app.ts`.

| Directory | Responsibility |
|-----------|----------------|
| `src/routes/` | Express routers (`satellites.routes.ts`) |
| `src/services/` | `SatelliteCatalog`, propagation, OMM load/store |
| `src/validation/` | OMM parse and normalize (`ommValidation.ts`) |
| `src/utils/` | Time parsing, JSON file read |
| `src/test/` | `createTestApp`, fixtures for route tests |
| `data/` | Sample OMM JSON (`omm.sample.json`) |

**Startup sequence:**

1. Create `SatelliteCatalog` with `updateIntervalMs` from config.
2. `loadInitialOmms()` — load from Postgres if rows exist; else seed from `OMM_FILE` or read file directly.
3. Catalog starts interval timer; propagates all satellites each tick.
4. Express listens on `PORT` (default `3000`).

**Dev server:** `npm run dev` uses `tsx watch src/server.ts` (TypeScript direct, no compile step).

**Config** (`src/config.ts`): `PORT`, `OMM_FILE`, `UPDATE_INTERVAL_MS`, `DATABASE_URL`.

### `apps/frontend`

TanStack Start + React 19 + Vite + Tailwind 4 + Cesium.

| Directory | Responsibility |
|-----------|----------------|
| `src/routes/` | File-based TanStack Router (`/`, `/about`, `/globe`) |
| `src/components/` | Header, Footer, CesiumViewer, ThemeToggle |
| `src/hooks/` | `useSatellitePositions` (TanStack Query) |
| `src/lib/` | `satelliteApi.ts` — fetch wrapper + types |
| `vite.config.ts` | TanStack Start, Tailwind, Cesium asset plugin |

**Data fetching:** TanStack Query in hooks; `refetchInterval` follows API `updateIntervalMs`.

**API base URL:** `import.meta.env.VITE_API_URL` (default `http://localhost:3000`).

**Cesium:** `cesium` is a dependency of `apps/frontend` but assets are served from hoisted `node_modules/cesium/Build/Cesium` at the repo root (workspace install). The viewer loads **`/cesium/Cesium.js` via dynamic script tag** (see `CesiumViewer.tsx`), not a static `import 'cesium'`. Vite plugin `cesiumAssetsPlugin` serves assets in dev and copies them on build. Ion token via `VITE_CESIUM_ION_ACCESS_TOKEN`.

### `packages/db`

Prisma + PostgreSQL. Single model: `OmmRecord` → table `omm_records`.

- Schema: `prisma/schema.prisma`
- Config: `prisma.config.ts` (datasource URL from `DATABASE_URL`)
- Migrations: `prisma/migrations/`
- Scripts: `prisma:generate`, `prisma:migrate`, `prisma:migrate:deploy`, `prisma:studio`

Consumed by the API through `@prisma/client` in `ommRecordStore.ts`. No build step.

## Data flow

```text
                    ┌─────────────────┐
  OMM JSON file ───►│  initialOmmLoader │
  Postgres rows ───►│  ommRecordStore   │
                    └────────┬────────┘
                             │ validateAndNormalizeOmms
                             ▼
                    ┌─────────────────┐
                    │ SatelliteCatalog │◄── POST /api/satellites/omms
                    │  (satellite.js)  │
                    └────────┬────────┘
                             │ propagate each tick (UPDATE_INTERVAL_MS)
                             ▼
                    ┌─────────────────┐
                    │  REST positions  │
                    │  /api/satellites │
                    └────────┬────────┘
                             │ fetch (TanStack Query)
                             ▼
                    ┌─────────────────┐
                    │    frontend      │
                    │  table / Cesium  │
                    └─────────────────┘
```

## HTTP API

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/health` | Liveness + satellite count |
| `GET` | `/api/satellites` | Satellite metadata |
| `GET` | `/api/satellites/positions` | Cached live positions |
| `GET` | `/api/satellites/positions?at=<ISO>` | Propagate all at timestamp |
| `GET` | `/api/satellites/:id/position` | Single `SatellitePosition` object (live cache) |
| `GET` | `/api/satellites/:id/position?at=<ISO>` | Single position propagated at timestamp |
| `POST` | `/api/satellites/omms` | Replace active OMM set (**202 Accepted** + snapshot) |

**Route ordering:** `/positions` is registered before `/:id/position` so `positions` is not captured as an id.

Errors: `HttpError` / `ValidationError` → JSON `{ error, details? }` with appropriate status (400 validation, 404 not found, 500 default).

## Environment variables

| Variable | Default | Used by |
|----------|---------|---------|
| `PORT` | `3000` | API listen port |
| `OMM_FILE` | `apps/api/data/omm.sample.json` | Starter OMM JSON path |
| `UPDATE_INTERVAL_MS` | `1000` | Position cache refresh interval |
| `DATABASE_URL` | unset (optional) | Prisma / Postgres; enables persistence |
| `VITE_API_URL` | `http://localhost:3000` | Frontend → API base URL |
| `VITE_CESIUM_ION_ACCESS_TOKEN` | unset | Cesium Ion imagery/terrain |
| `FRONTEND_PORT` | `5173` | Docker dev frontend port |
| `PRISMA_STUDIO_PORT` | `5555` | Prisma Studio (via `make studio`) |

## Position response shape

Successful entries include:

- `geodetic` — lat/lon/alt (km)
- `ecf` — Earth-fixed Cartesian (km); preferred for Cesium (convert to meters)
- `eci` — inertial position (km)
- `velocityEci` — inertial velocity (km/s); may be `null`

Failed propagation uses `status: 'propagation_failed'`. Full JSON examples: [`README.md`](../README.md).

## Docker / Make

| Target | Purpose |
|--------|---------|
| `make dev` | Build dev images, start stack, follow logs |
| `make dev-image` | Build `migrate`, `api`, `frontend` images |
| `make up` / `down` / `logs` | Control dev compose stack |
| `make exec` | Shell in API container |
| `make psql` | Postgres CLI |
| `make studio` | Prisma Studio on `:5555` |

Compose project name: `satellite-server` (see `Makefile`).

## Runtime environments

| Mode | Command | API | Frontend | Postgres |
|------|---------|-----|----------|----------|
| Host dev | `npm run dev` | `:3000` | `:5173` | optional (`DATABASE_URL`) |
| Docker dev | `make dev` | `:3000` | `:5173` | compose service |
| Compose (API + DB) | `docker compose up -d --build` | `:3000` | — | compose service |
| API only | `npm --workspace apps/api start` | `:3000` | — | optional |

CORS allows `http://localhost:5173` on the API.

## Testing architecture

- **API:** Vitest + Supertest; in-memory app via `createTestApp()` — no live server port required for route tests.
- **Frontend:** Vitest + Testing Library configured; limited coverage today.

## Related

- [`README.md`](../README.md) — setup, endpoints, examples
- [`DECISIONS.md`](./DECISIONS.md) — why these choices
- [`GUARDRAILS.md`](./GUARDRAILS.md) — boundaries AI must respect
