# Sidequest — DayOps for real life

> Your day changed. Your plan should too.

Sidequest turns ordinary travel needs into an editable, source-backed schedule. The person writes or clicks together **Needs**; ChatGPT structures them, researches suitable places, and writes a fresh **Proposed schedule** back to the same page through WebMCP Site Tools.

This repository is an English-only entry for [The WebMCP Challenge](https://webmcp.devpost.com/).

## Submission status

- Production URL: [sidequest-webmcp-eta.vercel.app](https://sidequest-webmcp-eta.vercel.app)
- Public repository: [github.com/gmoskal/sidequest-webmcp](https://github.com/gmoskal/sidequest-webmcp)
- Local release: v0.2.1
- Production deployment: v0.2.1 live
- Automatic Git deployments: pending GitHub/Vercel repository permission
- Demo video: pending
- License: MIT

## How to use it

1. Open **Needs** and describe what the plan must accomplish. This initial description is required; the placeholder shows a complete example.
2. Choose **Copy to ChatGPT** and paste the result into a conversation that can open Sidequest with Site Tools.
3. ChatGPT asks concise questions if an essential fact is missing. Otherwise it extracts an editable Needs list, researches suitable places, and writes the best-fitting **Proposed schedule** back to the page.
4. After that first update, the description disappears and the structured Needs become the working surface. Add, rename, cross out, remove, reorder, or mark a need **Fixed**.
5. A human Needs edit unlocks **Copy changes to ChatGPT**. Paste it to regenerate the proposal. Changes made directly by ChatGPT already appear on the page and do not require another copy.
6. **Proposed schedule** stays disabled until ChatGPT has set the planning context. Open it to review the plan date, starting location, and generated items. Each item opens its place in Google Maps or Apple Maps; the schedule also has one complete Google Maps route.

**Load demo** contains two input examples, not prebuilt schedules:

- **Palermo arrival** — airport car rental, breakfast and coffee, one nearby sight, parking, and a fixed 16:00 Hotel Trinacria check-in.
- **South Croatia gravel day** — a 20 km shaded gravel ride before 10:00, limited driving, no main roads, a restaurant, snorkeling, parking, and a calculated return time.

## Why WebMCP

A normal assistant can return an itinerary as chat text. Sidequest makes the result durable and directly editable:

- the page and agent share one typed mission store;
- the agent can read the latest brief, fixed needs, stop IDs, locks, places, sources, and revision;
- every accepted tool write appears immediately in the visible page and persists locally;
- every write uses optimistic concurrency, so stale agents cannot silently overwrite newer human changes;
- the full manual UI still works without WebMCP.

Sidequest is not a chat client and does not run a remote MCP server. ChatGPT remains the language and research surface. The open page registers five imperative `document.modelContext.registerTool` tools and acts as the shared planning artifact.

## The five tools

| Tool | Purpose |
| --- | --- |
| `get_mission_state` | Read the live brief, structured needs, revision, proposed stops, locks, places, and sources. |
| `update_day_context` | Structure the brief into fixed or flexible needs and replace the unlocked proposal while preserving locked commitments. |
| `update_mission_stop` | Mark an unlocked proposal item planned, active, completed, or skipped. |
| `add_mission_stop` | Add one researched item with time, coordinates, travel estimate, rationale, and an HTTPS source. |
| `reorder_mission_stops` | Reorder all future items while preserving locked commitment times. |

All inputs use strict Zod schemas. Invalid, stale, oversized, or invariant-breaking writes return controlled errors without changing storage.

## Architecture

```text
Free-form brief ─┐
Editable Needs ──┼─> MissionAction -> pure transition -> MissionStore
WebMCP tools ────┘                                  │
                                                   ├─> localStorage
                                                   └─> presenter -> React + Motion
                                                                          │
                                                                          └─> Google / Apple Maps
```

`Mission` is the only domain source of truth, including the persisted `brief` or `needs` planning stage. React owns only transient view state. Human controls and WebMCP tools dispatch the same action union through the same transition gate.

Key files:

- `src/domain/mission.ts` — schemas and action/result unions
- `src/domain/mission-transition.ts` — pure transitions and invariants
- `src/domain/seed.ts` — blank state, two Needs examples, and a test fixture
- `src/store.ts` — persistence and subscriptions
- `src/webmcp.ts` — the five Site Tool registrations
- `src/mission-prompt.ts` — the Needs-only ChatGPT handoff
- `src/map-links.ts` — Google and Apple Maps URL builders
- `src/view-model.ts` — pure `Mission + ViewState -> MissionScreen` projection
- `src/useMissionViewModel.ts` — React action adapter
- `src/App.tsx` and `src/MissionWorkspace.tsx` — minimal UI and Motion reorder boundary

### State and session identity

There is no account or backend session. The app reads one mission from `sidequest:mission:v1` in `localStorage`. Each accepted human or agent mutation updates memory and persists the same mission. State survives reloads on the same origin and browser profile; another browser, device, private window, or profile has a separate plan.

WebMCP tools close over the live store belonging to the open document. A human edit is visible to the next `get_mission_state`. Copied JSON is only a conversation snapshot; the agent must read the live revision before writing.

Already-open duplicate tabs do not live-sync in this prototype. Reload before switching editing between tabs. Multi-device identity and collaboration require a backend and are outside this focused build.

## Run locally

Requirements: Node.js 22.12 or newer and npm.

```bash
npm install
npm run dev
```

Open the printed local URL. Use the small **Load demo** control above the day for either sample brief, or start typing directly in **Needs**.

## Verification

```bash
npm run test
npm run build
npx playwright install chromium
npm run test:e2e
```

Run every gate with:

```bash
npm run check
```

The browser tests cover the two-example menu, free-form and structured Needs editing, clipboard handoff, five-tool generation, map links, smooth whole-item reorder, desktop layout, and 390 px overflow.

Visual evidence:

- `artifacts/sidequest-brief.png`
- `artifacts/sidequest-brief-mobile.png`
- `artifacts/sidequest-needs.png`
- `artifacts/sidequest-needs-schedule.png`
- `artifacts/sidequest-needs-schedule-mobile.png`

## Manual browser checks

Automated tests use a native-shaped `document.modelContext.registerTool` harness. Before submission:

- [x] Host a production build on a public HTTPS URL.
- [x] Deploy v0.2.1 and verify the production asset.
- [ ] Open the production page in ChatGPT with Site Tools and paste a copied Needs handoff.
- [ ] Confirm all five tools are discoverable in a compatible Chrome build.
- [ ] Confirm the generated proposal updates visibly and survives reload.
- [ ] Confirm a stale revision is rejected and locked commitments survive regeneration.
- [ ] Check per-item Google/Apple Maps and the complete Google Maps schedule.
- [x] Verify the local build at desktop and 390 px widths.

## Security and privacy

- Planning data stays in the browser; there is no backend, account, analytics, or custom LLM call.
- Strict schemas allowlist tool input; text containing HTML delimiters is rejected.
- Source URLs require HTTPS and open with `noopener noreferrer`.
- Completed and skipped items remain auditable but are excluded from the map schedule.
- One abort signal owns the complete tool registration lifecycle.
- Hosting policies include CSP, permissions policy, MIME protection, referrer policy, and clickjacking protection.

## Limitations

Sidequest is a focused hackathon prototype: one local plan, two optional Needs examples, English UI, browser persistence, and outbound map links. It does not provide accounts, live tab sync, GPS tracking, reservations, turn-by-turn directions, or its own chat interface. ChatGPT performs research; Google and Apple Maps require network access.

## References

- [OpenAI Site Tools documentation](https://learn.chatgpt.com/docs/webmcp)
- [Chrome WebMCP imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
- [WebMCP draft specification](https://webmachinelearning.github.io/webmcp/)
- [The WebMCP Challenge](https://webmcp.devpost.com/)

## License

[MIT](LICENSE) © 2026 Sidequest contributors.
