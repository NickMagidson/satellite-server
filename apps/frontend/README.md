# Satellite Server Frontend

TanStack Start + React app for satellite position tables and the Cesium globe.

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
src/routes/       File-based TanStack Router (/, /about, /globe)
src/components/   Header, CesiumViewer, …
src/hooks/        useSatellitePositions (TanStack Query)
src/lib/          satelliteApi.ts — fetch + types
```

## Data fetching

This app uses **TanStack Query hooks** to poll `GET /api/satellites/positions`. It does **not** use TanStack Router loaders or TanStack server API routes for satellite data — the Express API in `apps/api` owns propagation.

Configure the API URL with `VITE_API_URL` (default `http://localhost:3000`).

## Documentation

- Root setup and API: [`../../README.md`](../../README.md)
- Architecture and conventions: [`../../docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md), [`../../docs/STYLES.md`](../../docs/STYLES.md)
- Cesium changes: [`../../docs/skills/SKILL-CESIUM-VIEWER-CHANGE.md`](../../docs/skills/SKILL-CESIUM-VIEWER-CHANGE.md)
- TanStack framework docs: [tanstack.com/start](https://tanstack.com/start)
