# Sidequest — DayOps for real life

> Your day changed. Your plan should too.

Sidequest turns ordinary travel needs into an editable planning brief and a source-backed schedule. The person writes or clicks together **Needs**; ChatGPT structures them, researches suitable places, and writes a fresh, read-only **Proposed schedule** to the Sidequest page it opens through WebMCP Site Tools.

This repository is an English-only entry for [The WebMCP Challenge](https://webmcp.devpost.com/).

## Submission status

- Production URL: [daymaker.fun](https://daymaker.fun)
- Public repository: [github.com/gmoskal/sidequest-webmcp](https://github.com/gmoskal/sidequest-webmcp)
- Local release: v0.4.0
- Production deployment: v0.3.3 live; v0.4.0 pending deployment
- Automatic Git deployments: pending GitHub/Vercel repository permission
- Demo video: pending
- License: MIT

## How to use it

1. Open **Needs** and describe what the plan must accomplish. This initial description is required; the placeholder shows a complete example.
2. Choose **Quick**, **Normal**, or **Deep** research above **Copy to ChatGPT**, then copy and paste the self-contained handoff into ChatGPT on mobile or desktop. Normal is the default; the device remembers the last selection.
3. ChatGPT continues in Work and opens the one-shot public Sidequest `/needs?new=1` planning URL. The page clears any unrelated browser-local board itself before registering Site Tools, consumes the marker, and leaves the canonical URL at `/needs`.
4. ChatGPT reads that new blank board, initializes it from the copied input, asks concise questions only if an essential fact is missing, researches suitable places, and writes the best-fitting **Proposed schedule**. Every successful Site Tool write returns the complete updated session as a portable link, so ChatGPT finishes with a clickable **Open updated Sidequest plan** link.
   Questions, progress updates, and the final answer use the language of your request; Sidequest keeps proper names, sources, tool values, and the session link unchanged.
5. After that first update, the description disappears and the structured Needs become the working surface. Add, rename, cross out, remove, reorder, or mark a need **Must keep** / **Can adapt**.
6. There are two ways to iterate. Edit Needs on the board, choose **Copy changes to ChatGPT**, and paste the update back into the chat; or describe what should change directly in ChatGPT. The handoff carries the same session ID and the human Needs delta, so ChatGPT preserves unaffected stops and updates only what depends on the change. A mismatched ID starts a new session instead of touching an unrelated plan.
7. **Proposed schedule** stays disabled until ChatGPT has set the planning context. Open it to review the generated title, date, primary city/area, and items. The proposal is read-only for people: click anywhere on one or more rows to expand details and map links. The complete proposal also has one Google Maps route.
8. As soon as structured Needs exist, their top-left **Copy link to share** action exports the current board. Proposed schedule exposes the same action next to **Iteration N**. Use either self-contained link on another device or share it with friends. Individual tool writes do not inflate the iteration count.

The small **About** link in the footer opens `/about` with the complete four-step workflow and an explanation of in-memory boards and portable session links.

**Load demo** contains two input examples, not prebuilt schedules:

- **Palermo arrival** — a fictional route starting at Palermo Airport, with car rental, breakfast and coffee, one nearby sight, parking, and a fixed Hotel Trinacria arrival.
- **South Croatia gravel day** — a fictional route starting at Grand Hotel Slavia, with a shaded 20 km gravel ride, limited driving, quiet roads, a restaurant, snorkeling, parking, and a calculated return time.

## Why WebMCP

A normal assistant can return an itinerary as chat text. Sidequest makes the input directly editable and the generated result durable:

- the page and agent share one typed mission store;
- the agent can read the latest brief, fixed needs, stop IDs, locks, places, sources, and revision;
- every accepted tool write appears immediately in the page opened by Work and updates the real footer timestamp;
- every successful read or write returns a gzip-compressed session link representing that exact revision;
- complete proposal replacements advance a separate human-facing iteration number exactly once;
- every write uses optimistic concurrency, so stale agents cannot silently overwrite newer human changes;
- the Needs editor and proposal review still work without WebMCP.

Sidequest is not a chat client and does not run a remote MCP server. ChatGPT remains the language and research surface. The open page registers five imperative `document.modelContext.registerTool` tools and acts as the shared planning artifact.

## The five tools

| Tool | Purpose |
| --- | --- |
| `get_mission_state` | Read the live brief, structured needs, revision, proposed stops, locks, places, and sources. |
| `update_day_context` | Structure the brief into fixed or flexible needs; `replacePlan: true` starts clean while `false` keeps the current session and schedule. |
| `update_mission_stop` | Mark an unlocked proposal item planned, active, completed, skipped, or remove it when it became obsolete. |
| `add_mission_stop` | Add one researched item with time, coordinates, travel estimate, rationale, and an HTTPS source. |
| `reorder_mission_stops` | Reorder all future items while preserving locked commitment times. |

All inputs use strict Zod schemas. Invalid, stale, oversized, or invariant-breaking writes return controlled errors without changing storage.

## Architecture

```text
Free-form brief ─┐
Editable Needs ──┼─> MissionAction -> pure transition -> MissionStore
WebMCP tools ────┘                                  │
                                                   ├─> in-memory tab session
                                                   └─> presenter -> React + Motion
                                                                          │
                                                                          └─> Google / Apple Maps
```

`Mission` is the only plan-domain source of truth, including the `brief` or `needs` planning stage. React owns transient view state, while the independent research-depth preference is the only workflow value stored locally for the device. Human controls and WebMCP tools dispatch their permitted subsets of the same action union through the same transition gate. People edit Needs; WebMCP generates and revises the Proposed schedule.

Key files:

- `src/domain/mission.ts` — schemas and action/result unions
- `src/domain/mission-transition.ts` — pure transitions and invariants
- `src/domain/seed.ts` — blank state, two Needs examples, and a test fixture
- `src/store.ts` — in-memory state and subscriptions
- `src/session-link.ts` — validated JSON → gzip → base64url session snapshots
- `src/webmcp.ts` — the five Site Tool registrations
- `src/mission-prompt.ts` — the Needs-only ChatGPT handoff
- `src/research-depth.ts` — the three prompt contracts and persisted device preference
- `src/map-links.ts` — Google and Apple Maps URL builders
- `src/view-model.ts` — pure `Mission + ViewState -> MissionScreen` projection
- `src/useMissionViewModel.ts` — React action adapter
- `src/App.tsx` and `src/MissionWorkspace.tsx` — minimal UI, Motion Needs reorder, and schedule expansion

### State and session identity

There is no account or backend session. Each open document owns one mission in memory. Opening a bare page, choosing **New plan**, or choosing **Load demo** creates a fresh session ID. Opening a portable link loads the exact session ID and state embedded in that link. Separate tabs are therefore independent and cannot overwrite one another. Only the Effort preference uses `localStorage`.

WebMCP tools close over the live store belonging to the open document. A human edit on that board is visible to the next `get_mission_state`. Every successful tool result includes a `sessionUrl` for the resulting revision. The copied protocol requires ChatGPT to render the final one as a clickable link instead of merely saying to open the proposal.

A session link serializes the complete canonical `Mission` as JSON, encodes it as UTF-8, compresses it with gzip, and stores unpadded base64url in `#session=...`. Opening it validates the payload with `MissionSchema`, loads it into that tab's memory, and keeps the fragment so reloading the shared URL restores the same snapshot. That makes the link a self-contained cross-device and person-to-person snapshot without a server. The recipient gets an independent copy; later edits do not live-sync, and a new snapshot link represents each new revision.

The page cannot proactively start a new turn in an already open ChatGPT conversation. After a human changes Needs, **Copy changes to ChatGPT** is the explicit handoff; the next agent turn reads the live board before writing. Automatic reverse notifications would require a shared backend and a ChatGPT integration with an event channel.

Already-open tabs do not live-sync in this prototype by design. Use the newest snapshot link to hand a revision to another device or person. Real-time collaboration still requires a backend.

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

The browser tests cover the two-example menu, long free-form and structured Needs editing, three-level research selection and persistence, new-versus-update clipboard handoffs, five-tool generation, gzip session transfer, independent tabs, shared-link reloads, read-only multi-row schedule expansion, Motion animation, map links, desktop layout, and 390 px overflow.

Visual evidence:

- `artifacts/sidequest-brief.png`
- `artifacts/sidequest-brief-mobile.png`
- `artifacts/sidequest-needs.png`
- `artifacts/sidequest-needs-add-mobile.png`
- `artifacts/sidequest-needs-schedule.png`
- `artifacts/sidequest-needs-schedule-mobile.png`

## Manual browser checks

Automated tests use a native-shaped `document.modelContext.registerTool` harness. Before submission:

- [x] Host a production build on a public HTTPS URL.
- [x] Deploy v0.2.2 and verify the production asset.
- [x] Deploy v0.2.3 and verify the read-only schedule asset.
- [x] Deploy v0.2.4 and verify portable session transfer in a separate browser context.
- [x] Deploy v0.2.5 and verify the response-language contract in the public asset.
- [x] Deploy v0.2.6 and verify `daymaker.fun` over HTTPS.
- [x] Deploy v0.2.7 and verify the two-way feedback handoff plus plan iteration utility.
- [x] Deploy v0.2.8 and verify immediate replacement of an unrelated live proposal.
- [x] Deploy v0.2.9 and verify the one-shot local reset, structured-Needs share link, and fictional demo marker.
- [x] Deploy v0.3.0 and verify Quick / Normal / Deep prompt contracts plus local preference persistence.
- [x] Deploy v0.3.1 and verify the compact pointer-draggable research control.
- [x] Deploy v0.3.2 and verify the final Effort control, spacing, and clipboard fallback.
- [x] Deploy v0.3.3 and verify chronological schedule/map output plus copied-state resets.
- [ ] Deploy v0.4.0 and verify isolated in-memory sessions plus delta updates.
- [ ] Open the production page in ChatGPT with Site Tools and paste a copied Needs handoff.
- [ ] Confirm all five tools are discoverable in a compatible Chrome build.
- [ ] Confirm the generated proposal updates visibly and a returned snapshot link survives reload.
- [ ] Confirm ChatGPT renders the final returned `sessionUrl` as a clickable **Open updated Sidequest plan** link.
- [ ] Confirm a stale revision is rejected and copied fixed requirements are recreated without retaining unrelated old stops.
- [ ] Check per-item Google/Apple Maps and the complete Google Maps schedule.
- [x] Verify the local build at desktop and 390 px widths.

## Security and privacy

- Planning data stays in the browser; there is no backend, account, analytics, or custom LLM call.
- A session URL is a bearer snapshot, not encryption: anyone holding the link can decode and read its complete embedded plan. Share it accordingly.
- Session data is stored in the URL fragment and is not included in the HTTP request sent to Vercel.
- Strict schemas allowlist tool input; text containing HTML delimiters is rejected.
- Source URLs require HTTPS and open with `noopener noreferrer`.
- Completed and skipped items remain auditable but are excluded from the map schedule.
- One abort signal owns the complete tool registration lifecycle.
- Hosting policies include CSP, permissions policy, MIME protection, referrer policy, and clickjacking protection.

## Limitations

Sidequest is a focused hackathon prototype: one in-memory plan per tab, portable snapshot links, two optional Needs examples, an English UI, and outbound map links. It does not provide accounts, real-time collaboration, live tab sync, GPS tracking, reservations, turn-by-turn directions, or its own chat interface. ChatGPT performs research; Google and Apple Maps require network access.

## References

- [OpenAI Site Tools documentation](https://learn.chatgpt.com/docs/webmcp)
- [Chrome WebMCP imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
- [WebMCP draft specification](https://webmachinelearning.github.io/webmcp/)
- [The WebMCP Challenge](https://webmcp.devpost.com/)

## License

[MIT](LICENSE) © 2026 Sidequest contributors.
