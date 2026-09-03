# Sidequest — DayOps for real life

> Your day changed. Your plan should too.

Sidequest is a local-first live plan shared by people and their browser agent. A person can mark what happened; an agent can read that same mission, adapt it to new constraints, research replacements, and write the result back to the visible board.

This repository implements the Baška Voda killer flow plus San Francisco and Barcelona sample missions for [The WebMCP Challenge](https://webmcp.devpost.com/).

## Submission status

- Production URL: [sidequest-webmcp-eta.vercel.app](https://sidequest-webmcp-eta.vercel.app)
- Public repository: [github.com/gmoskal/sidequest-webmcp](https://github.com/gmoskal/sidequest-webmcp)
- Demo video: pending
- License: MIT
- Submission language: English

The application, tests, screenshots, license, hosting configuration, public repository, and production deployment are complete. Production deploys use the Vercel CLI; automatic GitHub deployments require repository access for the Vercel GitHub app. A public YouTube demo under three minutes remains pending.

## Why WebMCP

A normal travel assistant can describe a revised day in chat. Sidequest uses WebMCP because the valuable result is durable shared state: the timeline, map, locked dinner, revision, and audit log all update in the page the group is already using.

- Human controls and agent tools dispatch the same typed domain actions.
- The agent receives stable stop IDs, constraints, coordinates, sources, and the latest revision.
- Every write is optimistic-concurrency safe and visible immediately.
- The 18:30 dinner is a locked invariant, not a sentence the model is merely asked to remember.
- Without WebMCP, the complete manual UI still works.

The implementation uses the imperative top-level `document.modelContext.registerTool` API. No tool is registered from an iframe and no declarative tool markup is required.

Sidequest is not a chat client and it does not run a remote MCP server. The conversation remains in ChatGPT. When ChatGPT opens the Sidequest page in a Site Tools-capable browser, the page exposes five WebMCP tools to that conversation. ChatGPT is the input and reasoning surface; Sidequest is the durable plan that both the person and the agent can read and update.

## Start with a real plan

1. Open the production URL. A first visit starts with an empty plan for the current day, not the Baška Voda fixture.
2. Rename `Untitled plan` inline.
3. Either add the first item manually with `+`, or open **Context**, click **Copy full context for ChatGPT**, and paste it into ChatGPT. The handoff includes the production URL, task instruction, revision, title, timezone, constraints, stops, locks, sources, and history.
4. Tell ChatGPT the goal, location, available time, energy, and hard constraints. It can atomically start a titled plan, research options, add items, and reorder the board through the same five tools.
5. Open an item with its chevron, use `…` to reveal the shared horizontal action tray, and lock commitments the agent must preserve. Manual controls continue to work in a normal browser without WebMCP.

**Load demo** opens a compact catalog: Baška Voda demonstrates live replanning, San Francisco demonstrates errands with opening windows, and Barcelona demonstrates source-backed specialty coffee, beach, and timed-ticket planning. A loaded sample changes the action to **New plan**.

## The five tools

| Tool | Purpose |
| --- | --- |
| `get_mission_state` | Read the compact current mission, revision, stop IDs, constraints, route data, locks, and sources. |
| `update_day_context` | Set title, timezone, current context, and constraints; update the current plan or atomically replace it with a fresh one. |
| `update_mission_stop` | Mark an unlocked stop planned, active, completed, or skipped. |
| `add_mission_stop` | Add one researched stop with coordinates, timing, travel estimate, rationale, and HTTPS source. |
| `reorder_mission_stops` | Reorder every future stop while preserving locked commitment times. |

All inputs are strict Zod schemas. Every write requires `expectedRevision`; stale, malformed, oversized, and invariant-breaking writes return controlled errors without changing storage. Tool names, descriptions, parameters, and serialized results are tested against current WebMCP size guidance.

## Demo flow

1. Choose **Load demo**, then **Baška Voda · plan disruption**, to load the seeded mission at revision 6.
2. Use the visible **Done** control on “Forest gravel loop” — revision 7 proves the human path.
3. Give the browser agent this prompt:

> We are in Baška Voda and our day changed. Read the current Sidequest mission. The gravel ride is complete, we are low on energy, and the Biokovo hike is no longer a good fit. Use reliable sources to find a relaxed swim stop and a fuel stop within our constraints. Keep our 18:30 dinner unchanged. Make the required updates with the available site tools and update the Sidequest board, not just the chat.

4. The intended outcome is revision 12: low energy, hike skipped, researched Punta Rata and INA stops added, future route reordered, and dinner still locked at 18:30.

## Architecture

```text
Human controls ─┐
                ├─> MissionAction -> pure domain transition -> MissionStore
WebMCP tools ───┘                                      │
                                                      ├─> localStorage
                                                      └─> pure presenter -> React + Motion
                                                                                  │
                                                                                  └─> Google / Apple Maps
```

`Mission` is the only domain source of truth. React owns only view state such as selection and copy feedback. The WebMCP adapter validates external input and dispatches the same action union as the UI; it cannot mutate the mission directly.

### State and session identity

The prototype has no account or server session. On page load it reads one mission from the `sidequest:mission:v1` key in `localStorage`; every accepted human or agent mutation updates the in-memory store and persists that same mission. The data therefore survives reloads in the same browser profile and origin, while another browser, profile, device, or private window has its own independent plan.

WebMCP tools are registered against the currently open document and close over its live store. A human edit in that page is immediately visible to the next `get_mission_state` call. Every write requires the latest `revision`; a stale write is rejected and the agent must read again before retrying. The copied JSON is explicitly only a snapshot for conversation context, never the authority for a later write.

Already-open duplicate tabs do not live-sync in this P0. Each tab keeps its own in-memory snapshot and the last accepted write persists to `localStorage`; reload before switching editing between tabs. Cross-device, multi-user, and concurrent-tab identity would require a backend session or synchronization layer and are intentionally outside this hackathon build.

Key files:

- `src/domain/mission.ts` — schemas and action/result unions
- `src/domain/mission-transition.ts` — invariants and pure transitions
- `src/store.ts` — persistence, subscriptions, and accepted-mutation publishing
- `src/webmcp.ts` — one catalog and the five imperative tool registrations
- `src/mission-prompt.ts` — complete live mission snapshot for the ChatGPT handoff
- `src/view-model.ts` — pure `Mission + ViewState -> MissionScreen` projection
- `src/useMissionViewModel.ts` — React adapter from `ViewAction` to domain actions
- `src/App.tsx` and `src/MissionWorkspace.tsx` — minimal renderer and Motion reorder boundary
- `src/MissionMap.tsx` — Google Maps preview plus Google/Apple outbound links

## Run locally

Requirements: Node.js 22.12 or newer and npm.

```bash
npm install
npm run dev
```

Open the printed local URL. A first visit starts with a blank plan, and subsequent changes persist in `localStorage`. Use **Load demo** to choose one of the three samples or **New plan** to return to a fresh board.

The route view renders a Google Maps preview without adding a map library to the bundle. Set `VITE_GOOGLE_MAPS_EMBED_KEY` to use the official Google Maps Embed API endpoint; otherwise the preview uses Google's public embed URL. Clicking the preview opens the selected item in Google Maps; adjacent actions open that item in Apple Maps or the entire ordered plan in Google Maps.

## Verification

```bash
npm run test
npm run build
npx playwright install chromium
npm run test:e2e
```

Or run every automated gate:

```bash
npm run check
```

The tests cover domain invariants, stale writes, persistence recovery, exact tool registration, partial-registration cleanup, the full revision 7→12 sequence, React manual controls, secure source links, responsive browser rendering, and the 1,500-character tool-result budget.

Visual baselines are committed at:

- `artifacts/sidequest-desktop.png`
- `artifacts/sidequest-mobile.png`

## Manual browser checks

Automated tests use a native-shaped `document.modelContext.registerTool` harness. Before submission, repeat the following with the actual browser integration:

- [x] Host the production build on a public HTTPS URL.
- [ ] Open it in ChatGPT's in-app browser with Site Tools support and run the demo prompt.
- [ ] Open it in a Chrome build with WebMCP enabled and confirm all five tools are discoverable.
- [ ] Confirm every tool result updates the visible board and persists after reload.
- [ ] Confirm dinner remains locked at 18:30 and a stale revision is rejected cleanly.
- [ ] Check the public source links, Google Maps preview, and Google/Apple Maps launch actions.
- [x] Verify the deployed site at desktop and 390px mobile widths.

## Security and privacy

- Mission data stays in the browser; there is no backend, account, analytics, or custom LLM call.
- Tool input is allowlisted through strict schemas; text containing HTML delimiters is rejected.
- Source URLs must use HTTPS and render with `target="_blank"` plus `rel="noopener noreferrer"`.
- Completed and skipped stops remain auditable but are excluded from the route.
- Registration uses one abort signal so partial failure removes the full tool surface.
- Vercel and Netlify configurations supply a CSP, permissions policy, MIME protection, referrer policy, and clickjacking protection.

## Limitations

Sidequest is intentionally a focused hackathon prototype: one local plan, three optional sample missions, browser persistence, English UI, a Google Maps location preview, and no authentication or multi-user sync. It does not provide live GPS, live weather, turn-by-turn directions, reservations, automatic web research, or a custom chat interface. Google and Apple Maps require network access and open outside Sidequest for full map interaction.

WebMCP remains progressive enhancement. Actual discovery in ChatGPT/Chrome, the demo video, and Devpost submission are manual release steps.

## References

- [OpenAI Site Tools documentation](https://learn.chatgpt.com/docs/webmcp)
- [Chrome WebMCP imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
- [WebMCP draft specification](https://webmachinelearning.github.io/webmcp/)
- [The WebMCP Challenge](https://webmcp.devpost.com/)

## License

[MIT](LICENSE) © 2026 Sidequest contributors.
