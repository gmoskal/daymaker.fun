# Sidequest — DayOps for real life

> Product document and submission narrative  
> Research status: September 2, 2026  
> Submission deadline: **September 3, 2026, 22:00 CEST (GMT+2)**  
> Recommended submission name: **Sidequest**  
> Product category: **live day operations / human–agent collaboration**

## Decision in one sentence

We are building a single screen where a human and an agent maintain a day plan that reflects what has just happened in the physical world—the agent reads the current state, finds an alternative on the open web, and visibly updates the plan and map through WebMCP.

## TL;DR

Real-world plans fall apart when they meet weather, fatigue, closed venues, low fuel, or delays. A traditional planner preserves the original plan, while an agent chat produces another block of text that the user must manually transfer into a map, list, and calendar.

**Sidequest** is a shared “mission for the day.” On one screen, the human sees the context, stop order, statuses, and map. An agent visiting the page discovers five WebMCP tools. It can read the current state, update the context, change a stop's status, add a new stop, and reorder the plan. Every action immediately changes the same interface the human is watching.

Killer demo:

> “We finished the gravel ride. We're tired, so skip the hike. It is 15:10 and we're back at the car. Find a good snorkeling spot within 20 minutes, add it before dinner, and plan a fuel stop on the way. Keep dinner at 18:30.”

The agent reads Sidequest's state, researches current places and sources, marks the hike as skipped, adds a beach and fuel station, changes the order, and updates the map and timeline live. This is not another trip-plan generator. It is the operational layer for the moment when **the plan meets reality**.

## Name and positioning

### Recommendation

**Product name:** Sidequest  
**Descriptor:** DayOps for real life  
**Tagline:** Your day changed. Your plan should too.  
**Plain-English summary:** A live day plan shared by a human and an agent.

“Sidequest” is emotional, concise, and works well in an outdoor demo. “DayOps” describes the category more accurately, but sounds like a B2B tool. We therefore use it as the descriptor rather than the primary name.

### One-liner

Sidequest is a shared live mission board where people report what changed in the real world and their agent researches, replans, and updates the same visible day plan through WebMCP.

### 30-second pitch

Day plans do not break inside planning apps—they break in the real world. You finish an activity late, it gets too hot, the group is tired, or the car needs fuel. An agent can find new options, but today it usually returns text that you must copy into a map and schedule yourself. Sidequest gives the human and the agent one live object: a mission. The agent reads its current state and uses WebMCP to update the visible timeline and map. The human stays in control; the agent handles the tedious replanning.

## WHY / HOW / WHAT

### WHY — why this should exist

People do not need more perfect plans. They need plans that survive an imperfect day.

The most exhausting part of a spontaneous day is not a lack of information. It is combining information with the current context:

- where we actually are;
- how much time remains;
- what we have already completed;
- how we feel;
- what we still refuse to sacrifice;
- which new place satisfies every constraint;
- how to apply the change to the map and sequence without retyping everything.

Today's workflow is fragmented across chat, search, maps, notes, and human memory. An agent can reason and research, but without structured access to the current plan it does not know the execution state. Without structured write access, its answer remains a suggestion rather than an updated operation.

### HOW — how Sidequest solves the problem

Sidequest maintains one visible, shared representation of the day:

1. **The human updates reality** — they mark an activity as completed or tell the agent what changed.
2. **The agent reads the live state** — time, location, energy, constraints, statuses, and fixed commitments.
3. **The agent uses the open web** — it finds an alternative, checks sources, and gathers the facts required for the decision.
4. **The agent calls small WebMCP tools** — it changes the exact plan visible in the app.
5. **The human immediately sees the result** — the new order, map pins, rationale, and change history.

WebMCP is not an add-on here. It is the missing bridge between conversation and a live interface. The page does not pretend to be an agent and does not need its own model. It gives the agent well-described operations over its state.

### WHAT — what exactly we are building

A single-page web application with:

- a mission header and countdown to the next fixed commitment;
- a current-context card containing location, time, energy, and constraints;
- a day timeline with `planned`, `active`, `completed`, and `skipped` statuses;
- a map with pins and a simple line connecting the planned sequence;
- source cards attached to relevant stops;
- a short “Human / Agent changed…” activity log;
- a button that restores a deterministic demo scenario;
- five imperative WebMCP tools registered in the top-level page.

We are not building our own chat, an agent backend, turn-by-turn navigation, automatic routing, or a multi-day planner.

## The problem we are actually solving

### Job to be done

**When my day plan no longer matches reality, I want to give an agent the current state and constraints so that I can quickly get a feasible replacement plan without manually synchronizing several apps.**

### Primary pain points

- The agent knows the conversation but not the application's exact state.
- The application knows the plan but cannot use the agent's reasoning and research.
- A text response quickly becomes stale.
- The human must copy names, addresses, times, and links between apps.
- One change causes a cascade: sequence, timing, map, and remaining constraints must all be updated separately.
- In a group, it is difficult to distinguish the original plan from what was completed or intentionally abandoned.

### Initial user

An active traveler or small group already out in the field: a bike, a car, a dog, several activities, and a hard return or dinner time.

This is a strong beachhead because:

- changes are frequent and cognitively expensive;
- a map is a natural part of the interface;
- the agent's result is visible and cinematic;
- value appears in one session without lengthy onboarding;
- the same pattern can later extend to errands, childcare logistics, event days, field service, and road trips.

## Why WebMCP is necessary

Without WebMCP, an agent can describe a new plan but has no reliable, structured way to:

- read the current mission revision;
- use stable identifiers for existing stops;
- mark a specific stop as `skipped`;
- add a location with coordinates and a source;
- set a new order without clicking and guessing through the DOM;
- verify that the screen reflects the result of its actions.

WebMCP turns these operations into explicit contracts while the human continues to use a normal interface. This realizes the core of the challenge: the application becomes meaningfully better **because a human and an agent work together on the same page**.

## Differentiation from existing planners

OpenAI's official showcase already includes WanderNote, described as a shared way to turn travel notes into an editable itinerary. Sidequest must therefore clearly avoid the “AI trip planner” position.

| Traditional trip planner / WanderNote | Sidequest |
|---|---|
| Creates or refines a travel plan | Responds to change while the plan is being executed |
| The target plan is the central object | The current operational state is the central object |
| Horizon: days or an entire trip | Horizon: the next few hours |
| Itinerary editing | Closed loop: observe → research → act → verify |
| Success: a complete plan | Success: a recovered day despite disruption |
| The map is a presentation | The map and statuses are shared memory for the human and agent |

The most important positioning line:

> **WanderNote helps plan the trip. Sidequest rescues the day when the trip stops going to plan.**

## Product principles

1. **Reality first.** Execution state matters more than the original plan.
2. **One shared artifact.** The human and agent update the same object, not two parallel narratives.
3. **Visible agency.** Every agent change is immediately visible in the UI and activity log.
4. **Small, composable actions.** The agent receives five non-overlapping tools.
5. **Evidence travels with the decision.** A new stop can include a source and rationale.
6. **Graceful without AI.** The entire screen remains manually usable in a browser without WebMCP.
7. **No fake autonomy.** The application does not pretend that it performed the research; sources come from the agent.
8. **Demo over platform.** One perfect scenario matters more than a broad feature list.

## One-screen MVP

### Top bar

- Sidequest logo;
- mission name: `Baška Voda Adventure`;
- WebMCP status: `Connected`, `Unavailable`, or `Checking`;
- `Reset demo` button;
- hard commitment: `Dinner 18:30 · 3h 20m left`.

### Left column — Context + Timeline

**Context**

- Now: `15:10`;
- Current location: `Bike parking, Baška Voda`;
- Energy: `Low`;
- Constraints: `car`, `dog`, `≤20 min drive`, `keep dinner 18:30`.

**Timeline**

- items with a time, type icon, status, and short “why”;
- human actions: `Done`, `Skip`, `Undo`;
- a subtle animation after an agent change;
- fixed stops, such as dinner, marked with a visual lock.

### Right column — Map + Change log

**Map**

- pins numbered according to the active sequence;
- skipped stops shown in gray;
- a line connecting the stops;
- selecting a stop synchronizes the map and timeline;
- an `Open location` link to an external map.

**Change log**

- `15:10 Human completed Gravel ride`;
- `15:10 Agent changed energy to Low`;
- `15:11 Agent skipped Biokovo hike`;
- `15:12 Agent added Punta Rata swim`;
- `15:12 Agent added INA Makarska-Ratac`;
- `15:13 Agent reordered 4 remaining stops`.

## MVP scope

### P0 — must work

- a deterministic seed mission;
- manual `Done`, `Skip`, and `Undo`;
- one shared store for the UI and WebMCP;
- five WebMCP tools;
- immediate timeline, map, and log updates after a tool call;
- localStorage persistence and demo reset;
- a responsive single-screen layout;
- a clear state when WebMCP is unavailable;
- contract tests and the main scenario test;
- a public deployment with no login;
- a README with ChatGPT and Chrome testing instructions.

### P1 — only if P0 is stable

- animated transition between the old and new route;
- a `Demo prompt` control that copies the prepared prompt;
- small source cards with favicons;
- a simple share link with an encoded scenario ID;
- screenshot-friendly presentation mode.

### Out of scope

- a custom model or chat;
- accounts and authentication;
- cross-device synchronization;
- real-time multi-user collaboration;
- automatic weather retrieval;
- geocoding and a directions API;
- exact ETA or turn-by-turn navigation;
- payments and reservations;
- multiple missions and a calendar;
- a native mobile app;
- declarative WebMCP or tools registered inside iframes.

## User stories and acceptance criteria

### US-01 — see the true state of the day

**As a participant, I want to immediately see what is completed, active, skipped, and next so that I do not need to reconstruct the plan from chat.**

Criteria:

- each stop's status is clear without opening details;
- a skipped stop does not appear in the active route;
- the timeline and map show the same order;
- refreshing the page does not erase changes.

### US-02 — manually report a real-world change

**As a human, I want to mark the ride as completed with one click so that the agent sees the new state the next time it reads the mission.**

Criteria:

- `Done` updates the UI in under 100 ms;
- the mission revision increases by 1;
- the log records the `Human` actor;
- `get_mission_state` returns the new status and revision.

### US-03 — let the agent understand the current context

**As an agent, I want a concise mission snapshot so that I can adapt my actions to the current time, location, and constraints.**

Criteria:

- the snapshot fits within the tool response budget;
- it includes stable `stopId` values, statuses, order, locked stops, and the revision;
- it contains no secrets or data unrelated to the mission;
- the tool is annotated with `readOnlyHint: true`.

### US-04 — let the agent add a researched alternative

**As an agent, I want to add a new stop with coordinates, rationale, and a source so that the proposal becomes part of the shared plan rather than remaining text.**

Criteria:

- input is validated at runtime;
- coordinates stay within valid ranges;
- the source URL must use `https`;
- a new pin appears on the map;
- the log identifies the `Agent` actor;
- the result returns the new revision and stop ID.

### US-05 — preserve a hard commitment

**As a user, I want the agent to move flexible activities without changing dinner at 18:30.**

Criteria:

- a locked stop cannot be removed or moved by `reorder_mission_stops`;
- an invalid operation returns a concise error with a code;
- the corrected order keeps dinner last and at 18:30.

### US-06 — resolve concurrent changes

**As a human, I want the agent to avoid overwriting a manual change made seconds earlier.**

Criteria:

- every write tool requires `expectedRevision`;
- a stale revision returns `STALE_REVISION` and the current revision;
- the agent can read again and safely retry the operation.

### US-07 — understand what the agent did

**As a user, I want a short action history so that I can trust the current plan and manually undo a mistake.**

Criteria:

- the log shows actor, time, and change summary;
- the newest change appears first;
- the log does not expose the agent's private chain of thought;
- reset restores the demo state.

## Core demo scenario — “The day changed”

### Initial state

Mission: `Baška Voda Adventure`  
Time zone: `Europe/Zagreb`  
Revision: `7`

| Order | Time | Stop | Status | Notes |
|---:|---:|---|---|---|
| 1 | 11:30 | Forest gravel loop | completed | the user has just clicked `Done` |
| 2 | 15:30 | Biokovo sunset hike | planned | strenuous and flexible |
| 3 | 17:15 | Return & shower | planned | Baška Voda |
| 4 | 18:30 | Dinner reservation | planned | locked |

Context before the prompt:

- current time: `15:10`;
- current location: `Bike parking, Baška Voda`;
- energy: `medium` in stored state; the prompt's “we're tired” changes it to `low`;
- constraints: `car available`, `dog with us`, `max 20 min drive`, `keep dinner at 18:30`.

### Exact user prompt

```text
We just finished the gravel ride and we're tired. Skip the hike.
It is 15:10 and we're back at the car in Baška Voda.
Find a good snorkeling stop within 20 minutes, add it before dinner,
and make sure we can fuel up on the way. Keep our 18:30 dinner unchanged.
Use reliable sources and update the Sidequest board, not just the chat.
```

### Expected tool sequence

1. `get_mission_state({})`
2. the agent researches a place and fuel station on the open web;
3. `update_day_context({ expectedRevision: 7, ... })` → revision 8;
4. `update_mission_stop({ expectedRevision: 8, stopId: "biokovo-hike", status: "skipped", ... })` → revision 9;
5. `add_mission_stop({ expectedRevision: 9, ...Punta Rata... })` → revision 10;
6. `add_mission_stop({ expectedRevision: 10, ...INA Makarska-Ratac... })` → revision 11;
7. `reorder_mission_stops({ expectedRevision: 11, orderedStops: [...] })` → revision 12;
8. the agent verifies the visible result and briefly summarizes the change.

Punta Rata's demo data can be based on the official Brela tourist information page, which provides coordinates and information about parking, shade, and facilities. The Makarska-Ratac station can be based on INA's official page, which provides its address and 24-hour opening hours. These are **anchors for a repeatable demo**, not a search mechanism inside the app.

### Expected final state

| Order | Time | Stop | Status | Change |
|---:|---:|---|---|---|
| 1 | 11:30 | Forest gravel loop | completed | unchanged |
| — | 15:30 | Biokovo sunset hike | skipped | removed from the active route |
| 2 | 15:30 | Punta Rata swim & snorkel | planned | new stop with a source |
| 3 | 17:05 | INA Makarska-Ratac | planned | new service stop |
| 4 | 17:35 | Return & shower | planned | rescheduled |
| 5 | 18:30 | Dinner reservation | planned | time preserved |

The map changes from the original route to the new one, the hike turns gray, and two new pins appear with a short “why.” The activity log shows a series of Agent actions instead of hiding the changes inside chat.

### Expected agent response

```text
Updated the Sidequest board. I skipped the Biokovo hike, added Punta Rata
for a lower-effort swim/snorkel stop, added INA Makarska-Ratac for fuel,
and reordered the remaining stops. Your 18:30 dinner is unchanged.
Both new stops include their sources on the board.
```

## Recording fallback scenario

If the agent cannot access web search in the recording environment, provide verified candidates while still letting it read the state and independently perform every WebMCP operation:

```text
Update the current Sidequest mission using these verified candidates:
- Punta Rata beach, 43.370062, 16.922775, source:
  https://brela.hr/en/beaches/the-punta-rata-beach
- INA Makarska-Ratac, Vukovarska 135, source:
  https://www.ina.hr/en/station/makarska-ratac/

We are tired, so skip the hike. Add the beach and fuel stop before our
locked 18:30 dinner and update the board. Preserve the dinner time.
```

This still demonstrates the essential WebMCP value: the agent reads live state, selects the correct tools, performs a sequence of mutations, and updates the shared UI.

## Additional product examples — do not implement before the deadline

### 1. Broken headlight bulb during a road trip

```text
The right low-beam bulb failed while we're driving from Croatia to Wroclaw.
Read our current mission. Add the smallest-detour shop that is still open,
then add a safe parking stop where I can replace it. Keep the hotel arrival
before 22:00 and attach a source for the bulb type.
```

Value: the agent combines route state, deadline, parts research, and stop order, then saves the result without manual copying.

### 2. Family day disrupted by weather

```text
It started raining and the kids are tired. Replace the outdoor playground
with one indoor activity within 15 minutes. Keep the pharmacy stop and be
home by 18:00. Update the mission and explain the one tradeoff you made.
```

Value: constraints and fixed stops remain part of the live plan.

### 3. Field service

```text
Job 2 took 45 minutes longer and we used the last replacement valve.
Mark it complete, add a supplier stop, and reorder the remaining visits so
the SLA-risk customer stays first. Keep all completed jobs in the audit log.
```

Value: the same DayOps pattern can later support field work without changing the fundamental model.

## MVP success metrics

### Product

- A user understands the product within 15 seconds without narration from the creator.
- In one prompt, the agent takes the mission from the initial state to the expected final state.
- The human can make the same basic changes manually.
- An agent mutation becomes visible less than 250 ms after the handler completes.

### WebMCP

- All five tools are discovered in ChatGPT's in-app browser.
- The core prompt selects the correct tools in at least 8 out of 10 attempts or paraphrases.
- No tool overlaps another tool's purpose.
- Every write validates input and revision.
- Every result stays under 1,500 characters.
- The application works without errors when `document.modelContext` is absent.

### Demo and submission

- The video is under three minutes and shows the working product rather than slides.
- The first visible change happens before the 45-second mark.
- The video shows both the UI and the agent calling the page's tools.
- The live URL works without an account.
- The public repository has a visible license and testing instructions.

## Product risks and cuts

| Risk | Response |
|---|---|
| The product looks like another trip planner | Use the “plan meets reality” story and show a change after an activity is completed, not a trip generated from scratch |
| Place research is nondeterministic | Keep a primary prompt and a verified fallback prompt |
| Too many tools confuse the agent | Exactly five tools, with non-overlapping verbs and concise descriptions |
| The agent changes the locked dinner | Domain validation rejects the change regardless of model behavior |
| The map or tiles fail to load | The timeline remains a complete product; the map shows an empty state while preserving the stop list |
| WebMCP is unavailable in a normal browser | The UI works manually and shows a clear badge with ChatGPT/Chrome flag instructions |
| The video spends too long on setup | Start the recording on the prepared mission and explain setup only in voice-over |
| Time runs out | No backend, accounts, directions API, weather API, or multi-mission CRUD |

## Submission narrative — ready-to-use English copy

### Project name

Sidequest

### Tagline

Your day changed. Your plan should too.

### Short description

Sidequest is a shared live mission board for the moment when a real-world plan stops matching reality. A person updates what actually happened; their agent reads the current mission, researches alternatives on the open web, and uses WebMCP to update the same visible timeline and map.

### Inspiration

Real days are messy. A bike ride runs late. The group is tired. The hike no longer makes sense. You still need fuel and cannot miss dinner. An AI agent can research alternatives, but its answer usually becomes another block of text that someone must manually copy into maps, notes, and schedules.

We wanted to close that loop. The human should report reality. The agent should handle the research and replanning. Both should work on the same live artifact.

### What it does

Sidequest turns a day into a live mission with context, constraints, a timeline, a map, sources, and an activity log. In our core demo, the user completes a gravel ride, says the group is tired, asks to skip a hike, find a snorkeling stop within 20 minutes, add fuel, and preserve an 18:30 dinner.

The agent reads the current mission state, finds suitable places, updates the context, skips the hike, adds the new stops with source links, and reorders the plan. Every change appears immediately in the interface the human is watching.

Unlike a trip planner, Sidequest is not primarily about generating an itinerary. It is a real-time operations layer for recovering a day after conditions change.

### Why WebMCP

Without WebMCP, the agent could recommend a new plan but would not have a reliable, structured way to read the current state or apply the result to the user's interface. DOM clicking would be brittle and the chat answer would drift away from the plan.

Sidequest exposes five focused WebMCP tools: read the mission, update current context, update an existing stop, add a stop, and reorder remaining stops. These tools reuse the exact same domain operations as the human UI. WebMCP therefore provides the shared state and action layer that makes the product possible.

### How we built it

Sidequest is a local-first React and TypeScript application built with Vite. A small domain store is the single source of truth for the human UI and WebMCP handlers. Runtime schemas validate every tool input, and optimistic revision checks prevent an agent from overwriting a newer human change. The map is rendered with Leaflet, while mission state and a compact audit log are persisted in localStorage.

The WebMCP integration uses the imperative `document.modelContext.registerTool()` API in the top-level document, feature-detects support, and degrades gracefully to the normal human interface in other browsers. No custom model, API key, or backend is required: the browser agent brings the intelligence; Sidequest provides trustworthy, visible actions on the live page.

### Challenges

The hardest design problem was not registering a tool. It was choosing a small tool surface that gives an agent enough control without creating overlapping actions or hiding consequential changes. We also needed to keep tool outputs compact, preserve locked commitments, handle stale state, and make the agent's actions legible to the person watching.

### Accomplishments

- A complete human–agent loop from observed real-world change to visible replanning.
- Five narrow WebMCP tools backed by one shared domain model.
- Runtime validation and revision-safe mutations.
- Source-backed new stops and an actor-aware audit log.
- A useful manual interface even without WebMCP support.
- A deterministic resettable scenario that judges can test in one prompt.

### What we learned

Agent-native UX is not chat placed next to an app. It is a well-designed shared state model, a small set of precise actions, and immediate visual verification. The most valuable WebMCP tools were not the most ambitious ones; they were the ones that cleanly connected reasoning to existing product behavior.

### What's next

Next, Sidequest could add collaborative missions, live location with explicit consent, weather and transit adapters, richer route evaluation, and reusable mission templates for family logistics, events, road trips, and field teams. The core would remain the same: humans report reality, agents absorb the replanning work, and both stay aligned through one visible mission.

## Mapping the narrative to judging criteria

| Criterion | What we demonstrate |
|---|---|
| WebMCP Leverage | Five real tools, sequential mutations, live-state reads, a shared store, revisions, and visible verification |
| Execution | A coherent single screen, manual fallback, demo reset, login-free deployment, tests, and a prepared scenario |
| Potential Impact | A concrete problem for people already on the move; measurably less copying and state reconstruction |
| Creativity & Ambition | The DayOps category: recovering a plan after reality changes rather than generating one |

## Video script — 2:20–2:40

### 0:00–0:15 — the problem

Visual: the prepared mission after the gravel ride, with the hike and dinner on the timeline and the map on the right.

Voice-over:

> “Plans don't fail in planning apps. They fail in the real world. Sidequest is a live mission board for the moment your day changes.”

### 0:15–0:35 — human action

Click `Done` on the gravel ride. The UI and log update.

> “The human records reality. We finished the ride, and that update becomes shared state the agent can read.”

### 0:35–0:55 — prompt

Paste the core prompt into ChatGPT/Codex next to the open page.

> “Now I can describe the messy part naturally: we're tired, skip the hike, find snorkeling nearby, add fuel, but keep dinner.”

### 0:55–1:35 — WebMCP in action

Show the tool calls or Recent site tools panel while the page changes at the same time.

> “The agent first reads the live mission. It researches suitable options, then calls Sidequest's focused WebMCP tools. The hike is skipped. New source-backed stops appear. The route is reordered.”

### 1:35–1:55 — result

The map fits the new bounds, the timeline shows the new order, and dinner remains at 18:30.

> “This is not a recommendation trapped in chat. It is the new shared operating plan, with the locked commitment preserved and every action visible.”

### 1:55–2:20 — technical core

Brief split screen: a `document.modelContext.registerTool` excerpt, the five tool names, and the Connected badge.

> “Sidequest uses the imperative WebMCP API in the top-level page. The human UI and agent tools call the same validated domain operations, with revision checks preventing stale writes. No custom model or backend is required.”

### 2:20–2:35 — close

Visual: the final mission.

> “Trip planners help plan the trip. Sidequest rescues the day when the trip stops going to plan.”

## Submission materials

### Required

- a working public URL;
- a public repository with source code and setup instructions;
- a visible open-source license in the repository;
- a description explaining why the project is a strong fit for WebMCP;
- a public YouTube video under three minutes with audio;
- testing instructions for ChatGPT's in-app browser and Chrome with WebMCP.

### Recommended images

1. Hero: the final screen after replanning.
2. Before/after: the hike before the change and snorkeling after it.
3. WebMCP: the five-tool list and `Connected` status.
4. Detail: a source card and activity log containing Agent actions.

### Testing instructions field

```text
Open the live URL in ChatGPT's built-in browser and use GPT-5.6 Sol or Terra.
The app opens on a resettable demo mission. Click “Done” on the gravel ride,
then copy the prompt shown under “Demo prompt” and ask the agent to update the
open Sidequest page. You can inspect the five registered actions under Site
tools. To test in Chrome 149+, enable chrome://flags/#enable-webmcp-testing and
restart Chrome. If needed, click “Reset demo” to restore the initial state.
No account, API key, or payment is required.
```

## Final product checklist

- [ ] The name is `Sidequest` everywhere, with `DayOps for real life` as the descriptor.
- [ ] The hero describes change during the day, not trip creation.
- [ ] One screen shows context, timeline, map, and activity log.
- [ ] The killer demo begins with manually completing the gravel ride.
- [ ] The core prompt and fallback prompt are available to copy.
- [ ] Dinner at 18:30 is locked and actually preserved.
- [ ] New stops display sources.
- [ ] The activity log distinguishes Human and Agent actions.
- [ ] Missing WebMCP support does not break the application.
- [ ] The video is under three minutes and includes audio.
- [ ] The live URL requires no login.
- [ ] The repository is public and has a visible license.
- [ ] The README explains the exact ChatGPT and Chrome test procedure.
- [ ] The submission is saved and verified before **September 3, 2026, 22:00 CEST**.
- [ ] After the deadline, do not change the submission, repository, or live site until the judging period ends; continue any further work in a separate fork or branch in accordance with the challenge FAQ.

## Sources and platform status

- [Official WebMCP Challenge rules](https://webmcp.devpost.com/rules) — deadline, repository requirements, and the four equally weighted judging criteria.
- [Challenge FAQ and resources](https://webmcp.devpost.com/resources) — live URL, public repository with a license, sub-three-minute video, and judge testing expectations.
- [OpenAI: Site tools](https://learn.chatgpt.com/docs/webmcp) — using WebMCP in the in-app browser, current limitations, and required testing environment.
- [OpenAI WebMCP showcase](https://developers.openai.com/showcase?view=webmcp-apps) — including WanderNote, against which Sidequest is positioned as live replanning rather than trip planning.
- [Chrome: WebMCP](https://developer.chrome.com/docs/ai/webmcp) — current status, origin trial, local flag, and progressive enhancement.
- [Chrome: WebMCP best practices](https://developer.chrome.com/docs/ai/webmcp/best-practices) — small non-overlapping tools, dynamic registration, runtime validation, and evals.
- [Chrome: WebMCP tool security](https://developer.chrome.com/docs/ai/webmcp/secure-tools) — annotations, tool exposure, and recommended description/response budgets.
- [WebMCP Draft Community Group Report](https://webmachinelearning.github.io/webmcp/) — current draft of the `document.modelContext` interface.
- [Punta Rata — official Brela Tourist Board page](https://brela.hr/en/beaches/the-punta-rata-beach) — source for the beach's demo data.
- [INA Makarska-Ratac](https://www.ina.hr/en/station/makarska-ratac/) — source for the station's demo data.

> Note: WebMCP remains an experimental, actively evolving proposal. Re-verify API names and browser behavior immediately before implementation and recording. This document reflects the state verified on September 2, 2026.
