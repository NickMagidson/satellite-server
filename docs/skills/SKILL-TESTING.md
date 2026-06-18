## Skill: Testing

### Purpose

Add or update automated tests so API behavior stays correct; use the repo's existing Vitest and Supertest patterns.

### When to use this skill

- Changing `apps/api/` routes, services, validation, or utilities.
- Fixing a bug (add a regression test when practical).
- Before opening a PR for API logic changes.

### When not to use this skill

- Frontend-only UI tweaks with no test coverage yet (manual check + lint/build instead).
- Documentation-only changes.

---

### Procedure

1. **Locate existing tests**
   - Colocated: `apps/api/src/**/*.test.ts`
   - Shared helpers: `apps/api/src/test/createTestApp.ts`, `fixtures.ts`
   - Config: `apps/api/vitest.config.ts`

2. **Choose the right test style**

   | Layer | Pattern |
   |-------|---------|
   | HTTP routes | Supertest against `createTestApp()` — see `satellites.routes.test.ts` |
   | Services | Direct unit tests with fixtures — see `propagationService.test.ts` |
   | Validation | Table-driven cases — see `ommValidation.test.ts` |
   | Utilities | Small pure-function tests — see `time.test.ts` |

3. **Write focused tests**
   - One behavior per test; clear `describe` / `it` names.
   - Use `validOmm` and helpers from `test/fixtures.ts` for OMM data.
   - For route tests: create app via `createTestApp()`, register in `afterEach` cleanup (see existing route tests).

4. **Run tests**

   ```sh
   npm run test
   ```

   Watch mode during development:

   ```sh
   npm --workspace apps/api run test:watch
   ```

5. **Frontend tests (when added)**
   - Vitest + Testing Library in `apps/frontend`
   - `npm --workspace apps/frontend run test`

---

### Validation requirements

- `npm run test` passes from repo root.
- New behavior has coverage when the change is non-trivial or bug-fixing.

### Related documentation

- [`SKILL-PATTERN-LOOKUP.md`](./SKILL-PATTERN-LOOKUP.md)
- [`SKILL-REPOSITORY-VALIDATION.md`](./SKILL-REPOSITORY-VALIDATION.md)
