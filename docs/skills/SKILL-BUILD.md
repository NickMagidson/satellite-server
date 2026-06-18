## Skill: Build

### Purpose

Verify TypeScript and bundler output succeeds before merge — catches type and import errors tests may miss.

### When to use this skill

- Before opening a PR.
- After dependency or `tsconfig` changes.
- After API or frontend structural changes.

### When not to use this skill

- Trivial doc-only changes.
- Mid-task iteration (use typecheck or dev server instead).

---

### Procedure

1. **API build (TypeScript → `dist/`)**

   ```sh
   npm run build
   ```

   Equivalent: `npm --workspace apps/api run build` (`tsc`).

2. **API typecheck without emit (faster feedback)**

   ```sh
   npm run typecheck
   ```

   Use during development; still run `build` before PR when API code changed.

3. **Frontend production build (Vite)**

   ```sh
   npm --workspace apps/frontend run build
   ```

   Catches missing imports, SSR/bundle issues, and Cesium asset config problems.

4. **Database package**
   - `packages/db` has no compile step today.
   - After schema changes: `npm run db:generate` so `@prisma/client` matches the schema.

5. **If build fails**
   - Fix errors in the workspace that failed; do not silence with loose types unless unavoidable and documented.

---

### Validation requirements

- `npm run build` succeeds when `apps/api/` changed.
- `npm --workspace apps/frontend run build` succeeds when `apps/frontend/` changed.
- `npm run db:generate` succeeds when `packages/db/prisma/schema.prisma` changed.

### Related documentation

- [`SKILL-REPOSITORY-VALIDATION.md`](./SKILL-REPOSITORY-VALIDATION.md)
- [`README.md`](../../README.md)
