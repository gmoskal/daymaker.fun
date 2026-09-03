# TODO 01 — Sidequest P0

> Date: 2026-09-03
> Status: v0.2.5 language-aware ChatGPT handoff deployed; automatic Vercel Git connection permission pending
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
- [x] 12. Make Needs the human input and Proposed schedule the agent output
- [x] 13. Make the Needs input and primary handoff action unmistakable
- [x] 14. Show the real persisted update time
- [x] 15. Bootstrap the mobile Work page from the copied handoff
- [x] 16. Replace model jargon in the Need priority control
- [x] 17. Make Proposed schedule a read-only expandable result
- [x] 18. Align the add-Need interaction with the list
- [x] 19. Transfer a complete session through a shareable URL
- [~] 20. Keep ChatGPT's response in the person's language
- [x] 21. Make daymaker.fun the production domain
- [~] 22. Raise the desktop typography scale

## Blocking decisions accepted in this plan

- One `Mission` aggregate and one external `MissionStore` are the only source of domain truth.
- A small direct `MissionAction` discriminated union is sufficient; event sourcing, a backend, custom chat, and additional state libraries are out of scope. Two stable workspace URLs use the native History API without a router dependency.
- Zod strict schemas are the runtime boundary and the source for inferred input types plus WebMCP JSON Schema.
- View state (independently expanded stops, copy feedback, WebMCP availability) remains separate from mission state.
- The page registers tools once from the top-level composition root and passes `{ signal }` as the current second argument to `registerTool`.
- The usability revision uses strict Bauhaus minimalism: a white canvas, black geometric typography, one high-contrast red accent, restrained date context, readable schedule times, generous negative space, one active workspace panel, and independently expandable proposal items. Decorative shadows, gradients, neumorphic surfaces, and container borders are prohibited.
- Motion for React animates read-only proposal expansion and reorders editable Needs. The mission store remains authoritative; expansion is renderer-local and never commits a mission action.
- Proposed schedule is agent-generated and read-only for people. Needs remain editable and reorderable; agents must respect persisted non-negotiable needs and locked commitments.
- Map access is derived from the Proposed schedule: each located item has Google Maps and Apple Maps launch actions, and the complete schedule has one Google Maps directions link. The app never claims to provide turn-by-turn navigation.

## Recommended implementation sequence

1. Test/build harness and behavioral red tests.
2. Pure domain transition and store/persistence.
3. WebMCP adapter and contract tests.
4. Pure Screen projection, React View, Motion interaction adapter, maps launcher, and E2E.
5. README/license/hosting configuration, full gates, screenshots, and five mature-typescript simplification rounds.

## Context and architecture thesis

The bounded context is live day operations. `Mission + MissionAction -> MissionMutation` is the only legal transition. The store owns persistence and notification after accepted mutations. A pure presenter projects `Mission + ViewState -> MissionScreen`; React renders the screen and emits `ViewAction`. WebMCP is an outside adapter that validates input and owns proposal writes; human ViewActions mutate Needs only.

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
- Production deployment `dpl_9ynveDQx1YteHqeLjZgXEvqzZfwh` reached `Ready` and was aliased to `https://sidequest-webmcp-eta.vercel.app`; the served bundle contains v0.2.0 and the two Needs examples.
- Anonymous HTTPS verification returned `200` with the configured CSP, permissions policy, referrer policy, MIME protection, and clickjacking protection.
- Browser verification rendered the deployed mission at 1440px and 390px with no horizontal overflow.
- `vercel git connect` still reports that the Vercel GitHub integration does not have access to the public repository. Automatic deployments remain pending that provider permission; direct production deployment works.

Status:

- Production v0.2.0 is complete. The remaining blocker is granting the Vercel GitHub integration access to `gmoskal/sidequest-webmcp`.

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

### 12 [x] Make Needs the human input and Proposed schedule the agent output

Description: Reframe Sidequest around one clear contract: the person edits a
planning brief and must-haves in Needs, while the agent creates a Proposed
schedule and researches its places. Remove Route as a workspace; maps remain
available from every generated schedule item and for the complete schedule.

Acceptance criteria:

- AC-1: the application has exactly two ordered workspace tabs: `Needs` first at
  `/needs`, then `Proposed schedule` at `/schedule`; `/` canonicalizes to Needs
  and no Route tab or route workspace remains.
- AC-2: Needs exposes one editable, persisted planning brief. Existing version-1
  localStorage missions without a brief load safely with an empty brief.
- AC-3: `Group energy / Medium` is absent. The same typed intensity is presented
  as `Preferred pace / Balanced`, with Easy and Full mappings for low and high.
- AC-4: copied text contains the current brief, situation, preferred pace,
  active must-haves, identity/revision, and locked commitments. It excludes
  unlocked proposed stops and events, and explicitly asks the agent to research
  and generate or replace the Proposed schedule.
- AC-5: `update_day_context` accepts the brief through the existing strict schema
  and still leaves the public catalog at exactly five tools.
- AC-6: every proposed schedule item with a real location exposes explicit
  Google Maps and Apple Maps links in its expanded content. The schedule also
  retains one whole-schedule Google Maps action; maps are never a third tab.
- AC-7: all new visible and clipboard copy is English and comes from
  `src/copy.ts`; English remains the intentional single P0 locale.
- AC-8: desktop and 390px browser evidence shows only the two tabs, a legible
  borderless brief editor, map links without overlap, and no new cards, shadows,
  gradients, decorative borders, or horizontal overflow.
- AC-9: the planning brief accepts ordinary prose and shows a concrete example;
  the structured must-have list is optional input that can be added, renamed,
  crossed out, removed, reordered, or marked `Fixed` in the UI.
- AC-10: every copied handoff tells the agent to parse the free-form brief into
  the editable Needs list, write those Needs through `update_day_context`, then
  replace the unlocked Proposed schedule. This happens on every handoff.
- AC-11: the sample catalog contains only the supplied Palermo arrival and South
  Croatia gravel-day briefs. Samples contain Needs, not prebuilt schedules.
- AC-12: replacing a proposal removes prior unlocked suggestions but preserves
  already locked commitments.

Tests:

- AC-1/3 -> unit: `view-model.test.ts > presents Needs first and a Proposed
  schedule second`; integration: `App.test.tsx > starts in Needs with two tabs`.
- AC-2/5 -> domain: `mission.test.ts > edits the planning brief through the
  transition gate`; store: `store.test.ts > migrates a stored mission without a
  brief`; adapter: the existing five-tool WebMCP catalog test plus updated killer
  flow.
- AC-4 -> unit: `mission-prompt.test.ts > copies needs without proposed stops`;
  integration: `App.test.tsx > copies editable Needs for the agent`.
- AC-6 -> unit: `map-links.test.ts > creates item and complete schedule links`;
  integration: `App.test.tsx > exposes maps from every located schedule item`.
- AC-7 -> `copy.test.ts > keeps Needs and Proposed schedule terminology`;
  locale generation is skipped because this repository intentionally has one
  English copy object and no localization generator.
- AC-8 -> browser: `sidequest.spec.ts > edits Needs and opens the generated
  schedule`; evidence: `artifacts/sidequest-needs-schedule.png`.
- AC-9/10 -> domain: fixed/remove need transition tests; unit:
  `mission-prompt.test.ts > asks the agent to structure Needs and regenerate`;
  integration: `App.test.tsx > edits all forms of Needs`.
- AC-11 -> `store.test.ts > loads only the two Needs examples`.
- AC-12 -> `mission.test.ts > replaces only unlocked proposed items`.

Sources/References: `src/domain/mission.ts`, `src/domain/mission-transition.ts`,
`src/domain/seed.ts`, `src/store.ts`, `src/copy.ts`, `src/mission-prompt.ts`,
`src/view-model.ts`, `src/useMissionViewModel.ts`, `src/MissionWorkspace.tsx`,
new `src/map-links.ts`, `src/App.tsx`, unit/integration/E2E tests.

Before implementation gate:

- [x] The current mission schema, seed catalog, persistence loader, prompt
  projection, route workspace, map component, navigation config, store adapter,
  responsive CSS, and tests were inspected at `a3a2346`.
- [x] Source of truth decision: `Mission.context.brief` owns the human planning
  brief; the clipboard owns no duplicate schedule data and serializes a derived
  planning-input projection.
- [x] Navigation decision: retain internal panel ID `plan` for minimal churn, but
  expose it only as `Proposed schedule` at `/schedule`; Needs is the fallback.
- [x] Map decision: extract pure URL builders and render links inside schedule
  items; remove the Route workspace rather than maintain parallel navigation.
- [x] Named regression tests written and observed red before production edits.

Implementation result:

- Behavioral red: the focused Needs, prompt, sample-catalog, fixed-need, and
  replacement tests failed on the intended missing behavior before their
  production slices were added.
- `Mission.context.brief` and structured fixed/flexible Needs now persist in the
  same versioned aggregate. Legacy missions default the new fields safely.
- Every clipboard handoff contains the current prose and active Needs, tells the
  agent to structure them first, then replace unlocked suggestions and generate
  a researched Proposed schedule while preserving locks.
- The demo catalog now contains exactly the Palermo and South Croatia prose
  examples supplied for this flow, both with an empty schedule.
- The Route workspace and embedded map were removed. Each located item exposes
  Google and Apple Maps; the complete proposal exposes Google Maps directions.
- Motion still reorders from the complete unlocked row. Expanding a row remounts
  the layout projection so details never overlap and typography does not scale.
- Green: 66/66 unit and integration tests, TypeScript/Vite production build,
  and 4/4 Chromium flows pass. Desktop and 390 px evidence is stored in
  `artifacts/sidequest-needs.png`, `artifacts/sidequest-needs-schedule.png`, and
  `artifacts/sidequest-needs-schedule-mobile.png`.

### 13 [x] Make the Needs input and primary handoff action unmistakable

Description: Make the handoff a two-stage persisted workflow. The initial screen
requires one free-form description and makes copying it the only primary action.
After the agent structures the request, the description disappears and the
editable Needs list becomes the working surface. Preserve the borderless Bauhaus
system.

Acceptance criteria:

- AC-1: a long initial description remains internally scrollable and exposes
  a persistent thin high-contrast scrollbar without a textarea border, shadow,
  gradient, or extra instructional icon.
- AC-2: `Copy to ChatGPT` is a visually explicit minimum-44px filled primary
  button and stays disabled until the required initial description is non-empty.
  Clipboard behavior and feedback continue to come from `src/copy.ts`.
- AC-3: the textarea scrollbar and copy action remain visible, unobstructed, and
  within a 390px viewport; evidence updates `artifacts/sidequest-needs.png`.
- AC-4: every handoff always contains the Sidequest instructions and retained
  free-form description. It omits `needs` in the initial brief stage, then
  includes the current post-edit active `needs` array in the structured stage;
  no
  `Must-haves`, `constraints`, or `limits` vocabulary leaks into the handoff or
  WebMCP agent state.
- AC-5: the persisted planning stage is `brief` or `needs`. In `brief`, the
  required textarea and `Copy to ChatGPT` are visible while the structured list
  is hidden. The first agent `update_day_context` moves to `needs`, hides the
  textarea, and reveals only `3 · Review and edit needs`.
- AC-6: in the structured stage, `Copy changes to ChatGPT` is disabled until a
  human add/remove/rename/reorder/cross/fixed change. Agent changes are reflected
  directly and leave the button disabled; a human change unlocks it.
- AC-7: Needs contains no date, current time, location, or Preferred pace block.
  Proposed schedule alone renders the plan date and a known starting location,
  right-aligned and without labels; it never renders a redundant current time
  below the date or an unavailable-location placeholder.
- AC-8: a fresh plan renders no fake title. The real title appears only after a
  demo or agent update supplies one.
- AC-9: the smaller `Load demo` control sits above the workspace and, when the
  schedule is open, above the day. Its white sample
  menu opens downward with one restrained shadow and no border.
- AC-10: the agent instruction makes plan quality and coverage of Needs its only
  goal, asks concise clarifying questions when essential facts are missing, and
  ends by directing the person to Proposed schedule or back to Needs.
- AC-11: Proposed schedule is visibly and semantically disabled during the
  initial brief stage. A direct `/schedule` visit canonicalizes to `/needs`; the
  first successful agent context update unlocks the tab.
- AC-12: the quiet footer release marker includes the release date and local
  update time with an explicit timezone (`15:23 CEST`).

Tests:

- AC-1/2/3 -> browser: `sidequest.spec.ts > edits Needs and copies the current
  handoff` verifies real textarea overflow, computed scrollbar color, filled CTA
  geometry, clipboard output, and 390px overflow; unit-level CSS testing is
  skipped because it would only assert implementation text rather than rendered
  behavior. Evidence: `artifacts/sidequest-brief.png` and
  `artifacts/sidequest-brief-mobile.png`.
- AC-2 -> integration: existing `App.test.tsx > copies editable Needs for the
  agent` verifies the real clipboard boundary and feedback state.
- AC-4/5/6 -> unit: `mission-prompt.test.ts > copies planning input by stage`,
  `view-model.test.ts > derives the handoff state from mission stage and actor`,
  `webmcp.test.ts > starts a titled replacement plan`, and
  `copy.test.ts > keeps the three-step handoff language consistent`; browser:
  the same `edits Needs` flow verifies the required initial copy, agent stage
  transition, hidden textarea, locked change CTA, and a later copy containing
  human-edited Needs.
- AC-7/8/11 -> integration: `App.test.tsx > starts in Needs with two tabs`
  verifies the absent day metadata, pace, and fake title plus the disabled plan;
  `exposes maps from every located schedule item` verifies the plan-only date
  and location with no current-time line. Browser evidence covers both stages.
- AC-9 -> browser: `sidequest.spec.ts > shows only the two free-form Needs
  examples without overflow` verifies the downward white menu; desktop/mobile
  evidence verifies its position above the day.
- AC-10 -> unit: `mission-prompt.test.ts > asks the agent to structure Needs and
  regenerate every time` locks the clarification, quality-goal, and handoff
  language.
- AC-12 -> integration: `App.test.tsx > shows the latest release at the page
  bottom` locks the complete dated and timezone-qualified timestamp.
- Copy gate -> `copy.test.ts > keeps Needs and Proposed schedule terminology`;
  no copy key changes are planned and English remains the only supported locale.

Sources/References: `src/domain/mission.ts`, `src/domain/mission-transition.ts`,
`src/domain/seed.ts`, `src/store.ts`, `src/mission-prompt.ts`, `src/webmcp.ts`,
`src/view-model.ts`, `src/useMissionViewModel.ts`, `src/App.tsx`,
`src/MissionWorkspace.tsx`, `src/app.css`, their focused tests, and
`e2e/sidequest.spec.ts`.

Before implementation gate:

- [x] Existing textarea overflow, primary action markup, fixed controls, mobile
  spacing, and screenshot evidence inspected at `1701762`.
- [x] Design decision: mirror the native scroll position with a minimal visible
  thumb because overlay scrollbars disappear in screenshots; keep this as local
  view state and never duplicate planning data.
- [x] Named browser and focused contract regressions observed red before
  production edits.

Implementation result:

- Red evidence covered the invisible overflow affordance, the old pseudo-button
  copy action, absent planning stage, leaked structured input during the initial
  handoff, and the blur/remount race that dropped a real browser copy.
- `Mission.context.stage` now persists the `brief -> needs` transition. Agent
  context updates enter the structured stage; the presenter derives human-only
  dirty state from the latest Needs/context event without a second state model.
- The required description has a synchronized high-contrast scrollbar and one
  filled handoff action. After extraction it disappears, the full-width
  draggable Needs list takes over, and only a human edit unlocks the change
  handoff.
- Copied input always includes the live instructions and retained brief, omits
  structured Needs until extraction, omits fake title/location values, and asks
  the agent to clarify missing facts, optimize exclusively for Need coverage,
  set plan date/location, and direct the person to the next view.
- Needs now contains no schedule metadata. Proposed schedule is disabled until
  the agent sets context, then exclusively owns the date and known starting
  location; the redundant current-time line is absent.
- `Load demo` is smaller and sits above the workspace. Its borderless white menu
  opens downward with one restrained shadow. The footer identifies
  `v0.2.1 · updated 3 Sep 2026 · 15:23 CEST`.
- Five mature-TypeScript simplification passes checked the schema-derived stage,
  pure transition, migration, prompt projection, and React action lifecycle.
  `npm run check` passes 68/68 Vitest tests, the strict TypeScript/Vite build,
  and 4/4 Chromium flows. Desktop/mobile evidence is stored in
  `artifacts/sidequest-brief*.png`, `artifacts/sidequest-needs*.png`, and
  `artifacts/sidequest-demo-menu.png`; the final live local Needs DOM was also
  inspected in the in-app browser.
- Production deployment `dpl_HjKqhBToQKPfvZZ6rRAJihwC64Y5` is READY and
  aliased at `https://sidequest-webmcp-eta.vercel.app`; the served bundle was
  checked for the v0.2.1 marker and final handoff instruction.

### 14 [x] Show the real persisted update time

Description: Replace the static footer example with the actual time of the last
accepted mission publication. Keep one persisted timestamp shared by human UI
actions and WebMCP writes; a reload must display the same value instead of
pretending that page load was a plan change.

Acceptance criteria:

- AC-1: `Mission.updatedAt` is an ISO date-time and is the only source for the
  footer update marker.
- AC-2: every accepted store publication, including human actions, WebMCP
  actions, loading a sample, and starting a new plan, stamps the injected wall
  clock; rejected actions neither stamp, persist, nor notify.
- AC-3: a legacy stored v1 mission without `updatedAt` is retained and receives
  the load observation time once; subsequent reloads retain the persisted
  value.
- AC-4: the presenter formats the stored instant in the viewer's local timezone
  with date, 24-hour time, and an explicit zone abbreviation. No timestamp is
  hardcoded in copy or JSX.
- AC-5: the footer refreshes after a real accepted UI write and remains quiet,
  borderless, unobstructed, and within the desktop and 390px layouts.
- AC-6: release metadata advances to v0.2.2 and the production deployment serves
  the dynamic marker at the existing public URL.

Tests:

- AC-1/2 -> unit: `store.test.ts > timestamps only accepted publications with
  the injected clock` and the existing persistence/notification tests.
- AC-2 -> integration: the existing `webmcp.test.ts` mutation tests exercise the
  same store publication path; the store test explicitly covers rejection.
- AC-3 -> unit: `store.test.ts > migrates a stored mission without updatedAt at
  load time`.
- AC-4 -> unit: `view-model.test.ts > formats the persisted update time in the
  viewer timezone`.
- AC-5 -> integration: `App.test.tsx > refreshes the footer after an accepted
  human update`; Playwright's Needs flow and desktop/mobile screenshots verify
  placement and overflow.
- AC-6 -> build/deploy gate plus a production response and rendered-page check.

Sources/References: `src/domain/mission.ts`, `src/domain/seed.ts`, `src/store.ts`,
`src/view-model.ts`, `src/App.tsx`, `src/copy.ts`, their focused tests,
`e2e/sidequest.spec.ts`, package metadata, and deployment documentation.

Before implementation gate:

- [x] Static timestamp source confirmed in `COPY.release`; footer render and
  current store publication path inspected on the clean v0.2.1 worktree.
- [x] Decision: the timestamp means the last accepted mission publication, not
  component render time, release build time, mission-local time, or a ticking
  clock.
- [x] Decision: formatting uses the viewer timezone while the stored source is
  an absolute ISO instant.
- [x] Named store, migration, presenter, and App tests observed red on the
  intended behavior before production edits.

Implementation result:

- Red: the focused run reported 6 intended failures and 39 passes. The store
  returned no timestamp, legacy storage did not migrate it, the presenter had
  no update marker, the App footer stayed at the static `15:23`, and the copied
  prompt did not describe the Work bootstrap.
- `Mission.updatedAt` is now the single persisted fact. The store owns the wall
  clock, stamps only accepted publications, returns the stamped mission, and
  preserves one-time migration of older localStorage values.
- The pure presenter formats the stored instant in the viewer timezone. The
  React view renders that resolved string and contains no date/time literal.
- Focused green: 52/52 store, presenter, App, prompt, copy, and WebMCP tests.
  Full `npm run check`: 72/72 Vitest tests, strict TypeScript/Vite build, and
  4/4 Chromium flows.
- Desktop and 390px evidence under `artifacts/sidequest-brief*.png` and
  `artifacts/sidequest-needs-schedule*.png` shows the real `15:44 CEST`-style
  marker unobstructed at the bottom.
- Mature-TypeScript simplification round 1 kept timestamp truth only on
  `Mission`; round 2 kept the clock at the store boundary and formatting in the
  presenter; round 3 avoided a new service or parallel state; round 4 converted
  new multi-input helpers to named parameter objects and removed test casts;
  round 5 kept React as a one-field Screen renderer with no ticking effect.
- Production deployment `dpl_8P4ExGkicMzp91yzaRFZV3Ap6AP8` is READY and
  aliased at `https://sidequest-webmcp-eta.vercel.app`. A clean 390px browser
  write persisted `2026-09-03T13:46:07.727Z` and rendered
  `v0.2.2 · updated 3 Sep 2026 · 15:46 CEST`.

### 15 [x] Bootstrap the mobile Work page from the copied handoff

Description: Make the intended mobile flow executable without claiming that
two browser sandboxes share localStorage. A person copies one self-contained
handoff into ChatGPT; ChatGPT opens the public Needs route in Work, reads its
Site Tools, and uses the copied planning input to initialize a newly opened
blank board before generating the proposal.

Acceptance criteria:

- AC-1: the first handoff instruction links directly to the public `/needs`
  route and explicitly tells ChatGPT to continue in Work, open the page, invoke
  Site Tools, and not stop at an explanation of those requirements.
- AC-2: the protocol calls `get_mission_state` after opening the page and says
  that a blank live board must be bootstrapped from the copied planning input
  using the live revision.
- AC-3: a revision mismatch between the copied snapshot and a fresh browser
  must not discard the copied brief. An already populated live board remains
  authoritative for its current Needs and locked commitments.
- AC-4: the workflow still uses the existing five tools, needs no backend,
  login, cross-browser localStorage claim, confirmation modal, or sixth tool.
- AC-5: after writes, ChatGPT tells the person to review Proposed schedule on
  the page it opened; the real persisted update marker provides visible write
  confirmation.

Tests:

- AC-1/2/3/5 -> unit: `mission-prompt.test.ts > bootstraps a fresh mobile Work
  board instead of stopping at the mode handoff`.
- AC-1/5 -> copy contract: `copy.test.ts > keeps the agent handoff and mission
  positioning explicit`.
- AC-4 -> integration: `webmcp.test.ts > exposes a bounded atomic catalog`
  remains exactly five; no new server or persistence adapter is introduced.

Sources/References: `src/copy.ts`, `src/mission-prompt.ts`, their tests,
`src/webmcp.ts`, `README.md`, and the public production Needs route.

Before implementation gate:

- [x] Reproduced response classified correctly: moving to Work can be required,
  but that message alone is not a tool call or successful plan write.
- [x] Constraint verified: the Vercel project has no shared storage environment
  configured, and separate mobile/browser sandboxes cannot share localStorage.
- [x] Decision: preserve the simple local-first architecture and make the copied
  planning snapshot the explicit bootstrap payload for the Work-opened page.
- [x] Named prompt/copy regressions observed red before production edits.

Implementation result:

- Red: the prompt/copy tests showed that the handoff opened only the base URL,
  did not continue in Work, and gave no rule for a blank board in a fresh
  browser sandbox.
- The handoff now opens the public `/needs` route, tells ChatGPT to continue in
  Work instead of stopping at an explanation, reads the live board, and
  bootstraps a blank instance from the copied description using its live
  revision. A populated board still protects current Needs and locks.
- The on-page hint names both mobile and desktop. README now states the real
  localStorage boundary and tells the person to review the page opened by Work;
  no backend sync or shared-browser claim was introduced.
- Unit/integration green is included in the 72/72 full run. The real clipboard
  path asserts `/needs`, Work, and blank-board bootstrap; Chromium remains 4/4
  at desktop and 390px.
- Production clipboard verification at 390px confirmed the `/needs` URL, Work
  continuation, and blank-board bootstrap instruction. A separate 1100px run
  confirmed the CTA is visible and the document has no horizontal overflow.
  Real ChatGPT Work/Site Tools discovery remains a truthful manual check rather
  than an automated claim.

### 16 [x] Replace model jargon in the Need priority control

Description: Keep the existing per-Need boolean and minimal text-only toggle,
but replace the implementation vocabulary `Fixed / Flexible` with language that
explains the planning consequence to a person.

Acceptance criteria:

- AC-1: a non-negotiable Need visibly reads `Must keep`; its toggle action is
  announced as allowing that named Need to adapt.
- AC-2: a tradeable Need visibly reads `Can adapt`; its toggle action is
  announced as making that named Need non-negotiable.
- AC-3: toggling still changes the same canonical `fixed` boolean and unlocks
  `Copy changes to ChatGPT`; no second priority field or new workflow appears.
- AC-4: the control remains borderless, backgroundless, and text-only. Both
  labels stay on one line without overlap or horizontal overflow at 390px.
- AC-5: all new user-facing text remains in the English `COPY` source of truth;
  the internal WebMCP `fixed` contract and copied JSON stay unchanged.

Tests:

- AC-1/2/3 -> integration: `App.test.tsx > explains whether each Need must be
  kept or can adapt` checks visible state, accessible action, mutation, and copy
  unlock through the real store.
- AC-4 -> browser: the existing `edits Needs and copies the current handoff`
  flow checks the 390px document width and refreshes
  `artifacts/sidequest-needs-mobile.png`.
- AC-5 -> unit: `copy.test.ts > keeps the agent handoff and mission positioning
  explicit`; a separate i18n codegen gate is skipped because this repository's
  declared P0 locale is English-only and `src/copy.ts` is its copy mechanism.

Sources/References: `src/copy.ts`, `src/MissionWorkspace.tsx`, `src/App.test.tsx`,
`src/copy.test.ts`, `e2e/sidequest.spec.ts`, and the existing `fixed` field in
`src/domain/mission.ts`.

Before implementation gate:

- [x] Design direction: retain Sidequest's bold-clarity Bauhaus system, pure
  neutrals, one red semantic accent, and no added legend, icon, border, panel,
  background, shadow, or animation.
- [x] Existing copy, accessible labels, mutation route, and 390px constraint
  inspected on clean commit `8f29b08`.
- [x] Named App/copy assertions observed red before production copy changes.

Implementation result:

- Red: the focused run failed both named assertions because the interface still
  exposed `Fixed / Flexible` and their implementation-shaped action names.
- `Must keep / Can adapt` now explain planning consequence while the canonical
  WebMCP `fixed` boolean and copied JSON remain unchanged.
- The real 390px browser flow has no horizontal overflow; the labels remain on
  one line in `artifacts/sidequest-needs-add-mobile.png`.
- Included in the 66/66 unit/integration and 4/4 Chromium v0.2.3 gate.

### 17 [x] Make Proposed schedule a read-only expandable result

Description: Treat the Proposed schedule as generated output. Human controls may
inspect it and open its maps, but may not edit, add, remove, reorder, lock, skip,
or complete schedule items.

Acceptance criteria:

- AC-1: the plan title and every schedule item are read-only in the human UI;
  there is no plan add control, drag behavior, item action menu, or human plan
  mutation action.
- AC-2: clicking anywhere in an item's summary row (time, title, location, or
  chevron) independently expands or collapses that item. Multiple items may be
  open at once and expansion does not change the mission revision.
- AC-3: expansion uses Motion height/opacity animation without animating or
  replacing the title typography.
- AC-4: each collapsed row shows its concrete location instead of the internal
  `planned`, `active`, `completed`, `skipped`, or `locked` state.
- AC-5: opening an item does not add a red selected state; the single red accent
  remains reserved for semantic primary actions elsewhere.
- AC-6: ChatGPT can still replace and update the Proposed schedule through the
  existing five WebMCP tools, while Needs retain their current inline editing
  and drag behavior.
- AC-7: the planning handoff asks ChatGPT to use a concise primary city/area as
  the plan location label and a short, specific, playful generated title.

Tests:

- AC-1/2/4/5 -> integration: `App.test.tsx > keeps Proposed schedule read-only
  and independently expands whole rows` checks the real rendered controls,
  locations, two simultaneous expansions, collapse, and unchanged store.
- AC-3/5 -> browser: the generated-proposal E2E checks the Motion detail shell,
  stable title typography, neutral expanded time, and non-overlap.
- AC-6 -> integration: the existing WebMCP generation flow remains green and
  the schedule appears after tool writes; Needs drag/edit coverage remains.
- AC-7 -> unit: `mission-prompt.test.ts > asks the agent to structure Needs and
  regenerate every time` locks the primary-area and playful-title instructions.

Sources/References: `src/view-model.ts`, `src/useMissionViewModel.ts`,
`src/MissionWorkspace.tsx`, `src/App.tsx`, `src/app.css`, their colocated tests,
and `e2e/sidequest.spec.ts`.

Before implementation gate:

- [x] Domain/view boundary fixed: expansion is local View State; generated
  schedule content remains canonical Domain State and WebMCP remains its writer.
- [x] Minimal renderer contract chosen: rows expose renderable facts plus one
  `expanded` boolean; no human edit capability is projected.
- [x] Named read-only/multi-expand integration assertion observed red before
  production edits.

Implementation result:

- Red: the named integration failed on the missing location, plan drag surface,
  item mutation controls, title editor, singleton expansion, and persisted
  selection behavior.
- The human Screen contract now exposes only schedule facts plus `expanded`;
  title/item editing, add, delete, status, lock, and reorder ViewActions were
  removed. The five WebMCP writers and domain invariants remain intact.
- A whole-row button toggles independent local expansion. Motion animates only
  the detail shell's height/opacity, leaving title typography stable and all
  opened rows in normal document flow.
- The overall label is the concise primary area (`Baška Voda` in evidence),
  item rows show precise places, and the prompt requires a primary city/area
  plus a short, specific, playful generated title.
- Desktop and 390px evidence in `artifacts/sidequest-needs-schedule.png` and
  `artifacts/sidequest-needs-schedule-mobile.png` shows two open items, neutral
  times, no overlap, and no human plan controls.
- Five mature-typescript simplification rounds: (1) separated expansion from
  Domain State; (2) narrowed human ViewActions to Needs and inspection; (3)
  retained WebMCP proposal writes at the existing adapter boundary; (4) deleted
  obsolete plan capability fields, reorder helpers, editors, action components,
  and copy; (5) kept one simple Motion shell and removed now-unused editor props
  and CSS. Each changed round was followed by its focused gate.

### 18 [x] Align the add-Need interaction with the list

Description: Make the add control read as the next Need row rather than a
separate form below the list.

Acceptance criteria:

- AC-1: the plus sits in the same column and footprint as the circular Need
  checkbox above it.
- AC-2: after the plus is pressed, the input appears on that same row in the
  future Need label column.
- AC-3: the input uses the same typography and spacing as a rendered Need,
  with no border or background; only its placeholder is lighter.
- AC-4: Enter still creates the Need and Escape still closes the input.

Tests:

- AC-1/2/4 -> integration: `App.test.tsx > adds a Need from an item-shaped inline
  row` verifies shared row ownership and the real store write.
- AC-3 -> browser: the 390px Needs screenshot and overflow check verify the
  item-shaped alignment and typography.

Before implementation gate:

- [x] Named integration assertion observed red before production edits.

Implementation result:

- Red: the named assertion failed because the add button and input had no shared
  item-shaped row.
- The new grid uses the exact 38px control column and 10px list gap. Browser
  geometry proves both the plus/checkbox and input/Need-label offsets differ by
  less than one pixel at 390px.
- `artifacts/sidequest-needs-add-mobile.png` shows the borderless input with the
  list font and lighter placeholder. Enter and Escape remain covered.
- Final v0.2.3 gate: 66/66 unit/integration tests, TypeScript/Vite build, and
  4/4 Chromium tests passed.
- Production deployment `dpl_HVJ6SSik6Rrz1q47s3V7P1u1sceg` reached `READY`
  and the public alias served asset `index-BB5Jwo5a.js` with the v0.2.3 marker
  and read-only proposal copy.

### 19 [x] Transfer a complete session through a shareable URL

Description: Let a person copy one self-contained link on mobile, send it to
another person, or open it on desktop without an account, backend, or shared
browser localStorage. Every successful WebMCP write returns a refreshed link
so ChatGPT can finish with a real destination instead of prose such as "open
Proposed schedule".

Acceptance criteria:

- AC-1: `Copy session link` serializes the complete canonical `Mission`,
  including Needs, proposal, sources, locks, revision, events, and update time.
- AC-2: the payload is canonical JSON encoded as UTF-8, compressed with gzip,
  and encoded as unpadded base64url in the URL fragment (`#session=...`), so it
  is not sent to Vercel as part of the HTTP request.
- AC-3: opening a valid link on an empty browser validates it with
  `MissionSchema`, imports it into that browser's localStorage, preserves the
  current `/needs` or `/schedule` route, and removes the payload from the
  visible URL after bootstrap.
- AC-4: malformed, oversized, or schema-invalid payloads never overwrite valid
  local data and are removed from the visible URL.
- AC-5: Unicode survives round-trip and the generated link is deterministic for
  the same mission and page route.
- AC-6: the action is a small borderless footer utility and does not compete
  with the primary ChatGPT handoff.
- AC-7: a browser test clears storage to simulate another device, opens the
  copied link, sees the complete proposal, and still sees it after reload.
- AC-8: documentation states that anyone holding the link can read its embedded
  plan and that later edits do not synchronize automatically between copies.
- AC-9: every successful WebMCP mutation returns a `sessionUrl` representing
  the post-write mission; the copied protocol requires ChatGPT to render the
  final returned URL as a clickable `Open updated Sidequest plan` link.
- AC-10: the read tool also returns the current `sessionUrl`, so an unchanged
  board can always be handed off without adding a sixth WebMCP tool.

Tests:

- AC-1/2/4/5 -> unit: `session-link.test.ts` verifies the gzip signature,
  round-trips the real Unicode fixture, proves deterministic output, and
  rejects invalid/oversized fragments.
- AC-3/4 -> store/unit: `store.test.ts > imports only a validated shared
  session` proves persistence and invalid-data preservation.
- AC-6 -> integration: `App.test.tsx > copies a complete session link from the
  footer` checks the rendered action and decoded clipboard state.
- AC-7 -> browser: `sidequest.spec.ts > transfers the complete proposal to an
  empty browser through its session link` verifies import, URL cleanup, and
  reload at 390px and desktop widths.
- AC-9/10 -> integration: `webmcp.test.ts > returns a refreshed portable link
  after every successful write` decodes the final tool result and verifies its
  post-write revision; prompt/copy tests require the clickable-link handoff.

Before implementation gate:

- [x] Boundary decision: URL decoding is a pure adapter; schema validation and
  persistence remain explicit before React and WebMCP registration.
- [x] Privacy decision: use a fragment, never a query parameter; clear it with
  `history.replaceState` after the one-time import.
- [x] Named unit/integration assertions observed red before production edits.

Implementation result:

- Red was observed independently at each boundary: the codec module did not
  exist; the store had no validated shared-session import; the footer exposed
  no copy action; WebMCP results contained no `sessionUrl`; and the copied
  protocol allowed ChatGPT to finish without a link.
- `session-link.ts` now performs deterministic UTF-8 JSON -> gzip -> unpadded
  base64url encoding. Decode rejects malformed base64url, non-gzip data,
  oversized compressed or expanded payloads, invalid UTF-8, invalid JSON, and
  schema-invalid missions without replacing local data.
- Valid fragments import before store creation, retain the requested route,
  and disappear through `history.replaceState`. The footer copies the current
  route as a small borderless utility; every successful WebMCP read and write
  returns a post-operation link, with no sixth tool or backend.
- The handoff now explicitly requires the exact final `sessionUrl` as
  `[Open updated Sidequest plan](...)`; it no longer ends with ambiguous prose
  telling the person to open a tab that is not linked.
- Full gate: 73/73 Vitest tests, strict TypeScript/Vite build, and 5/5 Chromium
  flows. The new browser flow creates a proposal, opens the returned link in an
  empty 390px browser context, verifies the complete state, removes the hash,
  resizes to desktop, reloads, and verifies persistence.
- Mature-TypeScript round 1 found that an unbounded source URL could make a
  schema-valid mission unshareable, so source URLs are capped at 2,048 chars.
  Round 2 kept `Mission` as the only truth and derived links on demand instead
  of adding synchronized session state. Round 3 kept compression/decoding in
  one adapter, persistence in the store, and bootstrap in the composition
  root. Round 4 removed the one-field decode params wrapper and a duplicated
  URL-construction branch. Round 5 kept React to one transient copy-feedback
  boolean and one click effect; no context, service, or new component was
  justified.
- Production deployment `dpl_BeJuaeEp2SsWCAGN1tWZ5ZxBBDE3` is `READY` and
  aliased at `https://sidequest-webmcp-eta.vercel.app`. The public asset
  `index-C5ZncSXC.js` contains v0.2.4, the mandatory clickable-link protocol,
  and portable URL result copy. A production Site Tool write returned a
  608-character link for revision 1; a separate empty browser imported it at
  `/schedule`, stored revision 1, and cleaned the fragment from the address.

### 20 [~] Keep ChatGPT's response in the person's language

Description: Make the copied planning protocol keep questions, progress
summaries, and the final answer in the language of the person's request, even
though Sidequest's protocol wrapper and UI copy remain English.

Acceptance criteria:

- AC-1: The copied protocol tells ChatGPT to use the language of the person's
  free-form brief or latest Needs request for all user-facing replies.
- AC-2: If that request is mixed-language or ambiguous, ChatGPT is instructed
  to follow the language of the person's latest message.
- AC-3: Proper names, source titles, and exact tool-returned values remain
  unchanged, including the final clickable session URL.
- AC-4: The rule is defined once in the English-only `src/copy.ts` source of
  truth; no parallel locale state or UI localization mechanism is introduced.
- AC-5: The language rule is the first instruction in the copied handoff and
  explicitly ignores surrounding conversation, earlier messages, UI locale,
  and inferred profile language. English planning input makes every message
  English; Polish planning input makes every message Polish, including
  questions, progress, tool-use narration, and the final response.
- AC-6: The agent is explicitly forbidden from narrating in one language while
  generating plan content in another.

Tests:

- AC-1/3/4 -> unit: `copy.test.ts > keeps the agent handoff and mission
  positioning explicit` asserts the response-language and unchanged-value
  contract directly on `COPY.promptProtocol`.
- AC-1/2/3 -> integration: `mission-prompt.test.ts > keeps the agent response
  in the person's request language` verifies that the complete copied prompt
  carries the fallback and preservation rules.
- AC-5/6 -> integration: the same test verifies first-position precedence and
  the whole-message English/Polish contract against conversation-language
  leakage.
- A separate translation/codegen gate is skipped because P0 has one declared
  UI locale and the change instructs the external agent how to select its
  response language; it does not add a localized UI string catalog.

Sources/References: `src/copy.ts`, `src/copy.test.ts`,
`src/mission-prompt.test.ts`, `src/mission-prompt.ts`.

Before implementation gate:

- [x] Language source fixed: the person's brief/Needs request, not the English
  Sidequest protocol wrapper.
- [x] Fallback fixed: the person's latest message when the request is mixed or
  ambiguous.
- [x] Named unit and integration assertions observed red before production
  copy changes.

Implementation result:

- Behavioral red: `npm run test -- src/copy.test.ts src/mission-prompt.test.ts`
  ran 7 tests and failed only the two new language-contract assertions because
  the generated handoff did not yet contain the response-language rules.
- Focused green: the same command passed 7/7 tests after the protocol became
  explicit about response language, mixed-language fallback, and values that
  must remain unchanged.
- Full local gate: `npm run check` passed 74/74 Vitest tests, the strict
  TypeScript/Vite production build, and 5/5 Chromium flows.
- Mature-TypeScript round 1 found no Domain State or transition to add: response
  language is an agent-output rule, not persisted mission truth. Round 2 kept
  language selection at the copied handoff boundary instead of leaking it into
  React or the store. Round 3 retained `COPY.promptProtocol` as the one owner
  instead of adding a language service or module. Round 4 kept the rule as
  direct prose rather than introducing a helper, type, or parser with no second
  use. Round 5 found no React, component, state, effect, or file-structure change
  justified by this contract-only update.
- Production deployment `dpl_L4JZ9eMTBHRT5XmDe26jZwfvfKfu` reached `READY`
  and is aliased at `https://sidequest-webmcp-eta.vercel.app`. Public asset
  `index-BQQJgeUW.js` contains v0.2.5, both language-selection rules, and the
  exact-session-link preservation rule.
- Regression reopened after a real English demo handoff still produced Polish
  narration about creating an English plan. The initial wording governed plan
  output but did not override the surrounding conversation strongly enough.
- Regression red: `npm run test -- src/copy.test.ts src/mission-prompt.test.ts`
  passed the five existing assertions and failed the two strengthened language
  assertions because the handoff did not start with a mandatory language rule.
- Regression green: the same focused command passed 7/7 after one dedicated
  language paragraph became the first handoff instruction. It now governs all
  questions, progress updates, tool-use narration, and the final response and
  explicitly forbids cross-language narration.
- The combined post-regression gate passed 74/74 Vitest tests, strict build,
  and 5/5 Chromium flows.
- Mature-TypeScript follow-up round 1 still introduced no language state.
  Round 2 moved the contract to the first handoff boundary instead of relying
  on late protocol prose. Round 3 kept it in the existing copy module. Round 4
  removed the weaker duplicated wording from `promptProtocol`. Round 5 changed
  no React state, component, effect, or physical module boundary.

### 21 [x] Make daymaker.fun the production domain

Description: Attach the purchased `daymaker.fun` domain to the existing Vercel
project, preserve the current deployment alias, and make the custom HTTPS origin
the single canonical URL copied into ChatGPT handoffs and delivery docs.

Acceptance criteria:

- AC-1: Vercel reports `daymaker.fun` as configured correctly for the
  `sidequest-webmcp` production project and serves the current app over HTTPS.
- AC-2: `www.daymaker.fun` resolves to Vercel and serves or redirects to the
  same production app instead of Hover's placeholder.
- AC-3: copied handoffs open `https://daymaker.fun/needs`; the former Vercel
  alias remains usable but is not duplicated as a second canonical constant.
- AC-4: README submission metadata names `https://daymaker.fun` as the
  production URL.

Tests:

- AC-3 -> unit: `copy.test.ts > keeps the agent handoff and mission positioning
  explicit`; integration: `mission-prompt.test.ts > bootstraps a fresh mobile
  Work board instead of stopping at the mode handoff` and the copied-prompt E2E.
- AC-4 -> unit: `delivery.test.ts > documents the public submission metadata`.
- AC-1/2 -> deployment verification: Vercel domain verification plus HTTPS
  response checks for the apex and `www` hosts; no unit test can prove external
  DNS propagation or certificate issuance.

Sources/References: Hover DNS for `daymaker.fun`, Vercel project
`sidequest-webmcp`, `src/copy.ts`, prompt tests, `README.md`.

Before implementation gate:

- [x] Vercel ownership and target project confirmed before DNS mutation.
- [x] Hover apex A records set to Vercel's two rank-1 recommended addresses;
  `www` CNAME set to the project-specific Vercel DNS target.
- [x] Canonical-URL assertions observed red before production copy/docs change.

Implementation result:

- Behavioral red: `npm run test -- src/copy.test.ts src/mission-prompt.test.ts
  src/delivery.test.ts` ran 8 tests and failed exactly the three assertions that
  still observed the Vercel alias in the canonical constant, generated handoff,
  and README.
- Focused green: the canonical copy, prompt, delivery, and footer-version suites
  passed 13/13 tests after `SIDEQUEST_URL` changed once at its source.
- Full local gate: `npm run check` passed 74/74 Vitest tests, the strict
  TypeScript/Vite build, and 5/5 Chromium flows.
- Mature-TypeScript round 1 retained no domain state for a deployment address.
  Round 2 traced the copied handoff through the existing `SIDEQUEST_URL`
  boundary and kept portable session links based on the page actually opened.
  Round 3 rejected a second environment/config service for one public constant.
  Round 4 required no new helper, wrapper, type, or cast. Round 5 required no
  React component, state, effect, or renderer change.
- Production deployment `dpl_92b8LT2S8THNCzxCw1iHwp8xj8ZS` reached `READY`
  with `https://daymaker.fun` as its alias. The apex passes Vercel domain
  verification and serves HTTP 200 over a valid certificate; public asset
  `index-BvipF-GN.js` contains v0.2.6 and the canonical custom origin.
- Hover retains its existing MX record. The obsolete `* -> 216.40.34.41`
  placeholder was removed after it conflicted with the exact `www` CNAME.
- `www.daymaker.fun` passed Vercel verification through its exact CNAME, received
  renewable certificate `cert_WWZgc9o4ghNPv0uy3VSVG3JP`, and loaded the live
  `/needs` app in the browser. Both Vercel edge addresses returned HTTP 200 with
  certificate validation for the `www` host.

### 22 [~] Raise the desktop typography scale

Description: Give the wide-screen interface a more confident contemporary
type scale while preserving the existing compact mobile layout and strict
minimal visual language.

Acceptance criteria:

- AC-1: At widths above 560px, the root type scale is 18px so existing rem-based
  headings, schedule rows, Needs, metadata, and actions grow proportionally.
- AC-2: At 390px, the root scale remains 16px and the page keeps zero horizontal
  overflow.
- AC-3: The change adds no border, gradient, decorative shadow, new animation,
  or component-specific font override.
- AC-4: Desktop and mobile screenshots show readable text without clipping,
  overlap, or viewport bleed.

Tests:

- AC-1/2 -> browser: `sidequest.spec.ts > edits Needs and copies the current
  handoff` asserts the computed root size at 1100px and 390px plus the existing
  mobile overflow contract.
- AC-3 -> review: focused CSS diff contains one responsive root declaration.
- AC-4 -> browser evidence: `artifacts/sidequest-brief.png` and
  `artifacts/sidequest-brief-mobile.png`.
- Unit coverage is skipped because this is a CSS rendering contract; the real
  Chromium computed style and screenshots exercise the affected boundary.

Sources/References: `src/app.css`, `e2e/sidequest.spec.ts`, existing visual
evidence under `artifacts/`.

Before implementation gate:

- [x] Scope fixed to the desktop root scale; no component or domain contract
  changes.
- [x] Named computed-style assertion observed red before the CSS change.

Implementation result:

- Behavioral red: `npx playwright test -g "edits Needs and copies the current
  handoff"` failed on the new desktop assertion with `Expected: 18px`,
  `Received: 16px` before the production CSS changed.
- Focused green: the same real Chromium flow passed with an 18px desktop root,
  16px mobile root, and no 390px overflow.
- Full gate: 74/74 Vitest tests, strict TypeScript/Vite build, and 5/5 Chromium
  flows passed. `artifacts/sidequest-brief.png` and its mobile counterpart were
  inspected with no clipping, overlap, or viewport bleed.
- Frontend-design kept the chosen direction brutally minimal: one responsive
  root scale raises the complete hierarchy without component overrides,
  additional decoration, or new motion.
- Mature-TypeScript rounds 1–2 found no domain/view state or action boundary to
  change; round 3 kept ownership in the existing stylesheet; round 4 retained
  one direct media query rather than a helper or token layer; round 5 introduced
  no React component, context, memoization, or effect.

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
