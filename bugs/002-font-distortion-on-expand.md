# Bug 002 — Zniekształcenie fontu przy rozwijaniu

| Pole | Wartość |
|---|---|
| Start pracy | 2026-09-03 03:59 |
| Koniec pracy | 2026-09-03 04:43 |
| Status | zweryfikowany |
| Klasyfikacja | klient-lokalny |
| Rodzaj dowodu | compositor-czasowy |
| Baza analizy | `46959e5a1bb99b0346eff8f91ab5f46fc65d9a53` |
| Commit builda nagrania przed | `3500dcd71cd70903f840af776987a630e5d75617` |
| Commit builda nagrania po | `b35e98e9ad04146fe4d57199db83725e64943d70` |
| Wynik obserwacji compositora | Przed zmianą cały wiersz i jego tekst są skalowane w klatkach pośrednich; po zmianie tytuł zachowuje stały rozmiar i grubość, a sąsiednie wiersze wyłącznie zmieniają pozycję. |

## Zgłoszenie

> ten uncollapse robi jakis dziwny efekt z fontem - popraw

## TL;DR

Rozwinięcie zmienia wysokość elementu zarządzanego przez Motion Reorder. Pełna animacja layoutu skaluje na klatkach pośrednich całe drzewo elementu, przez co tekst jest chwilowo rasteryzowany inaczej mimo niezmienionych danych i stylu typograficznego. Błąd leży w lokalnej polityce animacji wiersza, nie w stanie planu ani definicji fontu.

## Kryteria akceptacji

- AC-1: podczas rozwijania i zwijania elementu rozmiar, grubość i rasteryzacja tytułu nie przechodzą przez widoczne skalowanie.
- AC-2: rozwinięcie nadal pokazuje szczegóły i akcje, a chevron zachowuje krótką rotację.
- AC-3: drag reorder nadal animuje zmianę pozycji sąsiednich elementów bez skoku.
- AC-4: poprawka nie zmienia fontu, koloru tytułu, treści, domeny ani pięciu narzędzi WebMCP.

## Szczegóły — odpowiedzialny kod

- Cel: polityka layout/transition `Reorder.Item` w `StopItem` w `src/MissionWorkspace.tsx`.
- Powiązane raporty wspólnego przebiegu: `001-title-expand-drag.md`, `003-timeline-axis-layout.md`.
- Poza zakresem: routing zakładek, instrukcja użycia, trasa Google Maps i dane misji.
- Topologia wykonania: liniowa w jednym checkoutcie; raporty 001 i 002 mogą zostać dostarczone tym samym commitem, lecz mają osobne dowody.

## Proponowany test (najpierw czerwony)

- Test kontraktu produkcyjnego sprawdza, że element Reorder używa animacji layoutu wyłącznie dla pozycji, bez skali treści.
- Dowodem niosącym zamknięcie jest nagranie przed/po z lokalnej aplikacji przy rozwinięciu tego samego elementu.

## Rozwiązanie

Na `Reorder.Item` ustawiono `layout="position"` zamiast pełnego `layout`. Motion
animuje dzięki temu zmianę położenia wierszy potrzebną do płynnego reorderu, ale
nie nakłada transformacji skali na zawartość wiersza podczas zmiany jego
wysokości. Szczegóły nadal pojawiają się inline, chevron nadal ma krótką rotację,
a drag korzysta z tej samej kontrolowanej grupy `Reorder`.

Nie zmieniono rodziny fontu, rozmiarów typografii, danych misji, stanu domenowego
ani pięciu narzędzi WebMCP.

## Raport z implementacji i testów

Retroaktywna reprodukcja RED została wykonana z tym samym UI na osobnym commicie,
na którym jedyną zmianą przy wierszu było przywrócenie pełnego `layout`:

```text
$ git show 3500dcd:src/MissionWorkspace.tsx
<Reorder.Item
  ...
  layout
  ...
>
```

Nagranie `before.mp4` pokazuje zmianę skali/rasteryzacji `Forest gravel loop`
podczas otwierania. Nagranie `after.mp4`, zbudowane z aktualnego `main`, pokazuje
stały rozmiar i wagę tytułu; przesuwają się tylko sąsiednie wiersze.

Zmiana: `src/MissionWorkspace.tsx` (`StopItem`) używa pozycyjnej projekcji layoutu
Motion. Wspierające testy drag/expand pozostają w standardowym
`e2e/sidequest.spec.ts`; niefałszowanym dowodem objawu czasowego są nagrania z
compositora przeglądarki.

Dostarczenie: commit `b35e98e9ad04146fe4d57199db83725e64943d70` na `main`.

GREEN i bramka zakresu:

```text
$ npm run check
Test Files  8 passed (8)
Tests  48 passed (48)
✓ built in 2.98s
4 passed (20.4s)
```

- AC-1: zielony — porównanie czasowe nagrań przed/po.
- AC-2: zielony — E2E rozwija szczegóły i obsługuje menu/chevron.
- AC-3: zielony — `edits and reorders the human operational lists` przechodzi.
- AC-4: zielony — diff ogranicza politykę layoutu; pełny kontrakt WebMCP przechodzi.

Walidator Visual Truth Gate:

```text
$ python3 /Users/gmm/.codex/skills/bug-report/scripts/validate_visual_truth.py bugs/002-font-distortion-on-expand.md
VISUAL_TRUTH_GATE=PASS: raport ma dozwolony stan
$ python3 /Users/gmm/.codex/skills/bug-report/scripts/validate_visual_truth.py bugs/002-font-distortion-on-expand.md --claim-fixed
VISUAL_TRUTH_GATE=PASS: claim fixed jest dozwolony
```

### Cleanup

- Usunięto worktree `/Users/gmm/tmp/codex/bug-002-retro` i branch
  `bug/002-font-distortion-retro` po zmergowaniu commita reprodukcji; oba już nie
  istnieją, a commit zachowuje drugi rodzic `main`.
- Usunięto proces serwera reprodukcji na porcie 5174; port nie nasłuchuje.
- Usunięto 1.6 MiB pośrednich WebM/klatek kontaktowych oraz oba katalogi `raw`.
- Zachowano lokalne, ignorowane przez Git `before.mp4` (65 KiB) i `after.mp4`
  (59 KiB) przez wymagany okres retencji.
- Przegląd starszych ścieżek: `/Users/gmm/tmp/codex/bug-002` i `bug-003` nie
  istnieją; `/Users/gmm/tmp/codex/bug-001` należy do niezależnego repozytorium
  `btc-demo` i nie został naruszony.
- Sweep starszych niż 4 godziny zasobów `TemporaryDirectory.*`,
  `screenshot*.jpg`, `*.sock` i rozpoznawalnych nagrań Codex w `/tmp` znalazł
  0 kandydatów, usunął 0 B.
- Końcowy pomiar: `/Users/gmm/tmp` 8.1 GiB, `/Users/gmm/.codex` 28 GiB,
  `DerivedData` 1.7 GiB; wolne 43 GiB na woluminie danych. Brak użycia Xcode.

## Dowód końcowego compositora

- Nagranie przed: [pełny layout skaluje tekst podczas rozwinięcia](assets/002-font-distortion-on-expand/before.mp4)
- Nagranie po: [pozycyjny layout zachowuje stabilną typografię](assets/002-font-distortion-on-expand/after.mp4)

## Protokół weryfikacji

1. Reprodukcja RED: `git worktree add --detach /Users/gmm/tmp/codex/bug-002-retro
   3500dcd71cd70903f840af776987a630e5d75617`, uruchom aplikację, załaduj demo
   Baška Voda i otwórz/zamknij `Forest gravel loop`. Oczekiwane: widoczna zmiana
   skali/rasteryzacji tekstu na klatkach pośrednich, zgodna z `before.mp4`.
2. Reprodukcja GREEN: na `main` uruchom `npm run check`, a następnie ten sam
   scenariusz w viewport 780×720. Oczekiwane: 48/48 Vitest, build i 4/4 Chromium;
   tytuł ma stały rozmiar/grubość jak w `after.mp4`. E2E uruchamia prawdziwy
   React/Motion/DOM; żaden mock nie uczestniczy w ścieżce animacji.
3. Diff: porównaj `git diff 3500dcd b35e98e -- src/MissionWorkspace.tsx` i
   potwierdź `layout="position"`. Nie mogą zmienić się reguły fontu, domena ani
   katalog WebMCP.
4. AC-1 potwierdzają nagrania; AC-2/3 testy E2E i nagranie po; AC-4 diff oraz
   `src/webmcp.test.ts` z pełnej bramki.
5. Dostarczenie: `git tag -l 'fix/002-*'` oraz
   `git merge-base --is-ancestor $(git rev-parse 'fix/002-font-distortion-on-expand^{commit}') main`.
6. Visual Truth Gate:
   `python3 /Users/gmm/.codex/skills/bug-report/scripts/validate_visual_truth.py bugs/002-font-distortion-on-expand.md`
   oraz ten sam command z `--claim-fixed`; oba mają zwrócić PASS.
