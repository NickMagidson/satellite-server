## Skill: Pull Request Preparation

### Purpose

Prepare a clear, reviewable pull request after implementation and validation — for work from a GitHub issue or a direct prompt.

### When to use this skill

- The user asks to open a PR, commit, or get changes merge-ready.
- Implementation and validation are complete.

### When not to use this skill

- The user has not asked for a PR and is still iterating.
- Only questions or planning — no code to submit.

---

### Procedure

1. **Confirm readiness**
   - Run [`SKILL-REPOSITORY-VALIDATION.md`](./SKILL-REPOSITORY-VALIDATION.md).
   - Ensure diffs match [`SKILL-SMALLEST-SAFE-CHANGE.md`](./SKILL-SMALLEST-SAFE-CHANGE.md).

2. **Branch naming**

   | Context | Pattern | Example |
   |---------|---------|---------|
   | GitHub issue | `issue-{n}` or `feat/issue-{n}-short-desc` | `issue-12`, `feat/issue-12-globe-camera` |
   | Prompt only | descriptive slug | `feat/positions-table-sort` |

3. **Commits**
   - Plain language; state **why**, not only what changed.
   - One logical change per commit when practical.
   - Do not commit unless the user asked.

4. **PR title**
   - Short summary of the outcome.
   - Prefix with issue reference when applicable: `Fix globe camera defaults (#12)`.

5. **PR body**

   ```markdown
   ## Summary
   - …

   ## Test plan
   - [ ] `npm run test`
   - [ ] `npm run typecheck`
   - [ ] `npm --workspace apps/frontend run lint` (if frontend touched)
   - [ ] Manual: …

   Closes #12   <!-- omit for prompt-only work -->
   ```

6. **Push and create PR**
   - Push branch with upstream tracking.
   - Use `gh pr create` when available.
   - Use draft PRs when human review is expected before merge.

7. **Return the PR URL** to the user.

---

### Validation requirements

- Test plan lists commands actually run.
- Issue link included when work traces to an issue.
- No secrets or `.env` files in the diff.

### Related documentation

- [`workflow/WORKFLOW-PRS.md`](../workflow/WORKFLOW-PRS.md)
- [`WORKFLOW.md`](../WORKFLOW.md)
- [`COPILOT-OPERATING-RULES.md`](../COPILOT-OPERATING-RULES.md)
