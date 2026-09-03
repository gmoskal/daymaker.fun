# Bug 003 — Oś timeline’u koliduje z treścią

| Pole | Wartość |
|---|---|
| Start pracy | 2026-09-03 04:06 |
| Koniec pracy | — |
| Status | test czerwony |
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
- AC-7: rozwinięty element pokazuje osobną ikonę akcji; uruchomienie jej wysuwa poziomy pasek jednoznacznych ikon, a otwarty tryb akcji pozostaje wspólny po przejściu do innego elementu.

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


## Raport z implementacji i testów

- Czerwony test: `npx playwright test -g "preserves readable schedule hierarchy" --timeout=30000`.
- Wynik przed implementacją: Playwright wykrył brak osi na `.stop-list`, linię na każdym `.stop-row`, status w kolumnie czasu i godzinę wyrównaną do lewej (`axisContent: none`, `rowContent: "\"\""`, `statusColumn: 1`, `timeAlign: left`).

## Dowód końcowego compositora


## Protokół weryfikacji
