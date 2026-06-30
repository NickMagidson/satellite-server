## Skill: Cesium Viewer Change

### Purpose

Safely adjust Cesium viewer behavior, entities, camera, or map-related UI in the Satellite Server frontend while preserving performance and integration with the existing API and TanStack Start app.

### Project context

- **Monorepo layout**
  - `apps/frontend` — TanStack Start + React + Vite + Tailwind (`http://localhost:5173`)
  - `apps/api` — Express API with SGP4 propagation via `satellite.js` (`http://localhost:3000`)
- **Cesium**: installed in `apps/frontend` (`cesium` package). Viewer lives in `src/components/CesiumViewer.tsx`; the globe page is at `src/routes/index.tsx` (`/`).
- **Likely integration points**
  - New component under `apps/frontend/src/components/` (e.g. `CesiumViewer.tsx`)
  - Route(s) under `apps/frontend/src/routes/` that host the viewer
  - Data from the API via TanStack Query (same pattern as `apps/frontend/src/routes/index.tsx`)
- **Coordinate data from the API**
  - `GET /api/satellites/positions` — live cached positions (refreshed every `updateIntervalMs`, default 1s)
  - `GET /api/satellites/positions?at=<ISO-8601>` — propagate all satellites at a specific UTC time
  - `GET /api/satellites/:id/position` — single-satellite position
  - Successful positions include `geodetic` (lat/lon/alt km) and `ecf` (Earth-fixed Cartesian km). Prefer `ecf` for Cesium entity placement; convert km → m.
- **Environment**
  - Frontend API base URL: `import.meta.env.VITE_API_URL` (defaults to `http://localhost:3000`)
  - CORS on the API already allows `http://localhost:5173`

### When to use this skill

- The task focuses on:
  - camera position, orientation, or movement
  - adding/removing/updating entities, imagery layers, or terrain
  - interaction behavior (click, hover, selection) within the Cesium scene
  - controls or overlays tightly coupled to the viewer
  - wiring propagated satellite positions from the API into the globe

### When *not* to use this skill

- For general page layout or non-map UI (search overlay, detail panel) — edit `apps/frontend/src/components/` and `src/routes/index.tsx`.
- For API propagation logic, OMM validation, or catalog changes — work in `apps/api`.
- For orbital mechanics concepts (TLE, OMM, SGP4, frames) — see `SKILL-SATELLITE-PROPAGATION-BASICS.md`.

---

### Procedure

1. **Understand the current integration**
   - Check whether a Cesium component already exists under `apps/frontend/src/components/`.
   - Identify:
     - where the `Viewer` is created and mounted
     - how satellite data is fetched (TanStack Query `queryKey`, `refetchInterval`)
     - which API fields drive entity position (`ecf` vs `geodetic`)
     - how props/state influence the scene
   - Cesium is installed; viewer code is in `CesiumViewer.tsx` with assets via `vite.config.ts` (`cesiumAssetsPlugin`). Cesium is loaded with a **dynamic script tag** (`/cesium/Cesium.js`), not a static import. Set `VITE_CESIUM_ION_ACCESS_TOKEN` for Ion imagery/terrain when needed.

2. **Clarify the requested behavior**
   - From the task (issue or prompt), extract:
     - what should change in the scene (camera, entities, layers, interaction)
     - whether positions are live (`/positions`) or time-specific (`/positions?at=...`)
     - any performance or UX constraints (smooth animation, initial zoom, number of satellites)
   - Decide whether the change is:
     - purely configuration (e.g. different initial camera)
     - structural (new entities, new helper functions)
     - data-related (new query params, different polling interval)

3. **Plan a minimal, localized change**
   - Prefer adjusting existing viewer options or small helpers over rewriting large sections.
   - Keep Cesium-specific code in focused components; keep API fetch logic in route files or dedicated hooks.
   - Avoid duplicating propagation on the client — the API already runs SGP4; consume its `ecf`/`geodetic` output.
   - Avoid introducing new global state unless necessary.

4. **Implement the Cesium change**
   - Update viewer options, entities, or handlers as required.
   - Reuse established patterns:
     - React hooks for viewer lifecycle (`useEffect` + cleanup)
     - TanStack Query for satellite snapshots
     - Tailwind for surrounding UI chrome
   - When placing satellites:
     - map API `ecf` (km) to Cesium `Cartesian3` (m): multiply coordinates by 1000, or
     - map `geodetic` via `Cartesian3.fromDegrees(lon, lat, altKm * 1000)`
   - Dispose of the viewer and any Cesium resources on component unmount (`viewer.destroy()`).
   - Handle `status: 'propagation_failed'` entries without breaking the scene.

5. **Coordinate with API and UI when needed**
   - If new position fields or endpoints are required, update `apps/api` routes/types first, then consume them in the frontend.
   - If surrounding UI (search, detail panel) must change, update `src/routes/index.tsx` and shared components in `apps/frontend/src/`.

6. **Manual verification (recommended)**
   - From the repo root, run `npm run dev` (starts API on `:3000` and frontend on `:5173`).
   - Open `/` (the globe page).
   - Verify:
     - the viewer initializes without console errors
     - satellite entities appear and update with live polling
     - search and click-to-select open the detail panel with correct metadata
     - performance remains acceptable with the current satellite count

7. **Run validation**
   - From the repo root or `apps/frontend`:
     - `npm --workspace apps/frontend run lint`
     - `npm --workspace apps/frontend run build`
   - If API types or contracts changed:
     - `npm run typecheck` (API workspace)

---

### Related skills

- `SKILL-SATELLITE-PROPAGATION-BASICS.md` — TLE/OMM, SGP4, coordinate frames, visualization pipeline

### Related documentation

- `README.md` — repo structure, API endpoints, OMM data shape, dev commands
