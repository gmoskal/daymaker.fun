# Bug 001 — Tytuł nie otwiera elementu i blokuje drag

| Pole | Wartość |
|---|---|
| Start pracy | 2026-09-03 03:58 |
| Koniec pracy | 2026-09-03 04:43 |
| Status | zweryfikowany |
| Klasyfikacja | klient-lokalny |
| Rodzaj dowodu | wizualny-statyczny |
| Baza analizy | `46959e5a1bb99b0346eff8f91ab5f46fc65d9a53` |
| Commit builda nagrania przed | — |
| Commit builda nagrania po | — |
| Wynik obserwacji compositora | — |

## Zgłoszenie

> masz zjebane to ze jak klikam w tytul to sie nie robi expand tylko edycja, a zawsze ma byc expand jak robie edycje przeciez drag ma działać na całym item
>
> **Uzupełnienie 1:** i ma byc kursor który sugeruje ze da sie robic drag

## TL;DR

Wiersz renderuje pole edycji również w stanie zwiniętym, więc zwykły klik tytułu nie przechodzi przez akcję otwarcia elementu. Zatrzymanie zdarzenia wskaźnika na edytorze odcinało Motion od gestu rozpoczynanego na tytule. Źródłowy stan planu jest poprawny; błędny jest lokalny kontrakt interakcji widoku.

## Kryteria akceptacji

- AC-1: kliknięcie tytułu zwiniętego elementu rozwija ten element i pokazuje edycję tytułu inline.
- AC-2: otwarcie tytułu zachowuje zasadę maksymalnie jednego rozwiniętego elementu.
- AC-3: przeciągnięcie rozpoczęte na tytule odblokowanego elementu zmienia kolejność; cały element pozostaje powierzchnią drag, bez dedykowanego uchwytu.
- AC-4: nad odblokowanym elementem, w tym nad jego tytułem, kursor wskazuje `grab`, a podczas przeciągania `grabbing`.
- AC-5: element zablokowany nadal nie jest przeciągalny, a jego menu akcji pozostaje dostępne.
- AC-6: poprawka nie dodaje ramek, tła, cienia, gradientu ani zmiany koloru tytułu i nie zmienia bocznych zakładek, dodawania, domeny ani pięciu narzędzi WebMCP.

## Szczegóły — odpowiedzialny kod

- Cel: `StopItem` i `InlineEditor` w `src/MissionWorkspace.tsx` oraz stan kursora w `src/app.css`.
- Konsumenci: elementy planu oraz wymagania używają `InlineEditor`; wymagania mają zachować dotychczasową edycję i drag.
- Poza zakresem: routing zakładek, instrukcja użycia, pełna trasa Google Maps, dane misji, WebMCP i pozostałe widoki.
- Powiązane raporty wspólnego przebiegu: `002-font-distortion-on-expand.md`, `003-timeline-axis-layout.md`.
- Kierunek projektu: płaski, biały interfejs o wysokim kontraście; kolor służy wyłącznie aktywnemu stanowi, a interakcję komunikują tekst, kursor i chevron.
- Przyczyna w bieżącym kodzie: `StopItem` zawsze renderuje `InlineEditor`, także dla zwiniętego elementu. Nie istnieje więc klikalny tytuł, który mógłby wysłać `ToggleStopActions`. Wcześniejsze zatrzymanie `pointerdown` w `InlineEditor` dodatkowo odcinało gest od nadrzędnego `Reorder.Item`.

## Proponowany test (najpierw czerwony)

- `App.test.tsx`: zwinięty tytuł jest przyciskiem; klik otwiera pojedynczy element i pokazuje edytor inline.
- `sidequest.spec.ts`: gest drag rozpoczęty bezpośrednio na tytule odblokowanego elementu zmienia kolejność.
- `sidequest.spec.ts`: obliczony kursor tytułu/wiersza to `grab` przed gestem.

## Rozwiązanie

`StopItem` renderuje zwinięty tytuł jako przycisk otwierający element. W stanie
otwartym pojawia się ten sam wizualnie `InlineEditor`, automatycznie dostaje fokus
i zachowuje edycję z samym podkreśleniem. `Reorder.Item` pozostaje powierzchnią
gestu dla całego odblokowanego wiersza, a CSS komunikuje ten stan kursorami
`grab`/`grabbing`. Zablokowany element nadal można otworzyć i obsłużyć przez jego
menu, ale nie można go przeciągać.

Nie zmieniono modelu domenowego, bocznych zakładek, źródła stanu ani katalogu
pięciu narzędzi WebMCP.

## Raport z implementacji i testów

RED 1:

```text
$ npm run test -- src/App.test.tsx -t "opens inline editing from the collapsed title"
× Sidequest app > opens inline editing from the collapsed title
expect(element).not.toBeInTheDocument()
expected document not to contain element, found <input aria-label="Edit item title: Forest gravel loop" ... /> instead
Test Files  1 failed (1)
Tests  1 failed | 13 skipped (14)
```

RED 2:

```text
$ npx playwright test -g "edits and reorders the human operational lists" --timeout=10000
Error: locator.evaluate: Test timeout of 10000ms exceeded.
waiting for getByRole('button', { name: 'Return & shower', exact: true })
1 failed
```

Zmiany:

- `src/MissionWorkspace.tsx`: osobny kontrakt zwiniętego przycisku i otwartego
  edytora, jeden rozwinięty element oraz pełny wiersz jako powierzchnia reorder.
- `src/app.css`: neutralny tytuł bez hover-color oraz kursory `grab` i
  `grabbing` dla odblokowanego elementu.
- `src/App.test.tsx` i `e2e/sidequest.spec.ts`: trwałe regresje dla kliknięcia
  tytułu, edycji, kursora i dragowania rozpoczętego na treści wiersza.

Dostarczenie: commit `33facb41ec148b6167306e7493fccb50be0fded5` na `main`.

GREEN i bramka zakresu:

```text
$ npm run check
Test Files  8 passed (8)
Tests  48 passed (48)
✓ built in 2.98s
4 passed (20.4s)
```

- AC-1/2: zielony — `App.test.tsx`, otwarcie tytułem i pojedynczy otwarty element.
- AC-3/4: zielony — `sidequest.spec.ts`, reorder z powierzchni tytułu i obliczony
  kursor `grab`.
- AC-5: zielony — test integracyjny blokady oraz ręcznie sprawdzone menu elementu.
- AC-6: zielony — screenshot desktop/mobile i kontrola stylów bez ramek, cieni,
  gradientów lub zmiany koloru tytułu.

### Cleanup

- Ten raport nie utworzył osobnego worktree ani procesu w tle.
- Zachowano `bugs/assets/001-title-expand-drag/after.png` (40 KiB) jako lokalny,
  ignorowany przez Git dowód przez wymagany okres retencji.
- Ścieżka `/Users/gmm/tmp/codex/bug-001` należy do innego repozytorium
  (`btc-demo`) i została świadomie pozostawiona bez zmian.

## Dowód końcowego compositora

- Stan po zmianie: [otwarty element z neutralnym tytułem i menu](assets/001-title-expand-drag/after.png)

## Protokół weryfikacji

1. Otwórz czysty plan na `/plan`, wybierz demo Baška Voda, kliknij zwinięty
   `Forest gravel loop`: ma otworzyć się dokładnie ten element, z fokusem w
   edytorze tytułu.
2. Uruchom `npm run check`; oczekiwane: 48/48 testów Vitest, poprawny build i
   4/4 testy Chromium. Testy uruchamiają prawdziwy store, React, Motion i DOM;
   nie podmieniają ścieżki gestu.
3. Przeciągnij odblokowany wiersz zaczynając na tytule. Kolejność ma się zmienić,
   a zablokowany wiersz ma pozostać nieruchomy.
4. Sprawdź `src/MissionWorkspace.tsx` (`StopItem`, `InlineEditor`) i
   `src/app.css` (`.stop-open`, `.stop-title-button`). Model `MissionAction` i
   katalog `WEBMCP_TOOL_DEFINITIONS` nie mogą się zmienić.
5. Potwierdź dostarczenie:
   `git tag -l 'fix/001-*'` oraz
   `git merge-base --is-ancestor $(git rev-parse 'fix/001-title-expand-drag^{commit}') main`.
