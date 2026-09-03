# Bug 002 — Zniekształcenie fontu przy rozwijaniu

| Pole | Wartość |
|---|---|
| Start pracy | 2026-09-03 03:59 |
| Koniec pracy | — |
| Status | analiza w toku |
| Klasyfikacja | klient-lokalny |
| Rodzaj dowodu | compositor-czasowy |
| Baza analizy | `46959e5a1bb99b0346eff8f91ab5f46fc65d9a53` |
| Commit builda nagrania przed | — |
| Commit builda nagrania po | — |
| Wynik obserwacji compositora | — |

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


## Raport z implementacji i testów


## Dowód końcowego compositora

- Nagranie przed: —
- Nagranie po: —

## Protokół weryfikacji
