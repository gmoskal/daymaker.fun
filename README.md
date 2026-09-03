# Sidequest — DayOps for real life

> Your day changed. Your plan should too.

Sidequest is a local-first live plan shared by people and their browser agent. A person can mark what happened; an agent can read that same mission, adapt it to new constraints, research replacements, and write the result back to the visible board.

This repository implements the Baška Voda demo for [The WebMCP Challenge](https://webmcp.devpost.com/).

## Submission status

- Production URL: [sidequest-webmcp-eta.vercel.app](https://sidequest-webmcp-eta.vercel.app)
- Public repository: [github.com/gmoskal/sidequest-webmcp](https://github.com/gmoskal/sidequest-webmcp)
- Demo video: pending
- License: MIT
- Submission language: English

The application, tests, screenshots, license, hosting configuration, public repository, and production deployment are complete. Automatic GitHub deployments are being connected; a public YouTube demo under three minutes remains pending.

## Why WebMCP

A normal travel assistant can describe a revised day in chat. Sidequest uses WebMCP because the valuable result is durable shared state: the timeline, map, locked dinner, revision, and audit log all update in the page the group is already using.

- Human controls and agent tools dispatch the same typed domain actions.
- The agent receives stable stop IDs, constraints, coordinates, sources, and the latest revision.
- Every write is optimistic-concurrency safe and visible immediately.
- The 18:30 dinner is a locked invariant, not a sentence the model is merely asked to remember.
- Without WebMCP, the complete manual UI still works.

The implementation uses the imperative top-level `document.modelContext.registerTool` API. No tool is registered from an iframe and no declarative tool markup is required.

## The five tools

| Tool | Purpose |
| --- | --- |
| `get_mission_state` | Read the compact current mission, revision, stop IDs, constraints, route data, locks, and sources. |
| `update_day_context` | Update current time, position, energy, and constraints. |
| `update_mission_stop` | Mark an unlocked stop planned, active, completed, or skipped. |
| `add_mission_stop` | Add one researched stop with coordinates, timing, travel estimate, rationale, and HTTPS source. |
| `reorder_mission_stops` | Reorder every future stop while preserving locked commitment times. |

All inputs are strict Zod schemas. Every write requires `expectedRevision`; stale, malformed, oversized, and invariant-breaking writes return controlled errors without changing storage. Tool names, descriptions, parameters, and serialized results are tested against current WebMCP size guidance.

## Demo flow

1. Open the seeded mission at revision 6.
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

Key files:

- `src/domain/mission.ts` — schemas and action/result unions
- `src/domain/mission-transition.ts` — invariants and pure transitions
- `src/store.ts` — persistence, subscriptions, and accepted-mutation publishing
- `src/webmcp.ts` — one catalog and the five imperative tool registrations
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

Open the printed local URL. The seeded mission persists in `localStorage`; **Reset demo** restores revision 6.

The route view renders a Google Maps preview without adding a map library to the bundle. Set `VITE_GOOGLE_MAPS_EMBED_KEY` to use the official Google Maps Embed API endpoint; otherwise the preview uses Google's public embed URL. Clicking the preview opens the selected item in Google Maps, and the adjacent action can open it in Apple Maps instead.

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

Sidequest is intentionally a focused hackathon prototype: one deterministic mission, local browser persistence, English UI, a Google Maps location preview, and no authentication or multi-user sync. It does not provide live GPS, live weather, turn-by-turn directions, reservations, automatic web research, or a custom chat interface. Google and Apple Maps require network access and open outside Sidequest for full map interaction.

WebMCP remains progressive enhancement. Actual discovery in ChatGPT/Chrome, the demo video, and Devpost submission are manual release steps.

## References

- [OpenAI Site Tools documentation](https://learn.chatgpt.com/docs/webmcp)
- [Chrome WebMCP imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
- [WebMCP draft specification](https://webmachinelearning.github.io/webmcp/)
- [The WebMCP Challenge](https://webmcp.devpost.com/)

## License

[MIT](LICENSE) © 2026 Sidequest contributors.
