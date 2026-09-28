# Lynx brand (frontend)

Product UI follows the **Lynx** brand system. Visual reference lives in [`brand-kit/index.html`](../brand-kit/index.html) (palette, typography, buttons, panels). Implementation tokens live in the app.

## Naming

- **Product / UI copy:** Lynx
- **Repository:** Satellite Server (monorepo name unchanged)

## Design tokens

Canonical CSS variables: [`apps/frontend/src/styles/lynx-tokens.css`](../apps/frontend/src/styles/lynx-tokens.css), exposed to Tailwind via [`apps/frontend/src/styles.css`](../apps/frontend/src/styles.css).

| Token | Role |
|-------|------|
| `void` | Field, backgrounds, dark surfaces |
| `object` | Primary text and marks on black |
| `solar` | Orbit cyan — accent, links, focus rings, live state |
| `flare` | Fault / error emphasis only |
| `line` / `line-strong` | Borders on dark UI |
| `ink-muted` / `ink-faint` | Secondary labels |

Use Tailwind utilities: `bg-void`, `text-object`, `border-solar`, `ring-solar`, `text-ink-muted`, etc. Do **not** add new default Tailwind `slate-*` or generic `cyan-*` for product chrome.

### Typography

- **Display:** IBM Plex Sans (`font-sans`)
- **Data labels / NORAD-style caps:** `.text-data` (IBM Plex Mono, uppercase, `0.1em` tracking)

### Radius

- Controls: `rounded-sm` (6px)
- Panels / cards: `rounded-md` (10px)

## Components

Reuse primitives under `apps/frontend/src/components/ui/`:

| Component | Use |
|-----------|-----|
| `Button` | `primary` (object on void), `secondary` (solar border), `ghost`, `ink` |
| `Card` | Floating panels; `tone="glass"` over globe (default), `tone="dark"` for solid black |

Globe overlays: compact controls stay solid `bg-void-600`; floating panels use the `glass-panel` utility (~82% `void-600`, `backdrop-blur-md`, inset `ring-object/5`). Focus `ring-solar/60`. Keep pure `void` for the globe field only.

## Assets

Served from [`apps/frontend/public/brand/`](../apps/frontend/public/brand/):

- `lynx-mark.png` — favicon, compact chrome
- `lynx-logo.png` — full lockup

Source artwork remains in `brand-kit/`.

## Agent checklist (UI tasks)

1. Read this file and skim `brand-kit/index.html` interface primitives if layout or color is unclear.
2. Use theme tokens and `Button` / `Card` before inventing one-off classes.
3. Keep Cesium scene styling separate unless the task explicitly targets the globe renderer.

## Related

- [`STYLES.md`](./STYLES.md) — code conventions
- [`skills/SKILL-BRAND-UI.md`](./skills/SKILL-BRAND-UI.md) — procedural skill for brand work
