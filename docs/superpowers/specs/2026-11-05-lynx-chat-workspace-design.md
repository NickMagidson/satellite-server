# Lynx Chat Workspace Design

## Intent

Make the existing Lynx globe the right side of an Ask Maps style workspace, with an assistant-ui conversation on the left. People should be able to explore the current satellite catalog by asking for satellites, applying existing filters, selecting an object, and reading its current details. This is the first step toward the ground-station access and footprint workflows discussed in the [brainstorm](https://chatgpt.com/share/6aed1a6d-182c-83e9-96b4-32d3e0fe6cfd).

## Approaches

1. **Chat and split screen first (selected by the user).** Keep the existing live globe and catalog behavior; add a chat panel and a narrow set of catalog and scene actions. This demonstrates the new interaction model early, while access analysis follows later.
2. **Access engine first.** Build ground-station visibility calculations and playback before chat. This would make the most distinctive question useful sooner, but delays the requested chat and layout experience.

The user chose a real model-backed chat with satellite actions for this milestone. A scripted command parser would exercise the layout faster but would not establish the requested natural-language interface. Use OpenAI as the proposed model provider, with a tool-capable model name supplied through `OPENAI_MODEL` on the server; this is a builder call based on the ChatGPT context, subject to the user's review of this design.

The user chose a **local development release first**. The public Render deployment must continue showing its existing globe experience and must not expose a model-backed endpoint in this milestone. A later public release will need its own usage controls and rollout decision.

## Goals

- Desktop: a Lynx-branded, full-height left conversation pane and a larger right Cesium globe. The panel may be resized or collapsed without remounting the viewer. On narrow screens, the conversation becomes an accessible drawer or full-width tab while the globe remains reachable.
- Preserve direct satellite search, orbit/object/country filters, globe click selection, tracking, recentering, and satellite details. Chat and direct controls update the same React state; a globe click changes the chat context for the next turn.
- First chat tasks: find satellites by name or NORAD ID; filter by the existing orbit class, object type, and country categories; select one of the results; answer questions using catalog metadata and the current selected satellite position. Show empty/ambiguous results and allow the user to correct a choice.
- Answers that change the globe use validated structured actions such as `selectSatellite` and `setFilters`. The panel shows the resulting selection and active filters, including a clear reset control. The model never supplies raw Cesium code or unvalidated IDs.
- Show loading, cancellation, API errors, and model errors in the conversation without breaking direct globe use. Keep model credentials on the Express server.

## Non-goals for this milestone

- Ground stations, access windows, footprints, pass playback, mission scheduling, or predicted radio contact.
- Chat history across sessions, authentication, user accounts, or new database tables.
- Public AI chat deployment, public API usage controls, and production billing configuration.
- Replacing the current live motion worker, changing OMM validation, or moving satellite routes to TanStack Start.

## Anti-goals

- A conversation that claims to calculate passes or coverage using only a language model.
- Chat controls that disagree with the visible filters or selected satellite.
- A left pane that hides the globe or leaves Cesium sized incorrectly after layout changes.
- Generic assistant styling that discards Lynx typography, color tokens, and existing controls.

## Existing system and constraints

- `apps/frontend/src/routes/index.tsx` currently owns search, filter, selection, detail, tracking, and the `CesiumViewer`. Keep one shared state owner there or extract only a focused workspace controller from it.
- `CesiumViewer` already accepts `selectedEntityId` and exposes `recenter` and `setTracking`; its live position updates come from `useSatelliteMotionWorker`. Preserve that pipeline.
- The Express 5 API in `apps/api` owns the `SatelliteCatalog` and existing `/api/satellites` routes. Add a focused chat endpoint there. Use the existing catalog for trusted lookup and current positions.
- Production Compose sets `LIVE_POSITION_REFRESH_ENABLED=false`, so the agent's “current position” lookup must propagate the selected satellite at request time with `catalog.getPosition(id, new Date())`; the initial cached snapshot is not current in that configuration.
- Use npm workspaces, React 19, TanStack Start, TanStack Query, Tailwind 4, Cesium, Prisma/Postgres, and the Lynx brand tokens. Add only the dependencies needed for assistant-ui and the server model/runtime connection. Use server-only `OPENAI_API_KEY` and `OPENAI_MODEL` configuration; never expose these through `VITE_*`.
- Gate the new workspace behind build-time `VITE_LYNX_CHAT_ENABLED=true`, default off; when off, `/` renders the existing globe layout. Gate the Express chat endpoint behind `LYNX_CHAT_ENABLED=true`, default off and unavailable under `NODE_ENV=production`, even if an API key is present. Document how to opt in locally. CORS alone is not a public usage control.
- The checked-in sample OMM records are old. For current-position claims, include the element epoch or a stale-data warning; do not imply precise present-day tracking from old elements.
- Repository instructions prohibit commits, pushes, and PRs unless explicitly requested. This design document remains uncommitted until authorized.

## Proposed interaction and architecture

1. The pane opens with a short Lynx prompt and examples such as “Show the ISS,” “Show LEO satellites,” and “Which satellite is selected?” Existing search and filter controls remain available in the pane; recenter and tracking stay easy to reach near the globe or selected-object details.
2. assistant-ui renders and manages the visible thread. A server-side chat endpoint receives the user request plus bounded conversation context and a snapshot of the selected satellite and filters. The server validates that context against its catalog.
3. The server exposes fixed, read-only domain operations to the model: `searchSatellites`, `getSatelliteDetails`, and `getCurrentPosition`. The last operation propagates on demand and reports any propagation failure. The model returns an answer plus a limited scene-action envelope. The server validates the action shape and IDs; the frontend validates them again against its loaded catalog before applying them.
4. Search results and selected-object details can appear as compact cards inside the conversation. Choosing a card calls the same selection function used by the existing `SearchInput` and globe click. Filters use the existing `SatelliteFilters` shape and `useFilterState`, so local storage and visible filter controls stay synchronized.
5. Keep the Cesium component mounted while toggling the pane. Ensure its canvas receives a resize notification when its container dimensions change. The selected-satellite detail panel may move into the pane or remain as a compact overlay inside the globe pane, but must not cover the chat or essential globe controls.
6. The first release uses one in-memory conversation per page visit. Persistence can be added when the interaction model proves useful.

## Acceptance criteria

- Desktop and narrow-screen layouts permit both chat and direct globe use. The globe fills its pane after resize/collapse and continues live updates.
- Manual search, filters, globe click selection, tracking, recentering, and details still work.
- A user can ask to find an existing satellite, choose among ambiguous results, select it, and see the matching globe/detail state.
- A user can ask for an existing orbit/object/country filter and see both the globe and filter controls update. Reset works from either control path.
- The assistant answers catalog/current-position questions from validated API data, identifies missing results, and discloses stale element epochs when relevant. It does not answer access or footprint questions as if computed.
- Failed chat calls and missing model configuration produce a clear message in the pane; the globe remains usable.
- With chat flags unset, the existing globe view remains available and the model endpoint is unavailable, including in the production build.
- API tests cover tool lookup and action validation; frontend tests cover shared state transitions and the responsive panel. Existing frontend lint/build and API test/typecheck/build pass.

## Builder choices left open

- Exact split-pane width, collapse control, and mobile breakpoint, using the Lynx brand kit as the visual reference.
- Which supported assistant-ui runtime and model SDK best fit OpenAI and the existing Express deployment; use current official documentation at implementation time.
- Whether results are streamed in the first version or sent as one complete response, provided cancellation and errors are clear.
