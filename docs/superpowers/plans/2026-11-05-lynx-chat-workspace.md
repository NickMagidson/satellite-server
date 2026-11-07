# Lynx Chat Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a locally enabled Lynx split workspace with real AI chat that searches, filters, and selects satellites on the existing live globe.

**Architecture:** Keep `GlobePage` as the owner of catalog, filters, selection, and Cesium. Render assistant-ui in a feature-gated left pane; its `LocalRuntime` calls a new Express JSON endpoint. The endpoint runs an OpenAI tool-capable model against fixed catalog operations and returns text, search results, and validated scene actions. No new workspace or database table is needed.

**Tech Stack:** npm workspaces; TanStack Start, React 19, Tailwind 4, Cesium, `@assistant-ui/react`; Express 5, `satellite.js`, AI SDK `ai` + `@ai-sdk/openai`, Zod; Vitest and Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-05-lynx-chat-workspace-design.md`

## Global Constraints

- Keep the current Express satellite API, Prisma/Postgres OMM store, frontend motion worker, direct search/filter controls, and Lynx token system.
- Add no TanStack Start satellite or chat API route, no new workspace, and no chat persistence or ground-station analysis.
- `VITE_LYNX_CHAT_ENABLED=true` enables the new layout only in Vite development; otherwise `/` remains the existing globe view. `LYNX_CHAT_ENABLED=true` enables the Express chat route only outside `NODE_ENV=production`; both default off.
- `OPENAI_API_KEY` and tool-capable `OPENAI_MODEL` are server-only. A missing value produces a clear chat error and never exposes a credential to the browser.
- The model may use only registered catalog tools. Validate action IDs and filter values on both server and client. Current positions must use `catalog.getPosition(id, new Date())`, because the production cache may not refresh.
- Show element epoch and age for position answers; never represent ground-station access, footprints, or radio contacts as computed in this milestone.
- The repository's `AGENTS.md` prohibits commits, pushes, and PRs without an explicit user request. Complete tasks as uncommitted checkpoints; omit the writing-plans skill's commit steps.

## File Map

| File | Responsibility |
| --- | --- |
| `apps/frontend/src/components/layout/GlobeWorkspaceShell.tsx` | Responsive, collapsible chat/globe arrangement without remounting the globe. |
| `apps/frontend/src/routes/index.tsx` | Shared catalog, filter, selection, detail, and viewer state; feature-gated layout. |
| `apps/frontend/src/components/CesiumViewer.tsx` | Resize the mounted viewer when its pane changes size. |
| `apps/api/src/services/chatCatalogTools.ts` | Trusted catalog lookup, position lookup, and scene-action validation. |
| `apps/api/src/services/chatService.ts` | Bounded OpenAI tool loop and response contract. |
| `apps/api/src/routes/chat.routes.ts` | Validate chat requests and expose the local-only endpoint. |
| `apps/api/src/app.ts`, `server.ts`, `config.ts` | Register and configure the endpoint. |
| `docker-compose.dev.yml`, `.env.example` | Pass local-only chat flags and server credentials into the existing `make dev` stack. |
| `apps/frontend/src/lib/chatClient.ts`, `chatActions.ts` | HTTP contract and client-side action validation. |
| `apps/frontend/src/components/chat/ChatPanel.tsx` | assistant-ui runtime, Lynx thread, suggestions, and result choices. |

## Review Focus

1. An action naming a satellite absent from the loaded catalog must leave the current selection unchanged — Task 2 server test and Task 4 client test.
2. Unknown filter values must leave filters unchanged, including when the catalog changes between request and response — Task 2 and Task 4 tests.
3. Disabled or production chat must never call the model or expose a reachable model route — Task 3 route tests and Task 4 production build check.
4. Malformed, excessive, or non-user-ending conversation history must return 400 before a model call — Task 3 route tests.
5. A catalog that has not loaded, a failed propagation, or old elements must never appear as a confident current answer — Task 2 tests, Task 3 position-notice test, and Task 4 disabled-state test.

---

### Task 1: Feature-gated split workspace

**Files:** Create `apps/frontend/src/components/layout/GlobeWorkspaceShell.tsx` and `GlobeWorkspaceShell.test.tsx`; modify `apps/frontend/src/routes/index.tsx`, `apps/frontend/src/components/CesiumViewer.tsx`.

**Interfaces:** Produces `GlobeWorkspaceShell({ enabled, sidebar, children }: { enabled: boolean; sidebar: ReactNode; children: ReactNode })`. `GlobePage` continues to provide one mounted `CesiumViewer`, a shared `selectedSatellite`, and existing `filters`; Task 4 consumes those values and setters.

- [ ] **Step 1: Write the shell behavior test.** In `GlobeWorkspaceShell.test.tsx` (`// @vitest-environment jsdom`), assert that disabled mode has no chat region, enabled mode has an accessible toggle, collapsing and reopening preserves the exact globe DOM node, and the toggle's `aria-expanded` follows its state:

  ```tsx
  const globe = screen.getByTestId('globe')
  fireEvent.click(screen.getByRole('button', { name: /hide chat/i }))
  expect(screen.getByTestId('globe')).toBe(globe)
  expect(screen.getByRole('button', { name: /show chat/i }).getAttribute('aria-expanded')).toBe('false')
  ```
- [ ] **Step 2: Run the test red.** `npm --workspace apps/frontend run test -- GlobeWorkspaceShell.test.tsx`; expect missing component/import failure.
- [ ] **Step 3: Implement `GlobeWorkspaceShell`** with the existing full-width view when disabled and a Lynx-token left pane plus `min-w-0` globe pane when enabled. Use an accessible mobile overlay/collapse control and the same persistent globe child across pane toggles.
- [ ] **Step 4: Update `GlobePage`** to compute `chatEnabled = import.meta.env.DEV && import.meta.env.VITE_LYNX_CHAT_ENABLED === 'true'`, render existing search/filter controls in the sidebar when enabled and over the globe otherwise, and leave the selected detail panel in the globe pane. The sidebar contains a temporary “Ask Lynx” placeholder until Task 4.
- [ ] **Step 5: In `CesiumViewer`, observe its container size** and call the existing viewer's `resize()` and `scene.requestRender()` on a change; disconnect on cleanup. Keep the existing dynamic Cesium script and motion worker lifecycle.
- [ ] **Step 6: Run verification.** The focused test, frontend lint, and frontend build must pass. In a browser, verify globe points, search, filters, selection, tracking, and recentering with the flag both off and on; collapse/reopen must not reset the globe.

### Task 2: Trusted catalog operations and scene actions

**Files:** Create `apps/api/src/services/chatCatalogTools.ts` and `chatCatalogTools.test.ts`.

**Interfaces:** Produce `searchSatellites(catalog: SatelliteCatalog, query: string, limit: number): SatelliteMetadata[]`, `getSatelliteDetails(catalog: SatelliteCatalog, id: string): SatelliteMetadata | null`, `getCurrentPosition(catalog: SatelliteCatalog, id: string, at?: Date): { satellite: SatelliteMetadata; position: SatellitePosition; elementEpoch: string; elementAgeDays: number } | null`, and `validateSceneAction(catalog: SatelliteCatalog, input: unknown): ChatSceneAction | null`. `ChatSceneAction` is `{ type: 'selectSatellite'; id: string } | { type: 'patchFilters'; patch: Partial<ChatFilters> } | { type: 'resetFilters' }`, where `ChatFilters` matches the frontend's three arrays.

- [ ] **Step 1: Write the catalog tests.** Assert case-insensitive name/NORAD/object-ID search and a maximum of 20 results; an unknown ID returns `null`; on-demand position uses the supplied `at` even with live refresh disabled; a propagation failure is preserved; element epoch and age are returned; invalid selection and unavailable filter values return `null`:

  ```ts
  expect(searchSatellites(catalog, 'iss', 20).map(({ id }) => id)).toContain('25544')
  expect(getSatelliteDetails(catalog, 'missing')).toBeNull()
  expect(validateSceneAction(catalog, { type: 'selectSatellite', id: 'missing' })).toBeNull()
  expect(validateSceneAction(catalog, { type: 'patchFilters', patch: { countryCodes: ['UNKNOWN'] } })).toBeNull()
  ```
- [ ] **Step 2: Run the tests red.** `npm --workspace apps/api run test -- chatCatalogTools.test.ts`; expect missing exports.
- [ ] **Step 3: Implement the four exports** using `catalog.getSatellites()` and `catalog.getPosition(id, at ?? new Date())`. Match the existing frontend search fields, trim input, keep `limit` in `1..20`, and use available orbit classes/object types/country codes to validate every `patchFilters` value. Do not compute passes.
- [ ] **Step 4: Run the focused tests and API typecheck.** Both must pass. The returned epoch and age must let the agent describe old elements without claiming precise live tracking.

### Task 3: Local-only model endpoint

**Files:** Create `apps/api/src/services/chatService.ts`, `apps/api/src/services/chatService.test.ts`, `apps/api/src/routes/chat.routes.ts`, `apps/api/src/routes/chat.routes.test.ts`; modify `apps/api/src/app.ts`, `server.ts`, `config.ts`, `apps/api/package.json`, root `package-lock.json`, `docker-compose.dev.yml`, `.env.example`.

**Interfaces:** Produce `ChatRequest = { messages: Array<{ role: 'user' | 'assistant'; content: string }>; context: { selectedSatelliteId: string | null; filters: ChatFilters } }`, `ChatReply = { text: string; actions: ChatSceneAction[]; searchResults: SatelliteMetadata[]; positionNotices: Array<{ id: string; elementEpoch: string; elementAgeDays: number }> }`, `ChatService = { run(request: ChatRequest, signal: AbortSignal): Promise<ChatReply> }`, `createChatService(catalog: SatelliteCatalog, model: LanguageModel): ChatService`, `createOpenAiChatService(catalog: SatelliteCatalog, options: { apiKey: string; model: string }): ChatService`, and `createChatRouter({ catalog, enabled, service }: { catalog: SatelliteCatalog; enabled: boolean; service: ChatService | null }): Router`. Mount at `POST /api/agent/chat`. Task 4 duplicates only the wire types locally, following this repo's type convention.

- [ ] **Step 1: Write route tests with a fake `ChatService`.** Assert disabled flag and `NODE_ENV=production` return 404 without calling it; enabled but unconfigured returns 503; valid request returns the service's `ChatReply`; unsupported roles, more than 12 messages, any content over 2,000 characters, non-user final message, unknown selected ID, and unknown filter values return 400 before calling it:

  ```ts
  expect((await request(disabledApp).post('/api/agent/chat').send(validRequest)).status).toBe(404)
  expect((await request(enabledApp).post('/api/agent/chat').send({ ...validRequest, messages: [] })).status).toBe(400)
  expect(fakeService.run).not.toHaveBeenCalled()
  ```
- [ ] **Step 2: Run the route tests red.** `npm --workspace apps/api run test -- chat.routes.test.ts`; expect missing router or failing status assertions.
- [ ] **Step 3: Install server dependencies.** Run `npm install --workspace apps/api ai@^7 @ai-sdk/openai zod@^4`; confirm `apps/api/package.json` and the root lockfile change, with no new workspace.
- [ ] **Step 4: Implement request validation and gating** in `chat.routes.ts` and `app.ts`, with `config.ts`/`server.ts` reading the server flag and credentials. Reject history over 12 plain-text messages and malformed context before a model call; use Task 2's catalog lookup and filter validation for the context. Abort a running request if the response connection closes.
- [ ] **Step 5: Write `chatService.test.ts`** using AI SDK's `MockLanguageModelV3` from `ai/test`: a mocked position-tool call for `25544` yields a `positionNotices` entry with the fixture epoch, a mocked invalid `selectSatellite` call yields no scene action, and “When will the ISS pass over San Diego?” returns a fixed unsupported-capability answer without calling the model. Run `npm --workspace apps/api run test -- chatService.test.ts` and expect the tests to fail before the service exists.
- [ ] **Step 6: Implement `createChatService` and `createOpenAiChatService`** with AI SDK `generateText`, `@ai-sdk/openai`, Zod tool schemas, `stepCountIs(5)`, and `abortSignal`. Expose only `searchSatellites`, `getSatelliteDetails`, `getCurrentPosition`, `selectSatellite`, `patchFilters`, and `resetFilters`; execute through Task 2's functions. Collect at most three validated scene actions, at most 20 search results, and one deterministic `positionNotices` entry for each position lookup. Recognize explicit access/pass, ground-station visibility, footprint, coverage, and radio-contact requests before the model call and return the fixed capability message with empty actions; also instruct the model these capabilities are unavailable. Return a plain JSON `ChatReply` in this milestone.
- [ ] **Step 7: Wire local configuration** through `docker-compose.dev.yml` and document it in `.env.example` without secrets: `LYNX_CHAT_ENABLED=false`, `VITE_LYNX_CHAT_ENABLED=false`, `OPENAI_API_KEY=`, `OPENAI_MODEL=`. Pass the first, third, and fourth values only to the API container, and the Vite flag only to the frontend container. The Docker/Render production route remains unavailable even if a key is configured.
- [ ] **Step 8: Run API tests, typecheck, and build.** All must pass. A local smoke request with flags on and a real key is optional when credentials are available; never put the key in test output.

### Task 4: assistant-ui conversation and shared state bridge

**Files:** Create `apps/frontend/src/lib/chatClient.ts`, `apps/frontend/src/lib/chatActions.ts`, `apps/frontend/src/lib/chatActions.test.ts`, `apps/frontend/src/components/chat/ChatPanel.tsx`, `apps/frontend/src/components/chat/ChatPanel.test.tsx`; modify `apps/frontend/src/routes/index.tsx`, `apps/frontend/package.json`, root `package-lock.json`, `README.md`, `docs/ARCHITECTURE.md`.

**Interfaces:** Produce `sendChat(request: ChatRequest, signal: AbortSignal): Promise<ChatReply>` using `VITE_API_URL`; `applyChatActions(actions: ChatSceneAction[], current: { selectedSatelliteId: string | null; filters: SatelliteFilters }, satellites: SatelliteMetadata[]): { selectedSatelliteId: string | null; filters: SatelliteFilters }`; and `ChatPanel` props `{ satellites, catalogReady, selectedSatelliteId, filters, onSelectSatellite, onFiltersChange }` using the types already defined in the frontend.

- [ ] **Step 1: Write action tests.** Assert valid selection and filter patches update state, `resetFilters` clears all three categories, unknown IDs/values leave state unchanged, a patch preserves unspecified categories, and selecting an object excluded by current filters clears only the conflicting filter categories so it becomes visible. Add a `ChatPanel` test that a search result choice calls the shared selection callback, position notices render with epoch and age, and the composer is disabled while `catalogReady` is false:

  ```ts
  expect(applyChatActions([{ type: 'selectSatellite', id: 'missing' }], current, satellites)).toEqual(current)
  expect(applyChatActions([{ type: 'patchFilters', patch: { orbitClasses: ['LEO'] } }], current, satellites).filters.countryCodes).toEqual(current.filters.countryCodes)
  ```
- [ ] **Step 2: Run the focused tests red.** `npm --workspace apps/frontend run test -- chatActions.test.ts ChatPanel.test.tsx`; expect missing imports.
- [ ] **Step 3: Install the chat UI dependency.** Run `npm install --workspace apps/frontend @assistant-ui/react`; confirm `apps/frontend/package.json` and the root lockfile change.
- [ ] **Step 4: Implement the client and action reducer.** Duplicate only the JSON wire types, check `response.ok`, pass `AbortSignal`, send only the last 12 text messages, validate returned actions against the loaded catalog, and apply accepted actions in order. A valid `selectSatellite` action clears only filter categories that would hide its target. The parent route uses the same selection/filter callbacks for manual controls and chat.
- [ ] **Step 5: Implement `ChatPanel`** with `@assistant-ui/react` `useLocalRuntime`, `AssistantRuntimeProvider`, and unstyled Thread/Message/Composer primitives themed with Lynx tokens. The adapter sends text-only history and the latest selected ID/filters to `sendChat`, shows errors, supports cancel, and applies `ChatReply` actions on completion. Show suggested prompts, selectable `searchResults`, and deterministic `positionNotices` in the pane; do not instantiate assistant-ui when the feature flag is off.
- [ ] **Step 6: Replace Task 1's placeholder** in `GlobePage` with `ChatPanel`. Keep the existing search/filter controls and selected-satellite details synchronized with chat actions and globe clicks. Add a visible reset action for active filters.
- [ ] **Step 7: Update README and architecture docs** with the local opt-in, `POST /api/agent/chat`, current capability limits, and the production-off behavior.
- [ ] **Step 8: Run verification.** `npm --workspace apps/frontend run test`, frontend lint/build, API tests/typecheck/build. With local flags and a model key, manually try “Show the ISS,” “Show LEO satellites,” “Which satellite is selected?”, ambiguous search, missing satellite, stale elements, chat cancellation, and panel collapse/mobile layout. With flags off, verify the existing globe view and a 404 chat route.

## Self-Review

- Spec coverage: Task 1 covers split layout and preserved globe; Task 2 covers trusted data/actions; Task 3 covers model, local gate, errors; Task 4 covers assistant-ui, synchronized state, and docs. Ground-station work remains out of scope.
- Interfaces: API and frontend use the same `ChatRequest`/`ChatReply` JSON names and `ChatSceneAction` variants, duplicated locally per repository convention. The three filter arrays are `orbitClasses`, `objectTypes`, and `countryCodes` in both; `catalogReady` comes from `satellitesQuery.isSuccess`.
- Review focus: the five conditions above have tests in their owning tasks. Visual resize and mobile layout also get a browser check because jsdom does not measure canvas layout.
