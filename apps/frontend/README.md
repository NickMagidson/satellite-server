# Satellite Server Frontend

TanStack Start + React app with a full-screen Cesium globe for live satellite positions.

## Quick start

From the **repo root** (npm workspaces):

```sh
npm install
npm run dev          # API :3000 + frontend :5173
```

Frontend only (API must already be running on `:3000`):

```sh
npm --workspace apps/frontend run dev
```

## Scripts

Run from repo root with `--workspace apps/frontend`:

| Script | Purpose |
|--------|---------|
| `dev` | Vite dev server (`:5173`) |
| `build` | Production bundle |
| `lint` | ESLint |
| `format` | Prettier write + ESLint fix |
| `check` | Prettier check |
| `test` | Vitest |

## Key paths

```txt
src/routes/       File-based TanStack Router (/)
src/components/   CesiumViewer, SearchInput, SatelliteDetailPanel, …
src/hooks/        useSatellitePositions, useSatellites, useSatelliteSearch
src/lib/          satelliteApi.ts, cesiumCamera.ts
```

## Data fetching

This app uses **TanStack Query hooks** to fetch satellite metadata from
`GET /api/satellites` and globe propagation elements from
`GET /api/satellites/elements`. The Cesium globe runs SGP4 in a web worker and
does not poll `GET /api/satellites/positions` for animation.

Configure the API URL with `VITE_API_URL` (default `http://localhost:3000`).
Enable browser console profiling for large catalogs with
`VITE_SATELLITE_PERF_LOGS=true`.

## Documentation

- Root setup and API: [`../../README.md`](../../README.md)
- Architecture and conventions: [`../../docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md), [`../../docs/STYLES.md`](../../docs/STYLES.md)
- Cesium changes: [`../../docs/skills/SKILL-CESIUM-VIEWER-CHANGE.md`](../../docs/skills/SKILL-CESIUM-VIEWER-CHANGE.md)
- TanStack framework docs: [tanstack.com/start](https://tanstack.com/start)
