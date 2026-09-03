# Bug 004 — Copied prompt deliberates over an unrelated board

| Pole | Wartość |
|---|---|
| Start pracy | 2026-09-03 18:54 CEST |
| Koniec pracy | — |
| Status | analiza w toku |
| Klasyfikacja | kontrakt/codegen |
| Rodzaj dowodu | niewizualny |
| Baza analizy | `5f6a9255e1d0` |
| Commit builda nagrania przed | — |
| Commit builda nagrania po | — |
| Wynik obserwacji compositora | — |

## Zgłoszenie

> chat po wklejeniu prompta mówi tak:
> I’m opening the live Sidequest board, checking its current state first, and then I’ll research and build the complete plan there.
> Used Brave Browser integration, loaded a tool, ran commands
> The live board is still showing an unrelated Palermo starter plan, so I’ll bootstrap this Baška Voda request from the copied brief while preserving anything the board marks as locked. I’m now validating a practical shaded ride, parking, lunch, and snorkeling sequence.
>
> a w prompt powinno być jasno powiedziane ze ma zacząć od nowa i nie ma się pierdolić - ma odpalić komende która nadpisuje to co tam jest - a tu jest jakieś wnioskowanie i inne gówno - to ma działać szybko
>
> **Uzupełnienie 1:** popraw to i wrzuć nową wersje - mamy powoli mało czasu

## TL;DR

At base `5f6a9255e1d0`, the copied contract gives the live browser state authority
over the copied request: `promptProtocol` conditionally bootstraps only a blank
board and explicitly preserves current Needs and locks on a populated board.
`planningInstruction` also puts clarification and research before the reset,
while the `replacePlan` reducer retains every locked stop from the unrelated
mission. Together these rules cause the agent to compare and reconcile Palermo
instead of treating the pasted Baška Voda input as an unconditional new plan.

## Kryteria akceptacji

- AC-1: A copied planning prompt explicitly treats its planning snapshot as a new request and replaces any unrelated open board immediately.
- AC-2: The agent calls `update_day_context` with `replacePlan: true` before researching places or deliberating over whether existing unlocked content should survive.
- AC-3: Only commitments explicitly present in the copied planning input may survive; unrelated locks from the browser's previous board must not be preserved.
- AC-4: The existing read-first revision safety, response-language rule, final session link, two-way feedback guidance, tool names, and input shape remain unchanged.
- AC-5: The corrected prompt is shipped to `daymaker.fun` as a new release and verified in the public production asset.
- Topologia wykonania: liniowa.

Untouched siblings: Site Tool names and schemas, UI layout, session encoding, map links, and Needs editing.

Out of scope: changing ChatGPT's platform-level progress narration or browser-integration UI outside the copied Daymaker prompt.

## Szczegóły — odpowiedzialny kod

- `src/mission-prompt.ts:26-34` (`toMissionPrompt`, base `5f6a9255e1d0`) emits
  `planningInstruction` and then `promptProtocol` as the executable contract.
- `src/copy.ts:40-48` (same base) says to preserve locks, conditionally handles
  only a blank board, and gives populated live Needs precedence. Those clauses
  directly license the observed comparison and narration.
- `src/domain/mission-&#116;ransition.ts:123-131` (same base, `applyContext`) keeps
  every locked stop when `replacePlan` is true, so the command does not fully
  implement the fresh-plan meaning requested by the user.
- Production consumers of the shared prompt are `src/view-model.ts:259`
  (`workspaceFor`) and `src/useMissionViewModel.ts:223` (clipboard dispatch).
  Both must receive the same corrected prompt. No other production consumer may
  change.
- Pattern registry check: no existing `bugs/PATTERNS.md` class describes a
  copied instruction giving stale browser state precedence over explicit input.

## Proponowany test (najpierw czerwony)

- AC-1/2/4: `mission-prompt.test.ts > starts a new plan immediately instead of
  reconciling an unrelated live board` freezes the final copied output. It must
  require a read only for revision, immediate `update_day_context` with
  `replacePlan: true`, reset before research, and explicit rejection of
  comparison/reconciliation/preservation of unrelated browser content. Existing
  language, link, and feedback tests remain the preservation suite.
- AC-3: `domain/mission.test.ts > replaces the complete previous proposal when
  starting a new plan` runs the real `UpdateContext` reducer on the fixture
  containing a locked dinner and expects no previous stop to survive.
- AC-5: after deployment, fetch the public JavaScript asset from
  `https://daymaker.fun/needs` and require the release plus the new reset
  contract phrases.
- No fakes are used by the two carrying tests; both exercise the production
  prompt composer or pure domain reducer directly.

## Rozwiązanie

Make the copied snapshot the only planning source of truth. Keep the mandatory
read first solely to obtain the live concurrency revision, then require the
context replacement immediately, before research, clarification, or explanatory
narration. Remove the clauses that preserve unrelated live Needs or locks.

Align `replacePlan: true` with its new-plan name by clearing the complete prior
proposal. Commitments present in the copied snapshot remain planning input and
must be recreated in the fresh proposal; no state from an unrelated browser
session survives implicitly. Tool names, schemas, UI, session encoding, and map
behavior do not change.

## Raport z implementacji i testów

### Cleanup

- No temporary resources created.

## Dowód końcowego compositora

Not applicable: the defect is a non-visual prompt contract.

## Protokół weryfikacji
