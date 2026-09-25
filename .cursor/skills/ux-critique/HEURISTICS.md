# UX Heuristics Checklist

Use this as a lens, not a form to fill in. Only report items that surface a real issue in the screenshot.

## Hierarchy and layout

- One clear focal point; the primary action is the most visually prominent control.
- Grouping follows proximity: related controls are close together, unrelated ones are separated.
- Consistent spacing scale (Tailwind 4px steps); no one-off gaps.
- Alignment: shared left edges, labels aligned with their inputs, numeric columns right-aligned.
- Content density fits the task: dense data is scannable (rows, dividers, zebra striping) rather than packed.

## Typography

- No more than 3–4 distinct text sizes on a screen; each size has a clear role.
- Body text at least 14px (`text-sm`); avoid `text-xs` for anything users must read, not just glance at.
- Line length for prose around 45–75 characters.
- Numbers users compare use tabular or monospace figures (`font-mono` or `tabular-nums`).
- Units are always shown and consistent (km vs m, UTC vs local time).

## Color and contrast

- Text contrast at least 4.5:1 (3:1 for text 18px+ or bold 14px+); UI component and icon contrast at least 3:1.
- Translucent panels stay legible over the brightest globe imagery, not only over dark ocean.
- Color is never the only signal (pair with icon, label, or shape), especially for status or orbit categories.
- Accent color is reserved for interactive and selected states, so it keeps meaning.
- Destructive or warning states are visually distinct from primary actions.

## Controls and interaction

- Interactive elements look interactive; non-interactive elements don't look clickable.
- Touch or click targets at least 24×24px (44×44px preferred for primary or touch use).
- Visible selected, active, disabled, and (when inferable) focus states.
- Icon-only buttons have an obvious meaning or a visible label or tooltip.
- Filters show the current state at a glance (active count, chips) and offer a clear reset.
- Search shows what it matches against, and has clear empty and no-results states.

## Feedback and system status

- Loading, empty, error, and stale-data states exist and are distinct.
- Live or time-based data shows its timestamp or freshness.
- Actions give immediate visible feedback.
- Selecting a satellite on the globe is reflected in the panel and vice versa.

## Copy and labeling

- Labels use user language, not internal jargon (explain TLE, NORAD ID, or inclination on first exposure if the audience is general).
- Buttons say what they do ("Apply filters", not "OK").
- Consistent terminology across screens (don't mix "satellite", "object", and "asset").
- Sentence case throughout, matching the rest of the app.

## Globe and overlay specifics

- Panels don't cover the area the user is focused on; they can be collapsed or dismissed.
- Overlay controls don't collide with Cesium's own widgets or attribution.
- Labels and markers on the globe remain readable at typical zoom and don't pile up into clutter.
- The selected satellite is clearly distinguished from the rest (size, color, halo, or label).

## Responsiveness

- Layout holds at narrow widths: panels stack or become drawers rather than overlapping.
- Nothing essential depends on hover (hover doesn't exist on touch).

## Nielsen's heuristics (quick pass)

Visibility of system status · Match with the real world · User control and freedom (undo, cancel, close) · Consistency and standards · Error prevention · Recognition over recall · Flexibility and efficiency (shortcuts for power users) · Aesthetic and minimalist design · Help users recover from errors · Help and documentation.
