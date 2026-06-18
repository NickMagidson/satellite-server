## Skill: Smallest Safe Change

### Purpose

Implement only what the task requires — no drive-by refactors, no speculative improvements, no scope creep.

### When to use this skill

- Every implementation task (issue or direct prompt).
- Before writing or editing code.
- When tempted to "clean up while you're here."

### When not to use this skill

- When the user explicitly asks for a refactor, migration, or broader redesign.
- For documentation-only tasks (no code change).

---

### Procedure

1. **Restate the task in one sentence**
   - What must be true when you're done?
   - What is explicitly out of scope?

2. **Identify the smallest boundary**
   - One file, one function, one route, one component — start there.
   - Use [`TASK-CLASSIFICATION.md`](../TASK-CLASSIFICATION.md) to pick the right workspace.

3. **Search before inventing**
   - Grep or read for an existing pattern that already solves the problem.
   - Load [`SKILL-PATTERN-LOOKUP.md`](./SKILL-PATTERN-LOOKUP.md) when unsure where code belongs.

4. **Plan the diff**
   - List files you will touch and why.
   - Drop any file that isn't required for the stated outcome.

5. **Implement incrementally**
   - Make the change work first; polish only if the task asks for it.
   - Do not rename, reformat, or reorder unrelated code.
   - Do not add dependencies unless the task requires them.

6. **Stop when the task is satisfied**
   - Run validation ([`SKILL-REPOSITORY-VALIDATION.md`](./SKILL-REPOSITORY-VALIDATION.md)).
   - Do not add "nice to have" features without approval.

---

### Validation requirements

- Changed files map directly to the task.
- No unrelated diffs in the working tree.
- Relevant tests/lint/build pass (see validation skill).

### Related documentation

- [`GUARDRAILS.md`](../GUARDRAILS.md)
- [`SKILL-PATTERN-LOOKUP.md`](./SKILL-PATTERN-LOOKUP.md)
- [`SKILL-REPOSITORY-VALIDATION.md`](./SKILL-REPOSITORY-VALIDATION.md)
