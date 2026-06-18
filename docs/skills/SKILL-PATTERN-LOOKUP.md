## Skill: Pattern Lookup

### Purpose

Find how this repository already solves a problem before introducing new patterns, abstractions, or file locations.

### When to use this skill

- Before adding a new file, hook, service, or utility.
- When unsure which workspace owns a concern (`apps/api`, `apps/frontend`, `packages/db`).
- Before choosing error handling, validation, or data-fetching approach.

### When not to use this skill

- When the task explicitly requires a new pattern or breaking change.
- For pure documentation edits with no code impact.

---

### Procedure

1. **Map the concern to a workspace**

   | Concern | Look in |
   |---------|---------|
   | HTTP routes, propagation, OMM validation | `apps/api/src/` |
   | UI, routes, Cesium, API client | `apps/frontend/src/` |
   | Schema, migrations, Prisma | `packages/db/` |
   | Docker, Make, compose | repo root |

2. **Find the closest existing example**
   - **API route** → `apps/api/src/routes/satellites.routes.ts` + `satellites.routes.test.ts`
   - **Service logic** → `apps/api/src/services/` (e.g. `propagationService.ts`, `satelliteCatalog.ts`)
   - **Validation** → `apps/api/src/validation/ommValidation.ts` (required: `EPOCH`, `NORAD_CAT_ID`, SGP4 numeric fields in `types.ts`)
   - **HTTP errors** → `apps/api/src/errors.ts` (`HttpError`, `ValidationError`)
   - **API tests** → `apps/api/src/test/createTestApp.ts`, `fixtures.ts`, colocated `*.test.ts`
   - **Frontend route** → `apps/frontend/src/routes/` (file-based TanStack Router)
   - **API data hook** → `apps/frontend/src/hooks/useSatellitePositions.ts`
   - **API client** → `apps/frontend/src/lib/satelliteApi.ts`
   - **Shared UI** → `apps/frontend/src/components/`
   - **Cesium** → `apps/frontend/src/components/CesiumViewer.tsx`, `src/routes/globe.tsx`

3. **Match conventions in the target file**
   - Import style (ESM `.js` extensions in API compiled output paths).
   - Naming (`createX`, `useX`, colocated tests).
   - Error and response shapes already used by callers.

4. **Check module boundaries**
   - Propagation stays on the API (`satellite.js`); frontend consumes REST positions.
   - DB access goes through Prisma in the API, not from the frontend.

5. **Document only if you had to diverge**
   - If no pattern exists and you must invent one, note it for [`DECISIONS.md`](../DECISIONS.md) or the PR description.

---

### Validation requirements

- New code lives in the same layer as analogous existing code.
- No duplicate logic across API and frontend (e.g. client-side SGP4).

### Related documentation

- [`ARCHITECTURE.md`](../ARCHITECTURE.md)
- [`STYLES.md`](../STYLES.md)
- [`SKILL-SMALLEST-SAFE-CHANGE.md`](./SKILL-SMALLEST-SAFE-CHANGE.md)
