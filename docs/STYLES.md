# Style Conventions

Coding and UI conventions for Satellite Server. Match the surrounding file when in doubt.

## General

- **Language:** TypeScript in application code; ESM modules (`"type": "module"`).
- **Minimal diffs:** Only change what the task requires.
- **Imports:** Follow the file you are editing — API uses `.js` extensions in import paths (Node16/NodeNext emit); frontend omits extensions.
- **Types:** Explicit at module boundaries (exports, API shapes); local inference is fine inside functions.

## API (`apps/api`)

### Layout

```text
src/
  routes/       HTTP handlers — thin; delegate to catalog/services
  services/     Business logic
  validation/   Input parsing and normalization
  utils/        Pure helpers
  test/         Shared test utilities
  types.ts      Shared API types
  errors.ts     HttpError, ValidationError
  config.ts     Environment config
```

### Patterns

- **Factories:** `createApp()`, `createSatelliteRouter()` — accept dependencies for testing.
- **Errors:** Throw `ValidationError` for 400s; `HttpError` for other status codes; global handler in `app.ts`.
- **Services:** Classes or plain functions colocated by domain (`SatelliteCatalog`, `propagateSatellite`).
- **Validation:** Return normalized types from `validateAndNormalizeOmms`; never trust raw request body.
- **Tests:** Colocated `*.test.ts`; use `describe` / `it`; Supertest for routes via `createTestApp()`.
- **Fixtures:** Shared OMM samples in `src/test/fixtures.ts`.

### Naming

| Kind | Convention | Example |
|------|------------|---------|
| Files | camelCase | `satelliteCatalog.ts`, `ommValidation.ts` |
| Classes | PascalCase | `SatelliteCatalog`, `HttpError` |
| Functions | camelCase | `loadInitialOmms`, `parseOptionalDate` |
| Types/interfaces | PascalCase | `NormalizedOmmRecord`, `SatelliteSnapshot` |
| Constants | UPPER_SNAKE or camelCase | `DEFAULT_UPDATE_INTERVAL_MS` |

### JSON responses

- Use camelCase in response bodies (`noradCatId`, `updateIntervalMs`).
- ISO 8601 strings for timestamps (`updatedAt`, `propagatedAt`).

## Frontend (`apps/frontend`)

### Layout

```text
src/
  routes/         File-based TanStack Router pages
  components/     Reusable UI (Header, CesiumViewer, …)
  hooks/          TanStack Query wrappers
  lib/            API client and shared types
  styles.css      Global styles + Tailwind
```

**Import map:** `package.json` defines `"#/*": "./src/*"` for path aliases (optional; most files use relative imports).

### Patterns

- **Routes:** `createFileRoute('/path')({ component: … })` in `src/routes/*.tsx`.
- **Navigation:** `Link` from `@tanstack/react-router` (see `Header.tsx`).
- **Data:** TanStack Query in hooks (`useSatellitePositions`); pass data into components as props. Do **not** use route `loader`s for satellite API polling unless the task explicitly migrates patterns.
- **API client:** Centralize fetch logic in `lib/satelliteApi.ts`; export types alongside functions. Extend types when consuming new response fields (`eci`, `velocityEci`, etc.).
- **Type guards:** `isSatellitePositionOk()` for discriminated union on `status`.
- **Cesium:** Keep viewer lifecycle in `CesiumViewer.tsx`; cleanup with `viewer.destroy()` on unmount.
- **Styling:** Tailwind utility classes; CSS variables for theme (`--sea-ink`, `--line`, etc. in `styles.css`).

### Naming

| Kind | Convention | Example |
|------|------------|---------|
| Components | PascalCase file + export | `CesiumViewer.tsx`, `ThemeToggle.tsx` |
| Hooks | `use` prefix | `useSatellitePositions` |
| Route files | kebab or index | `globe.tsx`, `index.tsx`, `__root.tsx` |
| Props interfaces | `ComponentNameProps` | `CesiumViewerProps` |

### React

- Functional components only.
- `useEffect` for Cesium mount/unmount and DOM side effects.
- `useState` for local UI state; TanStack Query for server state.
- Prefer composition over new global state.

## Database (`packages/db`)

- **Model names:** PascalCase (`OmmRecord`).
- **Table/column names:** snake_case in Postgres via `@map` / `@@map`.
- **Migrations:** Prisma migrate; do not hand-edit applied migrations.
- **Raw OMM:** Store full payload in `rawOmm` JSON column alongside normalized fields.

## Formatting and lint

| Workspace | Tooling | Commands |
|-----------|---------|----------|
| API | TypeScript compiler | `npm run typecheck`, `npm run build` |
| Frontend | ESLint + Prettier | `npm run lint`, `npm run format`, `npm run check` |

Frontend ESLint: `eslint.config.js` (TanStack config). Match existing quote style and semicolon usage per file.

## Comments

- Prefer self-explanatory code.
- Comment non-obvious business rules (OMM shape edge cases, coordinate unit conversion).
- Do not add narrating comments ("import express").

## Accessibility

- Use semantic HTML (`main`, `table`, `th`, `nav`) as in existing routes.
- Ensure interactive controls are keyboard reachable (buttons, links via TanStack `Link`).
- When adding Cesium overlays, do not rely on color alone for critical status — pair with text labels.

## Related

- [`skills/SKILL-PATTERN-LOOKUP.md`](./skills/SKILL-PATTERN-LOOKUP.md)
- [`skills/SKILL-LINTING.md`](./skills/SKILL-LINTING.md)
- [`DECISIONS.md`](./DECISIONS.md)
