# Skill: Brand / UI (Lynx)

Use when changing product chrome, typography, colors, marketing shell, or shared UI primitives in `apps/frontend`.

## Before editing

1. Read [`../BRAND.md`](../BRAND.md).
2. Skim [`../../brand-kit/index.html`](../../brand-kit/index.html) if the task involves new patterns (buttons, panels, status).
3. Load [Pattern lookup](./SKILL-PATTERN-LOOKUP.md) and [Linting](./SKILL-LINTING.md).

## Implementation rules

- Tokens: `apps/frontend/src/styles/lynx-tokens.css` and `@theme` in `styles.css` — no new ad-hoc hex colors.
- Components: prefer `components/ui/Button.tsx` and `Card.tsx` variants.
- Data-dense labels: `.text-data` or `font-mono` with uppercase + tracking for small caps labels.
- Accent and focus: `solar`, not default Tailwind cyan.
- Errors / fault: `flare` where the brand kit uses fault color.

## Validation

```bash
npm --workspace apps/frontend run lint
npm --workspace apps/frontend run build
```

## Related

- [`../BRAND.md`](../BRAND.md)
- [`../STYLES.md`](../STYLES.md)
