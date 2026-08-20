# Design Decisions

Intentional choices in this repository. Do not change these patterns unless the task explicitly requires it.

## Task workflow

| Decision | Choice |
|----------|--------|
| Work entry | GitHub issue **or** direct Copilot/Cursor prompt |
| Issue tracker | GitHub Issues (no Azure DevOps) |
| AI doc system | Layered docs under `docs/` + `.github/copilot-instructions.md` |

## Stack

| Area | Choice | Notes |
|------|--------|-------|
| Monorepo | npm workspaces | `apps/*`, `packages/*` |
| API | Express 5 + TypeScript (ESM) | Dev: `tsx watch`; prod: `tsc` → `node dist` |
| Propagation | `satellite.js` (SGP4) | API for REST positions; frontend worker for globe motion |
| Orbital input | OMM JSON (CCSDS-style fields) | Not raw TLE strings in the API |
| Database | PostgreSQL + Prisma 7 | `packages/db`; API owns access |
| Frontend | TanStack Start + React 19 | File-based routing |
| Routing | TanStack Router | Routes in `src/routes/` |
| Server state | TanStack Query | Catalog/elements bootstrap; globe motion via worker buffers |
| Styling | Tailwind CSS 4 | Via `@tailwindcss/vite` |
| Globe | Cesium | Script-tag load + Vite asset plugin |
| Dev orchestration | `concurrently` (host), Docker Compose dev (container) | `make dev` for Vite dev stack; `docker compose up` for production stack |
| Frontend prod server | `srvx` (via TanStack Start) | `npm run start` after `npm run build` |

## Propagation and coordinates

| Decision | Rationale |
|----------|-----------|
| Hybrid propagation | API validates OMM and serves elements + REST positions; globe worker runs SGP4 for smooth rendering |
| OMM over TLE in API | Structured JSON matches CelesTrak/Space-Track modern exports; easier validation |
| Position cache at 1s default | `UPDATE_INTERVAL_MS` env; catalog refreshes on interval (REST consumers) |
| Globe motion buffers | Ping-pong `Float32Array` ECI state + main-thread velocity extrapolation; no SharedArrayBuffer/COOP/COEP in v1 |
| Tiered SGP4 in worker | Selected every frame; in-FOV ~1s; off-screen 2–4s; below horizon ~4s |
| `ecf` for Cesium points | Main thread converts extrapolated ECI → ECF meters each `preRender` |
| km in API/worker ECI, meters in Cesium | Multiply by 1000 at the Cesium boundary |

## Data loading

| Decision | Behavior |
|----------|----------|
| Startup source priority | Postgres `omm_records` if non-empty → else seed from `OMM_FILE` into DB if `DATABASE_URL` set → else read `OMM_FILE` only |
| Runtime OMM replace | `POST /api/satellites/omms` updates catalog and persists when DB configured |
| Sample data | `apps/api/data/omm.sample.json` |

## API design

| Decision | Choice |
|----------|--------|
| Error type | `HttpError` / `ValidationError` with optional `details` |
| Validation | Centralized in `ommValidation.ts` before catalog ingest |
| JSON body limit | 5 MB (`express.json`) |
| CORS | `CORS_ORIGIN` env (default `http://localhost:5173`) |

## Frontend design

| Decision | Choice |
|----------|--------|
| API types | Duplicated in `satelliteApi.ts` / `satelliteMotion/types.ts` (not shared package yet) |
| **Cesium integration** | Dynamic script load + minimal `Window.Cesium` interface in `CesiumViewer.tsx` — not a full `import 'cesium'` bundle |
| **Globe motion** | `useSatelliteMotionWorker` + `satelliteMotion.worker.ts`; frame updates in `scene.preRender` |
| **Data fetching** | **TanStack Query hooks** for catalog/elements — not TanStack Router route `loader`s |
| **Backend API** | **Express on `:3000`** — not TanStack Start server API routes under `src/routes/api/` |
| Cesium load | Dynamic script + minimal `Window.Cesium` typing — avoids bundling entire Cesium into main chunk |
| Theme | `localStorage` + `prefers-color-scheme`; `light` / `dark` / `auto` |
| REST position polling | `useSatellitePositions` remains for non-globe consumers; globe does not use it |

## Infrastructure

| Decision | Choice |
|----------|--------|
| Compose project name | `satellite-server` (via Makefile) |
| Migrate on compose up | `migrate` service runs `db:migrate:deploy` before API starts |
| Prisma Studio | Port `5555`; `make studio` |

## Explicit non-goals (for now)

- Shared TypeScript types package between API and frontend
- Authentication / authorization
- SharedArrayBuffer / COOP/COEP for motion buffers (ping-pong transferables in v1)
- TanStack Router **loaders** for satellite API data (use Query hooks instead)
- TanStack Start **server API routes** for satellite endpoints (Express owns the API)
- pnpm or Turborepo
- Production frontend in Docker compose (dev compose serves Vite)

## Related

- [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- [`STYLES.md`](./STYLES.md)
- [`skills/SKILL-SATELLITE-PROPAGATION-BASICS.md`](./skills/SKILL-SATELLITE-PROPAGATION-BASICS.md)
