## Skill: Linting

### Purpose

Keep frontend and config changes consistent with ESLint and Prettier rules in this repo.

### When to use this skill

- After editing `apps/frontend/` source, config, or styles.
- After changing `eslint.config.js`, `prettier.config.js`, or related tooling.
- Before opening a PR that touches frontend code.

### When not to use this skill

- API-only changes under `apps/api/` (no ESLint at API workspace today).
- Documentation-only changes.

---

### Procedure

1. **Run ESLint from the repo root**

   ```sh
   npm --workspace apps/frontend run lint
   ```

2. **Fix reported issues**
   - Prefer fixing code over disabling rules.
   - Match patterns in neighboring files.
   - ESLint config: `apps/frontend/eslint.config.js` (TanStack ESLint config).

3. **Format when appropriate**

   ```sh
   npm --workspace apps/frontend run format   # write fixes
   npm --workspace apps/frontend run check    # verify Prettier only
   ```

   Use `format` when the task includes style cleanup; otherwise ensure `lint` passes.

4. **Re-run lint after fixes**

   ```sh
   npm --workspace apps/frontend run lint
   ```

---

### Validation requirements

- `npm --workspace apps/frontend run lint` exits 0.
- No new `eslint-disable` comments unless justified in the PR.

### Related documentation

- [`STYLES.md`](../STYLES.md)
- [`SKILL-REPOSITORY-VALIDATION.md`](./SKILL-REPOSITORY-VALIDATION.md)
