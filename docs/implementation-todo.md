# TODO 01 — Sidequest P0

> Date: 2026-09-03
> Status: full-context copy and agent-created plans complete; Git integration permission pending
> Scope: one local-first Sidequest mission, shared human/agent state, exactly five WebMCP tools, responsive one-screen UI, tests and submission-ready repository metadata
> Analysis base: `01-sidequest-product-en.md`, `02-sidequest-technical-execution-en.md`, live Devpost requirements, current OpenAI Site Tools and Chrome WebMCP documentation
> Skills: todo-spec, frontend-design, openai-docs, code-review-checklist, mature-typescript, types-driven-design
> Technical note: English is the only submission language in P0; WebMCP is progressive enhancement and the normal UI remains usable without it.

## Working method

- Start from `[~]`, otherwise the next `[ ]`, and mark work `[~]` as it begins.
- Write the named tests first and record a behavioral red run before production implementation.
- Mark a task `[x]` only after its acceptance criteria and focused gate pass.
- Keep domain truth in one immutable `Mission` snapshot. UI and WebMCP may mutate it only through the store's declared action dispatch.
- Keep all English UI copy in `src/copy.ts`; P0 intentionally supports no other locale.
- For visual work, capture desktop and mobile browser evidence under `artifacts/` before closing the task.
- If a blocking decision would expand scope or change a public contract, leave the task `[~]`, record the blocker, and continue with independent work.

## Task list

- [x] 1. Scaffold the testable React/TypeScript application contract
- [x] 2. Implement the mission domain, store, persistence, and deterministic seed
- [x] 3. Implement exactly five WebMCP tools over the same store
- [x] 4. Implement the responsive day-plan UI and map
- [x] 5. Complete delivery files, full gates, visual QA, and simplification rounds
- [ ] 6. Connect the public repository to the deployed Vercel project
- [x] 7. Make first use and every interactive control unmistakable
- [x] 8. Make a fresh personal plan the default and explain the chat boundary
- [x] 9. Clarify schedule hierarchy, adding, and item actions
- [x] 10. Add a typed sample-plan catalog and loader menu
- [x] 11. Let the agent create titled plans from complete copied context

## Blocking decisions accepted in this plan

- One `Mission` aggregate and one external `MissionStore` are the only source of domain truth.
- A small direct `MissionAction` discriminated union is sufficient; event sourcing, a backend, custom chat, and additional state libraries are out of scope. Three stable workspace URLs use the native History API without a router dependency.
- Zod strict schemas are the runtime boundary and the source for inferred input types plus WebMCP JSON Schema.
- View state (selected stop, copy feedback, WebMCP availability) remains separate from mission state.
- The page registers tools once from the top-level composition root and passes `{ signal }` as the current second argument to `registerTool`.
- The usability revision uses strict Bauhaus minimalism: a white canvas, black geometric typography, one high-contrast red accent, restrained date context, readable schedule times, generous negative space, one active workspace panel, and at most one expanded stop. Decorative shadows, gradients, neumorphic surfaces, and container borders are prohibited.
- Motion for React is the interaction adapter for draggable operational lists. The mission store remains authoritative; drag previews are renderer-local and commit one declared action at drag end.
- Schedule order and constraint order are editable. People explicitly control stop locks; agents must respect them. The route is derived from schedule order, and history remains an immutable audit instead of becoming a second editable list.
- The map is a Google Maps location preview with explicit Google Maps and Apple Maps launch actions, never a straight-line route or turn-by-turn navigation claim.

## Recommended implementation sequence

1. Test/build harness and behavioral red tests.
2. Pure domain transition and store/persistence.
3. WebMCP adapter and contract tests.
4. Pure Screen projection, React View, Motion reorder adapter, maps launcher, and E2E.
5. README/license/hosting configuration, full gates, screenshots, and five mature-typescript simplification rounds.

## Context and architecture thesis

The bounded context is live day operations. `Mission + MissionAction -> MissionMutation` is the only legal transition. The store owns persistence and notification after accepted mutations. A pure presenter projects `Mission + ViewState -> MissionScreen`; React renders the screen and emits `ViewAction`. WebMCP is an outside adapter that validates input and dispatches the same mission actions as human controls.

## Reuse and source-of-truth map

- Domain values and action schemas: `src/domain/mission.ts`
- Pure mission transitions and invariants: `src/domain/mission-transition.ts`
- Deterministic fixture: `src/domain/seed.ts`
- Persistence and subscriptions: `src/store.ts`
- Render contract and ViewAction mapping: `src/view-model.ts`
- English copy: `src/copy.ts`
- Tool catalog, schemas, descriptions, and handlers: `src/webmcp.ts`
- Composition root: `src/main.tsx`
- Duplicate mission state, hand-written copies of tool schemas, or direct object mutation are defects.

## Key analysis findings

- The directory is greenfield: only the two source documents exist and there are no user code changes to preserve.
- Official Devpost data confirms submissions are open until 2026-09-03 20:00 UTC and requires a working URL, public repository with visible open-source license, English submission materials, and a public YouTube demo under three minutes.
- Current OpenAI Site Tools supports imperative tools registered in the top-level page; declarative and iframe tools are not supported in the in-app browser.
- Current Chrome documentation passes registration lifetime through `registerTool(definition, { signal })`; the thin adapter must follow this current signature.
- The highest implementation risks are stale revision handling, locked-dinner enforcement, compact tool output, partial tool registration, and map/UI divergence.

## Implementation plan

### 1 [x] Scaffold the testable React/TypeScript application contract

Description: Establish the minimum Vite, TypeScript, Vitest, Testing Library, and Playwright harness without adding product behavior.

Acceptance criteria:

- AC-1: `npm run test`, `npm run build`, and `npm run test:e2e` are defined and target the intended toolchain.
- AC-2: TypeScript uses strict mode, `noImplicitReturns`, and `noFallthroughCasesInSwitch`.
- AC-3: Named behavioral tests can run red for domain and WebMCP contracts before implementation.

Tests:

- AC-1/2 -> `configuration gate` (`npm run build`); no unit test because these are compiler/package contracts.
- AC-3 -> `mission applies a valid action` and `registers the Sidequest tool catalog`; integration coverage follows in tasks 2 and 3.

Sources/References: `package.json`, `tsconfig*.json`, `vite.config.ts`, `playwright.config.ts`.

Implementation result:

- Setup-only run: `npm run test` initially failed to resolve the not-yet-created contract modules; this was not counted as behavioral red evidence.
- Behavioral red: `npm run test` ran 2 tests and failed on the intended assertions: mission returned `rejected` instead of `applied`; WebMCP catalog returned `[]` instead of the five names.
- Configuration green: `npm run build` completed `tsc -b` and Vite production output successfully.

### 2 [x] Implement the mission domain, store, persistence, and deterministic seed

Description: Make every successful human or agent mutation revision-safe, immutable, validated, logged, persisted, and subject to the locked commitment invariant.

Acceptance criteria:

- AC-1: Valid context, stop, add, and reorder actions increment revision exactly once and record the actor.
- AC-2: stale, malformed, missing-stop, locked-stop, invalid-order, and limit errors do not mutate or persist state.
- AC-3: dinner remains locked at 18:30; every future stop appears exactly once after reorder.
- AC-4: explicit demo loading restores revision 6, the active gravel ride, and an empty event log; invalid persisted data removes only the Sidequest key and falls back to a blank plan.
- AC-5: human Done/Skip/Undo use the same action path as WebMCP.

Tests:

- AC-1/2/3 -> unit: `mission.test.ts > applies actions and rejects invariant violations`.
- AC-4 -> unit: `store.test.ts > restores and loads the deterministic mission`.
- AC-5 -> integration: `store.test.ts > persists an accepted human action and notifies subscribers`; React reinforcement remains in task 4.

Sources/References: `src/domain/mission.ts`, `src/domain/seed.ts`, `src/store.ts`.

Implementation result:

- Behavioral red: `npm run test -- src/domain/mission.test.ts src/store.test.ts` ran 14 tests with 12 intended failures across transition, stale/locked/order errors, add, persistence, load, and fixture restoration.
- Green: the same focused command passed 14/14 tests; `npm run build` passed TypeScript and Vite production build.
- Source of truth: strict Zod schemas infer input/domain types; one `MissionAction` union enters `applyMissionAction`; the store persists and notifies only `applied` mutations.

### 3 [x] Implement exactly five WebMCP tools over the same store

Description: Expose one read and four write tools through the current imperative API, with strict runtime validation, compact results, annotations, atomic registration, and graceful unsupported mode.

Acceptance criteria:

- AC-1: exactly the five specified names register in the top-level document and all definitions stay inside published character budgets.
- AC-2: every schema is strict, every write requires `expectedRevision`, and only the read tool is read-only/untrusted.
- AC-3: invalid input returns a controlled result without mutation; valid handlers dispatch actor `agent` and update subscribers immediately.
- AC-4: unsupported WebMCP returns unavailable without throwing; registration failure aborts all tools; dispose aborts registrations.
- AC-5: every serialized tool result, including the final six-stop snapshot, is at most 1,500 characters.

Tests:

- AC-1/2/4/5 -> unit/contract: `webmcp.test.ts > exposes a bounded atomic catalog`.
- AC-3 -> integration: `webmcp.test.ts > executes the killer flow through the real store`.

Sources/References: `src/webmcp.ts`, `src/types/webmcp.d.ts`, current OpenAI and Chrome WebMCP docs.

Implementation result:

- Behavioral red: initial catalog test failed on `[]`; expanded run failed 4/5 behaviors on missing registration, missing execution, and missing atomic abort. A separate parameter-copy test failed until the `orderedStops` description was added.
- Green: `npm run test -- src/webmcp.test.ts` passed 6/6; `npm run build` passed.
- The real store completed the revision 7 -> 12 scenario, preserved dinner at 18:30, and kept the final six-stop read result within 1,500 characters.
- Registration uses one catalog, current `registerTool(definition, { signal })`, top-level feature detection, shared abort on partial failure, and no cross-origin exposure.

### 4 [x] Implement the responsive day-plan UI and map

Description: Render a polished one-screen mission board whose timeline, map, context, and audit log all project the same mission and remain fully useful in manual mode.

Acceptance criteria:

- AC-1: the initial mission and complete replanned outcome are understandable at 1440x900 without narration.
- AC-2: timeline and map use the same future-stop order; completed/skipped stops remain visible but are excluded from the route.
- AC-3: selecting a route item synchronizes selection; source and map links are HTTPS with secure link attributes; the visible preview comes from Google Maps.
- AC-4: controls remain usable without WebMCP, provide 44px targets, and the layout has no horizontal overflow at 390px.
- AC-5: copy comes from `src/copy.ts`, stays English-only by explicit P0 decision, and no user-provided HTML is rendered.
- AC-6: visual evidence proves desktop/mobile layout, final agent state, no occlusion, and no viewport bleed.

Tests:

- AC-1/2/4/5 -> unit: `view-model.test.ts > presents each mission state`; integration: `app.test.tsx > renders and controls the mission`.
- AC-3 -> integration: `app.test.tsx > synchronizes selection and secure sources`.
- AC-6 -> E2E: `sidequest.spec.ts > completes and captures the killer flow`; evidence: `artifacts/sidequest-desktop.png`, `artifacts/sidequest-mobile.png`.
- Copy gate -> `npm run test -- src/copy.test.ts`; other locales are intentionally unsupported in P0.

Sources/References: `src/view-model.ts`, `src/App.tsx`, `src/MissionMap.tsx`, `src/app.css`, `src/copy.ts`.

Implementation result:

- Behavioral red: `npm run test -- src/copy.test.ts src/view-model.test.ts src/App.test.tsx` failed 6/6 assertions against the UI skeleton, covering copy, screen projection, manual status change, source links, and fixture restoration.
- Green: the same focused suite passed 6/6 and `npm run build` completed successfully.
- Browser green: `npm run test:e2e` passed the real revision 7 -> 12 flow through a native-shaped `document.modelContext.registerTool` harness, verified five registrations, the locked 18:30 dinner, and no horizontal overflow at 390px.
- Visual evidence inspected: `artifacts/sidequest-desktop.png` (1440px) and `artifacts/sidequest-mobile.png` (390px). A low-contrast scenario-control label found during inspection was corrected and both screenshots were regenerated.
- Timeline, accessible map route list, Google Maps preview, and Google/Apple launch URLs derive from one presenter route; completed/skipped stops stay in history but leave the active route.

### 5 [x] Complete delivery files, full gates, visual QA, and simplification rounds

Description: Make the repository understandable, buildable, testable, secure to host, and ready for the manual browser/deployment steps the user must perform.

Acceptance criteria:

- AC-1: README documents differentiation, exact prompt, five tools, manual/WebMCP testing, architecture, security, and limitations.
- AC-2: MIT license and Netlify security headers are present.
- AC-3: unit, integration, E2E, typecheck, and production build gates pass.
- AC-4: five separate mature-typescript simplification rounds are recorded; any round that changes code reruns relevant tests.
- AC-5: manual ChatGPT/flagged-Chrome checks and public deployment remain explicitly pending unless actually performed.

Tests:

- AC-1/2 -> repository contract: `delivery.test.ts > contains submission essentials`; integration skipped because these are static repository artifacts.
- AC-3 -> `npm run check`.
- AC-4 -> recorded under this task.
- AC-5 -> manual QA matrix in README and final handoff.

Sources/References: `README.md`, `LICENSE`, `netlify.toml`, full source tree.

Implementation result:

- Delivery red: `npm run test -- src/delivery.test.ts` failed on the intentionally absent `README.md`; after adding README, MIT license, and Netlify headers, the repository contract passed 1/1.
- Full green gate: `npm run check` passed 27/27 Vitest tests, strict TypeScript plus the Vite production build, and 1/1 Chromium E2E test.
- Round 1 — truth and transitions: critique found a non-null assertion in validated reorder input. Change: replaced it with a defensive `INVALID_ORDER` result so impossible-looking input still cannot crash the transition. Domain/store/WebMCP tests passed 20/20.
- Round 2 — ownership boundaries: critique found React StrictMode could dispose a composition-root registration during its development remount. Change: the composition root now owns disposal; the hook only observes registration state. The E2E harness now removes tools on abort and proved all five remain registered. Focused tests passed 11/11 plus E2E 1/1.
- Round 3 — module cohesion: critique found `mission.ts` mixed the public domain language with a 280-line transition engine (489 lines total). Change: schemas/types remain in `mission.ts`; invariants and pure transitions moved to `mission-transition.ts`. Focused tests passed 22/22 and the build passed.
- Round 4 — functions and assertions: critique found tuple casts and an unmanaged copy-feedback timer. Change: named tuple converters replaced casts; clipboard success/failure now drives feedback without a timer. Focused tests passed 10/10 and the build passed.
- Round 5 — React and physical UI: critique found map semantics, rotated marker numbers, and sub-44px map controls. Change: added an accessible region, readable circular markers, and 44px brand/source/map/zoom targets. E2E passed and final desktop/mobile screenshots were inspected again.
- The public repository, MIT license, and Vercel production deployment are verified. Real ChatGPT/Chrome discovery, video recording, and Devpost submission remain explicitly pending manual release actions in README.

### 6 [ ] Connect the public repository to the deployed Vercel project

Description: Add the minimum Vercel contract, connect the authenticated Vercel project to the public GitHub repository, deploy production, and record only externally verified release facts.

Acceptance criteria:

- AC-1: `vercel.json` builds the Vite application into `dist` and supplies the same security-header policy as the existing hosting contract.
- AC-2: the Vercel project is connected to `github.com/gmoskal/sidequest-webmcp`, and its production URL responds successfully over public HTTPS.
- AC-3: README records the verified production URL and no longer describes deployment as pending.

Tests:

- AC-1/3 -> repository contract: `delivery.test.ts > contains the hackathon submission essentials`; behavioral red must precede configuration and README changes.
- AC-2 -> external integration evidence from the authenticated Vercel CLI plus an anonymous HTTP response and header check; no unit test can prove provider state.

Sources/References: `vercel.json`, `.vercel/project.json`, `README.md`, Vercel project and deployment inspection.

Implementation result:

- Behavioral red: `npm run test -- src/delivery.test.ts` failed first because `vercel.json` was absent, then remained red until README could contain a verified production URL.
- Configuration green: `npm run build` passed locally and in Vercel using the Vite preset, `npm run build`, and `dist` output.
- Production deployment `dpl_92FA4zouhQBj8XF4jcPVQ5UHAv2Z` reached `Ready` and was aliased to `https://sidequest-webmcp-eta.vercel.app`.
- Anonymous HTTPS verification returned `200` with the configured CSP, permissions policy, referrer policy, MIME protection, and clickjacking protection.
- Browser verification rendered the deployed mission at 1440px and 390px with no horizontal overflow.
- Git connection is pending because the Vercel GitHub integration does not yet have access to the repository; the authenticated project settings are ready for the explicit permission step.

Status:

- Production is complete. The remaining GitHub permission step was paused when the user explicitly reprioritized the usability problem.

### 7 [x] Make first use and every interactive control unmistakable

Description: Replace the visually flat three-column dashboard with a clean Bauhaus day view inspired by the supplied reference. A first-time visitor should see one current object, one clear action hierarchy, and explicit navigation to secondary information without needing a walkthrough.

Acceptance criteria:

- AC-1: the application uses a texture-free, shadow-free Bauhaus canvas with black typography, large date numerals, one soft-coral action/status accent, generous negative space, flat controls, and no gradients or Material-style elevation.
- AC-2: exactly one workspace (`Plan`, `Context`, `Route`, or `History`) is visible at a time; the floating menu exposes the current choice without occupying the canvas when closed.
- AC-3: the Plan expands exactly one item at a time; clicking a compact row title opens it directly, with no redundant `View` control or selected-row decoration.
- AC-4: the expanded item uses concise visible action labels (`Mark done`, `Skip`, `Restore`, and `View on map`) while its selected state is conveyed only by the coral time/status color.
- AC-5: mobile uses the same single-focus hierarchy with no horizontal overflow, clipping, occlusion, or overlapping controls.
- AC-6: human actions still dispatch declared `ViewAction` variants through the same store, and the five-tool WebMCP contract is unchanged.
- AC-7: every new or changed visible string remains English-only by the documented P0 decision and comes from `src/copy.ts`.
- AC-8: desktop and 390px evidence shows the literal calendar hierarchy: editable board title, large date, sparse two-column rows, one expanded item, and floating menu/add actions.
- AC-9: the schedule and requirements use Motion for React `Reorder`; the whole unlocked row is the drag surface with no dedicated handle, only actively dragged content moves, and one domain commit occurs at drag end while locked rows remain fixed.
- AC-10: requirements are persisted ordered items that can be added, crossed out/restored, and dragged; crossed items remain visible with a strikethrough rather than disappearing.
- AC-11: route order updates from the canonical schedule, while immutable history cannot be reordered or edited.
- AC-12: every item exposes a frameless lock/unlock icon with an accessible text alternative; locking prevents status changes and dragging without hiding the disabled actions, unlocking restores them, and an agent cannot override the human-owned lock.
- AC-13: the board title, item titles, and requirement labels edit inline without changing visual style; item and requirement creation use one-line inline inputs and no modal, card, or framed form.
- AC-14: the route workspace renders a real Google Maps preview; clicking it opens Google Maps, an adjacent action opens Apple Maps, and no OpenStreetMap tile or straight-line distance remains.

Tests:

- AC-1/5/8 -> browser regression: `sidequest.spec.ts > completes and captures the Sidequest killer flow`; evidence replaces `artifacts/sidequest-desktop.png` and `artifacts/sidequest-mobile.png`. The visual style itself requires inspected browser evidence rather than a unit test.
- AC-2/3/4 -> integration regression: `App.test.tsx > keeps one focused workspace with explicit controls`; unit coverage is skipped because the behavior is the composed rendered experience.
- AC-6 -> existing integration: `App.test.tsx > uses the shared store for a human Done action` plus `webmcp.test.ts > exposes a bounded atomic catalog`.
- AC-7 -> copy gate: `copy.test.ts > keeps the exact demo prompt and mission positioning`; this prototype intentionally supports English only and has no generated locale set.
- AC-9/11 -> unit/integration: `mission.test.ts > reorders every future stop once and preserves locked time`, `App.test.tsx > exposes draggable operational lists`, and the existing route-order presenter assertion; browser drag coverage is added to the E2E flow.
- AC-10 -> unit/integration: `mission.test.ts > edits an ordered constraint checklist` and `App.test.tsx > edits requirements through the shared store`.
- AC-12 -> unit/integration: `mission.test.ts > lets the human control a stop lock` and `App.test.tsx > exposes stop locks as explicit controls`.
- AC-13 -> integration: `App.test.tsx > adds and edits plan items inline` and `App.test.tsx > edits requirements through the shared store`.
- AC-14 -> integration: `MissionMap.test.tsx > previews Google Maps and offers both map providers`; browser evidence verifies the rendered Google preview.

Before implementation gate:

- [x] Existing rendered desktop evidence and `App.tsx`, `MissionMap.tsx`, `app.css`, `copy.ts`, ViewModel, and tests inspected at commit `06be1ec`.
- [x] The usability feedback and supplied Bauhaus reference are represented by AC-1 through AC-5 and AC-8; no product or domain decision remains open.
- [x] File ownership is limited to the single UI task; no parallel work or conflicting edit set exists.
- [x] `npm run test -- src/App.test.tsx src/copy.test.ts` ran red: the `Plan` tab was absent and the copy contract still returned `Copy replanning prompt` instead of the explicit ChatGPT action.

Sources/References: `src/App.tsx`, `src/MissionWorkspace.tsx`, `src/MissionMap.tsx`, `src/app.css`, `src/copy.ts`, `src/App.test.tsx`, `src/MissionMap.test.tsx`, `e2e/sidequest.spec.ts`, desktop/mobile artifacts.

External reference: current official Motion documentation specifies `npm install motion`, imports from `motion/react`, and the controlled `Reorder.Group` / `Reorder.Item` API.

Implementation result:

- Behavioral red recorded: the initial focused run passed the explicit-copy test and failed 4/6 App tests on the missing single-workspace interaction, draggable lists, editable requirements, and panel-scoped history.
- The UI now follows the supplied calendar reference literally: white canvas, editable title, oversized coral date, weekday/month counterweight, sparse time/title rows, one expanded item, and two frameless floating actions. No visible borders, shadows, gradients, cards, drag handles, selected bars, or title-hover colors remain.
- Plan items and operating requirements reorder with controlled Motion `Reorder.Group` / `Reorder.Item` spring movement. The whole unlocked row is draggable; lock ownership, add, cross/restore, rename, status, and reorder mutations all pass through the shared typed store.
- The route adapter no longer uses Leaflet, OpenStreetMap, polylines, or straight-line distance. It renders a Google Maps preview whose click opens Google Maps and exposes an Apple Maps alternative.
- Full green: `npm run check` passed 36/36 unit/integration/contract tests, strict TypeScript and the Vite production build, plus both Chromium interaction flows 2/2.
- Five simplification rounds: (1) kept all edits in the existing `MissionAction` gate; (2) kept panel selection as one closed ADT; (3) split workspace and maps rendering from composition; (4) removed unused timeline metadata after the final visual reduction; (5) kept reorder preview local to React and committed exactly once at drag end. Each changed slice was followed by its focused tests.

### 8 [x] Make a fresh personal plan the default and explain the chat boundary

Description: Replace the implicit demo-first experience with a blank current-day plan and one concise explanation of the product boundary: ChatGPT is the conversation and reasoning surface, while Sidequest exposes WebMCP tools and persists the shared result.

Acceptance criteria:

- AC-1: missing or invalid local state starts as an empty current-day plan with no demo items; existing valid user state still loads unchanged.
- AC-2: the empty Plan workspace says that ChatGPT reads and updates this page with Site Tools, offers a copyable fresh-plan prompt containing the production URL, and still permits manual inline creation.
- AC-3: the hidden menu exposes explicit `New plan` and `Load demo` actions; replacement of non-empty work requires confirmation, while switching from a truly empty plan does not.
- AC-4: the deterministic Baška Voda fixture remains available for the submission flow, but E2E must load it explicitly.
- AC-5: a blank mission remains valid for the same exact five WebMCP tools; no embedded chat, backend, sixth tool, or remote MCP server is introduced.
- AC-6: local time renders in the mission timezone, and manually added items with the unset placeholder location do not produce a false map at coordinates 0,0.

Tests:

- AC-1/3 -> `store.test.ts > starts blank...` and `store.test.ts > switches explicitly between a new plan and the deterministic demo`.
- AC-2/3 -> `App.test.tsx > starts as a blank plan and keeps the demo optional`.
- AC-4 -> both Playwright flows assert the blank first state and invoke `Load demo` before the deterministic scenario.
- AC-5 -> the existing WebMCP catalog test continues to require exactly five registrations and the full suite covers empty mission schema compatibility.
- AC-6 -> presenter/store focused tests plus browser inspection of the current-day empty state.

Before implementation gate:

- [x] Existing store loading, deterministic seed, presenter, copy, menu, App tests, and E2E harness inspected.
- [x] Behavioral red: focused store/App run failed on missing `createBlankMission`, `newPlan`, `Load demo`, `New plan`, and the empty ChatGPT/WebMCP explanation.

Implementation result:

- A missing or invalid persisted mission now produces a valid blank plan for the user's current day and timezone. Existing valid state remains unchanged.
- The empty Plan workspace gives one concise ChatGPT/Site Tools explanation and copies a fresh-plan prompt containing the production URL; manual inline creation remains available.
- The hidden menu now offers `New plan` and `Load demo`, with confirmation limited to replacement of non-empty work. The deterministic fixture remains an explicit judging path.
- The exact five WebMCP tools accept the blank mission and can construct its first stop through the same typed store. Placeholder coordinates never create a false route entry.
- Full green: `npm run check` passed 38/38 unit, integration, and contract tests, the strict TypeScript/Vite production build, and both Chromium flows 2/2.
- Browser inspection at desktop and 390px confirmed the blank current-day hierarchy, unclipped title, single active workspace, and frameless actions.

### 9 [x] Clarify schedule hierarchy, adding, and item actions

Description: Make the plan itself—not the decorative date—the dominant information. Replace competing and unexplained controls with one add flow and one expandable action menu per item, following the supplied screenshot and subsequent feedback.

Acceptance criteria:

- AC-1: the date numeral uses normal readable tracking and a restrained scale, while every schedule time is at least 16px with deliberate positive tracking and remains visually stronger than its status label.
- AC-2: the single accent is a saturated, high-contrast Bauhaus red rather than salmon; no border, card, shadow, gradient, or new decorative surface is introduced.
- AC-3: there is no global hamburger menu. `Plan`, `Context`, and `Route` are persistent vertical edge tabs inspired by the supplied reference; WebMCP mode and internal revision are not rendered as static navigation items. Each tab owns `/plan`, `/context`, or `/route`, and browser Back/Forward restores the selected workspace.
- AC-4: the inline add field is absent until the contextual `+` beside its list is invoked, receives focus when opened, closes after a successful addition or Escape, and is never duplicated by a second persistent add control. The single black floating action says `Load demo` on a fresh plan and becomes `New plan` for the loaded demo.
- AC-5: every item has one frameless accordion chevron. At most one item menu is expanded, and it contains the applicable `Done`/`Restore`, `Skip`, `Lock`/`Unlock`, `Delete`, and map actions without a dedicated lock button.
- AC-6: `Delete` removes the item through a typed human `MissionAction`, persists the mutation, and records it; exactly five WebMCP tools remain unchanged.
- AC-7: unlocked item names are always inline-editable; focus uses the same underline pattern as the board title without a field border or color change.
- AC-8: one thin dotted editorial axis belongs to the entire schedule; times align to its left and titles/statuses to its right without the line crossing any label or expanded content.
- AC-9: the blank plan gives one concise usage instruction covering `+`, drag, the chevron menu, the full-plan Google Maps route, and the shared ChatGPT Site Tools state.
- AC-10: Route previews one selected item and provides a separate action that opens the entire ordered route in Google Maps; individual Google and Apple launch actions remain available.
- AC-11: History is retained as immutable domain audit data but is not a visible workspace. Desktop and 390px browser evidence confirms readable hierarchy, no clipping/overflow/occlusion, a closed default item menu, and the expanded action state. English remains the only supported UI language and all changed copy stays in `src/copy.ts`.

Tests:

- AC-3/4/5/7/11 -> `App.test.tsx > exposes persistent side tabs without technical state`, `App.test.tsx > keeps the selected workspace in the browser route`, `App.test.tsx > reveals one add field from its contextual plus`, and `App.test.tsx > opens one complete item action menu`.
- AC-6 -> `mission.test.ts > lets a person delete an item through the transition gate` plus `App.test.tsx > deletes an item from its action menu`; the existing WebMCP catalog test continues to assert exactly five tools.
- AC-1/2/8/11 -> `sidequest.spec.ts > preserves readable schedule hierarchy and one item menu` with computed-style assertions and captured `artifacts/sidequest-item-menu.png`; visual inspection remains required because numeric style assertions cannot prove composition quality.
- AC-9 -> `copy.test.ts > keeps the exact demo prompt and mission positioning` and `App.test.tsx > explains the plan interaction in the blank state`.
- AC-10 -> `MissionMap.test.tsx > previews Google Maps and offers both map providers` plus the killer-flow Route assertion.
- AC-11 copy gate -> `npm run test -- src/copy.test.ts src/App.test.tsx`; no locale/codegen command exists because this repository intentionally supports English only.

Before implementation gate:

- [x] User screenshot `/Users/gmm/Desktop/Screenshot 2026-09-03 at 03.30.28.png` inspected at original resolution.
- [x] Existing `MissionAction`, transition gate, presenter, `MissionWorkspace`, floating controls, CSS, App tests, and Playwright flow inspected at commit `46959e5`.
- [x] Decisions resolved: one chevron menu, one conditional global add composer, high-contrast red, smaller date, larger tracked times, inline-edit underline, and a functional timeline line.
- [x] Behavioral red recorded for every named regression test before production changes.

Implementation result:

- Behavioral red: `npm run test -- src/domain/mission.test.ts src/App.test.tsx` ran 26 tests and failed the five intended behaviors: no `RemoveStop` transition, visible revision, persistent add field, missing item chevron menu, and missing Delete action.
- Visual red: `npx playwright test -g "preserves readable schedule hierarchy"` failed because the date numeral measured 124.8px against the 72px maximum before reaching the time, accent, timeline, and menu assertions.
- The date is restrained and normally tracked, while 16px+ schedule times sit
  immediately left of one dotted list-level axis. The saturated `#d21f2b` accent
  is reserved for active state; titles and item actions remain neutral.
- Native History API routes now own `/plan`, `/context`, and `/route`, with
  Back/Forward restoration. History remains domain audit data without a visible
  duplicate workspace.
- Item titles open first and then edit inline; the whole unlocked row remains the
  Motion reorder surface. `layout="position"` preserves the smooth positional
  transition without scaling type during expand/collapse.
- A shared frameless `…` control reveals the same horizontal icon action tray on
  whichever item is open. Done/restore, skip, lock/unlock, delete, and map actions
  remain visually distinct from content without borders or cards.
- Route provides individual Google/Apple links and one action for the complete
  ordered plan in Google Maps. Blank-state copy explains `+`, drag, item actions,
  Route, and the ChatGPT Site Tools boundary.
- Green: `npm run check` passed 48/48 Vitest tests, the strict TypeScript/Vite
  production build, and 4/4 Chromium E2E tests. Inspected desktop and 390px
  evidence confirms no clipping, horizontal overflow, frame, shadow, or gradient.

### 10 [x] Add a typed sample-plan catalog and loader menu

Description: Replace the one opaque demo action with a compact loader for three meaningfully different missions: the existing Baška Voda disruption, a time-windowed San Francisco errands day, and a Barcelona coffee/swim day. Each sample must exercise the same mission store, routing, locks, constraints, sources, map projection, and WebMCP boundary as a personal plan.

Acceptance criteria:

- AC-1: one typed demo catalog is the source of truth for the three IDs and immutable mission snapshots; loading always publishes a clone and never shares mutable sample state.
- AC-2: the San Francisco sample includes a postal return, Ferry Plaza errand, Main Library return, noon camera pickup, and a locked evening commitment with realistic locations, time windows, constraints, and official sources.
- AC-3: the Barcelona sample includes NOMAD specialty coffee, a Bogatell swim, a later city activity, and a locked timed commitment, with realistic route coordinates, constraints, and official sources.
- AC-4: `Load demo` opens one flat, accessible menu; selecting a sample replaces the current mission through `MissionStore`, closes the menu, returns to `/plan`, and `New plan` restores the blank state.
- AC-5: the menu is usable at desktop and 390 px, has no card border, frame, shadow, or gradient, does not occlude its trigger, and captures visual evidence in `artifacts/sidequest-demo-menu.png`.
- AC-6: all new visible English labels and descriptions live in `src/copy.ts`; this P0 deliberately supports English only, so there is no locale generator to run.
- AC-7: the sample catalog does not add a second domain store, change persistence format, or alter the exactly-five WebMCP tool catalog.

Tests:

- AC-1/2/3 -> unit/integration: `store.test.ts > loads each named demo from the typed catalog`; UI reinforcement: `App.test.tsx > loads a selected sample from the demo menu`.
- AC-4/6 -> integration: `App.test.tsx > loads a selected sample from the demo menu`; copy gate: `npm run test -- src/copy.test.ts src/App.test.tsx`.
- AC-5 -> E2E: `sidequest.spec.ts > opens the flat demo catalog without viewport overflow` plus `artifacts/sidequest-demo-menu.png`; unit testing is intentionally skipped because final composition and occlusion require the real browser.
- AC-7 -> existing `webmcp.test.ts > registers exactly five definitions` and full `npm run check`.

Sources/References: `src/domain/seed.ts`, `src/store.ts`, `src/view-model.ts`, `src/useMissionViewModel.ts`, `src/App.tsx`, `src/copy.ts`, `src/app.css`, official SFPL/USPS/Glass Key/Ferry Plaza/NOMAD/Barcelona beach pages.

Before implementation gate:

- [x] Current `SEED_MISSION`, `MissionStore.loadDemo`, `ViewAction`, primary action, persistence, and focused UI/store tests inspected.
- [x] User-visible sample places checked against official or first-party sources; live opening hours remain illustrative data and source links let the user re-check them.
- [x] Source of truth fixed as a typed catalog in `src/domain/seed.ts`; the UI stores only menu visibility and dispatches the selected catalog ID through the existing store.
- [x] Behavioral UI/store tests named above are written before production changes and must be observed red.

Implementation result:

- Behavioral red: `npm run test -- src/store.test.ts -t "loads each named demo"` failed because the only loader ignored `san-francisco-demo` and returned `Baška Voda Adventure`; `npm run test -- src/App.test.tsx -t "loads a selected sample"` and `npx playwright test -g "opens the flat demo catalog"` failed because no sample menu existed.
- Green: `npm run check` passed 48/48 Vitest tests, the strict TypeScript/Vite production build, and 4/4 Chromium E2E tests.
- Source of truth: `DEMO_MISSIONS` and its derived `DemoMissionId` own the three immutable snapshots; `MissionStore.loadDemo` clones the selected mission and publishes through the existing persistence/subscription path.
- Copy gate: sample labels, descriptions, confirmation text, and scenario prompts live in `src/copy.ts`; `npm run test -- src/copy.test.ts src/App.test.tsx` passed as part of the 48-test gate. English remains the only intentional P0 locale, so there is no codegen command.
- Visual evidence inspected: `artifacts/sidequest-demo-menu.png`, `artifacts/sidequest-san-francisco.png`, and `artifacts/sidequest-barcelona.png` at 390 px show no clipping, trigger occlusion, border/card/shadow, or horizontal overflow.

### 11 [x] Let the agent create titled plans from complete copied context

Description: Make the copied ChatGPT handoff self-contained and let the existing
WebMCP surface start a genuinely fresh, titled plan. Preserve the five-tool limit
by extending `update_day_context`; remove the app-owned confirmation from the
human `New plan` action without attempting to bypass any review owned by the
ChatGPT browser.

Acceptance criteria:

- AC-1: `update_day_context` accepts an explicit title, IANA timezone, and
  replacement intent.
  With `replacePlan: false` it updates context/title while preserving stops; with
  `replacePlan: true` it atomically creates a personal plan identity, clears old
  stops/history, derives the new date, and records one accepted revision.
- AC-2: a stale or malformed replacement is rejected without changing or
  persisting the mission; exactly five top-level WebMCP tools remain registered.
- AC-3: the clipboard text for the selected demo is generated from the current
  `Mission` and contains its complete JSON snapshot: identity, revision, title,
  date, timezone, day context, constraints, stops, locks, sources, and events.
- AC-4: each demo keeps its own replanning instruction, while the fresh-plan
  instruction tells the agent to collect missing facts and use
  `update_day_context` with `replacePlan: true`; copied state is explicitly a
  snapshot and the agent must still read the live revision before writing.
- AC-5: the copy action is labeled `Copy full context for ChatGPT`, works for the
  currently selected demo from Context, and retains a clear copied-success state.
- AC-6: the human `New plan` action clears the current mission immediately and
  never calls the app's `window.confirm`. Loading a demo over a non-demo personal
  plan keeps its separate destructive confirmation.
- AC-7: desktop and 390px evidence shows the longer copy label without clipping,
  overflow, a border, card, shadow, gradient, modal, or added persistent control.
- AC-8: all changed visible/copyable strings stay English-only in `src/copy.ts`;
  no locale generator exists for this intentionally single-language P0.
- AC-9: a small `v0.1.1 · updated 3 Sep 2026` release marker sits at the page
  bottom with no background, border, shadow, interaction, or overlap with the
  primary action at desktop and 390px widths.

Tests:

- AC-1/2 -> unit/domain: `mission.test.ts > starts a titled replacement plan
  atomically`; adapter integration: `webmcp.test.ts > starts a titled replacement
  plan through update_day_context` and the existing five-definition contract.
- AC-3/4/8 -> unit: `mission-prompt.test.ts > copies the complete selected demo
  context`; integration: `App.test.tsx > copies complete demo context`.
- AC-5/6 -> integration: `App.test.tsx > starts a new plan without confirmation
  and copies selected demo context`.
- AC-7 -> browser: `sidequest.spec.ts > copies complete demo context and starts
  fresh without an app modal`; evidence:
  `artifacts/sidequest-full-context-copy.png`. Unit-only visual proof is skipped
  because clipboard behavior and viewport composition require a real browser.
- AC-9 -> integration: `App.test.tsx > shows the latest release at the page
  bottom`; the same AC-7 browser evidence verifies placement and occlusion.

Sources/References: `src/domain/mission.ts`, `src/domain/mission-transition.ts`,
`src/webmcp.ts`, `src/copy.ts`, new `src/mission-prompt.ts`, `src/view-model.ts`,
`src/useMissionViewModel.ts`, `src/App.test.tsx`, `src/webmcp.test.ts`,
`e2e/sidequest.spec.ts`, official OpenAI Site Tools documentation.

Before implementation gate:

- [x] The current five-tool catalog, strict Zod schemas, domain transition,
  prompt projection, clipboard action, `NewPlan` path, copy source, tests, and
  desktop/mobile layout were inspected at `d61fa74`.
- [x] Contract decision: required `title`, `timezone`, and `replacePlan` fields
  extend `UpdateDayContextInputSchema`; no sixth tool or second store. Timezone
  is part of the context update so a replacement never inherits the previous
  location's display time.
- [x] Replacement intentionally discards the prior plan. The app removes its own
  confirmation; ChatGPT's security review remains platform-owned per OpenAI Docs.
- [x] The complete clipboard snapshot is serialized from `Mission`; demo copy
  stores only scenario instructions, never a second copy of mission data.
- [x] Named regression tests written and observed red before production edits.

Implementation result:

- Red evidence: the replacement action was rejected by the old strict schema,
  the clipboard exposed only a static prompt, `New plan` still called confirm,
  and the release marker was absent.
- Green behavior: `update_day_context` now owns title, timezone, and explicit
  replacement intent while keeping the catalog at five tools. Replacement
  clears the prior stops/history atomically; in-place updates preserve them.
- The clipboard prompt serializes the current `Mission` exactly once and labels
  it as a stale-able snapshot; each sample contributes only its scenario text.
- The app-owned `New plan` confirmation is gone. The separate confirmation for
  replacing a personal plan with a sample remains tested.
- Five mature-TypeScript simplification passes covered the schema-derived input,
  domain transition, single-store action flow, prompt source of truth, and UI
  lifecycle/error paths. No second state model or sixth tool was introduced.
- `npm run check` passed 55/55 Vitest tests, the strict TypeScript/Vite build,
  and 5/5 Chromium tests. The inspected 390px evidence is
  `artifacts/sidequest-full-context-copy.png`; it verifies the long copy label,
  modal-free reset, and unobstructed borderless `v0.1.1` release marker.

## Risks and dependencies

- Google/Apple map content depends on their network services; the timeline remains complete when external maps are unavailable.
- Browser WebMCP is experimental; all platform coupling stays in one adapter and manual mode is a first-class state.
- Real in-app browser WebMCP discovery cannot be proven by the native-shaped automated harness alone.
- The deadline makes P1 polish, authentication, live research, routing, and additional missions unacceptable scope expansion.

## Build / test gate

- [x] Behavioral red evidence recorded before each production slice.
- [x] `npm run test` passes.
- [x] `npm run build` passes with no TypeScript errors.
- [x] `npm run test:e2e` passes.
- [x] `npm run check` passes.
- [x] `artifacts/sidequest-desktop.png` and `artifacts/sidequest-mobile.png` inspected for visibility, occlusion, and overflow.
- [x] Exactly five real WebMCP definitions and output budgets verified.
- [x] Manual browser/deployment requirements truthfully marked pending or complete.

## Out of scope for this iteration

- Backend, authentication, custom chat/LLM, in-app turn-by-turn directions, live GPS/weather, reservations, multi-user sync, multiple missions, declarative WebMCP, iframe tools, automatic research, P1 sharing/presentation modes, Devpost submission, and video recording.
