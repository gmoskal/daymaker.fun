# TODO 01 — Sidequest P0

> Date: 2026-09-03
> Status: implementation and production deployment verified; Git integration in progress
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
- [x] 4. Implement the responsive expedition-console UI and map
- [x] 5. Complete delivery files, full gates, visual QA, and simplification rounds
- [~] 6. Connect and deploy the public repository on Vercel

## Blocking decisions accepted in this plan

- One `Mission` aggregate and one external `MissionStore` are the only source of domain truth.
- A small direct `MissionAction` discriminated union is sufficient; event sourcing, a backend, router, custom chat, and additional state libraries are out of scope.
- Zod strict schemas are the runtime boundary and the source for inferred input types plus WebMCP JSON Schema.
- View state (selected stop, copy feedback, WebMCP availability) remains separate from mission state.
- The page registers tools once from the top-level composition root and passes `{ signal }` as the current second argument to `registerTool`.
- The visual direction is a Croatian field-operations log: warm paper, deep Adriatic ink, contour-line texture, safety-orange accents, and restrained motion.
- The map line is explicitly an overview, never turn-by-turn navigation.

## Recommended implementation sequence

1. Test/build harness and behavioral red tests.
2. Pure domain transition and store/persistence.
3. WebMCP adapter and contract tests.
4. Pure Screen projection, React View, Leaflet adapter, and E2E.
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
- AC-4: reset restores revision 6, the active gravel ride, and an empty event log; invalid persisted data removes only the Sidequest key.
- AC-5: human Done/Skip/Undo use the same action path as WebMCP.

Tests:

- AC-1/2/3 -> unit: `mission.test.ts > applies actions and rejects invariant violations`.
- AC-4 -> unit: `store.test.ts > restores and loads the deterministic mission`.
- AC-5 -> integration: `store.test.ts > persists an accepted human action and notifies subscribers`; React reinforcement remains in task 4.

Sources/References: `src/domain/mission.ts`, `src/domain/seed.ts`, `src/store.ts`.

Implementation result:

- Behavioral red: `npm run test -- src/domain/mission.test.ts src/store.test.ts` ran 14 tests with 12 intended failures across transition, stale/locked/order errors, add, persistence, load, and reset.
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

### 4 [x] Implement the responsive expedition-console UI and map

Description: Render a polished one-screen mission board whose timeline, map, context, and audit log all project the same mission and remain fully useful in manual mode.

Acceptance criteria:

- AC-1: the initial mission and complete replanned outcome are understandable at 1440x900 without narration.
- AC-2: timeline and map use the same future-stop order; completed/skipped stops remain visible but are excluded from the route.
- AC-3: selecting cards/markers synchronizes selection; source links are HTTPS with secure link attributes; map attribution remains visible.
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

- Behavioral red: `npm run test -- src/copy.test.ts src/view-model.test.ts src/App.test.tsx` failed 6/6 assertions against the UI skeleton, covering copy, screen projection, manual status change, source links, and reset.
- Green: the same focused suite passed 6/6 and `npm run build` completed successfully.
- Browser green: `npm run test:e2e` passed the real revision 7 -> 12 flow through a native-shaped `document.modelContext.registerTool` harness, verified five registrations, the locked 18:30 dinner, and no horizontal overflow at 390px.
- Visual evidence inspected: `artifacts/sidequest-desktop.png` (1440px) and `artifacts/sidequest-mobile.png` (390px). A low-contrast reset label found during inspection was corrected and both screenshots were regenerated.
- Timeline, accessible map route list, Leaflet markers, and polyline derive from one presenter route; completed/skipped stops stay in history but leave the active route.

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

### 6 [~] Connect and deploy the public repository on Vercel

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

## Risks and dependencies

- Leaflet tiles have no SLA; the timeline remains complete and the map label states its limited role.
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

- Backend, authentication, custom chat/LLM, directions, live GPS/weather, reservations, multi-user sync, multiple missions, declarative WebMCP, iframe tools, automatic research, P1 sharing/presentation modes, Devpost submission, and video recording.
