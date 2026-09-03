# Bug 003 — Oś timeline’u koliduje z treścią

| Pole | Wartość |
|---|---|
| Start pracy | 2026-09-03 04:06 |
| Koniec pracy | 2026-09-03 04:43 |
| Status | zweryfikowany |
| Klasyfikacja | klient-lokalny |
| Rodzaj dowodu | wizualny-statyczny |
| Baza analizy | `46959e5a1bb99b0346eff8f91ab5f46fc65d9a53` |
| Commit builda nagrania przed | — |
| Commit builda nagrania po | — |
| Wynik obserwacji compositora | — |

## Zgłoszenie

> coś tu nie gra w design, rzeczy na siebie nachodzą i nie są czyste i dragowalnosc zepsułeś
>
> **Uzupełnienie 1:** ta linia i design timeline ma być bliżej tego
>
> **Uzupełnienie 2:** menu itemu powinno byc rozwijane - nie wiem czemu mar done jest na czerwono
>
> **Uzupełnienie 3:** teraz przyciski nie roznia sie od tekstu to powinno być menu ktore sie tam rozwija i zostaje rozwiniete na innych (Wspolny stan) takie wyjezdzajace poziome akce z ikony akcji

## TL;DR

Oś czasu jest obecnie generowana osobno przez każdy wiersz i przebiega przez tę samą kolumnę co statusy, dlatego tekst i linia nakładają się. Właściwym źródłem geometrii jest cała lista: jedna ciągła oś, godziny wyrównane po jej lewej stronie oraz tytuł ze statusem po prawej. Dane i kolejność planu są poprawne; wadliwy jest wyłącznie lokalny układ CSS.

## Kryteria akceptacji

- AC-1: timeline ma jedną cienką, neutralną, przerywaną oś od pierwszego do ostatniego elementu, zgodną z dostarczoną referencją.
- AC-2: godziny są wyrównane do prawej tuż przed osią, a tytuł i status są po jej prawej stronie.
- AC-3: linia nie przechodzi przez godzinę, status, tytuł, chevron ani rozwinięte akcje.
- AC-4: aktywność komunikuje wyłącznie czerwony czas/status; tytuł i akcje rozwijanego menu pozostają neutralne.
- AC-5: layout pozostaje bez ramek, kart, cieni i gradientów oraz nie powoduje poziomego overflow na 390 px.
- AC-6: zmiana geometrii nie zmienia dragowania, otwierania, edycji, bocznych zakładek, domeny ani pięciu narzędzi WebMCP.
- AC-7: rozwinięty element pokazuje osobną ikonę akcji; uruchomienie jej wysuwa poziomy pasek jednoznacznych ikon, a otwarty tryb akcji pozostaje wspólny, gdy użytkownik wybierze inny element.

## Szczegóły — odpowiedzialny kod

- Cel: `.stop-list`, `.stop-open`, `.stop-open > time`, `.status` i odstępy szczegółów w `src/app.css`.
- Dotychczasowy konsument: wyłącznie panel `Plan`; listy wymagań, Route i Context pozostają nietknięte.
- Powiązane raporty wspólnego przebiegu: `001-title-expand-drag.md`, `002-font-distortion-on-expand.md`.
- Referencja użytkownika: obraz redakcyjnego timeline'u dołączony bezpośrednio w rozmowie. `bugs/assets/003-timeline-axis-layout/before.png` zachowuje zgłoszony stan aplikacji przed zmianą.
- Topologia wykonania: liniowa w jednym checkoutcie; raport może być dostarczony wspólnym commitem z 001/002, ale zachowuje osobne dowody.

## Proponowany test (najpierw czerwony)

- Playwright mierzy jedną pseudo-oś na `.stop-list`, jej położenie między godziną i tytułem oraz brak pseudo-linii na pojedynczych wierszach.
- Screenshot desktop i 390 px potwierdza kompozycję względem referencji.

## Rozwiązanie

Oś przeniesiono z każdego `.stop-row` do jednego pseudo-elementu listy
`.stop-list`. Wiersz ma trzy jawne kolumny: czas wyrównany do prawej, wąska
przerwa osi i treść po prawej. Rozwinięte szczegóły korzystają z tej samej
geometrii, więc linia nie przecina etykiet ani akcji.

Element nadal otwiera się przez tytuł lub chevron. Osobna, frameless ikona `…`
wysuwa poziomy zestaw ikon akcji; stan otwarcia tego zestawu należy do całego
planu, dlatego pozostaje otwarty także dla kolejnego wybranego elementu. `Mark done`
jest neutralne — czerwień komunikuje wyłącznie aktywny czas/status. Nie zmieniono
modelu domenowego, Route, Context ani pięciu narzędzi WebMCP.

## Raport z implementacji i testów

- Czerwony test: `npx playwright test -g "preserves readable schedule hierarchy" --timeout=30000`.
- Wynik przed implementacją: Playwright wykrył brak osi na `.stop-list`, linię na każdym `.stop-row`, status w kolumnie czasu i godzinę wyrównaną do lewej (`axisContent: none`, `rowContent: "\"\""`, `statusColumn: 1`, `timeAlign: left`).

Zmiany:

- `src/app.css`: jedna kropkowana oś listy, jawne kolumny czasu/treści, brak
  row-level linii, flat action tray i brak dekoracyjnych powierzchni.
- `src/MissionWorkspace.tsx`: frameless `…` i poziome akcje ikonowe.
- `src/App.tsx`: wspólny `actionsOpen` utrzymujący tryb akcji między elementami.
- `e2e/sidequest.spec.ts`: pomiar osi, czasu, statusu, overflow i screenshot
  rozwiniętego menu.

Dostarczenie: commit `33facb41ec148b6167306e7493fccb50be0fded5` na `main`.

GREEN i bramka zakresu:

```text
$ npm run check
Test Files  8 passed (8)
Tests  48 passed (48)
✓ built in 2.98s
4 passed (20.4s)
```

- AC-1/2/3: zielony — pomiary pseudo-elementów i kolumn w
  `preserves readable schedule hierarchy and one item menu`.
- AC-4/7: zielony — test i screenshot potwierdzają neutralne akcje oraz wspólny,
  poziomy tray.
- AC-5: zielony — viewport 390 px bez overflow; brak border/shadow/gradient.
- AC-6: zielony — drag/edit E2E i test katalogu dokładnie pięciu WebMCP tools.

### Cleanup

- Raport nie utworzył osobnego worktree ani procesu w tle.
- Zachowano lokalne, ignorowane przez Git: `before.png`, `after-desktop.png` i
  `after-mobile.png` (łącznie 144 KiB) przez wymagany okres retencji.
- Obowiązkowa kontrola dwóch poprzednich numerów: ścieżka sidequest
  `/Users/gmm/tmp/codex/bug-002` jest czysta; `/Users/gmm/tmp/codex/bug-001`
  należy do innego repozytorium (`btc-demo`) i została pozostawiona bez zmian.

## Dowód końcowego compositora

- Przed: [nakładające się per-row linie i treść](assets/003-timeline-axis-layout/before.png)
- Po, desktop: [jedna oś i poziome menu akcji](assets/003-timeline-axis-layout/after-desktop.png)
- Po, mobile: [czytelny timeline bez overflow](assets/003-timeline-axis-layout/after-mobile.png)

## Protokół weryfikacji

1. Na commicie bazowym `46959e5a1bb99b0346eff8f91ab5f46fc65d9a53`
   uruchom końcowy test E2E z commita dostarczenia; ma zgłosić brak osi na liście,
   per-row linię, status w kolumnie czasu i `text-align: left`.
2. Na `main` uruchom `npm run check`; oczekiwane: 48/48 Vitest, poprawny build i
   4/4 Chromium. Test przeglądarkowy używa prawdziwych CSS/React/Motion, bez mocka
   geometrii.
3. Otwórz demo Baška Voda w 390 px i desktop: godzina ma być tuż po lewej od
   jednej kropkowanej osi, treść po prawej. Otwórz `…`, potem inny element —
   poziome menu ma pozostać otwarte, a `Mark done` ma być neutralne.
4. Sprawdź `.stop-list::before`, `.stop-open`, `.stop-action-trigger` i
   `.stop-action-tray` w `src/app.css` oraz `actionsOpen` w `src/App.tsx`.
   Domena, Route/Context i liczba narzędzi WebMCP nie mogą się zmienić.
5. Dostarczenie: `git tag -l 'fix/003-*'` oraz
   `git merge-base --is-ancestor $(git rev-parse 'fix/003-timeline-axis-layout^{commit}') main`.
