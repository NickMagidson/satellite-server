---
name: ux-critique
description: Critiques UI screenshots of the Satellite Server frontend against UX best practices and returns prioritized findings (critical, should fix, polish). Use when the user shares a screenshot and asks for a design review, UX critique, or feedback on a screen.
disable-model-invocation: true
---

# UX Critique

Review a screenshot of the app and return a prioritized list of UX findings. This is a critique, not an implementation task: do not edit code unless the user asks afterwards.

## Inputs

- **Required**: one or more screenshots.
- **Optional**: what the screen is for, the user's goal on it, or a specific concern ("does the filter panel feel cluttered?").

If no screenshot is attached, ask for one. If the purpose of the screen is unclear and it would change the critique, ask one short question; otherwise infer it and state the assumption.

## Workflow

1. **Understand the screen.** Identify the primary task a user would do here and the single most important element. Write this down as one sentence before critiquing.
2. **Map to code (quick).** Match visible UI to components under `apps/frontend/src/components/` so findings can name the component (e.g. `SatelliteFilterPanel`, `SatelliteDetailPanel`, `SearchInput`, `Card`). Skim only; don't audit the code.
3. **Evaluate** against the checklist in [HEURISTICS.md](HEURISTICS.md). Focus on issues visible in the screenshot.
4. **Prioritize** each finding with the severity rubric below. Drop nitpicks that don't change the experience.
5. **Report** using the output template.

## App context

- Dark-only UI (`color-scheme: dark`). Theme tokens live in `apps/frontend/src/styles.css`: `surface` #020617, `surface-raised` #0f172a, `border` #334155, `ink` #f1f5f9, `ink-muted` #94a3b8. Fonts are IBM Plex Sans / Mono.
- Stack: React 19, Tailwind v4, Headless UI, `lucide-react` icons.
- Panels are translucent cards (`bg-slate-950/90 backdrop-blur`) floating over a full-viewport Cesium globe. Judge legibility against busy globe imagery, and check that panels don't hide the content the user is trying to look at.
- The domain is data-dense (satellite names, NORAD IDs, orbital values). Favor scannability, consistent units, and monospace for numbers that users compare.

## Severity rubric

| Level | Meaning |
|-------|---------|
| **Critical** | Blocks or misleads the user: task can't be completed, content is unreadable, a control is undiscoverable, or an accessibility failure excludes users. |
| **Should fix** | Causes friction or confusion: weak hierarchy, inconsistent patterns, unclear labels, missing feedback. |
| **Polish** | Refinement: spacing rhythm, alignment, visual consistency, minor copy tweaks. |

## Output template

```markdown
**Screen:** [what it is] — **Primary task:** [one sentence]

### Critical
1. **[Short title]** — [What's wrong and where on the screen]. *Why it matters:* [user impact]. *Fix:* [specific recommendation, naming the component if known].

### Should fix
1. ...

### Polish
1. ...

**What's working:** [1–3 things to keep, briefly]
```

Rules for findings:

- Reference the exact spot ("the 'Apply' button in the filter panel footer"), not vague areas.
- Every finding needs a concrete fix, e.g. "raise label text from `text-xs` to `text-sm`", not "improve readability".
- Omit an empty severity section rather than padding it.
- Keep to about 10 findings total; if there are more, keep the highest impact ones.
- When something can't be judged from a static image (hover, focus, motion, loading states, exact contrast from a compressed screenshot), say so in one line at the end and offer to review with more screenshots or the code.
