## Skill: Repository Validation

### Purpose

Run the right checks for a change before calling it done or opening a PR.

### When to use this skill

- After implementing a task.
- Before opening or updating a pull request.
- When the user asks "is this ready?" or "run tests."

### When not to use this skill

- For read-only questions or planning (no code changed).

---

### Procedure

1. **Determine which workspaces changed**

   | If you changed… | Run at minimum |
   |-----------------|----------------|
   | `apps/api/` | API test + typecheck (+ build if shipping compiled output) |
   | `apps/frontend/` | Frontend lint + build |
   | `packages/db/` | Regenerate client if schema changed; run migrations in dev when applicable |
   | Root config / Docker | Relevant build or `make dev` smoke check when behavior may change |

2. **Run checks from the repo root**

   ```sh
   # API
   npm run test
   npm run typecheck
   npm run build

   # Frontend
   npm --workspace apps/frontend run lint
   npm --workspace apps/frontend run build

   # Optional: frontend unit tests when present/updated
   npm --workspace apps/frontend run test
   ```

3. **Database changes**
   - After Prisma schema edits: `npm run db:generate`
   - Apply migrations in the dev environment: `npm run db:migrate` (or via `make exec` in the compose stack)

4. **Manual smoke test when behavior is user-visible**
   - Host: `npm run dev` → API `http://localhost:3000`, frontend `http://localhost:5173`
   - Docker: `make dev` → same ports via compose
   - Hit `GET /health` and exercise the changed UI or endpoint

5. **Record what you ran**
   - List commands and results in the PR test plan ([`SKILL-PULL-REQUEST-PREPARATION.md`](./SKILL-PULL-REQUEST-PREPARATION.md)).

---

### Validation matrix (quick reference)

| Skill | Command |
|-------|---------|
| Testing (API) | `npm run test` |
| Typecheck (API) | `npm run typecheck` |
| Build (API) | `npm run build` |
| Lint (frontend) | `npm --workspace apps/frontend run lint` |
| Build (frontend) | `npm --workspace apps/frontend run build` |
| Format check (frontend) | `npm --workspace apps/frontend run check` |

Load individual skills ([`SKILL-TESTING.md`](./SKILL-TESTING.md), [`SKILL-LINTING.md`](./SKILL-LINTING.md), [`SKILL-BUILD.md`](./SKILL-BUILD.md)) for detail on each step.

---

### Validation requirements

- All applicable commands exit successfully.
- Failures are fixed or explicitly called out with reason before PR.

### Related documentation

- [`WORKFLOW.md`](../WORKFLOW.md)
- [`workflow/WORKFLOW-PRS.md`](../workflow/WORKFLOW-PRS.md)
