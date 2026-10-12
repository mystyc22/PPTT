Glowna zasada calego projektu: nigdzie nie stosujemy pollingu; kazda zmiana stanu jest propagowana zdarzeniowo po udanym COMMIT.

# PPTT — Package Push Towards Target 

# System Kurierski dla Nairobi - Podsumowanie Planowania

## Aktualizacja dokumentacji - 2026-10-09

Uzgodniony aktualny kontrakt kart paczek A/B/C, skali czasu i pelnej listy
historii znajduje sie w [rozdziale 63](#client-parcel-cards-v1).
[Rozdzial 64](#admin-network-observation-v1) uzupelnia wizualizacje Admina,
a [rozdzial 65](#live-config-and-decisions-v1) opisuje konfiguracje na zywo,
wersjonowanie wyceny, synchronizacje sesji i granice odbioru.
Te datowane wymagania zastepuja w swoim zakresie starsze warianty planu;
nie zmieniaja utrwalonych eventow, finansow ani zatwierdzonych tras.
Stan implementacji nie jest rownoznaczny z odbiorem ani zgoda rollout.

Biezacy opis po refaktoryzacji znajduje sie w rozdzialach 53-58 na koncu
tego dokumentu. Rozdzial 54 opisuje reczne scenariusze i wycofanie AUTO TEST,
a rozdzial 55 szczegolowo porownuje architekture przed i po punkcie 24
`docs/tasks/task.md`. Rozdzial 56 uzupelnia funkcje Hub/Client, w tym
przywrocenie `PENDING_INTAKE`. W razie sprzecznosci dotyczacych tych zmian
obowiazuje datowana aktualizacja, nie historyczna nazwa modulu ani dawny plan.
Starsze rozdzialy pozostaja zapisem ewolucji wymagan i decyzji.

Kontrakt historii i lokalizacji paczek po punkcie 41 opisuje
[rozdzial 62](#parcel-operational-v1). Ma pierwszenstwo przed historycznym
opisem `in_hub` podczas transportu i braku paczkowych eventow transportu.
Pierwszenstwo specyfikacji nie oznacza zamkniecia testow ani zgody rollout.

<a id="skip-km-price-v1"></a>

## Rozwiniecie punktu 22: SKIP_KM_PRICE_V1 - specyfikacja wdrozenia 2026-10-06

Status: WDROZONE W KODZIE; ROLLOUT HOLD. Ta sekcja jest kanoniczna
specyfikacja dopuszczenia nowych SKIP; nie potwierdza zgody rollout.
Przyklady liczbowe i dowody odbioru sa w
[curier_task.md, 22.2](../tasks/curier_task.md#skip-km-price-plan).
Kod stosuje oba filtry oraz dotychczasowa wykonalnosc finansowa.
Zamkniety temat rozliczenia sprzed punktu 22 nie jest alternatywa ani fallback.

### Zakres i pierwszenstwo opisow

1. Punkt 22 pozostaje pierwszym, szybkim filtrem kilometrowym. Nowa wersja
   dodaje drugi, niezalezny filtr wyceny calego nierozdzielnego worka.
2. Regula wyboru ma wlasna wersje `SKIP_KM_PRICE_V1`, odrebna od wersji
   kontraktu wyplaty i formatu hash/HMAC. Samo `zysk_km >= 0`
   nie jest kompletnym warunkiem wystawienia SKIP.
3. Sposob rozliczania obowiazuje wedlug obecnego kodu i rozdzialu 42.3:
   rezerwa dalszej drogi, obsluga, bonus, ograniczona podstawa wyplaty i
   surplus systemowy. Ta wersja nie przywraca historycznej zasady z commita
   `22b8efa2`, ze cala reszta zawsze zwieksza wyplate pierwszego kuriera.
   Pozniejsza zmiana `a12b9c80` i rozdzial 42.3 nie sa cofane.
4. Pierwszenstwo tej sekcji dotyczy dopuszczenia nowych ofert.
   Nie znosi obecnych guardow, zasad rozliczenia ani kontraktow
   juz przyjetych. Stare opisy "tylko km" pozostaja dowodem stanu przed
   aktywacja; nie wolno mylic wdrozenia kodu z odbiorem bramki rollout.
5. Przy kolejnej zmianie trzeba wskazac date, nowa wersje reguly, zakres
   zmiany, testy i odnosniki do zastapionych zapisow. Nie zmieniac znaczenia
   tej samej wersji przez dopisanie sprzecznego przykladu w innym rozdziale.

### Wejscia, trasy i jednostki

- Oceniana jest cala aktualna zawartosc jednego opakowania, bez dzielenia
  worka ani wybierania korzystnej podgrupy paczek.
- Dla kazdej paczki `p` potrzebne sa jej zapisany `km_rate` w VKES/km i dwie
  kompletne pozostale trasy: STANDARD i SKIP. Obie zaczynaja sie w obecnym
  hubie i koncza w celu paczki. Trasa SKIP obejmuje aktualny skok oraz dalszy
  ogon, w tym ewentualny powrot DA -> BA. Nie wymuszamy powrotu dla paczki,
  ktorej indywidualna trasa do innego celu go nie wymaga.
- STANDARD zachowuje pierwszy odcinek do aktualnego `bag.to_hub`, a dopiero
  potem pozostala trase kazdej paczki. Nie jest dowolna najkrotsza trasa
  od huba zrodlowego z pominieciem kierunku worka. SKIP nadal omija jeden
  hub zgodnie z obecnym generatorem kandydatow; nowy filtr nie pozwala
  dowolnie skakac do innych hubow ani zmieniac znaczenia trasy referencyjnej.
- Stawka juz reprezentuje wycene parametrow paczki. Nie mnozymy jej drugi
  raz przez kg, nie zastepujemy jej wartoscia przedmiotu, cena nadania ani
  saldem. Ten filtr nie przelicza od nowa taryfy juz nadanej paczki.
- Z jednego snapshotu pochodza manifest, grafy/dystanse, stawki, wymagane
  czynnosci hubow, aktualne oplaty, bonus i rewizje zaleznosci. Te same dane
  sluza obu wariantom; nie wolno mieszac starej wyceny z nowa topologia.
- Liczymy tylko jeszcze niewykonana droge i obsluge. Wczesniejsze przejazdy,
  juz pobrane oplaty huba zrodlowego i koszt nadania sa kosztami wykonanymi,
  nie ponownymi skladnikami decyzji.

### Definicja porownawczej wyceny

Koszt porownawczy opisuje nominalnie wyceniona pozostala prace transportowa,
nie wyplate ograniczona dostepnym saldem i nie gwarantowany zysk kuriera.

```text
T(p, wariant) = suma po pozostalych odcinkach:
               to_minor(Decimal(str(dystans_odcinka))
                        * Decimal(str(km_rate_paczki)))

H(p, wariant) = suma wymaganych pozostalych oplat obslugi w minor units
B(wariant)   = nalezny bonus biezacego wariantu w minor units

C_STANDARD = suma_p(T(p, STANDARD) + H(p, STANDARD)) + B(STANDARD)
C_SKIP     = suma_p(T(p, SKIP)     + H(p, SKIP))     + B(SKIP)

zysk_wyceny_minor = C_STANDARD - C_SKIP
zysk_km = suma_p(km_paczki_STANDARD) - suma_p(km_paczki_SKIP)
```

`H` obejmuje czynnosci wynikajace z trasy, m.in. obsluge huba przeskoku,
sorting/transfer/outtake kolejnych hubow i koncowe wydanie klientowi.
Kazda wymagana czynnosc jest liczona raz; rozbite oplaty finalnego odlozenia
na polke i pozniejszego wydania nie moga zostac podwojone ani pominiete.
Kazdy wariant korzysta z tego samego domenowego modelu czynnosci/oplat.

`B(STANDARD)` wynosi 0 dla biezacego zwyklego odcinka. `B(SKIP)` pochodzi z
obecnej polityki, obecnie 50 VKES na paczke. Bonus jest uwzgledniany raz jako
rzeczywisty skladnik wymagany przez SKIP. Nie prognozujemy bonusow za przyszle,
jeszcze niewybrane przeskoki. Bonus nie stanowi dodatkowych pieniedzy SYSTEM.

Nie wliczamy salda, `system_surplus`, wplat klienta ani pozornego zmniejszenia
kosztu przez ograniczenie pierwszego payout do 0. Nie uzywamy wprost obecnego
`total_cost` planera: suma zamknietego budzetu z nadwyzka systemowa moze byc
rowna sumie skarbonek, a nie porownawczej wycenie trasy. Nowy wynik musi miec
osobne pola i nie zmieniac znaczenia istniejacych pol rozliczenia.

### Warunki, remisy i kolejnosc

```text
SKIP dopuszczony =
    kompletne i poprawne dane/trasy
    AND operacyjnie dostepny cel SKIP
    AND zysk_km >= 0
    AND zysk_wyceny_minor >= 0
    AND obecna wykonalnosc finansowa kazdej paczki
    AND pozostale obowiazujace guardy transportu
```

Remis w jednym lub obu filtrach jest dopuszczalny. Ujemny wynik km nie moze
zostac skompensowany oszczednoscia pieniedzy; ujemna roznica wyceny nie moze
zostac skompensowana oszczednoscia km. Nie ma wymogu korzysci per paczka:
dodatnie i ujemne wklady sumujemy dla calego worka.

Najpierw liczymy szybki filtr km, potem porownawcza wycene kandydatow, ktorzy
go przeszli. Dopiero po obu filtrach wybieramy wariant dotychczasowym rankingiem
zysku km i deterministycznymi remisami; nie zmieniamy rankingu na finansowy.
Nie wolno wybrac jednego kandydata przed drugim filtrem i zatrzymac poszukiwania
po jego odmowie. STANDARD/SKIP tej samej rodziny nie tworza dwoch rezerwacji.

### Niedostepny hub, pelny powrot i granice zakresu

Przy dostepnym STANDARD baza wynika z jego kompletnego wariantu. Gdy hub
standardowy jest tylko chwilowo niedostepny, wykorzystujemy kompletna baze
teoretyczna zgodna z porownaniem kilometrowym z 22.0.1. Wycenia sie wszystkie
jej pozostale odcinki i czynnosci; brak oferty STANDARD nie oznacza kosztu 0.
Nie przewidujemy czasu otwarcia ani dodatkowego hipotetycznego kosztu WAIT.

Cel SKIP nadal musi byc operacyjnie dostepny. Paczka wymagajaca zamknietego BA
moze zgodnie z obecnymi zasadami poczekac w DA, ale powrot DA -> BA i jego
obsluga nie znikaja z wyceny ani rezerwy. Nie wystawiamy oferty do zamknietego
huba. Brak kompletnej bazy/trasy oznacza brak SKIP; STANDARD albo WAIT zalezy
od obecnej dostepnosci, bez starego selektora lub sztucznego kosztu zerowego.

Koszt krancowy wykorzystania juz istniejacego transportu powrotnego z 21.2.1
pozostaje osobnym otwartym zakresem. Nie wprowadzamy hipotetycznych rabatow ani
nowych claimow pojemnosci w tej wersji. Rzeczywiste limity ladunku, gabaryty,
dobor pojazdu, lifecycle hubow i zgoda kuriera pozostaja osobnymi zasadami.
Przyklad 10 paczek 0,1 kg i jednej 100 kg opisuje ryzyko ekonomiczne; nie
stanowi pozwolenia na fizyczne zaladowanie takiej paczki do dowolnego worka.

### Precyzja i bledy danych

Operandy stawki/dystansu zapisujemy w snapshotach w odtwarzalnej postaci
dziesietnej (`Decimal(str(value))`). Nie zaokraglamy stawki do dwoch miejsc
przed mnozeniem ani nie zmieniamy dystansow nowym wzorem. Dla kazdego odcinka
stosujemy `money.to_minor()` / ROUND_HALF_UP, potem sumujemy integer minor
units. Oplaty i bonus sa w minor units; nie ma porownania floatow VKES
ani arbitralnego epsilon pienieznego. Sumowanie km pozostaje kanoniczne jak
w obecnym punkcie 22. Audyt ma przechowywac dokladne operandy tego wyliczenia.

Brak danych, NaN/Inf lub niedozwolona ujemna wartosc nie oznacza stawki 0.
Wariant jest niewazny i ma jawny powod odmowy. Jawna, poprawna stawka 0 nie
powoduje dzielenia przez 0 i nie znosi kontroli salda/oplat/bonusu. Granica
zaokraglenia jest identyczna dla projekcji, rezerwacji, replay i raportu;
testy obejmuja pol grosza i trasy skladajace sie z wielu odcinkow.

### Rozliczenie pozostaje oddzielne

Po dopuszczeniu trasy obowiazuje dotychczasowy plan rozliczenia z 42.3.
Najpierw zabezpiecza on obsluge, dalsza droge, koncowe wydanie i bonus.
Zerowa podstawa pierwszego payout jest dopuszczalna przy pelnym pokryciu
wymaganych pozycji, ale nie obniza porownawczej wyceny tego odcinka.
Brak pokrycia chocby jednej paczki uniewaznia SKIP calego worka. Nie przenosi
sie sald miedzy paczkami i nie ukrywa deficytu doplata systemowa.
Nowy filtr nie zmienia ledgeru, splitu, surplusu ani ceny nadania.

### Slady decyzji, transakcja i aktualizacja danych

- Czysta projekcja zwraca wersje reguly, manifest, rewizje rynku/topologii/
  konfiguracji, zrodlo bazy, obie sumy km/kosztow, oba zyski, wyniki filtrow
  i powod dopuszczenia/odmowy. Prywatny slad per paczka zawiera obie trasy,
  stawke, dystanse/nominalne kwoty odcinkow, rodzaje oplat, bonus i roznice.
  `delta_cost_minor = C_SKIP_p - C_STANDARD_p` jest dodatnie dla straty;
  laczny `zysk_wyceny_minor` ma odwrotny znak. Nie mieszac tych konwencji.
  Przy szybkim odrzuceniu przez km wycena moze nie byc uruchomiona:
  wtedy `economic_evaluation=NOT_EVALUATED`, kwoty/zysk ekonomiczny sa null,
  a nie 0. Nie publikujemy pozornego wyniku nieprzeprowadzonego filtra.
- Oferty i odrzucenia w GET/cache nie zapisuja DB, package_events ani ledgera.
  Diagnostyka w runtime ma wynik odmowy. Skuteczna rezerwacja utrwala prywatny
  dowod w istniejacym audycie/kontrakcie, w tej samej transakcji co przydzial.
  Nie jest wymagana nowa tabela. Publiczna gielda nie ujawnia sald ani
  prywatnego planu/fingerprintu finansowego.
- Backend w istniejacym BEGIN IMMEDIATE sprawdza oba filtry i aktualnosc
  danych przed rezerwacja. Nie ufa kwotom ani zgodzie frontendowej. Zmiana
  manifestu, trasy, stawki, oplaty, bonusu lub rewizji wywoluje konflikt
  bez czesciowych zapisow; w wyscigu sesji wygrywa pierwszy commit.
- Wersja reguly i osobny fingerprint wyceny sa powiazane z zamrozonym
  kontraktem. Nie zmieniamy po cichu formatu jego finansowego hash/HMAC.
  Po przyjeciu zlecenia nowa polityka/cennik nie przepisuje wyplat, eventow
  ani historii transportu. Nie dorabiamy legacy/fallback lub migracji starych
  planow bez osobnej zgody; granice aktywacji trzeba odebrac jawnie.
- Cache uwzglednia wszystkie zaleznosci i wersje reguly, a po COMMIT
  zdarzenia uniewazniaja odpowiednie projekcje. Zimny/cieply odczyt i replay
  sa powtarzalne dla tego samego snapshotu. Reuzywamy juz policzone trasy;
  bez nowych odczytow per paczka, pollingu czy odpytywania po hoverze.

### Przyklady, testy i warunek zamkniecia

Wektory A-F i planowane slady sa zapisane w curier_task 22.2.6. Przyklad A:
10 paczek do DA po 10 VKES/km i jedna do BA po 1000, siec 20/10/25 km,
bez oplat/bonusu: km 320 -> 285, wycena 23000 -> 37500 VKES. Oszczednosc
35 km nie kompensuje straty 14500 VKES. To umowne stawki, nie formula kg.
Gdy wszystkie stawki wynosza 10, ten sam worek oszczedza transportowo 350
VKES; doliczenie bonusu 550 przy oplatach 0 zmienia wynik na strate 200.
W produkcji zawsze uwzgledniamy wymagane oplaty i bonus, potem wykonalnosc sald.

Odbior obejmuje oba remisy, rozne stawki, droga paczke wracajaca/jadaca dalej,
bonus/oplaty niwelujace zysk, zerowy payout, brak rezerw, precyzje/bledne dane,
zamkniecie/otwarcie BA, kilku kandydatow, cieply cache i konflikty rezerwacji
dwoch sesji tej samej osoby oraz dwoch roznych osob. Wymagane sa testy realnego
przebiegu i audyt finansow, pelny pytest oraz obie bramki finansowe.

### Implementacja, audyt i granica aktywacji 2026-10-06

- Czysty evaluator: `domain/skip_economics.py::compare_skip_routes`.
  Integracja: `domain/bag_route_planning.py::plan_bag_market_options`.
  Request-scoped memo nadal wyznacza trasy raz; evaluator jedynie sumuje
  gotowe odcinki. Cache Client i Admin uwzglednia `SKIP_SELECTION_POLICY`.
  Zmiany packages.dimension_json, sald, hubow/oplat/linkow i ustawien juz
  aktualizuja istniejacy market cursor i po COMMIT trafiaja przez push.
  Nie dodano timera ani pollingu.
- Zapis oryginalnej stawki: istniejace
  `packages.dimension_json.transport_pricing = {version: PARCEL_TRANSPORT_V1,
  km_rate: <decimal string>}`. `RuntimeSnapshotWrites` zapisuje to podczas
  utworzenia paczki; creation przekazuje rzeczywisty km_rate. RuntimeSnapshotBuilder
  i rehydrate_pending_intake_parcel odtwarzaja snapshot. RuntimeParcelRouteMetrics
  nie przelicza zapisanej stawki z salda, nowej trasy ani nowych oplat, takze
  gdy stawka jest 0 lub chwilowo nie ma trasy. Nie dodano tabel/kolumn.
- DB wczesniej nie utrwalala km_rate. Dla paczki bez transport_pricing
  nowy SKIP jest niedopuszczalny (`skip_economic_data_invalid`). Nie zgadujemy
  stawki ze skarbonki, nie migrujemy ani nie poprawiamy historycznych wierszy.
  STANDARD/WAIT zachowuja dotychczasowe warunki. Nowo utworzona paczka otrzymuje
  snapshot. Brak snapshotu nie uniewaznia juz przyjetego kontraktu transportu.
- `application/courier/reservation_economics.py::validate_skip_economics`
  wymaga `selection_basis=parcel_kilometers_and_price` oraz wersji
  `SKIP_KM_PRICE_V1`. W dotychczasowym BEGIN IMMEDIATE bulk-read tego samego
  UnitOfWork odczytuje zapisane stawki, huby, road_distance i ustawienia.
  Odtworzony dowod musi identycznie odpowiadac ofercie i przechodzic oba filtry.
  Kontrola obejmuje tez ominiecie dokladnie jednego huba, kierunek worka,
  komplet manifestu i bonus 50 VKES kazdej paczki. Nie wystarcza suma bonusow.
  Handler API sprawdza aktualne market_revision i topology_revision w tej
  samej transakcji. Rewizje konfiguracji niosa istniejace kursory, nie nowa tabela.
- Powody projekcji: `skip_increases_total_parcel_kilometers`,
  `skip_increases_comparative_cost`, `skip_standard_baseline_missing`,
  `skip_economic_data_invalid` oraz istniejace odmowy rezerw/trasy/dostepnosci.
  Sukces: `skip_kilometers_and_price_not_worse_than_standard` albo
  `skip_kilometers_and_price_not_worse_than_theoretical_standard`.
  Odmowa atomowej kontroli wyceny: HTTP 409 `skip_economic_proof_conflict`.
  Konflikty manifestu/salda/kursora zachowuja istniejace osobne kody.
- `economic_summary` publikuje agregaty: cost_standard_minor, cost_skip_minor,
  economic_gain_minor, standard_km, skip_km, km_gain, oba wyniki i baseline.
  Przy szybkim odrzuceniu `NOT_EVALUATED` i kwoty null; niewazny operand
  daje `INVALID`, nie pozorne zero. Pelny `economic_proof` zawiera kanoniczne
  operandy, obie trasy, per-edge transport_minor/handling_minor/handling_kind,
  customer_delivery_minor, bonus_minor i delta_cost_minor kazdej paczki.
  Obsluga posrednia to hub_transfer (globalna oplata), koncowa final_outtake
  (delivery_fee huba); customer_delivery to outtake_fee, 0 dla asset.
  Jawne road_distance ma pierwszenstwo, w pozostalym przypadku stosujemy
  niezmienione Hub.distance_to: geometria zaokraglona do 0.1 km.
  Przy obecnych lat/lon wspolrzedne runtime sa odtwarzane przez geo_to_world
  z aktualnym projection_environment, tak samo podczas atomowej kontroli.
  Zapisane x/y nie nadpisuja autorytatywnych lat/lon.
- `economic_proof_fingerprint` to osobny SHA256 kanonicznego JSON dowodu.
  Jest utrwalany razem z proof w metadata RESERVED i SKIP_PAYOUT_RESERVED.
  Manifest hash/content_revision sa w istniejacym courier_job_item; rewizja
  rynku jest w courier_job, a selection_snapshot w SKIP_PAYOUT_RESERVED
  przechowuje market_revision, topology_revision i topology_fingerprint.
  Dla niskopoziomowego wywolania bez oczekiwanej rewizji rynku ten operand
  jest jawnie null, nie fikcyjne 0; handlery HTTP przekazuja kursory snapshotu.
  Dowod nie zmienia finansowego
  parcel_payout_plan_fingerprint, HMAC ani schematu wallet_ledger.
  GET/odmowa selektora niczego nie zapisuje. Konflikt transakcji rollbackuje
  przydzial, eventy i HOLD razem; pierwsza sesja wygrywa.
- Publiczny Client JSON usuwa proof/hash i per-parcel dane finansowe takze
  z eventow historii. Chroniony tokenem Admin zachowuje dostep do prywatnego
  audytu. Nie mylic administracyjnego endpointu z publiczna gielda kuriera.
  Adaptery Client/Admin zachowuja payout=0 jako zero i oddzielaja bonus.
- Nowe oferty/rezerwacje stosuja tylko nowa polityke; stare selection_basis
  nie sa dopuszczane jako fallback. Juz przyjety kontrakt pozostaje zamrozony:
  replay i pickup/receipt/settlement nie przechodza ponownej wyceny nowym
  cennikiem. Nie jest to nowa sciezka legacy, tylko istniejacy kontrakt.
- Zakres TUI: wspolny selector korzysta z filtra. Terminalowa rezerwacja
  bez trwalego kontraktu nadal odrzuca SKIP w reserve_prepared_market_assignment.
  Nie odblokowano jej ani nie dodano rownoleglego systemu rozliczen.
- Odbior: wektory A-F, wiele kandydatow, zapis/hydracja/refresh stawki 0,
  realna rezerwacja i wykonanie przez API, replay/rollback, wyscigi dwoch sesji
  tej samej i roznych osob, cold/warm GET bez DML i zmiana oplaty na zywo.
  Miejsca testow i aktualne wyniki sa w curier_task 22.2.
  Pelny pytest PASS (5271 testow), dodatkowa regresja skupiona po ostatnich
  doprecyzowaniach. Regresja finansowa PASS (618 testow, build Client).
  Rollout na spojnej kopii
  lokalnej DB: chain/signatures/business/fund holds PASS; min_intents FAIL
  (1 zamiast 20 w 24 h), wiec HOLD. Nie zmieniono progow ani lokalnej DB.
  Status WDROZONE W KODZIE nie jest zgoda na merge/rollout przed PASS bramki.

## Obowiązująca zasada opakowań

Aktualny model ma trzy rodzaje kontenera: fizyczny worek W, opakowanie
wirtualne V i fizyczną skrzynkę S. Każdy istniejący kontener ma kod widoczny
dla pracownika. W i V współdzielą generator kodów Code32, lecz różnią się
`bags.container_type` i wpływem na fizyczny magazyn. V jest trzecią świadomie
wybieraną opcją, a nie stanem domyślnym worka. W razie sprzeczności z
historycznymi sekcjami obowiązuje rozdział „Ręczny wybór opakowania przy
nadaniu — model zgodny z Hub API”.


## Aktualny stan wdrożenia — 2026-08-19

Uwaga wersji 2026-10-06: ponizszy opis filtra km dokumentuje historyczny stan
przed wdrozeniem SKIP_KM_PRICE_V1 opisanego wyzej. Sam warunek km zostal
uzupelniony drugim filtrem wyceny; nie jest kompletnym warunkiem dopuszczenia.
Rozliczenie finansowe
ma pozniejszy opis w 42.3; historyczne zdanie o calej pozostalej kwocie nie
zastepuje ograniczenia payout i surplusu. Pierwszenstwo ma sekcja kanoniczna.

Poniższy rozdział opisuje zachowanie wdrożone w ostatnich zmianach i ma
pierwszeństwo przed starszymi przykładami dotyczącymi giełdy, przeskoków,
SSE oraz uruchamiania aplikacji. Opisuje zachowanie systemu, a nie dane
testowej bazy SQLite.

### Giełda, zamknięty hub i przeskok

- Planner analizuje wszystkie paczki znajdujące się w nierozdzielnym worku.
  Wybór przeskoku opiera się na sumie kilometrów paczek, a nie na pierwszej
  paczce, kwocie wypłaty ani bonusie. Przeskok jest dopuszczalny, gdy jego
  łączna trasa nie jest dłuższa od wariantu standardowego
  (`zysk_km >= 0`).
- `is_active_manual=true` oznacza, że hub pozostaje częścią teoretycznej
  topologii. Jeżeli jego stan operacyjny to `PAUSE` albo `CLOSED`, standardowa
  oferta do tego huba nie jest wystawiana, ale hub może zostać uwzględniony w
  teoretycznym porównaniu kilometrowym.
- Rzeczywisty cel przeskoku musi być operacyjnie dostępny (`OPEN` albo
  `SLEEP`). Hub z `is_active_manual=false`, `PAUSE` albo `CLOSED` nie może być
  celem oferty. Jeżeli standardowy hub jest zamknięty, a kompletny przeskok nie
  zwiększa sumy kilometrów, giełda pokazuje tylko przeskok.
- Paczka, która po przeskoku nadal wymaga zamkniętego huba, zachowuje własną
  dalszą trasę i czeka w hubie przeskoku. Nie powstaje oferta do zamkniętego
  huba, a paczka może zostać połączona z kolejnym transportem po jego
  ponownym otwarciu.

### Rozliczenie finansowe przeskoku

Dla każdej paczki system tworzy osobny plan rozliczenia. Z salda paczki
rezerwowane są kolejno: sortowanie w hubie przeskoku, pełny koszt dalszych
odcinków oraz wymagane opłaty kolejnych hubów. Dopiero pozostała kwota jest
wkładem paczki do wynagrodzenia bieżącego kuriera za przeskok. Plan nie
przenosi salda między paczkami i nie ukrywa deficytu.

Przy rezerwacji zlecenia plan, trasa, saldo, opłaty, podział wypłat oraz
fingerprint są zamrażane atomowo. Przy finalizacji system sprawdza ponownie
trasę, zawartość worka, saldo i fingerprint. Konflikt przerywa całą operację
bez częściowego rozliczenia. Publiczna giełda pokazuje kwotę transportu dla
każdej paczki, ale nie pokazuje prywatnego planu sald ani rezerw.

### SSE, outbox i odświeżanie giełdy

- Zdarzenie zmiany jest publikowane dopiero po udanym `COMMIT`. SSE jest
  sygnałem unieważnienia widoku; źródłem danych pozostaje DB.
- Client App przechowuje rewizję rynku i topologii. Stare albo już obsłużone
  zdarzenie SSE jest ignorowane, a nowsza rewizja rynku lub topologii wywołuje
  jedno odświeżenie. Po reconnect klient pobiera pełny aktualny widok.
- Przy aktywacji kuriera giełda i zlecenia są pobierane po jednym razie przed
  zamontowaniem strony. Późniejsze odświeżenia pochodzą z nowych zdarzeń SSE;
  ponowne wejście w kartę nie uruchamia równoległych, identycznych obliczeń.
- Dostarczenie tego samego zdarzenia outbox przez ponowienie żądania jest
  deduplikowane po identyfikatorze zdarzenia. Jednoczesne ponowienia korzystają
  z jednego trwającego dostarczenia, a pamięć deduplikacji ma ograniczony czas
  i rozmiar. Nie zmienia to trwałości outboxa ani zasady co najmniej jednokrotnego
  dostarczenia.
- System nie używa pollingu do propagacji zmian. Reconnect i odczyt pełnego
  snapshotu są dozwolonymi operacjami odtworzenia stanu, a nie cyklicznym
  odpytywaniem bazy.

### Bezpieczny start Hub App i obecność huba

Po zalogowaniu Hub App równolegle pobiera kontekst, reguły, ustawienia oraz
statystyki obecności. Odczyty startowe mają osobną sekwencję od późniejszych
odświeżeń kontekstu. Spóźniona odpowiedź `/context` albo zdarzenie SSE nie może
nadpisać nowszego stanu i ponownie wyświetlić decyzji „Otwórz hub / praca
obserwacyjna”. Kliknięcie decyzji obecności unieważnia wcześniejsze odczyty,
a odpowiedź akcji jest przyjmowana tylko wtedy, gdy nadal jest najnowsza.
To samo dotyczy zmiany capabilities. Wylogowanie unieważnia wszystkie
oczekujące odpowiedzi, aby stary stan nie wrócił do nowej sesji.

### Aktualizacja listy zalogowanych pracownikow (2026-10-10)

Lista w Tworzenie pokazuje pozostalych pracownikow danego huba z aktywnymi,
niewygaslymi sesjami. Kazda sesja ma osobny wiersz, nawet gdy ta sama osoba
jest zalogowana na kilku urzadzeniach. Wiersz zawiera ikone, imie i nazwisko,
staff_id, role oraz czas logowania. Nie ma widocznego naglowka, licznika osob
ani separatorow miedzy pracownikami.
Obejmuje takze sesje pracy kuriera uruchamiane w Client App. Samo prywatne
logowanie klienta nie oznacza rozpoczecia pracy kuriera.

Rozpoczecie i zakonczenie sesji pracownika zapisuje w tej samej transakcji
zdarzenie w istniejacym outboxie wraz z identyfikatorem huba. Po zatwierdzeniu
transakcji Hub API wysyla przez SSE `staff_presence_update`, a Hub App pobiera
aktualna liste. Dotyczy to logowania, wylogowania, uniewaznienia i wygasniecia
sesji oraz zakonczenia pracy kuriera przez wylogowanie z nadrzednej sesji
prywatnej. Zakonczenie jednej sesji nie usuwa pracownika z listy, jezeli nadal
ma on inna wazna sesje. Pozostale polaczenia SSE nie sa zamykane.

Powiadomienie odswieza tylko odpowiedni hub i nie ujawnia innym pracownikom
identyfikatora prywatnej sesji, tokena ani adresu IP. Aktualizacja nie wymaga
pollingu, nowej tabeli ani przeladowania strony. Wczesniej sesje kuriera byly
zapisywane prawidlowo, ale ich zdarzenia nie wyzwalaly odswiezenia tej listy
w Hub App.

Nowe logowanie umieszcza wiersz na poczatku listy. Ikona `IoLogInOutline` dla pracy
lub `BsIncognito` dla trybu obserwacyjnego jest zielona przez 30 sekund,
nastepnie przyjmuje zwykly jasny kolor; pozycja wiersza pozostaje bez zmian.
Wylogowanie, uniewaznienie lub wygasniecie konkretnej sesji umieszcza jej
wiersz na poczatku z czerwona ikona `IoLogOutOutline`. Po 30 sekundach ten wiersz
znika. Nie oznacza to zamkniecia pozostalych sesji danej osoby.

Pierwszy snapshot po wejsciu do aplikacji nie przedstawia istniejacych sesji
jako nowych logowan. Powtorzona dostawa zdarzenia nie odnawia oznaczenia
30-sekundowego. Zmiana trybu pracy aktualizuje ikone bez przesuwania wpisu.
Listy nie sortuje sie ponownie po kazdym odczycie. Panel ma stala wysokosc,
nadmiar wpisow jest przewijany; nowe logowanie lub wylogowanie przewija liste
na poczatek. Odliczanie wykorzystuje wspolny zegar prezentacyjny frontendu,
bez odpytywania DB. Tymczasowe informacje sa przechowywane tylko w pamieci
Reacta i sa czyszczone przy zmianie sesji uzytkownika.
Kilka nowych sesji odkrytych w jednym odczycie zachowuje kolejnosc od
najnowszej. Zdarzenie SSE uniewaznia starszy odczyt bedacy w toku, tak aby
spozniona odpowiedz HTTP nie cofala aktualnego stanu sesji lub jej trybu.

Znikniecie sesji z aktualnego snapshotu nie dostarcza dokladnej godziny jej
zakonczenia. Taki wiersz pokazuje `Czas wylogowania nieznany`, zamiast
zapisywac lokalne teraz jako czas wylogowania. Pozniejszy rzeczywisty event
zakonczenia uzupelnia godzine i status bez zmiany kolejnosci i bez ponownego
uruchomienia 30-sekundowego efektu. Po uplywie efektu caly zakonczony wiersz,
wraz z nazwiskiem i datami, jest usuwany z pamieci Reacta. Ochrona przed
spoznionym startem przechowuje tylko maksymalnie 128 ostatnich kluczy
zakonczonych sesji oraz numer najwyzszej zakonczonej sekwencji na pracownika.
Znane aktywne starsze sesje innych urzadzen nie sa przez to zamykane;
nieznany starszy start wymaga potwierdzenia w aktualnym snapshotcie.

Licznik uniewazniania odczytow i wlasciciel odpowiedzi akcji obecnosci sa
oddzielne. Push odebrany przed odpowiedzia udanej akcji `OTWORZ HUB` lub
`ROZPOCZNIJ PRACE` nie anuluje tej odpowiedzi, nawet gdy pozniejszy GET
zakonczy sie bledem. Wynik akcji nie moze nadpisac juz znanej wyzszej wersji
obecnosci huba. Wylogowanie uniewaznia takze oczekujace akcje starej sesji.

Outbox jest jedynym wydawca powiadomien listy o logowaniu i wylogowaniu;
warstwa HTTP nie wysyla drugiego bezposredniego `staff_presence_update`.
Przy przelogowaniu publiczny event powstaje dopiero po zapisaniu
odziedziczonego trybu obecnosci, w tej samej transakcji. Dezaktywacja
pracownika zamyka wszystkie jego sesje przez wspolny atomowy mechanizm
zakonczenia sesji, z trwalymi eventami i zamknieciem ich SSE. Nie konczy
sesji innych pracownikow ani prywatnych sesji klienta. Natychmiastowe
zamkniecie starego strumienia przy wylogowaniu/przelogowaniu jest
idempotentnym zabezpieczeniem, a nie drugim wydawca powiadomien listy.

Odczyt i zdarzenie udostepniaja `session_key` zbudowany ze staff_id i numeru
audytowego sesji, a nie z tokena lub pelnego prywatnego session_id. Zdarzenie
zawiera publiczne dane wiersza i czas zakonczenia, aby rowniez szybkie
logowanie i wylogowanie przed kolejnym snapshotem bylo widoczne. Schemat DB
pozostaje bez zmian. Wczesniej lista grupowala sesje tej samej osoby;
obecnie rozdzielenie dotyczy tylko prezentacji. Raporty czasu pracy nadal
nie naliczaja podwojnego czasu za rownolegle sesje.

Po zalogowaniu do zamknietego huba przycisk brzmi `OTWORZ HUB`. W otwartym
hubie ma etykiete `ROZPOCZNIJ PRACE`, a okno pokazuje `W pracy juz sa:`
z samymi imionami pozostalych zalogowanych pracownikow; wiele sesji tej
samej osoby nie powiela imienia. Druga opcja to `TRYB OBSERWACYJNY`.
Jest to deklaracja trybu nowej sesji, a nie ponowne otwarcie otwartego huba.

### Sesje Hub App: logowanie, wspolna praca i zakres wylogowania (2026-10-10)

Ponizsze zasady sa obowiazujacym kontraktem Hub App. Wylogowanie wlasnych
urzadzen nie jest dezaktywacja pracownika, odebraniem roli ani trwalym
zamknieciem wezla sieci. Nie zmienia praw przypisanych do staff_id i nie
konczy sesji innych osob.

#### Tozsamosc, sesja i obecnosci

- Sesja logowania jest konkretnym rekordem `login_sessions` oraz przypisanym
  mu tokenem. Dwa osobne logowania tego samego staff_id moga utworzyc dwie
  sesje, o ile pozwala na to aktualna polityka bezpieczenstwa.
- Dwie karty uzywajace tego samego tokena sa dwiema kopiami jednej sesji,
  a nie dwiema sesjami do zliczenia. Wylogowanie tego tokena zamyka obie
  kopie. Zamkniecie okna przegladarki samo w sobie nie jest wylogowaniem:
  wazna sesja pozostaje w DB do wylogowania, uniewaznienia lub wygasniecia.
- `hub_presence_sessions` okresla tryb konkretnej sesji w hubie. Wazne
  logowanie i rozpoczecie pracy to dwie rozne rzeczy. Sesja bez decyzji
  obecnosci albo w trybie `observe` nie jest operatorem utrzymujacym hub.
- Operatorem jest aktywny worker lub manager z wazna sesja i obecnoscia
  `open`, `pause` lub `sleep`. Kurier oraz obserwator nie zastepuja operatora.
  Stan huba jest agregatem aktualnych obecnosci i istniejacego holda;
  etykieta roli ani sama liczba zalogowanych osob nie rozstrzygaja o zamknieciu.
- Sesje tego samego aktora sa synchronizowanymi kopiami danych. Uprawnienia
  i dopuszczalnosc operacji sprawdza backend na aktualnym stanie DB.
  Pokazany formularz albo zapisany licznik nie sa zgoda na wykonanie operacji.

#### Logowanie i przelogowanie

Nowe logowanie Hub App stosuje istniejaca polityke liczby sesji pracownika.
Ta poprawka nie zwieksza limitow. Przy dopuszczonych wielu sesjach kolejne
logowanie nie zamyka pozostalych waznych sesji tylko dlatego, ze powstala
nowa karta. Przy wymuszonej jednej sesji nowe logowanie nie omija limitu:
istniejacy podglad sesji pozwala jawnie wybrac PRZENIES dla aktywnej sesji.
Przeniesienie zastapi ja nowa, a stary token nie moze dalej wykonywac
operacji. Wybor utworzenia dodatkowej sesji nadal podlega temu samemu
limitowi. Ani sam PIN, ani odswiezenie ekranu nie podnosza limitu.

Przed podaniem PIN-u uzytkownik wybiera PRACA W HUBIE albo TRYB OBSERWACYJNY.
Wybor jest lokalny: sam nie tworzy sesji, obecnosci ani powiadomienia.
Po PIN-ie backend rozpoznaje osobe i rozstrzyga ewentualny wybor stanowiska
oraz sesji. Dopiero kompletny wybor jest atomowo zapisywany. Nie istnieje
posrednie logowanie obserwacyjne przed decyzja o rozpoczeciu pracy.
Dialog ostatniego operatora nigdy nie jest dialogiem powitalnym.
Po przywroceniu juz dzialajacej sesji aplikacja korzysta z jej zapisanej
obecnosci, zamiast rozpoczynac nowe logowanie. Jawne przelogowanie w tej
samej karcie atomowo zamienia poprzednia sesje na nowa i przenosi jej tryb
obecnosci w zakresie dozwolonym dla nowej roli. Nie powoduje posredniego
zamkniecia i ponownego otwarcia huba. Publiczny push nowej sesji powstaje
dopiero po zapisaniu jej docelowego trybu.

##### Atomowe rozpoczecie sesji i odrzucone logowanie

1. Ekran bez tokena najpierw pyta o cel: praca albo obserwacja. Potem pyta
   o PIN. Nie pokazuje listy pracownikow ani szczegolow huba przed
   uwierzytelnieniem. WROC do wyboru trybu niczego nie wylogowuje.
2. Sprawdzenie PIN-u z review_sessions=true zwraca krotkotrwala, podpisana
   autoryzacje. Nie jest to sesja pracy ani token dostepu do Hub API.
   Przy wspolnym PIN-ie wybor stanowiska pozostaje konieczny. Autoryzacja
   wiaze osobe, przypisanie, poswiadczenie, wybrany tryb i attempt_id.
3. Jezeli nie ma aktywnych sesji, przegladarka automatycznie konczy
   logowanie w wybranym trybie. Przy aktywnych sesjach pozostaje jawny
   wybor NOWA SESJA, PRZENIES albo zakonczenie wskazanej sesji.
   Przeniesienie podczas nowego logowania stosuje tryb wybrany przed PIN-em,
   a nie bezwarunkowo tryb starego urzadzenia. Jawne przelogowanie juz
   dzialajacej karty nadal dziedziczy jej tryb w dozwolonym zakresie.
4. Jedno BEGIN IMMEDIATE obejmuje ponowna walidacje aktualnego pracownika,
   aktywnosci huba, roli, poswiadczenia i limitu sesji, wpis login_sessions,
   hub_presence_sessions, audyt hub_presence_events, zakonczenie zastapionej
   sesji, handoff ofert gotowkowych i durable outbox. Jedno COMMIT zatwierdza
   wszystko. Nie powstaje sesja aktywna bez decyzji obecnosci.
5. login_session_started jest kolejkowane dopiero po obecnosci. Jeden push
   staff_presence_update zawiera kompletna staff_session, w tym docelowy
   mode, status, role i publiczny session_key, w powiadomieniu skierowanym
   do wlasciwego huba. Odbiorca nie sklada
   trybu z osobnego wstepnego logowania i pozniejszej decyzji.
   Zmiana topologii lub zamkniecie zastapionego tokena moze miec wlasne
   powiadomienie, ale to inne zdarzenie, nie drugie logowanie tej samej sesji.
6. Odmowa zapisuje hub_login_rejected w hub_login_events z attempt_id,
   zadanym trybem, identyfikatorem zadanym przez uzytkownika, akcja,
   przyczyna i czasem UTC. IP jest zapisywane tylko zgodnie z aktualna
   polityka prywatnosci sesji (jawne IP / hash / bez zapisu).
   Bledny PIN nie dowodzi tozsamosci, dlatego
   staff_id i hub_code2 rozpoznanej osoby moga pozostac NULL.
   Niepoprawna albo wygasla autoryzacja rowniez pozostawia odmowe; jezeli
   nie mozna wiarygodnie odczytac trybu, presence_mode pozostaje NULL.
   PIN, jego jawna wartosc, token oraz sekret nigdy nie trafiaja do audytu.
   Nie powstaje aktywna sesja ani push zalogowania. Audyt odmowy blednego
   PIN-u i wszystkie liczniki ograniczenia prob sa jedna transakcja.
7. Przy odmowie limitu lub zmianie roli cofa sie caly zapis biznesowy,
   w tym ewentualne zakonczenie starej sesji; zatwierdza sie tylko odmowe.
   Nieudany transfer nie moze wylogowac poprawnie dzialajacego urzadzenia.
   Awaria techniczna cofa wszystkie zapisy i pushe zamiast udawac odmowe PIN-u.
8. attempt_id pozostaje taki sam przy ponowieniu tej samej proby po utracie
   odpowiedzi. Ponowienie zakonczonego logowania zwraca ten sam aktywny
   session_id, nie tworzy drugiej sesji ani drugiego zdarzenia i nie resetuje
   pozniej zmienionego trybu. Zakonczona sesja nie jest reaktywowana.
   Zmiana PIN-u lub wyboru trybu rozpoczyna nowa probe.
9. Wybor PRACA W HUBIE nie nadaje roli. Tylko aktualny worker albo manager
   moze go zatwierdzic. Owner bez roli operatora moze wybrac obserwacje;
   backend nie zamienia odmowionej pracy po cichu na obserwacje.

Przyklady:

- Worker wybiera PRACA W HUBIE, podaje poprawny PIN i nie ma innych sesji:
  jeden zapis tworzy aktywna sesje open i jeden push z mode=open. Nie ma
  uprzedniej zielonej/szarej ikonki obserwatora ani drugiego dialogu powitalnego.
- Worker wybiera obserwacje: jeden zapis tworzy observe. Nie otwiera huba
  i nie jest operatorem utrzymujacym jego prace.
- Uzytkownik przerywa po wyborze trybu albo po sprawdzeniu PIN-u, ale przed
  decyzja o aktywnej sesji: nie utworzono logowania ani obecnosci.
- Bledny PIN: audyt odmowy i liczniki prob, bez login_sessions,
  hub_presence_sessions i login_session_started.
- Limit jednej sesji: NOWA SESJA jest odrzucona bez wylogowania starej.
  PRZENIES atomowo zastepuje stary token oraz instaluje wybrany tryb nowego.
- Dwa urzadzenia jednoczesnie przenosza te sama sesje: pierwszy zatwierdzony
  transfer wygrywa. Drugi jest odrzucony, nie zamyka nowej sesji zwyciezcy.
- Serwer zatwierdzil logowanie, ale odpowiedz zaginela: ponowienie tej samej
  autoryzacji zwraca istniejaca sesje; pracownicy nie dostaja drugiego logowania.

#### Pierwsze klikniecie WYLOGUJ

Hub App wysyla `POST /hub-api/auth/logout` z `scope=ask`. Backend wewnatrz
transakcji sprawdza tozsamosc biezacej sesji i liczy jej aktywne, niewygasle
sesje `hub_app` dla tego samego staff_id i huba, lacznie z biezaca.
Licznik nie pochodzi z listy pracownikow w przegladarce. Nie obejmuje
prywatnych sesji Client App, sesji `courier_work`, zakonczonych tokenow
ani sesji innych pracownikow.

Jesli wynik wynosi wiecej niz jeden, nic nie zostaje wylogowane. Odpowiedz
`409 logout_session_choice_required` otwiera pytanie z aktualna liczba:
`Masz otwarte sesje: 4` oraz przyciskami `TYLKO TA SESJA`,
`WSZYSTKIE SESJE`, `WROC`. WROC zamyka ten dialog bez zmiany sesji.
Przy jednej sesji nie ma zbednego pytania o zakres; wykonywany jest zwykly
flow wylogowania, w tym decyzja ostatniego operatora, jezeli jest potrzebna.

#### TYLKO TA SESJA

Zadanie `scope=current` konczy wybrana sesje i jej obecnosci. Inne sesje
tego pracownika, inni pracownicy oraz sesje Client App pozostaja aktywne.
Jezeli inna sesja pracy utrzymuje hub, nie ma decyzji ostatniego operatora.
Jezeli wlasnie ta sesja jest ostatnim operatorem, pozostaje aktywna do
wyboru stanu huba. Anulowanie tej decyzji nie konczy jej logowania.

#### WSZYSTKIE SESJE: zwykle wylogowanie i chroniony ostatni operator

`scope=all` oznacza wszystkie aktualne sesje Hub App tego staff_id w tym
hubie, nie wszystkie konta danej osoby. Backend ponownie ustala zbior
sesji podczas zapisu: sesja otwarta po wyswietleniu pytania jest rowniez
uwzgledniona. Nie przyjmuje listy identyfikatorow od przegladarki.

Jezeli po zamknieciu tych sesji pozostaje inny operator, transakcja konczy
wszystkie wskazane sesje, lacznie z biezaca. Stan huba wynika z pozostalych
operatorow. Obecnosc innych ludzi w trybie obserwacyjnym nie wystarcza,
aby pominac decyzje ostatniego operatora.

Jezeli zamykane sesje sa ostatnimi sesjami pracy, flow ma dwa jawne etapy:

1. Backend atomowo konczy pozostale sesje tego pracownika i ich obecnosci,
   zapisuje zdarzenie zakonczenia osobno dla kazdej i zatwierdza transakcje.
   Biezaca sesja pozostaje wazna i utrzymuje obecnosci. Hub nie jest
   automatycznie zamykany pomiedzy etapami.
2. Odpowiedz `409 last_operator_decision_required` oznacza oczekiwanie na
   decyzje, nie rollback pierwszego etapu. Zawiera aktualny snapshot
   obecnosci, liczbe zamknietych pozostalych sesji i `logout_scope=all`.
   Hub App pokazuje istniejace wybory `ZAMKNIJ HUB`, `PAUZA`, `SLEEP`
   oraz `WROC`, z wyraznym komunikatem o juz zamknietych sesjach.
3. WROC pozostawia aktywna tylko chroniona biezaca sesje. Nie reaktywuje
   starych tokenow i nie odtwarza zamknietych urzadzen. Dalsza praca jest
   mozliwa w tej sesji; pozostale urzadzenia wymagaja nowego logowania.
4. Wybor stanu wysyla ponownie `scope=all` i `final_mode=closed/pause/sleep`.
   Backend jeszcze raz sprawdza aktualne sesje i innych operatorow.
   Gdy nadal jest to ostatni operator, konczy biezaca sesje i zapisuje
   wskazany stan huba. PAUZA i SLEEP korzystaja z istniejacego mechanizmu
   holda huba: nie pozostawiaja zalogowanego ukrytego operatora.
5. Gdy w miedzyczasie rozpocznie prace inny operator, koncowe wylogowanie
   nie zamyka jego huba ani jego sesji. Wybory ostatniego operatora nie
   nadpisuja nowszej obecnosci innych osob.

Szczegolny przypadek: biezaca karta jest obserwacyjna albo jeszcze nie ma
decyzji obecnosci, a inna karta tego samego pracownika jest ostatnim
operatorem. Wybor wszystkich sesji przenosi kontynuacje tej pracy do
chronionej biezacej sesji, zamyka pozostale i pokazuje decyzje koncowa.
Przeniesiony tryb to najsilniejszy z zamykanych trybow pracy
(`open`, nastepnie `sleep`, nastepnie `pause`). Zapisuje sie jawny event
`hub_operator_joined` z przyczyna `logout_all_continue_current`.
WROC oznacza wtedy dalsza prace w tej karcie, nie powrot do obserwacji.
Jezeli wszystkie sesje sa jedynie obserwacyjne, nie ma czego przenosic
i wylogowanie wszystkich nie wymaga decyzji ostatniego operatora.

#### Atomowosc, push i audyt

Kazdy etap jest osobna, kompletna transakcja `BEGIN IMMEDIATE` na jednym
polaczeniu: walidacja sesji/aktora, decyzja o pozostalych operatorach,
zamkniecie loginow, zapis obecnosci, eventy i trwaly outbox. Nie ma
oczekiwania na klikniecie uzytkownika wewnatrz transakcji SQLite.
Awaria przed zatwierdzeniem danego etapu wycofuje wszystkie jego zapisy
i eventy. Zatwierdzony pierwszy etap nie jest cofany przez WROC ani przez
blad sieci przed wyswietleniem dialogu koncowego.

Kazda faktycznie zamknieta sesja dostaje w `login_sessions` status
`logged_out`, czas `logout_at` oraz przyczyne, a jej aktywna obecnosc
dostaje status `ended`. Historia rekordow nie jest kasowana.
`hub_presence_events` rozroznia opuszczenie przez operatora i obserwatora.
Istniejacy outbox zapisuje osobny `LOGIN_SESSION_CLOSED` dla kazdej sesji.
Po commit pushe zamykaja jej SSE oraz wysylaja `staff_presence_update`
do huba. Nie powstaje drugi niezalezny wydawca listy ani polling licznika.

Inny pracownik widzi czerwona ikone dla kazdej zamknietej sesji przez
30 sekund, zgodnie z zasadami listy opisanymi wyzej. W przypadku czterech
sesji ostatniego operatora widzi najpierw trzy czerwone wiersze i jeden
aktywny, a po potwierdzeniu czwartego takze czwarta czerwona ikone.
Do innych pracownikow trafiaja publiczne klucze wierszy, nie tokeny.
Statystyki nie naliczaja czterokrotnie wspolnego czasu pracy czterech
sesji; wykorzystuja istniejace scalanie przedzialow pracy.

#### Wyscigi i przyklady odbiorowe

| Sytuacja | Zachowanie |
| --- | --- |
| Worker ma cztery sesje pracy i wybiera TYLKO TA SESJA. | Konczy sie jedna; trzy pozostaja aktywne. Nie pojawia sie decyzja ostatniego operatora. |
| Worker ma cztery sesje, inny manager pracuje; wybor WSZYSTKIE SESJE. | Koncza sie cztery sesje workera. Manager pozostaje, hub dziala wedlug jego obecnosci. |
| Worker ma cztery sesje, nikt inny nie pracuje. | Najpierw koncza sie trzy, czwarta pozostaje do decyzji ZAMKNIJ HUB / PAUZA / SLEEP. |
| Po poprzednim kroku worker wybiera WROC. | Trzy tokeny pozostaja niewazne; czwarta sesja dalej pracuje. Kolejne WYLOGUJ widzi aktualny licznik, nie dawne cztery. |
| Biezaca karta obserwuje, druga karta workera jako jedyna pracuje. | WSZYSTKIE SESJE zamyka druga karte, chroniona biezaca przejmuje prace i pokazuje decyzje ostatniego operatora. |
| Cztery sesje sa obserwacyjne; nie ma operatora. | Wszystkie koncza sie bez pytania o stan huba; nie tworzymy sztucznej pracy. |
| Drugi worker tylko obserwuje. | Nie utrzymuje huba jako operator i nie omija pytania koncowego pierwszego workera. |
| Manager zaczyna prace, gdy worker ma juz otwarty dialog ostatniego operatora. | Potwierdzenie zamyka wlasne sesje workera, ale nie zamyka huba prowadzonego przez managera. |
| Nowa wlasna sesja powstaje po pokazaniu licznika. | WSZYSTKIE SESJE obejmuje ja przy nastepnym zapisie; TYLKO TA SESJA jej nie zamyka. |
| Dwa urzadzenia tego samego staff_id jednoczesnie wybieraja WSZYSTKIE SESJE. | Pierwsza zatwierdzona decyzja wygrywa. Zamkniety token drugiego urzadzenia nie moze wykonac kolejnej decyzji. Zostaje jedna chroniona sesja, nie dwie. |
| Dwie rozne osoby jednoczesnie wylogowuja swoje wszystkie sesje. | Zapisy sa serializowane. Pierwsza moze odejsc przy obecnosci drugiej; druga zostaje jako ostatni operator do decyzji. Nie zamykaja wzajemnie swoich tokenow. |
| Jedna sesja jest otwarta w dwoch kartach z tym samym tokenem. | Licznik pokazuje jedna sesje. Jej wylogowanie uniewaznia obie karty. |
| Polityka zezwala na jedna sesje; pracownik probuje zalogowac drugie urzadzenie. | Nie powstaje druga rownolegla sesja ponad limit. Jawne PRZENIES w istniejacym podgladzie sesji zastepuje poprzednia; stary token przestaje dzialac. |
| Pracownik ma rowniez logowanie prywatne i sesje kuriera w Client App. | WSZYSTKIE SESJE Hub App nie zamyka tych sesji; dotyczy tylko hub_app dla tego staff_id i huba. |
| Sesja wygasa lub zostaje uniewazniona podczas dialogu. | Kazde potwierdzenie ponownie weryfikuje token; stara sesja nie moze zatwierdzic decyzji. UI wraca do logowania po zamknieciu sesji. |
| Spozniona odpowiedz starego logout przychodzi po nowym logowaniu. | Nie otwiera dialogu, nie podmienia obecnosci i nie wylogowuje nowej sesji. Wynik nalezy do tokena i sekwencji akcji, ktore go rozpoczely. |

Ponowienie po utracie odpowiedzi pierwszego etapu jest bezpieczne:
zamkniete pozostale sesje nie sa ponownie zamykane ani ponownie emitowane.
Chroniona aktywna sesja moze ponownie uzyskac pytanie o stan huba.
Po zakonczeniu biezacej sesji jej token jest niewazny; kolejne zadanie
nie jest odtwarzaniem operacji finansowej ani nowa zgoda na zmiane huba.

Obsluga korzysta z istniejacych tabel, zdarzen i polityki sesji. Nie dodaje
nowego schematu DB ani nie zmienia sesji prywatnych. Dezaktywacja pracownika
przez uprawniona osobe pozostaje odrebna operacja administracyjna.

### Odbudowa danych po starcie oraz prezentacja giełdy

Po pierwszym załadowaniu runtime z DB system odbudowuje metryki paczek przed
budową ofert. Dzięki temu kwoty i dane transportowe po restarcie nie zależą od
wcześniejszego stanu pamięci procesu.

Kod opakowania na giełdzie ma kolor wyliczany deterministycznie z jego
identyfikatora. Ten sam fizyczny worek lub skrzynka ma ten sam kolor w ofercie
standardowej i przeskokowej, a różne widoczne opakowania otrzymują różne,
wyraźne kolory bez bieli, czerni i szarości. Kolor jest wyłącznie oznaczeniem
UI i nie ma znaczenia domenowego. Przy zmianie zestawu ofert rozstrzyganie
kolizji odbywa się ponownie dla aktualnie widocznych opakowań.

Wiersz opakowania pokazuje większym krojem główną kwotę oraz stawkę pod nią.
Po rozwinięciu worka kwota transportu jest pokazywana przy konkretnej paczce,
aby kurier widział, jaka część wynagrodzenia dotyczy każdego elementu.



## Historia Kluczowych Decyzji



Ta sekcja dokumentuje **dlaczego** podjelismy pewne decyzje i jakie alternatywy odrzucilismy.



### Dlaczego NIE ma centralnego HUB-a?



**Poczatkowa koncepcja:**

- Rozwazalismy hierarchie: HUB glowny -> HUB strefowy -> pod-strefy

- Przyklad: "HUB 2.3" = polnocny-wschod w strefie polnocnej

- System zagniezdzony (HUB 5 -> HUB 2 -> HUB 2.3 -> punkt koncowy)



**Dlaczego odrzucone:**

- Za skomplikowane dla malych sklepow/fryzjerow

- Punkty to NIE wyspecjalizowane sortownie z maszynami

- Trudne do zarzadzania i skalowania

- Hierarchia tworzy single points of failure



**Finalna decyzja:**

- **Plaska siec rownorzednych punktow**

- Kazdy punkt to maly sklep/restauracja/fryzjer

- Jesli punkt ma duzy ruch -> powstaje drugi obok (organiczne rozrastanie)

- Brak glownego HUB-a = brak waskiego gardla



---



### Dlaczego max 9 kierunkow w sortowni?



**Rozwazane opcje:**

- Dzielic na wszystkie punkty (teoretycznie mozliwe)

- 12-15 kierunkow (wiecej opcji routingu)

- 9 kierunkow (siatka 3×3, pomijajac srodek)



**Dlaczego 9:**

- **Ludzie sortuja, nie maszyny** - wiecej workow = wiecej pomylek

- 9 to granica gdzie czlowiek nie gubi sie

- Punkty z wiekszym ruchem moga miec wiecej, ale to wyjatek

- Worki musza byc latwe do identyfikacji (numery 2-9)



**Ale:** Liczba nie jest sztywna - w praktyce moze byc 8-12 w zaleznosci od punktu



---



### Dlaczego przepakowanie ma byc minimalne?



**Problem:**

- Poczatkowo myslelismy: kazdy punkt otwiera worek, sortuje, pakuje na nowo

- To standard w tradycyjnych sortowniach



**Dlaczego to zle dla nas:**

- **Kazde otwarcie worka = ryzyko bledu**

- Ludzie (nie maszyny) moga pomylic paczki

- Dodatkowy czas = wolniejsza dostawa

- Punkty to male sklepy - nie maja czasu na przepakowania



**Rozwiazanie:**

- **Inteligentne pakowanie** - tagi NFC mowia "otworz" lub "przekladaj"

- Worek otwierany tylko gdy kod sie ZMIENIA

- System projektuje worki z mysla o minimalizacji przepakowan

- "Dziel tylko gdy oszczedzasz prace"



---



### Dlaczego kody tras (4.4.5) a nie bezposrednie adresy?



**Alternatywa:**

- Kazda paczka ma adres koncowy

- System GPS wyznacza trase

- Punkty musza wiedziec dokladne lokalizacje



**Dlaczego odrzucone:**

- Kiepski internet w Nairobi

- Nie wszyscy maja smartfony z GPS

- Adresy w Nairobi chaotyczne (brak numeracji ulic)

- Za zlozone dla malych punktow



**Dlaczego kody kierunkowe:**

- **Prosty system relatywny** - kazdy punkt zna swoich 8 sasiadow

- Dziala offline (kod 9 = poludniowy-wschod)

- Nie wymaga map ani GPS

- Latwo skalowac (dodanie punktu = aktualizacja sasiadow)



---



### Dlaczego "dziel worki wczesniej" ma prog (10-25 paczek)?



**Poczatkowa koncepcja:**

- Zawsze dzielic jak najwczesniej (maksymalna optymalizacja)

- Lub: nigdy nie dzielic (minimalizacja pracy punktow)



**Problem z "zawsze dziel":**

- 98 paczek kierunek A + 2 paczki kierunek B

- Tworzenie osobnego worka dla 2 paczek = nieekonomiczne

- Transport 2 workow drozszy niz praca sortowni



**Problem z "nigdy nie dziel":**

- 50 paczek kierunek A + 50 paczek kierunek B

- Punkt musi otworzyc, przesortowac

- Zbedna praca gdy mozna bylo podzielic wczesniej



**Zloty srodek - prog:**

- Dziel tylko gdy **obie grupy duze** (>10-25 paczek)

- Dziel tylko gdy **oszczedzasz prace** w nastepnym punkcie

- Jesli mala grupa (<10) -> wyslac razem, punkt podzieli



**Dokladny prog:** Do ustalenia empirycznie (testy w terenie)



---



### Dlaczego system aukcji zamiast stalych stawek?



**Alternatywy:**

- Stale stawki (100 KES za km)

- Taryfa taksowkowa (licznik)

- Negocjacje 1-on-1 (kurier vs nadawca)



**Dlaczego aukcja dynamiczna:**

- **Kurierzy pracuja na zlecenie** - nie mamy kontroli nad podaza

- Stawki musza sie dostosowac do popytu/podazy

- Ruchliwa trasa (duzo kurierow) = nizsze ceny

- Trudna trasa (malo kurierow) = wyzsze ceny

- System uczy sie i optymalizuje



**Problem do rozwiazania:**

- Jak zbalansowac by jeden kurier nie bral wszystkiego?

- Jak subsydiowac deficytowe trasy?

- Szczegoly mechanizmu aukcji (timing, przelicytowanie)



---



### Dlaczego marker zamiast drukarek?



**Problem:**

- Chcielismy QR kody dla kazdej paczki

- Wymaga drukarek w kazdym punkcie



**Realia Nairobi:**

- Problemy z drukarkami (awarie, brak tuszu, prad)

- Kosztowne dla malych sklepow

- Wolne (drukowanie zwleka nadanie)



**Rozwiazanie - marker:**

- Pracownik pisze kod markerem na paczce

- NFC tag wielokrotnego uzytku (przyklejany)

- QR kod opcjonalny (dla tych co maja telefon)

- **Inteligentne wpisywanie** - wystarczy 2-4 litery, system podpowiada



---



### Dlaczego koszt dla nadawcy sie NIE zmienia po nadaniu?



**Pytanie:**

- System zmienia trase dynamicznie (P1->P5->P6 na P1->P2->P6)

- Czy nadawca placi wiecej za dluzsza trase?



**Decyzja: NIE**



**Dlaczego:**

- **Nadawca placi za rezultat** (dostawa A->B), nie za proces

- Zmiany tras to wewnetrzna optymalizacja systemu

- Chroni nadawce przed nieprzewidywalnymi kosztami

- System balansuje koszty wewnetrznie (prowizje, subsydia)



**Wyjatek:**

- Nadawca SAM doplaca (chce przyspieszyc) -> wtedy tak, placi wiecej

- Ale system nie podnosi ceny automatycznie



---



### Dlaczego brak weryfikacji tozsamosci przy odbiorze?



**Pytanie:**

- Jak zapobiec kradziezy? Ktos podslucha kod i odbierze paczke



**Rozwazane opcje:**

- Dowod osobisty + kod

- Numer telefonu + SMS

- Zdjecie odbiorcy

- Biometria



**Decyzja: Tylko kod**



**Dlaczego:**

- **Prostota** - male sklepy nie maja czasu na weryfikacje

- Brak infrastruktury (czytniki, bazy danych)

- Kiepski internet (nie da sie sprawdzic online)

- **Akceptowalne ryzyko** - nadawca moze wyslac kod dopiero gdy odbiorca jest w punkcie



**Przyszlosc:**

- Moze: opcja "odbior z dowodem" (platne, dla wartosciowych paczek)

- Moze: PIN dodatkowo (generowany przy nadaniu)



---



### Dlaczego plaska siec zamiast klasycznego hub-and-spoke?



**Klasyczny model (hub-and-spoke):**

```

Wszystkie paczki -> HUB centralny -> sortowanie -> dystrybuacja

```

**Plusy:** Efektywne sortowanie, latwe zarzadzanie

**Minusy:** Waskie gardlo, wymaga infrastruktury



**Nasz model (mesh network):**

```

Punkt -> Punkt -> Punkt -> Punkt (kazdy sortuje lokalnie)

```

**Plusy:** Skalowalne, odporne na awarie, organiczne

**Minusy:** Wiecej przepakowan (ale minimalizujemy przez inteligentne worki)



**Dlaczego wybralismy mesh:**

- Brak kapitalu na centralna sortownie

- Nairobi = rozproszone, korki (HUB centralny bylby bottleneck)

- Chcemy male punkty (sklepy) nie wielkie magazyny

- Model rosnie organicznie (dodanie punktu = update sasiadow)



---



### Dlaczego priorytet dla kuriera ktory juz jedzie?



**Scenariusz:**

- Kurier zarezerwowal A->B, w drodze

- Nowa paczka A->B dochodzi do punktu A

- Pytanie: Czy dac temu samemu kurierowi?



**Decyzja: TAK (z opcja odmowy)**



**Dlaczego:**

- **Oszczednosc** - nie czekac na drugiego kuriera

- Kurier i tak jedzie, dodatkowa paczka = bonus

- Szybsza dostawa dla nadawcy



**Ale:** Kurier moze odmowic (brak miejsca, pasazer na motocyklu)



**Alternatywa odrzucona:**

- Kazda paczka osobna aukcja

- Wydluzaloby czas dostawy, wiecej kurierow potrzebnych



---



### Dlaczego czas dostawy NIE jest priorytetem?



**Pytanie:**

- Dlaczego list moze isc 5 dni na 10 km?



**Kontekst Nairobi:**

- Brak infrastruktury pocztowej

- Ludzie przyzwyczajeni ze nie ma dostaw

- **Priorytet: zeby w ogole dzialalo** i bylo tanie



**Filozofia:**

- **Ekonomia > Szybkosc**

- Nadawca wie ze tanio = wolno

- Opcja express dla pilnych (drozej)

- System optymalizuje koszt, nie czas



**Z czasem:**

- Jak siec sie rozwinie -> bedzie szybciej naturalnie

- Wiecej punktow = krotsze trasy

---



### Dlaczego Magnetyzm Kierunkowy (Sektorowy) a nie punktowy?



**Poczatkowa koncepcja:**

- Bonus za konsolidacje (magnetyzm) naliczany tylko jesli inna paczka w hubie A jedzie dokladnie do tego samego huba B.



**Problem:**

- Zbyt rzadkie wystepowanie bonusu. Jesli paczka 1 jedzie P4 -> A1 -> P5, a paczka 2 jedzie P4 -> A1 -> P3, to system nie widzial konsolidacji na pierwszym odcinku (P4->A1), mimo ze obie paczki "chca" jechac na polnoc.



**Decyzja: Magnetyzm Kierunkowy (Sektory)**

- Bonus naliczany, jesli paczka jedzie w tym samym **sektorze** (kierunku) co inne zasoby w sieci.

- Kazdy hub sprawdza swoich 8 sektorow geograficznych.

- Jesli kurier i tak jedzie na Polnoc (sektor 1), to kazda paczka "polnocna" dostaje rabat (-80 VKES).



**Zaleta:**

- Tworzenie "autostrad" i naturalnych potokow transportowych.

- System samoczynnie dazy do laczenia paczek w wieksze grupy, nawet jesli ich cele koncowe sa rozne, o ile leza w tym samym kierunku.



---



### Dlaczego Magnetyzm 2.0 (B-magnetyczna) i alternatywne korytarze?



**Problem:**

Standardowa logika (A) szukala magnetyzmu tylko na trasie najkrotszej. Jesli obok, w sasiednim sektorze, istniala juz "autostrada" (worki w transporcie), system jej nie widzial, mimo ze mogla byc ekonomicznie lepsza dla sieci.



**Decyzja:**

Wprowadzenie **Logiki B (Magnetyzm 2.0)**, ktora:

1. Sprawdza, czy cel lezy blizej lewej czy prawej granicy obecnego sektora.

2. Wyznacza trase alternatywna przez ten sasiedni sektor.

3. Teoretycznie "zeruje" koszty odcinkow, na ktorych juz jada odpowiednie worki.

4. Wybiera alternatywe, jesli jej teoretyczny koszt jest nizszy od standardu.



**Zaleta:**

System aktywnie "zasysa" paczki do istniejacych korytarzy transportowych, zamiast wysylac kurierow na puste, nowe trasy tylko dlatego, ze sa o 1 km krotsze.



---



### Dlaczego zysk z optymalizacji (Skip Profit) trafia do kuriera?



**Poczatkowa koncepcja:**

- Oszczednosc z ominietego huba (50 KES) trafiala do "Firmy" (Systemu) jako zysk z optymalizacji.



**Decyzja: Zmiana na bonus dla kuriera**

- Calosc zaoszczedzonej prowizji ominietego huba trafia bezposrednio do portfela `vkes_balance` kuriera.



**Dlaczego:**

- **Motywacja**: Kurierzy sami szukaja skrotow i optymalnych drog.

- **Nagroda za spryt**: To kurier ryzykuje i wklada wysilek w omijanie zatorow (np. hub A1 jest zapchany).

- **Zasada win-win**: System ma mniej przeladowan (paczka bezpieczniejsza), a kurier zarabia wiecej przy tym samym dystansie.



---



### Dlaczego Audyt Finansowy jest osobnym modulem?



**Decyzja: Eksternalizacja audytu do `financial_audit.py`**



**Dlaczego:**

- **Single Source of Truth**: Logika sprawdzania, czy system "nie gubi pieniedzy", musi byc nienaruszalna i latwa do weryfikacji. 

- **Czystosc kodu**: Glowny plik logiki (`courier_logic_poc.py`) stal sie zbyt duzy. Audyt to funkcja nadzorcza, nie operacyjna.

- **Bezpieczenstwo**: Latwiej audytowac sama funkcje audytujaca, gdy jest odizolowana od skomplikowanych algorytmow routingu.

### Dlaczego Logowanie Strukturalne (JSON) zamiast Printow?



**Problem:**

- Klasyczne `print()` zasmiecaja konsole i uniemozliwiaja latwe filtrowanie.

- Frontend React (SSE) nie potrafi "zrozumiec" zwyklego tekstu, co prowadzi do bledow parsowania.



**Decyzja: Przejscie na `log()` i format JSON**

- Wprowadzono funkcje `log(message, data, level)`, ktora produkuje maszynowo czytelny JSON.

- **LOG_MODE**: Mozliwosc przelaczenia calego systemu w tryb "silent" (dla Flaska) lub "json".



**Zaleta:**

- Systemy zewnetrzne (frontend, audyt, analityka) moga w czasie rzeczywistym konsumowac logi bez ryzyka craszu.

- Latwiejsze debugowanie trudnych bledow (wyscigi, bledy stanowe) dzieki metadanym w logach.



---



### Dlaczego Stabilnosc i Concurrency (Thread-safety) sa priorytetem?



**Problem:**

- Serwer Flask jest wielowatkowy. Gdy jeden watek (SSE) czyta dane, a drugi (API) je modyfikuje, Python wyrzuca `RuntimeError: dictionary/list changed size during iteration`.



**Rozwiazanie:**

- **Snapshots**: Wszystkie iteracje po kolekcjach w metodach `.to_dict()` sa owijane w `list()`, co tworzy bezpieczna kopie danych do odczytu.

- **Globalne przechwytywanie bledow**: Flask serwer posiada `handle_exception`, ktory zapisuje kazdy crash do `crash.log`.



**Zaleta:**

- System nie "zdycha" przy duzym ruchu na froncie. 

- Nawet jesli wystapi blad, mamy pelny traceback w logu, co pozwala na naprawe bez zgadywania.



---



### Zysk Systemu (Company Profit) - Logika v3.0



**Zasada:**

Wszystkie oszczednosci wynikajace z optymalizacji trasy i decyzji topologicznych trafiaja do portfela Firmy (`total_optimization_savings`).



**Detale:**

- **Skip Profit**: Jesli kurier ominie huba (przeskok bezposredni), zarezerwowana oplata za ten hub (50 VKES) zostaje wycofana z budzetu paczki i trafia do Firmy. Kurier otrzymuje standardowa zaplate za przejechane kilometry.

- **Transit Bonus**: Jesli paczka przejezdza przez hub w zaplombowanym worku (tranzyt bez otwierania), roznica miedzy standardowa prowizja a niska oplata za przeladunek (10 VKES) stanowi zysk Firmy.

- **Dlaczego?** Firma jest wlascicielem algorytmu optymalizacji i infrastruktury. Zysk z "matematyki" trasy pozwala na utrzymanie serwerow i subsydiowanie trudnych odcinkow, gdzie budzet paczki moglby nie starczyc na oplacenie kuriera.



**Zasada zachowania:**

Jesli trasa teoretyczna przewiduje 3 huby, a kurier odwiedzi tylko 1 (pominie 2), to prowizja za te 2 ominiete huby (100 VKES) trafia do portfela `_company_profit`. Kurier zarabia na czystym dystansie.



---



### Dlaczego UI v4 przenioslo tooltipy z Canvas do HTML Overlay?



**Problem:**

Tooltipy rysowane bezposrednio na canvasie byly statyczne, nieklikalne i ulegaly rozmazaniu. Trudno w nich bylo umiescic tabele czy animowane listy.



**Decyzja:**

- **Hybrid UI**: Logika animacji (krazace worki, trasy) zostaje na Canvas (plynnosc). Detale (HubCard, BagPopup) to HTML Overlay (flexbox, CSS, interaktywnosc).

- **Zasada**: Najechanie na element canvasa (Hub, Bag) aktywuje stan w React, ktory pozycjonuje "plywajacy" `div` nad mapa.



---



### Dlaczego wprowadzono archiwum BAG zamiast logow konsoli?



**Problem:**

Sledzenie losow doreczonych paczek w konsoli tekstowej bylo niemozliwe przy duzym ruchu. Historia znikala przy odswiezeniu strony.



**Decyzja:**

Wprowadzenie dedykowanego panelu `ðŸ› BAG` (Archiwum), ktory:

1. Przechowuje pelny `tracking_history` kazdej paczki od pierwszego nadania (L001).

2. Pozwala na audyt finansowy (payment_history) po fakcie.

3. Daje operatorowi dowod doreczenia (delivered_at).



---



### Architektura komunikacji zdarzeniowej



**Koncepcja:**

Serwery HTTP udostepniaja komendy i odczyty REST oraz jednokierunkowy kanal
zdarzen SSE:



1. **SSE (Server-Sent Events)**: Jednokierunkowy strumien zdarzen (`parcel_moved`, `hub_update`, itp.). Frontend dostaje powiadomienie natychmiast po zmianie w Core Engine.

2. **HTTP JSON API**: Gielda zlecen i akcje kuriera sa wykonywane przez jawne
   komendy i odczyty REST. Frontend pobiera snapshot po otwarciu/reconnect oraz
   po otrzymaniu eventu SSE tylko wtedy, gdy numer rewizji jest nowszy. Nie
   odpytuje cyklicznie API ani DB.



**Dlaczego tak?**

- SSE jest lzejsze niz WebSockety i latwiejsze w debugowaniu.

- Pozwala zachowac "reaktywnosc" mapy bez przeladowywania calej aplikacji.



---



### Lokalizacja i Warunki

- **Miejsce**: Nairobi, Kenya

- **Problem**: Brak funkcjonujacej infrastruktury pocztowej

- **Ograniczenia techniczne**: 

  - Kiepski internet

  - Problemy z drukarkami

  - Ograniczone zasoby technologiczne



### Cel Biznesowy

- Nie nastawienie na zysk, ale **nie moze byc strata**

- Priorytet: **cena i ekonomia** (nie szybkosc dostawy)

- List moze isc 5 dni na 10 km - to akceptowalne

- Nadawca i odbiorca musza byc o tym poinformowani



---



## Model Operacyjny



### Struktura Sieci

- **Bez centralnej sortowni**

- Siec punktow odbioru/nadania w **malych sklepach** wokol Nairobi

- Kazdy punkt = mini-sortownia

- Male sklepy (nawet 5 klientow/dzien) moga przystapic - dodatkowy dochod



### Transport

- **Kurierzy**: motocykle (boda-boda) i taksowki

- Kurierzy pracuja **na zlecenie** (nie zatrudnieni)

- Praktycznie tylko prywatny transport

- System **gieldy transportowej** z dynamicznym pricingiem



---



## System Workow i Sortowania



### Zasady Workowania

- **Max 9 kierunkow jednoczesnie** = 9 otwartych workow w punkcie

- Wiecej workow = ryzyko pomylek przy sortowaniu

- Jeden worek = jeden punkt docelowy

- **Brak podzialu standard/priority** - wszystkie paczki rowne, roznia sie tylko cena


### Ręczny wybór opakowania przy nadaniu — model zgodny z Hub API

Przy nadaniu paczki albo ASSETU Hub App pokazuje operatorowi opcje dla
pierwszego hopu trasy. Są to trzy równorzędne rodzaje kontenera transportowego:
fizyczny worek (`W`, `container_type=BAG`), opakowanie wirtualne
(`V`, `container_type=VIRTUAL_BAG`) i fizyczna skrzynka
(`S`, `container_type=BOX`). V jest trzecim rodzajem opakowania wybieranym
przez pracownika. Nie jest trybem domyślnym, automatycznym zastępstwem W ani
flagą stanu fizycznego worka.

- Lista zawiera tylko kontenery `OPEN` bieżącego huba dla pierwszego hopu,
  w kolejności W, V, S. W każdej grupie opcja „Nowy” znajduje się przed
  istniejącymi kontenerami posortowanymi po kodzie.
- Dokładnie jeden wybór jest wymagany. Kontrakt rozróżnia `existing` z
  `container_id` oraz `new_bag`, `new_virtual_bag` i `new_box` bez ID.
- V nigdy nie jest zaznaczane domyślnie. Jeżeli nie ma żadnego otwartego
  kontenera i jest `BAG_STOCK`, domyślny jest `new_bag`. Jeżeli istnieje
  dokładnie jeden otwarty kontener i jest nim fizyczny W, domyślny jest ten W.
  We wszystkich pozostałych układach pracownik musi wybrać opcję świadomie.
- Waga i wymiary służą formularzowi, cenie i metrykom, ale w tym etapie nie
  wybierają rodzaju opakowania.
- Jawnie wybrana opcja pozostaje zaznaczona po odświeżeniu, jeśli nadal jest
  dostępna; w przeciwnym razie Hub App stosuje regułę domyślną albo pozostawia
  wybór pusty.


### Kody opakowań — działający generator

Każdy istniejący W, V i S ma kod wyświetlany pracownikowi i zapisany jako
`bags.id`. Kod jest potrzebny do wskazania konkretnego opakowania, wyszukania
go oraz wydrukowania instrukcji po nadaniu.

#### Kod paczki a kod opakowania

- Kod paczki `CODE4` i kod opakowania są niezależne. `CODE4` identyfikuje
  paczkę, a kod W/V/S wskazuje miejsce, do którego pracownik ma ją odłożyć.
- `CODE4` ma cztery znaki RFC4648 i koduje docelowy hub, kierunek oraz licznik
  `0..255`. Generator sprawdza, czy kod nie jest używany przez aktywną paczkę.
- Dla V pracownik zapisuje na paczce oba identyfikatory w formie
  `[CODE4 PACZKI] - [KOD V]`. Dzięki temu paczki należące do jednego
  opakowania wirtualnego mają wspólny kod V mimo różnych kodów paczek.

#### Kod fizycznego W i opakowania wirtualnego V

- W i V korzystają z tego samego generatora i wspólnej przestrzeni kodów.
  Sam kod nie rozpoznaje rodzaju opakowania; rozstrzyga go wyłącznie
  `bags.container_type`.
- Format to: znak lokalny huba źródłowego + licznik Code32 + znak lokalny
  pierwszego huba docelowego. Przykładowo trzyznakowy kod może mieć postać
  `A7B`. Używany alfabet to `ABCDEFGHIJKLMNOPQRSTUVWXYZ234567`.
- Licznik jest utrzymywany per hub źródłowy w `hub_bag_counters.next_counter`.
  Dla wartości `0..31` ma jeden znak, dlatego najkrótszy kod W/V ma trzy
  znaki. Od wartości 32 część licznikowa rośnie i kod może mieć cztery lub
  więcej znaków, np. `ABAB`.
- Po wykorzystaniu pierwszych 32 wartości generator przed wydłużeniem lub
  przy każdym kolejnym przydziale sprawdza niższe wartości i ponownie używa
  najniższego wolnego kodu.
- Kandydat musi być nieobecny w całej tabeli `bags`, więc W i V nie mogą mieć
  tego samego `bags.id`. Generator pomija również dynamiczny zakres
  `hub_box_inventory.id` przeznaczony dla skrzynek, aby trzyznakowy kod W/V
  nie pokrył się z bazowym kodem S.
- Kod jest przydzielany dopiero w końcowej transakcji tworzącej nowy W albo V,
  nie w chwili zaznaczenia opcji na ekranie podsumowania.

#### Kod skrzynki S

- Skrzynka ma stały kod bazowy Code32 wynikający z jej
  `hub_box_inventory.id`. Identyfikatory skrzynek zaczynają się od `1024`,
  dlatego pierwsze skrzynki mają trzyznakowy kod Code32. Nie istnieje górny
  limit ID ani długości kodu: po wyczerpaniu kodów trzyznakowych baza rośnie do
  czterech i kolejnych znaków, np. `BAAA`.
- Po otwarciu dla kierunku kontener transportowy S dostaje kod złożony z
  pełnej bazy o zmiennej długości oraz znaków lokalnych huba źródłowego i
  docelowego, np. `BBEDE` albo `BAAADE`. Kod bazowy nadal wskazuje tę samą
  fizyczną skrzynkę.
- Przy dalszym tranzycie kod S może otrzymać kolejny znak lokalny. Nie zmienia
  to bazowej tożsamości skrzynki. Rekord `bags` przechowuje jawne
  `inventory_id`, dlatego system nie odgaduje już tożsamości S z pierwszych
  trzech znaków pełnego kodu transportowego.


### Zachowanie poszczególnych opakowań

#### 1. Fizyczny worek W

- `new_bag` jest dostępny tylko przy dodatnim `BAG_STOCK`.
- W końcowej transakcji system pobiera jeden fizyczny worek, generuje kod W,
  tworzy rekord `BAG` i od razu dodaje pierwszą paczkę. Nie powinien pozostać
  pusty W utworzony przez formularz nadania.
- Istniejący W musi nadal być `OPEN` i prowadzić do właściwego pierwszego
  hopu. UI pokazuje kod, liczbę paczek, wagę, objętość i zapełnienie względem
  limitu.
- Instrukcja nowego W nakazuje napisać kod paczki, przygotować worek i napisać
  na nim wygenerowany kod W. Dla istniejącego W wskazuje jego kod.

#### 2. Opakowanie wirtualne V

- `new_virtual_bag` jest zawsze dostępne, ale nigdy nie jest domyślnym
  wyborem. Pracownik musi świadomie zaznaczyć nowe albo istniejące V.
- Nowe V powstaje atomowo z pierwszą paczką. Dostaje kod z tego samego
  generatora co W i rekord `bags` z `container_type=VIRTUAL_BAG`, ale nie
  zmniejsza `BAG_STOCK` i nie reprezentuje fizycznego worka.
- Istniejące V musi być `OPEN` i prowadzić do właściwego pierwszego hopu.
  UI pokazuje jego kod, liczbę paczek, wagę i objętość, bez fizycznych limitów
  i bez procentowego wskaźnika zapełnienia.
- Pracownik rozpoznaje przynależność paczki po parze kodów zapisanej na
  paczce: `[CODE4 PACZKI] - [KOD V]`. Dla nowego V komunikat mówi, że jest to
  pierwsza paczka; dla istniejącego V podaje liczbę paczek po dodaniu.
- V nie może przewozić pustych worków ani skrzynek rebalansujących.
  `empty_bags_carried` i lista dodatkowych skrzynek muszą pozostać puste.
- V nie wykonuje `return_bag()` i przy odbiorze nie zwiększa fizycznego stanu
  worków. Gdy paczka z V jest przepakowywana na kolejnym hubie, kod szuka
  otwartego V dla następnego hopu albo tworzy nowe V; nie zamienia jej
  automatycznie na fizyczny W.

#### 3. Skrzynka S

- `new_box` jest dostępne tylko, gdy dla kierunku nie istnieje pusta S `OPEN`
  i w magazynie jest dostępna skrzynka.
- W końcowej transakcji wybierana jest skrzynka o najniższym `id`:
  najpierw `ACTIVE`, a następnie `DEGRADED`. Kliknięcie opcji nie rezerwuje S.
- Istniejąca S musi być `OPEN` i prowadzić do właściwego pierwszego hopu.
  UI pokazuje kod, liczbę paczek, wagę, objętość i zapełnienie względem limitu.
- Dla jednego kierunku może istnieć najwyżej jedna pusta S `OPEN`. Ręczne
  otwarcie pustej S pozostaje osobną operacją zakładki „Opakowania”.
- Instrukcja nowej S podaje pełny kod bazowy o aktualnej długości, dwa znaki
  trasy i pełny kod S. Dla istniejącej S wskazuje pełny kod skrzynki.


### Parametry fizycznego worka W i skrzynki S

W i S korzystają z jednego kontraktu parametrów. W ma jeden standard globalny
`package_bag_limits_json`, ponieważ puste worki są anonimowym stanem
`hubs.bag_stock` i nie mają indywidualnych rekordów. S korzysta ze standardu
`package_box_limits_json`; niepuste kolumny konkretnego rekordu
`hub_box_inventory` mogą niezależnie nadpisać standard skrzynki.

| Pole | Znaczenie |
|---|---|
| `weight` | Masa pustego fizycznego opakowania w kg. Jest wartością początkową kontroli opakowania w Rewizji, ale nie jest doliczana do wagi netto paczek. |
| `dim_x_m`, `dim_y_m`, `dim_z_m` | Fizyczne zewnętrzne wymiary opakowania. Dla worka opisują umowną bryłę worka po wypełnieniu. |
| `max_weight_kg` | Maksymalna suma wag paczek w środku. `0` lub `null` oznacza brak limitu. Nie jest to masa opakowania. |
| `max_dim_x_m`, `max_dim_y_m`, `max_dim_z_m` | Maksymalne wymiary pojedynczej paczki, która może przejść przez otwór opakowania. |
| `weight_tolerance_kg` | Stała tolerancja przyszłej kontroli masy pustego opakowania. |
| `weight_tolerance_percent` | Procentowa tolerancja przyszłej kontroli masy pustego opakowania. |

Aktualny standard W ma `weight=6 kg`, `dim=0,50 x 0,40 x 0,30 m`, taki sam
`max_dim`, `max_weight_kg=0`, tolerancję stałą `0 kg` i procentową `60%`.
Aktualny standard S ma `weight=2 kg`, `dim=0,45 x 0,60 x 0,35 m`, taki sam
`max_dim`, `max_weight_kg=0`, tolerancję stałą `0 kg` i procentową `50%`.
Równe `dim_*` i `max_dim_*` oznaczają obecnie otwór równy wymiarowi opakowania;
model pozwala później ustawić mniejszy otwór bez zmiany fizycznej bryły.

Dla każdej osi musi zachodzić `max_dim_* <= dim_*`. Oznacza to, że skrzynka
albo worek mogą mieć większe wnętrze niż otwór, przez który wkładana jest paczka.
W danych historycznych brak `dim_*` jest uzupełniany odpowiadającym `max_dim_*`,
a brak `max_dim_*` odpowiadającym `dim_*`. Pochodna `max_volume_m3` jest liczona
z fizycznej bryły `dim_x_m * dim_y_m * dim_z_m`; nie jest osobnym źródłem danych.

V nie ma fizycznego `weight`, `dim_*`, `max_weight_kg`, `max_dim_*` ani
wskaźników fizycznego limitu.

Obecnie każdy hub ma `container_limits_enforced: false`. System zachowuje i
pokazuje parametry, a dodatnie przekroczone `max_weight_kg` daje wyłącznie
ostrzeżenie przy podsumowaniu. Ostrzeżenie liczy sumę wag paczek bez masy
opakowania, nie blokuje nadania i nie zmienia ręcznego wyboru W/V/S. Gabaryty,
otwór i objętość nie są jeszcze sprawdzane. Tryb `true` pozostaje zarezerwowany
do czasu uzgodnienia obracania paczki, układania wielu paczek i zasad blokowania.


### Transakcja nadania i odpowiedź Hub API

1. Walidacja formularza wyznacza pierwszy hop i zwraca `container_options`.
   `container_preview` pozostaje kompatybilną podpowiedzią.
2. Wybrany `container_selection` przechodzi przez formularz, mapper i komendę
   domenową, również przy ponownym wysłaniu po autoryzacji PUSH VKES.
3. Końcowa transakcja ponownie sprawdza istniejący kod, typ, status, kierunek
   i dostępność zasobu. Serwer nie może wybrać innego opakowania zastępczego.
4. Dopiero wtedy system generuje kod nowego W/V albo składa kod nowej S,
   tworzy paczkę, zapisuje ją w kontenerze i rozlicza płatność. Konflikt
   przerywa całość i zwraca świeże `container_options`.
5. Odpowiedź sukcesu zawiera `container_id`, `container_display`,
   `container_type`, `container_created` i `packing_instruction`.
6. Zdarzenie `intake` przechowuje informację potrzebną do odtworzenia
   kontenera i instrukcji przy ponowieniu już rozliczonego PUSH.


### Wymagania utrzymania i testów

- Wspólny resolver `container_options` pozostaje bez zależności od FastAPI i
  jest używany przez warstwę Hub API oraz domenę.
- Testy muszą obejmować wspólną pulę kodów W/V, rozszerzanie kodu powyżej 32,
  ponowne używanie krótszych kodów, pomijanie puli S i globalną unikalność
  `bags.id`.
- Testy wyboru obejmują kolejność W/V/S, filtry `OPEN`, wszystkie reguły
  domyślne oraz świadomy wybór V.
- Testy przepływu V obejmują brak zmiany `BAG_STOCK`, brak fizycznego cargo,
  brak `return_bag()`, zachowanie typu przy przepakowaniu i instrukcje dla
  nowego oraz istniejącego V.
- Utrzymać atomowość dla KES, PAID, VKES/PUSH i ASSET, w tym konflikt
  równoległego nadania oraz brak częściowego kontenera lub rozliczenia.


### Źródła prawdy w kodzie

- `application/runtime/owners/container_identifiers.py`: generator W/V,
  wybor wolnego licznika, ominiecie puli S i high-water mark.
- `application/runtime/owners/hub_inventory.py`: `take_bag()` dla W oraz
  `create_virtual_bag()` dla V; operacje dolaczaja do aktywnego UoW.
- `application/runtime/owners/hub_container_allocation.py`: otwarcie W/S;
  `hub_container_storage.py` odpowiada za zawartosc i atomowe zamkniecie.
- `application/runtime/owners/container_options.py`: kolejnosc, dostepnosc
  i domyslny wybor W/V/S.
- `application/runtime/owners/parcel_submission.py` oraz
  `application/parcels/submission*.py`: typowana komenda, 14 krokow i jeden UoW.
- `application/hub/parcel_submission.py`: adapter procesu Hub API oraz
  instrukcja pakowania. `domain/hub_model.py` jest wartoscia bez I/O.
- `interfaces/runtime_composition.py` sklada wymagane zaleznosci; API maja
  osobny stan, DB path i locki. Dawne zbiorcze moduly sa usuniete.


### Zakładka „Opakowania”

Zakładka służy do kontroli fizycznego i logicznego stanu opakowań w bieżącym
hubie oraz na kierunkach sąsiadów. Nie jest drugim mechanizmem nadawania i nie
może tworzyć pustych W ani V.

#### Stan obecny

- Widok pokazuje hub centralny i bezpośrednie kierunki, zapas `BAG_STOCK`,
  skrzynki oraz liczbę opakowań W/V/S w stanach `OPEN`, `SEALED` i pozostałych.
- Drzewo grupuje opakowania jako WORKI, WIRTUALNE i SKRZYNKI. Rozwinięcie
  kontenera pokazuje paczki w środku, ich kody, trasę, wymiary i wagę.
- Dla W i S widoczne są metryki paczek, wagi i objętości oraz wskaźniki
  względem dostępnych limitów. Limit wagi i limit objętości są prezentowane
  niezależnie; `max_weight_kg=0` oznacza brak wskaźnika wagi, ale nie ukrywa
  wskaźnika objętości. Dla V widoczna jest liczba paczek, waga i objętość bez
  wskaźnika limitu.
- Operator może przełączyć `OPEN`/`SEALED` dla kontenera, jeśli przejście
  jest dozwolone przez domenę. Zmiana statusu odświeża mapę i drzewo.
- Dodawanie nowej S korzysta z listy dostępnych skrzynek dla wybranego
  kierunku. Lista jest filtrowana po kodzie, a kliknięcie lub Enter wykonuje
  otwarcie atomowo; przy równoległym użyciu system pokazuje błąd i odświeża
  listę.

#### Brakujące wymagania do domknięcia zakładki

- Ujednolicić model widoku z `container_options`, aby etykiety, statusy,
  limity i blokady w zakładce były takie same jak przy nadaniu.
- Wyraźnie rozdzielić operacje: otwieranie pustej S, zamykanie S i zmiana
  statusu transportowego W/V. Usunąć możliwość ręcznego tworzenia pustego W/V.
- Dodać jawne komunikaty przyczyn blokady: brak `BAG_STOCK`, brak skrzynek,
  istniejąca pusta S, nieprawidłowy kierunek, konflikt statusu oraz brak
  uprawnień.
- Po każdej operacji odświeżać stan źródłowego huba, kierunków, drzewa,
  licznika zapasów i opcji nadania; nie używać starego lokalnego obrazu jako
  źródła decyzji.
- Dodać testy: jedna pusta S na kierunek, wybór ACTIVE/DEGRADED, konflikt
  równoległego otwarcia, brak worków, brak pustych W, brak fizycznego
  kontenera dla V, metryki oraz obsługa wszystkich trzech `container_type`.


### Zakładka „Szukaj”

Zakładka jest wyszukiwarką operacyjną. Pole wyszukiwania nie wyszukuje
„wszystkiego naraz”: operator najpierw wybiera typ, a następnie system stosuje
reguły tego typu. Sugestie mogą pozostać na ekranie jako karty; szczegóły są
otwierane dopiero po wyborze dokładnego wyniku.

| Typ | Co wyszukuje | Zakres i wynik |
|---|---|---|
| Paczka | Kod końcowy `CODE4`, pełne `TMP-...` albo `TX-...` | Paczki końcowe są wybierane po kodzie czteroznakowym. TMP i opłacone TX są zwracane zgodnie z hubem startowym oraz statusem. Szczegóły pokazują trasę, strony, status, płatność, wymiary i historię. |
| Hub | Kod lokalny, pełna nazwa lub fragment nazwy | Zwraca aktywne huby, kierunek, sąsiadów i dane potrzebne do przejścia do szczegółów huba. |
| ID | Początek identyfikatora osoby albo pracownika | Wyszukuje aktywne `person_id` i `staff_id`; szczegóły osoby pokazują powiązane role pracownicze, bez ujawniania niepotrzebnych danych. |
| Opakowanie | Początek kodu kontenera | Wyszukuje W, V i S w rekordach `bags`, a fizyczne skrzynki, które nie są w kontenerze, także w `hub_box_inventory`. Wynik zawiera źródło, typ i status; szczegóły pokazują trasę, paczki i metryki. |
| Asset | Kod Code32, słowo z nazwy/opisu, fragment numeru seryjnego | Kod jest podstawowym identyfikatorem. Dodatkowo wyszukiwane są słowa z pól nazwa/opis oraz fragment `sn`. Szczegóły pokazują metadane assetu, hub, status i historię powiązanych paczek. |

#### Reguły wyszukiwania paczki

- Identyfikatory są normalizowane do wielkich liter i sprawdzane alfabetem
  RFC4648 Code32. Dozwolony jest myślnik tylko w prefiksie `TMP-` albo `TX-`.
- Sugestie są ograniczone limitem, sortowane stabilnie i nie mogą ujawnić
  lokalnej paczki roboczej lub opłaconego vouchera w niewłaściwym hubie.
- Dla paczki końcowej wyszukiwanie po `CODE4` zwraca najnowszy rekord dla
  tego kodu. TMP i TX zachowują pełny identyfikator techniczny.
- Karta wyniku może otworzyć szczegóły, przejść do kontenera lub powiązanej
  trasy. Operacje zmieniające stan są osobnymi akcjami: załadowanie TMP/TX
  albo anulowanie vouchera; samo wyszukiwanie i odczyt są bez skutków ubocznych.

#### Kontrakt API i brakujące prace

- Utrzymać osobne endpointy wyszukiwania i szczegółów: `/packages/search`,
  `/packages/details`, `/search/hubs`, `/search/hubs/details`, `/search/ids`,
  `/search/ids/details`, `/search/containers`, `/search/containers/details`,
  `/search/assets` i `/search/assets/details`.
- Dodać wspólny kontrakt odpowiedzi z `id`, typem wyniku, kodem wyświetlanym,
  statusem i zakresem widoczności. Szczegóły muszą korzystać z pełnego ID,
  nawet jeśli karta pokazuje skrócony kod.
- Dodać testy prefiksów, normalizacji, limitu wyników, zakresu widoczności
  TMP/TX, deduplikacji skrzynek z `bags` i `hub_box_inventory`, wyszukiwania
  assetów po kodzie/nazwie/opisie/SN oraz blokady dostępu do cudzych danych.
- Po dodaniu lub zamknięciu opakowania wynik wyszukiwania kontenera powinien
  zostać odświeżony. Zakładka „Szukaj” nie może przechowywać statusu jako
  trwałej prawdy — prawdą pozostaje odpowiedź API i domena.



### Zamykanie Workow

- **Kurier zamyka worek** poprzez rezerwacje

- Moze jechac z 1 paczka lub 50 - jego decyzja

- Jesli po rezerwacji ktos nada kolejna paczke do tego samego punktu -> dodaje do worka przed przyjazdem kuriera

- Gdy worek pelny -> sklep zamyka, otwiera nowy do tego samego kierunku



### Zarzadzanie Stanem Worka (Mapa vs Terminal)



**Zasada Rozdzielnosci Interfejsow:**



1. **Wizualizacja (Mapa/React):**

   - Stan **Aktywny (Active)** jest niezbedny i przydatny. Pozwala na wizualna kontrole "celownika" dla paczek (niebieska poswiata). Ulatwia szybka orientacje, gdzie aktualnie trafia towar.

   

2. **Terminal (CLI/Python):**

   - **BEZWZGLEDNY ZAKAZ AUTOMATYZACJI** przy wyborze pojemnika. Jesli w punkcie znajduje sie wiecej niz jedna otwarta jednostka (worek/skrzynka PKG) do tego samego celu, system **musi zapytac operatora o wybor za kazdym razem**. 

   - Automatyczny wybor "aktywnego" worka w terminalu jest niedozwolony, poniewaz drastycznie zwieksza ryzyko pomylki fizycznej (wlozenie paczki do innego worka niz wskazal system bez swiadomej decyzji czlowieka).



3. **Stan Zaplombowany (Sealed):**

   - Zaplombowanie to sygnal: **"Nie pytaj mnie wiecej o ten worek"**. 

   - System calkowicie wyklucza zaplombowane jednostki z listy wybieralnej. Zmniejsza to liczbe opcji i eliminuje ryzyko pomylkowego "dolozenia" paczki do transportu, ktory jest juz gotowy do drogi.



### Rotacja Workow

- ⚠️ **Problem do rozwiazania**

- Worki beda wielokrotnego uzytku

- Trzeba wymyslic system wymiany/zwrotu workow

- Prawdopodobnie kilka opcji + monitoring zuzycia



---



## System Kodowania i Identyfikacji



### Technologie

- **NFC tagi**: Wielokrotnego uzytku, nie zuzywaja sie

- **QR kody**: Dla osob z telefonem

- **Marker**: Glowna metoda - kod pisany markerem

- **Krotkie kody**: 2-3 literki wystarcza (np. "A47K")



### Inteligentne Wpisywanie

- System rozpoznaje kod nawet z czesciowych liter

- Jesli "QR3" to wystarczy

- Jesli kolizja -> system poprosi o wiecej liter

- Bardzo malo prawdopodobne duplikaty w jednym worku



### Urzadzenia w Sklepie

- **Podstawa**: komorka

- Mozliwosc dostarczenia lepszego sprzetu

- Skanowanie: kamera telefonu lub czytnik NFC

- ⚠️ **System lacznosci do rozwiazania** (offline/online mode)



---



## Proces Sortowania w Punkcie



### Przyjecie Przesylki od Kuriera

```

1. Kurier przywozi worek

2. Pracownik skanuje WOREK (nie zawartosc)

3. System: "Worek #347 z Punktu A, ~50 listow"

4. Kurier zwalnia sie z odpowiedzialnosci, zostawia worek, odjezdza

5. Worek czeka na przepakowanie

```



### Sortowanie - Praktyczne Zastosowanie Kierunkow



**W kazdym punkcie sortowni:**



Punkt ma **8 workow otwartych jednoczesnie** (lub mniej, jesli nie wszystkie kierunki aktywne):



```

Punkt P5 ma worki:

[1]  - Polnoc-Polnocny-Wschod (0-45°)

[2]  - Polnocny-Wschod-Wschod (45-90°)

[4]  - Wschod-Poludniowy-Wschod (90-135°)

[5]  - Poludniowy-Wschod-Poludnie (135-180°)

[7]  - Poludnie-Poludniowy-Zachod (180-225°)

[8]  - Poludniowy-Zachod-Zachod (225-270°)

[10] - Zachod-Polnocny-Zachod (270-315°)

[11] - Polnocny-Zachod-Polnoc (315-360°)

```



**Proces sortowania:**



1. Pracownik skanuje paczke

2. System pokazuje: **"WOREK [4]"**

3. Pracownik wklada do worka oznaczonego **[4]**

4. System pamieta: "paczka w worku [4], na gorze"

5. **Logistics Command Center**: System generuje jawne komendy dla pracownika Hubu, eliminujac potrzebe domyslow:

    - **[OTWORZ WOREK]**: Worek musi zostac otwarty (paczki maja rozne trasy lub dotarly do celu).

    - **[PRZESUN WOREK]**: "Przerzut" - przekladaj worek bez otwierania do kolejnego sektora.

    - **[ZMIANA KIERUNKU]**: Flaga informujaca o dynamicznej zmianie trasy przez silnik ekonomiczny.



**Etykieta worka:**

```

WOREK [4]

Kierunek: Wschod-Poludniowy-Wschod (90-135°)

Zawiera: 23 paczki

Do punktow: P7, P9, P6 (przyklad)

```



**Zamkniecie worka:**

- Kurier rezerwuje -> worek sie zamyka

- Tag NFC na worku zawiera:

  - Typ opakowania i kierunek (bez numeru worka)

  - Kierunek [4]

  - Lista paczek (ID)

  - Kod trasy kazdej paczki (np. 4.4.5)

```

1. Pracownik skanuje paczke (QR/NFC) lub wpisuje kod z markera

2. System wyswietla: "WOREK B" (informacja ogolna)

3. System pokazuje szczegoly: "2 paczki do B, 5 do D"

4. Pracownik wklada do wlasciwego worka

5. System pamieta kolejnosc pakowania (gora/dol worka)

```



### Pomoc przy Przepakowaniu

- System podpowiada: "prawdopodobnie 2 paczki na gorze worka"

- Jesli znajdzie od razu -> moze oznaczyc reszte jako "calosc, inny kierunek"

- Jesli nie znajdzie -> musi skanowac wszystkie

- **Tylko sugestia**, paczki moga sie przesunac podczas transportu



### Weryfikacja Kompletnosci

- **Nie sprawdza sie zawartosci** przy odbiorze worka (za duzo czasu)

- Braki wychodza dopiero przy przepakowaniu

- **Akceptowalne ryzyko** - paczki moga ginac

- Trzeba sie z tym liczyc w modelu biznesowym



---



## Gielda Transportowa - Mechanizm



### Jak Kurier Widzi Zlecenia

```

ðŸ“ Punkt A -> Punkt B (8 km)

ðŸ“¦ 3 paczki (lacznie 5 kg)  

ðŸ’° 250 KES



[WEZ ZLECENIE]



⬅️ Powr?t: Punkt B -> Punkt C (3 km po drodze)

ðŸ“¦ 2 paczki (3 kg)

ðŸ’° +150 KES

RAZEM: 400 KES za runde

```



### Giełda kuriera w Client App — aktualna specyfikacja



Ta sekcja opisuje aktualnie wdrożone zachowanie giełdy kuriera i ma
pierwszeństwo przed starszym, ogólnym przykładem `Punkt A -> Punkt B` powyżej.
Giełda nie jest listą wszystkich ofert związanych z hubami widocznymi na mapie.
Jej podstawą są konkretne, aktualnie obserwowane drogi.



#### Co obserwuje kurier



- Kurier obserwuje **drogi, a nie huby**. Samo pokazanie huba na mapie nie
  oznacza obserwowania wszystkich dróg, które z niego wychodzą.
- Zwykła oferta jest widoczna tylko wtedy, gdy jej bezpośrednia droga dokładnie
  pokrywa się z aktywnym i nieblokowanym odcinkiem obserwowanym przez kuriera.
- Droga jest identyfikowana bez kierunku, np. obserwowane `AA|BA` kwalifikuje
  oferty `AA -> BA` i `BA -> AA`. Kierunek pozostaje jednak częścią opisu oraz
  kierunkiem animacji.
- Sam wspólny hub dwóch różnych dróg nie kwalifikuje oferty. Obserwowanie
  `CA|AA` nie powoduje więc pokazania zwykłej oferty `AA -> BA`.
- Client API i TUI korzystają z tego samego domenowego modelu obserwacji, aby
  dla tych samych danych zwracały ten sam zbiór ofert.
- Client API zwraca pełny zbiór widocznych ofert; nie obowiązuje ukryty limit
  pierwszych 60 pozycji.



#### Zwykła droga i wirtualny przeskok



Zwykła oferta reprezentuje jeden obserwowany odcinek. Oferta przeskokowa jest
osobnym przypadkiem: tworzy wyłącznie w runtime wirtualną, bezpośrednią drogę
`from--to`, jeżeli jeden z jej końców jest głównym hubem danego sektora. Drugi
koniec staje się wtedy dynamicznym pierwszym sąsiadem tego głównego huba.



Przykład:

```text
sektor AA, obserwowana droga AA--BA:
  zwykła oferta AA--BA             -> widoczna przez dokładne pokrycie
  przeskok AA--DA przez AA--BA--DA -> widoczny jako wirtualna droga AA--DA

sektor CA, obserwowana droga CA--AA:
  zwykła oferta AA--BA             -> niewidoczna
  przeskok AA--DA                  -> niewidoczny; AA nie jest głównym hubem sektora
```



W przypadku przeskoku fizyczna trasa, np. `AA--BA--DA`, nadal opisuje rzeczywisty
przejazd. Na mapie jest rysowana zwykłymi, nieanimowanymi odcinkami. Po najechaniu
na ofertę UI tymczasowo dodaje brakujący hub i prostą linię wirtualną `AA--DA`,
a animacja biegnie wyłącznie po tej linii. Oferta `DA -> AA` korzysta z tej samej
linii, lecz animacja biegnie w przeciwnym kierunku. Po opuszczeniu wiersza oferty
mapa wraca do poprzedniego widoku. Ten podgląd jest wyłącznie wizualny: nie
zmienia topologii, ustawień mapy, obserwowanych dróg ani danych w DB.



Przy połączonych mapach każdy główny hub grupy zachowuje prawo utworzenia
własnego wirtualnego pierwszego sąsiada. Główne huby są oznaczone czerwoną
obwódką bez powiększania punktu; kolor wnętrza i litery nadal wynika z poziomu
sąsiedztwa.



#### Nadrzędna zasada: giełda jest projekcją runtime



**Źródłem prawdy jest DB, a nie stan giełdy przechowywany w pamięci.** Cała
giełda jest dynamiczną projekcją budowaną w runtime na podstawie aktualnych
danych domenowych. Nie zapisujemy do DB gotowej listy ofert, drzewa sektorów,
wyliczonych odcinków obserwowanych ani kompletnego snapshotu giełdy.



W DB muszą znajdować się wszystkie trwałe dane, od których zależy wynik, między
innymi: worki, paczki i ich przypisania, statusy i rezerwacje, trasy, huby,
drogi i blokady, konfiguracje map kurierów, ustawienia systemowe oraz aktywne
uprawnienia. Każda zmiana biznesowa wpływająca na giełdę musi najpierw zostać
poprawnie zapisana i zatwierdzona w DB. Dopiero z tych danych runtime buduje:

- aktywne sektory i obserwowane drogi,
- zwykłe oraz wirtualne drogi ofert,
- kwalifikację worków i skrzynek do ofert,
- kwoty, podsumowania zawartości i strukturę drzewa UI.



Po restarcie procesu nie odtwarzamy giełdy z zapisanego snapshotu. Runtime
zaczyna bez gotowego widoku i buduje go od nowa z bieżącego stanu DB. Dopuszczalny
cache w pamięci jest wyłącznie optymalizacją: musi być możliwy do całkowitego
usunięcia i odbudowania bez utraty danych oraz nie może stać się alternatywnym
źródłem prawdy.



Trwała rewizja rynku może być zapisana w DB wyłącznie jako licznik zmian lub
sygnał unieważnienia cache. Nie przechowuje ona wyniku giełdy. Określenie
„snapshot” używane w kontrakcie Client API oznacza tylko spójny, chwilowy widok
odpowiedzi zbudowany dla jednej rewizji — nigdy utrwaloną kopię giełdy.



Czysto wizualne stany przeglądarki, takie jak najechanie na ofertę, rozwinięcie
gałęzi drzewa lub niezapisany wybór w UI, nie są zmianami domenowymi i nie
wymagają zapisu w DB. Rezerwacja, zmiana mapy, statusu worka, paczki, huba lub
drogi jest zmianą domenową i musi przejść przez DB.



#### Atomowa zmiana i odbudowa widoku



Proces aktualizacji, który nie przekłamuje danych, ma następującą kolejność:

1. Komenda domenowa rozpoczyna jedną transakcję DB i odczytuje aktualny stan
   wymagany do walidacji.
2. Wszystkie powiązane zmiany są zapisywane atomowo. Tam, gdzie możliwy jest
   wyścig, zapis używa oczekiwanego poprzedniego stanu (CAS), np.
   `OPEN/SEALED -> RESERVED`.
3. Ta sama zatwierdzana operacja podnosi trwałą rewizję rynku — bezpośrednio
   albo przez trigger obejmujący wszystkie tabele wpływające na giełdę.
4. Dopiero po udanym `COMMIT` mechanizm SSE publikuje sygnał
   `courier_market_update`. Błąd albo rollback nie może wysłać informacji
   o zmianie, która nie istnieje w DB.
5. Runtime odczytuje po commit aktualne dane z DB i buduje nowy widok. Preferowany
   jest jeden krótki snapshot odczytowy SQLite: potrzebne rekordy oraz numer
   rewizji są pobierane w jednej transakcji odczytowej, a obliczenia wykonywane
   są następnie na tej niezmiennej kopii danych.
6. Jeżeli istniejący kod nie może jeszcze wykonać całego odczytu w jednej
   transakcji, musi odczytać rewizję przed i po budowie. Różne wartości oznaczają
   nieważny wynik, który należy odrzucić i obliczyć ponownie.



Push jest sygnałem unieważnienia widoku, a nie nośnikiem źródłowych danych
giełdy. Zdarzenie jest rejestrowane w transakcji i uwalniane przez wspólny
dispatcher dopiero po `COMMIT`. Awaria transportu nie cofa zatwierdzonej
operacji. Po reconnect lub restarcie Client App zawsze pobiera jeden pełny
widok zbudowany z DB; nie odtwarza historii nietrwałych powiadomień.



#### Dynamiczny, wersjonowany widok



`hub_view`, obserwowane drogi, oferty i stan załadunku tworzą jeden chwilowy
widok odpowiedzi oznaczony rosnącą rewizją rynku. Widok jest ponownie obliczany
między innymi po:

- zmianie centrum, skali, stanu ON/OFF lub połączenia map kuriera,
- włączeniu, wyłączeniu albo uśpieniu huba,
- zmianie dostępności lub blokady drogi,
- utworzeniu albo zmianie worka, paczki lub trasy oferty,
- rezerwacji, zwolnieniu, wygaśnięciu albo zakończeniu oferty.



Client App nie wymaga przycisku ręcznego odświeżania. Client API publikuje
zdarzenie SSE `courier_market_update`, również gdy zmiana powstała w TUI lub
innym procesie. Po zdarzeniu klient pobiera aktualny widok z DB i jednocześnie
aktualizuje mapę oraz drzewo ofert. Oferta zabrana przez innego kuriera znika
automatycznie. Klient odrzuca starsze rewizje oraz snapshot oznaczony jako
niespójny (`revision_consistent=false`) i pobiera dane ponownie. Zapisy zmian
mapy są kolejkowane, aby późna odpowiedź wcześniejszego zapisu nie cofnęła
widoku.



#### Co wyświetla giełda



Pod mapą nie ma jednej zewnętrznej karty „Oferta”. Dane są pokazane w rozwijanym
drzewie:

```text
SEKTOR -> OBSERWOWANA DROGA -> OPAKOWANIE/OFERTA -> PACZKI
```



1. **Sektor** — odpowiada jednej aktualnej grupie map. Kurier może mieć od 1 do
   3 sektorów, zależnie od liczby osobnych albo połączonych map. Nagłówek mapy ma
   postać `Sektor: AA Promien: 31,1 km : Skala: 1 kratka ~ 3.3 km`, a korzeń
   drzewa pokazuje `SEKTOR AA` oraz promień. Liczby są formatowane według ustawień
   użytkownika.
2. **Obserwowana droga** — pokazuje kierunek od głównego huba, kolor wynikający
   z poziomu sąsiedztwa, długość konkretnego odcinka w formacie
   `A-B [🛣️3,3 km]` oraz liczbę dostępnych ofert. Jeżeli występują oferty w obu
   kierunkach, pojawiają się odpowiednie gałęzie `A-B` i `B-A`.
3. **Opakowanie/oferta** — jeden wiersz odpowiada jednemu wariantowi przewozu
   konkretnego worka albo skrzynki. Wiersz nie jest przyciskiem; najechanie
   steruje podglądem trasy, a osobne kontrolki rozwijają paczki i zaznaczają
   rezerwację.
4. **Paczki** — po rozwinięciu opakowania każda paczka otrzymuje własny wiersz.



Wiersz opakowania pokazuje, od lewej do prawej:

- rzeczywisty kierunek: `B➡️A` dla zwykłej drogi albo `B⏩A` dla przeskoku,
- typ i stan opakowania bez spacji pomiędzy ikonami: `🎒🔒`, `🎒🔓`, `V🎒🔒`
  albo `🧃🔒`,
- zielony kod opakowania, np. `BEE`,
- sumę parametrów wszystkich paczek w środku w formacie
  `⚖️1,50 kg 📐0,001 m³`,
- dwa wskaźniki zapełnienia fizycznego worka lub skrzynki: wagowy `W` i
  objętościowy `V`; worek wirtualny nie ma fizycznych limitów zapełnienia,
- skrócony opis zawartości `🧾 spożywcze, elektronika`, zawierający maksymalnie
  dwa najczęściej występujące typy; remis rozstrzyga wyższy współczynnik
  wartości/ryzyka,
- skrócony opis tagów `🏷️ koperta, A4`, zawierający maksymalnie dwa
  najczęstsze tagi; przy remisie zachowywana jest kolejność danych,
- kwotę wynagrodzenia większą czcionką oraz pod nią średnią stawkę za kilometr.
  W zwartej kolumnie cenowej liczby nie powtarzają etykiet `VKES` i `VKES/km`;
  wartości oraz ewentualny bonus przeskoku oblicza backend tą samą logiką co TUI.



Rozwinięty wiersz paczki pokazuje:

```text
📦 code4   ⚖️1,50 kg 📐0,001 m³   🧾 typ zawartości   🏷️ tag
```



Wyświetlany jest krótki `code4`, a nie pełny techniczny identyfikator paczki.
Waga, objętość, typ zawartości i tag pochodzą z danych paczki; frontend nie
wyznacza ich z nazwy ani identyfikatora.



#### Wybór i rezerwacja opakowań



- Suwak przy opakowaniu zaznacza je do rezerwacji. Kurier może zaznaczyć kilka
  różnych worków lub skrzynek i zatwierdzić kontrolowaną serię rezerwacji.
- Jeżeli jeden fizyczny `bag_id` występuje jednocześnie jako wariant zwykły
  i przeskokowy, warianty są wzajemnie wykluczające: zaznaczenie jednego
  automatycznie odznacza drugi. Nie można policzyć ani zarezerwować tego samego
  fizycznego worka dwa razy.
- Push usuwa zaznaczenie oferty, która przestała być dostępna, nie naruszając
  pozostałych prawidłowych wyborów.
- Wynik częściowy jest raportowany per opakowanie; UI nie pokazuje sukcesu dla
  worka, który w międzyczasie zarezerwował inny kurier.

##### Wspólny czas przyjazdu i indywidualny czas ładowania

Grupą czasu rezerwacji jest para `(courier_id, from_hub_name)`. Wszystkie
aktywne zlecenia CJ danego kuriera odbierane z jednego huba mają wspólny
`reserved_until`. Dodanie kolejnego opakowania z tego samego huba nie może
skrócić istniejącego czasu; może go tylko wydłużyć i wtedy serwer atomowo
aktualizuje wszystkie nadal `RESERVED` CJ grupy oraz ich opakowania.

Każdy CJ zachowuje własne `reserved_until` i własne prawo do jednego
przedłużenia. Gdy jedno CJ przedłuża wspólny czas, zdarzenie
`RESERVATION_EXTENDED` należy tylko do niego; pozostałe dostają zdarzenie
`RESERVATION_GROUP_DEADLINE_SYNCED`, więc nie tracą swojego prawa.

Pierwsze `Aktywuj ładowanie` przełącza tylko wybrane CJ na `LOADING`. Pozostałe
`RESERVED` CJ tej grupy dostają trwałe `reservation_paused_at`: ich zegar
rezerwacji jest zatrzymany na `00:00` i scheduler nie może ich wygasić. Każde
następne CJ wymaga własnego kliknięcia aktywacji. Po aktywacji każdy licznik
ładowania odmierza czas od własnego eventu `LOADING`; jest to indywidualna dana
statystyczna i nie zmienia wynagrodzenia ani nie łączy CJ w jeden kontrakt.



#### Otwarte i zamknięte worki



Globalne ustawienie `system_settings.courier_market_open_bags_enabled` wybiera
jeden z dwóch trybów:

- `1` — tryb standardowy: giełda pokazuje i pozwala rezerwować worki `OPEN`
  oraz `SEALED`; otwarty worek jest automatycznie zamykany przed przejściem do
  `IN_TRANSIT`,
- `0` — tryb ograniczony: widoczne i rezerwowalne są tylko worki `SEALED`.



Rezerwacja zapamiętuje, czy worek był wcześniej `OPEN`, czy `SEALED`, dzięki
czemu anulowanie lub wygaśnięcie przywraca właściwy stan. Planowane ustawienie
indywidualne dla huba będzie w przyszłości nadpisaniem ustawienia globalnego;
nie jest częścią obecnego zachowania.



### Market Advisory (System Doradczy)



Gielda zlecen nie jest tylko pasywna lista. System aktywnie skanuje "horyzont" i ostrzega kurierow:



*   **[POCZEKAJ! Nadchodzi worek w tym samym kierunku]**: Wyswietlane, gdy silnik wykryje, ze inny kurier jest wlasnie w drodze do tego huba z paczkami w tym samym kierunku.

*   **Cel**: Zachecenie kuriera do poczekania na "doladowanie" worka, co drastycznie zwieksza jego ZYSK (bonus za konsolidacje) przy niemal tym samym koszcie paliwa.



### Agregacja Przesylek

- **System automatycznie grupuje** paczki do tego samego punktu

- Sklep pakuje je do jednego worka "dla punktu B"

- Kurier widzi wielkosc, wage, cene grupy

- Moze wziac ile chce (1 worek lub 10 workow)



### Dynamiczny Pricing

- Jesli kurier czeka -> stawka rosnie (dochodza kolejne paczki do grupy)

- **Ryzyko**: inny kurier moze zabrac zlecenie

- Kurier moze zaproponowac wlasna cene

- ⚠️ **Szczeg?ly pricingu = osobny temat**



### Express i Podbijanie Stawki

- **Bedzie opcja express** za wyzsza cene

- **Dynamiczne podbijanie**: 

  - Paczka nie rusza sie kilka dni

  - System/nadawca moze podniesc stawke

  - Nadawca moze wrocic do punktu i doplacic

  - System pomaga (nie oferuje calej stawki od razu)



### Rezerwacja

- Kurier rezerwuje zlecenie

- **Limit czasowy** (do ustalenia - 30 min? 1h?)

- Po timeout - stawka rosnie automatycznie?

- Rezerwacja zamyka worek w systemie



### Optymalizacja Tras

- System moze podpowiadac: "Po drodze punkt X, +2 paczki, +100 KES?"

- **Nawigacja/planowanie tras**: prawdopodobnie niepotrzebne

- Kurierzy znaja miasto lepiej (jezdza pod prad na autostradzie zamiast 10 km objazd)

- Wystarczy **lista paczek po kolei** zamiast mapy



---



## Proces Nadania Paczki



### Scenariusz 1: Klient Ma Telefon/Internet

```

1. Klient w domu -> Aplikacja online

2. Wpisuje: wage, gabaryty, cel, zawartosc, punkt nadania, punkt odbioru

3. System wycenia i ustala trase przez punkty posrednie

4. Klient idzie do wybranego punktu z paczka

5. Punkt przyjmuje, wazy, weryfikuje

6. Kod marker na paczce

```



### Scenariusz 2: Klient BEZ Telefonu

```

1. Klient idzie do punktu

2. Pracownik punktu wpisuje dane do systemu

3. System wycenia

4. Pracownik pisze kod markerem na paczce

5. Punkt przyjmuje paczke

```



### Routing

- **Klient wybiera**: punkt nadania (najblizszy sklep) + punkt odbioru (blisko odbiorcy)

- **System uklada trase** miedzy punktami (punkty posrednie)

- Automatyczne wyznaczanie najlepszej drogi



### Rodzaje Przesylek

- Rozne opcje nadania: szklo, wielko gabarytowe, ciezkie

- Rozne ceny w zaleznosci od typu

- System uwzglednia to w wycenie



---



## Proces Odbioru Paczki



### Standardowy Odbior

```

1. Klient przychodzi do punktu odbioru

2. Podaje kod (z markera/SMS/appki)

3. Punkt sprawdza system -> paczka jest

4. Wydaje paczke klientowi

```



### Weryfikacja

- **Kod wystarczy** do odbioru

- Brak dodatkowej weryfikacji (dowod, telefon)

- ⚠️ **Ryzyko kradziezy kodu** = akceptowalne



### "Ostatni Punkt"

- System informuje punkt: "To ostatni punkt - WYDAC KLIENTOWI"

- Blokada dalszego przepakowania

- Paczka nie moze jechac dalej

- Alert dla punktu: nie pakowac, tylko wydac



---



## Platnosci i Model "Budget-to-Zero"



System oparty jest na calkowitej transparentnosci i dystrybucji wszystkich srodkow transportowych do kurierow.



### Dystrybucja Funduszy

1.  **Cena calkowita**: Placona przez nadawce na starcie (10 KES/km + 50 KES/hub).

2.  **Reserved Hub Fees**: System rezerwuje po 50 KES dla kazdego Hubu na trasie (Przeladunki + Meta).

3.  **Transport Budget**: Pozostala kwota to czysty budzet dla kurierow.

4.  **Zasada Zero**: Kazda paczka musi miec saldo dokladnie 0.0 KES po doreczeniu.



### Oszczednosc = Bonus dla Kuriera

Jesli kurier ominie zaplanowany Hub (np. jadac bezposrednio P2->P9 zamiast P2->P4->P9), zarezerwowana oplata dla ominietego Hubu (50 KES) nie przepada, lecz jest automatycznie wyplacana kurierowi jako **Bonus za Skok (Skip Bonus)**. To motywuje kurierow do szukania najkrotszych, najsprawniejszych drog.



### Audyt i Historia

Kazda paczka posiada jawna historie transakcji, widoczna w panelu "Skanuj magazyny". Mozna sprawdzic dokladnie, ile pobral kazdy hub i kazdy kurier na kazdym etapie podrozy.



### System Optimization Profit

System sledzi oszczednosci wynikajace z optymalizacji tras (np. gdy kurier pojedzie skrotem). Nadwyzka budzetu, ktora nie zostala skonsumowana przez kilometry, jest raportowana jako zysk platformy/systemu. Pozwala to na realna ocene wydajnosci algorytmu `AssignmentEngine`.

### System Logowania Technicznego

System posiada centralna funkcje `log()`, ktora zastepuje `print()`. Pozwala to na:

- Wysylanie strukturalnych danych do frontendu bez przerywania strumienia SSE.

- Logowanie do pliku `crash.log` w przypadku awarii serwera.

- Latwe wyciszenie wszystkich komunikat?w w trybie produkcyjnym (`LOG_MODE = "silent"`).



---



### Ekonomika vs Realia Operacyjne (Debata)

Pojawia sie dylemat: czy system powinien dazyc do maksymalnej konsolidacji za wszelka cene?



1.  **Ryzyko Centralizacji**: Zbyt silne promowanie zysku z konsolidacji moze "pchac" wszystkie paczki przez jeden centralny hub (np. A1), tworzac zatory (bottlenecks). To niszczy idee sieci rozproszonej.

2.  **Ryzyko Przeladunkow**: Kazdy dodatkowy hub na trasie to statystycznie wieksza szansa na zgubienie lub uszkodzenie paczki. Skrocenie drogi (konsolidacja okrezna) moze byc ekonomicznie zyskowne, ale operacyjnie ryzykowne.

3.  **Zlota Zasada**: "Mniej rak dotyka paczki = bezpieczniejszy biznes". System musi balansowac zysk finansowy z prostota logistyczna.



### Rozwazania o "Zysku Systemu"

Wprowadzenie wskaznika **Zysku Platformy** jako KPI pozwoli na mierzenie efektywnosci, ale nie moze byc jedynym parametrem sterujacym. Algorytm musi uwzgledniac "kare za zlozonosc" (complexity penalty) dla kazdej trasy z wieloma przeladunkami.



### Krytyczne (Brak Rozwiazania)

1. **Rotacja workow** - system wymiany, zwroty, zarzadzanie opakowaniami

2. **System lacznosci** - offline/online mode, synchronizacja danych

3. **Szczegoly pricingu** - algorytmy, podwyzki, limity

4. **Platnosci** - metody, timing, kryptowaluty



### Wazne (Czesciowo Ustalone)

5. **Weryfikacja tozsamosci** przy odbiorze - czy kod wystarczy?

6. **Odpowiedzialnosc za straty** - kto placi za zginiete paczki?

7. **Limit czasowy rezerwacji** - ile kurier moze trzymac rezerwacje?



### Dodatkowe

8. **Strategia odbioru paczek od nadawcow** - wspomniany jako "osobny temat, najbardziej rozbudowany"

9. **Monitoring paczek** - jak nadawca sledzi przesylke?

10. **Obsluga reklamacji** - co gdy paczka zaginie?



---



## Kluczowe Zalozenia Filozofii Systemu



1. **Prostota > Perfekcja** - system musi dzialac mimo ograniczen

2. **Ekonomia > Szybkosc** - tansze, wolniejsze dostawy sa OK

3. **Akceptacja ryzyka** - paczki moga ginac, to koszt biznesu

4. **Samoorganizacja** - kurierzy i punkty dzialaja niezaleznie

5. **Skalowalnosc** - zaczynamy od malej sieci wokol Nairobi

6. **Lokalnosc** - kazdy punkt to przedsiebiorca zarabiajacy dodatkowo

7. **Technologia dopasowana do warunkow** - marker zamiast drukarek, NFC jako backup



---



## Nastepne Kroki Do Omowienia



Priorytetowe tematy do dalszej dyskusji:

- [ ] Rotacja workow - konkretne rozwiazania

- [ ] System lacznosci offline/online

- [ ] Szczegoly dynamicznego pricingu

- [ ] Strategia odbioru paczek (wspomniany jako "najbardziej rozbudowany")

- [ ] Model platnosci i kryptowaluty

- [ ] Monitoring i tracking przesylek



---



## System Kodowania Paczek - Szczegoly



### Filozofia Kodow

- **Dlugosc kodu nie ma znaczenia** - moze byc 20 liter

- Kod moze zawierac: kierunek, haslo odbioru, checksum, inne dane

- Pracownik NIE musi wpisywac calego kodu



### Inteligentne Wpisywanie (jak EAN-13)

```

Kod pelny: KE-NBA-WS-047-X92K-PASS789 (20 znakow)



Pracownik wpisuje: "X92K" (4 znaki)

↓

System: ✅ "Worek B" (znalazl jedna paczke)



LUB jesli kolizja:



System: ⚠️ "2 paczki: X92K-A lub X92K-B - wybierz"  

Pracownik: dodaje litere -> "X92KA"

System: ✅ "Worek B"

```



### Offline Mode

- **QR kod zawiera pelne dane**

- Aplikacja moze zdekodowac bez internetu

- Dziala jak kod kreskowy - autonomicznie

- NFC tag przechowuje wiecej danych niz QR



### Technologie

- **Marker** - glowna metoda (kod pisany markerem)

- **QR kod** - dla osob z telefonem, wiecej danych

- **NFC tag** - wielokrotnego uzytku, offline, dodatkowe dane



---



## Routing Dynamiczny - System Tras (ZAKTUALIZOWANY)



### Kluczowa Zmiana: Uniwersalny System Kierunkow



**System oparty na katach geograficznych (0-360°), nie na pozycji w siatce.**



Kazdy punkt w sieci:

- Oblicza kat do kazdego innego punktu (GPS coordinates)

- Przypisuje do 8 sektorow ([1], [2], [4], [5], [7], [8], [10], [11])

- Sortuje paczki do workow wedlug sektorow



**Uniwersalnosc:**

- Dziala na dowolnym ukladzie punktow (regularny grid, chaotyczny rozklad)

- Niezalezny od liczby punktow w sieci

- Jednoznaczny - ten sam kat = ten sam kierunek zawsze



### Struktura Sieci - Siatka 9×9 (Przyklad)



**Uklad wspolrzednych: (0,0) = dolny-lewy rog, Y rosnie na polnoc**



```

     A    B    C    D    E    F    G    H    I

   ┌────┬────┬────┬────┬────┬────┬────┬────┬────┐

 9 │    │    │ P3 │    │    │    │    │    │    │

   ├────┼────┼────┼────┼────┼────┼────┼────┼────┤

 8 │    │    │    │    │    │    │    │    │    │

   ├────┼────┼────┼────┼────┼────┼────┼────┼────┤

 7 │    │ P1 │    │    │    │    │    │    │ P7 │

   ├────┼────┼────┼────┼────┼────┼────┼────┼────┤

 6 │    │    │    │    │    │    │    │    │    │

   ├────┼────┼────┼────┼────┼────┼────┼────┼────┤

 5 │    │    │    │    │ P5 │    │    │    │    │

   ├────┼────┼────┼────┼────┼────┼────┼────┼────┤

 4 │    │    │    │    │    │    │ P9 │    │    │

   ├────┼────┼────┼────┼────┼────┼────┼────┼────┤

 3 │ P2 │    │    │    │    │    │    │    │    │

   ├────┼────┼────┼────┼────┼────┼────┼────┼────┤

 2 │    │    │    │ P4 │    │    │    │    │    │

   ├────┼────┼────┼────┼────┼────┼────┼────┼────┤

 1 │    │    │    │    │    │ P6 │    │ P8 │    │

   └────┴────┴────┴────┴────┴────┴────┴────┴────┘



P1 (B7) - Maly sklep              (7.5, 32.5)

P2 (A3) - Fryzjer                 (2.5, 12.5)

P3 (C9) - Restauracja, sredni ruch (12.5, 42.5)

P4 (D2) - Sklep spozywczy, duzy ruch (17.5, 7.5)

P5 (E5) - Sklep, BARDZO duzy ruch (22.5, 22.5)

P6 (F1) - Apteka                  (27.5, 2.5)

P7 (I7) - Sklep, sredni ruch      (42.5, 32.5)

P8 (H1) - Punkt                   (37.5, 2.5)

P9 (G4) - Sklep, sredni ruch      (32.5, 17.5)



Wspolrzedne: (x, y) w km, (0,0) = dolny-lewy rog

x = kolumna (A=2.5, B=7.5, ... I=42.5)

y = wiersz  (1=2.5, 2=7.5, ... 9=42.5)

```



### NIE MA Centralnego Hubu!

- **Plaska siec rownorzednych punktow**

- Kazdy punkt to maly sklep, restauracja, fryzjer (NIE wyspecjalizowana sortownia)

- Jesli punkt ma duzy ruch -> moze powstac drugi punkt obok (odciazenie)

- Brak hierarchii, brak "glownego HUB-a"



### System Kodow Kierunkowych - UNIWERSALNY (Oparty na Katach)



**KLUCZOWA ZMIANA:** Kierunki oparte na **katach geograficznych**, nie pozycji w siatce!



**8 kierunkow zgodnie ze wskazowkami zegara (od 0° = polnoc = 12:00):**



```

              0° (N)

              │

         \[11]│ [1]/

          ╲   │   ╱

    [10]   ╲  │  ╱   [2]

            ╲ │ ╱

270° (W) ─────┼───── 90? (E)

            ╱ │ ╲

      [8]  ╱  │  ╲   [4]

          ╱   │   ╲

         / [7]│[5] \

              │

             180° (S)

```



[1]  = 0° - 44.999...°    (0° nalezy do [1])

[2]  = 45° - 89.999...°   (45° nalezy do [2])

[4]  = 90° - 134.999...°  (90° nalezy do [4])

[5]  = 135° - 179.999...° (135° nalezy do [5])

[7]  = 180° - 224.999...° (180° nalezy do [7])

[8]  = 225° - 269.999...° (225° nalezy do [8])

[10] = 270° - 314.999...° (270° nalezy do [10])

[11] = 315° - 359.999...° (315° nalezy do [11])

```



**WAZNE:** Granica sektora nalezy do sektora "w prawo" (zgodnie ze wskazowkami zegara).

- Przyklad: 45° nalezy do sektora [2], nie [1]

- Przyklad: 90° nalezy do sektora [4], nie [2]



**Zalety tego systemu:**

- ✅ **Uniwersalny** - dziala na dowolnej siatce (3×3, 4×4, 5×5, 9×9)

- ✅ **Geograficzny** - oparty na rzeczywistych wsp?lrzednych GPS

- ✅ **Sp?jny** - ten sam kierunek zawsze oznacza ten sam kat

- ✅ **Niezalezny od ukladu punktow** - nie ma znaczenia czy siatka regularna czy chaotyczna



**Jak obliczac kierunek (uklad: (0,0)=dolny-lewy, Y rosnie na polnoc):**

```python

def oblicz_kierunek(punkt_start, punkt_cel):

    # Roznica wspolrzednych

    dx = punkt_cel.x - punkt_start.x  # wschod = dodatni

    dy = punkt_cel.y - punkt_start.y  # polnoc = dodatni (Y rosnie w gore)



    # Oblicz kat (0° = polnoc, zgodnie ze wskazowkami zegara)

    kat = atan2(dx, dy) * 180 / pi

    if kat < 0:

        kat += 360

    

    # Przypisz do sektora (granica nalezy do sektora "w prawo")

    if 0 <= kat < 45:

        return 1

    elif 45 <= kat < 90:      # 45° nalezy do [2]

        return 2

    elif 90 <= kat < 135:     # 90° nalezy do [4]

        return 4

    elif 135 <= kat < 180:    # 135° nalezy do [5]

        return 5

    elif 180 <= kat < 225:    # 180° nalezy do [7]

        return 7

    elif 225 <= kat < 270:    # 225° nalezy do [8]

        return 8

    elif 270 <= kat < 315:    # 270° nalezy do [10]

        return 10

    elif 315 <= kat < 360:    # 315° nalezy do [11]

        return 11

```



### Przyklady Zastosowania - Siatka 9×9 (Pole 5×5 km)



**Setup:** Kazde pole = 5km × 5km, punkt w srodku pola, **(0,0) = dolny-lewy rog**



```

     A    B    C    D    E    F    G    H    I

   ┌────┬────┬────┬────┬────┬────┬────┬────┬────┐

 9 │    │    │ P3 │    │    │    │    │    │    │  P3: (12.5, 42.5)

   ├────┼────┼────┼────┼────┼────┼────┼────┼────┤

 7 │    │ P1 │    │    │    │    │    │    │ P7 │  P1: (7.5, 32.5), P7: (42.5, 32.5)

   ├────┼────┼────┼────┼────┼────┼────┼────┼────┤

 5 │    │    │    │    │ P5 │    │    │    │    │  P5: (22.5, 22.5)

   ├────┼────┼────┼────┼────┼────┼────┼────┼────┤

 4 │    │    │    │    │    │    │ P9 │    │    │  P9: (32.5, 17.5)

   ├────┼────┼────┼────┼────┼────┼────┼────┼────┤

 3 │ P2 │    │    │    │    │    │    │    │    │  P2: (2.5, 12.5)

   ├────┼────┼────┼────┼────┼────┼────┼────┼────┤

 2 │    │    │    │ P4 │    │    │    │    │    │  P4: (17.5, 7.5)

   ├────┼────┼────┼────┼────┼────┼────┼────┼────┤

 1 │    │    │    │    │    │ P6 │    │ P8 │    │  P6: (27.5, 2.5), P8: (37.5, 2.5)

   └────┴────┴────┴────┴────┴────┴────┴────┴────┘



Wspolrzedne: (x, y) w km, (0,0) = dolny-lewy rog, Y rosnie na polnoc

```



---



### Przyklady Obliczania Kierunkow



**Wzor na kat (uklad: (0,0) = dolny-lewy, Y rosnie na polnoc):**

```

Î”x = cel.x - start.x  (wschod dodatni, zachod ujemny)

Î”y = cel.y - start.y  (polnoc dodatnia, poludnie ujemne)

kat = atan2(Î”x, Î”y) w stopniach (0° = polnoc, zgodnie ze wskazowkami zegara)

```



---



**Przyklad 1: P7 -> P5**

```

Start: P7 (42.5, 32.5)

Cel:   P5 (22.5, 22.5)



Î”x = 22.5 - 42.5 = -20.0 km (zachod)

Î”y = 22.5 - 32.5 = -10.0 km (poludnie)



Dystans = √(400 + 100) = 22.4 km



Kat = atan2(-20, -10) ≈ 243.4?

243.4° miesci sie w 225° - 269.999...°



Kierunek: [8] ✅ (zach?d-poludniowy-zachod)

```



---



**Przyklad 2: P1 -> P7**

```

Start: P1 (7.5, 32.5)

Cel:   P7 (42.5, 32.5)



Î”x = 42.5 - 7.5 = +35.0 km (wschod)

Î”y = 32.5 - 32.5 = 0 km



Dystans = 35.0 km



Kat = atan2(35, 0) = 90.0°

90° nalezy do [4] (90° - 134.999...°)



Kierunek: [4] ✅

```



---



**Przyklad 3: P7 -> P4**

```

Start: P7 (42.5, 32.5)

Cel:   P4 (17.5, 7.5)



Î”x = 17.5 - 42.5 = -25.0 km (zachod)

Î”y = 7.5 - 32.5 = -25.0 km (poludnie)



Dystans = √(625 + 625) = 35.4 km



Kat = atan2(-25, -25) = 225.0°

225° nalezy do [8] (225° - 269.999...°)



Kierunek: [8] ✅

```



---



**Przyklad 4: P6 -> P8**

```

Start: P6 (27.5, 2.5)

Cel:   P8 (37.5, 2.5)



Î”x = 37.5 - 27.5 = +10.0 km (wschod)

Î”y = 2.5 - 2.5 = 0 km



Dystans = 10.0 km



Kat = atan2(10, 0) = 90.0°

90° nalezy do [4]



Kierunek: [4] ✅

```



---



**Przyklad 5: P8 -> P6**

```

Start: P8 (37.5, 2.5)

Cel:   P6 (27.5, 2.5)



Î”x = 27.5 - 37.5 = -10.0 km (zachod)

Î”y = 2.5 - 2.5 = 0 km



Dystans = 10.0 km



Kat = atan2(-10, 0) = 270.0°

270° nalezy do [10] (270° - 314.999...°)



Kierunek: [10] ✅

```



---



### Pelne Trasy - Przyklady



**Trasa 1: P1 -> P8**

```

Mozliwa trasa: P1 -> P5 -> P9 -> P8



P1 (7.5, 32.5) -> P5 (22.5, 22.5):

  Î”x = +15, Î”y = -10

  Kat ≈ 123.7? -> Kierunek [4]



P5 (22.5, 22.5) -> P9 (32.5, 17.5):

  Î”x = +10, Î”y = -5

  Kat ≈ 116.6? -> Kierunek [4]



P9 (32.5, 17.5) -> P8 (37.5, 2.5):

  Î”x = +5, Î”y = -15

  Kat ≈ 161.6? -> Kierunek [5]



KOD TRASY: 4.4.5

```



---



**Trasa 2: P8 -> P6 -> P4 -> P2**

```

P8 (37.5, 2.5) -> P6 (27.5, 2.5):

  Î”x = -10, Î”y = 0

  Kat = 270° -> Kierunek [10]



P6 (27.5, 2.5) -> P4 (17.5, 7.5):

  Î”x = -10, Î”y = +5

  Kat ≈ 296.6? -> Kierunek [10]



P4 (17.5, 7.5) -> P2 (2.5, 12.5):

  Î”x = -15, Î”y = +5

  Kat ≈ 288.4? -> Kierunek [10]



KOD TRASY: 10.10.10

```



---



### Jak System Uzywa Kodow Tras



**1. Sortowanie w punkcie nadania (P1):**

```

Paczka #123: P1 -> P8

System oblicza trase: P1->P5->P9->P8, kod: 4.4.5

P1 sortuje do worka [4] (pierwszy kod w trasie)

```



**2. Przepakowanie w punkcie posrednim (P5):**

```

Worek trafia do P5

P5 skanuje paczke #123

Kod trasy: 4.4.5

P5 patrzy na drugi kod: [4]

P5 pakuje do worka [4] (do P9)

```



**3. Ostatni punkt przed celem (P9):**

```

Worek trafia do P9

P9 skanuje paczke #123

Kod trasy: 4.4.5

P9 patrzy na trzeci kod: [5]

P9 pakuje do worka [5] (do P8 - cel koncowy)

```



### Przyklad Tras: P1 -> P6



**Trasa 1: P1 -> P5 -> P9 -> P6**

```

KOD TRASY: 4.4.7



P1 (B7) sortuje:

- Kierunek [4] (wschod-poludniowy-wschod wzgledem P1) -> worek do P5



P5 (E5) sortuje:

- Kierunek [4] (wschod-poludniowy-wschod wzgledem P5) -> worek do P9



P9 (G4) sortuje:

- Kierunek [7] (poludnie-poludniowy-zachod wzgledem P9) -> worek do P6

```



**Trasa 2: P1 -> P2 -> P4 -> P6**

```

KOD TRASY: 7.4.4



P1 (B7) -> P2 (A3): kierunek [7] (poludnie-poludniowy-zachod)

P2 (A3) -> P4 (D2): kierunek [4] (wschod-poludniowy-wschod)

P4 (D2) -> P6 (F1): kierunek [4] (wschod-poludniowy-wschod)

```



### Algorytm Routingu - Optymalizacja Dynamiczna



System **NIE wybiera tylko najkrotszej** trasy, ale optymalizuje wedlug wielu czynnikow:



```

Czynniki uwzgledniane:



1. Odleglosc (bazowa - algorytmy najkrotszej sciezki)

2. Obciazenie punktow (P5 przeciazony 200 paczkami? -> omin)

3. Dostepnosc kurierow (brak kurierow na P1->P5? -> wybierz P1->P2)

4. Laczenie przesylek (w P9 czeka paczka z P7->P6? -> jedz przez P9, oplacalne)

5. Koszty transportu (ktora trasa tansza)

6. Czas oczekiwania (P2 szybko sortuje vs P5 wolno)

7. Niezawodnosc (rating punktow - czy gubia paczki?)

8. Sytuacje losowe (nie pogoda w Kenii - zawsze slonce, ale np. parada, wypadek)

```



### Dynamiczna Zmiana Tras



**System moze zmienic trase w trakcie:**



```

Poczatkowy plan:

P1 -> P5 -> P9 -> P6 (4.4.7)

Koszt: 300 KES, Czas: 2 dni



System dostaje update:

- P5 przeciazony (200 paczek czeka)

- W P9 dodatkowa paczka z P7->P6 (oplaca sie laczyc)



Nowy plan moze byc:

A) P1 -> P2 -> P4 -> P6 (7.4.4) - jesli P5 zbyt wolny

B) Zachowac 4.4.7 - jesli laczenie w P9 daje oszczednosc

```



**WAZNE: Koszt dla nadawcy juz nie ulega zmianie!**

- Nadawca placi ustalona cene przy nadaniu

- System moze zmienic trase by zoptymalizowac koszty wewnetrzne

- Nadawca widzi tylko aktualna trase paczki (tracking)



### Zmiana Trasy - Gdzie i Kiedy?



**Przepakowanie raczej ODPADA:**

- Za duzo pracy

- Kazde otwarcie worka = mozliwy blad (ludzie, nie maszyny)

- Zmiany nastepuja dynamicznie **w nastepnym hubie** gdzie i tak jest przepakowanie



**Minimalizacja przepakowan = priorytet!**



---



## Inteligentne Pakowanie Workow - Optymalizacja Pracy



### Problem: Zbedne Przepakowania



**Scenariusz typowy (ZLE):**

```

P1 ma 10 paczek do P6, wszystkie trasa 4.4.7



P1 pakuje -> Worek [4] (10 paczek)

↓

P5 dostaje worek [4]

-> OTWIERA

-> Wszystkie paczki maja kod [4] (dalej do P9)

-> PRZEPAKOWUJE do nowego worka [4]

= ZBEDNA PRACA!

```



### Rozwiazanie: Pakowanie z Przewidywaniem



**Tag NFC na worku zawiera pelna trase:**

```

Worek ID: #W12345

Trasa: P1 -> P5 -> P9 -> P6

Kod trasy: 4.4.7

Nastepny przystanek: P5

Kod dla nastepnego: [4] (do P9)

Zawartosc: 10 paczek (lista ID)

```



**P5 skanuje worek:**

```

System: "Worek 4.4.7, nastepny kod: [4] (do P9)"

-> NIE OTWIERAJ

-> Przekladaj caly worek do kuriera P5->P9

```



**P9 skanuje worek:**

```

System: "Worek 4.4.7, kod zmienia sie na [7] (do P6)"

-> MUSI OTWORZYC (kod sie zmienia)

-> Przepakuj do worka [7]

```



### Regula: Dziel Worki Wczesniej TYLKO Gdy Oszczedzasz Prace



**Scenariusz 1: Oplaca sie dzielic wczesniej**

```

P1 ma paczki do P6:

- 98 paczek: trasa 4.4.7 (P1->P5->P9->P6)

- 50 paczek: trasa 4.2.7 (P1->P5->P7->P6)



Analiza:

- Obie grupy zaczynaja [4] z P1 (do P5)

- W P5 sie rozchodza (kod [4] do P9 vs [2] do P7)

- Grupa B duza (50 paczek = pelny worek)



Decyzja P1:

-> Pakuj 2 worki: "4.4" (98) i "4.2" (50)



P5 dostaje 2 worki:

-> NIE otwiera zadnego

-> Przeklada "4.4" dalej (do P9)

-> Przeklada "4.2" dalej (do P7)

= OSZCZEDNOSC PRACY

```



**Scenariusz 2: NIE dziel - nie ma sensu**

```

P1 ma paczki do P6:

- 98 paczek: trasa 4.4.7

- 2 paczki: trasa 4.2.7



Analiza:

- Grupa B mala (2 paczki = prawie pusty worek)

- Transport 2 workow zamiast 1 = drozej

- P5 i tak musi otworzyc (kody sie rozchodza)



Decyzja P1:

-> Pakuj 1 worek: [4] (100 paczek razem)



P5 dostaje 1 worek:

-> Otwiera (musi, kody sie rozchodza)

-> Dzieli na "4.4" (98) i "4.2" (2)

= P5 robi prace, ale oszczedzamy transport

```



### Prog Decyzyjny - Kiedy Dzielic?



**System dzieli worki wczesniej tylko gdy spelnione WSZYSTKIE warunki:**



```

WARUNEK 1: Mniejsza grupa ≥ X paczek (pr?g: 10-25 paczek?)

WARUNEK 2: Tworzy co najmniej pol-pelny worek (>50% pojemnosci)

WARUNEK 3: Oszczedza prace w nastepnym punkcie (punkt nie musi otwierac)



Przyklad TAK:

- Grupa A: 98 paczek (pelny worek)

- Grupa B: 50 paczek (pelny worek)

-> DZIEL ✅ (P5 nie musi otwierac)



Przyklad NIE:

- Grupa A: 98 paczek  

- Grupa B: 5 paczek (1/10 worka)

-> NIE DZIEL ❌ (transport 2 work?w drozszy niz praca P5)

```



### Sytuacja Mieszana - Wiele Tras



**Przyklad zlozony:**

```

P1 ma do roznych celow:

- 60 paczek: 4.4.7 (rozchodza sie w P9 -> P6)

- 30 paczek: 4.4.8 (rozchodza sie w P9 -> P4)

- 20 paczek: 4.2.7 (rozchodza sie w P5 -> P7)



Opcje pakowania:



A) 3 worki: "4.4.7", "4.4.8", "4.2"

   -> Zbyt rozdrobnione, drogi transport



B) 2 worki: "4.4" (90 paczek), "4.2" (20)

   -> P5 przeklada oba bez otwierania

   -> P9 otwiera "4.4", dzieli na [7] i [8]

   -> OPTYMALNE ✅



C) 1 worek: [4] (110 paczek)

   -> P5 musi otworzyc, dzielic

   -> Wiecej pracy

   -> Tylko jesli grupa "4.2" < 10 paczek

```



**Zasada ogolna:**

Dziel na poziomie **pierwszego punktu rozbieznosci**, ale tylko jesli obie grupy wystarczajaco duze (>10-25 paczek).



### Dynamiczna Zmiana vs Zamkniete Worki



**Pytanie:** Co jesli P1 zaplanowal worek "4.4.7", ale w P5 system zmienia trase na "4.2.7"?



```

Worek juz zamkniety, w transporcie:

-> Jedzie dalej do P5 wedlug planu



P5 skanuje worek:

-> System: "ZMIANA TRASY - przekieruj do worka [2], nie [4]"

-> P5 musi otworzyc, przepakowac do [2]

-> Nie da sie uniknac

```



**Ale:** System minimalizuje takie sytuacje:

- Zmiana tras dopiero w nastepnym punkcie (nie w trakcie transportu)

- Jesli worek zamkniety -> raczej nie zmieniac (chyba ze awaria punktu)



### Kluczowa Filozofia



> **"Dziel tylko gdy oszczedzasz prace, nie gdy tworzysz dodatkowa"**



- Kazde otwarcie worka = ryzyko bledu

- Ludzie sortuja, nie maszyny -> minimalizuj przepakowania

- Lepiej 1 worek z mieszanka niz 2 prawie puste worki

- Dziel tylko gdy OBE grupy uzasadniaja osobny worek



---



## System Aukcji i Pricingu - Szczegoly (Do Dopracowania)



### Podstawowe Zasady



**Gielda Transportowa:**

- Kurierzy widza zlecenia w swoim rejonie

- Widoczne: punkt A->B, liczba paczek, waga, gabaryty, cena

- Moga czekac (stawka rosnie) lub brac od razu

- Ryzyko: inny kurier zabierze



**Dynamiczny Pricing:**

- System uczy sie z historii ("za ile jezdza na trasie A->B")

- Cena startowa dostosowana do: pory dnia, dnia tygodnia, liczby kurierow, popytu

- BRAK podzialu standard/priority - wszystkie rowne, rozne ceny



### Agregacja i Margines



**Przyklad budowania zlecenia:**

```

Paczka 1 do worka A->B: wartosc 100 KES

Paczka 2 dochodzi: wartosc 80 KES

Paczka 3 dochodzi: wartosc 120 KES

...

5 paczek razem: wartosc 500 KES



System wystawia dla kurierow: 450 KES

Margines: 50 KES (na negocjacje + prowizja systemu)

```



**UWAGA:** Ceny paczek rozne (od gabarytow, nie stale po 100 KES)



**Dodanie kolejnej paczki:**

```

Paczka 6 dochodzi: wartosc 100 KES

System NIE dodaje calych +100 do oferty kurierskiej

Dodaje tylko +20 -> zlecenie = 470 KES

Margines wzrasta do 130 KES

```



### Aukcja - Mechanizm (DO DOPRACOWANIA)



**Podstawowy Flow:**

```

1. System wystawia: 450 KES

2. Kurierzy obserwuja

3. Nikt nie bierze -> po czasie system dodaje +30 -> 480 KES

4. "AUKCJA OTWARTA - 10 minut"

5. Kurier A: "Wezme za 420 KES" ← WSZYSCY WIDZA

6. Czekamy 10 minut...

   - Nikt nie da mniej -> Kurier A WYGRYWA

   - Kurier B: "Wezme za 400 KES" -> Reset timera, kolejne 10 min

```



**Transparentna licytacja w dol (aukcja holenderska)**



### Podbijanie Stawki przez Nadawce



**Paczka nie rusza sie:**

```

Dzien 1: Stawka 450 KES, nikt nie bierze

Dzien 2: System wysyla alert do nadawcy:

  "Twoja paczka nie ruszyla

  Obecna stawka: 480 KES

  Doplac 50 KES -> dostawa szybciej?"



Nadawca doplaca +100 KES

System MOZE dodac tylko czesc (np. +50) do oferty kurierskiej

Reszta (+50) = prowizja/rezerwa na deficytowe trasy

```



**Nadawca ZAWSZE moze podbic cene** - nie odmawiamy pieniedzy!



### Express i Deficytowe Przejazdy



**Express:**

- Bedzie opcja za wyzsza cene

- Gwarantuje szybsza dostawe

- Szczegoly: DO USTALENIA



**Deficytowe trasy (ubocze, malo kurierow):**

```

Punkt Z na uboczu

Kurier chce: 800 KES

Nadawca zaplacil: 500 KES

System doplaca: 300 KES z puli prowizji



Ale: trzeba limitowac, zeby nie wypalic rezerw

```



**Dynamiczna prowizja (pomysl):**

```

Ruchliwa trasa (CBD->Westlands): 5% prowizji (sama sie kreci)

Trudna trasa (Nairobi->ubocze): 0% lub doplata (subsydiujemy)

```



### Balansowanie Szans Kurierow - KRYTYCZNE



**Problem:** Jeden kurier zabiera wszystko, inni gloduja



**Pomysly na rozwiazanie:**



1. **Soft Limit (miekkie ograniczenie)**

   - Kurier z 10+ zleceniami -> jego oferty widoczne z opoznieniem 5 min

   - Daje szanse innym

   - Ale jesli nikt nie wezmie -> on moze



2. **Rating Boost dla Nowych**

   - Nowy kurier (0-10 paczek): +50 pkt

   - Sredni (11-50): normalnie

   - Doswiadczony (50+): -20 pkt

   - Przy rownej cenie -> wyzszy rating wygrywa



3. **Kolejki Rotacyjne**

   - Pool A: kurierzy <5 paczek dzis (priorytet)

   - Pool B: wszyscy (otwarte po 10 min)



4. **Daily Cap**

   - Max 20 zlecen/dzien

   - Po 20 -> nadal moze, ale bez priorytetu



5. **Dynamic Handicap**

   - Kurier z 15 paczkami -> automatycznie +5% do oferty

   - Mniej atrakcyjny, ale moze wygrac



**WAZNE:** Zamiast kar -> bonusy dla slabszych

- Nie ograniczaj topowych (niesprawiedliwe)

- Pomagaj slabszym (rating boost, wczesniejszy dostep)



**NA POCZATKU:** Kod z wieloma zmiennymi do zarzadzania balansem

**Z CZASEM:** System ureguluje sie sam (uczenie maszynowe)



### Rezerwacja i Priorytety



**Rezerwacja:**

- Kurier rezerwuje zlecenie

- Zamyka worek w systemie

- Ma ustalony czas dojazdu (lub ustala sam)

- Po timeout (nie dotarl) -> aukcja od nowa



**Priorytet po rezerwacji - Niespodzianki:**

```

Kurier zarezerwowal, jedzie (10 min)

Nowa paczka A->B dochodzi



System:

-> Automatycznie dodaje do jego zlecenia

-> Kurier dostaje powiadomienie

-> Moze odmowic TYLKO z przyczyn technicznych (brak miejsca na motocyklu)

-> Jesli odmowi -> nowe zlecenie na te paczke

```



**Kto by odmowil?** Jak i tak jedzie, dodatkowa paczka = wiecej kasy



### Timing Aukcji - Adaptacyjny



**WAZNE: To NIE jest system minutowy!**



```

Ruchliwy punkt (CBD, centrum):

-> Aukcje co 30-60 minut

-> Szybka rotacja paczek

-> Duzo kurierow



Spokojny punkt (przedmiescia, ubocze):

-> Aukcje co kilka godzin

-> Wolna rotacja

-> Malo kurierow



System dostosowuje timing do ruchu w sortowni

```



### Algorytm Uczenia (DO OPRACOWANIA)



System sledzi i uczy sie:

- Historia akceptowanych ofert (za ile brali trase A->B)

- Pora dnia (rano korki = drozej)

- Dzien tygodnia (weekend = mniej kurierow?)

- Liczba aktywnych kurierow (podaz)

- Liczba oczekujacych paczek (popyt)

- ~~Pogoda~~ (w Kenii zawsze slonce ☀️)

- Sytuacje losowe (parada, wypadek, etc.)



**Przyklad:**

```

Trasa A->B:

- Normalnie: 400 KES (nauczony)

- Piatek rano (payday + korki): 550 KES

- Niedziela pogodnie: 300 KES

```



### Elementy Do Dopracowania



⚠️ **Wymagaja dalszej dyskusji:**



1. Dokladny mechanizm aukcji (kto wygrywa, kiedy, jak)

2. Algorytm marginesu (ile zostawic na negocjacje)

3. Prog dzielenia workow (10? 25 paczek?)

4. Timeout rezerwacji (30 min? 1h?)

5. Kolizja ofert (2 kurierow ta sama cena -> rating? losowo?)

6. Limit przelicytowan (nie chcemy walki o 1 KES)

7. Prowizja systemu (kiedy, ile, dynamiczna?)

8. Subsydiowanie deficytowych tras (ile, jak dlugo?)



---



---



## WSZYSTKIE ZALEZNOSCI SYSTEMU - LISTA KOMPLEKSOWA



### 1. ROUTING - Parametry i Algorytm



**Czynniki oceny trasy (WSZYSTKIE brane pod uwage):**



| Parametr | Opis | Waga (do ustalenia) | Uwagi |

|----------|------|---------------------|-------|

| Dystans | Odleglosc fizyczna w km | 0.3? | Krotsza = lepsza |

| Przesiadki | Liczba punktow posrednich | 0.2? | Kazde = ryzyko bledu |

| Obciazenie | Czy punkty przeciazone | 0.2? | >100 paczek = problem |

| Kurierzy | Dostepnosc na trasie | 0.15? | Brak = czekanie |

| Rating | Niezawodnosc punktow | 0.1? | Historia bledow |

| Czas | Sredni czas sortowania | 0.05? | Szybsze = lepsze |

| Laczenie | Inne paczki w kierunku | bonus | Ekonomia |



**Zmiana tras - warunki:**

- Nowa paczka nadana w "okolicy" (DO ZDEFINIOWANIA: region? promien? kierunek?)

- Paczka na polnocy NIE wplywa na poludnie

- Czestotliwosc: DO USTALENIA (co minute? przy zapelnieniu? przy rezerwacji?)



**Regiony (izolacja zmian) - DO USTALENIA:**

- Polnoc (1-3), Centrum (4-6), Poludnie (7-9)?

- Dynamiczne granice?



### 2. PUNKTY - Dodawanie, Zamykanie, Obciazenie



**Dodawanie punktow:**

- Spontaniczne (sklepy aplikuja)

- Strategiczne (system rekomenduje na podstawie: ruch, dystans, czas dostawy)

- Zageszczenie (przy duzym ruchu powstaja dodatkowe obok)



**Pytania DO USTALENIA:**

- Jak dzielic obciazenie miedzy sasiednie punkty?

- Czy automatycznie wlaczac do routingu?

- Jak szybko aktywowac nowe punkty?



**Zamykanie punktow (awaria):**



Przypadek 1: Paczka JUZ w zamknietym punkcie

- OPCJA A: Przekierowanie awaryjne (kurier zabiera do innego)

- OPCJA B: Czekanie (worek zostaje, alert nadawcy)

- DO USTALENIA: Ktora? Jak dlugo czekac?



Przypadek 2: Paczka PLANOWANA przez zamkniety

- Automatyczne przeliczenie trasy (omija punkt)



**Detekcja zamkniecia - DO USTALENIA:**

- Ping co X minut?

- Punkt sam zglasza?

- Jak szybko reagowac?



### 3. PAKOWANIE WORKOW - Logika Dzielenia



**Zasada:** Dziel tylko gdy oszczedzasz prace, nie gdy tworzysz dodatkowa



**Warunki dzielenia:**

```

IF (punkt_rozbieznosci ISTNIEJE)

   AND (grupa_A >= prog_min)  // prog DO USTALENIA: 10? 25 paczek?

   AND (grupa_B >= prog_min)

   AND (oszczednosc_pracy > koszt_transportu_2_workow)

THEN dziel worki

ELSE pakuj razem

```



**Przypadki:**

- 98 + 50 paczek -> DZIEL (oba pelne worki)

- 98 + 5 paczek -> NIE DZIEL (5 to za malo)

- 60 + 30 + 20 paczek -> Pakuj do poziomu pierwszej rozbieznosci



**DO USTALENIA:**

- Minimalny prog dla osobnego worka (paczki)

- Czy system moze zmieniac trasy zamknietych workow?

- Jak weryfikowac worki bez otwierania?



### 4. KOSZTY I EKONOMIA



**Dla nadawcy:**

- Cena ustalana przy nadaniu = STALA (nie zmienia sie przy zmianie trasy)

- Widzi tylko orientacyjna trase



**Dla systemu:**

```

Nadawca placi: 500 KES



Podzial (przyklad):

P1->P5: 200 KES (kurier)

P5->P9: 150 KES (kurier)

P9->P6: 100 KES (kurier)

Razem kurierzy: 450 KES



Prowizja systemu: 50 KES (10%?)

```



**DO USTALENIA:**

- % prowizji systemu

- Czy prowizja dynamiczna? (ruchliwe vs deficytowe trasy)

- Jak dzielic koszt miedzy odcinki? (rowno? proporcjonalnie?)



**Deficytowe trasy:**

```

Kurier chce: 800 KES

Nadawca zaplacil: 500 KES

System doplaca: 300 KES z puli prowizji

```



**DO USTALENIA:**

- Limity subsydiowania

- Jak dlugo mozna doplacac?

- Ktore trasy priorytetowo?



### 5. PRZEPAKOWANIA - Minimalizacja



**Problem:** Kazde otwarcie worka = ryzyko bledu (ludzie, nie maszyny)



**Rozwiazanie:** Tagi NFC na workach

```

Worek #W123:

- Cel: P6

- Trasa: P1->P5->P9->P6

- Kod: 4.4.7

- Otworzyc w: P9 (dopiero tam!)

- Zawartosc: 15 paczek (lista ID)



P5 skanuje -> "Przekladaj dalej, nie otwieraj"

```



**DO USTALENIA:**

- Czy kazdy punkt musi przeladowac?

- Czy kurier moze pominac punkt posredni?

- Jak weryfikowac zamkniete worki?



### 6. AUKCJE I PRICING (czesciowo ustalone)



**Gielda transportowa:**

- Kurierzy widza: punkt A->B, paczki, waga, cena

- Moga czekac (stawka rosnie) lub brac od razu

- Transparentna licytacja w dol



**Margines:**

```

5 paczek = 500 KES wartosci

System oferuje: 450 KES

Margines: 50 KES (negocjacje + prowizja)



Paczka 6 dochodzi (100 KES)

System dodaje: +20 KES (nie +100)

Margines rosnie: 130 KES

```



**DO DOPRACOWANIA:**

- Dokladny mechanizm aukcji (kto wygrywa, kiedy)

- Algorytm marginesu (ile zostawic)

- Timeout rezerwacji (30 min? 1h?)

- Kolizja ofert (2 kurierow ta sama cena)

- Balansowanie szans (zeby nie jeden zabieral wszystko)



**Timing - ADAPTACYJNY:**

- Ruchliwy punkt: aukcje co 30-60 min

- Spokojny punkt: co kilka godzin

- NIE jest to system minutowy!



**Uczenie sie:**

- Historia ofert (za ile jezdzili)

- Pora dnia/tydzien

- Liczba kurierow (podaz)

- Liczba paczek (popyt)



### 7. REZERWACJE I PRIORYTETY



**Rezerwacja:**

- Kurier rezerwuje -> zamyka worek

- Ma czas dojazdu (ustala lub system)

- Po timeout -> aukcja od nowa



**Niespodzianki (dodatkowe paczki):**

```

Kurier jedzie, nowa paczka ten sam kierunek

-> Automatycznie dodana

-> Moze odmowic TYLKO z przyczyn technicznych (brak miejsca)

```



### 8. TECHNOLOGIA I OFFLINE MODE



**Kody:**

- Marker (glowna metoda)

- QR kod (zawiera pelne dane, offline)

- NFC tag (wielokrotny uzytek, wiecej danych)



**Inteligentne wpisywanie:**

- Kod pelny: 20 znakow

- Pracownik: wpisuje 4 znaki

- System: rozpoznaje (lub pyta o wiecej przy kolizji)



**Offline:**

- QR/NFC zawieraja pelne dane

- Aplikacja dziala bez internetu

- Synchronizacja gdy dostepna



**Urzadzenia w sklepie:**

- Podstawa: komorka

- Mozliwosc dostarczenia lepszych

- DO USTALENIA: wymogi offline/online



---



## PELNA LISTA PYTAN DO ROZSTRZYGNIECIA



### PRIORYTET 1 - Routing i Symulacja

1. [ ] Wartosci wag dla 7 parametrow oceny trasy (0.3, 0.2, 0.15...)

2. [ ] Definicja "okolicy" (region/promien/kierunek)

3. [ ] Czestotliwosc przeliczania tras

4. [ ] Podzial na regiony izolacji



### PRIORYTET 2 - Pakowanie

5. [ ] Minimalny prog dla osobnego worka (10? 25 paczek?)

6. [ ] Algorytm decyzji dzielenia (dokladny)

7. [ ] Czy zmiana tras zamknietych workow mozliwa?



### PRIORYTET 3 - Punkty

8. [ ] Dzielenie obciazenia miedzy sasiednie

9. [ ] Reakcja na zamkniecie (czekac/przekierowac/ile)

10. [ ] Szybkosc detekcji awarii

11. [ ] Kryteria strategicznych lokalizacji



### PRIORYTET 4 - Ekonomia

12. [ ] % prowizji systemu (staly/dynamiczny)

13. [ ] Podzial kosztu miedzy odcinki

14. [ ] Limity subsydiowania deficytowych

15. [ ] Czy prowizja rosnie przy doplatach nadawcy



### PRIORYTET 5 - Aukcje (szczegoly)

16. [ ] Mechanizm wygrywania (pierwszy/najlepszy rating/czas)

17. [ ] Timeout rezerwacji

18. [ ] Rozwiazanie kolizji ofert

19. [ ] System balansowania szans kurierow

20. [ ] Limit przelicytowan



### PRIORYTET 6 - Techniczne

21. [ ] Czy punkty zawsze musza przeladowywac?

22. [ ] Czy kurierzy moga pomijac punkty?

23. [ ] Weryfikacja zamknietych workow

24. [ ] Wymogi offline/online mode



---



*OSTATNIA AKTUALIZACJA: 2026-02-25 (Faza PoC zintegrowana)*



---



# WDROZONA DOKUMENTACJA TECHNICZNA (PoC 2026)



Ponizsza sekcja dokumentuje finalne zmiany w logice routingu, ekonomii i monitoringu, ktore zostaly zaimplementowane i przetestowane w symulacji `courier_logic_poc.py`. Dokumentacja ta pozwala na odtworzenie projektu od zera.



## 1. Topologia Sieci: Zasada Wzajemnej Widocznosci (MNN)



Aby wyeliminowac nierealistyczne "skroty" i wymusic naturalny przeplyw przez siec hubow, wprowadzono rygorystyczna zasade **Mutual Nearest Neighbor**.



### Algorytm Polaczen:

Hub A laczy sie z Hubem B **tylko wtedy**, gdy:

1. Hub B jest najblizszym sasiadem Hubu A w danym sektorze katowym.

2. **ORAZ** Hub A jest najblizszym sasiadem Hubu B w sektorze przeciwleglym.



**Efekt:** Siec jest rzadsza, ale bardziej spojna. Trasy dlugodystansowe (np. P2 -> P7) nie przeskakuja juz punktow, lecz ukladaja sie w logiczne lancuchy (P2 -> P10 -> P5 -> P7).



---



## 2. Nowy Silnik Ekonomiczny (Pricing)



Wycena paczki zostala zunifikowana pod katem prostoty rozliczen i braku przecinkow (skalowanie ×10).



### Formula dla Klienta:

`CENA = (Liczba_Hubow * 50 + Dystans_KM * 10) * Waga_Paczki`



### Podzial Srodkow (Zero-Sum Game):

Kazda paczka posiada wlasne **Saldo**, z ktorego wyplacane sa prowizje:

- **Hub Startowy/Przeladunkowy/Meta:** `50 KES * waga` (oplata stala za sortowanie i magazynowanie).

- **Transport (Kurier):** `Dystans_odcinka * 10 * waga` (oplata zmienna za kilometry).

- **Zysk z Optymalizacji:** Wszystkie srodki pozostale w paczce po dostarczeniu (wynikajace ze skrotow kuriera) stanowia czysty zysk systemu. Dzieki temu "nadwyzka" nie ginie, lecz zostaje w systemie jako realna oszczednosc.



---



## 3. Logika "Hop-Skipping" i Motywacja Kurierow



Wprowadzilismy mechanizm pozwalajacy kurierom na dynamiczna optymalizacje trasy przy zachowaniu priorytetu konsolidacji.



### Zasada Przeskoku:

Na Gieldzie Zlecen wystawiane sa dwie opcje dla tej samej paczki:

1. **Opcja Standard:** Dostawa do najblizszego sasiada (np. P2 -> P10).

2. **Opcja Skip-Hop:** Mozliwosc przeskoczenia huba (np. P2 -> P5), jesli w hubie pomijanym (P10) nie ma aktualnie innych paczek czekajacych w tym samym kierunku.



### Bonus za Przeskok:

Kurier wykonujacy "Skip-Hop" przejmuje prowizje huba, ktory zostal pominiety (`50 KES * waga`). Jest to nagroda za oszczednosc czasu i uproszczenie logistyki.



---



## 4. Monitoring Finansowy i Sledzenie Paczek



Kazdy obiekt `Parcel` w systemie posiada teraz historie transakcji:

- `payment_history`: Lista wszystkich wyplat (kto, ile, za co).

- `balance`: Kwota pozostala do wydania na dalsza droge.



Podczas skanowania magazynu (`network_status`), system wyswietla pelny audyt kazdej paczki, zapobiegajac "ginieciu" pieniedzy w systemie.



---



## 5. Historia Zmian (Audit Log - Droga do Rozwiazania)



6. **Faza 6: Financial Audit & Optimization Profit** - Wdrozenie klasy Parcel z balansem i historia transakcji. Ustalenie mechanizmow audytu finansowego.

7. **Faza 7: Magnetic Routing 2.0 & Courier Incentives** - Implementacja Logiki B (alternatywne korytarze sektorowe) oraz przekierowanie zysku z optymalizacji bezposrednio do kurierow.



---



## 6. Magnetyzm 2.0 (Logika B - Zaawansowany Routing)



Wdrozono dwupoziomowy system wyznaczania tras, sterowany globalna zmienna `ROUTING_STRATEGY`.



### 6.1 Algorytm Selekcji (Routing Selector)

1. **Wylicz trase A**: Standardowa Dijkstra z uwzglednieniem prostego magnetyzmu sektorowego.

2. **Sprawdz "Early Exit"**: Jesli trasa A juz korzysta z magnetyzmu (istniejace worki na jej drodze), system konczy prace i zwraca trase A.

3. **Analiza Sektorowa**:

   - Oblicz kat start -> cel.

   - Porownaj odleglosc katowa do srodkow sasiednich sektorow (Lewy vs Prawy).

   - Wybierz sektor `alt_sector`, ktory jest blizej geograficznie.

4. **Trasa Alternatywna**: System wyznacza trase wymuszajaca pierwszy skok w `alt_sector`.

5. **Wirtualne Zerowanie (Teoretyczne)**: 

   - Kazdy segment trasy alternatywnej, ktory pokrywa sie z *dowolnym* istniejacym workiem w sieci, otrzymuje `teoretyczny_koszt = 0`.

6. **Decyzja Ekonomiczna**: Jesli `suma_kosztow_teoretycznych_B < koszt_A`, system wybiera wariant B.



### 6.2 Przejrzystosc ("Widocznosc Technologii")

Podczas pracy mozgu (Assigner) lub nadawania paczki, system loguje proces decyzyjny:

- `[LOGIKA B] Analiza trasy alternatywnej (Sektor X)...`

- `[LOGIKA B] Znaleziono darmowe odcinki...`

- `[LOGIKA B] WYBRANO TRASE ALTERNATYWNA / Pozostaje przy trasie A`



---



### 6.3 Przyklad praktyczny (Flask, konkretne huby)

Ponizszy scenariusz pokazuje **kiedy Logika B realnie zmienia trase**.

Zalozenie: `ROUTING_STRATEGY = 'B'`.



**Cel:** paczka `AA -> EA` zostaje "przyciagnieta" do korytarza.



1) **Zasiej korytarz** (dodaj paczki, aby powstaly worki na kazdym odcinku):

- `AA -> CA`

- `CA -> BQ`

- `BQ -> PA`

- `PA -> EA`



2) **Dodaj paczke docelowa**:

- `AA -> EA`



**Efekt oczekiwany:**

- Logika A (standard) zwykle wybiera: `AA -> BA -> DA -> EA`

- Logika B wybierze: `AA -> CA -> BQ -> PA -> EA`, poniewaz na tych odcinkach

  juz istnieja worki (korytarz jest "autostrada").



**Wniosek:** Logika B zmienia trase tylko wtedy, gdy istnieja aktywne worki na

alternatywnym korytarzu i przez to koszt teoretyczny alternatywy spada ponizej A.



---



### 6.4 Wzmocnione przyciaganie (tylko Logika B, sterowane flagami)

W nowszej wersji dodano mozliwosc **wzmocnionego przyciagania** na pierwszym odcinku trasy,

ale **tylko dla Logiki B** i tylko wtedy, gdy aktywne sa odpowiednie flagi.



**Zasada dzialania:**

1. Podczas liczenia kosztu krawedzi (`edge_cost`) sprawdzana jest konsolidacja:

   - `bag_at_b`: czy na hubie docelowym istnieje worek w kierunku sektora celu,

   - `bag_at_a`: czy na hubie startowym istnieje worek w kierunku tej krawedzi.

2. Jesli wystepuje konsolidacja, standardowy bonus magnetyzmu to `-80`.

3. **Wzmocnienie** (np. `-160`) moze zostac zastosowane **tylko** gdy:

   - jest to **pierwszy odcinek** trasy (start edge),

   - aktywny jest master‑flag (`MAGNETISM_STRONG_ENABLED`),

   - oraz aktywny jest flag dla Logiki B (`MAGNETISM_STRONG_B`).

4. Logika A pozostaje bez zmian (standardowy magnetyzm `-80`), chyba ze w przyszlosci

   celowo wlaczymy `MAGNETISM_STRONG_A`.



**Zaleznosc od Logiki A (kluczowe):**

- Logika B **dziala na bazie Logiki A** (ten sam `edge_cost` i standardowy magnetyzm `-80`).

- Wzmocnienie B **doklada sie** do tej bazy (czyli "Logika A + strong B").

- W praktyce (po testach) B zachowuje sie jak:  

  **A + (silniejsze przyciaganie na starcie) + (alternatywny korytarz, gdy tanszy)**.



**Flagi (docelowo do config/DB):**

- `MAGNETISM_STRONG_ENABLED` – master switch wzmocnienia

- `MAGNETISM_STRONG_A` – wzmocnienie dla Logiki A (domyslnie off)

- `MAGNETISM_STRONG_B` – wzmocnienie dla Logiki B (domyslnie on)



**Przyklad wizualny (schemat):**

```

Start: H1, cel: H4

Standard (A): H1 -> H2 -> H4   (magnetyzm -80)

Silne B:       H1 -> H2 -> H4   (magnetyzm -160 tylko na starcie, latwiej wygrywa)

```

Wzmocnienie nie zmienia samego kierunku A, tylko **zwieksza przewage** przy starcie.



**Uwaga praktyczna:**

Wzmocnienie `-160` jest bardzo agresywne i moze „przeciagac” trasy na krotkich odcinkach.

Docelowo mozna je skalowac (np. -120/-160) albo limitowac procentem kosztu odcinka.



### 6.5 Skip-hop w Logice B (flagi kontroli przeskokow)

Dodano dwie flagi ograniczajace przeskoki tylko w Logice B:



- `SKIP_STRICT_B`  

  **Strict all-match**: skip jest dozwolony tylko wtedy, gdy **kazda paczka w worku**

  ma te same 2 pierwsze hopy teoretyczne i **nie konczy sie** w `next_h`.



- `SKIP_BLOCK_CONSOLIDATION_B`  

  **Blokada konsolidacji**: skip jest blokowany, gdy:

  - na biezacym hubie istnieje inny worek do `next_h`, lub

  - w `next_h` istnieje worek, ktory idzie dalej do `hop2`.



**Cel:** usuniecie „przeskokow w dalszych hubach”, gdy po drodze

czekaja paczki/worki, ktore powinny zostac skonsolidowane.



## Technical Spec for Re-generation (Specyfikacja do Odtworzenia)



### Glowne Parametry

- `COST_PER_HUB = 50`

- `COST_PER_KM = 10`

- `SECTOR_COUNT = 8` (Sektory przypisane do kodow 1, 2, 4, 5, 7, 8, 10, 11)



### Kluczowe Algorytmy (Pseudokod)



**1. Wyznaczanie Polaczen (MNN):**

```python

# Hub A widzi Hub B tylko gdy:

B_is_closest_for_A = min(dist(A, any_in_sector))

A_is_closest_for_B = min(dist(B, any_in_opposite_sector))

if B_is_closest_for_A and A_is_closest_for_B:

    add_connection(A, B)

```



**2. Wycena Paczki:**

```python

route = dijkstra_route(start, end)

price = (len(route) * 50 + total_distance(route) * 10) * parcel_weight

```



**3. Rozliczenie Przejazdu:**

```python

for parcel in bag:

    # Wyplata dla kuriera

    payout = (actual_dist * 10 * weight)

    # Bonus jesli kurier zrobil przeskoczyl hub

    if used_skip_hop:

        payout += (50 * weight) 

    parcel.balance -= payout

    

    # Wyplata dla Hubu docelowego

    parcel.balance -= (50 * weight)

```



---



## 6. Rozszerzony Model Danych - Nairobi Courier v0.2



Ta sekcja dokumentuje zmiany wdrozone w celu profesjonalizacji zarzadzania hubami oraz pracownikami.



### 6.1 Model Pracownikow (Worker Model)

Kazdy Hub dziala jako mala komorka organizacyjna z wlasnym zespolem.



| Klasa | Pole | Opis |

| :--- | :--- | :--- |

| **Worker** | `id`, `name`, `pin` | Unikalny identyfikator, Imie i PIN (4-6 cyfr). |

| | `is_manager` | Flaga okreslajaca uprawnienia zarzadcze. |

| | `balance` | Indywidualne saldo zarobkow pracownika. |

| | `rates` | Procentowy udzial w prowizjach (Intake, Transfer, Delivery). |

| **Hub** | `workers[]` | Lista wszystkich pracownikow przypisanych do punktu. |

| | `active_workers[]`| Pracownicy aktualnie zalogowani (wsparcie wielu urzadzen). |

| | `logged_in_manager`| Manager aktualnej zmiany, do ktorego trafia reszta prowizji. |



### 6.2 Logika Podzialu Prowizji (Split-Fee Mechanism)

System automatycznie dzieli prowizje huba przy kazdej operacji:

1. **Pracownik** dostaje `hub_fee * worker_rate`.

2. **Manager zmiany** dostaje pozostala czesc `hub_fee * (1.0 - worker_rate)`.

3. Jesli manager sam obsluguje paczke, otrzymuje 100% prowizji.



### 6.3 Szczegolowe Stawki Hubow (PRD 4.3)

Zrezygnowano ze stalego 50 KES na rzecz stawek procentowych lub kwotowych zaleznych od typu operacji:

- **Intake Rate** (Przyjecie): np. 5% lub stala kwota.

- **Transfer Rate** (Przeladunek): np. 10% lub stala kwota.

- **Delivery Rate** (Wydanie): np. 5% lub stala kwota.



### 6.4 Zaawansowany Monitoring i Chain of Custody

Kazda akcja w systemie jest teraz precyzyjnie sledzona i logowana.



| Parametr | Szczegoly |

| :--- | :--- |

| **Timestamping** | Wszystkie zdarzenia stemplowane `[YYYY-MM-DD HH:MM:SS]`. |

| **Historia Finansowa** | `payment_history` zawiera liste wszystkich wyplat z dokladnoscia do 2 miejsc po przecinku (`round(x, 2)`). |

| **Audit Log** | Sledzenie kazdego pracownika (`handled_by`) i kuriera odpowiedzialnego za przedmiot. |



---



## 7. Zarzadzanie Zasobami i Opakowaniami (v0.3)



Wprowadzono 3 poziomy monitorowania przedmiotow w sieci Nairobi.



### 7.1 Grupa 2: Opakowania Monitorowane (PKG-XXX)

- **Identyfikacja**: Unikalne ID (np. `PKG-P1-01`).

- **Chain of Custody**: System wymusza skanowanie przy kazdym przekazaniu. 

- **Wlasnosc**: Zawsze przypisane do konkretnego kuriera lub hubu.



### 7.2 Grupa 3: Zasoby Administracyjne (AST-XXX)

- **Zaszyte w Hubie**: Sprzet taki jak drukarki, skanery, wagi.

- **Obowiazkowe Notatki**: Kazdy ruch assetu (transfer do innego hubu) wymaga wpisania powodu (notatki).

- **Historia Nieusuwalna**: W przeciwienstwie do zwyklych paczek, historia AST nigdy nie znika i stanowi pelny audyt majatku firmy.



### 7.3 Grupa 4: Balansowanie Obciazenia (Load Balancing)

Inteligentne rozkladanie ruchu w celu unikniecia "zatorow" (congestion).



#### A. Wskaznik Zatoru (Operacyjny)

- **Formula**: `Obciazenie = (Liczba paczek w hubie) / (Liczba pracownikow)`.

- **Kara Dijkstra**: Jesli `obciazenie > 20` paczek na pracownika, system dolicza wirtualna kare do dystansu: `penalty = (obciazenie - 20) * 2 km`.

- **Cel**: System automatycznie omija Huby, ktore sa "wolne" lub "zatkane", wybierajac dluzsza geograficznie, ale szybsza operacyjnie droge.



#### B. Logistyka Workow (Bags Inventory)

- **Zasoby**: Kazdy Hub startuje z zapasem **100 workow**.

- **Hitchhiking (Autostop)**: System dazy do wyrownania stanu workow poprzez przewozenie pustych opakowan "przy okazji" transportu paczek. Kurier nie dostaje za to dodatkowej oplaty, ale zwieksza to sprawnosc operacyjna sieci.

- **Brak Kar**: Stan workow jest czysto informacyjny i nie wplywa na trasowanie paczek klienta.



---



## 8. Specyfikacja Techniczna Rozliczen (v0.3)



### 8.1 Precyzja i Rounding

Wszystkie obliczenia finansowe musza byc zaokraglane do dwoch miejsc po przecinku. Zakaz uzywania `int()` do obcinania kwot.

- `price = round(total_unit_cost * weight, 2)`

- `p_share = round((p.weight / total_weight) * total_payout, 2)`



### 8.2 Hub Fee Split

Stawka Hubu jest dzielona dynamicznie:

- **Worker Cut**: `effective_fee * worker_rate` (zaokraglone do 0.01).

- **Manager Cut**: `effective_fee - worker_cut`.



---



*Dokument zaktualizowany: 2026-03-02*

*Status: Faza v0.4 Wdrozona - Logika Magnetyczna 2.0 i Pelny Audyt*



---



## 9. Dynamiczny Routing i Model Finansowy v0.5



### 9.1 Kluczowa Decyzja: Hub Fee = 50 KES FLAT



**Hub fee jest oplata stala - jak czynsz. Nie zalezy od wagi paczki.**



```

Formula wyceny: hubs × 50 + km × 10 × waga

                ──────────   ────────────────

                flat         skaluje z waga

```



Stara wersja dokumentu pokazywala `3 × 100 = 300 KES` - to byl blad. Prawidlowo: `3 × 50 = 150 KES`.

Transport skaluje sie z waga bo kurier fizycznie wiezie ciezar. Hub placi za samo zatrzymanie paczki.



---



### 9.2 Faza 1: System Wag Hubow (Miekkie Sterowanie Ruchem)



Kazdy hub ma pole `routing_weight` ktore wplywa na koszt krawedzi w Dijkstrze:



```

routing_weight = 0      -> neutralny (domyslny)

routing_weight = +200   -> mocno omijany (przeciazony, zamykajacy sie)

routing_weight = +9999  -> praktycznie wylaczony z routingu

routing_weight = -200   -> wymuszone przejscie (centrum logistyczne)

```



**Nowe pola w klasie Hub:**

- `routing_weight = 0` - miekka waga routingowa

- `closing_warning = None` - etap procedury zamkniecia (`"30min"` / `"10min"` / `"CLOSING"`)

- `closing_blocked = False` - czy kurier jest w drodze (nie mozna zamknac)



**Nowe funkcje:**

- `set_hub_weight(hub, weight, reason)` - reczne ustawienie wagi przez admina

- `auto_adjust_hub_weight(hub)` - automatyczna regulacja na podstawie fill rate i ratingu

- `escalate_hub_closing(hub, hub_database)` - 3-etapowa procedura zamkniecia

- `reactivate_hub(hub, hub_database)` - reaktywacja po przerwie



**Procedura zamkniecia (3 etapy):**

```

ETAP 1: routing_weight = +200  -> nowe paczki zaczynaja omijac

        closing_warning = "30min"

ETAP 2: routing_weight = +9999 -> praktycznie niewidoczny

        closing_warning = "10min"  + komunikat o kurierze w drodze

ETAP 3: is_active_manual = False -> faktyczne wylaczenie

        routing_weight = 0 (reset)

```



Menu admina: `[5]` procedura zamkniecia, `[6]` reaktywacja.

`auto_adjust_hub_weight()` wywolywany po kazdym transporcie w `apply_assignment()`.



---



### 9.3 Faza 2: Podwojna Wycena A+B i Dynamiczny km_rate



**Mechanizm B (theoretical=True):** trasa przez pelna siec (wszystkie huby aktywne)

**Mechanizm A (theoretical=False):** trasa przez aktywne huby (rzeczywista)



```

cena_B = hubs_theo × 50 + km_theo × 10 × waga

cena_A = hubs_akt  × 50 + km_akt  × 10 × waga

operational_budget = MAX(cena_A, cena_B)   ← klient placi tyle

```



**Zasada:** Klient nigdy nie placi mniej niz przy pelnej sieci. Jesli trasa jest dluzsza (bo hub offline), klient placi wiecej.



**Dynamiczny km_rate:**

```

hub_fees_reserved = actual_hubs × 50   (flat)

transport_budget  = operational_budget - hub_fees_reserved

km_rate           = transport_budget / (actual_km × waga)

```



**Nowe pola w klasie Parcel:**

- `actual_route = []` - biezaca trasa operacyjna (lista Hub)

- `is_subsidized = False` - True gdy system doplacil do paczki



**Nowe funkcje:**

- `calculate_dual_price(start_hub, end_hub, weight)` - zwraca dict z `operational_budget`, `km_rate`, `actual_route`, `cena_A`, `cena_B`

- `settle_transport_leg(parcel, from_hub, to_hub)` - pobiera koszt odcinka z dynamicznym `km_rate`, zwraca kwote dla kuriera



`create_and_add_parcel()` uzywa teraz `calculate_dual_price()` do wyceny.



---



### 9.4 Faza 3: Przeliczanie Tras i Dofinansowanie



**Zasada:** Trasa przeliczana ZDARZENIOWO - nie cyklicznie. Tylko gdy hub znika.

Sprawdzamy tylko HOP1 i HOP2 - dalsze huby dostosuja sie naturalnie przy kolejnym skoku.



**recalculate_bag_route(bag, current_hub, hub_database):**

```

1. Mechanizm A: nowa trasa od current_hub do end_hub (tylko aktywne huby)

2. Jesli brak trasy -> HOLDING (worek czeka, nie wystawiany na gielde)

3. Jesli trasa istnieje:

   - Oblicz nowy km_rate = (saldo - remaining_hubs × 50) / (new_km × waga)

   - Zaktualizuj bag.to_hub jesli hop1 sie zmienil

   - ALERT jesli zmienil sie sektor -> fizyczne przeklozenie worka

4. Loguj zmiane w payment_history kazdej paczki

```



**top_up_if_needed(parcel, from_hub, to_hub):**

```

next_hop_cost = 50 + dist × 10   (flat hub + transport po std stawce)

if parcel.balance < next_hop_cost:

    deficyt = next_hop_cost - parcel.balance

    system doplaca deficyt

    parcel.is_subsidized = True

    total_optimization_savings -= deficyt

```

Wywolywac PRZED pobraniem oplaty huba i PRZED settle_transport_leg.



**Podpiecie do manage_topography [3]:** przy wylaczaniu huba system automatycznie wywoluje `recalculate_bag_route` dla wszystkich workow ktorych hop1 wskazywal na wylaczany hub.



---



### 9.5 Faza 4: Skip-Hop (Pominiecie Posredniego Huba)



Skip-hop pozwala zapieczetowanemu workowi przejechac bezposrednio do hub+2 omijajac hub+1, gdy nie ma powodu zatrzymywac sie posrodku.



**Warunki kwalifikacji:**

1. Worek jest ZAPIECZETOWANY (`BagStatus.SEALED`)

2. W biezacym hubie NIE ma innych workow jadacych w tym samym kierunku sektorowym

3. W hub+1 (pomijanym) NIE ma paczek do konsolidacji w tym samym kierunku

4. Trasa ma >= 3 elementy (jest co pominac)



**check_skip_hop_eligibility(bag, current_hub):**

```python

returns {

    "eligible": True/False,

    "skip_to":  hub+2,       # docelowy po skip

    "skip_over": hub+1,      # pomijany

    "budget_recovered": 50,  # odzyskane KES (flat hub fee)

    "new_route": [...],

}

```



**execute_skip_hop(bag, current_hub, eligibility_result):**

```

1. bag.to_hub = skip_to

3. km_rate przeliczony z odzyskanym budzetem

4. Loguj: "SKIP-HOP: P2 -> (skip A1) -> P5 | +50 VKES do transportu"

```



**W job_market:** przy kazdym zleceniu sprawdzane jest `check_skip_hop_eligibility`. Jesli eligible, gielda wyswietla `⚡ SKIP-HOP dostepny: omin A1 -> jedz do P5`.



---



### 9.6 Tabela Wariantow Symulatora (Trasa P2->P7, waga=2kg)



| Wariant | Zdarzenie | km_rate | Alert obslugi |

|---------|-----------|---------|---------------|

| 1 | Normalna trasa P2->A1->P5->P7 | staly | NIE |

| 2 | A1 offline przy nadaniu | staly (MAX) | NIE |

| 3 | A1 znika, worek w P2 (hop1) | spada - dluzsza trasa | TAK - zmiana sektora |

| 4 | P5 znika, worek w P2 (hop2) | spada - dluzsza trasa | NIE - hop1 bez zmian |

| 5 | P5 znika, worek W DRODZE | czekaj na dostarczenie | NIE |

| 6 | P7 (cel) znika, paczka w P5 | bez zmian - HOLDING | NIE |



---



### 9.7 Magnetyzm 2.0 - Status i Przepis na Przyszlosc



System posiada przelacznik `ROUTING_STRATEGY` (`'A'` / `'B'`) w menu `[8]`.



- **Logika A (domyslna):** zdecentralizowana Dijkstra z wagami hubow

- **Logika B (Magnetyzm 2.0):** alternatywne korytarze kierunkowe



**Decyzja:** Do czasu pelnych testow produkcyjnych pozostaje jako przelacznik. Logika hubow (routing_weight, edge_cost, wycena A+B) dziala identycznie w obu trybach. Magnetyzm 2.0 wplywa tylko na wybor trasy, nie na ceny.



Po testach: rozwazyc czy Logika B staje sie domyslna lub jedyna.



---



---



*Dokument zaktualizowany: 2026-03-02*

*Status: Faza v0.5 Wdrozona - 4 Fazy Dynamicznego Routingu, Hub Weights, Dual Pricing A+B, Route Recalculation, Skip-Hop*

*NASTEPNY KROK: Testy produkcyjne obu logik (A/B), decyzja o Magnetyzmie 2.0 jako domyslnym*



---



## 10. DO PRZEMYSLENIA - Odpornosc Sieci (Przyszle Wersje)



> ⚠️ Ponizsze punkty NIE sa pilne ani wymagane do MVP.

> Sa wynikiem analizy edge-case'ow awaryjnych i maja byc omowione przed wdrozeniem produkcyjnym.

> Obecny system jest odpowiedni do skali - male sklepy, nie centrum logistyczne.



---



### 10.1 Cascading Failure - Awaria Wielu Hubow Jednoczesnie



**Scenariusz:** 2 huby padaja jednoczesnie, trzeci hub zostaje przeciazony ruchem z obu.



**Obecny stan:** `routing_weight` automatycznie rosnie przy przeciazeniu, co zniecheca routing do przeciazonego huba. Ale brak globalnego progu dla calej sieci.



**Do przemyslenia:**

- Czy potrzebny jest globalny `network_health_score`?

- Prog po przekroczeniu ktorego system wyswietla alert admina: *"Siec przeciazona - rozwaz reczne interwencje"*

- Czy routing ma sie zatrzymac (HOLD ALL) czy dzialac degraded?



---



### 10.2 Synchronizacja Stanu Po Reaktywacji Huba



**Scenariusz:** Hub B pada i wraca po 2 godzinach. Czesc paczek byla w tranzycie do B.



**Obecny stan:** `reactivate_hub()` wlacza hub i resetuje `routing_weight`. Worki ktore czekaly (HOLDING) automatycznie wychodza na gielde. Ale brak sprawdzenia duplikatow zlecen.



**Do przemyslenia:**

- Czy po reaktywacji powinno byc `reconciliation_check()` - porownanie workow zarejestrowanych jako jadace do B vs. worki faktycznie w B?

- Ryzyko: kurier dostal zlecenie do B przed awaria, B wrocilo - czy zlecenie jest wciaz aktualne?

- Ewentualne rozwiazanie: `bag.courier_assigned = courier_id` - lock na worku ktory jest w transporcie



---



### 10.3 Stany Czesciowej Awaryjnosci Huba



**Scenariusz:** Hub dziala, ale jeden pracownik jest chory - hub moze przyjmowac ale nie wysylac.



**Obecny stan:** Hub jest albo `is_active_manual = True` albo `False`. Brak stanow posrednich.



**Do przemyslenia:**

- Dodanie statusu `receive_only` / `dispatch_only` (juz zaplanowane w task.md)

- Przy `receive_only`: Dijkstra traktuje hub jak wazony koniec trasy (mozna tam dotrzec ale nie mozna startowac)

- Przy `dispatch_only`: hub moze wysylac ale nie przyjmuje nowych paczek od klientow



**Prawdopodobna implementacja 1 linia:**

```python

hub.mode = "normal" | "receive_only" | "dispatch_only" | "hold"

```

Dijkstra sprawdzalby `hub.mode` przy kazdej krawedzi.



---



*Sekcja dodana: 2026-03-02 | Do omowienia przed wdrozeniem produkcyjnym*



---



## 11. Specyfika Portfela Hubu i Rozliczen KES (Debt Reduction Model)



> [!IMPORTANT]

> **UWAGA WAZNE:** Portfel Hubu (`vkes_balance`) oraz gotowka fizyczna (`kes_balance`) dzialaja w modelu redukcji dlugu systemu wobec partnera (Huba). Nie nalezy mylic salda Huba z zarobkami personelu.



### 11.1 Mechanizm Redukcji Dlugu

Huby w Nairobi pelnia role punktow wymiany walut i inkasentow. Przy nadaniu paczki gotowkowej (KES):

1. **Wzrasta `kes_balance`**: Hub fizycznie przyjmuje gotowke od klienta.

2. **Wzrasta `vkes_balance`**: System zalicza te gotowke jako splate dlugu wobec Huba. Poniewaz Hub startuje z ujemnym saldem (np. -10,000 VKES jako kaucja startowa), kazda wplata KES przybliza go do zera (zmniejsza zadluzenie systemu).



### 11.2 Separacja Salda Huba i Zarobkow

- **Saldo Huba**: Odzwierciedla stan rozliczen miedzy Firma a wlascicielem punktu (kasa/kaucja).

- **Zarobki Personelu**: Prowizje za operacje (Intake/Transfer/Delivery) trafiaja bezposrednio do portfeli pracownikow (`Worker.balance`), a nie do salda Huba.



### 11.3 Logowanie Transakcji

Wszelkie operacje zasilenia portfela Hubu poprzez gotowke musza byc logowane jako **"[Zasilenie Kaucji]"** lub **"[Splata Dlugu]"**, aby odroznic je od standardowych operacji logistycznych.



---



## 12. Ewolucja Techniczna i Modernizacja Serwera (Architektura v0.7)



*Sekcja dodana: 2026-03-04 | Dokumentacja zmian strukturalnych i wizualizacji live*



W fazie POC v0.7 dokonano glebokiej przebudowy serwera Flask oraz frontendu React, aby umozliwic dynamiczne zarzadzanie siecia i poprawic czytelnosc kodu.



### 12.1 Refaktoryzacja Modulowa (Service-Oriented)

W celu unikniecia "Monolitu Flask", logika biznesowa zostala wyodrebniona z warstwy transportowej HTTP do dedykowanych serwisow:

- **`event_service.py`**: Zarzadzanie stanem sieci, kolejka SSE i snapshotami dla frontendu.

- **`hub_service.py`**: Logika topologii (MNN), wlaczanie/wylaczanie wezlow oraz inteligentne reroutowanie workow.

- **`domain_models/parcels.py`**: Typowane kontrakty paczek niezalezne
  od transportu HTTP.

- **`parcel_command_mapper.py`**: Jednokierunkowe mapowanie formularzy
  adapterow na komendy domenowe paczek.



### 12.2 Wizualizacja Topologii w Czasie Rzeczywistym (MNN Live)

Wprowadzono pelne sledzenie zmian w sieci na poziomie frontendu:

- **Topology Diff**: Serwer oblicza roznice (added/removed links) przy kazdej zmianie stanu huba (manual toggle lub wylogowanie pracownika).

- **Animacja Stanu**: React Canvas wizualizuje zanikajace polaczenia (czerwony dash) oraz nowo powstale magistrale (pomaranczowy puls).

- **Inteligentny Rerouting**: Worki znajdujace sie w ruchu sa automatycznie przekierowywane na nowe, najlepsze trasy (Dijkstra) w momencie wypadniecia wezla z sieci.



### 12.3 Standaryzacja Interfejsu i Logow

- Jednolita nomenklatura rol: **"Worker "** (wyrownany do "Manager").

- Model logowania zdarzen maszynowy (JSON) dla stabilnosci SSE.

- Nowe metody interakcji: Double-click / Mid-click dla administracji topologia.



---



*OSTATNIA AKTUALIZACJA: 2026-03-04 (Architektura Modularna i MNN Live v0.7)*



---



## 13. Route Decision System (RDS) - A/B (Ujednolicona nazwa)



### 13.1 Slownik nazw

- **Route Decision System (RDS)** = wspolna nazwa logiki wyboru trasy.

- `RDS-A` = routing standardowy oparty o Dijkstre (aktywny stan sieci).

- `RDS-B` = Magnetyzm 2.0 (routing sektorowy z preferencja konsolidacji, tylko gdy alternatywa jest kosztowo lepsza).

- `RDS-RECALC-A` = wpis logu lokalnego przeliczenia trasy (legacy: `LOG_A`).

- `RDS-RECALC-B(reason)` = wpis logu przeliczenia po zmianie topologii (legacy: `LOG_B(reason)`).

- `RDS-B` (strategia) != `RDS-RECALC-B` (typ wpisu w logu).



### 13.2 Co robi przelacznik A/B

- Przelacznik `A/B` zmienia `ROUTING_STRATEGY`.

- Tryb `A`:

- trasa z Dijkstry po aktywnych hubach;

- bez kroku magnetyzmu.

- Tryb `B`:

- najpierw liczona jest trasa bazowa A;

- system sprawdza okazje konsolidacji sektorowej (worki/paczki w zblizonym kierunku);

- jesli warto, buduje alternatywny korytarz sektorowy;

- wybiera alternatywe tylko gdy ma nizszy koszt od A, w przeciwnym razie zostaje A.



### 13.3 Efekt przelaczenia (operator)

| Obszar | Co operator zobaczy po A/B | Widoczne od razu |

|---|---|---|

| Terminal: podglad tras | Moze pojawic sie wariant `MAGNETYCZNA 2.0 (B)` | Tak |

| Terminal: logi przeliczen | `RDS-RECALC-A/B` pozostaja logami audytowymi | Tak |

| Flask: `/api/jobs` | Efekt B jest czesciowy tam, gdzie flow idzie bezposrednio po Dijkstrze | Czesciowo |

| Flask: `/api/apply_job` | Rozliczenia finansowe bez zmiany semantyki A/B | Tak |

| Recalc topologii | Trasy i `km_rate` sa przeliczane, logowane jako `RDS-RECALC-B(reason)` | Tak |









---



## ANEKS A: SPECYFIKACJA KODOW (PRZENIESIONE Z logistc_code.md)



Ponizsza sekcja zostala przeniesiona w calosci z pliku `logistc_code.md`.



# PRD v2: System kodow "Marker & Hub" (wersja wdrozeniowa)



Projekt: miejski system logistyczny low-tech (Nairobi)  

Cel: wdrozyc kodowanie paczek/workow + walidacje sieci hubow + integracje z edytorem polaczen.



## 1. Zakres wdrozenia (MVP)

- Generowanie kodu paczki (3 znaki).

- Generowanie kodów opakowań W/V oraz składanie kodów skrzynek S.

- Walidacja i przydzial identyfikatorow hubow.

- Reakcja systemu na dodanie/usuniecie huba i polaczenia w Hub Editor.

- Walidator nazw hubow (program serwerowy + API).



## 2. Slownik i byty

- `GlobalHubID` (2 znaki): adres docelowy paczki.

- `LocalHubMark` (1 znak): znak huba używany w kodach W/V i kodzie trasy S.

- `ParcelCode` (4 znaki): zakodowane 20 bitow (RFC 4648).

- `BagCode`: kod rekordu transportowego W/V; jego rodzaj rozstrzyga
  `container_type`, nie sam tekst kodu.



## 2A. Trzy rodzaje kodow w systemie (final)

1. Kod huba (tozsamosc huba)

- `GlobalHubID` (2 znaki, RFC 4648): adres logiczny huba (0..511).

- `LocalHubMark` (1 znak, RFC 4648): lokalny stempel operacyjny huba (0..31).

- Uzycie:

  - `GlobalHubID` -> routing/adres celu paczki,

  - `LocalHubMark` -> zapis trasy worka i walidacja sasiedztwa.



2. Kod paczki (`ParcelCode`, 4 znaki)

- 20 bit zakodowane w Base32 RFC 4648:

  - `HubID` 9 bit (0..511),

  - `Direction` 3 bit (0..7),

  - `Counter` 8 bit (0..255, per HubID+Direction).

- Uzycie:

  - szybkie reczne wpisywanie i identyfikacja paczki w obiegu.



3. Kod opakowania

- W i V współdzielą format: znak źródła + licznik Code32 + znak celu.
- `container_type` rozróżnia fizyczny worek W od opakowania wirtualnego V.
- S zachowuje pełny kod bazowy inventory o długości co najmniej trzech znaków
  i otrzymuje znaki trasy.
- Kod jest widoczny dla pracownika i służy do wskazania właściwego
  opakowania; sam kod bez `container_type` nie określa, czy jest to W czy V.



## 3. Standard kodowania: RFC 4648 (decyzja)

W calym systemie przyjmujemy jeden standard:

- `Base32 RFC 4648`

- alfabet kanoniczny: `ABCDEFGHIJKLMNOPQRSTUVWXYZ234567`

- wielkie litery, bez separatorow.



To jest zrodlo prawdy dla:

- `GlobalHubID`,

- licznikow i fragmentow kodu worka,

- walidacji po stronie serwera.



## 4. Anty-bledy ludzkie (na bazie RFC 4648)

Wprowadzanie reczne ma byc "human-safe", ale kod pozostaje RFC 4648.



Reguly wejscia:

- `upper()`,

- usuniecie spacji, `-`, `.`,

- odrzucenie znakow spoza `A-Z2-7`.



Reguly UI:

- klawiatura ekranowa pokazuje tylko `A-Z2-7`,

- duze przyciski, stale polozenie klawiszy,

- podglad wpisanego kodu znak-po-znaku.



Reguly walidacji:

- regex dla tokenu Base32: `^[A-Z2-7]+$`,

- przy blednym znaku: komunikat "znak spoza RFC 4648".



Dodatkowe zabezpieczenie:

- kazdy kod trzymany w bazie ma cyfrowy `checksum` (pole techniczne, niepisane markerem),

- przy wpisie recznym serwer porownuje token + checksum i odrzuca literowki.



## 5. Kod paczki (4 znaki, RFC 4648)

Format logiczny (20 bit):

- `HubID` = 9 bit (0..511),

- `Direction` = 3 bit (0..7),

- `Counter` = 8 bit (0..255).



Mapa HubID:

- 8 sektorow x 8 stref x 8 hubow = 512 hubow.

- Rozklad bitow:

  - 3 bit sektor,

  - 3 bit strefa,

  - 3 bit hub w strefie.



Zasady:

- Kod fizyczny moze sie powtarzac w historii (po rollover licznika).

- Unikalnosc trwala zapewnia `PackageUUID`/`ULID` w bazie.

- Unikalnosc operacyjna: `code4` musi byc unikalny tylko wsrod paczek aktywnych (w obiegu).

- Przy odbiorze wpisanie `ParcelCode` zwraca liste kandydatow z danego huba.

- Licznik dziala per `(HubID, Direction)` i ma auto-reset:

  - `next = (next + 1) % 256`

  - po `255` wraca na `0`.

- Przy przydziale kodu:

  - system sprawdza, czy `code4` nie jest zajety przez aktywna paczke,

  - jesli zajety, probuje kolejnych wartosci licznika az do wolnego slotu.


## 5A. Kod personelu (pracownicy sieci)

Format (bez separatorow):

- `RHHIIN...NC`

Znaczenie:

- `R` = 1 litera roli (np. C/W/M),

- `HH` = 2 litery huba,

- `II` = 2 litery inicjalow,

- `N...N` = liczba w Base32 (dowolna dlugosc),

- `C` = suma kontrolna (1 znak Base32).

Checksum:

- `C = alphabet[ sum(index(ch) for ch in RHHIIN...N) % 32 ]`

Alfabet: `ABCDEFGHIJKLMNOPQRSTUVWXYZ234567`.


## 5B. Kod klienta (osoby spoza sieci)

Format (bez separatorow):

- `IIN...NC`

Znaczenie:

- `II` = 2 litery inicjalow,

- `N...N` = liczba w Base32 (dowolna dlugosc),

- `C` = suma kontrolna (1 znak Base32).

Checksum:

- `C = alphabet[ sum(index(ch) for ch in IIN...N) % 32 ]`

Alfabet: `ABCDEFGHIJKLMNOPQRSTUVWXYZ234567`.



## 6. Identyfikacja opakowań — aktualna zasada

W i V mają publiczny kod Code32 złożony ze znaku huba źródłowego, zmiennej
części licznikowej i znaku pierwszego celu. Licznik jest wspólny dla W/V w
ramach huba źródłowego, a unikalność jest sprawdzana w całej tabeli `bags`.
S ma stały kod bazowy inventory o długości co najmniej trzech znaków oraz
dopisywane znaki trasy. Jego tożsamość jest przechowywana również jako
`bags.inventory_id`.
Stan i znaczenie kodu zawsze interpretuje się razem z `container_type`,
statusem, kierunkiem i powiązanymi paczkami.



## 7. Sasiedztwo hubow i "kolorowanie" (LocalHubMark)

Wymaganie biznesowe:

- Hub nie moze miec tego samego `LocalHubMark` co:

  - sasiedzi 1-hop,

  - sasiedzi 2-hop.



Algorytm nadania `LocalHubMark` (`code1`) przy tworzeniu nowego huba:

1. Zbuduj graf aktywnych polaczen.

2. Zachowaj bez zmian wszystkie poprawne oznaczenia istniejacych hubow.

3. Dla nowego huba `H` wyznacz zbior zabronionych znakow:

   - znaki wszystkich wezlow w odleglosci <=2 od `H`.

4. Przydziel nowemu hubowi pierwszy wolny znak z alfabetu RFC4648
   `ABCDEFGHIJKLMNOPQRSTUVWXYZ234567`.

5. Gdy zadnego z 32 znakow nie mozna przydzielic bez konfliktu:

   - nie uruchamiaj cichego ani globalnego przeliczania;
   - pokaz operatorowi wyrazne ostrzezenie oraz liste hubow, ktorych oznaczenia
     mialyby sie zmienic;
   - dopiero po jawnym potwierdzeniu uruchom lokalny recoloring BFS na
     najmniejszym mozliwym obszarze do 2 hop od `H`;
   - zapisz w audycie stare i nowe oznaczenia, powod zmiany oraz aktora;
   - emituj `topology_changed` z niepustym `recolored_hubs`, zawierajacym
     wartosci `before` i `after`;
   - nie przepisuj istniejacych kodow paczek, workow ani historii append-only;
     poprzednie przypisania musza pozostac odtwarzalne, a nowe oznaczenia
     obowiazuja tylko dla kodow utworzonych po zatwierdzeniu zmiany;

   - jesli dalej brak rozwiazania, oznacz stan `UNSAT` i odrzuc dodanie huba
     bez czesciowej zmiany topologii lub oznaczen.



Uwagi:

- `LocalHubMark`, w API nazywany rowniez `code1`, jest przechowywany jako
  `hubs.local_name`.

- Nadane oznaczenie jest stale. Logowanie, wylogowanie, aktywacja, zamkniecie,
  przesuniecie, zmiana danych, synchronizacja manifestu ani zwykla zmiana
  polaczenia nie moga go przeliczyc.

- Podczas normalnej pracy jedynym zrodlem prawdy jest `hubs.local_name` w DB.
  Manifest nie nadpisuje ani nie naprawia `code1` w istniejacej bazie.
- Kontrolowany wyjatek stanowi pelna odbudowa pustej DB przez
  `reset_db_v1.ps1`: zapisane w manifescie oznaczenia sa wtedy jednorazowym
  materialem bootstrapowym. Po imporcie DB ponownie staje sie zrodlem prawdy.

- Usuniecie huba zwalnia jego znak dla przyszlych hubow, ale nie zmienia
  oznaczen pozostalych hubow.

- Wyjatkowy recoloring jest dozwolony tylko podczas dodawania nowego huba,
  po wyczerpaniu zwyklego przydzialu z calej puli 32 znakow i po jawnym
  potwierdzeniu operatora. Nigdy nie obejmuje calej mapy.

- Operacja musi byc atomowa (transakcja + lock topologii).



## 8. Integracja z Hub Editor (dodaj/usun polaczenie)

Po `link_add` / `link_remove`:

1. Zbuduj i zwaliduj proponowana zmiane topologii przed zapisem.

2. Nie zmieniaj istniejacych `LocalHubMark`.

3. Jezeli `link_add` powoduje konflikt oznaczen w zakresie 2-hop, odrzuc
   dodanie polaczenia z czytelnym wskazaniem konfliktujacych hubow.

4. Dopiero po poprawnej walidacji zapisz zmiane i przelicz
   sasiedztwo/routing.

5. Po sukcesie emituj zdarzenie SSE `topology_changed`; `recolored_hubs`
   pozostaje puste.



Po `hub_add`:

- zwaliduj nazwe huba (sekcja 9), nadaj tylko nowemu hubowi pierwszy poprawny
  znak i zapisz przypisanie wylacznie w DB;
- tylko brak poprawnego znaku z calej puli moze otworzyc jawny, lokalny tryb
  recoloring opisany w sekcji 7.

Po `hub_delete`:

- usun hub i jego przypisanie, ale nie przeliczaj oznaczen innych hubow;
- zwolniony znak moze zostac uzyty dopiero przy pozniejszym dodaniu huba.



### 8.1 Notatka operacyjna: `hub_move` (korekta lokalizacji)

- Status na teraz (faza testowa): `hub_move` pozostaje wlaczone.

- Przeznaczenie: tylko drobna korekta blednej lokalizacji huba.

- Docelowo (produkcja) do decyzji:

  - ograniczenie maksymalnego przesuniecia na operacje (np. 0.5-1.0 km),

  - pelny wpis audit log dla kazdego `hub_move`,

  - brak automatycznego rename przy malej korekcie,

  - dla duzej zmiany polozenia: kontrolowana migracja nazwy (`rename migration`).



## 9. Program walidacji nazw hubow

Wymagany osobny walidator (serwer):

- Regex nazwy: `^[A-Z][A-Z0-9_]{1,15}$`

- Unikalnosc nazwy (case-insensitive).

- Zakaz nazw zarezerwowanych: `SYS`, `ROOT`, `NULL`, `ADMIN`, `TEST`.

- Zakaz konfliktu z formatami kodow (`ParcelCode`, `BagCode`) jesli UI moze to mylic.



API:

- `POST /api/hubs/validate_name` -> `{ok, errors[]}`

- Uzywane przed `add_hub` i przy rename.



## 10. Dane i tabele (minimum)

- `Hubs`:

  - `id`, `name`, `global_id`, `local_mark`, `x`, `y`, `active`.

- `HubLinks`:

  - `id`, `hub_a`, `hub_b`, `active`, `blocked`, `updated_at`.

- `Packages`:

  - `id`, `parcel_code4`, `dest_hub_id`, `dir_code`, `dir_counter`, `status`, `current_hub_id`, `bag_id`.

- `HubDirectionCounters`:

  - `hub_id`, `direction`, `next_counter` (0..255), `updated_at`.

- `Bags`:

  - `id`, `bag_code`, `start_hub_id`, `counter`, `status`, `route_marks`.

- `AuditLog`:

  - `id`, `actor`, `action`, `payload_json`, `ts`.



## 11. Offline-first

- Aplikacja magazyniera buforuje operacje jako eventy:

  - `scan_parcel_code`, `bag_receive`, `bag_open`, `bag_close`.

- Po reconnect:

  - wysylka FIFO z timestampem klienta i serwera,

  - idempotency key na event,

  - konflikt -> status `REVIEW_REQUIRED`.



## 12. Decyzje blokujace (musimy uzgodnic przed pelnym wdrozeniem)

1. LocalHubMark:

   - Ustalenie: 1 znak na stale po nadaniu.

   - Przy dodaniu huba najpierw wybierany jest wolny znak bez zmiany
     istniejacych oznaczen (walidacja 1-hop i 2-hop).

   - Recoloring sasiednich oznaczen jest wyjatkiem dozwolonym tylko wtedy, gdy
     zadnego z 32 znakow nie mozna przydzielic nowemu hubowi. Wymaga jawnego
     ostrzezenia, potwierdzenia operatora, minimalnego zakresu do 2 hop oraz
     pelnego audytu `before`/`after`.

   - Po nadaniu znaki nie zmieniaja sie automatycznie przy codziennej pracy.

   - Usuniecie huba nie zmienia oznaczen pozostalych hubow.

   - W dzialajacym systemie jedynym zrodlem prawdy jest `hubs.local_name` w DB.
     Manifest nie moze zmieniac `code1`; moze je jedynie odtworzyc podczas
     kontrolowanego bootstrapu calkowicie pustej DB.

2. Licznik worka:

   - Ustalenie: ciagly rollover (modulo), bez resetu czasowego.

3. Spojnosc z edytorem:

   - Ustalenie: na teraz wystarczy przy dodaniu huba (nie po kazdym kliknieciu linii).



## 13. Plan implementacji (kolejnosc)

1. Migracja do DB (SQLite pilot) jako warstwa zrodla prawdy.

2. Dodac walidator nazw hubow + endpoint.

3. Dodac staly przydzial `code1` oraz wyjatkowy modul recoloring 2-hop
   (lokalny, atomowy i wymagajacy jawnego potwierdzenia).

4. Spiac wyjatkowy recoloring tylko z potwierdzonym trybem `hub_add` w Hub
   Editorze.

5. Kontrakt typu opakowania jako kolejny etap po stabilizacji DB.

6. Dodac audit + offline conflict handling.

7. Testy E2E:

   - add hub bez zmiany istniejacych kodow, delete hub bez recoloringu,
     odrzucenie konfliktowego linku, jawny recoloring awaryjny oraz generowanie
     kodu paczki/worka.



## 14. Kryteria akceptacji

- Kazdy nowy hub po walidacji dostaje poprawny `GlobalHubID` i `LocalHubMark`.

- Zwykle dodanie lub usuniecie huba nie zmienia `LocalHubMark` zadnego
  istniejacego huba.

- Po zmianie polaczen nie ma konfliktu znakow w 2-hop i nie wystepuje
  automatyczny recoloring.

- Wyjatkowy recoloring bez jawnego potwierdzenia, listy `before`/`after`
  i wpisu audit jest niedozwolony.

- Kod paczki ma zawsze 4 znaki i poprawny podzial bitow (`HubID+Direction+Counter`).

- Typ i status opakowania pozostają poprawne po przejściu przez kolejne huby.
  Kod W/V jest generowany dla rekordu danego odcinka, a kod S zachowuje bazę
  inventory i może rozrastać się o znaki tranzytu.

- Operacje dzialaja offline z poprawnym dosynchronizowaniem.



## 17. Ustalenia finalne (zatwierdzone)

- Standard kodowania: `RFC 4648 Base32`.

- `ParcelCode` ma zawsze 4 znaki (20 bit).

- Licznik paczek:

  - per `(HubID, Direction)`,

  - modulo 256 (auto reset po 255).

- `code4`:

  - unikalny tylko dla paczek aktywnych,

  - moze sie powtarzac w historii.

- Trwala identyfikacja paczki:

  - `package_id` (`UUID`/`ULID`) jako klucz glowny.

- `ParcelCode`:

  - tylko 4 znaki operacyjne (bez dodatkowego znaku na paczce),

  - szczegoly i dopasowanie realizuje baza danych.



## 18. Do przemyslenia (ryzyka operacyjne)

- Zamykanie wielu hubow moze teoretycznie tworzyc trudne przypadki tras i konfliktow oznaczen na dalekich odcinkach.

- Hipoteza robocza: im mniej aktywnych hubow, tym mniejsze ryzyko przypadkowego powtorzenia lokalnych znacznikow w sasiedztwie.

- Decyzja: obserwujemy to na danych produkcyjnych/pilotowych; jesli pojawi sie realny konflikt, dodamy dodatkowy walidator okresowy dla calej mapy.



## 15. Plan dzialania (RFC 4648)

### Etap 0: Migracja DB (najpierw)

- Cel: przeniesc stan runtime z RAM do SQLite jako zrodlo prawdy.

- Zakres tabel MVP:

  - `hubs`, `hub_links`, `packages`, `bags`, `audit_log`.

- Zakres migracji z obecnego kodu:

  - `HUB_DATABASE` -> `hubs` + `hub_links`,

  - `blocked_links` -> `hub_links.blocked`,

  - `DELIVERED_ARCHIVE` -> `audit_log`/`packages_history`,

  - dane operacyjne paczek/workow -> `packages` i `bags`.

- Warstwa dostepu:

  - repozytoria DB (SQLAlchemy) zamiast bezposrednich odczytow ze slownikow globalnych.

- Akceptacja etapu:

  - restart serwera nie gubi blokad linii i stanu topologii.



### Etap 1: Zamrozenie standardu kodow

- Ustalic i zapisac w kodzie jeden alfabet: `ABCDEFGHIJKLMNOPQRSTUVWXYZ234567`.

- Usunac wszystkie alternatywne mapowania.

- Dodac testy jednostkowe: encode/decode, walidacja znaku spoza `A-Z2-7`.



### Etap 2: Walidator i normalizacja wejscia

- Backend: funkcja `normalize_base32_input()`:

  - `upper()`, usuwanie spacji i separatorow,

  - regex `^[A-Z2-7]+$`.

- API bledow walidacji (czytelne komunikaty dla UI).

- Frontend: klawiatura ekranowa tylko `A-Z2-7`.



### Etap 3: Generowanie kodu paczki (po DB)

- Dla kazdej paczki wyliczac:

  - `GG` = `GlobalHubID` celu (RFC 4648),

  - `D` = sektor kierunku 0..7.

- Zapisywac w bazie:

  - `parcel_code`,

  - `package_uuid`,

  - `checksum` techniczny.



### Etap 4: Generowanie i obsluga kodu worka (po DB)

- Start worka: `LocalHubMark + Counter`.

- Przy kazdym tranzycie: dopisanie `LocalHubMark` huba do stringu.

- Walidacja append-only (brak modyfikacji poprzednich znakow).

- Unikalnosc runtime worka przez `(start_hub, counter, open_window, status=open)`.



### Etap 5: Sasiedztwo i recoloring pod Hub Editor

- Po `add/remove link`:

  - zwalidowac konflikt `LocalHubMark` przed zapisem,

  - odrzucic konfliktowy link bez zmiany istniejacych oznaczen,

  - po sukcesie przeliczyc routing bez recoloringu.

- Po `add hub` przydzielic znak tylko nowemu hubowi. Wyjatkowy, lokalny
  recoloring 2-hop wolno uruchomic dopiero po wyczerpaniu 32 znakow i jawnym
  potwierdzeniu operatora.

- Po `delete hub` nie zmieniac oznaczen pozostalych hubow.

- Emitowac SSE diff `changed_links`; `recolored_hubs` jest niepuste tylko po
  potwierdzonym recoloringu awaryjnym.



### Etap 6: Walidator nazw hubow

- Endpoint `POST /api/hubs/validate_name`.

- Reguly:

  - regex `^[A-Z][A-Z0-9_]{1,15}$`,

  - unikalnosc case-insensitive,

  - blacklist nazw zarezerwowanych.



### Etap 7: Offline-first i audit

- Bufor eventow po stronie aplikacji magazyniera.

- Idempotency key + FIFO replay po reconnect.

- `AuditLog` dla kazdej operacji kodowej i topologicznej.



### Etap 8: Testy i rollout

- Unit: walidacja RFC, checksum, parser kodow.

- Integracja: hub editor -> staly przydzial -> opcjonalny potwierdzony
  recoloring awaryjny -> generowanie kodow.

- E2E: nadanie paczki, tranzyt worka, dostawa, sync offline.

- Rollout etapowy:

  - pilot 2-3 huby,

  - walidacja KPI bledow wpisu,

  - rozszerzenie na cala siec.



## 16. Format transferu danych (decyzja robocza)

- API HTTP i SSE: JSON (domyslnie).

- Powod:

  - obecny Flask + frontend juz pracuja na JSON,

  - latwa diagnostyka logow i payloadow,

  - nizszy koszt wdrozenia na etapie migracji DB.

- Dopuszczalny etap pozniejszy:

  - kompresja HTTP (`gzip`) oraz ewentualnie MsgPack/Protobuf tylko dla kanalu wewnetrznego, jesli JSON stanie sie bottleneckiem.

- Na teraz: trzymamy JSON jako jedyny format transferu.



## 17. Mechanizm Kodowania i Dekodowania (procedura operacyjna)

### 17.0 Kod huba `GlobalHubID` (2 znaki, RFC 4648)

- Cel: deterministyczny kod 2-znakowy dla kazdego huba, zgodny z modelem `8 x 8 x 8`.

- Alfabet: `ABCDEFGHIJKLMNOPQRSTUVWXYZ234567`.

- Wejscie:

  - `sector` (0..7),

  - `zone` (0..7),

  - `slot` (0..7, pierwszy wolny w danym polu; brak losowania).

- Wyliczenie `HubID` (9 bit):

  - `HubID = sector * 64 + zone * 8 + slot`.

- Kodowanie `HubID` do `GlobalHubID`:

  - `g0 = (HubID >> 5) & 31`,

  - `g1 = HubID & 31`,

  - wynik = `ALPH[g0] + ALPH[g1]`.

- Dekodowanie `GlobalHubID -> HubID`:

  - `HubID = (val(code2[0]) << 5) | val(code2[1])`.

- Dekodowanie `HubID -> (sector, zone, slot)`:

  - `sector = HubID // 64`,

  - `zone = (HubID % 64) // 8`,

  - `slot = HubID % 8`.

- Regula pojemnosci pola:

  - kazde pole `(sector, zone)` ma max `8` hubow (`slot 0..7`),

  - dla strefy zewnetrznej (po 7. okregu, obszar do nieskonczonosci) takze max `8`.



### 17.1 Kod paczki `ParcelCode` (4 znaki, RFC 4648)

- Alfabet: `ABCDEFGHIJKLMNOPQRSTUVWXYZ234567`.

- Wejscie:

  - `HubID` (9 bit, 0..511),

  - `Direction` (3 bit, 0..7),

  - `Counter` (8 bit, 0..255, per `(HubID, Direction)`).

- Pakowanie bitowe (20 bit):

  - `payload = (HubID << 11) | (Direction << 8) | Counter`.

- Kodowanie do 4 znakow Base32:

  - `c0 = (payload >> 15) & 31`,

  - `c1 = (payload >> 10) & 31`,

  - `c2 = (payload >> 5) & 31`,

  - `c3 = payload & 31`,

  - wynik = `ALPH[c0] + ALPH[c1] + ALPH[c2] + ALPH[c3]`.

- Dekodowanie:

  - zamien 4 znaki na 4 wartosci 0..31 i odtworz `payload`,

  - `HubID = (payload >> 11) & 0x1FF`,

  - `Direction = (payload >> 8) & 0x07`,

  - `Counter = payload & 0xFF`.

- Rollover licznika:

  - `next_counter = (current + 1) % 256`.

- Unikalnosc:

  - `code4` musi byc unikalny tylko dla paczek aktywnych,

  - historia moze zawierac powtorzenia `code4`,

  - trwala identyfikacja po `package_id` (`UUID`/`ULID`).



### 17.2 Identyfikacja opakowania — aktualny kontrakt

- Nowy W i V otrzymują kod przy utworzeniu w końcowej transakcji nadania.
- `container_type` jest podstawowym rozróżnieniem: fizyczny W, opakowanie
  wirtualne V albo fizyczna S; format kodu W/V jest wspólny.
- Kod W/V używa `LocalHubMark` źródła i celu oraz zmiennego licznika Code32.
- S używa pełnego kodu bazowego inventory o długości co najmniej trzech znaków
  i znaków trasy; `bags.inventory_id` zachowuje jej jednoznaczną tożsamość.
- Status, kierunek i lista powiązanych paczek opisują bieżący przepływ.



### 17.3 Normalizacja wejscia i walidacja

- `upper()`.

- usuniecie separatorow (spacja, `-`, `.`).

- regex: `^[A-Z2-7]+$`.

- odrzucenie znaku spoza RFC 4648.

- opcjonalna walidacja `checksum` po stronie serwera.



## 18. Historia Zmian Mechanizmu Kodow

- 2026-03-06:

  - ustalono standard `RFC 4648 Base32` jako jedyne zrodlo prawdy.

  - potwierdzono `ParcelCode` = 4 znaki (20 bit).

  - potwierdzono licznik modulo 256 (auto-reset po 255).

  - potwierdzono, ze `code4` moze sie powtarzac w historii, ale nie w aktywnym obiegu.

- 2026-03-07:

  - przeniesiono pelna specyfikacje z `logistc_code.md` do PRD (`kenya_courier_system.md`).

  - doprecyzowano operacyjna procedura kodowania/dekodowania bit-po-bicie.

  - doprecyzowano zasady walidacji wejscia i formatow runtime (`ParcelCode`, `BagCode`, `GlobalHubID`, `LocalHubMark`).



## 19. Addendum (2026-03-10) - Wallet Strategy + Ledger Integrity + Courier Hierarchy



### 19.1 Strategia wallet (kierunek pracy)

- Docelowo finanse maja byc oparte o prawdziwe konta (wallet ledger), ale logika operacyjna paczek pozostaje oddzielna.

- Konta:

  - System/Treasury (konto firmy).

  - Hub operational wallet (KES/VKES).

  - Staff wallets: manager / worker / courier.

  - Parcel piggybank = **logiczny subkonto** (bez osobnego keypair), tylko do ksiegowania wydatkow paczki.

- Przelewy:

  - Hub finansuje paczke (debet hub -> zapis w ledgerze paczki).

  - Payouty dla kuriera/managera/workerow ida z konta huba, a nie z "osobnego portfela paczki".

  - Historia paczki jest logiem ksiegowym i dowodem rozliczen.

- Cel: jedna prawda o stanie finansow (ledger), a paczka jako kontrolowany "nosnik" i audyt.



### 19.2 Wpisy w ledgerze i podpisy (SHA256/HMAC)

Kazdy wpis finansowy zapisujemy jako JSON + lancuch hashy:

```

{

  "package_id": "ABYB",

  "seq": 12,

  "event_time": "2026-03-08T17:18:47",

  "entry_text": "[2026-03-08 17:18:47] [ABYB] Firma ... | 40.00 VKES",

  "amount": 40.0,

  "prev_hash": "....",

  "entry_hash": "....",

  "hmac_signature": "....",

  "fingerprint": "121lkvuer48"

}

```

Zasady:

- `entry_hash` = SHA256 z kanonicznego payloadu (wszystkie pola bez hashy).

- `prev_hash` = hash poprzedniego wpisu (lancuch nienaruszalnosci).

- `hmac_signature` = HMAC-SHA256(entry_hash + prev_hash) kluczem serwera (tamper-evidence).

- `fingerprint` = krotki identyfikator do UI (np. pierwsze 8-12 znakow z hash).

- Opcjonalnie: `wallet_signatures` (podpis per `account_id` dla wpisu) zapisywany w osobnej tabeli z `key_id`.

- Flagi:

  - `WALLET_SIGNATURES=1` wlacza zapis podpisow per konto (`account_id`).

  - `WALLET_SIGNATURES_REQUIRE_KEY=1` wymusza istnienie klucza (brak klucza = blad zapisu).

  - `WALLET_SIGNATURES_VERIFY=1` wlacza weryfikacje podpisow w audycie.



Audyt:

- przejscie od pierwszego wpisu, sprawdzanie `entry_hash` i `prev_hash`.

- weryfikacja HMAC dla kazdego wpisu.

- opcjonalna weryfikacja `wallet_signatures` (gdy `WALLET_SIGNATURES_VERIFY=1`).

- rozbieznosc = brak spojnosci lub edycja historii.



### 19.3 Klucze i bezpieczenstwo

- Klucz HMAC przechowywany w zmiennej srodowiskowej (np. `VKES_HMAC_KEY`).

- Klucz nie trafia do DB ani do plikow z danymi.

- Rotacja klucza wymaga nowego `key_id` w wpisach lub migracji podpisow.

- Opcjonalny vault kluczy wallet:

  - `wallet_keys` przechowuje klucze per aktywne konto (`wallet_accounts.account_id`), zaszyfrowane AES-256-GCM.

  - KEK w zmiennej `WALLET_KEK` (nigdy w DB).

  - `wallet_signatures` przechowuje podpis + `key_id` dla kazdego wpisu.



### 19.4 Hierarchia prowizji dla kurierow

- Kurierzy maja taki sam model payout_pct jak pracownicy (intake/transfer/delivery/outtake).

- Podzial: owner_pct -> manager_rate -> courier_rate.

- Roznice (system/hub cut) logowane w historii paczki jako osobne wpisy.

- Kurier jest przypisany do huba i managera (odpowiedzialnosc + rozliczenia).



### 19.5 Jeden manifest (hub_manifest.yaml)

- Kurierzy sa zarzadzani przez huby i zapisani pod managerami w `hub_manifest.yaml`.

- `courier_manifest.yaml` jest usuniety (jeden manifest = jedna prawda).

- Sync kurierow idzie przez `config_manifest_sync.py` i `hub_staff` w DB.



### 19.6 Zmiany z dzisiaj (podsumowanie)

- Aktualizacja testow do nowych nazw hubow (dynamicznie z DB).

- Usuniecie `test_api.py` (reczny test HTTP niepotrzebny w repo).

- Courier payout split wdrozony w runtime (logi paczek zawieraja rozbicie).



### 19.7 Key management plan (Phase 7)

- Current: klucze wallet sa opcjonalne i wylaczone domyslnie.

- Gdy wlaczone:

  - `wallet_keys` przechowuje zaszyfrowane klucze per aktywne konto (`account_id`) (AES-256-GCM).

  - KEK w env (`WALLET_KEK`) lub docelowo w KMS, nigdy w DB.

  - `wallet_signatures` zawiera `key_id` + podpis dla kazdego wpisu.

- Rotation:

  - Generate new key_id, mark old as "verify-only".

  - New signatures use new key_id; old entries remain verifiable.

  - Optional re-sign/backfill only during controlled maintenance windows.



### 19.8 Rollout plan (Phase 9)

1. Keep `ledger_dual_write=1`, `ledger_read=0` for all hubs.

2. Run `ledger_compare.py` + `ledger_audit.py` daily; require zero diffs for N days.

3. Pilot 1-2 hubs (or test env) with `ledger_read=1` and monitor.

4. After stability window, switch `ledger_read=1` globally.

5. Usunac runtime logi (`hub.vkes_history` / `worker.action_log`) jako zrodlo prawdy.



### 19.9 Operacje (audit/compare)

- Szybki audit CLI:

  - `python ledger_audit.py` (weryfikacja hash + HMAC).

  - `WALLET_SIGNATURES_VERIFY=1 python ledger_audit.py` (dodatkowo podpisy per konto).

- Porownanie runtime vs ledger:

  - `python ledger_compare.py --min-diff 0.01` (VKES domyslnie).

- Panel terminalowy:

  - `Admin Sync` -> `[8] Ledger audit`, `[9] Ledger compare`, `[10] Seed wallet keys`, `[11] Seed runtime state`, `[12] Seed ledger zero`.

- Gdy wlaczysz `wallet_signatures=1`:

  - wymagany `WALLET_KEK` i klucze w `wallet_keys` dla kazdego aktywnego `wallet_accounts.account_id`.

  - przy `wallet_signatures_require_key=1` brak klucza = blad zapisu.

  - klucze generuj narzedziem: `python wallet_seed_keys.py --db kenya_courier.db`.
  - `wallet_keys.owner_id` jest nazwa legacy, ale w aktualnym modelu zawiera `account_id`; `wallet_keys.key_scope_type='account'`, `wallet_keys.key_scope_id=account_id`.

  - generacja KEK (dev): `python -c "import os,base64; print(base64.b64encode(os.urandom(32)).decode())"`.

  - runtime seed (gdy brak runtime rows): `python seed_runtime_state.py --db kenya_courier.db`.

  - ledger seed (gdy brak ledger entries): `python ledger_seed.py --db kenya_courier.db`.



### 19.10 Startup checklist (env)

- Wymagane przy zapisie do ledgera:

  - `VKES_HMAC_KEY` (HMAC dla chain).

  - `WALLET_KEK` gdy `wallet_signatures=1` (AES‑GCM do kluczy).

- Przy `wallet_signatures_require_key=1` musza istniec aktywne klucze w `wallet_keys`

  (zrob `wallet_seed_keys.py`).

- System loguje ostrzezenia przy starcie, gdy brakuje tych zmiennych.

- `start.ps1` automatycznie laduje `.env` z katalogu projektu (lokalne dev).



### 19.11 Ledger jako jedyne zrodlo prawdy (runtime logi OFF)

- Gdy `ledger_read=1`, system nie dopisuje nowych wpisow do:

  - `hub.kes_history`, `hub.vkes_history`

- (usuniete) `worker/manager/courier.action_log`

- Te listy staja sie tylko legacy view (jezeli `ledger_read=0`).

- `financial_audit.py` w trybie `ledger_read=1` korzysta z `wallet_ledger` zamiast z runtime logow.

- W trybie `ledger_read=1` UI pokazuje tylko historie z ledgera (runtime logi ukryte).



### 19.12 Checklist wdrozenia (scalone z task2.md)

- Hub Topology Editor:

  - fullscreen, zoom/pan, drag hub, add/delete, block link.

  - ring editor (7 okregow), walidacja odleglosci, SSE push po zmianach.

  - API: add/move/delete/rename, toggle link, hub_editor/rings.

- Rename/Delete hub:

  - transakcje `BEGIN IMMEDIATE`, rollback on error.

  - reload z DB jako single source of truth.

  - testy crash-in-middle + regresja trasowania.

- Runtime vs manifest:

  - `hub_manifest.yaml` + `config.yaml` = pliki sterujace (konfiguracja).

  - DB = zrodlo prawdy dla stanu runtime (worki/paczki/stany).

  - Sync jest dwukierunkowy i opiera sie o `sync_meta` w obu plikach YAML.

  - Priorytet metadanych: **version** (wyzsza wygrywa), a przy remisie decyduje **last_synced_utc**.

  - Zasady sync:

    1. **Import (plik -> DB)**: gdy `sync_meta` pliku jest nowsze od DB.

    2. **Export (DB -> plik)**: gdy `sync_meta` DB jest nowsze od pliku.

    3. **Brak meta**: traktuj plik jako nowszy (pierwszy import).

  - Przy starcie sync wybiera nowsze zrodlo (DB lub plik); przy remisie wygrywa DB.

  - Sync wykonujemy tylko na starcie lub jawnie (Admin / API).

  - Po kazdej operacji sync `sync_meta` jest aktualizowane w pliku i w DB.

  - Endpoint exportu: `POST /api/admin/export_sync` (DB -> YAML).

- Ledger migration:

  - schema + hash chain + HMAC + fingerprint.

  - dual-write (runtime + ledger) -> ledger_read.

  - audit/compare jako warunek przejscia.

  - usuniecie runtime logow jako zrodla prawdy.



### 19.13 End-to-end przeplyw finansowy (Wodospad oplat)

W systemie caly kaskadowy podzial zyskow jest zapisany pod parametrem `payout_pct`. W pliku konfiguracji YAML ma on odrebne znaczenie w zaleznosci od galezi - inne dla Wlasciciela Huba, a inne jako ulamek przypisany do samego pracownika wewnatrz Huba. Dziala to zawsze kaskadowo jako dwojstopniowy Wodospad Oplat, eliminujacy reczne poprawki po stawkach.



1. **Platnosc Nadawcy / Finansowanie**:

   - wpis poczatkowy do ledgera. Wirtualne srodki zasilaja dany pakiet na start trasy poprzez pobrany debet od startowego huba na rzecz podanej waluty VKES/KES.

   - wpis do `wallet_ledger` z `entry_hash`, `prev_hash`, `hmac_signature`.



2. **Poziom pierwszy oplat: "Lokalny Hub <-> Franczyza/System" (`owner.payout_pct`)**:

   - Skonfigurowany na korzeniowym poziomie definicji samego Huba (`owner.payout_pct` w `hub_manifest.yaml`).

   - Podstawowa oplata pobrana za obsluge paczki w danym punkcie (czyli np. kwota `delivery_fee` = 30 VKES) dzieli sie procentowo wg tego mnoznika na dwie glowne czesci:

     - **„System Cut” (Prowizja Systemu):** Jesli hub w konfigu ma przypisane np. 80% zysku ze swojej prowizji (`owner.payout_pct: 80.0`), to System od razu zdejmuje nadrzedne 20% (6 VKES). Zostaje to bezposrednio zalogowane jako samodzielny zapis transferu w `hub_fee_system` - bezposrednio na wspolny bilans calej Firmy Matki (Centrali).

     - **„After Owner” (Pula dla Huba):** Uratowana na hubie resztkowa prowizja to pozostale 80% pierwotnej obnizki wartosci (24 VKES). Ta wlasnie baza budzetu dopiero teraz splywa bezszmerowo w dol na etap pracowniczy.



3. **Poziom drugi oplat: "Zysk Huba <-> Personel" (`staff.payout_pct`)**:

   - Drugi stopien ciec pod przypisana kwote pracownika skladowany jest bezposrednio w zagniezdzonej wlasciwosci wewnatrz tablicy konfiguracyjnej z rozroznieniem na akcje logistyki (`staff: payout_pct: intake: 50, delivery: 50...`) - przypiete na sztywno do loginow dla uzytkownika skanera stacji.

   - Pula *After Ownera* z lokalu (czyli do dyspozycji 24 VKES ucieknione ze stepu 2) zostaje tutaj obnizona procentowo jeszcze raz wyliczeniowo, wedlug ulamka zaleznego od operacji (np. wg stawki intake = 50%).

   - Tzw. pula resztek ulega ostatecznemu rozdzieleniu miedzy pracownikow a rezerwe punktu:

     - **Dzialka Bezposrednia Pracownika (`hub_fee_worker`):** Indywidualna prowizyjna procentowa wyplata bezposrednia uwarunkowana logiem operacji dla personelu. Wyladowana u pracownika skanujacego na poczet bilansu przypisanego portfelu VKES.

     - **Dzialka Kierownicza (`hub_fee_manager`):** Uwaga! Jesli do regionu operacji przypisany jest manager rejonu, udzial pracownika oddaje takze odprysk menedzerski. Czesc sumy logiki stacji wedruje na portfel VKES nadzorujacego operacje lidera.

     - **Zysk Pasywny Huba (`hub_fee_hub_vkes`):** Absolutnie ostateczna kwota, odciazona od wszystkich personolowych i szefoskich potracen. Wynik operacji zostaje zrzucony jako zysk netto lokalu w rejestr bilansu kasy ogolnej lokalu w sekcje `HUB_VKES`.



Dzieki tak wygenerowanym cieciom, pojedyncza fizyczna akcja skanera (np. kurierskie wydanie) w systemie powoduje materializacje 2 az do 4 precyzyjnych, idealnie zbilansowanych do 100% kwoty pierwotnej malutkich transferow zapisanych z wpisem z udzialu w nowoprojektowanym ogromnym logu zdarzen w `wallet_ledger`. Kazda dzialka ma swoj wlasny logiczny subrachunek beneficjenta.



5. **Audyt**:

   - weryfikacja lancucha hashy i HMAC na calej osi czasu.



### 19.14 Bezpieczenstwo przelewow i gwarancje

- **Tamper-evidence**: lancuch `prev_hash` + `entry_hash` blokuje edycje historii.

- **Autentycznosc**: `hmac_signature` podpisany kluczem serwera (env).

- **Podpis konta**: `wallet_signatures` per `account_id` (klucze kont zapisane w `wallet_keys`, zaszyfrowane `WALLET_KEK`).

- **Gwarancje**:

  - spojnosc historii i mozliwosc audytu.

  - pojedyncze zrodlo prawdy (ledger).

  - czytelne, filtrowalne wpisy dla UI.

- **Ograniczenia**:

  - to nie blockchain publiczny; autoryzacja opiera sie o klucze serwera i polityke dostepu.

  - cofanie to zawsze **compensating entry**, nie usuwanie historii.



### 19.15 Odtworzenie systemu z PRD (skrot procesu)

1. **Konfiguracja**: `config.yaml` + `hub_manifest.yaml` (statyczne dane).

2. **DB init**: utworzenie schematu, import manifestu, seed runtime.

3. **Sekrety**: ustaw `VKES_HMAC_KEY`, opcjonalnie `WALLET_KEK`.

4. **Flagi**: start na `ledger_dual_write=1`, `ledger_read=0`.

5. **Audyt**: `ledger_audit.py` + `ledger_compare.py` bez roznic.

6. **Przelaczenie**: `ledger_read=1`, runtime logi OFF.

7. **Operacje**: dalej tylko ledger jako zrodlo prawdy.



### 19.16 Historia decyzji (skrot rozmow/ewolucji)

- 2026-03-08: decyzja o ledgerze jako docelowym zrodle prawdy + HMAC/chain.

- 2026-03-09: rozdzielenie logiki operacyjnej paczek i finansow (subkonto logiczne paczki).

- 2026-03-10: usuniecie runtime logow jako zrodla prawdy, jeden manifest, sync na zadanie.



## 20. Historyczne decyzje z `design_decisions.md` (2026-03-10)



Ponizsze punkty przeniesione z `design_decisions.md`, aby PRD bylo jedynym zrodlem prawdy:



1. **Admin‑Controlled Lifecycle**

   - Data: 2026-03-10 (przeniesione z design_decisions.md)

   - Tylko funkcje Admin/POC (np. `create_and_add_parcel`) generuja i wprowadzaja paczki do sieci.

   - Huby sa pasywnymi wezlami magazynowymi i przetwarzajacymi.



2. **Temporary “50 marker” (prowizyjny placeholder)**

   - Data: 2026-03-10 (przeniesione z design_decisions.md)

   - W wielu miejscach kodu uzywane jest `50` jako tymczasowa prowizja huba.

   - Cel: szybkie testy finansowe bez pelnej konfiguracji stawek.

   - Docelowo: pelne zastapienie dynamicznymi lookupami stawek.



3. **Auto‑Login of Workers (tryb testowy)**

   - Data: 2026-03-10 (przeniesione z design_decisions.md)

   - Nowo utworzone huby moga automatycznie logowac pracownikow.

   - W produkcji logowanie ma byc manualne.

   - PIN-y w manifest/DB (manualny login):

     - manager: `AA1`, `BA1`, ... (code2 + `1`)

     - worker:  `AA2`, `BA2`, ... (code2 + `2`)

   - TUI: po wyborze opcji „Panel” system prosi o PIN i automatycznie wybiera hub powiazany z PIN-em.



4. **Legacy Greedy Router (benchmark)**

   - Data: 2026-03-10 (przeniesione z design_decisions.md)

   - Zachowany tylko do porownan z obecnym routingiem (Dijkstra/Yen).

   - Nie jest aktywnym mechanizmem routingu.



5. **Monitoring Visibility (SHOW_ALL_HUBS)**

   - Data: 2026-03-10 (przeniesione z design_decisions.md)

   - Domyslnie `network_status` filtruje puste huby dla czytelnosci logow.

   - Flaga `SHOW_ALL_HUBS` pozwala wymusic pelny widok.



## 19.17 Addendum (2026-03-12) - Package Events Format v2

- `event_type` removed from `package_events`.

- Classification: `amount = NULL` => tracking, `amount != NULL` => finance.

- `event_key` is the stable action key and is included in the hash payload.

- `package_events` nie przechowuje `entry_text`. Dane zdarzenia sa w
  `event_key` i `metadata_json`, a tekst dla UI jest tworzony przy odczycie.

- Czas zdarzenia przechowuje jedna kolumna `db_ts`; nie ma docelowej kolumny
  `event_time`.

- Hash chain remains per package (seq is single chain per package).

- Docs updated: `event_entry_formats.md`, `package_event_catalog.md`, `tak wyglada zapis teraz zdarzen.md`.



## 19.19 Addendum (2026-03-16) - Walidacje przed `payment_creation`

- Przed wygenerowaniem wpisu `payment_creation` wykonywane sa walidacje:

  - poprawnosc paczki (dane wejsciowe, masa, route),

  - stan i blokady hubow (np. hub wylaczony / zablokowany),

  - dostepnosc srodkow (KES/VKES) zgodnie z trybem platnosci.

- Walidacje te musza wykonac sie **przed** zapisem tracking/finanse, aby nie powstawaly bledne wpisy.



## 19.20 Addendum (2026-03-22) - Tracking/Finanse + Nowa logika zapisu do DB



### 19.20.1 Kolejnosc zdarzen (bez przeskokow)

`payment_creation` -> `intake` -> `courier` -> `sorting/transfer` -> `outtake` -> `delivery` -> `check_balance`



Zasady ogolne:

1. `outtake` tylko w ostatnim hubie.

2. Po `courier` zawsze jest `sorting` lub `transfer` (zalezne od sealed).

3. `package_events` zawiera pelna historie paczki (tracking + potrzebne finanse).  

   Jesli zdarzenie trackingowe nie ma powiazania finansowego, `amount` = NULL.

4. Przy `transfer` z `sealed`:

   - `hub_fee_standard = hub_fee_vkes` (np. 50),

   - `hub_fee_effective = 10` do podzialu w hubie,

   - roznica (`standard - 10`) trafia do SYSTEM jako `company_profit_transit_bonus`.



### 19.20.2 Szczegoly per krok

1. **payment_creation**

   - Tracking: pierwszy wpis w historii paczki (trasa, tryb platnosci, km, waga).

   - Finanse:

     - KES: gotowka trafia do huba (KES +), wpis w `wallet_ledger` z `event_key=kes_cre`, `from_owner=CASH`.

     - VKES: `wallet_ledger` zapisuje debit konta platnika i credit konta
       `VKES_<HUB>_OPERATING` pod wspolnym `finance_tx_group_id`.

     - Nie tworzy sie dodatkowego `package_events.payment_vkes_system`.
       Jedynym zdarzeniem otwierajacym budzet paczki jest `payment_creation`.
       Jego `metadata_json` przechowuje `balance`, `source`, `payer_id`,
       `payer_account_id` i `payment_intent_id`, jezeli dane sa dostepne.



2. **intake**

   - Tracking: `intake` po wybraniu worka (metadata zawiera `bag_id`).

   - `amount = -hub_fee` (obecnie 50 VKES).

   - W `wallet_ledger` powstaja wpisy splitu (system/hub/worker/manager).



3. **courier**

   - Tracking: `courier` / `courier_bonus`.

   - `amount = -p_share` (koszt wyplaty kuriera za odcinek).

   - W `wallet_ledger`: `courier_payout`, `courier_commission`, `courier_hub_vkes`, `courier_manager` (razem = p_share).



4. **sorting / transfer**

   - `sorting` gdy worek otwierany; `transfer` gdy sealed.

   - `amount = -hub_fee`.

   - W `wallet_ledger` wpisy splitu hub_fee (system/hub/worker/manager).



5. **outtake (ostatni hub)**

   - Tracking: `outtake` zapisuje przyjecie paczki w ostatnim hubie.

   - `amount = -30` (delivery_fee huba).

   - W `wallet_ledger` wpisy splitu dla outtake.



6. **delivery**

   - Tracking: `delivery` zapisuje wydanie paczki klientowi.

   - `amount = -20` (outtake_fee huba).

   - W `wallet_ledger` wpisy splitu dla delivery.



7. **company_profit_surplus (nadwyzka budzetu)**

   - **Skip-surplus** (przeskoki) liczymy tylko, gdy:

     - `decision.is_skip_job = True`

     - `route_changed_from_creation = False`

     - istnieja pominiete huby na trasie z kreacji (full_path)

   - Podstawa: `_reference_segment(full_path)` z `payment_creation`.

     `full_path` **nie jest aktualizowany po skipie**.

   - Definicje:

     - `ref_dist_km` ? dystans na oryginalnej trasie miedzy `from_hub` i `to_hub`

     - `skipped_hubs` ? liczba pominietych hubow (posrednich)

     - `expected_transport = min(km_rate, 10) * weight * ref_dist_km`

     - `expected_hubs = skipped_hubs * hub_fee`

     - `p_share` ? realna wyplata kuriera na tym odcinku

     - `p_bonus` ? bonus kuriera (jesli byl)

   - **Wzor skip-surplus**:

     - `skip_surplus = max(0, (expected_transport + expected_hubs) - (p_share + p_bonus))`

   - **Final leg** i **non-final** licza skip-surplus **tym samym wzorem**.

     Na final leg moze dodatkowo wystapic **flush-surplus**.

     Jesli skip-surplus zostal naliczony, flush-surplus liczony jest z aktualnego balansu po skipie (zeby nie podwoic odjec).

   - **Flush-surplus (miotla)**:

     - `flush_amount = max(0, balance - hub_fee)`

     - `max_payout = dist * 10 * weight`

     - `p_share = min(flush_amount, max_payout)`

     - `surplus = max(0, flush_amount - p_share)`

   - Zapis: `company_profit_surplus` (skip) i/lub `company_profit_surplus` (flush).

     Kolejnosc: tracking -> package_events -> ledger; surplus **po** wpisie kuriera.



   **Przyklady**

   - **AA -> DA, omija BA (final leg)**

     `expected_transport=253`, `expected_hubs=50`, `p_share=206`, `p_bonus=50`

     `skip_surplus = (253+50) - (206+50) = 47`

     Zapis: `company_profit_surplus=47` (skip) + ewentualnie flush na koncu.

   - **Normalna trasa (bez skipu, final leg)**

     `balance=120`, `hub_fee=20` -> `flush_amount=100`

     `max_payout=80` -> `p_share=80` -> `surplus=20`

     Zapis: **jeden** `company_profit_surplus=20` (flush-surplus).



8. **check_balance**

   - `check_balance` jest jedynym koncowym rozliczeniem salda paczki.
   - Stan poczatkowy paczki jest wyznaczany przez `payment_creation`, a kolejne
     koszty sa od niego odejmowane przez finansowe eventy trasy.
   - Po zakonczeniu paczki saldo runtime oraz saldo zapisane w koncowym evencie
     musi wynosic `0`, nigdy `NULL`.
   - Jezeli pozostaje nadwyzka `S > 0`, `check_balance.amount = -S`.
     Jest to korekta zabierajaca nadwyzke z puli huba i przekazujaca ja do
     systemu. Po tej operacji saldo paczki wynosi `0`.
   - Jezeli wystapi niedobor `S < 0`, `check_balance.amount = abs(S)`.
     Jest to dodatnia korekta diagnostyczna wskazujaca brak srodkow na trasie.
     System nie wykonuje automatycznej doplaty i nie zeruje niedoboru przez
     ukryty transfer budzetowy; przypadek wymaga audytu.
   - Jezeli saldo wynosi dokladnie `0`, zapisuje sie `check_balance.amount = 0`.
   - Nie tworzy sie osobnych eventow `company_profit_unsettled` ani
     `company_loss_correction` dla tego samego rozliczenia. `check_balance`
     zawiera korekte i jest jedynym koncowym sladem tej kontroli.

### 19.20.4 Kanoniczny model salda koncowego paczki

Ponizsza zasada jest nadrzedna wobec starszych opisow `check_balance`:

1. `payment_creation` otwiera saldo paczki kwota poczatkowa.
2. Eventy kosztowe zmniejszaja saldo paczki kwotami ujemnymi.
3. `check_balance` zawsze domyka saldo do `0` i zawsze ma niepuste pole
   `amount` (`-S`, `abs(S)` albo `0`).
4. Nadwyzka wraca z huba do systemu jako ujemna korekta `amount`.
5. Niedobor jest sygnalem audytowym jako dodatnia korekta `amount`; nie wolno
   go pokrywac automatyczna doplata podczas podrozy.
6. Rozliczenie musi zachowac powiazanie z `package_id`, `tx_group_id` oraz
   odpowiednim eventem `package_events`. Saldo po rozliczeniu nie moze byc
   `NULL` ani pozostac dodatnie lub ujemne.

Implementacja musi stosowac te same znaki w `package_events`, `payment_history`
i odpowiadajacym wpisie `wallet_ledger`. Obecne miejsca, ktore nadal uzywaja
`top_up_if_needed` albo zapisujacy `check_balance` bez `amount`, sa rozbieznoscia
do poprawy, a nie alternatywnym wariantem modelu.





### 19.20.3 Zasady zapisu do DB (spojnosc)

- `package_events` = pelna historia paczki (tracking + kluczowe zdarzenia finansowe).  

- `wallet_ledger` = szczegolowa historia finansowa (zrodlo prawdy dla sald).  

- Powiazanie: `fingerprint` = pelny `entry_hash` wpisu trackingowego.  

- `hub_code2` i `staff_id` zapisywane w `package_events`.  

- `staff_id` w trackingach:

  - dla zdarzen hubowych: pierwszy zalogowany pracownik huba,

  - dla zdarzenia `courier`: zawsze `courier.id`.



**Zasada `balance` w tracking (package_events)**  

- `package_events` zapisuje tylko tracking, nie payment history.  

- **Jednym zrodlem prawdy jest `parcel.balance` (runtime).**  

- `balance` w `metadata_json` jest zapisywany **bezposrednio z `parcel.balance`** przy kazdym wpisie trackingowym.  

- Sekwencyjne liczenie (`balance_prev + amount`) jest tylko awaryjne,

  gdy brak obiektu paczki w runtime (np. archiwum bez obiektu).





**Regula spojnosci ledger (ledger vs package_events)**  

- Dla kazdego wpisu finansowego powiazanego z paczka obowiazuje stala kolejnosc:  

  1) wyliczenie `entry_hash` w `package_events` (tracking),  

  2) zapis do `package_events`,  

  3) podpiecie tego `entry_hash` jako `fingerprint` wpisu ledgera,  

  4) wyliczenie `entry_hash` ledgera i zapis do `wallet_ledger`.  

- `wallet_ledger` **nigdy** nie szuka `fingerprint` w DB ani nie dopina go pozniej.  

- Wszystkie wpisy ledger z `package_id` musza przechodzic przez wrapper  

  `_ledger_append_pkg(...)` (nigdy bezposrednio przez `_ledger_append(...)`).  



### 19.20.4 Zmiany w metadata_json

- `package_events` zapisuje `metadata_json` jako glowna strukture danych (json‑only).

- `wallet_ledger` ma osobna kolumne `package_id`; `metadata_json` nie dubluje tego pola.

- `intake`/`outtake` maja `balance` na poczatku `metadata_json`.

- `courier`/`courier_bonus`: zamiast listy workow zapisujemy tylko `bag_id` i `container_type`.



### 19.20.5 Zmiany w transfer

- `transfer.from_id` = kod źródłowego opakowania (`bag_id`).

- `transfer.to_id` = kod docelowego rekordu opakowania po sealed-transit.



### 19.20.6 Zmiana trasy (job market)

- Gdy zlecenie zostaje podjete z gieldy, a trasa paczki zmienila sie wzgledem `payment_creation`,

  dodajemy tracking `route_change_job` z nowa trasa i km.



### 19.20.7 Przelacznik jezyka wpisow

- `event_lang` w `config.yaml` (default: `en`).

- `EVENT_LANG` w `.env` nadpisuje ustawienie z DB/config.



### 19.20.8 .env: klucze HMAC i tryb awaryjny

- `VKES_HMAC_KEY` i/lub `PACKAGE_HMAC_KEY` w `.env` sluza do podpisywania lancuchow (ledger + package_events).

- `ALLOW_NO_HMAC=1` pozwala uruchomic system bez kluczy (tryb awaryjny).

- Te zmienne wplywaja na zapis do `wallet_ledger` oraz hashe w `package_events`.



### 19.20.9 .env: pelna lista zmiennych uzywanych przez system

**Jezyk i logi**

- `EVENT_LANG` — jezyk `entry_text`.

- `SYSTEM_LOG_LANG` — jezyk logow systemowych.



**Baza**

- `KENYA_COURIER_DB` — sciezka do DB (Flask + skrypty).



**Bezpieczenstwo / podpisy / HMAC**

- `VKES_HMAC_KEY` — klucz HMAC (ledger + package_events).

- `PACKAGE_HMAC_KEY` — alternatywny klucz HMAC dla package_events.

- `ALLOW_NO_HMAC` — pozwala uruchomic bez klucza.

- `WALLET_KEK` — klucz do szyfrowania portfeli.

- `WALLET_SIGNATURES` — wymuszenie podpisow (ledger_service).

- `WALLET_SIGNATURES_REQUIRE_KEY` — wymagaj aktywnych kluczy.

- `WALLET_SIGNATURES_VERIFY` — weryfikacja podpisow.



**Runtime**

- `RUNTIME_AUTOSAVE` — wymuszenie autosave.



**Wallet**

- `WALLET_KEY_TYPE` — typ klucza (fallback z env).

- `WALLET_ENC_ALGO` — algorytm szyfrowania (fallback z env).



## 19.21 Addendum (2026-03-22) - Szczegolowy opis techniczny (implementacyjny)



### 19.21.1 Schemat DB (kluczowe tabele i pola)

**hubs**

- `name` (PK), `x`, `y`, `lat`, `lon`, `local_name`

- `is_active_manual`, `owner_payout_pct`, `delivery_fee`, `outtake_fee`, `allow_debit`

- `db_ts`



**hub_links**

- `a`, `b` (PK para), `blocked`, `road_distance`, `db_ts`



**hub_direction_counters**

- `hub_code2`, `direction` (PK para), `next_counter`, `db_ts`



**hub_bag_counters**

- `hub_name` (PK), `next_counter`, `db_ts`



**packages**

- `id` (PK), `dir_code`, `dir_counter`, `status`

- `current_hub_name`, `start_hub_name`, `end_hub_name`

- `weight`, `initial_value`, `balance`, `db_ts`



**package_events**

- `id` (PK), `package_id`, `seq`

- `event_key`, `hub_code2`, `staff_id`, `amount`, `metadata_json`

- `entry_hash`, `hmac_signature`, `db_ts`

- UNIQUE(`package_id`, `seq`), FK -> `packages(id)`

- Indeksy: `idx_package_events_pkg_seq`, `idx_package_events_time`



**system_logs**

- `id` (PK), `db_ts`, `level`, `message`, `data_json`

- Indeks: `idx_system_logs_ts`



**login_sessions**

- Wspolna tabela sesji dla `person`, `business` i `staff`.
- Jeden wiersz opisuje jedna sesje; wylogowanie aktualizuje ten sam wiersz.
- Kolumny identyfikacji: `session_id`, `actor_id`, `actor_type`, `person_id`, `staff_id`.
- Kolumny audytu: `source`, `auth_method`, `seq`, `login_at`, `logout_at`, `expires_at`.
- Jawny `status`: `active`, `logged_out`, `expired` albo `revoked`.
- `seq` jest tylko kolejnym numerem sesji aktora. Stan nie wynika z parzystosci.
- Dla jednego aktora moze istniec wiele aktywnych sesji do limitu
  domyslnego albo indywidualnego. Nowe logowanie nie uniewaznia poprzedniej
  sesji, jezeli pozostaje wolne miejsce.
- `ip_address` albo `ip_hash` zalezy od `system_settings.session_ip_mode`: `none`, `hash` lub `raw`. Domyslnie `hash`; nigdy nie wypelniamy obu pol jednoczesnie.
- Runtime TUI/Flask odtwarza `active_workers`, `logged_in_manager` i `logged_in_owner` wylacznie z aktywnych sesji `actor_type='staff'`.
- Sesje `person` i `business` nie aktywuja huba logistycznie.
- JWT Client API zawiera `jti=session_id`; wylogowanie zamyka rekord sesji i natychmiast uniewaznia JWT po stronie serwera.

Semantyka identyfikatorow:

- `session_id` jest kryptograficznie losowym identyfikatorem generowanym przez `secrets.token_urlsafe(24)`. Nie jest haslem, PIN-em ani tokenem autoryzujacym samodzielnie.
- Dla sesji prywatnej: `actor_type='person'`, `actor_id=person_id`, `person_id` wskazuje osobe, a `staff_id` ma wartosc `NULL`.
- Dla sesji biznesowej: `actor_type='business'`, `actor_id` wskazuje profil biznesowy, a `staff_id` ma wartosc `NULL`.
- Dla sesji pracowniczej: `actor_type='staff'`, `actor_id=staff_id`, `staff_id` wskazuje wybrany alias operacyjny, a `person_id` wskazuje osobe stojaca za tym aliasem.
- `source` okresla kanal, np. TUI, panel Flask albo `client_app`; `auth_method` okresla metode, np. PIN albo haslo.

Cykl zycia i zasady sesji:

- Logowanie tworzy rekord ze statusem `active`; poprawne wylogowanie aktualizuje ten sam rekord na `logged_out` i ustawia `logout_at`.
- Wygasniecie ustawia `expired`, a wymuszone zamkniecie poprzedniej sesji ustawia `revoked`.
- TUI nie uzywa JWT, ale nadal tworzy `session_id`, dzieki czemu logowanie pracownika ma jednoznaczny slad audytowy w DB.
- Dla `staff`, `person` i `business` dozwolone sa rownolegle sesje z wielu
  urzadzen. Kazda ma osobny `session_id` i moze zostac zamknieta niezaleznie.
- Domyslne limity wynosza: `person=1`, `business=10`, `staff=3`.
- Indywidualny limit `1-999`, tryb bez limitu albo powrot do wartosci
  domyslnej ustawia sam uzytkownik w `Setup -> Bezpieczenstwo` odpowiedniego
  panelu.
- `persons.session_limit_override` i `hub_staff.session_limit_override`
  przechowuja tylko odstepstwo: `NULL=domyslny`, `0=bez limitu`,
  `1-999=limit indywidualny`.
- Limit jest sprawdzany atomowo w tej samej transakcji `BEGIN IMMEDIATE`,
  ktora tworzy rekord sesji. Przekroczenie zwraca
  `409 session_limit_reached` bez zamykania aktywnych sesji.
- Zmniejszenie limitu ponizej biezacej liczby sesji nie wylogowuje urzadzen;
  blokuje jedynie kolejne logowania do czasu zwolnienia miejsca.
- Kazde uwierzytelnione wywolanie Client API sprawdza, czy sesja wskazana przez JWT nadal istnieje, ma status `active`, nie wygasla i nalezy do aktora z tokena.
- Zamkniecie przegladarki nie gwarantuje wywolania logout. Taka sesja pozostaje aktywna do `expires_at`, a nastepna walidacja lub cleanup oznacza ja jako `expired`.
- DB jest zrodlem prawdy o sesjach. Runtime przechowuje tylko stan potrzebny do pracy procesu i odtwarza role staff z aktywnych rekordow DB.

Zasady zapisu adresu IP:

- `none` nie zapisuje adresu IP.
- `hash` zapisuje tylko HMAC/SHA-256 adresu w `ip_hash`; jest to tryb domyslny.
- `raw` zapisuje surowy adres w `ip_address` i wymaga swiadomej decyzji prywatnosci oraz retencji danych.
- Implementacja korzysta z adresu polaczenia widzianego przez serwer. Nie ufa automatycznie naglowkom proxy przeslanym przez klienta.
- Tabela sluzy jako aktywny panel sesji i historia audytowa. Limitowanie
  urzadzen jest wdrozone; zdalne uniewaznianie wybranej cudzej sesji pozostaje
  osobnym przyszlym rozszerzeniem.



**Stan magazynowy huba**

- liczba anonimowych workow: `hubs.bag_stock`,
- skrzynki: `hub_box_inventory`,
- assety: `hub_asset_inventory`.



**hub_staff**

- PK (`hub_name`, `staff_id`)

- `role` = worker/manager/courier

- `full_name`, `pin`

- `rate_intake`, `rate_transfer`, `rate_delivery`, `rate_outtake`

- `hub_pct`, `manager_pct`, `manager_id`, `is_active`, `allow_debit`, `db_ts`



**hub_box_inventory**

- PK (`hub_name`, `box_id`)

- `pos`, `db_ts`



**bags**

- `id` (PK), `from_hub_name`, `to_hub_name`

- `status`, `is_box`, `weight`, `is_active`, `empty_bags_carried`, `db_ts`



**bag_parcels**

- PK (`bag_id`, `package_id`)
- `package_id` ma dodatkowo unikalny indeks. Jedna paczka moze byc
  aktualnie przypieta tylko do jednego opakowania; przeniesienie usuwa
  poprzednie czlonkostwo przed dodaniem nowego w tej samej transakcji.
  Istniejacy duplikat blokuje utworzenie indeksu przy starcie zamiast
  cicho wybierac jeden worek i tracic informacje o polozeniu paczki.

- `pos`, `db_ts`



**hub_ready_pickup**

- PK (`hub_name`, `package_id`)

- `pos`, `db_ts`



**wallet_ledger**

- `id` (PK), `owner_id`, `account_id`, `package_id`, `currency`, `seq`

- `amount`, `balance`

- `entry_hash`, `hmac_signature`, `hmac_key_id`

- `entry_text`, `event_key`, `metadata_json`, `from_owner_id`, `from_account_id`, `actor_id`, `fingerprint`, `intent_id`, `tx_group_id`, `db_ts`

- UNIQUE(`account_id`, `currency`, `seq`)

- Indeks: `idx_wallet_ledger_fingerprint`



**wallet_signatures**

- `id` (PK), `owner_id`, `account_id`, `currency`, `seq`, `key_id`, `signature`, `db_ts`

- UNIQUE(`account_id`, `currency`, `seq`)



**wallet_keys**

- `id` (PK), `owner_id`, `key_scope_type`, `key_scope_id`, `key_id`, `nonce`, `ciphertext`, `is_active`, `key_type`, `custody_mode`, `key_origin`, `public_key`, `encrypted_private_key`, `created_ts`, `db_ts`

- UNIQUE(`owner_id`, `key_id`)

- Aktualna zasada: `wallet_keys.owner_id` jest nazwa legacy subjectu i zawiera `wallet_accounts.account_id`; `key_scope_type='account'`, `key_scope_id=account_id`.



**clients**

- `id` (PK), `first_name`, `last_name`, `address`, `phone`, `email`, `initials`, `seq`, `default_hub`, `is_active`, `db_ts`



### 19.21.1A Zasady tworzenia ID (staff/client/hub)

**Hub ID**

- Globalny identyfikator huba to `hubs.name` (`GlobalHubID`, 2 znaki RFC 4648, opis w sekcji 17.0).
- `hubs.local_name` to oznaczenie lokalne (1 znak), nie zastepuje `GlobalHubID`.

**Staff ID (`hub_staff.staff_id`)**

- ID jest tworzone z inicjalow osoby + numeru sekwencyjnego.
- Funkcja tworzy prefix z danych osobowych (`_person_initials`) i dobiera kolejny wolny kod (`_next_person_code_for_initials`).
- Przed zapisem sprawdzana jest kolizja w DB (`hub_staff.staff_id`, case-insensitive).
- Wymaganie: `staff_id` musi byc unikalne globalnie w systemie.

**Client ID (`clients.id`)**

- Tworzone tym samym mechanizmem co staff: `initials + seq + checksum`.
- `checksum` jest obowiazkowy i jest ostatnim znakiem ID.
- `seq` jest kodowany do tokenu base32, a checksum liczony jest z calego body ID przed checksumem.
- W runtime/TUI generacja idzie przez `_finance_generate_client_id(...)`, ktore korzysta z `_person_initials` i `_next_person_code_for_initials`.
- Przy zapisie klienta (`upsert_client_details`) wykonywana jest walidacja kolizji.
- Wymaganie: `clients.id` musi byc unikalne globalnie (case-insensitive).

**Fallback**

- Gdy generator kodu nie moze byc uzyty (blad pomocniczej funkcji), system tworzy tymczasowy kod awaryjny i nadal wykonuje walidacje unikalnosci przed zapisem.
- Fallback jest trybem technicznym; docelowo preferowana jest standardowa sciezka `initials + seq`.
**app_settings**

- `key` (PK), `value`, `db_ts`



### 19.21.2 Routing (dokladne reguly)

**Sasiedzi (get_neighbors)**

- Tylko aktywne huby (gdy `theoretical=False`).

- Gdy `STRICT_BLOCKED_NEIGHBORS=1`, zablokowane linki nie sa w ogole wybierane jako sasiedzi.

- Sasiedzi wybierani sektorowo: dla kazdego sektora tylko najblizszy hub.

- Dodatkowy filtr: sasiedztwo musi byc wzajemne (reverse-sector check).



**Koszt krawedzi (edge_cost)**

- `dist_ab` = `road_distance` (jesli ustawione) albo dystans Euklidesowy.

- Bazowy koszt: `(dist_ab * 10) + (hub_b.base_commission * 1.2)`.

- Kary:

  - Przeladowany hub: +200 gdy `len(bags) >= max_bags * soft_limit`.

  - Niska ocena: `(3.0 - rating) * 10`.

  - `routing_weight` (stala kary).

  - Pusty hub (nie bedacy celem): +40.

- **Bonus Magnetyzm (konsolidacja)**: Trasa jest oceniana pod katem mozliwosci polaczenia z innymi workami jadacymi w tym samym sektorze.

  - Znizka wynosi bazowo **-80 pkt** dla wezlow posrednich (co fizycznie moze stakowac sie dwukrotnie na wejscie i wyjscie, jesli na hubie 'B' lezy worek = -160 pkt).

  - Worek pochodzacy ze stacji startowej (`is_start_edge=True` uaktywnia `bag_at_a=True`) automatycznie aplikuje pelna, podwojna znizke **-160 pkt**! Zabieg ten wyrownuje magnetyzm u zrodla, sprawiajac ze nowe paczki naturalnie i rownie agresywnie "sklejaja" swoje trasy od samego startu z paczkami podrozujacymi "obok", bez nienaturalnego blokowania na podstawie odleglosci.

- Finalny koszt: `max(10, int(cost))` (dla wartosci skonczonych).



**Skip-Hop (AssignmentEngine)**

- System automatycznie bada mozliwosc wykonania tzw. "przeskoku", omijajac wezel po drodze i jadac bezposrednio do kolejnego.

- Aktywator wymaga scislej rygorystycznosci (`Strict All-Match`): Znizke i szlak omijajacy mozna otrzymac WYLACZNIE wtedy, kiedy **absolutnie kazda** paczka w wirtualnym zlewku/worku ma punkt `hop2` jako kolejny wezel na swojej teoretycznej mapie. 

- Jesli jakakolwiek paczka w zaplombowanym worku ma punkt pobytu i wyladowania na lokalnym docelowym hubie (`next_h`), skip-hop zostaje automatycznie ZABLOKOWANY, pozwalajac na poprawny transport bez jezdzenia paczek na okolo. Decyzja nie zalezy juz od pierwszej paczki z brzegu w worku (`sample_parcel`), ale analizuje sumiennie cala jego zawartosc.

- **Wspolistnienie Workow (Ko-Konsolidacja na Biezacym Wezle):** Rozwiazuje problem "slepoty drugiego huba". Pakiety znajdujace sie dopiero na 1 punkcie (startowym) korzystaja swobodnie z agresywnego magnesu (-160) laczac drogi obok siebie. Jednak torba na wezle tranzytowym odcinala sie od wezla skupiajac sie tylko na mozliwosci skrotu. Gielda zostala wiec o to rozbudowana i precyzyjnie likwiduje oferte przeskoku, jesli fizycznie tuz obok kuriera na aktualnym peronie (np. *PA*), znajduje sie inny samotny worek pragnacy podjechac we to samo omijane dawniej miejsce, wymuszajac z nim wspolny rejs. Podobne sprawdzenie odbywa sie rowniez dla sasiedniego wezla, ktory kurier podjalby sie ominac (`next_h`).



**Dijkstra**

- Standardowy Dijkstra po sasiedach z `edge_cost`, respektuje `excluded_edges` i `excluded_nodes`.

- Zwraca trase obiektow hubow + koszt calkowity.



**Routing Strategy B (get_optimal_route)**

- Najpierw trasa Dijkstra.

- Jezeli brak "magnetyzmu" (konsolidacji), wybiera alternatywny sektor (lewy/prawy) i probuje trase startujaca z alternatywnego sasiada, jesli istnieje.



### 19.21.3 Worki i sealed-transit

**Identyfikacja opakowania — obecny model**

- Nowy W i V dostają unikalny kod W/V przy utworzeniu. Nowa S dostaje pełny
  kod z bazy inventory o długości co najmniej trzech znaków i znaków
  źródła/celu. Domena zachowuje bazową tożsamość S w `bags.inventory_id` i
  rozpoznaje znaczenie kodu razem z typem, statusem, kierunkiem i paczkami.



**Dodanie paczki do worka**

- `add_parcel_to_storage` wybiera worek na podstawie kierunku i stanu.

- Jesli w kierunku nie ma otwartego miejsca, system tworzy lub wybiera
  opakowanie zgodnie z ręcznym wyborem operatora i od razu wiąże je z paczką.

- Jesli fizyczny worek w tym kierunku byl zamkniety, nowy W wymaga dostępnego
  worka z `BAG_STOCK` i otrzymuje nowy wolny kod W/V.



**Sealed transit**

- Jesli wszystkie paczki w worku maja ten sam `next_common_hop`, worek zostaje sealed i nie jest otwierany.

- Zmiana statusu `SEALED` nie zmienia identyfikacji ani nie dopisuje znaków.



**Limit wagi**

- `SystemConfig.MAX_BAG_WEIGHT = 10.0` (limit worka).



### 19.21.4 Formuly finansowe (implementacja)

**Top-up (non-final leg)**

- `next_hop_cost = hub_fee + (dist * 10)`.

- Gdy `balance < next_hop_cost`, system doplaca roznice (`system_top_up`) i zmniejsza zysk firmy.



**Payout kuriera (non-final leg)**

- `p_share = dist * min(km_rate, 10.0) * weight`, obciete do `balance`.

- Bonus skoku: `decision.bonus * weight / bag.weight`.

- `balance` zmniejsza sie o `p_share` i bonus.



**Final leg**

- `flush_amount = max(0, balance - hub_fee)`.

- `max_payout = dist * 10.0 * weight`.

- `p_share = min(flush_amount, max_payout)`.

- `surplus = flush_amount - p_share`.

- Jesli trasa zmieniona vs `full_path`, `surplus = 0`.



**Sealed transfer bonus**

- `hub_fee_standard = hub_fee_vkes`.

- `hub_fee_effective = min(10, hub_fee_standard)`.

- `company_profit_transit_bonus = hub_fee_standard - hub_fee_effective`.



### 19.21.5 Tracking vs finanse (event_key)

**Tracking-only (bez rozliczenia finansowego)**

- `intake`, `courier`, `courier_bonus`, `sorting`, `transfer`,

  `outtake`, `delivery`, `route_change_job`.



**Finance-linked (amount != NULL)**

- `payment_creation`: dodatnia pelna wartosc paczki, niezaleznie od trybu KES/VKES;
  otwiera bilans finansowy paczki, ktory kolejne koszty zmniejszaja kwotami ujemnymi.

- `check_balance`: zawsze ma `amount` (ujemny dla nadwyzki, dodatni dla
  niedoboru, `0` przy zgodnym saldzie) i domyka saldo paczki do zera.

- `hub_fee_*`, `courier_*`, `company_profit_*`, `system_top_up`, `transport_payout`.

Kolejnosc zapisu `wallet_ledger` dla paczki:

- grupy finansowe sa zapisywane wedlug `package_events.seq`, laczone przez
  `package_id` oraz `finance_tx_group_id`;
- `payment_creation` jest zapisywane przed finansami `intake`, a kolejne grupy
  zachowuja kolejnosc odpowiadajacych im zdarzen paczki;
- wewnatrz splitu oplaty obowiazuje stala kolejnosc: owner/hub, manager,
  worker, system;
- wpisy bez pasujacego zdarzenia paczki zachowuja dotychczasowa kolejnosc
  utworzenia;
- sortowanie odbywa sie przed zapisem, wewnatrz tej samej atomowej transakcji;
  nie jest osobna kolejka komunikatow.



### 19.21.6 Schemat `metadata_json` (kluczowe eventy)

**payment_creation**

- `path_details`, `payment_mode`, `km`, `weight`, `balance`, `source` oraz,
  jezeli dotyczy, `payer_id`, `payer_account_id`, `payment_intent_id`.



**intake**

- `balance`, `source_id`, `bag_id`, `staff_id` (balance na poczatku).



**courier / courier_bonus**

- `balance`, `from_hub`, `to_hub`, `km`, `bag_id`, `container_type`, `courier_id`.



**sorting**

- `container_type`, `container_id`, `dir_sector`, `from_hub`.



**transfer**

- `from_id` (kod źródłowego opakowania), `to_id` (kod docelowego opakowania
  po sealed), `hub`.



**outtake**

- `balance`, `from_hub`, `courier_id`, `bag_id` (balance na poczatku).



**check_balance**

- `balance` (gdy >0, towarzyszy wpis `company_profit_unsettled` w ledgerze).



**route_change_job**

- `path_details`, `km`.



### 19.21.7 `staff_id` (wybor)

- Dla zdarzen hubowych: pierwszy zalogowany pracownik huba (lub manager).

- Dla `courier`: zawsze `courier.id`.



## 19.18 Addendum (2026-03-15) - Terminal Maps + UI Alignment

- **Mapa lokalna (CLI)**:

  - Nowa mini‑mapa huba (2‑kroki sasiedztwa) rysowana punktami (drawille).

  - Skala km zachowana, mapy kwadratowe, bez osi i marginesow.

  - Kolory: glowny hub (magenta), sasiedzi (zolty), dalsze aktywne (ciemna zielen), nieaktywne (czerwony).

  - Linie aktywne niebieskie; szare tylko dla recznie zablokowanych polaczen.

  - Mapka laduje sie przy wejsciu do huba (nie po PIN), obok statusu.

- **Status huba (CLI)**:

  - Status w ramce Rich, z dopiskiem lokalnej nazwy: `STATUS BIEZACY STACJI: EA / E`.

  - Mapka bez ramki (print), status w ramce (Rich) dla lepszego wyrownania.

- **Mapa duza (Admin)**:

  - Naglowek: `TOPO: HUB x/y | LINK z` zamiast "Mapa hubow".

  - Zmniejszone marginesy tak, by skrajne huby dotykaly ramki.

  - Linie zablokowane na szaro, aktywne na niebiesko; huby aktywne zolte, nieaktywne czerwone.

  - Nowy skrot w menu Admin: `[M]` rysuje mape w dowolnym momencie.

- **Hub Editor (Flask/React)**:

  - Prostokat pomocniczy wokol skrajnych punktow sieci z podpisami odleglosci (km).

  - Etykiety odleglosci w tym samym stylu co ringi (kolor i rozmiar).

### 19.18.1 Trzy mapy kuriera: TUI i client_app

Widok kuriera opiera sie na trzech slotach map zapisanych w `hub_staff.courier_market_json`.

Kazdy slot zawiera:

- `active_hub` - hub bazowy mapy albo `OFF`,
- `scale` - skala skanowania `1..3`,
- `disabled_hubs` - huby recznie wylaczone w danym slocie.

Zasady interpretacji:

- sloty odpowiadaja trzem mapom widocznym w TUI i w `client_app`,
- wpis, np. `[{"active_hub":"AA","scale":1,"disabled_hubs":[]}]`, jest
  wyłącznie deklaracja centrum, zasiegu i lokalnych wylaczen. Nie zapisuje
  listy hubow, drog ani gotowych kombinacji tras;
- przy kazdym zbudowaniu projekcji mapa pobiera aktualna topologie i laczy
  dwie warstwy: stale sasiedztwo teoretyczne (takze huby nieaktywne) oraz
  polaczenia dynamiczne wynikajace z aktualnie aktywnych hubow i blokad;
- `scale=1` obejmuje wszystkie huby i drogi oddalone o jeden krok aktualnego
  grafu od `active_hub`. Jezeli aktywne huby `AA` i `DA` utworza dynamiczna
  droge `AA--DA`, ten sam niezmieniony wpis dla `AA` natychmiast obejmuje
  `DA` i te droge;
- zmiana aktywnosci huba, blokady albo topologii po `COMMIT` uniewaznia
  projekcje i wysyla `courier_market_update`; mapa jest przeliczana ponownie
  bez pollingu i bez dopisywania drogi do `courier_market_json`;
- `disabled_hubs` jest tylko lokalna maska danego slotu i nie zmienia
  wspolnej topologii sieci; szczegolowe zachowanie centrum opisuje dalsza
  regula dla `active_hub` znajdujacego sie w `disabled_hubs`;
- mapa pokazuje hub bazowy oraz sasiedztwo wynikajace ze skali,
- `scale=1/2/3` oznacza coraz szerszy obszar skanowania wokol `active_hub`,
- hub czerwony/centralny jest punktem odniesienia mapy,
- klik lub strzalka na innym hubie wlacza/wylacza go lokalnie przez `disabled_hubs`,
- wylaczony hub jest usuwany z logiki laczenia map i z widocznych polaczen tego slotu,
- jesli dwa sloty po odjeciu `disabled_hubs` maja wspolne huby, frontend moze scalic je w jeden szerszy panel,
- jesli sloty nie maja wspolnych hubow, pozostaja osobnymi mapami,
- aktywny hub moze rowniez znalezc sie w `disabled_hubs`; wtedy slot nadal ma swoje centrum, ale ten hub blokuje laczenie z innymi slotami. To jest celowe i musi byc interpretowane tak samo w TUI i `client_app`.

Kolory musza pozostac spojne z TUI:

- centrum / aktywny hub: czerwony,
- pierwszy ring: zolty,
- drugi ring: pomaranczowy,
- dalsze aktywne huby: zielony,
- recznie wylaczony hub: bialy/szary,
- polaczenia aktywne: niebieskie,
- polaczenia zablokowane lub usuniete z widoku: szare albo niewyswietlane, zalezne od kontekstu UI.

Zapis stanu:

- DB jest trwalym zrodlem prawdy dla konfiguracji map kuriera,
- TUI laduje konfiguracje z `hub_staff.courier_market_json` przy wejsciu w tryb kuriera,
- w TUI zmiany map sa trzymane w pamieci sesji i zapisywane do DB dopiero przy wyjsciu z trybu kuriera,
- brak natychmiastowego zapisu po kazdym ruchu w TUI jest zamierzony, zeby nie obciazac DB podczas nawigacji po mapie,
- `client_app` zapisuje zmiane konfiguracji przez endpoint `/client-api/courier/hub-view/config`,
- oba UI musza zapisywac ten sam format JSON, bez filtrowania `disabled_hubs` wedlug `active_hub`.

### 19.18.2. Mapa w `hub_api` i `hub-app`

Mapa panelu huba jest wizualizacja tej samej topologii, ktora interpretuje TUI.
Nie jest osobnym algorytmem routingu i nie korzysta z danych generowanych w
przegladarce jako zrodla prawdy.

- mapa pokazuje centrum zalogowanego huba oraz aktywne i nieaktywne huby w
  zasiegu `step=2`;
- huby znajdujace sie poza drugim pierscieniem nie sa rysowane;
- etykieta na mapie jest krotkim kodem huba zgodnym z oznaczeniem TUI, a nie
  pelna nazwa firmy lub opis adresu;
- mapa pokazuje cala strukture polaczen w lokalnym zasiegu huba, w tym
  polaczenia teoretyczne i dynamicznie utworzone;
- polaczenia nie sa wzajemnie ukrywane, gdy dwa typy linii leza na tej samej
  krawedzi. Linie moga sie nakladac, aby nie utracic informacji o stanie.

Kolorowanie hubow:

- hub centralny: magenta/fioletowe tlo;
- bezposredni sasiedzi: zolte tlo;
- huby drugiego pierscienia: pomaranczowe tlo;
- hub nieaktywny: czerwone tlo;
- kolor tekstu etykiety pozostaje zgodny z ustalonym stylem mapy i nie jest
  zmieniany przy zmianie koloru tla huba.

Kolorowanie polaczen:

- teoretyczne polaczenie do pierwszego pierscienia ma kolor pierwszego
  pierscienia, a do drugiego pierscienia kolor drugiego pierscienia;
- polaczenie do huba nieaktywnego jest czerwone i przerywane;
- polaczenie dynamiczne, powstale po zmianie dostepnosci sieci lub zamknieciu
  huba, jest ciemnoniebieskie i ciagle;
- polaczenie dynamiczne jest rysowane zawsze, gdy znajduje sie w zasiegu mapy,
  nawet gdy pokrywa sie z polaczeniem teoretycznym;
- mapa nie usuwa linii tylko dlatego, ze inny typ linii zajmuje te sama
  krawedz. Rozroznienie zapewnia kolor i styl kreski.

Dane mapy sa dostarczane przez osobny `hub_api`, sa odczytywane z DB i nie
zmieniaja konfiguracji manifestu. Restart lub odswiezenie ponownie buduje mape
z aktualnego stanu DB.

### 19.18.3. Wyszukiwanie osoby i obsluga klawiatury w formularzu huba

Prefiksowe podpowiedzi `person_id` sa funkcja wylacznie panelu huba. Nie sa
wyswietlane w `client_app`, gdzie uzytkownik wpisuje pelne ID i wykonuje lookup
po opuszczeniu pola albo po `Enter`.

W `hub-app`:

- po wpisaniu pierwszego znaku `person_id` `hub_api` zwraca aktywne ID pasujace
  do prefiksu;
- podpowiedzi sa przyciskami w tym samym stylu co przyciski hubow i tagow;
- lista jest osobnym oknem nakladanym na formularz i nie zmienia jego wysokosci;
- lista jest filtrowana po kazdej zmianie znaku;
- pierwsza czesc listy jest wyswietlana nad polem, a druga, gdy jest potrzebna,
  pod polem;
- lista nie przekracza pieciu wierszy nad polem i pieciu pod polem;
- `Tab` opuszcza pole i ukrywa podpowiedzi;
- ponowne wejscie w pole pokazuje podpowiedzi ponownie dla aktualnej wartosci;
- `ArrowLeft` i `ArrowRight` przechodza do poprzedniej lub nastepnej
  podpowiedzi;
- `ArrowUp` i `ArrowDown` dzialaja tak samo dla kolejnych wierszy listy;
- zaznaczona podpowiedz jest wizualnie wyrozniona, ale samo przejscie
  strzalka nie wpisuje jej jeszcze do formularza;
- gdy widoczna jest tylko jedna podpowiedz, `Spacja` wpisuje ID i zamyka liste;
- `Enter` wpisuje zaznaczone ID i przechodzi do nastepnego pola danych osoby;
- ta sama zasada `Spacja`/`Enter` obowiazuje po wybraniu pozycji strzalkami;
- `Backspace` usuwa jeden znak z ID i jednoczesnie czysci pozostale dane tej
  osoby, zachowujac skrocone ID oraz odswiezajac podpowiedzi;
- `Delete` czysci cale ID, wszystkie dane osoby i liste podpowiedzi;
- wybor pelnego ID uruchamia zwykly lookup osoby i wypelnia dane z DB.

W `client_app` nie ma podpowiedzi prefiksowych ani nawigacji po ich liscie:

- lookup osoby wykonuje sie dopiero po pelnym wpisaniu ID i opuszczeniu pola
  lub po `Enter`;
- `client_lookup_verification_enabled` steruje tylko dodatkowymi pytaniami w
  `client_api`;
- gdy flaga ma wartosc `1`, po poprawnym `person_id` uruchamiany jest challenge
  z pytaniami o dane osoby;
- gdy flaga ma wartosc `0`, pytania sa pomijane i dane sa uzupelniane od razu;
- `hub_api` nie korzysta z tej flagi i nie uruchamia tego challenge.



## 21. Migrated Agent Briefing (2026-03-10)



### 21.1 Kontekst projektu (skrot)

- System symuluje siec kurierska w Nairobi.

- Paczki sa transportowane przez huby, finansowane w VKES.

- Firma zarabia na optymalizacjach (skip-hop, sealed transit).

- Globalny licznik zysku firmy: `total_optimization_savings`.



### 21.2 Kluczowe pliki (operacyjnie)

- `courier_logic_poc.py`: logika biznesowa (paczki, worki, routing, finanse).

- `flask_server.py`: HTTP API, wywoluje logike i zwraca JSON.

- `event_service.py`: SSE (push zdarzen do frontendu).

- `domain_models/parcels.py`: typowane kontrakty paczek.

- `parcel_command_mapper.py`: mapowanie formularza adaptera do komendy.

- `hub_service.py`: wlaczanie/wylaczanie hubow i pracownikow.



### 21.3 Transport i routing (skrot)

- Paczki sa przewozone w **workach** (`Bag`) kierunkowych.

- Routing: Dijkstra, tryby:

  - `theoretical=True` → wycena i pelna siec.

  - `theoretical=False` → realny transport (tylko aktywne huby).

- AssignmentEngine generuje **dwie decyzje** dla kazdego worka:

  - normalna (najblizszy hub na trasie),

  - skip-hop (ominiecie jednego huba, bonus +50 VKES).

  To zachowanie jest zamierzone (kurier wybiera jedna).



### 21.4 Naprawione bledy (historyczne)

1. **Routing przez offline hub**  

   `add_parcel_to_storage()` uzywalo `theoretical=True`.  

   Zmienione na `theoretical=False` (trasa realna).

2. **Niepelna mapa polaczen w UI**  

   `Hub.to_dict()` bral tylko sasiadow teoretycznych.  

   Zmieniono na UNION teoretycznych i aktywnych.

3. **Zla trasa w `create_and_add_parcel()`**  

   Zwracalo trase teoretyczna; teraz zwraca trase rzeczywista paczki.

4. **Podwojne rozliczenie paczki** (`api_apply_job`)  

   Odrzucenie workow juz zabranych przed `apply_assignment`.

5. **Brak ksiegowania resztkowego salda paczki**  

   Po `apply_assignment` wywolywany auto-odbior dostarczonych paczek.



### 21.5 Zasady ktorych nie zmieniac

- Dwie decyzje z AssignmentEngine sa celowe (skip + normal).

- `theoretical=True` w planowaniu jest poprawne; wyjatek to `add_parcel_to_storage`.

- Blok rozliczania assetow w `apply_assignment` (AST) nie dotyczy paczek.



### 21.6 Przykladowy przeplyw finansowy paczki (skrot)

```

Nadanie (KES)           +654.00 VKES

Skip-hop P2->P5         -274.00 VKES

Firma skip-profit         +6.00 VKES

Sealed transit P5        +40.00 VKES

Transport P5->P7         -224.00 VKES

Delivery fee P7          -30.00 VKES

deliver_to_customer      +20.00 VKES

Saldo koncowe:            0.00 VKES

```



## 22. Agent Review Notes (2026-03-10)



### 22.1 Najwazniejsze odpowiedzi (skrot)

1. **Kierunki w PRD**: 9 to blad; realnie 8 (0–7).

2. **`add_parcel` i start=end**: galaz zostaje jako bezpiecznik.

3. **`ledger_compare` vs `ledger_runtime_compare`**: jedna logika zrodlowa, wrappery.

4. **`try/except Exception` przy importach**: docelowo `ImportError` + hard-fail.

5. **Backfill z `entry_text`**: ryzykowny; preferowac `metadata_json`.

6. **`INSECURE_DEV_KEY`**: dev OK, prod musi byc hard-fail.

7. **`get_app_setting` w dwoch miejscach**: preferowana jedna funkcja w `db_storage`.

8. **`ledger_seed` tylko gdy pusty**: swiadoma polityka bezpieczenstwa; opcja “seed missing” do rozwazenia.

9. **Dual-write**: jeden writer + testy zgodnosci, rollback = stop migracji.

10. **`courier_logic_poc`**: docelowo do refaktoru (SimulationContext).

11. **`financial_audit`**: powinien ostrzegac, gdy `ledger_read=0`.



### 22.2 Wyjasnienie `owner_type` / `owner_id` (ledger)

Przyklad wpisu:

```

owner_type: "hub"

owner_id: "DA"

```

Znaczenie:

- `owner_type` = typ konta (hub/worker/manager/courier/system).

- `owner_id` = identyfikator z manifestu (np. hub `DA`, worker `W-DA-P1`, courier `C-DA-1`).



### 22.3 Modele podpisu w ledgerze (3 warianty)

1. **HMAC‑only (obecny)**  

   Jeden klucz serwera (`VKES_HMAC_KEY`) podpisuje cala historie.

2. **HMAC + per‑konto signatures (docelowy w systemie)**  

   Serwerowy HMAC + klucze per‑owner w `wallet_keys`.

3. **Model seed/mnemonic (krypto)**  

   Osobny system (seed → public/private keys), inna architektura.



### 22.4 Terminologia bezpieczenstwa

Technologia: **tamper‑evident ledger**  

Mechanizm: **hash chain + HMAC** (nie blockchain publiczny).



## Custodial vs Non-custodial (per owner)

- Kazdy owner wybiera tryb przechowywania klucza: custodial (klucz na serwerze) lub non-custodial (klucz u klienta).

- Jesli strona placaca jest non-custodial, serwer tworzy pending/challenge i wymaga podpisu tej strony.
- W panelu klienta szybkie `online` moze obsluzyc podpis non-custodial w aktywnej sesji.
- Oczekujace `waiting` dla `Utworz platnosc` z konta non-custodial jest zablokowane do czasu wdrozenia sesji `unlock wallet`.

- Wplyw do ledgera jest finalizowany dopiero po poprawnej autoryzacji/podpisie strony placacej.



## Addendum (2026-03-27) – Rozdzielenie zdarzen „w drodze” (Flask)



**Cel**

Rozdzielic zdarzenia: klik gieldy = tylko odbior przez kuriera (`courier`), a dostarczenie do huba nastepuje dopiero po kliknieciu „paczki w drodze”.



**Specyfikacja (kroki)**

1. Zidentyfikowac w Flasku:

   - punkt klikniecia gieldy (apply_job / assignment),

   - miejsce listy paczek huba (ready_for_pickup) i UI listy paczek.

2. Zmienic logike „klik gieldy”:

   - zapisac event `courier`,

   - ustawic worek jako „u kuriera” (holder = kurier),

   - nie wykonywac automatycznego transferu do nastepnego huba,

   - dodac „paczki w drodze” do widoku huba.

3. Dodac akcje „klik paczka w drodze”:

   - zapis `transfer`/`sorting`,

   - przeniesienie worka do huba (holder = hub),

   - aktualizacja runtime + DB (`bags`, `bag_parcels`),

   - odswiezenie UI.

4. Zmienic loader/runtime:

   - rozpoznawanie workow „u kuriera” (holder = kurier),

   - przechowywanie ich poza `hub.bags`, ale widoczne jako „w drodze”.

5. Testy end‑to‑end:

   - gielda → w drodze → klik → transfer/sorting,

   - spojnosci wpisow w `package_events`, `bags`, `bag_parcels`.







## Addendum (2026-04-02) - Plan synchronizacji runtime/DB + zmiany TUI



### 0. Jak to teraz dziala (stan obecny)



**Zrodlo prawdy** to DB. Runtime jest cachem.



1. Krytyczne zdarzenia zapisuja sie natychmiast do DB (append-only) i maja pierwszenstwo przed cache.

2. Zmiany pomocnicze pozostaja w runtime i nie sa zapisywane, jesli nie maja skutkow finansowych lub logistycznych.

3. Zapis topologii i runtime odbywa sie przez UPSERT, bez kasowania tabel i reinsertu.

4. Snapshoty runtime sa kontrolowane i ograniczone, aby nie nadpisywac danych staff i nie tracic pol kontaktowych.



### 0.2 Stan aktualny implementacji (po refaktorze zapisu)



**Zrodlo prawdy:** DB. Runtime = cache (tylko aktywne obiekty).



**Glowna sciezka zapisu (runtime autosave):**

1. `persist_runtime_snapshot(...)` zapisuje **runtime state + paczki + historie** (bez topologii).

2. W srodku: `commit_runtime_operation(...)` = `commit_runtime_state(...)` + `commit_packages_only(...)` + `commit_tracking_only(...)`.

3. `commit_runtime_state(...)` = `persist_hub_inventory_only(...)` (hub_inventory:BAG_STOCK + box_inventory + ready_pickup + bags + bag_parcels).



**Zapisy topologii (hubs/links/staff):**

1. `commit_topology(...)` = `persist_topology_only(...)` (hubs + hub_links + hub_staff + hub_direction_counters + hub_bag_counters).

2. `persist_topology_only(...)` uzywa `_persist_topology_tables(...)` i **nie** nadpisuje pol kontaktowych staff pustymi wartosciami.



**Pelny snapshot (tylko gdy potrzebny):**

1. `commit_full_operation(...)` = `commit_full_snapshot(...)` + paczki + historie.

2. `commit_full_snapshot(...)` = `persist_runtime_topology(...)` (topologia + runtime + bags).

3. Uzywane tylko w: `admin_sync` i `manage_topography` (oraz `bootstrap_from_runtime_if_empty`).



**Bags i cleanup:**

1. `persist_bag_state_only(...)` zapisuje `bags` + `bag_parcels`.

2. Kasowanie brakujacych workow jest tylko przy `full_snapshot=True`.



**Packages i historie:**

1. `commit_packages_only(...)` zapisuje `packages` przez `register_package(...)` i `update_package_state(...)`.

2. `commit_tracking_only(...)` zapisuje `package_events` przez `sync_package_history_merged(...)`.



**Efekt:**

1. Zdarzenia operacyjne maja natychmiastowy zapis.

2. Topologia i staff nie sa nadpisywani przy kazdym autosave.

3. Zapis jest mniejszy, bardziej precyzyjny i latwiejszy do debugowania.



### 0.1 Nasza droga (kierunek)



1. Utrzymac DB jako jedyne trwale zrodlo prawdy, runtime tylko jako cache.

2. Zapisy robic tylko w punktach rzeczywistego zdarzenia (real‑time), a nie przy kazdej zmianie obliczen.

3. Wszelkie zapisy zrobic restart‑safe: po kazdym restartcie wszystko odtwarzalne z DB.

4. Ograniczac runtime do danych rzeczywiscie potrzebnych w UI i obliczeniach.



### A. Plan synchronizacji runtime/DB (szczegolowy)



Cel: uporzadkowac zapis i odtwarzanie stanu tak, aby:

- nie tracic paczek i zmian po przerwaniu pracy programu (restart w dowolnym momencie)

- unikac kasowania danych i pelnych reinsertow

- miec jasny podzial: co trzymamy w pamieci, co w DB, co liczymy w locie

- zachowac spojnosc miedzy Flask i TUI



## 1. Dane wymagane do pracy (minimum runtime)



Podzial na trzy grupy:

- A. Niezbedne w runtime (core)

- B. Generowane z obliczen

- C. Wymagaja regularnego zapisu (synchronizacja)



Tabela A/B/C:



| Dane | Grupa | Zrodlo prawdy | Gdzie trzymamy w pamieci | Czysta funkcja obliczen? | Kiedy zapis do DB |

|---|---|---|---|---|---|

| Lista hubow (name, geo, fees, status) | A | DB | cache w runtime (HUB_DATABASE) | Nie | przy zmianie w konfiguracji/hubach |

| Linki hubow (blocked, road_distance) | A | DB | cache w runtime | Nie | przy zmianie topologii |

| Hub local_name (`code1`) | A | DB | cache w runtime tylko do odczytu | Nie | przy utworzeniu huba w Admin API albo jawnym recoloringu awaryjnym; usuniecie huba usuwa jego wiersz bez zmiany innych kodow |

| Staff hubu (id, name, surname, phone, email, address, note, pin, role, manager_id) | A | DB | cache w runtime | Nie | przy zmianie danych staff |

| Bag/bag_parcels (worki i zawartosc) | A | DB + runtime | aktywne obiekty bag | Nie | przy kazdej zmianie stanu/worka |

| Packages (paczki) | A | DB | runtime tylko wczytane/aktywnie uzywane | Nie | natychmiast po tworzeniu/zmianie |

| package_events | A | DB (append-only) | nie wymagane | Nie | natychmiast (append) |

| Stany tymczasowe formularza TUI (np. pozycja kursora) | A | runtime | cache per pracownik | Nie | nie zapisujemy |

| Trasy/ETA/wyceny | B | runtime | cache | Tak | nie zapisujemy stale |

| Widoki list/filtery | B | runtime | cache | Tak | nie zapisujemy stale |

| Statystyki, raporty | B | DB+runtime | cache | Tak | okresowo lub na zadanie |

| Logi systemowe | C | DB | nie wymagane | Nie | natychmiast lub batch |



## 2. Zasada zapisu: UPSERT zamiast DELETE+REINSERT



Aktualny problem: `persist_runtime_topology()` kasuje calkowicie tabele i wstawia od nowa.

Efekt: znika `phone/email/address/note` w `hub_staff` i moze znikac stan.



Nowa zasada:

- ZAMIENIAMY "DELETE FROM ..." na UPSERT per rekord

- Usuwamy tylko te rekordy, ktore *na pewno* nie istnieja w runtime (kontrolowany cleanup)

- Dla tabel relacyjnych (hub_links, bag_parcels) stosujemy:

  - "soft delete" flag albo osobne oznaczenie `snapshot_id`

  - albo cleanup tylko po potwierdzonym nowym snapshot



Proponowany mechanizm:



## 3. Co i gdzie jest zapisywane (tabele + wlasciciel)



Tabela DB -> modul odpowiedzialny:



| Tabela | Dane | Wlasciciel zapisu | Kiedy zapis |

|---|---|---|---|

| hubs | dane hubow | config_manifest_sync / persist_runtime_topology | przy zmianie topologii |

| hub_links | blokady i road_distance | persist_runtime_topology | przy zmianie topologii |

| hub_staff | dane staff | manifest_sync + edycje w runtime | przy zmianie danych staff |

| hub_inventory (BAG_STOCK) | stany runtime (worki/liczniki) | persist_hub_inventory_only | okresowo / po zmianie |

| hub_box_inventory | skrzynki w hubie | persist_runtime_topology | po zmianie |

| hub_ready_pickup | paczki gotowe | persist_runtime_topology | po zmianie |

| bags | worki | persist_runtime_topology | po zmianie |

| bag_parcels | paczki w workach | persist_runtime_topology | po zmianie |

| packages | paczki | register_package / parcel_service | natychmiast |

| package_events | eventy paczek | db_storage | natychmiast (append) |

| wallet_ledger | ledger | ledger_service | natychmiast (append) |

| app_settings | config + runtime | config_manifest_sync | przy zmianie config |



## 4. Odtworzenie po przerwaniu pracy programu (restart-safe)



Zasady:

- DB jest jedynym trwalym zrodlem prawdy

- runtime moze byc odtworzony w calosci z DB

- zapis powinien byc transakcyjny (BEGIN/COMMIT)

- zapis po waznych akcjach jest natychmiastowy (ulamki sekund po zdarzeniu)



Konkrety:

- Kazdy zapis waznej akcji: jedna transakcja

- Przyklady waznych akcji: utworzenie paczki, zmiana statusu paczki, dodanie/wyjecie z worka, zamkniecie huba

- Snapshot runtime nie uzywa batch_id

- `package_events` i `wallet_ledger` zostaja append-only (bez kasowania)



Efekt:

- przy przerwaniu programu zawsze mamy ostatni stabilny snapshot

- brak utraty paczek i stanow w sieci



## 4a. Momenty zapisu do DB (commit points)



Zapisujemy tylko wtedy, gdy zmiana ma skutek operacyjny i "zatrzaskuje" stan w systemie.

Zmiany tymczasowe lub wielokrotne przeliczenia nie sa zapisywane.

Zapis jest wykonywany w chwili zdarzenia (real-time), bez odroczonych batchy.



Przyklady:

1. Zmiana trasy paczki zapisywana jest dopiero przy przypisaniu do kuriera lub rozpoczeciu transportu, a nie po kazdym przeliczeniu.

2. Zamkniecie huba zapisujemy od razu (wplywa na routing i dyspozycje).

3. Paczka trafia do worka / wychodzi z worka -> zapis natychmiast.

4. Zmiana statusu paczki (np. created/local/global, in_bag, delivered) -> zapis natychmiast.

5. Tworzenie paczki lub zatwierdzenie formularza -> zapis natychmiast.

6. Zmiana danych staff (telefon/email/adres/pin) -> zapis natychmiast.



## 4b. Audyt real-time zapisow (stan obecny + korekty)



Stan obecny (kod):

1. Kazdy tracking event zapisuje sie natychmiast do package_events (sync_package_history). To jest zgodne z real-time.

2. Po kazdym eventu wywolywany jest runtime_autosave, ktory uruchamia persist_runtime_snapshot (debounce ~1s).

3. persist_runtime_snapshot zapisuje tylko runtime state + paczki + historie (bez topologii).

4. commit_runtime_operation zapisuje: runtime_state + new_packages + package_updates + sync historii.

5. Zdarzenia finansowe ida do wallet_ledger przez _ledger_append_pkg, po zapisie package_events (kolejnosc wymuszona).



Korekty wymagane pod real-time:

1. Runtime_autosave powinien byc uruchamiany tylko po waznych akcjach, a nie po kazdym zdarzeniu pomocniczym.

2. Zmiany tras i przeliczenia ETA nie moga wywolywac zapisu do DB, dopoki nie dojdzie do "commit point" (np. kurier bierze zlecenie).

3. persist_runtime_snapshot pozostaje jako narzedzie do real-time commitow, ale wywolywany tylko w punktach decyzyjnych (zamkniecie huba, przypisanie kuriera, zmiana statusu, intake/outtake).

4. Gating autosave: lista kluczy commitowych (np. intake, outtake, transfer, courier, delivery, payment_creation) uruchamia zapis, reszta nie.

5. Commit-keys zapisuja natychmiast (bez debouncingu), aby zachowac real-time.

6. Usuwamy podwojne snapshoty w tych samych punktach (np. job_market -> apply_assignment).

7. Dlugie operacje (np. apply_assignment) blokuja autosave w trakcie i robia jeden snapshot na koncu.



## 5. Minimalizacja danych w DB vs cache w pamieci



Zasada:

- w DB trzymamy wszystko co jest potrzebne do odtworzenia systemu

- w runtime trzymamy tylko to co potrzebne do szybkich operacji



Tabela rekomendacji:



| Dane | Trzymac w DB | Trzymac w runtime | Uzasadnienie |

|---|---|---|---|

| huby, staff, links | TAK | TAK | potrzebne do szybkich lookupow |

| paczki (packages) | TAK | tylko aktywne | DB to prawda, runtime to cache |

| worki i zawartosc | TAK | TAK | operacje na zywo |

| logi i eventy | TAK | NIE | append-only |

| wyceny/ETA | NIE | TAK | generowane, ulotne |

| formy UI (filtry, kursory) | NIE | TAK | tylko UI |



## 6. Wymiana danych miedzy modulami (spojnosc)



Zasada:

- jeden modul jest "wlascicielem" zapisu do danej tabeli

- inne moduly tylko czytaja lub wywoluja API



Konkretnie:

- `db_storage.py` = jedyne miejsce zapisu do DB

- `courier_logic_poc.py` i `terminal_ui.py` wywoluja API db_storage

- `flask_server.py` korzysta z db_storage, nie zapisuje bezposrednio SQL



## 7. Kroki wdrozenia (plan techniczny)



1. Zmienic `persist_runtime_topology()`:

   - zamiast DELETE -> UPSERT na rekordach, bez batch_id

2. Upewnic sie, ze runtime obiekty staff maja komplet danych lub dane brane z DB (phone/email/address/note).

3. Zmienic miejsca, gdzie DB kasuje wszystko (DELETE FROM hub_staff/hubs itd).

4. Zweryfikowac przeplyw Flask <-> TUI:

   - obie strony czytaja z DB

   - brak lokalnych "odrebnych" struktur danych



## 8. Odpowiedzi na Twoje wymagania



- (1) Lista danych i podzial runtime/obliczenia/zapis: patrz sekcja 1 i 5

- (2) Zapis przez nadpisanie (UPSERT), bez kasowania: sekcja 2

- (3) Dokladnie co i gdzie zapisujemy: sekcja 3

- (4) Powrot po przerwaniu programu: sekcja 4 (snapshot + batch)

- (5) Minimalne dane + cache runtime: sekcja 5

- (6) Sprawna wymiana danych miedzy modulami: sekcja 6



### B. Zmiany w terminal_ui (TUI)



Zakres zmian po pracy w TUI (skrot funkcjonalny):

- Tabela tworzenia paczki: dynamiczne podpowiedzi w panelu INFO oraz real-time walidacje.

- Walidacje wejsc:

  - waga oraz wymiary X/Y/Z tylko liczby, jedna cyfra po przecinku, zakres 0.1-999.9

  - ubezpieczenie dwie cyfry po przecinku, ograniczenie po lewej stronie

  - brak niedozwolonych znakow (np. spacje w kodach), kontrola dlugosci pol

- Pola tekstowe (notatka, adresy, imiona/nazwiska):

  - limity dlugosci

  - przy dlugich tekstach: przycinanie, zawijanie w INFO i sygnalizacja wielokropkiem

- Tag i Status:

  - wybor z listy, filtrowanie po wpisywanych literach

  - deduplikacja i sortowanie tagow

- Formatowanie danych kontaktowych:

  - telefon: formatowanie po wyjsciu z edycji

  - email: normalizacja do malych liter

- Obsluga i ergonomia nawigacji:

  - poprawki kursora, fokus i zachowanie pozycji

  - odchudzenie podswietlen i elementow drzewa





## Addendum (2026-04-04) – Runtime → DB Refactor (plan + stan koncowy)



### Cel

- DB jest jedynym zrodlem prawdy.

- Runtime = cache + obiekty robocze (bez utrzymywania stanu finansowego i historii poza DB).

- Flask i Terminal korzystaja z tych samych zapisow/odczytow.



### Zakres (co przebudowalismy)

- Runtime stanu paczek/workow/hubow dziala wylacznie jako cache (odtwarzany z DB).

- Usuniecie legacy: `global_profit_history`, runtime wallet logs, `payment_history` jako zrodlo prawdy.

- Zmiana przeplywow w Flask i Terminal tak, by po kazdej zmianie stanu zapisywac do DB i odswiezac cache.



### Zasady nienaruszalne (NIE ZMIENIAC LOGIKI)

- Kolejnosc: tracking (`package_events`) → fingerprint → `wallet_ledger` musi zostac taka sama.

- Wzory naliczania (p_share, courier_bonus, company_profit_surplus, skip_surplus, hub_fee) bez zmian.

- Te same `event_key` i ta sama kolejnosc wpisow w `package_events` oraz `wallet_ledger`.

- Refactor dotyczy tylko warstwy I/O (zapis/odczyt/odswiezanie cache).



### Etapy (status na dzis)



**Etap 0: Inwentaryzacja**

- [x] Spis struktur runtime-only i zaleznosci UI.

- [x] Mapa miejsc zapisu do DB i miejsc tylko runtime.



**Etap 1: Jednolity reload runtime z DB**

- [x] Wspolna funkcja reload (Flask i Terminal) zawsze z `in_transit_bags`.

- [x] Runtime po reloadzie = stan w DB (bags, bag_parcels, hub_ready_pickup, hub_inventory:BAG_STOCK).

- [x] Blokada tworzenia runtime bez zapisu do DB.



**Etap 2: Usuniecie legacy finansow w runtime**

- [x] `global_profit_history` → no-op i potem usuniete logowanie.

- [x] `add_system_profit_delta()` usuniete (bylo no-op).

- [x] `payment_history` w Parcel nie jest zrodlem prawdy (UI czyta z DB).

- [x] runtime wallet logs → no-op.



**Etap 3: Ready-for-pickup tylko z DB**

- [x] `hub.ready_for_pickup` jako cache z `hub_ready_pickup`.

- [x] Dodawanie/usuwanie = zapis do DB + reload cache.

- [x] Usuniete bezposrednie dopisywanie bez zapisu.



**Etap 4: Worki i tranzyt**

- [x] Worki w hubach i w tranzycie tylko z DB (`bags` + `bag_parcels`).

- [x] `IN_TRANSIT_BAGS` jako cache ladowany z DB i zapisywany przy zmianach.

- [x] Po operacji worka (seal/transfer/arrive) zapis do DB + reload runtime.



**Etap 5a: Synchronizacja Flask ↔ Terminal (DB-only)**

- [x] DB jako zrodlo prawdy, runtime tylko cache.

- [x] Po kazdej zmianie stanu: zapis do DB + odswiezenie cache w obu procesach.

- [x] Sygnalizacja odswiezen po commitach DB: **SSE/zdarzenia**, bez pollingu.

- [x] UI w Flask i Terminal reaguje na sygnaly bez konfliktow.



**Etap 5: Logowanie pracownikow**

- [x] Stan loginu z DB (`login_sessions`), runtime tylko odczyt.

- [x] Usuniety auto-login jako fallback.



**Etap 6: Porzadki i usuniecie nieuzywanego kodu**

- [x] Usuniete nieuzywane zapisy do `global_profit_history`.

- [x] Usuniete wywolania `add_system_profit_delta`.

- [x] Runtime wallet logs i `payment_history` pozostaja jako no-op (bez wplywu na DB).



**Etap 7: Walidacje i testy**

- [x] `runtime_db_audit.py` — runtime vs DB (liczniki).

- [x] `runtime_restart_audit.py` — zgodnosc po reset+reload.

- [x] `runtime_flow_audit.py` — przeplyw zdarzen paczki.

- [x] `runtime_finance_audit.py` — spojnosc fingerprintow `package_events` ↔ `wallet_ledger`.



### Notatki o kolejnosci zapisu (kluczowe)

- Tracking → `package_events` → fingerprint → `wallet_ledger`.

- Bez bufora: dopuszczalne roznice czasow o ms, ale kolejnosc logiczna zachowana.



### Ryzyka (zostaja)

- Zbyt agresywne usuwanie runtime list (UI musi miec zrodlo w DB).

- Duze obciazenie DB przy kazdym reloadzie (w razie potrzeby cache/partial refresh).

## Addendum (2026-04-04) ? Package Events + Ledger Map

# Powiazania: package_events <-> wallet_ledger <-> inne tabele



Ten dokument opisuje, jakie zdarzenia paczki generuja wpisy w `package_events`,

jakie wpisy finansowe trafiaja do `wallet_ledger`, oraz gdzie sa powiazania z innymi tabelami.



## Zasada fingerprint

- `wallet_ledger.fingerprint` = **pelny `entry_hash`** ostatniego wpisu trackingowego w `package_events`.

- Kolejnosc: **tracking -> zapis `package_events` -> `entry_hash` -> wpis w `wallet_ledger`**.

- Ledger **nie dopina fingerprintu pozniej**.



## Mapowanie zdarzen (tracking -> ledger)

- `payment_creation` (tracking) -> ledger: jedna strona credit dla gotowki KES
  albo para debit/credit dla VKES, zawsze pod tym samym TX co event paczki.

- `intake` (tracking) -> ledger: `hub_fee_system`, `hub_fee_hub_vkes`, `hub_fee_worker`, `hub_fee_manager`.

- `sorting` (tracking) -> ledger: `hub_fee_*` (split jak wyzej).

- `transfer` (tracking) -> ledger: `company_profit_transit_bonus` + `hub_fee_*`.

- `outtake` (tracking) -> ledger: `hub_fee_*` (dla delivery_fee).

- `delivery` (tracking) -> ledger: `hub_fee_*` (dla outtake_fee).

- `courier` / `courier_bonus` (tracking) -> ledger: `courier_payout` / `courier_payout_bonus` + `courier_commission` + `courier_hub_vkes` + `courier_manager`.

- `company_profit_surplus` (tracking) -> ledger: `company_profit_surplus` (SYSTEM).

- `check_balance` (tracking) -> ledger: `check_balance` (SYSTEM).



## Powiazania z innymi tabelami

- `packages`:

  - insert przy `payment_creation` (nowa paczka).

  - update przy kazdym ruchu/zdarzeniu (status, current_hub, balance).

- `bag_parcels` + `bags`:

  - aktualizowane przy wkladaniu do worka, zmianie worka, tranzycie i rozpakowaniu.

- `hub_ready_pickup`:

  - dodanie paczki po `outtake` (gdy paczka docelowa) i usuwanie po wydaniu.

- `system_logs`:

  - wybrane zdarzenia operacyjne (np. split, skip, audyt).



## Uwagi praktyczne

- `package_events` to **tracking**, nie pelna historia finansowa.

- `wallet_ledger` to **zrodlo prawdy** dla finansow; splity sa tylko w ledgerze.

- Jeden tracking event moze powodowac **kilka wpisow** w ledgerze (split).



## Plan uporzadkowania kolejnosci (wrappery)

Cel: **zawsze ten sam porzadek** i zgodny `fingerprint` (hash trackingu) dla wszystkich wpisow ledger.



## Taski wdrozenia (kolejnosc powstawania paczki)

1. [x] payment_creation (tracking -> hash -> ledger)

2. [x] intake (tracking -> hash -> hub_fee split)

3. [x] courier / courier_bonus (tracking -> hash -> courier split)

4. [x] sorting / transfer / outtake / delivery (tracking -> hash -> hub_fee split)

5. [x] company_profit_surplus (skip + flush, osobny fingerprint)

6. [x] check_balance (tracking -> hash -> ledger)



### 1. Jedna funkcja na kluczowy flow

Wprowadzic wrappery, ktore robia **zawsze** te same kroki:

1. `append_event(tracking)`

2. `sync_package_history` (hash -> `_last_event_hash`)

3. `ledger_append_pkg(...)` z `fingerprint=_last_event_hash`



### 2. Wspolne wrappery (przyklady)

- `track_then_ledger(...)` ? proste zdarzenie finansowe 1:1 (np. `company_profit_surplus`, `check_balance`).

- `track_then_ledger_split(...)` ? zdarzenie + split (np. `courier`, `hub_fee`).

- `track_only(...)` ? czyste tracking (bez finansow).



### 3. Zasada kolejnosci

- **Nie wolno** wywolywac `_ledger_append_pkg` bezposrednio po obliczeniach.

- Wszystkie wpisy ledger musza przejsc przez wrapper, ktory **najpierw** zapisze tracking i pobierze hash.



### 4. Powiazania fingerprint

- `fingerprint` dla ledger = hash **ostatniego** trackingu (tego samego zdarzenia).

- Jesli ledger wpis wynika z `courier`/`courier_bonus`, to fingerprint musi byc z tego trackingu, a nie z `surplus`.



### 5. Gdzie wdrozac najpierw

- `courier` / `courier_bonus` (i splity: `courier_payout*`, `courier_commission`, `courier_hub_vkes`, `courier_manager`).

- `company_profit_surplus` (skip + flush).

- `hub_fee_*` (intake/transfer/outtake/delivery).



### 6. Regula testowa

- Dla kazdego wpisu w ledger: `fingerprint` musi odpowiadac temu samemu zdarzeniu w `package_events`.

- Jesli brak fingerprintu -> **blokuj zapis** i loguj WARN (bez cichych zapisow).

﻿# Package Event Catalog (Current Templates)



This file lists all package log entries that can be added by the system today.

Classification (since `event_type` is removed):

- `amount = NULL` => tracking

- `amount != NULL` => finance



Placeholders in templates:

- `{ts}` timestamp string

- `{pkg}` package id

- `{hub}` hub name

- `{to_hub}` destination hub name

- `{from_hub}` source hub name

- `{bag}` bag id

- `{km}` distance

- `{amount}` VKES/KES amount

- `{action}` action label (intake/transfer/delivery/outtake)

- `{path_details}` route encoded as `A--12.3--B--7.1--C`

- `{payment_mode}` KES or VKES

- `{weight}` kg



## Tracking (amount = NULL)

- `{ts} {action} -> {holder}{note}`

  - Generated by `update_holder()`

  - `{note}` optional: ` | Note: ...`

- `[bag][path_details][payment_mode][ KM: {km:.1f}][KG:{weight:.1f}]`

  - Generated by `payment_creation` and then prefixed with bag/box id.

  - Example: `[FA][BA--11.2--AA--31.1--CA][KES][ KM: 42.3][KG:1.0]`



## Finance (amount != NULL)

### Hub fee split (intake/transfer/delivery/outtake)

- `[{hub}] -> [SYSTEM]`

- `[{hub}] -> [HUB_VKES]`

- `[{hub}] -> [{worker_id}]`

- `[{hub}] -> [{manager_id}]`

- `[{hub}] -> [SYSTEM]` (no split_info)



### Courier payout split

- `[{from_hub}] -> [{courier_id}]`

- `[{courier_id}] -> [SYSTEM]`

- `[{hub}] -> [HUB_VKES]`

- `[{hub}] -> [{manager_id}]`



### System profit / corrections

- `{ts} [{pkg}] [SYSTEM] -> [COMPANY] Profit - unsettled ops | {amount:.2f} VKES`

- `{ts} [{pkg}] [SYSTEM] -> [COMPANY] Operational loss - correction | {amount:.2f} VKES`

- `{ts} [{pkg}] [SYSTEM] -> [COMPANY] Profit - skipped {skipped_hubs} | {amount:.2f} VKES`

- `{ts} [{pkg}] [SYSTEM] -> [COMPANY] Profit - budget > route cost, cap 10/km | {amount:.2f} VKES`

- `{ts} [{pkg}] [SYSTEM] -> [COMPANY] Asset transfer settlement | {amount:.2f} VKES`



### System top-up / subsidy

- `{ts} [{pkg}] [SYSTEM] -> [{hub}] TOP-UP | {amount:.2f} VKES (hub: {hub_fee:.2f} + transport: {transport_fee:.2f} at 10 KES/km)`

- `{ts} [SYSTEM] -> [{pkg}] TOP-UP | {amount:.2f} VKES`



### Asset transfer (internal assets treated like parcels)

- `{ts} [SYSTEM] -> [ASSET_POOL] Asset transfer charge | {amount:.2f} VKES`

- `{ts} [SYSTEM] -> [{asset_id}] ({path_details}) | {amount:.2f} VKES | KM: {km:.1f}`



### Route recalculation logs (finance)

- `{ts} [{pkg}] LOG_A: {path_details} | Km: {km:.1f} | km_rate: {old_rate:.2f} -> {new_rate:.2f} VKES/km | Balance: {balance:.2f} VKES`

- `{ts} [{pkg}] LOG_B({reason}): {path_details} | Km: {km:.1f} | km_rate: {old_rate:.2f} -> {new_rate:.2f} VKES/km | Balance: {balance:.2f} VKES`



### Skip-hop detail

- `{ts} [{pkg}] SKIP-HOP: {from_hub}->{skip_hub}->{to_hub} | Skipped {skip_hub} | Company profit: {amount:.0f} VKES`



### Balance finalization

- `{ts} [{pkg}] Check: {balance:.2f} VKES`



## Action strings used as event_key

- intake

- transfer

- delivery

- outtake

- sorting

- courier

- swap_in

- swap_out

## PRD Sync 2026-04-12 - Uppercase Plan Files vs Code

Zakres synchronizacji:
- `INWENTORY.md`
- `MIGRATION_SINGLE_FLOW_PLAN.md`
- `PLAN_CLIENT_SEARCH.md`
- `PRICING_MODEL_PLAN.md`
- `RUNTIME_SAVE_PLAN.md`
- `implementation_plan.md`

Ponizsza sekcja jest zapisem historycznym. Aktualny model inventory opisuje
sekcja 43; nie nalezy odtwarzac z tej sekcji tabeli `hub_inventory`,
`meta_json`, `pkg_code4` ani ograniczenia assetow do 1023.

### A) INWENTORY.md - stan wdrozenia

Wdrozone:
- `hub_inventory` dziala jako operacyjne zrodlo prawdy dla assetow (odczyt/walidacja przez DB).
- Status `asset` w formularzu paczki:
  - tryb pojedynczy,
  - blokada wielokrotnego wpisu dla asset.
- `Tag#` dla asset:
  - odczyt listy assetow z `hub_inventory` dla aktualnego huba,
  - wpis i filtr po `code32` (`inv_code` w base32),
  - walidacja kodu do listy dostepnych assetow.
- Przepisanie danych z `meta_json` assetu do formularza (`weight`, `dim_x`, `dim_y`, `dim_z`, nazwa do `note`).
- Lifecycle inventory:
  - przy starcie transportu: `IN_TRANSIT` + dopisanie `pkg_code4`,
  - w ruchu: aktualizacja holdera/hubu,
  - finalizacja na `outtake`: `ACTIVE` w hubie docelowym.
- `pkg_code4`: kompresja tylko duplikatow sasiednich.

Wdrozone dodatkowo (poza pierwotnym planem):
- Usunieto auto-seed assetow przy starcie terminal/flask.
- Usunieto pre-load runtime `AST-*` w `Hub.__init__`.

Do dalszego etapu:
- Pelny model `BOX` w `hub_inventory` (ruch, statusy, operacje) - plan opisany, ale nie domkniety produkcyjnie.
- Rozszerzenia statusow serwisowych (`DEGRADED`/`MAINTENANCE`/`RETIRED`) jako pelny flow operacyjny.

Model stanu skrzynki `BOX` po rozdzieleniu kondycji technicznej:

1. `hub_inventory.status` przechowuje stan operacyjny, m.in. `ACTIVE`,
   `IN_TRANSIT` i `RETIRED`.
2. `hub_inventory.is_degraded` przechowuje niezaleznie stan techniczny:
   `0` oznacza skrzynke sprawna, a `1` skrzynke uszkodzona lub zuzyta,
   ale nadal dopuszczona do pracy.
3. Zdjecie skrzynki z polki ustawia `status = IN_TRANSIT`, nie zmieniajac
   `is_degraded`.
4. Zwrot skrzynki na polke ustawia `status = ACTIVE`, nie zmieniajac
   `is_degraded`.
5. `RETIRED` oznacza trwale wycofanie i taka skrzynka nie jest dostepna
   do przydzielenia ani bilansowania operacyjnego.
6. Tekst `DEGRADED` pozostaje elementem interfejsu i kontraktu zmiany
   kondycji, ale nie jest juz zapisywany w kolumnie `status`.
7. Przelacznik `ACTIVE/DEGRADED` jest dostepny dla kazdej skrzynki i zmienia
   wylacznie `is_degraded`, niezaleznie od jej statusu operacyjnego.
8. Dla zmiany kondycji nie stosuje sie porownania poprzedniego stanu.
   Operacja jest idempotentnym ustawieniem `0/1`, a przy rownoleglych zapisach
   obowiazuje ostatni zatwierdzony zapis. Nie dotyczy to zmian statusu
   operacyjnego, ktore nadal maja osobne reguly konfliktu.

### B) MIGRATION_SINGLE_FLOW_PLAN.md - stan wdrozenia

Wdrozone:
- Wspolny kontrakt backend:
  - `build_parcel_request(...)`
  - `compute_parcel_preview(...)`
  - `submit_parcel_command(...)`
- TUI korzysta z backendowego flow (preview + submit).
- Flask korzysta z tego samego flow:
  - `POST /api/add_parcel`
  - `POST /api/parcel_preview`
- Ujednolicenie logiki tworzenia paczki i walidacji.

Uwaga:
- Od 2026-07-30 `parcel_service.py` i historyczne adaptery formularza
  zostaly usuniete. Mutacja przechodzi bezposrednio przez typowana
  komende.

### C) PLAN_CLIENT_SEARCH.md - stan wdrozenia

Wdrozone:
- Podpowiedzi kodow i wyszukiwanie lacza `hub_staff` + `clients`.
- Priorytet zrodel wg prefiksu kodu:
  - `C/W/M` -> najpierw staff, potem clients,
  - inne -> najpierw clients, potem staff.
- Autofill po kodzie dziala dla obu zrodel.
- Ignorowanie znakow specjalnych dla pol kodowych.
- Generowanie nowego kodu przy braku kodu dotyczy klienta; dane klienta sa zapisywane przez `upsert_client_details(...)`.

### D) PRICING_MODEL_PLAN.md - stan wdrozenia

Wdrozone / czesciowo:
- `calculate_dual_price(...)` dziala na modelu:
  - `cena = hub_fees + actual_km * base_value`,
  - `km_rate` wyznaczany z `base_value`.
- `settle_transport_leg(...)` liczy payout jako `dist * km_rate` (bez mnozenia przez wage).
- `submit_parcel_command(...)` przekazuje typowana paczke do wspolnego
  wykonawcy; projekcja wyceny pobiera `base_value` z wyceny
  zaawansowanej.

Czesciowo / otwarte:
- Fallback `base_value = 10 * weight` nadal istnieje, gdy brak base_value z modelu.
- Parametr `SCALE` z planu nie jest wydzielony jako jawny globalny regulator produktu.
- Dokument planu zakladal pelne "globalnie bez wagi"; obecna implementacja to praktycznie ten kierunek, ale z fallbackiem kompatybilnosci.

### E) RUNTIME_SAVE_PLAN.md - stan wdrozenia

Wdrozone:
- Rozbicie zapisu runtime na wrappery i funkcje bazowe:
  - `commit_topology(...)`
  - `commit_runtime_state(...)`
  - `commit_bag_state(...)`
  - `commit_packages_only(...)`
  - `commit_tracking_only(...)`
  - `commit_full_snapshot(...)`
- `persist_runtime_topology(...)` sklada sie z mniejszych modulow zapisu.

Czesciowo / otwarte:
- W kodzie nadal wystepuja wywolania `persist_runtime_snapshot(...)` w punktach operacyjnych (to zgodne z "checkpoint commit", ale nie jest pelnym przejsciem na wylacznie granularne commity per tabela).
- Dalsza optymalizacja "minimal row writes only" pozostaje obszarem iteracji.

### F) Spojnosc „drogi do celu” i event flow (aktualny stan)

Potwierdzony obecny flow paczki:
- `payment_creation` -> `intake` -> `courier` -> `sorting/transfer` -> `outtake` -> `delivery` -> `check_balance`

Dla asset:
- finalizacja biznesowa i inventory na `outtake` (bez oczekiwania na odbior klienta),
- tracking/ledger pozostaja spiete przez obecny model eventow i fingerprintow.

## PRD Update 2026-04-12 (Asset + Inventory + Route Flow)

Ostatnia duza aktualizacja PRD przed tym wpisem byla z dnia pliku: **2026-04-05**.
Ponizej zebrane zmiany z ostatnich dni po migracjach runtime/DB i wdrozeniach w kodzie.

### 1) Hub inventory jako source of truth dla assetow

- `hub_inventory` jest jedynym zrodlem danych operacyjnych o assetach (lokalizacja, status, powiazanie z paczka).
- Usunieto automatyczne dosiewanie assetow przy starcie aplikacji:
  - brak wywolania `seed_hub_inventory_assets_if_missing(...)` przy starcie terminala i Flaska.
- Usunieto pre-load runtimeowych assetow `AST-*` w `Hub.__init__`:
  - runtime nie tworzy domyslnych assetow "z powietrza",
  - liczba i sklad assetow sa brane z DB.

### 2) Lifecycle assetu (transport i domkniecie)

- Start transportu assetu:
  - `hub_inventory.status = IN_TRANSIT`,
  - `pkg_code4` dopisywany o `package_id` (bez duplikatu sasiedniego),
  - `db_ts` aktualizowany.
- W ruchu:
  - holder/hub w `hub_code2` jest aktualizowany przez logike przeplywu (kurier/hub).
- Finalizacja:
  - dla assetu domkniecie nastepuje na **outtake** w hubie docelowym (nie czeka na customer `delivery`),
  - `hub_inventory.status` przechodzi na `ACTIVE`,
  - `hub_code2` ustawiany na hub docelowy (asset "na polce"),
  - rozliczenie i check dla assetu wykonuje sie w tym momencie.

### 3) Odtwarzanie runtime po reloadzie

- Naprawiono odtwarzanie paczek z DB:
  - przy rehydracji `Parcel` loader czyta `packages.special_care`,
  - jesli `special_care` zawiera `asset`, obiekt runtime dostaje `is_asset=True`.
- Skutek:
  - po reloadzie runtime nie gubi juz typu asset,
  - aktualizacje `hub_inventory` dzialaja nadal poprawnie (bez "utkniecia" na `IN_TRANSIT`).

### 4) Tag# dla asset: filtr i walidacja inv_code

- W trybie `asset`, pole `Tag#`:
  - wyszukuje **wylacznie** po kodzie `inv_code` prezentowanym jako `base32` (`code32`),
  - nie wyszukuje juz po nazwie/metadanych.
- Podczas wpisywania:
  - dopuszczany jest tylko taki prefix, ktory istnieje w puli kodow assetow danego huba
    (np. wpisanie `B` pokazuje `BA`, `BB`, `BC`... jesli realnie istnieja).
- Finalizacja pola:
  - zaakceptowany jest tylko pelny kod istniejacy w liscie assetow aktualnego huba,
  - niepoprawny kod jest odrzucany.
- Backend walidacji nadal sprawdza:
  - decode `Tag#` -> `inv_code`,
  - istnienie assetu w aktualnym hubie.

### 5) `db_ts` w `hub_inventory` (zasada aktualizacji)

- `db_ts` jest timestampem technicznym rekordu inventory.
- Zmienia sie tylko przy zapisie do `hub_inventory`:
  - `INSERT` nowego rekordu,
  - `UPDATE` (status, holder/hub, pkg_code4).
- Odczyty UI/listy nie zmieniaja `db_ts`.
- Format czasu jest UTC (`...Z`), co moze dawac roznice wzgledem czasu lokalnego.

### 6) Droga do celu (routing) - doprecyzowanie przeplywu

- Mechanika trasy pozostaje oparta na wyznaczeniu ekonomicznej/sciezki docelowej i decyzji w hubie:
  - `sorting` / `transfer` / `outtake` sa wybierane zaleznie od pozycji paczki i warunkow kontenera.
- W sealed-transit utrzymana logika:
  - gdy paczki w jednostce maja wspolny kolejny hop, kontener jedzie dalej bez otwierania,
  - bonusy i rozliczenia przypisane do tego flow pozostaja po stronie ledger/tracking.
- Dla ostatniego huba:
  - `outtake` to przyjecie w hubie docelowym,
  - `delivery` to wydanie klientowi (dla standardowej paczki),
  - dla assetu finalizacja na `outtake` (jak opisano wyzej).

## PRD Sync 2026-04-12 - implementation_plan.md (szczegolowo)

Zakres planu:
- integracja `base_value` z wyceny paczki do ceny trasy,
- zmiana znaczenia `km_rate` na stawke per km (bez mnozenia przez wage),
- spojnosc payout/recalc/route-change/skip/top-up.

### 1) Elementy wdrozone

1. `calculate_dual_price(...)`
- model ceny oparty o `base_value`:
  - `total = hub_fees + km * base_value`,
  - `km_rate = base_value`.
- funkcja przyjmuje `base_value` jako parametr i liczy dual-route A/B.

2. `create_and_add_parcel(...)`
- obsluguje przekazanie `base_value` do `calculate_dual_price(...)`.

3. `settle_transport_leg(...)`
- payout liczony bez mnozenia przez wage:
  - `payout = dist * km_rate`.

4. route recalc po zmianach topologii/routingu
- przeliczenia `km_rate` oparte o `remaining / km` (bez mnozenia przez wage):
  - recalc bag route,
  - recalc po toggle hubow.

5. tworzenie paczki przez wspolny flow submit
- `submit_parcel_command(...)` korzysta z
  `SubmitParcelCommand`; wewnetrzna, tylko-do-odczytu projekcja wyceny
  pobiera `price_base` z `preview_package_pricing(...)` i przekazuje
  jako `base_value` do tworzenia paczki.

### 2) Elementy wdrozone czesciowo (fallback/kompatybilnosc)

1. fallback `base_value`
- gdy brak wyliczonego `base_value`, system ma fallback kompatybilnosci:
  - `base_value = 10 * weight`.
- efekt: stare/sciezki awaryjne nadal dzialaja, ale model nie jest "czysty 100%".

2. limity/cap payout w job market
- czesc logiki nadal ma historyczne ograniczenia `min(..., 10.0)` dla efektywnej stawki.
- to nie blokuje dzialania, ale moze przycinac payout wzgledem czystego modelu per-km.

3. top-up i helpery historyczne
- glowne liczenie transportu idzie przez `km_rate`,
  ale czesc starszych sciezek adminowych nadal ma kompatybilnosciowe wartosci domyslne.

### 3) Elementy otwarte z implementation_plan.md

1. parametr globalny `SCALE`
- w planie przewidziany jako jawny regulator (`package_pricing_scale`),
  obecnie brak finalnego wdrozenia produktu-endpointow pod ten parametr.

2. pelna kalibracja modelu
- plan zawiera docelowe przedzialy cen dla scenariuszy 1kg/20kg i dystansow.
- kalibracja jest czesciowo wykonana przez model wyceny, ale nie zamknieta jako finalna polityka.

### 4) Wplyw na "droge do celu"

- model `base_value/km_rate` zmienia glownie finansowanie odcinkow,
  nie zmienia bazowej kolejnosci zdarzen logistycznych:
  - `payment_creation -> intake -> courier -> sorting/transfer -> outtake -> delivery -> check_balance`.
- decyzje sealed-transit, pomijanie huba, bonusy i company-profit pozostaja
  w tym samym miejscu flow; zmienia sie glownie podstawa kosztu transportowego.

## PRD Sync 2026-04-22 - refaktoryzacja routingu (bez Logiki C)

Zakres:
- Refaktor techniczny, bez zmiany biznesowej logiki tras.
- Brak wdrozenia Logiki C (celowo wstrzymane do osobnego planu).

### 1) Aktualna architektura tras

1. Dodano jeden zewnetrzny modul: `routing_core.py`.
2. Modul zawiera:
   - silnik tras: `edge_cost`, `dijkstra_route`, `route_with_strategy`, `get_optimal_route`,
   - helpery: `find_k_shortest_routes`, `find_routes`, `find_route_greedy_legacy`,
   - kalkulacje i formatery: `calculate_route_cost`, `route_to_str`, `format_path_with_distances`,
   - recalc po zmianach topologii: `recalculate_bag_route`, `recalculate_routes_after_hub_toggle`, `recalculate_routes_full_scan`.

### 2) Kompatybilnosc z obecnym systemem

1. `courier_logic_poc.py` pozostaje warstwa kompatybilnosci:
   - funkcje publiczne zostaly zachowane,
   - dzialaja jako wrappery delegujace do `routing_core.py`.
2. Call-site w systemie (Flask, event service, hub service, terminal) nie wymagaja zmiany sygnatur.
3. Runtime i DB flow pozostaja bez zmiany (to jest refaktor kodu, nie zmiana modelu danych).

### 3) Logika A/B - status

1. Przelacznik `ROUTING_STRATEGY` (`A`/`B`) pozostaje aktywny.
2. Magnetyzm i jego flagi pozostaja zgodne z aktualnym zachowaniem systemu.
3. Refaktor nie zmienia zasad wyceny ani kolejnosci eventow logistycznych.

### 4) Dalsze prace routingowe - status

1. Ten sync obejmuje tylko refaktor techniczny aktualnego routingu.
2. Nowe warianty algorytmiczne sa poza tym zakresem i beda opisywane osobno.

## PRD Sync 2026-05-02 - Konsolidacja i Rebalancing Inwentarza

Ta sekcja opisuje wdrozenie zunifikowanego systemu zarzadzania inwentarzem (worki, skrzynki) oraz automatyczny mechanizm utrzymywania rownowagi zasobow w sieci.

### 1. Rozdzielenie inwentarza (aktualizacja 2026-08-13)
Wycofano `hub_runtime_state` oraz zunifikowana tabele `hub_inventory`.
- **Worki (BAG_STOCK)**: anonimowa liczba w `hubs.bag_stock`.
- **Skrzynki (BOX)**: indywidualne rekordy w `hub_box_inventory`.
- **Assety**: indywidualne rekordy w `hub_asset_inventory`.
- **Zakresy ID**:
  - assety: `0+`, bez gornej granicy i bez przeskoku przy 1024,
  - skrzynki: `1024+`, aby poczatkowe kody Code32 mialy trzy znaki.
  - Fizyczne W i logiczne V korzystają ze wspólnego generatora kodów
    transportowych zapisywanych w `bags.id`; ich typ rozstrzyga
    `container_type`. Puste worki w `hubs.bag_stock` pozostają anonimowe i
    otrzymują kod W dopiero razem z pierwszą paczką.

### 2. Planowanie redystrybucji po korytarzach paczek

Historyczny algorytm połowy różnicy nie obowiązuje. Każdy hub ma jawne progi
`minimum`, `target` i `maximum` osobno dla `BAG_STOCK` oraz skrzynek. Planner
korzysta wyłącznie z tras, które i tak powstały dla paczek; nigdy nie tworzy
kursu zawierającego wyłącznie puste opakowania.

Planner buduje skierowany graf ze wszystkich tras paczek obecnych w ofertach,
łącznie z wariantami `STANDARD` i `SKIP`. Może patrzeć dalej niż najbliższy hub,
ale każde przesunięcie musi być możliwe jako ciąg istniejących kursów paczek.
Priorytet otrzymuje hub poniżej minimum, następnie większy niedobór do targetu,
mniejsza liczba przeładunków, wariant przeskoku, krótsza odległość i stabilny
tie-break po kodach.

Worki i skrzynki są planowane niezależnie. Ta sama oferta może więc przewozić
puste worki do jednego huba bilansowania, a skrzynki do innego. Brak choć jednego
progu nie jest traktowany jako zero: wyłącza plan dla bieżącego wyliczenia i
zwraca jawny błąd konfiguracji.

### 3. Rezerwacja i manifest cargo

- Puste worki są anonimową liczbą `EMPTY_BAG_STOCK`; przy rezerwacji są
  odejmowane z `hubs.bag_stock` huba źródłowego.
- Każda skrzynka jest pozycją `EMPTY_BOX` z konkretnym
  `hub_box_inventory.id`. Rezerwacja ustawia wybrane rekordy jako `RESERVED`,
  ale nie zmienia jeszcze ich fizycznego huba.
- Kurier może wyłącznie zmniejszyć zaproponowaną liczbę worków albo odznaczyć
  skrzynki. Nie może sam zwiększyć planu.
- Przed zapisem backend ponownie oblicza plan w tej samej transakcji
  `BEGIN IMMEDIATE`. Zmiana rewizji, niedostępny zasób, inny cel albo większy
  wybór kończą się `409` i pełnym rollbackiem; system nie podstawia innej
  skrzynki.
- Puste opakowania nie zwiększają wynagrodzenia ani bonusu kuriera.
- `VIRTUAL_BAG` nie może przewozić fizycznego cargo redystrybucyjnego.

### 4. Przyjęcie zasobów

Puste worki są przyjmowane do `hubs.bag_stock` na końcu aktualnego zlecenia.
Skrzynka zawsze musi zostać rozładowana i przyjęta w docelowym hubie bieżącego
zlecenia; nie istnieje tranzyt skrzynki bez przyjęcia. Jeśli ma jechać dalej,
powstaje dla niej nowy plan i nowa rezerwacja z tego huba.

### 5. Symulacje akceptacyjne redystrybucji pustych worków (2026-08-17)

Ta sekcja jest obowiązującym zapisem parametrów i wniosków z symulacji
`sym_box.py`. Jej celem jest uniknięcie ponownego ustalania tych samych
założeń. Szczegółowy opis techniczny symulatora znajduje się w `sym_box.md`,
natomiast poniższe parametry i kryteria są częścią decyzji produktowej.

#### 5.1. Co dokładnie jest testowane

- Symulator używa produkcyjnej topologii hubów, nazw, współrzędnych, połączeń,
  blokad i długości dróg. Baza `kenya_courier.db` jest otwierana tylko do
  odczytu podczas startu; przebieg nie tworzy `sym_box.db` i niczego nie
  zapisuje do bazy produkcyjnej.
- Symulator nie ma uproszczonej kopii planera. Wejście pamięciowe
  `plan_redistribution_from_snapshot()` oraz produkcyjne
  `plan_redistribution_for_offers()` wywołują ten sam rdzeń decyzyjny
  `_plan_redistribution_loaded()` z `courier_redistribution_planner.py`.
- Test obejmuje anonimowe, puste worki `BAG_STOCK`. Skrzynki numerowane oraz
  błędy fizycznego przyjęcia przez pracownika nie są częścią tej symulacji.
- Losowa trasa reprezentuje rzeczywisty kurs z pełnym workiem produktów.
  Redystrybucja może wyłącznie doczepić puste worki do takiego kursu i nigdy
  nie tworzy osobnego kursu tylko dla pustych opakowań.
- Każdy odcinek kończy się fizycznym przyjęciem przewożonych worków w hubie
  docelowym. Jeżeli trasa biegnie dalej, następny odcinek otrzymuje nowy plan
  na podstawie aktualnego stanu sieci i całej pozostałej trasy.
- Cel dalszego bilansowania jest adaptacyjny, a nie twardo przypisany do
  konkretnych anonimowych worków. Hub pośredni może zatrzymać potrzebną część,
  a kolejny plan może zwiększyć albo zmniejszyć dalszy transport po zmianie
  rzeczywistych stanów.

#### 5.2. Wspólne parametry finalnego testu

| Parametr | Obowiązująca wartość |
|---|---|
| Topologia | 13 aktywnych hubów systemowych: AA, BA, BQ, BR, CA, DA, EA, FA, GA, HA, IA, JA, PA |
| Długość trasy | losowo 1–7 odcinków; wyłącznie prosta trasa po połączeniach topologii |
| Początek | 1 aktywna trasa |
| Limit aktywnych tras | 50 |
| Globalny limit | 1 000 000 wygenerowanych tras |
| Rozrost współbieżności | nowa trasa po drugim odcinku trasy mającej co najmniej 3 odcinki; zakończona trasa jest zastępowana kolejną |
| Seed odtwarzalności | `20260817` |
| Snapshot terminalowy | domyślnie co 1000 utworzonych tras, w kroku z kurierami będącymi w transporcie |
| Sterowanie | jedna `SPACJA` zatrzymuje i wznawia oba warianty w tym samym kroku |
| Ruch startowy | AA, BA i DA mają wagę 1,30; wszystkie pozostałe huby 1,00 |
| Zaburzenie zapasu | co 200 wykonanych odcinków te same 10–30 worków są przesuwane pomiędzy tymi samymi dwoma losowymi hubami w obu wariantach |
| Ochrona źródła zaburzenia | po przesunięciu źródło zachowuje co najmniej 20 worków |
| Przeskok trasy | co 200. trasa ma pierwotnie 5–7 odcinków i pomija losowy hub na pozycji 1, 2 albo 3 |
| Maximum | ogranicza nową rezerwację redystrybucji; nie może zablokować fizycznego przyjęcia kuriera ani powrotu pełnego worka jako pustego |
| Pamięć | najwyżej 50 obiektów aktywnych tras plus stałe liczniki; zakończone trasy są zapominane |

Przeskok jest świadomym zdarzeniem testowym. Planer otrzymuje trasę już po
pominięciu huba. Jeżeli istnieje bezpośrednia droga, używana jest jej długość;
w przeciwnym razie długość przeskoku odpowiada sumie dwóch zastępowanych
odcinków. Zdarzenie nie omija obowiązku przyjęcia na rzeczywistym końcu
bieżącego odcinka.

#### 5.3. Dwa warianty liczone równolegle

Oba warianty dostają identyczne trasy, momenty utworzenia tras, przeskoki,
huby zaburzeń oraz liczby przesuwanych worków. Różnią się wyłącznie stanem
początkowym i polityką progów. Jeżeli jeden wariant osiągnie warunek
zatrzymania, całe porównanie zostaje zatrzymane w tym samym kroku.

| Huby | Wariant A: stan / minimum / target / maximum | Wariant B: stan / minimum / target / maximum |
|---|---:|---:|
| Wszystkie poza GA i HA | `100 / 50 / 100 / 120` | `80 / 50 / 80 / 120` |
| GA | `100 / 50 / 60 / 120` | `80 / 50 / 120 / 120` |
| HA | `100 / 50 / 120 / 120` | `80 / 50 / 60 / 120` |

Wariant A ma początkowo 1300 worków, a wariant B 1040 worków. Suma worków w
każdym wariancie jest niezależnym niezmiennikiem:

```text
worki dostępne w hubach
+ pełne worki produktów realizujące aktywne trasy
+ puste worki zarezerwowane i będące w transporcie
= początkowa suma wariantu
```

#### 5.4. Historia wykonanych wariantów testowych

Poniższe próby były kolejnymi etapami zwiększania trudności. Nie są osobnymi
obowiązującymi konfiguracjami produkcji; dokumentują, że wynik finalny nie
zależy wyłącznie od jednego łagodnego zestawu parametrów.

| Etap | Parametry lub zmiana | Wynik |
|---|---|---|
| Bazowy stan równy | każdy hub 100; minimum 50, target 100, maximum 200; losowe trasy 1–7 | brak utraty bilansu i brak wyczerpania w próbach krótkich |
| Zwiększony ruch | waga startu AA, BA i DA najpierw 1,10, następnie 1,30 | planer zachował stabilność; finalnie pozostawiono 1,30 |
| Węższy magazyn | minimum 80, target 100, maximum 120, następnie minimum obniżone do 50 | testy ukończone; minimum 50 i maximum 120 przyjęto do dalszych prób |
| Losowe zaburzenia | co 200 odcinków przesunięcie 10–30 worków między hubami z zachowaniem sumy globalnej | planer usuwał powstałe niedobory i nadwyżki bez osobnych kursów |
| Przeskoki | co 200 tras pominięcie losowego huba na odcinku 1, 2 albo 3 trasy dłuższej niż 4 odcinki | ponowne planowanie na zmienionej trasie nie naruszyło bilansu |
| Niższy stan początkowy | każdy hub 90, najpierw target 100, następnie target 90 | sieć ukończyła próby mimo mniejszej całkowitej puli worków |
| Równoległe A/B | start/target 100/100 kontra 80/80 przy identycznym scenariuszu | oba warianty pozostały zsynchronizowane i ukończyły próby |
| Przeciwne cele GA/HA | finalne wyjątki targetów 60/120 oraz 120/60 | planer przenosił zapas w przeciwnych kierunkach zgodnie z polityką każdego wariantu |
| Finalny test długotrwały | pełna konfiguracja z punktów 5.2–5.3, limit 1 000 000 tras | oba warianty osiągnęły limit bez wyczerpania huba i bez naruszenia niezmienników |

#### 5.5. Wynik testu miliona tras

Obowiązujący test akceptacyjny został uruchomiony poleceniem:

```powershell
python sym_box.py --seed 20260817 --max-routes 1000000 `
  --snapshot-every 1000000 --no-clear
```

Wspólny przebieg dwóch wariantów zakończył się kodem procesu `0` po około
349 sekundach. Oba warianty osiągnęły bezpiecznik 1 000 000 tras. Nie wystąpił
ujemny stan, utrata lub utworzenie worków, przekroczenie 50 aktywnych tras ani
rozsynchronizowanie tras i zdarzeń A/B. Żaden hub nie osiągnął stanu `0`.

Testy regresyjne symulatora i planera obejmują między innymi: zgodność
planowania DB/snapshot, długości tras, progi, brak blokady fizycznego przyjęcia
przez `maximum`, bilans globalny, stopniowe dojście do 50 tras, wspólny
harmonogram A/B, przeskoki, zaburzenia, cele per hub oraz raporty `MAX` i
`TERAZ` dla ładunku kurierów.

#### 5.6. Dlaczego system uznajemy za odporny i akceptowalny

System redystrybucji pustych worków spełnia kryterium akceptacji, ponieważ:

1. korzysta wyłącznie z istniejącego ruchu paczek i nie generuje kosztownych,
   samodzielnych kursów pustych opakowań;
2. analizuje całą pozostałą trasę, ale po każdym rzeczywistym przyjęciu
   ponownie liczy plan z najnowszych stanów;
3. pozwala hubowi pośredniemu zatrzymać potrzebną część worków, a pozostałą
   nadwyżkę skierować dalej; anonimowe worki nie mają niepotrzebnego twardego
   przypisania do pierwotnego celu;
4. priorytetyzuje stan poniżej minimum, następnie wielkość niedoboru do
   targetu, liczbę przeładunków i odległość;
5. uwzględnia rezerwacje i worki już jadące, dzięki czemu nie planuje tej
   samej dostępności wielokrotnie;
6. zachowuje globalny bilans przy normalnym ruchu, zaburzeniach zapasu,
   przeskokach hubów, różnych targetach i maksymalnej współbieżności;
7. przyjęcie opisuje stan fizyczny i nie może zostać odrzucone tylko dlatego,
   że hub przekroczy `maximum`; limit działa przed nową rezerwacją;
8. działa w pamięci ograniczonej liczbą aktywnych tras, a nie liczbą wszystkich
   wykonanych tras, co pozwoliło ukończyć test miliona tras bez wzrostu
   historii w RAM lub DB.

Nie wprowadzamy obecnie twardego celu końcowego dla konkretnej partii
anonimowych worków ani enumeracji wielu alternatywnych dróg. Wyniki potwierdzają,
że ponowne, adaptacyjne planowanie po każdym przyjęciu jest wystarczające i
lepiej reaguje na zmianę stanów w trakcie trasy. Alternatywne drogi należy
rozważyć dopiero przy rzeczywistym problemie braku pojemności, anulowaniu
odcinka albo trwałej niedostępności połączenia.

#### 5.7. Granica tej akceptacji

Milion tras potwierdza odporność algorytmu przy poprawnych danych wejściowych;
nie potwierdza jeszcze poprawności pracy ludzi ani zgodności systemowego stanu
z fizycznym magazynem. Przed wdrożeniem operacyjnym wymagany jest osobny flow:

- pracownik podaje liczbę przyjętych pustych worków;
- pełne worki są ważone;
- skrzynki są potwierdzane po indywidualnych numerach;
- każdy odcinek kończy się przyjęciem, również gdy przesyłka jedzie dalej;
- rozbieżność manifestu, liczby lub wagi otwiera korektę/spór i nie jest cicho
  uznawana za poprawny stan;
- planer korzysta dopiero z zatwierdzonego, aktualnego stanu huba.

Bez tego mechanizmu nawet poprawny matematycznie planer może podejmować dobre
decyzje na podstawie błędnych danych. Akceptacja symulacji nie zamyka więc
zadania kontroli fizycznego przyjęcia opakowań; wskazuje, że po dostarczeniu
wiarygodnych stanów sam algorytm redystrybucji jest wystarczająco stabilny.


---

## 22. Bag Events Flow — Pelna sekwencja zdarzen worka (2026-05-17)

### 22.1 Sekwencja statusow worka (bag_events)

Kazdy worek przechodzi przez nastepujace statusy, logowane w tabeli `bag_events`:

```
OPEN → SEALED → RESERVED → LOADING → IN_TRANSIT → RECEIVED → (TRANSFER/SORTING/OUTTAKE) → ARCHIVED
```

| Status | Kto wywoluje | Co sie dzieje |
|--------|-------------|---------------|
| OPEN | Hub (auto przy nadaniu paczki) | Worek otwarty, przyjmuje paczki |
| SEALED | Hub (recznie albo przy wyjezdzie W/S zarezerwowanego jako OPEN) | Opakowanie zamkniete, gotowe do transportu |
| RESERVED | Kurier (bierze zlecenie z gieldy) | Worek zarezerwowany, timer 30min |
| LOADING | System (dispatch) | Cargo rebalancing (puste worki/skrzynki ladowane) |
| IN_TRANSIT | Kurier (rusza w trase) | Kurier przejmuje custody; wyplata pozostaje PENDING |
| RECEIVED | Pracownik huba docelowego | Worek dotarl, czeka na sortowanie |
| TRANSFER | Pracownik (strzalka prawo) | Worek jedzie dalej (sealed, nowe ID) |
| SORTING | Pracownik (strzalka prawo per paczka) | Paczki rozdzielane do nowych workow |
| OUTTAKE | System (paczka dotarla do celu) | Paczka trafia do ready_for_pickup |
| ARCHIVED | System (worek pusty po sortowaniu) | Worek usuniety z DB, inwentarz +1 |

#### Reczna zmiana OPEN/SEALED w Hub API

Przelacznik opakowan nie ufa stanowi zapamietanemu przez przegladarke.
Zadanie zmiany zawsze zawiera `expected_status` oraz stan docelowy. Backend
wykonuje pojedynczy warunkowy zapis `UPDATE ... WHERE status =
expected_status` i dopuszcza wylacznie przejscia `OPEN -> SEALED` oraz
`SEALED -> OPEN`.

Jesli inny pracownik albo proces zmienil worek np. na `RESERVED`, zapis
operatora nie nadpisuje nowszego stanu. Endpoint zwraca konflikt `409` z
aktualnym statusem, a Hub App po kazdej probie ponownie pobiera z DB pelny
stan opakowan i pozostalych workow. Stan inny niz `OPEN/SEALED` jest
wyswietlany w miejscu przelacznika jako nieaktywny wskaznik, np.
`RESERVED`. To samo odswiezenie z DB jest wykonywane przy wyborze kierunku
na mapie opakowan.

Drzewo kierunku jest panelem informacyjnym huba i nie filtruje workow po
statusie. Pokazuje `OPEN`, `SEALED`, `RESERVED`, `LOADING`, `IN_TRANSIT`,
`RETURNED`, `RECEIVED` oraz ewentualny nowy status zapisany w DB. Pole
paczki w worku pokazuje code4, pelna trase hubow, wymiary, obliczona
objetosc w `m3` i wage w `kg`. Separatory dziesietne tych wartosci wynikaja
z ustawienia formatu liczb aktywnego pracownika Hub App.

### 22.2 Flow w TUI (panel Przyjecie/Tablica)

1. Worek IN_TRANSIT pojawia sie pod kurierem `🚚[C-XX-1]`
2. Pracownik naciska strzalke prawo (x2) → status RECEIVED
3. Cargo (puste worki/skrzynki) musi byc zatwierdzone PRZED sortowaniem:
   - Strzalka prawo (x2) na `🎒+N` → dodaje worki do stanu huba → 🆗
   - Strzalka prawo (x2) na `🧃[XXX]` → aktywuje skrzynke w hubie → 🆗
4. Po zatwierdzeniu cargo, paczki moga byc sortowane:
   - Strzalka prawo (x2) na paczce → sorting do worka → `[→ BCD]` (ID worka)
   - Gdy zostaja paczki w jednym kierunku → worek auto-promote do TRANSFER
5. Transfer worka:
   - Strzalka prawo (x2) na worku z `[TRANSFER → G]` → sealed, nowe ID
   - Paczki dostaja `[BUF → BUFF]` (stary ID → nowy ID)
6. Drzewo NIE jest przebudowywane — wszystkie zmiany in-place (set_label)
7. Wpisy zostaja widoczne do opuszczenia trybu przyjecia

### 22.3 Flow w Flask (fast_flow)

Flask `/api/apply_job` wykonuje pelny cykl w jednym kroku:

```python
apply_market_job(defer_arrival=False)
  → set_bag_reserved()           # RESERVED + bag_event
  → dispatch_set_loading()       # LOADING + cargo rebalancing + bag_event
  → apply_assignment()           # courier payout + hub processing (sorting/transfer/outtake)
```

Po `apply_assignment(defer_arrival=False)`:
- Courier payout naliczony (p_share = dist × km_rate)
- Hub fee naliczone (sorting=50, transfer=50/10, outtake=30)
- Paczki na final leg → ready_for_pickup
- Paczki w tranzycie → nowy worek (sealed transit lub sorting)

### 22.4 Cargo (puste worki/skrzynki) — rozladowanie

- **TUI:** Reczne zatwierdzenie (strzalka prawo x2 na cargo node). Blokada sortowania/transferu dopoki cargo nie zatwierdzone.
- **Flask:** Automatyczne rozladowanie przy RECEIVED (`auto_unload_cargo=True`).
- **Rebalancing:** `dispatch_set_loading` automatycznie laduje cargo do worka na podstawie `_calculate_rebalance_needs` (roznica stanow miedzy hubami).

---

## 23. Poprawki Flask — Spojnosc i Optymalizacja (2026-05-17)

### 23.1 Naprawione problemy spojnosci

1. **Silent mode bug** — `apply_assignment` w `LOG_MODE="silent"` (Flask) wywolywal `reload_runtime_topology_from_db()` po `ready_changed`, co nadpisywalo runtime balance starymi danymi z DB. Usuniete.
2. **km_rate nadpisywanie** — `_rebuild_runtime_parcel_metrics()` (wywolywana przez reload) przeliczala `km_rate` dynamicznie z aktualnego balance zamiast zachowac stala z kreacji. Usuniete reloady z flow transportu.
3. **system_subsidy w delivery** — Flask sztucznie doladowywal balance do 20 VKES przed delivery. Usuniete — check_balance pokazuje surowe dane.
4. **Brak persist po auto-delivery** — delivered paczki nie byly zapisywane do DB. Dodany `commit_runtime_operation`.
5. **Brak persist po toggle_bag_status** — zmiana statusu worka nie przetrwala restartu. Dodany `commit_runtime_operation`.

### 23.2 Optymalizacje

1. **Usuniety `reload_runtime_topology_from_db()`** z `tui_send_created_package` — nie przelicza Dijkstry dla wszystkich paczek po nadaniu.
2. **Usuniety reload z petli** w `market_apply_loading_status` — nie nadpisuje km_rate per bag.
3. **`_persist_topology_db`** — flush ledger tylko dla paczek z pending entries (nie ALL).
4. **Login/logout** — `commit_runtime_operation` zamiast `commit_full_operation` (lzejszy).
5. **`api_hubs_add/move`** — poprawiona kolejnosc: persist → recalculate (nie odwrotnie).
6. **Usuniety `_recolor_local_names`** z login/logout (login nie zmienia topologii).
7. **Usuniete martwe funkcje** — `_package_code4_map`, `_format_wallet_text`, `_normalize_wallet_history_entry`.

### 23.3 Zasada: Flask = TUI

- Flask fast_flow uzywa `apply_market_job(defer_arrival=False)` — ta sama funkcja co TUI.
- Jedna sciezka finansowa — brak rozbieznosci w naliczaniu kwot.
- `dispatch_set_loading` wywolywane wewnatrz `apply_market_job` (cargo rebalancing).
- `auto_unload_cargo=True` tylko w Flask (TUI wymaga recznego zatwierdzenia).

---

## 24. Panel Odbioru Paczki — Uproszczone haslo (2026-05-17)

### 24.1 Format `pickup_auth` w DB

Pole `pickup_auth` w tabeli `packages` przechowuje:
- `""` (pusty) = brak hasla → wydaj bez pytania
- `"ID:"` = weryfikacja po danych osobowych odbiorcy (imie+nazwisko)
- `"Phone:"` = weryfikacja po telefonie
- `"Email:"` = weryfikacja po emailu
- **Cokolwiek innego** = to jest haslo, trzeba je podac przy odbiorze

### 24.2 Flow odbioru (TUI)

1. Pracownik wchodzi w tryb "Szukaj" (opcja 1)
2. Wpisuje ID paczki (4 znaki)
3. System sprawdza `pickup_auth`:
   - Pusty lub etykieta (ID:/Phone:/Email:) → auto-verify, wydaj bez pytania
   - Tekst hasla → pracownik musi wpisac haslo, system porownuje
4. Po weryfikacji: strzalka prawo (x2) → `deliver_to_customer`

### 24.3 Rehydracja paczki z DB

Gdy paczka jest w `hub_ready_pickup` (DB) ale nie w `TRACKED_ITEMS` (runtime):
- `get_ready_for_pickup()` automatycznie odbudowuje obiekt Parcel z DB
- Laduje: balance, pickup_auth, receiver data, last_event_hash
- Dodaje do `TRACKED_ITEMS` — delivery moze dzialac normalnie

---

*Dokument zaktualizowany: 2026-05-17*
*Status: Flask/TUI spojnosc naprawiona, panel przyjecia z in-place updates*

## 25. Uzupelnienia PRD (zgodnosc z aktualnym kodem, 2026-05-17)

Punkt 2 (brakujace informacje operacyjne) zostaje dopisany tak:

1. Status `RETURNED` jest pelnoprawnym stanem worka i ma osobne przejscia:
   - `RESERVED/LOADING -> RETURNED`
   - `RETURNED -> OPEN` albo `RETURNED -> SEALED`
   - Przy `RETURNED -> OPEN/SEALED` czyszczone sa `reservation_ts` i `holder_id`.

2. Rezerwacja worka nie jest na stale 30 min:
   - UI pozwala wybrac czas w zakresie `1..30` minut.
   - DB i logika zawsze clampuja wartosc do `1..30`.

3. Aktualny model tabeli `bags` (minimum dokumentacyjne):
   - `id`, `from_hub_name`, `to_hub_name`, `status`, `is_box`
   - `holder_id`, `reservation_ts`
   - `bag_metrics_json`, `empty_bags_carried`, `db_ts`

4. `bag_events` zapisuje snapshot skladu worka:
   - `parcel_ids_json` budowany z `bag_parcels` po `pos ASC` (kolejnosc ladowania).
   - Lancuch integralnosci jest liczony per `bag_id` (`entry_hash`, `hmac_signature`).

5. `LOADING` nie jest zapisywany do `package_events` jako osobny tracking paczki.
   - Lifecycle worka (w tym `LOADING`) idzie przez `bag_events`.
   - `package_events` pozostaje dla zdarzen paczki.

6. Klawisze i potwierdzenie dwuetapowe (Wydanie/Tablica):
   - `RIGHT/LEFT/DELETE` wymagaja drugiego klikniecia (confirm).
   - Zalezne od aktualnego statusu worka (`RESERVED`, `LOADING`, `RETURNED`).
   - Dzialanie grupowe i per-worek sa rozdzielone przez scope kursora.

## 25B. Zachowanie TUI przy `6:wyslij` - automatyczne rozpoznanie osoby po telefonie/emailu

Ta sekcja opisuje zachowanie panelu pracownika podczas nadawania paczki w TUI, gdy operator naciska `6:wyslij`.

1. `6:wyslij` nie zapisuje paczki od razu.
   - Najpierw uruchamiany jest podglad/validacja
     `validate_parcel_request(...)`.
   - System wylicza trase, cene, status domyslny, tagi, pickup auth i sprawdza komplet danych.
   - Dopiero po poprawnej walidacji operator przechodzi do wyboru platnosci i opakowania.

2. Backend probuje rozpoznac nadawce i odbiorce po danych kontaktowych.
   - Jezeli `sender_code` albo `receiver_code` jest pusty, system szuka osoby po telefonie i emailu.
   - Szukanie obejmuje pracownikow (`hub_staff`) oraz klientow (`clients`).
   - Telefon i email sa normalizowane oraz walidowane wspolna logika klienta.

3. Jezeli telefon albo email wskazuje dokladnie jedna osobe:
   - backend uzupelnia kod osoby,
   - uzupelnia imie, nazwisko, telefon, email i adres z DB,
   - zwraca ostrzezenie typu `WARN_SENDER_PHONE_MATCH`, `WARN_RECEIVER_PHONE_MATCH`, `WARN_SENDER_EMAIL_MATCH` albo `WARN_RECEIVER_EMAIL_MATCH`.

4. Jezeli system znalazl osobe i uzupelnil jej kod:
   - brak recznie wpisanego imienia/nazwiska/adresu nie blokuje nadania,
   - system traktuje osobe jako znana, bo dane pochodza z DB,
   - operator widzi ostrzezenie/informacje, ze dane zostaly rozpoznane.

5. Jezeli podany telefon/email jest poprawny skladniowo, ale nie ma jednoznacznego trafienia w DB:
   - system nie moze sam uzupelnic osoby,
   - formularz dalej wymaga minimalnych danych osoby zgodnie z walidacja backendu,
   - przy braku wymaganych danych `6:wyslij` zwraca blad i nie przechodzi do platnosci.

6. Finalny zapis paczki dzieje sie dopiero po platnosci i wyborze opakowania.
   - Po wyborze metody platnosci (`KES` albo `VKES`) i opakowania TUI
     buduje `SubmitParcelCommand` i wywoluje
     `submit_parcel_command(...)`.
   - Granica komendy ponownie waliduje typowane dane.
   - Dopiero wtedy powstaje paczka, wpisy trackingowe, wpisy finansowe, przypisanie do worka/skrzynki oraz ewentualny zapis/aktualizacja klienta.

7. Zasada projektowa:
   - TUI, Flask i panel klienta powinny korzystac z tej samej logiki backendowej dla rozpoznania osoby, walidacji kontaktu, wyceny i zapisu paczki.
   - UI moze pokazywac dane inaczej, ale nie powinno miec osobnej, rozjechanej logiki biznesowej.

## 26. Uzupelnienia PRD - finance v1 (wdrozone, 2026-05-24)

Ponizej lista zmian z `task.md`, ktore sa juz potwierdzone w kodzie:

1. Wspolny backend finansowy (`finance_core.py`) dla TUI i Flask:
   - `create_payment_intent`
   - `confirm_payment_intent`
   - `settle_payment_intent`
   - `reject_payment_intent`
   - `cancel_payment_intent`
   - `execute_wallet_transfer`
   - `recover_pending_intents`

2. Schemat finance v1 jest tworzony w kodzie:
   - `wallet_accounts`
   - `wallet_account_keys`
   - `payment_intents`
   - `approval_requests`
   - `hmac_keys`
   - oraz kolumny rozszerzajace `wallet_ledger` (`account_id`, `intent_id`, `tx_group_id`, `hmac_key_id`).

3. Wdrozony state machine `payment_intent`:
   - `created -> awaiting_push|awaiting_offline_response|authorized|cancelled`
   - `awaiting_push -> authorized|rejected|cancelled`
   - `awaiting_offline_response -> authorized|cancelled`
   - `authorized -> settled|failed`
   - `failed -> authorized|cancelled`
   - `confirm` jest idempotentny (stan `authorized` i stany koncowe zwracaja `already_processed`).

4. Wdrozone bezpieczenstwo finalizacji:
   - `settle` sprawdza saldo platnika przed debetem,
   - finalizacja intentu jest restart-safe,
   - przy restarcie wykonywane jest `recover_pending_intents`.

5. Flask ma aktywne endpointy platnosci:
   - `/api/payment/create`
   - `/api/payment/confirm`
   - `/api/payment/reject`
   - `/api/payment/cancel`
   - `/api/payment/status`

6. TUI ma wdrozony flow platnosci przy nadaniu:
   - wybor metody `KES` / `VKES`,
   - flow PUSH dla `VKES` przez subskrypcje zdarzenia konkretnego intenta,
   - finalizacja po sukcesie submit (`confirm` + `settle`),
   - cancel intentu przy nieudanym submit.

7. Wdrozony model wielu kont (MVP):
   - API kont: `create_wallet_account`, `list_wallet_accounts`, `archive_wallet_account`,
   - transfery wallet sa atomowe (`transfer_debit` + `transfer_credit`) i laczone `tx_group_id`,
   - dla `KES` transfery sa ograniczone do kont typu `CASH`,
   - transfery miedzy liniami walut `KES` i `VKES` sa zablokowane w obie strony
     (to sa osobne linie kont i osobne obiegi ksiegowe).

8. Wdrozone funkcje HMAC key management:
   - tabela `hmac_keys`,
   - `get_active_hmac_key`,
   - `rotate_hmac_key`,
   - `verify_ledger_entry_hmac`.

9. Wdrozone biblioteki seed/mnemonic (warstwa crypto):
   - BIP39 + SLIP-0010(ed25519) utilities w `wallet_crypto.py`,
   - seedowanie kluczy ownerow przez `wallet_seed_keys.py`.

10. Stan obecny (istotne ograniczenie):
   - Standardowe nadanie paczki (`/api/add_parcel`) nadal korzysta z historycznej sciezki ksiegowania paczki
     (np. `kes_cre`, `hub_fee_*`, `courier_payout`) i nie tworzy pelnej pary `debit/credit` przez `payment_intent`
     dla calego lifecycle paczki.
   - Pary `debit/credit` z `tx_group_id` dzialaja obecnie na flow intent/transfer z `finance_core`.

## 27. Uzupelnienia PRD - finance v1.1 (wdrozone, 2026-05-25)

1. Regula KES (cash-line) zostala utwardzona:
   - `create_payment_intent(currency=KES)` nie dopuszcza payera (`payer_owner_id` / `payer_account_id`),
   - KES intent jest traktowany jako cash-in do konta docelowego (credit-only),
   - direct transfery KES miedzy kontami sa blokowane.

2. Onboarding odbiorcy przed platnoscia:
   - przy nadaniu w TUI, gdy odbiorca nie ma onboardingu finansowego (brak aktywnego konta VKES),
     wybor `VKES` jest blokowany i dozwolony jest tylko `KES`,
   - pracownik nie tworzy konta VKES odbiorcy "przy okazji" nadania.

3. Dalsze ujednolicenie TUI/Flask przez `finance_core`:
   - panel kuriera nie czyta juz `payment_intents` surowym SQL-em,
   - `get_next_pending_push_for_payer` jest jednorazowym odczytem przy wejsciu
     lub reconnect; kolejne zmiany przychodza przez zdarzenia,
   - zamykanie intentu po udanym submit idzie przez `mark_intent_settled_external`
     (status/package binding, bez dodatkowego wpisu ledger),
   - Flask korzysta z tego samego bridge helpera, gdy dostanie `payment_intent_id`.

4. HMAC i audit:
   - wpisy ledger z `finance_core` zapisuja `hmac_key_id` (aktywny klucz z `hmac_keys` albo `ENV_DEFAULT`),
   - `verify_ledger_entry_hmac` odtwarza `prev_hash` z lancucha i weryfikuje podpis na `entry_hash + prev_hash`,
   - po rotacji kluczy HMAC stare i nowe wpisy pozostaja weryfikowalne.

5. Testy regresji finance rozszerzone do 25 testow:
   - przelewy, intent lifecycle, idempotencja i anty-replay,
   - recovery po restarcie (`recover_pending_intents`),
   - saldo/audit (`audit_full_ledger`, `audit_ledger_chain`),
   - hash/HMAC (w tym rotacja kluczy i detekcja tamperingu).

## 27A. Uzupelnienia PRD - finance v1.2 (dostep do kont, 2026-05-30)

1. `owner_access_roles` zostaje usuniete z modelu finance.
   - Globalna rola ownera nie wystarcza do kontroli dostepu do konkretnego konta.
   - Helpery `grant_owner_role`, `list_owner_roles`, `has_role` nie sa docelowa warstwa autoryzacji finansowej.
   - Panel admina nie powinien zarzadzac rolami ownera jako zamiennikiem dostepu do kont.

2. Docelowa tabela dostepu per konto to `wallet_account_access`.
   - `account_id` wskazuje konkretne konto.
   - `actor_id` w `wallet_account_access` wskazuje osobe albo aktora technicznego, ktory ma prawo do konta.
   - Dla zwyklych ludzi jest to `persons.person_id`, takze wtedy, gdy dana osoba pracuje w hubie pod aliasem `hub_staff.staff_id`.
   - `hub_staff.staff_id` nie dostaje osobnego wpisu dostepu do konta; jest aliasem/loginem operacyjnym, ktory system mapuje na `hub_staff.person_id`.
   - Dla automatu technicznego `actor_id=SYSTEM_RUNTIME`.
   - `actor_type` okresla typ rekordu dostepu w `wallet_account_access`, np. `person`, `system_runtime`; nie jest kolumna `wallet_ledger`.
   - `access_role` opisuje role operacyjna: `owner|guardian|cashier|operator|viewer|auditor|system`.
   - Flagi uprawnien okreslaja akcje: `can_view`, `can_transfer`, `can_cash_in`, `can_cash_out`, `can_mint`, `can_manage_access`.
   - `is_active`, `valid_from`, `valid_to`, `db_ts` okreslaja aktywnosc i okres obowiazywania dostepu.

3. Bezpieczenstwo finansow ma dwie warstwy.
   - Warstwa 1: kontrola w kodzie i flow aplikacji (logowanie, wybrany hub, ekran, akcja, aktualny actor).
   - Warstwa 2: kontrola w DB przez aktywny wpis `wallet_account_access` dla osoby/aktora technicznego + `account_id` + `permission`.
   - Jezeli operacja pochodzi z TUI i aktor jest `staff_id`, backend najpierw rozwiazuje `hub_staff.staff_id -> hub_staff.person_id`, a dopiero potem sprawdza `wallet_account_access`.
   - Operacja finansowa musi przejsc obie warstwy.

4. `wallet_accounts` i `wallet_account_access` sa rozdzielone.
   - `wallet_accounts` mowi, jakie konta istnieja i do jakiego technicznego ownera/zakresu naleza.
   - `wallet_accounts.owner_person_id` wskazuje osobe profilu tam, gdzie konto jest osobowe/biznesowe/systemowe.
   - `wallet_account_access` mowi, kto moze widziec albo uzyc konkretnego konta.
   - Wlasciciel konta i osoba uprawniona do operacji to nie zawsze ta sama osoba.

5. Przyklady dostepu:
   - pracownik huba jako kasjer: `wallet_account_access.actor_id=<person_id pracownika>`, `account_id=VKES_AA_OPERATING`, `can_transfer=1`; w TUI podpis operacji moze byc jego `staff_id`,
   - pracownik huba jako podglad: `can_view=1`, `can_transfer=0`,
   - opiekun dziecka: `actor_id=PFAAAK`, `account_id=PJOA7K-MAIN`, `access_role=guardian`.

6. Centralni aktorzy systemowi sa zapisywani w `hub_staff` z technicznym hubem `SYSTEM`.
   - Przyklady: `BOSS`, `CEO`, `COO`, `CFO`, auditor, support.
   - `system_users` nie jest juz aktywnym modelem operacyjnym i nie jest tworzone przez nowy seed.
   - Operator mint jest czlowiekiem/central staff z grantem `can_mint=1`, a nie anonimowym wpisem systemowym.
   - Wlasciciel huba operacyjnie jest obslugiwany przez `hub_staff(role='owner')`.
   - Konta hubowe maja `wallet_accounts.account_scope_type='hub'`; hub jest rozpoznawany z pelnego `account_id`, np. `VKES_AA_OPERATING`, a osoba odpowiedzialna jest w `owner_person_id`.
   - Dostep wlasciciela do kont huba wynika z `wallet_account_access` zapisanego na `persons.person_id`.
   - W TUI operacyjnie uzywany i zapisywany w ledgerze jest `hub_staff.staff_id`, ale autoryzacja dostepu idzie przez `hub_staff.staff_id -> hub_staff.person_id`.
   - W `client_app` prywatny login osoby uzywa bezposrednio `persons.person_id`.

7. `hub_manifest.yaml` zawiera `owner.staff_id` i `owner.person_id`.
   - Format `staff_id` wlasciciela huba: `O + HUB_CODE2 + INICJALY + SEQ_BASE32 + CHECKSUM`.
   - Przyklad: `OAAUFAH`.
   - Ten sam czlowiek posiadajacy kilka hubow moze miec osobne operacyjne `staff_id` per hub, ale ten sam `person_id`.
   - Synchronizacja manifestu tworzy/aktualizuje `persons` dla ownera/personelu oraz `hub_staff(role='owner')`.
   - `persons.person_id` nie jest generowany ze `hub_staff.staff_id`; ma format profilu osoby, np. `PJOA7K`.
   - `hub_staff` przechowuje role operacyjna w hubie, `staff_id`, PIN i parametry huba; dane personalne sa powiazane przez `hub_staff.person_id`.
   - Synchronizacja danych personalnych personelu jest jednokierunkowa: `hub_manifest.yaml -> persons`.
   - Manifest nie synchronizuje wszystkich klientow i nie przenosi hasel; hasla sa w `persons.password_hash/password_salt`.
   - `db_storage` nie tworzy osob z `hub_staff`; moze tylko naprawic brakujace `hub_staff.person_id`, jesli pasujacy rekord juz istnieje w `persons`.
   - Synchronizacja nadaje wlascicielowi dostep do kont `KES` i `VKES` danego huba przez `wallet_account_access` na `person_id`.
   - `staff_id` nie jest osobnym grantem dostepu; jest aliasem/loginem, ktory wskazuje osobe i konto rozliczeniowe roli.

8. Tymczasowy dev/test export seedu mint.
   - Dla `SYSTEM_VKES_MINT` TUI moze zapisac mnemonic do lokalnego pliku `secrets/SYSTEM_VKES_MINT.env`.
   - `secrets/` jest ignorowane przez git i nie jest mechanizmem produkcyjnym.
   - DB nadal przechowuje tylko publiczne/metadane: `public_key`, `key_id`, `seed_fingerprint`, `derivation_path`.
   - W `3:FINANSE` klawisz `M` generuje/rotuje seed mint i zapisuje dev plik.
   - Klawisz `I` najpierw uzywa seedu z RAM sesji, potem z pliku dev, a dopiero potem wymaga recznego wpisania mnemonic.
   - Klawisz `L` usuwa seed mint z RAM sesji; plik dev pozostaje bez zmian.

## 27B. Uzupelnienia PRD - owner huba i szybkie operacje KES/VKES (wdrozone czesciowo, 2026-06-20)

1. Owner huba jest osoba przypisana do huba w `hub_staff`.
   - `hub_staff.role = 'owner'`.
   - Logowanie odbywa sie PIN-em w tym samym panelu huba co worker/manager.
   - Testowa regula PIN: `HUB_CODE2 + "4"` (np. `AA4`, `BA4`).
   - Dane ownera sa w `hub_manifest.yaml` w sekcji `owner`.
   - Pola wymagane w manifest: `staff_id`, `person_id`, `owner_name`, `owner_surname`, `pin`, `vkes_debit_limit`.

2. Owner nie aktywuje huba logistycznie.
   - Owner nie trafia do `active_workers`.
   - Owner nie powinien wplywac na mape, trasy, gielde ani dostepnosc operacyjna huba.
   - Jezeli owner chce pracowac jako manager/worker, musi miec osobne konto operacyjne.

3. Logowanie ownera jest audytowane.
   - Kazda proba logowania ownera daje wpis do `system_logs`.
   - Ponowne logowanie uniewaznia poprzednia sesje i tworzy nowa sesje `active`.
   - Wyjscie z panelu ownera ustawia status sesji na `logged_out`.

4. Menu ownera w TUI.
   - Po zalogowaniu ownera pojawia sie tryb `Owner`.
   - Dostepne akcje w panelu ownera:
     - `1:DODAJ KES`,
     - `2:WYPLAC KES` (jeszcze niepodlaczone),
     - `3:KES->VKES`,
     - `4:DOSTEPY` (projekt UI do ustalenia),
     - `5:HISTORIA` (projekt UI do ustalenia).

5. `DODAJ KES` jest szybka deklaracja gotowki huba.
   - TUI zbiera kwote w panelu ownera.
   - Pierwszy `Enter` pokazuje potwierdzenie.
   - Drugi `Enter` wywoluje `execute_hub_cash_create`.
   - Backend wymaga `wallet_account_access.can_cash_in=1` dla konta `HUB_KES`.
   - Ledger zapisuje pojedynczy dodatni wpis:

```text
HUB_KES +kwota
event_key = hub_cash_create
from_owner = EXTERNAL_CASH
```

6. `KES->VKES` jest szybka procedura systemowa na potrzeby testow/operacji uproszczonej.
   - Docelowo fizyczny transfer gotowki bedzie procesem w czasie ze statusami oczekujacymi.
   - Obecna szybka procedura wykonuje natychmiastowa atomowa operacje `execute_hub_cash_to_vkes`.
   - Backend wymaga:
     - aktywnego konta `HUB_KES`,
     - aktywnego konta `HUB_VKES`,
     - aktywnego konta `SYSTEM_KES`,
     - aktywnego konta `SYSTEM_VKES`,
     - wystarczajacego salda `HUB_KES`,
     - wystarczajacego salda `SYSTEM_VKES`,
     - `wallet_account_access.can_cash_out=1` dla konta `HUB_KES`.
   - Ledger zapisuje 4 wpisy z jednym `tx_group_id`:

```text
HUB_KES       -kwota  event_key=hub_cash_to_system_debit
SYSTEM_KES    +kwota  event_key=system_cash_credit
SYSTEM_VKES   -kwota  event_key=system_vkes_debit
HUB_VKES      +kwota  event_key=hub_vkes_credit
```

7. Otwarta luka projektowa do domkniecia.
   - `WYPLAC KES` nie jest jeszcze podlaczone w TUI.
   - Docelowe `hub_cash_to_vkes` powinno dodatkowo oznaczac czesc `SYSTEM_VKES -> HUB_VKES` jako operacje systemowa, np. `system_actor=SYSTEM_EXCHANGE_ENGINE` i `authorized_by_rule=hub_cash_to_vkes`.
   - Docelowy fizyczny proces wymiany KES/VKES powinien dostac statusy, kolejke i osobny panel operacyjny.

## 28. Pusta DB - minimum startowe (wdrozone, 2026-05-25)

Ta sekcja precyzuje, co musi byc w DB po czystym starcie oraz co jest dopisywane automatycznie poza plikami YAML.

### 28.1 Dane ladowane z plikow `.yaml`

1. `config.yaml -> app_settings`
   - ustawienia mapy, miasta, cen, flag runtime/ledger i ustawienia wallet.
   - `package_status_json`, `package_tags_json` i `package_tag_presets_json` obsluguja prefiksy widocznosci:
     - `£Nazwa` - ukryte dla panelu huba/TUI, widoczne dla panelu klienta jako `Nazwa`,
     - `$Nazwa` - ukryte dla panelu klienta, widoczne dla panelu huba/TUI jako `Nazwa`.
   - Prefiks widocznosci jest metadana konfiguracji. Po odczycie system zdejmuje prefiks i do logiki paczki trafia czysta wartosc.
   - Prefiksy dzialaja tak samo dla statusow, tagow i presetow tagow, np. `"$Koperta"` w `package_tag_presets_json` ukrywa preset `Koperta` przed klientem.
   - Statusy sa lista zamknieta definiowana przez admina w `package_status_json`. Uzytkownik nie moze dopisac nowego statusu ani w TUI, ani w panelu klienta.
   - Kazdy status ma stala definicje `{risk, icon_key}`, a kazdy preset tagu ma
     stale `icon_key`. Te ikony sa niemodyfikowalne w panelu i podczas startu
     sa materializowane w `icon_type_defaults` oraz `tag_icon_mappings` z
     konfiguracji systemowej.
   - Modyfikowalne tagi maja postac listy obiektow
     `[{"name":"Farby","icon_key":"lu:Paintbrush"}]` w
     `package_tags_json`. Config inicjalizuje liste po utworzeniu DB, natomiast
     pozniejszy wybor zatwierdzonej ikony aktualizuje DB i jest przenoszony do
     `config.yaml` przez standardowa synchronizacje dwukierunkowa.
   - Stary przecinkowy klucz `package_tags` nie jest obslugiwany ani
     synchronizowany. Jedynym formatem jest `package_tags_json`.
   - Statusy nie sa normalizowane znakowo przez system: admin decyduje o nazwie, wielkosci liter, cyfrach i znakach specjalnych. System tylko zdejmuje prefiks widocznosci i sprawdza, czy wybrany status istnieje na liscie admina.
   - TUI pozwala wybrac wiele statusow przez przecinek/kropke; panel klienta ma miec analogiczny wielokrotny wybor z listy, bez pola dopisywania nowych statusow.
   - Tagi i presety tagow nadal sa normalizowane do postaci: pierwsza litera duza, reszta mala. Przyklady: `KOPERTA`, `koperta`, `Koperta` -> `Koperta`; `PALIWO` -> `Paliwo`.
   - Jezeli uzytkownik wpisze tag ze znakiem specjalnym albo cyfra, formularz/backend odrzuca taki tag. Przyklady niedozwolone: `TST-FLASK-1`, `LIVE2`, `Szklo-1`, `A4`.
   - Dla tagow ta sama normalizacja obowiazuje w TUI, panelu klienta i wspolnym backendzie paczek, zeby poprawka w jednym miejscu nie tworzyla rozjazdu danych.
   - Specjalny status `asset` jest techniczny: nie powinien byc definiowany w `config.yaml` jako zwykly status dla klienta. TUI dodaje go wewnetrznie dla obslugi assetow, a panel klienta go ukrywa/odrzuca.

2. `hub_manifest.yaml -> hubs + hub_staff`
   - definicje hubow, personelu i powiazan organizacyjnych.

### 28.2 Dane dopisywane poza `.yaml` (bootstrap/system)

1. Meta sync w `app_settings`:
   - `config_sync_version`, `config_last_sync_utc`, `config_last_source`,
   - `manifest_sync_version`, `manifest_last_sync_utc`, `manifest_last_source`.

2. Seed runtime (DB-only):
   - `hubs.bag_stock` z domyslna liczba workow dla kazdego huba,
   - brakujace assety w `hub_asset_inventory` z kolejnym wolnym `id` od zera.

3. Seed finance baseline:
   - `wallet_accounts` (konta domyslne dla ownerow),
   - `hub_staff(role='owner')` (wlasciciele hubow z `hub_manifest.owner.staff_id` i `hub_manifest.owner.person_id`),
   - `hub_staff(hub_name='SYSTEM')` (centralne role `BOSS/CEO/COO/CFO`),
   - `wallet_account_access` (dostep wlascicieli, central staff i `SYSTEM_RUNTIME` do kont operacyjnych).

### 28.3 Co moze pozostac puste po czystym starcie

Po poprawnym bootstrapie nastepujace tabele moga byc puste i to jest stan poprawny:

- `packages`, `package_events`,
- `bags`, `bag_parcels`, `bag_events`,
- `wallet_ledger`,
- `payment_intents`, `approval_requests`.

### 28.4 Regula operacyjna

Brak danych operacyjnych (paczki/worki/ledger) nie blokuje startu systemu.
Start blokuje dopiero brak danych bazowych (konfiguracja/manifest) lub brak schematu DB.

## 29. Panel klienta, client_api i aktualny stan TUI finansow (uzupelnienie, 2026-06-22)

Ta sekcja opisuje aktualny kierunek po wprowadzeniu `client_api.py`, `client-app` oraz nowych funkcji finansowych w TUI.

### 29.1 Podzial odpowiedzialnosci

1. `client-app` (Vite/React) jest panelem webowym klienta.
   - Odpowiada za formularze, widoki, wyswietlanie kont, historie, platnosci i przelewy.
   - Nie komunikuje sie bezposrednio z DB.
   - Nie powinien zawierac logiki biznesowej ani samodzielnie modyfikowac sald.

2. `client_api.py` jest backendiem HTTP dla panelu klienta.
   - Obsluguje logowanie, sesje JWT, konta klienta, przelewy, platnosci i widok paczek.
   - Komunikuje sie z DB przez funkcje backendowe (`finance_core.py`, `client_service.py`, inne serwisy).
   - Nie powinien importowac duzego runtime TUI, jesli mozna uzyc mniejszego wspolnego serwisu.

3. `client_service.py` jest wspolnym backendowym serwisem klientow.
   - Generuje ID klienta.
   - Waliduje dane klienta: imie/nazwisko, telefon, email, default_hub.
   - Normalizuje telefon/email.
   - Sprawdza konflikty w DB.
   - Tworzy/aktualizuje wpis w `clients`.
   - Uzywany przez `client_api.py`, `courier_logic_poc.py` i `terminal_ui.py`.

4. `finance_core.py` pozostaje glownym backendowym modulem finansowym.
   - Tworzy konta wallet.
   - Wykonuje transfery.
   - Obsluguje payment intents, podpisy non-custodial, wallet ledger, mint, cash-in/cash-out i operacje huba.

5. `terminal_ui.py` jest panelem TUI.
   - Docelowo powinien byc wyswietlaczem i sterownikiem UI, a nie miejscem logiki DB.
   - Nadal zawiera czesc logiki pomocniczej i bezposrednich odczytow DB; to pozostaje do dalszego porzadkowania.

### 29.2 Panel klienta web (`client-app` + `client_api.py`)

Panel klienta obsluguje obecnie:

1. Rejestracje klienta:
   - endpoint: `/client-api/auth/register`,
   - dane walidowane przez `client_service.py`,
   - bledy formularza zwracane jako `field_errors`, np. `phone`, `email`, `password`, `default_hub`,
   - haslo klienta zapisywane w `clients.password_hash`, `clients.password_salt`, `clients.password_updated_ts`.

2. Logowanie klienta:
   - endpoint: `/client-api/auth/login`,
   - klient loguje sie przez `client_id`, telefon albo email + haslo,
   - sesja przegladarki oparta o JWT (`CLIENT_API_TOKEN_SECRET`),
   - JWT sluzy tylko do komunikacji przegladarka -> backend, nie jest kluczem portfela.

3. Konta klienta:
   - endpointy: `/client-api/accounts`, `/client-api/accounts/setup`, `/client-api/accounts/create`,
   - konto moze byc `custodial` albo `non-custodial`,
   - `client_api.py` zwraca `account_index`, zeby frontend mogl wyprowadzic klucz dla poprawnej sciezki.

4. Historia i saldo:
   - saldo konta wynika z `wallet_ledger`,
   - `wallet_ledger` jest zrodlem prawdy dla finansow,
   - historia klienta jest filtrowana przez backend po zalogowanym `client_id`.

5. Platnosci:
   - szybkie `online` pending payments sa obslugiwane w duzym oknie/panelu aktywnej sesji,
   - oczekujace `waiting` pending payments sa obslugiwane tylko w kopercie,
   - klient moze potwierdzic, odrzucic albo anulowac platnosc zgodnie ze swoja rola,
   - flow platnosci paczki w hubie uzywa payment intent jako trail/autoryzacje, a wlasciwe wpisy finansowe ida przez ledger/eventy paczki.

6. Paczki klienta:
   - panel klienta moze pokazywac paczki powiazane z klientem,
   - szczegoly zalezne od endpointow `client_api.py`.

### 29.2A Payment intents i rola tabeli `payment_intents`

`payment_intents` jest tabela procesu platnosci/powiadomienia, a nie zrodlem salda.

1. Rola `payment_intents`:
   - przechowuje zamiar platnosci,
   - przechowuje status procesu push,
   - laczy platnika, odbiorce, konta, kwote, metode, opis, notatke i opcjonalne `package_id`,
   - pozwala pokazac odbiorcy prosbe o decyzje,
   - pozwala nadawcy anulowac aktywne zlecenie oczekujace,
   - zostawia slad audytowy procesu nawet wtedy, gdy platnosc zostanie odrzucona albo nie dojdzie do skutku.

2. `payment_intents` nie jest ledgerem.
   - saldo kont wynika tylko z `wallet_ledger`,
   - sama obecnosc intentu nie zmienia salda,
   - przy tworzeniu intentu nie blokujemy srodkow,
   - pieniadze sa sprawdzane dopiero w chwili akceptacji/rozliczenia.

3. Kluczowe pola:
   - `intent_id` - identyfikator sesji/prosby platnosci,
   - `intent_type` - typ operacji, np. `incoming_payment_offer`, `payment_request`, `parcel_payment_request`,
   - `status` - stan procesu,
   - `delivery_mode` - sposob dostarczenia powiadomienia: `online` albo `waiting`,
   - `payer_account_id`, `payee_account_id` - konta stron; wlasciciele sa
     wyliczani z `wallet_accounts`,
   - `amount`, `currency`; zgodnosciowe `method` jest wyliczane z `currency`,
   - `reason`, `note`, `package_id`,
   - `initiator_id` - w czyim imieniu utworzono intent; uwierzytelniony
     wykonawca utworzenia i kolejnych akcji jest w `payment_intent_events`.

4. Statusy uzywane w panelu klienta:
   - `awaiting_push` - powiadomienie czeka na decyzje,
   - `authorized` - decyzja pozytywna/autoryzacja wykonana,
   - `settled` - platnosc rozliczona i wpisana do `wallet_ledger`,
   - `rejected` - odbiorca odrzucil,
   - `cancelled` - nadawca anulowal,
   - `failed` - proces nieudany; dokladna przyczyna jest w `status_reason`,
     np. `sender_disconnected` albo brak srodkow w chwili akceptacji.

5. Ledger:
   - zwykly przelew i rozliczona platnosc push tworza wpisy w `wallet_ledger`,
   - wpisy finansowe sa laczone `tx_group_id`,
   - `wallet_ledger.account_id` wskazuje konkretne konto,
   - `payment_intents.intent_id` moze byc powiazaniem procesu, ale saldo zawsze wynika z ledger.

### 29.2B Dwa tryby push platnosci: `online` i `waiting`

Panel klienta ma dwa rozne tryby powiadomien platniczych.

1. `online` - szybkie powiadomienie:
   - wymaga, zeby odbiorca byl online w chwili tworzenia,
   - jesli odbiorca jest offline, system nie tworzy aktywnego zlecenia do obslugi i zwraca informacje o braku dostarczenia,
   - nadawca zostaje w duzym oknie sesji i czeka na natychmiastowa decyzje,
   - duze okno jest przeznaczone tylko dla takich szybkich sesji,
   - jesli odbiorca utraci polaczenie, nadawca dostaje informacje o utracie sesji platnosci,
   - jesli odbiorca wroci online, nadawca dostaje informacje o odzyskaniu polaczenia,
   - jesli nadawca utraci polaczenie, proces jest zamykany statusem `failed`
     i powodem `sender_disconnected`, zeby odbiorca nie zostal z martwym
     popupem.

2. `waiting` - powiadomienie oczekujace:
   - jest zapisywane w DB jako aktywny intent,
   - nie wymaga, zeby odbiorca byl online w chwili tworzenia,
   - nie blokuje srodkow,
   - nie otwiera duzego okna sesji,
   - widoczne jest tylko w kopercie na pasku klienta,
   - nadawca moze je anulowac z koperty,
   - odbiorca moze je zatwierdzic albo odrzucic z koperty,
   - jesli w chwili zatwierdzenia nie ma srodkow, intent przechodzi w `failed`, a powiadomienie znika z aktywnej koperty.

3. Zasada UX:
   - duze okno/popup aktywnej sesji = tylko `online`,
   - koperta = tylko aktywne `waiting`,
   - historia zakonczonych/odrzuconych/failed nie powinna byc mieszana z aktywna koperta.

### 29.2C Koperta powiadomien w panelu klienta

Koperta w prawym gornym pasku panelu klienta pokazuje tylko aktywne pushe oczekujace.

1. Zrodlo danych:
   - endpoint: `/client-api/payments/inbox`,
   - backend filtruje tylko `payment_intents.status = 'awaiting_push'`,
   - backend filtruje tylko `payment_intents.delivery_mode = 'waiting'`,
   - zakonczone intenty (`settled`, `rejected`, `cancelled`, `failed`) nie sa wyswietlane w kopercie.

2. Widok nadawcy:
   - widzi swoje aktywne zlecenia oczekujace,
   - ma przycisk `Anuluj`,
   - anulowanie ustawia `payment_intents.status = cancelled`,
   - po anulowaniu powiadomienie znika odbiorcy.

3. Widok odbiorcy:
   - widzi aktywne zlecenia oczekujace, gdzie jest strona decyzyjna,
   - ma przyciski `Zatwierdz` i `Odrzuc`,
   - przy zatwierdzeniu backend dopiero wtedy sprawdza saldo i rozlicza ledger,
   - przy odrzuceniu ustawia `payment_intents.status = rejected`.

4. Informacje pokazywane w powiadomieniu:
   - kwota i waluta,
   - `intent_id`,
   - wlasne konto/alias po stronie zalogowanego klienta,
   - konto drugiej strony jako pelny numer konta,
   - `reason`,
   - `note`,
   - opcjonalne `package_id`.

5. Kolory i znaczenie:
   - oczekujace aktywne powiadomienie jest sygnalizowane koperta,
   - prosba o zaplate i przyjecie platnosci moga miec rozne style wizualne,
   - kolor koperty sluzy do sygnalizacji, ze sa aktywne oczekujace elementy.

### 29.2D Typy operacji w panelu klienta

Panel klienta rozroznia trzy podstawowe operacje finansowe.

1. `Przelew`:
   - klasyczny transfer z wybranego konta klienta na konto docelowe,
   - od razu tworzy wpisy w `wallet_ledger`,
   - nie uzywa `payment_intents`,
   - przy koncie non-custodial wymaga podpisu mnemonic/private key po stronie przegladarki.

2. `Utworz platnosc`:
   - nadawca chce wyslac platnosc do odbiorcy, ale odbiorca musi ja zaakceptowac,
   - tworzy `payment_intents.intent_type = incoming_payment_offer`,
   - odbiorca dostaje powiadomienie,
   - odbiorca akceptuje albo odrzuca,
   - po akceptacji wykonywany jest transfer.

3. `Zarzadaj zaplaty`:
   - nadawca zada platnosci od drugiej strony,
   - tworzy `payment_intents.intent_type = payment_request`,
   - platnik dostaje powiadomienie z kwota, kontem, opisem, notatka i ewentualnym `package_id`,
   - platnik moze zaakceptowac albo odrzucic,
   - przy akceptacji platnik jest strona podpisujaca/placaca.

4. Platnosc za paczke:
   - docelowo moze korzystac z tego samego mechanizmu `payment_intents`,
   - `package_id` laczy intent z paczka,
   - finalne wpisy finansowe paczki musza trafic do `wallet_ledger` i/lub byc powiazane z `package_events` zgodnie z zasadami finansow paczek.

### 29.2E Non-custodial i ograniczenia dla push oczekujacych

1. Konto `non-custodial` wymaga podpisu platnika.
   - backend nie ma private key,
   - frontend musi lokalnie podpisac challenge,
   - mnemonic/private key nie opuszcza przegladarki.

2. Szybkie `online` z konta non-custodial jest dozwolone.
   - klient jest w aktywnej sesji,
   - moze podac 24 slowa,
   - frontend podpisuje challenge,
   - backend weryfikuje podpis i dopiero wtedy rozlicza.

3. Oczekujace `waiting` dla `Utworz platnosc` z konta non-custodial jest zablokowane.
   - powod: podpis platnika musialby byc wykonany pozniej, poza aktywna sesja inicjatora,
   - obecny system nie przechowuje private key ani nie ma sesji `unlock wallet`,
   - dlatego backend i frontend blokuja taka operacje.

4. `Zarzadaj zaplaty` z odbiorca/platnikiem non-custodial jest dozwolone.
   - strona placaca podpisuje dopiero przy akceptacji,
   - nie trzeba podpisywac w chwili utworzenia zadania.

5. Docelowe ulepszenie:
   - po wdrozeniu sesji `unlock wallet` mozna rozwazyc szersza obsluge oczekujacych operacji non-custodial,
   - dopoki private key jest tylko chwilowo wpisywany do konkretnej operacji, blokada `waiting` dla `Utworz platnosc` zostaje.

### 29.2F Push techniczny: SSE i runtime kolejka

1. Panel klienta uzywa SSE do powiadomien w czasie rzeczywistym.
   - frontend utrzymuje polaczenie z endpointem zdarzen,
   - status polaczenia jest pokazany zielona/kontrolna kropka w pasku,
   - zdarzenia finansowe sa rozglaszane jako `finance_update`.

2. `client_api.py` utrzymuje runtime stan polaczonych klientow.
   - wiadomo, czy dany klient ma aktywna sesje SSE,
   - szybki push `online` moze zostac odrzucony, jezeli odbiorca nie jest online,
   - zdarzenia rozlaczenia/powrotu sa wysylane tylko w kontekscie konkretnej sesji platnosci, a nie jako ogolny status osoby.

3. Prywatnosc:
   - komunikaty nie powinny ujawniac globalnego statusu online klienta,
   - zamiast "MKAW wylogowal sie" system pokazuje "Sesja platnosci INT... utracila polaczenie z odbiorca",
   - status dotyczy konkretnej platnosci, nie osoby jako takiej.

4. Trwalosc:
   - `online` jest sesja aktywna i czasowa,
   - `waiting` jest trwale zapisanym zleceniem w `payment_intents`,
   - po restarcie systemu aktywne `waiting` moze byc odczytane z DB,
   - `online` nie powinien zostawiac martwych popupow po utracie inicjatora.

### 29.3 Custodial vs non-custodial w panelu klienta

1. `custodial`
   - klucze sa po stronie systemu/backendu,
   - klient loguje sie haslem,
   - operacje moga byc wykonywane przez backend zgodnie z uprawnieniami i stanem konta.

2. `non-custodial`
   - system przechowuje tylko `public_key` i metadane klucza w `wallet_account_keys`,
   - mnemonic/private key nie trafia do DB,
   - frontend generuje BIP39 24 slowa,
   - klucz jest wyprowadzany zgodnie z Pythonowym standardem:

```text
BIP39 + SLIP-0010 ed25519
path = m/44'/7331'/owner_scope'/account_index'
```

3. Frontendowy modul kluczy:
   - plik: `client-app/src/walletKeys.js`,
   - generuje 24-slowny mnemonic (`256-bit entropy`),
   - wyprowadza Ed25519 public/private key,
   - liczy `key_id` tylko informacyjnie,
   - podpisuje challenge lokalnie w przegladarce.

4. Backendowa zasada `key_id`:
   - `client_api.py` nie ufa `key_id` przyslanemu z klienta,
   - backend zawsze liczy `key_id` sam z `public_key`,
   - zapis public key idzie przez `finance_core.register_account_public_key`.

5. Aktualny flow non-custodial:
   - przy pierwszym koncie panel pokazuje 24 slowa i public key jest rejestrowany w backendzie,
   - przy dodatkowym koncie non-custodial panel najpierw rezerwuje `account_index` na serwerze, a potem generuje mnemonic/public key dokladnie dla zarezerwowanej sciezki,
   - przy przelewie z konta non-custodial backend zwraca `signature_required`,
   - frontend prosi o mnemonic, podpisuje challenge lokalnie i wysyla podpis do backendu.

6. Docelowe ulepszenie:
   - mnemonic nie powinien byc wpisywany przy kazdym przelewie,
   - panel powinien miec tryb `unlock wallet`,
   - klient wpisuje mnemonic raz,
   - private key/seed jest trzymany tylko w RAM sesji przegladarki,
   - po odswiezeniu/wylogowaniu portfel znowu wymaga odblokowania.

### 29.4 Hasla klientow

1. Hasla klientow sa w tabeli `clients`.
   - `password_hash`,
   - `password_salt`,
   - `password_updated_ts`.

2. Haslo nie jest zapisywane jawnie.
   - Backend uzywa PBKDF2-HMAC-SHA256.
   - Aktualny koszt: `200_000` iteracji.
   - Salt jest losowy per klient.

3. Salt i hash sa poprawna baza bezpieczenstwa.
   - Salt nie musi byc tajny.
   - Salt nie powinien byc zbudowany z danych osobowych, bo email/telefon/adres nie sa losowe i moga sie zmienic.

4. Docelowo mozna dodac `pepper`.
   - Pepper to tajny sekret serwera trzymany poza DB, np. w `.env` albo managerze sekretow.
   - Przy wycieku samej DB atakujacy nie moze latwo lamac hasel offline bez peppera.
   - Wymaga procedury przechowywania i rotacji sekretu.

5. Docelowo mozna rozwazyc Argon2id.
   - PBKDF2 jest akceptowalne jako baza.
   - Argon2id lepiej broni przed masowym lamaniem na GPU, bo wymaga pamieci.
   - Jesli zostanie wdrozone, DB powinna miec `password_algo`, zeby obslugiwac migracje ze starych haszy.

### 29.5 Pracownicy, ownerzy i panel klienta

1. Obecny panel klienta nie jest pelnym panelem pracownika.
   - Obsluguje glownie `clients`.
   - Nie obsluguje jeszcze logowania pracownikow przez `hub_staff`.
   - Nie obsluguje jeszcze pelnego panelu operacyjnego pracownika/wlasciciela w web.

2. Pracownik moze miec prywatne konto finansowe.
   - Jezeli pracownik pracuje w wielu hubach, prywatne konto osoby moze pozostac jedno.
   - System moze na takie konto wyplacac srodki.
   - System nie powinien automatycznie pobierac z prywatnego konta pracownika bez jego autoryzacji.

3. Konta operacyjne huba musza byc osobne per hub.
   - Kazdy hub ma osobne konta `KES` i `VKES`.
   - Operacje huba (wplaty, wyplaty, wymiana KES/VKES, platnosci paczek) ida przez konta huba.
   - Pracownik/owner jest tylko `actor_id` wykonujacym operacje, a nie ownerem konta huba.

4. Central staff i staff hubowy ida przez `hub_staff`.
   - Owner huba operacyjnie nalezy do `hub_staff(role='owner')`.
   - Centralne role firmy naleza do `hub_staff(hub_name='SYSTEM')`.
   - `system_users` nie jest aktywnym modelem operacyjnym w aktualnym kodzie.
   - Duplikowanie tych samych ludzi w wielu tabelach powoduje problemy z haslem, uprawnieniami, audytem i rozpoznaniem tozsamosci.

5. Hasla dla pracownikow/ownerow webowych sa jeszcze decyzja do wdrozenia.
   - Jezeli pracownik ma korzystac z panelu web, potrzebuje hasla webowego.
   - PIN huba nie powinien byc haslem webowym.
   - Model docelowy: wspolne haslo osoby w `persons`, a `hub_staff` opisuje role/logowanie operacyjne.
   - Alternatywa historyczna: osobna tabela `auth_identities`; na razie nie jest wybrana jako konieczna.

### 29.6 TUI - zmiany finansowe i owner hub

1. `3:FINANSE`
   - Nazwa menu zostala zmieniona z pustego/paczkowego kierunku na panel finansowy.
   - TUI ma tryb admina i klienta.
   - Panel pozwala ogladac ownerow/konta, tworzyc konta, wykonywac przelewy i operacje testowe/mint.
   - Dla `SYSTEM_VKES_MINT` istnieje dev flow generowania mnemonic i podpisywania emisji.

2. Owner w `1:panel`
   - Owner huba loguje sie PIN-em jak osoba przypisana do huba.
   - Owner nie trafia do `active_workers` i nie aktywuje huba logistycznie.
   - Po zalogowaniu ownera TUI pokazuje menu ownera.

3. Menu ownera w TUI:
   - `Dodaj KES` -> `execute_hub_cash_create`,
   - `KES -> VKES` -> `execute_hub_cash_to_vkes`,
   - `Wyplac KES` -> miejsce w UI istnieje, ale logika nie jest jeszcze docelowo domknieta,
   - `Dostepy` i `Historia` sa miejscami pod dalszy projekt UI.

4. Walidacja uprawnien ownera:
   - Operacje finansowe huba maja przechodzic przez `wallet_account_access`.
   - Samo bycie `ownerem` nie wystarcza do wykonania operacji na koncie.
   - Kod sprawdza uprawnienia typu `can_cash_in`, `can_cash_out` w odpowiednich operacjach.

### 29.7 Otwarte zadania po stronie panelu klienta i finansow

1. Dodac sesje non-custodial `unlock wallet`.
   - Mnemonic wpisywany raz.
   - Klucz trzymany tylko w RAM przegladarki.
   - Przelewy podpisywane bez ponownego wpisywania 24 slow.

2. Doprecyzowac model web logowania pracownikow i ownerow.
   - `clients` ma juz hasla.
   - `hub_staff` potrzebuje wspolnego mechanizmu auth opartego o `persons`, jesli role hubowe/centralne maja logowac sie do web.
   - PIN pozostaje lokalnym mechanizmem TUI/huba, nie haslem web.

3. Dodac `finance_integrity_guard`.
   - `client_api` nie powinien wykonywac pelnego audytu przy kazdym zapytaniu.
   - Przed operacjami finansowymi powinien sprawdzac lekka flage integralnosci finansow.
   - Pelny audyt pozostaje w `financial_audit.py`.

4. Doprecyzowac staff/owner multi-hub.
   - Osoba moze pracowac w wielu hubach.
   - Konto prywatne osoby moze byc jedno.
   - Konta operacyjne huba pozostaja osobne per hub.
   - Dostep do kont huba wynika z `wallet_account_access`, nie z prywatnego konta osoby.

5. Utrzymac zasade: backend jest zrodlem prawdy.
   - Vite/React wyswietla i zbiera dane.
   - `client_api.py` waliduje i wywoluje backendowe serwisy.
   - DB nie jest dostepna bezposrednio z przegladarki.

## 30. PRD Sync 2026-06-29 - persons, konta, access, kredyt i aktualny przeplyw finansowy

Ta sekcja aktualizuje PRD po wdrozeniu planu z `acc_task.md`. Jest to aktualny kierunek implementacji po zmianach w `finance_core.py`, `db_storage.py`, `client_api.py`, TUI oraz panelu klienta.

### 30.1 Jedna osoba: `persons`

Wprowadzono tabele `persons` jako docelowe zrodlo danych osobowych, profili prywatnych, profili biznesowych i logowania.

Znaczenie:

- `persons` opisuje fizyczna osobe albo profil biznesowy.
- `client_kind` w `persons` rozroznia profil `private` i `business`.
- `hub_staff` opisuje role osoby w konkretnym hubie.
- Centralne role systemowe sa trzymane jako `hub_staff(hub_name='SYSTEM')`.
- `system_users` nie jest aktywnym modelem w aktualnym kodzie.

Kluczowa zasada:

- jedna osoba moze miec wiele profili i rol,
- haslo docelowo nalezy do `persons`, nie do pojedynczego `client` ani roli `hub_staff`,
- `hub_staff` nadal moze trzymac dane roli/cache, ale nowe odczyty danych osobowych powinny preferowac `persons`.

Nowe/potwierdzone pola `persons`:

- `person_id` - publiczny identyfikator osoby/profilu w formacie `P + PREFIX2 + SEQ_BASE32 + CHECKSUM`, np. `PJOA7K`,
- `person_type` - np. `human`, `business`, `system`,
- `first_name`, `last_name` - jedyne pola nazwy profilu; nazwa wyswietlana jest zawsze skladana jako `first_name + last_name`,
- `phone`, `email`, `address`,
- `date_of_birth` - zrodlo prawdy do wyliczania wieku,
- `guardian_person_id` - JSON array maksymalnie dwoch opiekunow, np. `["PFAAAK","PMBBBK"]`,
- `client_kind` - `private` albo `business`,
- `business_tax_id`, `business_tax_country`, `linked_private_person_id` opcjonalnie,
- `password_hash`, `password_salt`, `password_updated_ts`,
- `recovery_json`,
- `metadata_json`,
- `is_active`.

Telefon i email sa unikalne tylko wtedy, gdy istnieja. Brak telefonu albo emaila jest dopuszczalny.

`person_id` nie jest generowany ze `staff_id`. `staff_id` jest rola/loginem w konkretnym hubie, a `person_id` identyfikuje czlowieka niezaleznie od liczby hubow i rol.

### 30.2 `persons`: profil prywatny, dziecko i profil biznesowy

`persons` jest jedynym miejscem tozsamosci klienta w aktualnym modelu.

Profil prywatny:

- `client_kind='private'`,
- posiada imie, nazwisko, kontakt, adres i opcjonalnie `date_of_birth`,
- po rejestracji moze dostac konto `PERSON_ID-MAIN`.

Profil dziecka:

- nie ma osobnej flagi prawdy typu `is_child`; wiek liczymy z `date_of_birth`,
- jezeli `date_of_birth` wskazuje wiek ponizej 18 lat, konto jest traktowane jako dziecko,
- dziecko moze miec tylko jedno konto `PERSON_ID-MAIN`,
- konto dziecka jest zawsze `custodial`,
- dziecko nie moze tworzyc kont `non-custodial` ani dodatkowych kont,
- opiekunowie sa zapisani w `guardian_person_id` i dostaja realny dostep przez `wallet_account_access`,
- po wykryciu wieku 18+ system czysci `guardian_person_id`, dezaktywuje dostepy `access_role='guardian'` do kont tej osoby i pokazuje komunikat odblokowania pelnego konta.

Profil biznesowy:

- `client_kind='business'`,
- firma jest osobowoscia prawna/profil biznesowy i nie wymaga automatycznego tworzenia osoby prywatnej,
- `first_name` przechowuje krotka nazwe firmy i jest obowiazkowe,
- `last_name` przechowuje opcjonalna pelna/druga czesc nazwy prawnej firmy,
- kolumny `company_name` i `full_name` nie wystepuja w `persons`; wszystkie warstwy skladaja nazwe profilu z `first_name + last_name`, niezaleznie od `client_kind`,
- `business_tax_id` przechowuje TAX/KRA/PIN/NIP albo inny numer rejestracyjny i jest obowiazkowy,
- `business_tax_country` przechowuje kraj/standard numeru i jest obowiazkowy,
- telefon albo email firmy oraz adres firmy sa obowiazkowe,
- `linked_private_person_id` moze opcjonalnie wskazywac osobe prywatna odpowiedzialna za profil biznesowy, ale nie jest wymagany,
- po rejestracji firma dostaje konto `BUSINESS_PERSON_ID-MAIN`,
- osoby fizyczne dostaja dostep do konta firmy osobno przez `wallet_account_access`.

Jedna osoba prywatna moze miec wiele powiazanych profili biznesowych, ale duza firma moze istniec bez powiazania z jedna osoba prywatna.

### 30.3 `hub_staff`: rola w hubie, nie osobna osoba

`hub_staff` opisuje role osoby w konkretnym hubie.

Dodane/utrwalone pola:

- `person_id` - wskazuje osobe w `persons`,
- `password_mode` - domyslnie `person`.

Zasady:

- osoba pracujaca w dwoch hubach ma dwa wpisy `hub_staff`,
- kazdy wpis ma osobne `staff_id`, bo logowanie do huba ma jasno wskazywac hub i role,
- osoba moze miec to samo haslo w `persons`, ale rozne `staff_id` dla roznych hubow,
- PIN w `hub_staff` zostaje technicznym potwierdzeniem/kontynuacja sesji huba, nie haslem webowym.

Logowanie hubowe - model testowy:

1. Uzytkownik podaje najpierw PIN.
2. System szuka roli w `hub_staff` po PIN-ie.
3. System sprawdza aktywne sesje `staff` w `login_sessions` dla znalezionych rol.
4. Jezeli PIN pasuje do dokladnie jednej aktywnej sesji, panel otwiera sie bez pytania o `staff_id`.
5. Jezeli PIN jest poprawny, ale sesja nie jest aktywna, system prosi o `staff_id` i sprawdza pare `PIN + staff_id`.
6. Po poprawnym `PIN + staff_id` system tworzy aktywna sesje w `login_sessions` i zapisuje zdarzenie w `system_logs`.
7. Pracownik/owner nie podaje prywatnego hasla osoby do pracy w hubie.
8. Haslo osoby z `persons` dotyczy panelu klienta / konta osoby, nie pracy hubowej.
9. To nie jest docelowy model bezpieczenstwa; PIN jest tymczasowym mechanizmem testowym.
10. Wyjscie z panelu zmienia sesje w `login_sessions` na `logged_out`.

Owner huba:

- owner jest rola w `hub_staff`,
- owner nie trafia do `active_workers`,
- owner nie aktywuje logistycznie huba,
- owner moze dostac dostep do kont huba przez `wallet_account_access`.

### 30.4 Synchronizacja manifestu z `persons`

`hub_manifest.yaml` nadal opisuje huby i role, ale synchronizacja musi tworzyc/linkowac osoby w `persons`.

Flow synchronizacji:

1. System czyta ownerow, managerow, workerow i courierow z manifestu.
2. Dla kazdej roli probuje znalezc osobe:
   - najpierw po emailu,
   - potem po telefonie,
   - opcjonalnie po jawnie podanym `person_id`.
3. Jezeli dopasowanie jest jednoznaczne, ustawia `hub_staff.person_id`.
4. Jezeli nie ma dopasowania, tworzy nowa osobe w `persons`.
5. Dane osobowe z manifestu sa zapisywane jako dane osoby i cache roli.

Zakaz:

- nie laczymy osob automatycznie tylko po imieniu i nazwisku.

### 30.5 `wallet_account_access` jako druga warstwa bezpieczenstwa

`wallet_account_access` jest docelowa tabela dostepu do kont finansowych.

Zasada:

- konto ma odpowiedzialnego wlasciciela/profil w `wallet_accounts.owner_person_id`, jezeli dotyczy, oraz prosta kategorie w `account_scope_type`,
- operacje wykonuje aktor (`actor_id`), ale nie zawsze ten sam identyfikator jest wpisem dostepu,
- dla czlowieka wpis dostepu jest na `persons.person_id`,
- jezeli czlowiek dziala w TUI jako staff/owner/manager/worker, loguje sie i podpisuje operacje `hub_staff.staff_id`, a backend mapuje ten alias na `hub_staff.person_id` do kontroli dostepu,
- `staff_id` moze byc wiele dla jednej osoby, bo jedna osoba moze pracowac w wielu hubach albo pelnic rozne role,
- samodzielny `staff_id` nie powinien dostawac osobnego wpisu w `wallet_account_access`; to byloby dublowanie dostepu aliasu,
- aktor musi miec aktywny wpis w `wallet_account_access` bezposrednio albo przez mapowanie `staff_id -> person_id`,
- jeden wiersz = jeden aktor + jedno konto + jedna rola dostepu.

Nie trzymamy listy osob w jednej kolumnie. Jezeli 5 osob ma dostep do konta, w tabeli jest 5 wierszy.

Uprawnienia:

- `can_view`,
- `can_transfer`,
- `can_cash_in`,
- `can_cash_out`,
- `can_mint`,
- `can_manage_access`.

Znaczenie uprawnien:

- `can_view=1` pozwala widziec konto i historie; brak wiersza oznacza brak dostepu,
- `can_transfer=1` pozwala wykonywac zwykle przelewy VKES,
- `can_cash_in=1` pozwala wykonywac operacje cash-in,
- `can_cash_out=1` pozwala wykonywac operacje cash-out,
- `can_manage_access=1` pozwala zarzadzac dostepami do konta oraz zamrozic lub odblokowac konto biznesowe, ale samo nie daje prawa do przelewu,
- `can_mint=1` oznacza prawo aktora do emisji, ale emisja jest mozliwa tylko gdy samo konto ma `wallet_accounts.is_mint_account=1`,
- `is_active=0` blokuje konkretny dostep aktora,
- `valid_from` i `valid_to` ograniczaja dostep w czasie.

`wallet_accounts.is_mint_account`:

- jest cecha konta, nie aktora,
- `VKES_SYSTEM_MINT` ma `is_mint_account=1`,
- pozostale konta maja `is_mint_account=0`,
- mint wymaga lacznie `is_mint_account=1` na koncie oraz `can_mint=1` dla aktora.

Przyklady:

- klient prywatny ma `can_view=1`, `can_transfer=1` do swojego konta VKES,
- wlasciciel profilu biznesowego ma `can_view=1`, `can_transfer=1`, `can_cash_in=1`, `can_cash_out=1`, `can_manage_access=1` do konta firmy,
- owner huba ma `can_cash_in=1` i/lub `can_cash_out=1` do kont KES huba,
- operator mint ma `can_mint=1` do `SYSTEM_VKES_MINT`,
- rodzic/opiekun ma dostep `guardian` do konta dziecka: `can_view=1`, `can_transfer=1`, `can_cash_in=0`, `can_cash_out=0`, `can_manage_access=0`, `can_mint=0`; operacje `cash_in/cash_out` sa operacjami kasowymi huba i nie sa uprawnieniem opiekuna na prywatnym koncie dziecka,
- zaproszona osoba moze dostac dostep do cudzego konta przez `wallet_account_invites`.

Warstwy bezpieczenstwa:

1. Kod UI/backendu pozwala wykonac tylko dozwolony typ operacji.
2. DB sprawdza aktywny wpis `wallet_account_access` dla `actor_id + account_id + permission`.

### 30.6 Nowy format kont osobowych i biznesowych

Nowe profile osobowe/biznesowe uzywaja formatu opartego o RFC4648 Base32:

```text
PJOA7K-MAIN
BPEB3M-MAIN
BCCF8R-MAIN
```

Alfabet:

```text
ABCDEFGHIJKLMNOPQRSTUVWXYZ234567
```

Znaczenie:

- `P` - profil osoby prywatnej,
- `B` - profil biznesowy,
- kolejne znaki koduja prefiks, sekwencje i checksum,
- po myslniku jest alias konta:
  - `-MAIN` = konto domyslne osoby/firmy,
  - inne aliasy sa jawne tekstowo i nie sa indeksami `-A/-B`.

Alias:

```text
BCCF8R:main
```

Alias jest wygodnym wskazaniem logicznym, ale nie zastepuje `wallet_accounts.account_id`.

Resolver kont przyjmuje trzy formy:

```text
PJOA7K       -> domyslne/main konto profilu w danej walucie
PJOA7K-MAIN  -> konkretne konto glowne
PJOA7K:main  -> konto wskazane aliasem/nazwa logiczna
```

Zakres resolvera:

- skrot `PJOA7K` oraz alias `PJOA7K:main` sa dozwolone tylko dla profili osobowych/biznesowych,
- konta hubowe i systemowe nie korzystaja ze skrotu do `MAIN`,
- przy kontach hubowych/systemowych trzeba podac pelny `account_id`, np. `VKES_SYSTEM_MINT`, `VKES_SYSTEM_OPERATING`, `KES_SYSTEM_OPERATING`, `VKES_AA_OPERATING`, `KES_AA_OPERATING`,
- tokeny techniczne typu `SYSTEM_VKES`, `SYSTEM_KES` albo kod huba `AA` sa ownerami technicznymi i publiczny resolver odrzuca je jako numer konta do przelewu.

Uwaga implementacyjna:

- dla profili osobowych/biznesowych oraz pozostalych nieoperacyjnych ownerow generator tworzy konta aliasowe typu `PJOA7K-MAIN`, `BPEB3M-MAIN`, `OWNER-MAIN`,
- generator nie tworzy juz nowych kont osobowych typu `-A`, `-B`,
- kazdy aktywny `hub_staff` dostaje dwa konta VKES osoby: `person_id-MAIN` oraz konto aliasowe `person_id-staff_id`, np. `PJOA7K-MAAJOAV`,
- `hub_staff.payout_account_id` wskazuje konto aliasowe `person_id-staff_id`; systemowe wplywy/wynagrodzenia dla danej roli ida na to konto, nie na `MAIN`,
- samodzielny `staff_id`, np. `MAAJOAV`, nie jest `account_id`, ale publiczny resolver moze go przyjac jako alias routingu i rozwiazuje go do `hub_staff.payout_account_id`,
- przy finansach paczkowych `staff_id` moze wystapic w `wallet_ledger.metadata_json` jako alias audytowy roli/huba; obok niego system dopisuje `staff_person_id` i `staff_payout_account_id`, gdy da sie je ustalic,
- dla kont hubowych generator tworzy jawne operacyjne `account_id`: `KES_AA_OPERATING`, `VKES_AA_OPERATING`,
- dla kont systemowych generator tworzy jawne operacyjne `account_id`: `VKES_SYSTEM_MINT`, `VKES_SYSTEM_OPERATING`, `KES_SYSTEM_OPERATING`,
- `wallet_accounts.owner_person_id` dla kont systemowych wskazuje osobe `BOSS`, a dla kont person/business wskazuje osobe profilu,
- resolver kont i `create_wallet_account` nie traktuja juz `wallet_owners` jako zrodla prawdy; decyzje biora z `wallet_accounts` oraz tabel zrodlowych (`persons`, `clients`, `hubs`, `hub_staff`),
- `wallet_owners` nie jest tworzona w nowym schemacie i jest usuwana z istniejacych DB podczas migracji `init_finance_schema`,
- format `ACC-*` nie jest juz generowany po resecie DB i nie powinien byc uzywany jako nowy identyfikator konta.

Owner huba i dane huba:

- Dane huba i dane wlasciciela sa rozdzielone.
- `hub_phone`, `hub_email`, `hub_address` opisuja hub/punkt operacyjny.
- `owner_phone`, `owner_email`, `owner_address` opisuja osobe wlasciciela z manifestu.
- `hub_full_name` jest nazwa huba generowana z `hub_type` i kodu huba, np. `Butcher Hub AA`; nie jest nazwa osoby.
- `hubs.owner_person_id` wskazuje `persons.person_id` wlasciciela huba.
- Ten sam `person_id` jest przypiety do roli ownera w `hub_staff.person_id`.

Regula aktora:

- jezeli czlowiek podaje kwote albo podejmuje decyzje finansowa, operacja musi miec `actor_id` zgodny z kanalem logowania i przejsc `wallet_account_access`,
- przyklad: `execute_hub_cash_create`, `execute_hub_cash_to_vkes`, `execute_cash_in`, `execute_cash_out`, zwykly transfer z konta,
- TUI/hub flow uzywa `hub_staff.staff_id` jako `actor_id`,
- `client_app`/`client_api` uzywa `persons.person_id` jako `actor_id`,
- roznica jest celowa: `person_id` identyfikuje osobe, a `staff_id` identyfikuje alias/role, przez ktora osoba dziala w danej chwili,
- rozliczenia pracy w hubie ida na konto aliasowe roli, np. `person_id-staff_id`, wskazane w `hub_staff.payout_account_id`,
- uprawnienie do uzycia konta huba jest sprawdzane po osobie (`person_id`), ale ledger pokazuje operacyjny podpis (`staff_id`), gdy operacja przyszla z TUI,
- operacje automatyczne bez decyzji czlowieka moga uzywac jawnego aktora technicznego `SYSTEM_RUNTIME`,
- `SYSTEM_RUNTIME` jest jawnie seedowany do `persons` jako `person_type='system'`,
- `SYSTEM_RUNTIME` nie ma hasla i ma `metadata_json={"technical":true,"login_enabled":false}`,
- `client_api` oraz funkcje weryfikacji hasla blokuja logowanie i ustawianie hasla dla `person_type='system'` albo `login_enabled=false`,
- `SYSTEM_RUNTIME` ma dostep tylko przez wpisy `wallet_account_access`, wiec jego uprawnienia mozna wlaczyc/wylaczyc per konto,
- walidacja aktora dostepu wymaga, aby `SYSTEM_RUNTIME` istnial aktywnie w `persons`; nie jest juz aktorem "znikad",
- wpisy finansowe powiazane z paczka przechodza przez wrapper package ledger:
  - gdy operacja pochodzi z TUI i jest wykonywana przez zalogowany staff, wrapper/flow przekazuje `actor_id=staff_id`,
  - gdy brak zalogowanego czlowieka w kontekscie, wrapper dopisuje `actor_id=SYSTEM_RUNTIME`,
  - dla platnosci KES/VKES przy tworzeniu paczki `create_and_add_parcel` przekazuje kontekst staff w metadata, ale kolumna ledger `actor_id` pozostaje jedynym polem wykonawcy.

### 30.7 `wallet_ledger` jako jedyne zrodlo salda

Saldo konta nie jest przechowywane jako jedna aktualizowana liczba.

Saldo wynika z sumy wpisow w `wallet_ledger` dla konkretnego `account_id` i waluty.

Konsekwencje:

- pusta historia ledger = saldo 0,
- reczna zmiana `amount` lub `balance` psuje hash/HMAC/audyt,
- aplikacja powinna liczyc saldo z ledger,
- `payment_intents` nie jest zrodlem salda,
- `wallet_accounts` opisuje konto, ale nie przechowuje salda.

Wazne kolumny ledger:

- `account_id` - konkretne konto,
- `owner_id` - owner finansowy,
- `amount` - zmiana salda,
- `currency` - `VKES` albo `KES`,
- `tx_group_id` - grupa wpisow jednej operacji,
- `intent_id` - opcjonalne powiazanie z `payment_intents`,
- `package_id` - opcjonalne powiazanie z paczka,
- `event_key` - typ zdarzenia finansowego,
- `actor_id` - jedyny identyfikator wykonawcy operacji finansowej,
- `from_owner` - zrodlo/kontekst,
- `metadata_json` - dodatkowy kontekst,
- `entry_hash`, `hmac_signature`, `hmac_key_id` - integralnosc/audyt.

`wallet_ledger` nie przechowuje juz osobnych kolumn `actor_type`, `actor_person_id`, `actor_staff_id`. Typ aktora wynika z formatu i kanalu logowania:

- `SYSTEM_RUNTIME` = automatyczna operacja systemowa bez decyzji czlowieka,
- `BOSS`/`CEO`/`COO`/`CFO` albo staff/owner/manager/worker ID = operacja TUI/hub/system staff,
- `P...` = prywatna operacja osoby zalogowanej w `client_app`,
- dodatkowe informacje, np. `staff_id`, `staff_person_id`, `staff_payout_account_id`, moga byc w `metadata_json`, ale nie sa osobnymi kolumnami wykonawcy.

### 30.8 `tx_group_id`

`tx_group_id` laczy wpisy ledger nalezace do jednej operacji finansowej.

Przyklad zwyklego przelewu:

```text
tx_group_id = TX...
konto A   -100 VKES   event_key=transfer_debit
konto B   +100 VKES   event_key=transfer_credit
```

Przyklad przelewu z uzyciem kredytu:

```text
tx_group_id = TX...
konto A   -100 VKES   event_key=transfer_debit
konto B   +100 VKES   event_key=transfer_credit
konto A     -5 VKES   event_key=credit_fee_debit
konto FEE   +5 VKES   event_key=credit_fee_credit
```

Audyt moze sprawdzic calosc operacji po `tx_group_id`.

### 30.9 Zwykly przelew VKES

Zwykly przelew wykonuje typowana komenda
`execute_wallet_transfer_command()`.

Flow:

1. Backend dostaje:
   - `from_account_id` albo `from_owner_id`,
   - `to_account_id` albo `to_owner_id`,
   - `actor_id`,
   - kwote,
   - walute,
   - opcjonalny opis.
2. Backend rozpoznaje konkretne konta.
3. Backend sprawdza:
   - czy konto zrodlowe istnieje,
   - czy konto docelowe istnieje,
   - czy oba konta sa aktywne,
   - czy waluta sie zgadza,
   - czy nie probujemy zwyklego transferu `KES`,
   - czy aktor ma `can_transfer` do konta zrodlowego.
4. Jezeli konto zrodlowe jest non-custodial, wymagany jest podpis lokalny z mnemonic/private key.
5. Backend sprawdza saldo.
6. Jezeli saldo po operacji nie spada ponizej zera, przelew idzie normalnie.
7. Jezeli saldo spada ponizej zera, uruchamia sie walidacja kredytu/debetu.
8. Backend zapisuje atomowo wpisy ledger:
   - `transfer_debit`,
   - `transfer_credit`,
   - ewentualnie `credit_fee_debit`,
   - ewentualnie `credit_fee_credit`.

Zwykly przelew dodatnim saldem nie wymaga kontraktu kredytowego.

### 30.10 Blokada zwyklych transferow KES

`KES` i `VKES` sa osobnymi liniami kont.

Zwykly transfer KES miedzy kontami jest zablokowany.

Dozwolone operacje KES:

- `hub_cash_create` - deklaracja/wplata gotowki do huba,
- `parcel_cash_payment` - gotowka za paczke,
- `hub_cash_to_vkes` - szybka procedura wymiany testowo-operacyjnej,
- docelowe cash-in/cash-out przez dedykowane funkcje, nie przez zwykly `execute_wallet_transfer`.

### 30.11 Emisja VKES przez `SYSTEM_VKES_MINT`

`SYSTEM_VKES_MINT` ma specjalny tryb.

Emisja i przekazanie utworzonych srodkow sa jedna atomowa operacja biznesowa. Poszczegolne wpisy zachowuja rozne `event_key`, ale laczy je jeden `tx_group_id`.

Model ledger:

```text
TX1:
SYSTEM_VKES_MINT  +kwota  event_key=mint_create
SYSTEM_VKES_MINT  -kwota  event_key=mint_transfer_debit
SYSTEM_VKES       +kwota  event_key=mint_transfer_credit
```

Znaczenie:

- `mint_create` pokazuje moment kreacji VKES,
- ten sam `tx_group_id` laczy kreacje i przekazanie utworzonych srodkow,
- dodatnia suma grupy jest prawidlowa i odpowiada nowej podazy VKES,
- audyt wymaga dokladnie jednego `mint_create`, odpowiadajacego mu debetu konta mint i identycznego kredytu konta docelowego,
- aktor musi miec `can_mint` do konta mint,
- dla dev/testow TUI moze generowac mnemonic dla `SYSTEM_VKES_MINT`.

### 30.12 Gotowka huba: dodanie KES

Funkcja: `execute_hub_cash_create`.

Cel:

- owner/operator huba deklaruje gotowke dostepna w kasie huba,
- powstaje jeden wpis dodatni na koncie KES huba.

Wymagania:

- istnieje aktywne konto `HUB_KES`,
- `actor_id` ma `can_cash_in=1` dla tego konta.

Ledger:

```text
HUB_KES +kwota
event_key = hub_cash_create
from_owner = EXTERNAL_CASH
```

To jest kreacja/deklaracja zewnetrznej gotowki w systemie, a nie przelew z innego konta.

### 30.13 Platnosc gotowka za paczke

Funkcja: `execute_parcel_cash_payment`.

Cel:

- klient placi gotowka w hubie za paczke,
- saldo KES huba rosnie,
- wpis jest powiazany z `package_id`.

Wymagania:

- istnieje aktywne konto `HUB_KES`,
- `actor_id` ma `can_cash_in=1`,
- istnieje `package_id`.

Ledger:

```text
HUB_KES +kwota
event_key = parcel_cash_payment
package_id = ID_PACZKI
from_owner = CLIENT_CASH
```

### 30.14 Szybka wymiana huba KES -> VKES

Funkcja: `execute_hub_cash_to_vkes`.

Cel:

- szybkie operacyjne/testowe przeksztalcenie gotowki huba w VKES huba,
- docelowo fizyczny proces moze miec statusy i kolejke, ale aktualna funkcja wykonuje to natychmiast.

Wymagania:

- aktywne konto `HUB_KES`,
- aktywne konto `HUB_VKES`,
- aktywne konto `SYSTEM_KES`,
- aktywne konto `SYSTEM_VKES`,
- saldo `HUB_KES >= kwota`,
- saldo `SYSTEM_VKES >= kwota`,
- `actor_id` ma `can_cash_out=1` dla `HUB_KES`.

Ledger w jednym `tx_group_id`:

```text
HUB_KES       -kwota  event_key=hub_cash_to_system_debit
SYSTEM_KES    +kwota  event_key=system_cash_credit
SYSTEM_VKES   -kwota  event_key=system_vkes_debit
HUB_VKES      +kwota  event_key=hub_vkes_credit
```

Znaczenie:

- gotowka KES zostaje rozliczona z systemem,
- system wydaje VKES hubowi,
- wszystkie cztery wpisy tworza jedna operacje audytowa.

### 30.15 Cash-in i cash-out klienta

Cash-in klienta:

- klient daje gotowke KES w hubie,
- hub dostaje VKES od klienta/systemu zgodnie z operacja,
- ledger musi pokazywac komplet przeplywu.

Cash-out klienta:

- klient oddaje VKES,
- hub wydaje gotowke KES,
- czesc KES jest spalana/odejmowana jako wyplata z kasy huba.

Docelowo:

- cash-in/cash-out powinny byc osobnymi operacjami backendowymi,
- nie powinny byc zwyklym transferem `KES`,
- przeplywy musza byc laczone `tx_group_id`,
- `actor_id` musi miec odpowiednie uprawnienia do konta huba.

### 30.16 `payment_intents`: proces push, nie saldo

`payment_intents` przechowuje proces platnosci/powiadomienia.

Nie przechowuje salda i nie jest ledgerem.

Kolumny istotne:

- `intent_id` - dlugi techniczny identyfikator,
- `intent_code` - krotki kod do recznego uzycia/przepisania,
- `intent_type`:
  - `payment_request`,
  - `incoming_payment_offer`,
  - `parcel_payment_request`,
- `delivery_mode`:
  - `online`,
  - `waiting`,
- `status`,
- `payer_account_id`,
- `payee_account_id`,
- `initiator_id`,
- `reason`,
- `note`,
- `package_id`,
- `tx_group_id`,
- `hub_code2`,
- `expires_at`,
- `db_ts`.

`payer_owner_id`, `payee_owner_id`, `method`, autorzy etapow, ich czasy oraz
`error_message` nie sa duplikowane w snapshocie. Widok
`payment_intents_read` wylicza je z `wallet_accounts`, `currency` i
`payment_intent_events`.

Statusy:

- `created`,
- `awaiting_push`,
- `awaiting_offline_response`,
- `awaiting_signature`,
- `authorized`,
- `settled`,
- `rejected`,
- `cancelled`,
- `expired`,
- `failed`.

Zasada:

- `payment_intents` mowi, co zostalo poproszone/zaakceptowane/odrzucone,
- `payment_intent_events` zapisuje atomowo kazde utworzenie i przejscie stanu,
- `wallet_ledger` mowi, gdzie faktycznie poszly pieniadze,
- `awaiting_push` i `awaiting_offline_response` zawsze maja `expires_at`;
  domyslnie jest to 600 sekund od rozpoczecia oczekiwania, konfigurowane przez
  `PAYMENT_INTENT_RESPONSE_TTL_SECONDS` (60 sekund - 24 godziny),
- jawny `expires_at` nie jest automatycznie przedluzany,
- wygasniecie zapisuje `expired / expired_timeout` z aktorem
  `SYSTEM_RUNTIME`,
- widocznosc intencji wymaga aktualnego dostepu do konta z uwzglednieniem
  `valid_from` i `valid_to`; samo utworzenie intencji nie daje stalego dostepu,
- SSE obserwuje wszystkie widoczne intencje, aby zmiana starszego rekordu nie
  zginela za limitem ostatnich elementow.

### 30.17 Push `online` i `waiting`

`online`:

- szybka sesja platnosci,
- odbiorca/platnik musi byc online w momencie utworzenia,
- jezeli odbiorca jest offline, system nie tworzy aktywnej sesji albo oznacza niedostarczenie,
- duzy modal zostaje otwarty do czasu wyniku,
- utrata nadawcy zamyka proces statusem `failed` z powodem
  `sender_disconnected`,
- komunikaty nie ujawniaja globalnego statusu osoby, tylko status konkretnej sesji platnosci.

`waiting`:

- zlecenie oczekujace,
- zapisane trwale w `payment_intents`,
- nie wymaga aktywnego czekania nadawcy,
- widoczne w kopercie/powiadomieniach oczekujacych,
- bez blokowania srodkow,
- przy akceptacji dopiero wtedy sprawdzane jest saldo i wykonywany ledger.

Non-custodial:

- `Zarzadaj zaplaty` jest dozwolone, bo placacy podpisuje dopiero przy akceptacji,
- `Utworz platnosc` w trybie oczekujacym dla kont non-custodial jest blokowane do czasu sesji `unlock wallet`,
- szybki push non-custodial dziala, jezeli placacy poda mnemonic i podpisze transakcje.

### 30.18 Kredyt/debet: kontrakt, polityka i stan

Debet nie wynika z samego braku blokady salda. Debet jest dozwolony tylko wtedy, gdy konto ma aktywna polityke kredytowa powiazana z aktywnym kontraktem.

Tabele:

- `wallet_credit_contracts` - kontrakt/umowa kredytowa,
- `wallet_account_credit_policy` - aktywna polityka debetu dla konta,
- `wallet_account_credit_state` - aktualny stan uzycia kredytu.

`wallet_credit_contracts`:

- `contract_id`,
- `account_id`,
- `status`,
- `credit_limit`,
- `credit_fee_percent`,
- `credit_fee_min_amount`,
- `overdue_fee_percent`,
- `due_days`,
- `lender_account_id`,
- `fee_account_id`,
- `created_by_actor_id`,
- `approved_by_actor_id`,
- `activated_by_actor_id`,
- `signed_by_actor_id`,
- daty i `terms_json`.

`wallet_account_credit_policy`:

- `account_id`,
- `contract_id`,
- `allow_debit`,
- `credit_limit`,
- `credit_fee_percent`,
- `credit_fee_min_amount`,
- `credit_fee_account_id`,
- `status`,
- `valid_from`,
- `valid_to`.

`wallet_account_credit_state`:

- `account_id`,
- `credit_status`,
- `principal_used`,
- `used_from_ts`,
- `due_ts`,
- `last_fee_ts`,
- `overdue_since_ts`.

Statusy kontraktu:

- `draft`,
- `pending_signature`,
- `active`,
- `suspended`,
- `closed`,
- `rejected`,
- `expired`.

### 30.19 Algorytm przelewu z kredytem

Przy kazdym przelewie VKES:

1. Backend liczy saldo konta zrodlowego z `wallet_ledger`.
2. Backend liczy saldo po glownym przelewie.
3. Jezeli saldo po przelewie jest `>= 0`, przelew idzie bez kredytu.
4. Jezeli saldo po przelewie jest `< 0`, backend pobiera aktywna polityke:
   - `wallet_account_credit_policy.allow_debit=1`,
   - `wallet_account_credit_policy.status='active'`,
   - `wallet_account_credit_policy.contract_id` wskazuje aktywny kontrakt,
   - `wallet_credit_contracts.status='active'`.
5. Jezeli polityki albo aktywnego kontraktu nie ma, przelew jest blokowany.
6. Backend liczy fee kredytowe:
   - procent od uzytego kredytu,
   - minimum kwotowe, jezeli ustawione.
7. Backend liczy saldo po przelewie i fee.
8. Jezeli saldo po fee przekracza `-credit_limit`, operacja jest blokowana.
9. Jezeli miesci sie w limicie, backend zapisuje ledger.
10. Backend aktualizuje `wallet_account_credit_state`.

Wpisy ledger przy kredycie sa w tym samym `tx_group_id`:

```text
konto zrodlowe      -kwota       event_key=transfer_debit
konto docelowe      +kwota       event_key=transfer_credit
konto zrodlowe      -fee         event_key=credit_fee_debit
konto fee/system    +fee         event_key=credit_fee_credit
```

`wallet_account_credit_state`:

- gdy saldo konta jest ponizej zera, `credit_status='used'`,
- `principal_used` = aktualna kwota ponizej zera,
- `used_from_ts` ustawiane przy pierwszym zejsciu ponizej zera,
- `due_ts` liczone z `due_days`,
- gdy saldo wraca do `>=0`, stan wraca do `clear`.

#### 30.19.1 Dowod oplaty kredytowej i audyt historyczny (2026-10-07)

Poprzednio audyt sprawdzal m.in. podpisy, konta, uprawnienia, intent i
wzajemne nogi transferu, ale sama poprawna para oplat nie dowodzila, ze
oplata wynika z konkretnej umowy kredytowej ani ze jej kwota jest zgodna
z warunkami. Poprawny hash/podpis nie jest dowodem poprawnosci biznesowej.

Obecnie centralny writer dla `credit_fee_debit` i `credit_fee_credit`
zamraza w podpisanej `metadata_json.business_audit_v1.credit_fee` umowe,
polityke konta i glowne obciazenie. Korzysta z tego samego polaczenia DB
co operacja; dowodu nie dostarcza frontend ani caller.

Audyt sprawdza aktywnosc i waznosc umowy/polityki w chwili operacji,
`allow_debit`, zgodnosc limitu/procentu/minimum oraz docelowego konta oplat.
Podstawa obliczenia jest ujemne saldo po glownym obciazeniu, nie cala
kwota przelewu. Oplata jest maksimum z minimum i procentu tego salda,
zaokraglonego `ROUND_HALF_UP` do minor units. Sprawdzany jest takze limit
po pobraniu oplaty, dokladnie jedna wzajemna para oplat i powiazanie
z rzeczywistym glownym wpisem tego samego `tx_group_id`, lacznie z hashem.

Pozniejsza zmiana albo zamkniecie umowy nie uniewaznia poprawnej dawnej
oplaty: audyt korzysta z zamrozonego dowodu, nie dzisiejszych warunkow.
Nie zmieniono formatu hash/HMAC/podpisow ani schematu DB. Stare oplaty bez
tego dowodu nie przechodza audytu; nie dodano migracji, backfillu ani
fallbacku uznajacego brakujace dane za poprawne.

Nieprawidlowe daty operacji, autoryzacji i uprawnien otrzymuja osobne
diagnostyki. Nie usuwaja innych znalezionych problemow konta/aktora.
Uszkodzony JSON lub dowod nadal oznacza blad audytu, a nie pominiecie
weryfikacji. Szczegoly implementacji i odbioru: task 34.1.

### 30.20 Regresje wymagane dla kredytu

Minimalne testy:

1. Przelew bez kontraktu:
   - konto ma saldo 0,
   - przelew powoduje saldo ujemne,
   - wynik: blokada,
   - brak wpisow ledger.

2. Przelew z aktywnym kontraktem:
   - konto ma aktywny kontrakt,
   - polityka ma `allow_debit=1`,
   - kwota miesci sie w limicie,
   - wynik: przelew przechodzi,
   - ledger ma debit/credit,
   - jezeli fee > 0, ledger ma tez debit/credit fee,
   - wszystkie wpisy sa w tym samym `tx_group_id`,
   - `wallet_account_credit_state` ma status `used`.

3. Przekroczenie limitu:
   - aktywny kontrakt istnieje,
   - kwota + fee przekracza `credit_limit`,
   - wynik: blokada.

4. Splata kredytu:
   - konto bylo ponizej zera,
   - po wplywie saldo wraca do `>=0`,
   - `wallet_account_credit_state.credit_status='clear'`.

### 30.21 Reset danych finansowo-tozsamosciowych

Opis historyczny z jednorazowego przejscia na model `persons`. Funkcja
`reset_finance_identity_tables` zostala usunieta: nie byla wywolywana przez
aktualny start systemu, a jej sciezka mogla kasowac ledger i wylaczac klucze
obce. Nie jest dostepna jako operacja aplikacyjna. Aktualny model uruchamiania
z pustej bazy opisuje sekcja 31.1; normalny start nie resetuje danych.

Ze wzgledu na zmiane modelu ID, kont, dostepow i ledger, stare wpisy finansowo-tozsamosciowe nie sa migrowane semantycznie.

Dawna funkcja pomocnicza:

- `reset_finance_identity_tables`.

Czysci:

- `clients`,
- `wallet_accounts`,
- `wallet_account_access`,
- `wallet_ledger`,
- `payment_intents`,
- `approval_requests`,
- `wallet_account_keys`,
- `wallet_keys`,
- `wallet_signatures`,
- `wallet_account_invites`,
- `wallet_account_credit_policy`,
- `wallet_account_credit_state`,
- `wallet_credit_contracts`,
- `login_sessions`.

Nie czysci automatycznie:

- `hubs`,
- `hub_staff`,
- paczek,
- workow,
- konfiguracji runtime/topologii.

Po resecie trzeba uruchomic:

1. inicjalizacje schematu,
2. synchronizacje manifestu,
3. seed kont systemowych/hubowych,
4. seed/grant dostepow `wallet_account_access`,
5. testy regresji finansowej.

### 30.22 Aktualna polityka kompatybilnosci po resecie modelu

Po przejsciu na model `persons + wallet_account_access` nie ukrywamy juz brakow danych przez stary `client_id/staff_id`.

Zasady fail-fast:

- brak `clients.person_id` jest bledem dla logowania i operacji finansowych klienta,
- `client_api` nie traktuje juz `client_id` jako aktora finansowego, gdy brakuje `person_id`,
- haslo klienta jest sprawdzane w `persons`, a nie jako fallback w `clients`,
- zaproszenia do kont wymagaja docelowo osoby (`person_id`), a nie samego starego `client_id`,
- `wallet_account_access.actor_id` ma wskazywac osobe/aktora zgodnego z nowym modelem.

Co jeszcze zostaje technicznie kompatybilne:

- `clients` i `hub_staff` moga trzymac dane osobowe jako cache do odczytow UI,
- migracje `ALTER TABLE` w `init_finance_schema` zostaja, zeby aplikacja potrafila dopisac brakujace kolumny podczas developmentu,
- `account_id` dla system/hub/starych ownerow nie uzywa juz `ACC-*`; brak zgodnosci ze starym formatem ma ujawnic stare dane po resecie zamiast maskowac blad.

Zasada operacyjna:

- lepiej, zeby brak danych wyszedl jako blad przy starcie albo operacji, niz zeby system cicho uznal stary identyfikator za poprawnego aktora finansowego.


---

## 31. Aktualny model finansow i synchronizacji po poprawkach `acc_task` 2026-07-04

Ta sekcja opisuje aktualny stan systemu po uporzadkowaniu modelu osob, kont, dostepow, mint, ledger i synchronizacji manifestu. Jest to stan docelowy dla nowej/pustej bazy. Nie utrzymujemy kompatybilnosci ze starym modelem DB.

### 31.1 Zasada startu systemu z pustej bazy

Pusta baza startuje z konfiguracji i kontrolowanego importu manifestu. Jest to
jawny tryb odbudowy, a nie fallback wykonywany podczas normalnego startu.

Kolejnosc startu:

1. `config.yaml` synchronizuje ustawienia systemu.
2. Przy zwyklej pracy Admin API tworzy wiersze `hubs` i przydziela ich `code1`.
   Przy pelnym resecie pustej DB wiersze oraz zapisane `code1` sa jednorazowo
   odtwarzane z `hub_manifest.yaml`.
3. `hub_manifest.yaml` jest czytany jako zrodlo danych opisowych hubow,
   ownerow, staff i central staff. Po bootstrapie nie moze nadpisac `code1`.
4. Synchronizacja manifestu aktualizuje:
   - nieidentyfikacyjne pola istniejacych `hubs` (bez `local_name`),
   - `hub_staff`,
   - `persons`,
   - konta `wallet_accounts`,
   - dostepy `wallet_account_access`,
   - klucze `wallet_keys` dla aktywnych kont.
5. Dopiero po tej synchronizacji system moze wykonywac operacje finansowe.

Nie robimy juz cichych migracji starego schematu finansowego. Jezeli tabela ma stary ksztalt albo brakuje wymaganych kolumn, system powinien zwrocic blad schematu zamiast samodzielnie dopisywac kolumny.

### 31.2 Walidacja `hub_manifest.yaml`

Manifest jest teraz walidowany przed zapisem do DB.

Blokujace bledy:

- niepoprawny format telefonu,
- niepoprawny format emaila,
- zly typ struktury manifestu, np. staff jako string zamiast map/dict,
- duplikaty ID/PIN w miejscach, gdzie sa niedozwolone,
- bledne zakresy geo/stawki/payout.

Ostrzezenia, ktore nie musza blokowac startu:

- brak telefonu,
- brak emaila,
- brak adresu,
- brak PIN tam, gdzie powinien byc uzupelniony.

Wynik walidacji trafia do `manifest_validation` w wyniku synchronizacji. TUI pokazuje w panelu startowym liczbe problemow i pierwsze pozycje do poprawy.

### 31.3 `persons` jako zrodlo tozsamosci

`persons` jest glowna tabela danych osobowych i logowania.

Przechowuje:

- `person_id`,
- imie, nazwisko, pelna nazwe,
- telefon/email/adres,
- typ osoby/profilu,
- dane hasla (`password_hash`, `password_salt`, `password_must_change`, `password_source`),
- dane dodatkowe typu dziecko/opiekun/metadata.

`hub_staff` nie jest druga baza osob. `hub_staff` opisuje role osoby w konkretnym hubie albo w hubie technicznym `SYSTEM`.

Przyklad:

```text
persons.person_id = PDOBBC
hub_staff(hub_name=SYSTEM, staff_id=BOSS, person_id=PDOBBC)
```

`staff_id` sluzy do roli/logowania/aliasu operacyjnego. `person_id` opisuje osobe. Ta sama osoba moze miec wiele `staff_id`, np. gdy pracuje w kilku hubach albo w jednym hubie jako manager, a w innym jako pomoc.

Zasada aliasu:

- `person_id` = jedna osoba/profil,
- `staff_id` = alias operacyjny/nickname osoby w konkretnym hubie albo roli,
- `hub_staff.payout_account_id` wskazuje konto aliasowe, na ktore trafiaja rozliczenia za prace w tej roli,
- `wallet_account_access` trzyma uprawnienia osoby (`person_id`), nie aliasu (`staff_id`),
- `wallet_ledger.actor_id` zapisuje alias/logowanie, ktory faktycznie wykonal operacje w TUI.

Zasada `actor_id` wynika z kanalu logowania:

- jezeli operacja jest wykonana w TUI po zalogowaniu przez PIN/staff flow, `actor_id` jest operacyjnym loginem `hub_staff.staff_id`, np. `BOSS`, `MAAJOAV`, `OAAUFAH`,
- jezeli operacja jest wykonana w `client_app` / `client_api` w trybie osoby prywatnej, `actor_id` jest `persons.person_id`, np. `PJOA7K`,
- jezeli osoba aktywuje w `client_app` tryb staff poprawnym PIN-em, kazde zadanie finansowe przekazuje podpisany token tego kontekstu, backend ponownie weryfikuje powiazanie `person_id -> staff_id`, a `wallet_ledger.actor_id` jest aktywnym `staff_id`,
- jezeli w TUI w panelu `3:Finanse` uzytkownik zaloguje sie jako klient, stosuje sie zasade klienta, czyli `actor_id=person_id`,
- jezeli operacja jest automatyczna i nie wynika z decyzji zalogowanego czlowieka, `actor_id=SYSTEM_RUNTIME`,
- nawet jezeli zalogowana osoba wykonuje przelew z konta firmowego/hubowego, `actor_id` nadal wskazuje jej login z danego kanalu,
- uprawnienie do konta huba/firmy musi wynikac z `wallet_account_access`; gdy aktorem TUI jest `staff_id`, backend sprawdza prawa po `hub_staff.person_id`.

Autoryzacja i aktor sa rozdzielone. `person_id` nadal sluzy do sprawdzania dostepu do konta i do adresowania push. `staff_id` opisuje tylko operacyjny login, ktory faktycznie podjal decyzje. Brak tokenu staff oznacza tryb prywatny i `actor_id=person_id`; podanie niewaznego tokenu staff blokuje operacje zamiast cicho wracac do `person_id`.

W `payment_intents` rozdzielenie jest trwale: `created_by` przechowuje osobe/profil procesu, `created_by_actor_id` aktora tworzacego, a `authorized_by_actor_id` aktora zatwierdzajacego. Dla oferty przychodzacej ledger zapisuje aktora inicjujacego platnosc; dla zadania zaplaty aktora, ktory zatwierdzil obciazenie.

Kazdy intent VKES przechowuje konkretne `payer_account_id` i `payee_account_id`. Jezeli API otrzymuje zwykly `person_id`, resolver wybiera wylacznie aktywne konto tego samego scope (`person` albo `business`) i nie moze wybrac konta `staff`, `hub` ani `system` tylko dlatego, ze maja to samo `owner_person_id`. Ta sama izolacja scope obowiazuje w `is_client_financially_onboarded()` oraz `list_wallet_accounts()`.

Warstwa ledger nie zgaduje konta z samego `owner_id`. Kazdy zapis pojedynczy i kazda para debit/credit musza przekazac jawne `account_id`; narzedzie `ledger_seed.py` iteruje po konkretnych kontach i jest wznawialne per konto.

### 31.3A Paczka z szablonu klienta: `local`, `global`, `created` i `TX.../paid`

Kazdy rekord w `packages` ma obowiazkowe pole:

```sql
created_by TEXT NOT NULL CHECK (LENGTH(TRIM(created_by)) > 0)
```

`packages.created_by` wskazuje pierwotnego autora pierwszego rekordu paczki:

- Client API zapisuje uwierzytelniony `person_id`,
- Hub API i TUI zapisuja aktywny `staff_id`,
- Admin API oraz automatyczne utworzenie systemowe zapisuja
  `SYSTEM_RUNTIME`.

Pole nie ma `DEFAULT` ani `FOREIGN KEY`, poniewaz jedna kolumna moze wskazac
`persons.person_id` albo `hub_staff.staff_id`. Repozytorium przed pierwszym
zapisem sprawdza, czy wskazana tozsamosc istnieje. Brak autora, pusty tekst
albo nieznana tozsamosc przerywaja zapis. Pozniejsze wylaczenie osoby nie
usuwa historycznego autora.

Autor nie jest aktorem calej podrozy. `package_events.staff_id`, wpisy
ledgera i eventy workow przechowuja pracownika albo proces, ktory wykonal
konkretna operacje. Przy przejsciu `TMP -> code4` finalna paczka zachowuje
`created_by` przeniesione do formularza podczas atomowego wczytania. Przy
`TX -> code4` pobiera je z nadal istniejacego rekordu TX. Pracownik
finalizujacy pozostaje aktorem `intake`, platnosci, worka i innych operacji.

Podsumowanie formularza huba zawsze pokazuje `packages.created_by`. Jezeli
autor rozni sie od aktywnego `staff_id`, wpis jest czerwony. Kolor nie zmienia
aktora operacyjnego: finalizujacy pracownik nadal trafia do
`package_events.staff_id` i odpowiednich wpisow audytowych.

Statusy szkicow paczek maja rozne znaczenie finansowe:

- `local` oznacza nieoplacony szkic przypisany do huba startowego. Wymaga pobrania platnosci w hubie.
- `global` oznacza nieoplacony szkic widoczny szerzej niz jeden hub. Nie zastepuje informacji o platnosci.
- `created` oznacza kompletny szkic paczki, ale nie jest dowodem platnosci.
  Jak kazdy `TMP`, jest konsumowany przy wczytaniu do formularza.
- `TX.../paid` oznacza przedplacony voucher paczki utworzony po zdalnej platnosci VKES. To jest dowod przedplaty w `packages`, ale tylko tymczasowo.

Panel klienta (`client_api`) zapisuje zdalnie przygotowana paczke jako `TMP-...`.

Tryby:

- platnosc w hubie: zapis `TMP-.../local`, bez wpisow ledger i bez `payment_creation`;
- platnosc teraz VKES: zapis `TX.../paid`, przelew `client VKES -> VKES_SYSTEM_OPERATING` w `wallet_ledger`; `TX.../paid` nie tworzy `package_events`.

Mechanizm numerowania `TMP-...`:

- `TMP-...` jest roboczym wpisem w tabeli `packages`, nie finalnym numerem przesylki.
- Prefiks roboczy jest rozpoznawany wylacznie jako `TMP-`. Sam poczatek
  `TMP` nie oznacza szkicu: finalna paczka moze legalnie otrzymac human code4
  `TMP3` i techniczne ID `TMP3-...`.
- TUI i `client_api` dla paczki nieoplaconej w hubie buduja
  `SaveParcelDraftCommand` i wywoluja wspolny
  `save_parcel_draft_command()`, ktory deleguje zapis do
  `register_package`.
- Zapis szkicu szuka pierwszego wolnego `packages.rowid`:
  - jezeli pierwszy wiersz jest wolny, uzywa `rowid=1`,
  - jezeli w srodku tabeli jest dziura po skasowanym TMP, uzywa pierwszej dziury,
  - jezeli dziur nie ma, uzywa `MAX(rowid)+1`.
- Numer szkicu powstaje z tego `rowid`, ale czesc sekwencyjna jest kodowana
  alfabetem RFC 4648 Base32 `ABCDEFGHIJKLMNOPQRSTUVWXYZ234567`.
- Kodowanie uzywa wartosci `rowid - 1`, dlatego pierwsze szkice maja postac
  `TMP-A`, `TMP-B`, ..., `TMP-7`, `TMP-BA`, a nie `TMP-1`, `TMP-2`, ... .
- Base32 zachowuje kolejnosc technicznego numeru i jednoczesnie pozwala
  wyszukiwarce Hub App stosowac jeden dozwolony alfabet dla `code4`, `TMP`
  oraz krotkich kodow platnosci.
- `register_package` zapisuje taki szkic przez `rowid_override`, dlatego szkice TMP sa trzymane na poczatku tabeli i wypelniaja wolne miejsca po poprzednich szkicach.
- Przy starcie jednoznaczne stare drafty `TMP1`, `TMP2`, ... albo
  `TMP-1`, `TMP-2`, ... bez wpisow `package_events` sa migrowane do
  `TMP-A`, `TMP-B`, ... . Rekord z historia
  eventow nie jest automatycznie zmieniany, aby nie naruszyc finalnej paczki,
  ktora historycznie mogla otrzymac taki code4.
- Ten mechanizm dotyczy `local`, `global` i `created`.

Hub przy fizycznym przyjeciu paczki `local` moze pobrac platnosc:

- gotowka KES,
- VKES/push,
- innym dopuszczonym procesem platnosci.

Po pobraniu platnosci hub moze aktywowac szablon i wygenerowac finalny `package_id`. Dla platnosci VKES wykonanej w panelu klienta system tworzy tymczasowy voucher `TX.../paid`, a hub przy aktywacji nie pobiera platnosci ponownie.

Dla oplaconego `TX.../paid` zasada audytu jest nastepujaca:

```text
packages:
  TX123 status=paid

wallet_ledger:
  klient -100 TX123
  system +100 TX123

FINAL_ID:
  payment_creation    TX123
  intake              TX124
  courier             TX125

wallet_ledger:
  system -100 TX123
  hub    +100 TX123
```

Zasady:

- `TX.../paid` jest tymczasowym wpisem w `packages`, a nie finalna paczka.
- `TX.../paid` nie tworzy `package_events`; dowod przedplaty jest tylko w `wallet_ledger`.
- finalne `package_events.payment_creation.finance_tx_group_id` wskazuje ten sam TX, ktory potwierdza pobrana platnosc.
- aktywacja oplaconego TX tworzy drugi etap ledgera `SYSTEM_VKES -> HUB_VKES` tym samym TX,
- po udanej aktywacji TX moze zostac usuniety z `packages`,
- dalsza podroz paczki nie uzywa tego samego TX; `intake`, `courier`, transfery i wyplaty sa oddzielnymi operacjami finansowymi z wlasnymi `finance_tx_group_id`.

Format TX zalezy od miejsca rozpoczecia platnosci:

```text
voucher paid klienta:     TX-OHV7J-C229F886-6512
voucher paid z huba:      TX-W7K3A-C229F886-6512
                             ^     ^
                             |     unikalny techniczny sufiks TX
                             krotki kod widoczny dla czlowieka
```

- Kazdy voucher `packages.status=paid`, w tym bezposrednia przedplata VKES
  klienta, osadza wygenerowany krotki kod pomiedzy prefiksem `TX-` a
  technicznym sufiksem. Bezposrednia przedplata nie tworzy przez to drugiego
  `payment_intent`; korzysta jedynie z tego samego bezpiecznego generatora
  kodu przeznaczonego dla czlowieka.
- Dla platnosci PUSH VKES albo KES utworzonej przez Hub App krotki kod jest
  kodem powiazanego `payment_intent`.
- Dla kazdego vouchera caly rozszerzony identyfikator, np.
  `TX-OHV7J-C229F886-6512`, jest przechowywany jako
  `packages.id` oraz `tx_group_id` i laczy odpowiadajace mu wpisy
  `wallet_ledger`. Gdy istnieje `payment_intent`, ten sam identyfikator jest
  zapisany rowniez w `payment_intents.tx_group_id`.
- Finalna paczka nadana bezposrednio w hubie nadal otrzymuje techniczny
  `code4-Base64URL`; rozszerzony TX jest identyfikatorem finansowym, a nie
  zamiennikiem finalnego `packages.id`.
- Krotki fragment `TX-OHV7J` moze byc uzywany w prezentacji i przyszlym
  wyszukiwaniu. Pelny TX pozostaje wymagany wewnatrz domeny, DB i audytu.
- Na obecnym etapie nie jest wykonywana dodatkowa kontrola, czy ten sam
  `intent_code` wystepuje w innym pozostajacym voucherze. Pelne TX nadal sa
  rozne; ewentualny wynik wyszukiwania po samym krotkim kodzie moze pokazac
  kilka pozycji do wyboru pracownika.
- `CreatePaymentIntentCommand` ma jawna flage
  `include_intent_code_in_tx_group`. Domyslnie jest ona wylaczona, a Hub App
  wlacza ja dla swoich platnosci KES i VKES. W przyszlosci polityka moze
  zostac rozdzielona per metoda, np. wlaczona tylko dla PUSH VKES, bez zmiany
  parsera TX ani danych historycznych. Bezposrednia przedplata klienta nie
  tworzy intenta, dlatego korzysta z dedykowanego generatora identyfikatora
  vouchera o tym samym formacie.

`TMP-.../created` jako kompletny szkic:

- `created` jest kompletnym szablonem danych paczki.
- Wczytanie `created` w TUI przez `Enter` odczytuje dane, zapisuje autora
  formularza i usuwa rekord `TMP` w tej samej transakcji.
- Po nadaniu z takiego szablonu system generuje nowy finalny `package_id`.
- Formularz jest dalej zwyklym formularzem i moze zostac anulowany albo
  nadany; zrodlowy TMP nie jest juz potrzebny.
- `created` nie oznacza, ze paczka jest oplacona. Przedplata jest reprezentowana przez `TX.../paid`.

Scenariusz firmowego zwrotu paczki:

- Mechanizm przedplaconej paczki w `client_app` moze sluzyc do przygotowania zwrotu za klienta.
- Firma moze oplacic i przygotowac formularz zwrotny, jezeli zna:
  - hub, z ktorego klient ma nadac paczke,
  - ID nadawcy albo dane potrzebne do formularza,
  - dane odbiorcy i parametry paczki.
- Po oplaceniu VKES system tworzy `TX.../paid`.
- Firma moze przekazac klientowi sam numer TX.
- Klient przynosi paczke do huba i podaje TX; hub wyszukuje `TX.../paid`, widzi informacje o przedplaconej paczce i aktywuje finalna paczke bez ponownego pobierania platnosci.
- Ten sam formularz zwrotny moze byc tez nieoplacony: wtedy zapis jest `TMP-.../local`, a hub pobiera KES/VKES przy fizycznym nadaniu.
- Funkcja jest celowa, bo pozwala firmom generowac proste zwroty bez skanowania QR i bez wypelniania danych przez klienta w hubie.

Kasowanie szkicow/voucherow:

- Wczytanie dowolnego `TMP-...` (`local`, `global` albo `created`) w Hub API
  lub TUI jest atomowym skonsumowaniem szkicu. Rekord znika z `packages`
  przed rozpoczeciem dalszego formularza.
- Formularz zachowuje dane paczki i `created_by` odczytane podczas atomowego
  wczytania, ale calkowicie zapomina identyfikator TMP. Finalizacja nie zna
  numeru TMP, nie wyszukuje go w DB i nie moze zostac zablokowana przez nowy
  szkic, ktory w przyszlosci otrzyma taki sam numer.
- `source_package_id` jest transportowany dalej tylko dla `TX.../paid`, bo
  voucher TX celowo istnieje w DB az do skutecznej aktywacji.
- Po udanym wczytaniu pozniejszy blad nadania nie odtwarza TMP; operator
  moze anulowac albo poprawic zwykly formularz i rozpoczac nowe nadanie.
- `TX.../paid` jest kasowany automatycznie z `packages` dopiero po skutecznej aktywacji do finalnej paczki.
- `TMP-...` i `TX-.../paid` nie powinny tworzyc wpisow w `package_events`.
- `package_events` jest append-only. Nie wolno kasowac wpisow `package_events` przy kasowaniu szkicu lub vouchera. Jezeli w przyszlosci szkic bedzie mial event audytowy, trzeba dopisac event anulowania, a nie usuwac stare wpisy.

Anulowanie z `client_app`:

- Klient moze anulowac paczke widoczna w historii, jezeli jest wpisany jako `sender_code` albo `receiver_code`.
- Istnienie `packages.created_by` nie nadaje samo w sobie prawa anulowania.
  Uprawnienie nadal wynika z zasad widocznosci nadawcy i odbiorcy w panelu
  klienta; autor sluzy do audytu pochodzenia rekordu.
- Dla `TMP-.../local`, `TMP-.../global` i `TMP-.../created` anulowanie usuwa tylko wpis z `packages`.
- Anulowanie TMP nie kasuje `package_events` i nie tworzy wpisow w `wallet_ledger`, bo szkic nie jest jeszcze finansowym zdarzeniem.
- Dla `TX.../paid` anulowanie najpierw wykonuje zwrot VKES z `VKES_SYSTEM_OPERATING` na to samo konto, z ktorego wykonano oryginalna przedplate.
- Zwrot uzywa tego samego `tx_group_id` co przedplata oraz oddzielnego eventu ledger `parcel_prepaid_refund_*`.
- Przy zwrocie `actor_id=SYSTEM_RUNTIME`, bo przelew wychodzi z konta systemowego.
- Osoba, ktora kliknela anulowanie w `client_app`, jest zapisana w `wallet_ledger.metadata_json` jako `cancelled_by_person_id` oraz `cancelled_by_client_id`.
- Nie wolno sugerowac w ledger, ze klient ma bezposrednie uprawnienia do `VKES_SYSTEM_OPERATING`.
- Dopiero po skutecznym zwrocie system usuwa `TX.../paid` z `packages`.
- Jezeli zwrot sie nie powiedzie, `TX.../paid` zostaje w `packages`, zeby nie zgubic dowodu przedplaty.
- Jezeli refund zostal juz zapisany w ledger, a wpis `TX.../paid` nadal istnieje, kolejne anulowanie nie robi drugiego refundu; usuwa tylko pozostaly wpis `packages`.
- Utworzenie `TX.../paid` i pobranie VKES musi byc atomowe: zapis `packages` oraz wpisy `wallet_ledger` sa wykonywane w jednej transakcji DB.
- Anulowanie `TX.../paid` i refund tez musza byc atomowe: sprawdzenie statusu, sprawdzenie braku refundu, wpisy ledger oraz usuniecie vouchera z `packages` sa wykonywane pod jednym lockiem zapisu.
- Zmiany statusu `payment_intents` musza uzywac warunkowego `UPDATE ... WHERE status = poprzedni_status`; brak zmienionego wiersza oznacza konflikt wspolbieznosci i rollback.

Wyszukiwanie i obsluga TMP/TX w Hub App:

- `GET /hub-api/packages/search` laczy finalne `code4`, szkice `TMP-...`
  oraz vouchery `TX-.../paid`, ale filtruje rekordy po hubie aktywnej
  sesji pracownika.
- `local`, `created` i `paid` sa widoczne tylko w swoim hubie startowym;
  `global` jest widoczny we wszystkich hubach.
- Odpowiedz podaje jawnie `kind=final|tmp|paid_tx`, pelny
  `package_id`, prezentacyjny `display_code`, `status`, hub startowy i
  `db_ts`. Frontend nie odgaduje typu rekordu z samego tekstu.
- Dla `TX-OHV7J-C229F886-6512` interfejs moze pokazac `TX-OHV7J`, ale
  endpointy szczegolow, wczytania, aktywacji i refundu zawsze otrzymuja
  pelny identyfikator.
- Karta TMP/TX ma format karty paczki, ale nie pokazuje
  `package_events` ani ledgera. Samo wyszukanie i otwarcie karty jest
  tylko odczytem.
- `POST /hub-api/packages/load` atomowo odczytuje i usuwa dowolny `TMP`;
  `TX/paid` pozostaje voucherem do chwili aktywacji albo refundu.
- Wczytany `TX/paid` przekazuje do formularza
  `payment_method=PAID` i pelny `prepaid_package_id`. Pola trasy, stron,
  gabarytow, zawartosci, odbioru i ceny sa zablokowane.
- Aktywacja `PAID` uzywa kanonicznego `SubmitParcelCommand`; nie tworzy
  nowego payment intent i nie pobiera drugi raz pieniedzy. Cena
  autorytatywna pochodzi z `packages.initial_value` vouchera, a nie z
  aktualnego cennika, co chroni poprawnie oplacony voucher po zmianie cen.
- `POST /hub-api/packages/cancel` usuwa TMP bez dodatkowej flagi
  finansowej. Dla `TX/paid` wymaga `can_transfer=1` na
  `VKES_<HUB>_OPERATING`.
- Refund TX, jego kontrola idempotencji i usuniecie vouchera sa jedna
  transakcja. Aktorem wpisow ledger jest `SYSTEM_RUNTIME`, natomiast
  inicjujacy `staff_id` i hub sa zapisane w metadanych audytowych.
- Jawne przyciski wczytania, usuniecia i refundu nie otwieraja drugiego
  pytania potwierdzajacego. Karta znika dopiero po potwierdzonym commicie.
- Docelowa korekta rzeczywistych gabarytow `TX/paid` wymaga osobnej
  procedury doplaty albo zwrotu roznicy. Do jej wdrozenia voucher pozostaje
  niemodyfikowalny.

### 31.4 Central staff i operatorzy systemowi

Central staff jest definiowany w `hub_manifest.yaml` w sekcji `central_staff`.

Obecne role:

- `BOSS`,
- `CEO`,
- `COO`,
- `CFO`.

Synchronizacja manifestu zapisuje te osoby jako:

```text
hub_staff.hub_name = SYSTEM
hub_staff.staff_id = BOSS/CEO/COO/CFO
hub_staff.person_id = persons.person_id
```

Nie ma osobnej tabeli `system_users` jako glownego modelu ludzi systemowych. Central staff to role w technicznym hubie `SYSTEM` powiazane z `persons`.

Format wpisu central staff w manifescie:

```yaml
central_staff:
- role: BOSS
  staff_id: BOSS
  person_id: PDOBBC
  staff_name: Darek
  staff_surname: Osypowicz
  staff_phone: '+48797585888'
  staff_email: osypowicz@gmail.com
  staff_address: High Street 23 Poland
  pin: '1111'
  is_active: true
```

Zasady:

- `role` okresla role biznesowa/systemowa.
- `staff_id` okresla login/alias operacyjny uzywany w TUI i ledgerze.
- `person_id` wskazuje rekord osoby w `persons`.
- Dla operatorow centralnych `staff_id` moze byc taki sam jak `role`, np. `BOSS`.
- Stare pole `id` nie jest akceptowane w aktualnym formacie manifestu.

### 31.4A Synchronizacja `hub_manifest.yaml` z `persons` i `hub_staff`

`hub_manifest.yaml` jest zrodlem prawdy dla personelu operacyjnego, wlascicieli hubow i central staff. Synchronizacja jest jednokierunkowa dla danych personalnych z manifestu do DB, ale gdy manifest ma puste pola przy znanym `person_id`, system moze uzupelnic brakujace informacje z DB przy normalizacji manifestu.

Wpis ownera huba:

```yaml
owner:
  staff_id: OAAUFAH
  person_id: PGNBAD
  owner_name: Grace
  owner_surname: Njeri
  pin: AA4
  owner_phone: '+254730000001'
  owner_email: grace.njeri@owner.example
  owner_address: Nairobi, Kenya
```

Wpis staff huba:

```yaml
staff:
  managers:
  - staff_id: MAAAHAT
    person_id: PAHBAX
    staff_name: Amina
    staff_surname: Hassan
    pin: AA1
    staff_phone: '+254700000001'
    staff_email: amina.hassan@staff.example
```

Dla `managers`, `workers` i `couriers` nie zapisujemy `role` w pojedynczym wpisie. Rola wynika z sekcji manifestu, w ktorej wpis sie znajduje. Backend wewnetrznie mapuje sekcje na `hub_staff.role`.

Minimalne dane dla nowej osoby w manifescie:

- `staff_name`,
- `staff_surname`,
- `pin`,
- sekcja/rola, w ktorej osoba jest wpisana (`central_staff`, `owner`, `managers`, `workers`, `couriers`).

Jezeli nowa osoba nie ma `staff_id` i `person_id`, synchronizacja generuje oba pola i dopisuje je do manifestu. Od tego momentu identyfikatory sa stale i nie powinny byc recznie zmieniane bez swiadomej migracji.

Jezeli dopisujemy nowa role dla osoby, ktora juz istnieje:

- podajemy istniejacy `person_id`,
- `staff_id` moze byc pusty,
- synchronizacja wygeneruje tylko nowy `staff_id`,
- nie powstanie drugi rekord w `persons`.

Jezeli `person_id` powtorzy sie w kilku wpisach manifestu, oznacza to te sama osobe z wieloma aliasami/rolami. System tworzy jeden rekord w `persons` oraz wiele rekordow `hub_staff`, po jednym na kazdy `staff_id`.

Jezeli `staff_id` powtorzy sie w manifestu, jest to blad blokujacy. `staff_id` jest globalnie unikalny, bo okresla konkretny login/alias operacyjny.

Wymagania walidacyjne:

- `staff_id` musi pasowac do roli i huba: `O<hub>...`, `M<hub>...`, `W<hub>...`, `C<hub>...`; central staff moze miec identyfikatory typu `BOSS`, `CEO`, `COO`, `CFO`,
- `person_id` musi miec format profilu osoby z checksum, np. `PDOBBC`,
- `staff_id` musi przejsc walidacje RFC4648/checksum tam, gdzie dotyczy huba,
- telefon i email, jezeli podane, musza przejsc centralna normalizacje,
- brak telefonu/emaila/adresu jest ostrzezeniem, nie zawsze bledem blokujacym,
- niepoprawny telefon/email/checksum/duplikat `staff_id` jest bledem synchronizacji.

Aktualny manifest nie utrzymuje kompatybilnosci ze starym polem `id`. Wszystkie wpisy ludzi musza uzywac `staff_id` i `person_id`.

### 31.5 Konta finansowe `wallet_accounts`

`wallet_accounts` opisuje konto, ale nie przechowuje salda.

Najwazniejsze pola:

- `account_id` - jawny numer konta,
- `owner_person_id` - osoba odpowiedzialna/wlasciciel konta tam, gdzie dotyczy,
- `account_scope_type` - prosta kategoria konta: `person`, `business`, `staff`, `hub` albo `system`,
- alias konta jest wyliczany z `account_id`; standardowo `MAIN`, dla konta pracownika moze byc np. jego `staff_id`,
- `currency` - `VKES` albo `KES`,
- `custody_mode` - `custodial`, `non-custodial`, `system_shared`,
- `require_incoming_approval` - czy konto wymaga potwierdzania przychodzacych platnosci,
- `is_archived` - historyczna nazwa kolumny; obecnie stan blokady konta (`account_freeze_state`).

`wallet_accounts.is_archived` nie jest juz traktowane jako proste boolean archiwum:

```text
0 = konto aktywne
1 = konto zamrozone przez wlasciciela
2 = konto zamrozone przez system/admina
```

Zasady blokady:

- zwykle listy operacyjne i resolvery uzywaja tylko kont `is_archived=0`,
- konto prywatne `is_archived=1` moze zostac zamrozone lub odblokowane przez wlasciciela suwakiem `Stan` w zakladce `Konta`,
- konto biznesowe moze zostac zamrozone lub odblokowane przez osobe z aktywnym wpisem `wallet_account_access.can_manage_access=1` dla tego konta; samo `can_view` albo `can_transfer` nie wystarcza,
- konto `is_archived=2` moze zostac odblokowane tylko przez system/admina,
- konto `staff` architektonicznie nie obsluguje prywatnego zamrozenia `1`; dla staff przewidziane sa tylko `0` i `2`,
- zamrozone konto nie moze wykonac przelewu, przyjac przelewu ani uczestniczyc w push/payment intent,
- jezeli zamrazane konto bylo `is_default=1`, operacja zamrozenia przenosi default na inne aktywne konto tej samej osoby i waluty; jezeli nie ma innego aktywnego konta, default nie jest przenoszony. Naprawa przy odczycie kont pozostaje drugim mechanizmem kontrolnym.

`require_incoming_approval` blokuje zwykly przychodzacy przelew na konto i wymusza uzycie procesu payment intent/push. Nie dotyczy kont `MAIN`, kont systemowych ani hubowych. Nie blokuje rowniez zasilenia miedzy kontami tego samego wlasciciela. W panelu klienta aktywna blokada jest oznaczona ikona `⊘` przy nazwie konta.

W `client_app` wlasciciel zmienia te flage w `Ustawienia -> Konta -> Akceptacja przelewow`. Wiersz ma taki sam suwak jak `Stan`. Zmiana jest wykonywana przez `POST /client-api/accounts/incoming-approval` i jest dozwolona tylko dla wlasnego konta `account_scope_type=person`, ktore nie jest kontem `MAIN`. Konta staff, hub, system oraz konta udostepnione sa tylko do odczytu w tym miejscu i nie dostaja suwaka.

Zamrozenie konta nie odbiera prawa `can_view`. Zamrozone konto pozostaje widoczne wlascicielowi, a jego karta moze zostac kliknieta jako filtr historii. Historia jest dostepna zarowno po wybraniu konkretnego konta, jak i w zbiorczym widoku historii wszystkich kont. Taki wybor nie czyni zamrozonego konta kontem zrodlowym: przelewy, platnosci i oplacenie paczki nadal korzystaja wylacznie z kont z `is_archived=0`. `is_archived=1` albo `2` blokuje operacje finansowe, lecz nie ukrywa istniejacych wpisow ledgera.

`owner_id` i fizyczne `account_name` nie sa juz zrodlem prawdy w nowym modelu. Nowe przeplywy powinny uzywac `owner_person_id`, `account_scope_type`, `account_id` i waluty.

`account_scope_type` nie przechowuje identyfikatora i nie przyjmuje wartosci takich jak `staff_MAAAHAT`, `hub_AA` ani `system_SYSTEM_VKES`. Konkretne konto jest rozpoznawane nastepujaco:

- `person` i `business`: profil wynika z `owner_person_id`,
- `staff`: alias wynika z pelnego `account_id`, a powiazanie ze stanowiskiem z `hub_staff.payout_account_id`,
- `hub` i `system`: tozsamosc wynika z pelnego operacyjnego `account_id`.

Publiczny skrot adresata zawierajacy samo `person_id` moze rozwiazac tylko aktywne konto `person` albo `business`. Nie moze przypadkiem wybrac konta `staff`, `hub` ani `system`, nawet jezeli to samo `owner_person_id` jest osoba odpowiedzialna za takie konto. Konta operacyjne wymagaja pelnego `account_id`.

Rozpoznawanie adresu przelewu nie ogranicza uprawnien. Dostep wlasciciela, pracownika, BOSS-a albo innej osoby do dowolnego konta jest nadal wyliczany wylacznie z aktywnego wpisu `wallet_account_access` (bezposrednio po `person_id` albo przez mapowanie aktywnego `staff_id -> person_id`).

Konta systemowe i hubowe sa rozpoznawane po pelnym `account_id`, np. `KES_SYSTEM_OPERATING`, `VKES_SYSTEM_MINT`, `KES_AA_OPERATING`.
Nie maja aliasu `MAIN`. Poniewaz ich `account_id` nie zawiera separatora aliasu `-`, nazwa prezentowana i adres przelewu pozostaja pelnym `account_id`.

Panel klienta pokazuje konta jako karty:

- najpierw konta wlasne `account_scope_type='person'`,
- potem konta `staff`,
- potem konta podlaczone/dostepowe,
- karty maja trzy stonowane odcienie szarosci zalezne od typu konta,
- zamrozone konta maja ciemnoczerwone przytlumione tlo i nie sa operacyjne,
- tylko wlasne aktywne konta `scope=person` moga byc przeciagane w celu ustawienia `is_default`,
- konta `staff`, `business`, konta dostepowe oraz zamrozone nie moga byc ustawione jako default.

### 31.6 Nazewnictwo kont

Konta osobowe:

```text
PJOA7K-MAIN
PJOA7K-MAAJOAV
```

Zasada:

- `PJOA7K` bez aliasu kieruje na `PJOA7K-MAIN`,
- `PJOA7K:MAIN` kieruje na alias `MAIN`,
- `PJOA7K-MAAJOAV` jest kontem aliasowym roli/staff huba,
- `staff_id` nie jest juz samodzielnym numerem konta; jest aliasem/rola, ktora wskazuje konto osoby.

Konta hubowe:

```text
KES_AA_OPERATING
VKES_AA_OPERATING
```

Konta systemowe:

```text
VKES_SYSTEM_MINT
VKES_SYSTEM_OPERATING
KES_SYSTEM_OPERATING
```

Konta hubowe i systemowe sa jawne, bez aliasu `MAIN`. To odroznia je od prywatnych kont osob.

### 31.7 `wallet_account_access` jako zrodlo uprawnien

Kazde uzycie konta wymaga wpisu w `wallet_account_access`.

Jeden wiersz = jeden aktor + jedno konto + jedna rola dostepu.

Przykladowe uprawnienia:

- `can_view` - podglad konta,
- `can_transfer` - przelew VKES,
- `can_cash_in` - dodanie/generowanie KES w hubie,
- `can_cash_out` - wyplata/spalenie KES z huba,
- `can_mint` - kreacja VKES z `VKES_SYSTEM_MINT`,
- `can_manage_access` - zarzadzanie dostepami.

Dostep nie wynika z samej nazwy konta. Nazwa konta pomaga czlowiekowi i resolverowi, ale prawdziwa druga warstwa zabezpieczen jest w `wallet_account_access`.

### 31.8 Saldo i ledger

Saldo konta wynika tylko z `wallet_ledger`.

Zasady:

- `wallet_accounts` nie przechowuje salda,
- pusta historia ledger oznacza saldo 0,
- kazdy wpis finansowy ma `account_id`, `currency`, `amount`, `event_key`, `tx_group_id`, `actor_id`/metadata,
- `tx_group_id` laczy wpisy jednej operacji,
- wpisy debit/credit powinny byc atomowe w jednej transakcji DB.

Przyklad zwyklego przelewu VKES:

```text
A -100 VKES  event_key=transfer_debit   tx_group_id=TX...
B +100 VKES  event_key=transfer_credit  tx_group_id=TX...
```

Przyklad emisji VKES:

```text
VKES_SYSTEM_MINT       +1000 VKES  event_key=mint_create          tx_group_id=TX_MINT
VKES_SYSTEM_MINT       -1000 VKES  event_key=mint_transfer_debit  tx_group_id=TX_MINT
VKES_SYSTEM_OPERATING  +1000 VKES  event_key=mint_transfer_credit tx_group_id=TX_MINT
```

`mint_create` pokazuje moment kreacji pieniadza, a debit/credit jego przesuniecie do konta operacyjnego. Jeden TX oznacza jedna atomowa decyzje emisyjna.

### 31.9 Emisja VKES przez `3:Finanse -> I`

Emisja VKES jest jawnie przypisana do czlowieka.

Aktualny flow:

1. Operator najpierw generuje lub laduje klucz mint dla `VKES_SYSTEM_MINT` (`M`).
2. Klawisz `I` uruchamia emisje `VKES_SYSTEM_MINT -> VKES_SYSTEM_OPERATING`.
3. TUI czyta z DB operatora mint:

```text
hub_staff(SYSTEM).BOSS -> persons.person_id
```

4. Okno emisji pokazuje operatora, np.:

```text
BOSS / PDOBBC / Darek Osypowicz
```

5. Mnemonic podpisuje transakcje jako klucz konta `VKES_SYSTEM_MINT`.
6. `actor_id` operacji finansowej to operacyjny login staff, czyli `BOSS`.
7. `finance_core` blokuje mint bez `actor_id`.
8. `wallet_account_access` musi zawierac `can_mint=1` dla `actor_id` na koncie `VKES_SYSTEM_MINT`.

To oznacza, ze system nie moze anonimowo kreowac VKES. Kreacja VKES zawsze ma widocznego operatora operacyjnego (`BOSS`), a dane osobowe operatora sa dostepne przez powiazanie `hub_staff.person_id -> persons.person_id`.

### 31.10 Zwykly przelew VKES

Zwykly przelew wykonuje typowana komenda
`execute_wallet_transfer_command()`.

Warunki:

1. `from_account_id` i `to_account_id` musza wskazywac aktywne konta (`is_archived=0`).
2. Waluta kont musi pasowac do waluty przelewu.
3. Zwykly transfer `KES` jest zablokowany.
4. Jezeli konto zrodlowe jest `non-custodial`, wymagany jest podpis.
5. Jezeli konto docelowe ma `require_incoming_approval=1`, trzeba uzyc procesu payment intent/push.
6. Jezeli aktor jest podany, musi miec `can_transfer` dla konta zrodlowego.
7. Jezeli saldo po transferze spadloby ponizej 0, backend sprawdza aktywny kontrakt kredytowy.
8. Backend zapisuje ledger debit/credit atomowo.

### 31.11 KES i VKES jako osobne linie

`KES` i `VKES` nie sa tym samym typem salda.

Zasady:

- zwykly transfer `KES` jest zablokowany,
- KES sluzy do modelowania gotowki huba/systemu,
- VKES sluzy do przelewow elektronicznych,
- wymiana KES/VKES jest osobna operacja, nie zwyklym przelewem.

Dozwolone operacje KES:

- dodanie KES do huba (`execute_hub_cash_create`),
- platnosc gotowka za paczke,
- wyplata/spalenie KES,
- szybka wymiana operacyjna KES -> VKES.

### 31.12 Dodanie KES do huba

Funkcja: `execute_hub_cash_create`.

Znaczenie biznesowe:

- owner huba deklaruje/dodaje gotowke KES do kasy huba,
- jest to zewnetrzny doplyw gotowki,
- tworzy jeden wpis dodatni w ledger na koncie `KES_AA_OPERATING`.

Warunki:

- aktor musi miec `can_cash_in=1` dla konta KES huba,
- konto huba musi byc aktywne,
- kwota musi byc dodatnia.

Ledger:

```text
KES_AA_OPERATING +kwota KES event_key=hub_cash_create from_owner=EXTERNAL_CASH
```

### 31.13 Szybka operacyjna wymiana huba KES -> VKES

Funkcja: `execute_hub_cash_to_vkes`.

Jest to uproszczona/testowa procedura zamiast fizycznego procesu transferu gotowki. Docelowo fizyczny proces moze miec statusy i kolejke, ale szybka procedura pozostaje przydatna operacyjnie.

Warunki:

- hub ma aktywne `KES_AA_OPERATING`,
- hub ma aktywne `VKES_AA_OPERATING`,
- system ma aktywne `KES_SYSTEM_OPERATING`,
- system ma aktywne `VKES_SYSTEM_OPERATING`,
- hub ma wystarczajace KES,
- system ma wystarczajace VKES,
- aktor ma `can_cash_out=1` dla konta KES huba.

Ledger w jednym `tx_group_id`:

```text
KES_AA_OPERATING       -kwota KES   event_key=hub_cash_to_system_debit
KES_SYSTEM_OPERATING   +kwota KES   event_key=system_cash_credit
VKES_SYSTEM_OPERATING  -kwota VKES  event_key=system_vkes_debit
VKES_AA_OPERATING      +kwota VKES  event_key=hub_vkes_credit
```

Znaczenie:

- gotowka huba przechodzi do systemu,
- system wydaje rownowartosc VKES hubowi,
- cala operacja jest widoczna jako jedna grupa transakcyjna.

### 31.14 Platnosci paczek i `payment_intents`

`payment_intents` nie jest zrodlem salda. Jest tabela procesu/zgody/push.

Rola `payment_intents`:

- przechowuje zlecenie platnosci,
- przechowuje status procesu,
- przechowuje powiazanie z nadawca/odbiorca/kontami,
- obsluguje szybkie i oczekujace powiadomienia,
- moze byc powiazane z paczka.

Saldo zawsze wynika z `wallet_ledger`.

Statusy procesu obejmuja m.in.:

- `created`,
- `awaiting_push`,
- `awaiting_offline_response`,
- `awaiting_signature`,
- `authorized`,
- `settled`,
- `rejected`,
- `cancelled`,
- `failed`.

Tryby dostarczenia:

- `online` - szybka sesja; odbiorca musi byc online przy utworzeniu,
- `waiting` - oczekujace zlecenie w kopercie; nie wymaga aktywnego czekania nadawcy.

Dla `online`:

- jesli odbiorca offline przy tworzeniu, nie tworzymy aktywnej sesji,
- jesli nadawca zniknie, proces moze zostac zakonczony statusem `failed` z
  powodem `sender_disconnected`,
- duze okno sluzy tylko do szybkiej sesji.

Dla `waiting`:

- duze okno nie jest otwierane,
- zlecenie widac w kopercie,
- odbiorca akceptuje albo odrzuca,
- nadawca moze anulowac oczekujace zlecenie,
- saldo sprawdzane jest dopiero w chwili akceptacji.

### 31.15 Non-custodial

Konto non-custodial wymaga podpisu kluczem prywatnym pochodzacym z mnemonic.

Zasady:

- backend nie dostaje mnemonic,
- backend zna public key i `key_id`,
- frontend podpisuje challenge,
- backend weryfikuje podpis,
- zwykly szybki push moze poprosic o mnemonic/podpis w momencie akceptacji,
- oczekujace `Utworz platnosc` dla non-custodial jest ograniczone, dopoki nie ma sesji `unlock wallet`.

### 31.16 Kredyt/debet

Debet nie jest flaga w `wallet_accounts`.

Debet aktywuje dopiero kontrakt i polityka:

- `wallet_credit_contracts` - umowa/kontrakt,
- `wallet_account_credit_policy` - aktywna polityka konta,
- `wallet_account_credit_state` - aktualne uzycie kredytu.

Przy przelewie ponizej zera:

1. System liczy saldo z `wallet_ledger`.
2. Jezeli po operacji saldo ma byc `< 0`, system szuka aktywnej polityki kredytowej.
3. Polityka musi miec `allow_debit=1`.
4. Polityka i kontrakt musza miec `status='active'`.
5. Zakres dat musi byc wazny.
6. System sprawdza limit kredytu.
7. Jezeli jest prowizja, ledger dopisuje pare fee w tym samym `tx_group_id`.
8. `wallet_account_credit_state` zapisuje uzycie, termin i status.

Poprawka po audycie: aktywna polityka jest filtrowana w SQL przed `LIMIT 1`, zeby nieaktywny rekord nie zaslanial aktywnego kontraktu.

### 31.17 Zaproszenia do kont

`wallet_account_invites` sluzy do nadawania dostepu do konta innej osobie.

Zasady:

- zaproszenie wskazuje osobe przez `person_id`, email albo telefon,
- jesli podany email nie pasuje do zadnej osoby, proces konczy sie bledem,
- jesli podany telefon nie pasuje do zadnej osoby, proces konczy sie bledem,
- nie wolno po cichu przeskakiwac z niepasujacego emaila na telefon i zaprosic innej osoby,
- po akceptacji powstaje osobny wpis `wallet_account_access`.

Dla kont non-custodial w v1 blokujemy zaproszenie z `can_transfer`, bo samo nadanie dostepu w DB nie daje klucza prywatnego posiadacza.

### 31.18 Brak kompatybilnosci starej bazy

Po `acc_task` przyjmujemy nowy model i pusta baze.

Nie utrzymujemy:

- `wallet_owners` jako zrodla prawdy,
- `system_users` jako glownej tabeli ludzi systemowych,
- starych kont `ACC-*`,
- starych kont opartych bezposrednio na `staff_id` jako numerze konta,
- cichych backfilli ledger/payment intent,
- cichego dopisywania kolumn `persons` do starego schematu,
- dev fallback secret dla JWT/HMAC.

Jezeli baza jest stara albo niepelna, system powinien dac jawny blad. Latwiej wykryc problem przy starcie niz ukrywac go przez automatyczne naprawy, ktore moglyby stworzyc niespojny ledger.

### 31.19 Co jest widoczne w audycie finansowym

Dla kazdej operacji finansowej powinno byc mozliwe ustalenie:

- kto byl aktorem (`actor_id`: `staff_id` dla TUI, `person_id` dla `client_app`, `SYSTEM_RUNTIME` dla automatu),
- z jakiego konta wyszly srodki (`from_account_id`),
- na jakie konto weszly srodki (`to_account_id`),
- jaka byla waluta,
- jaka byla kwota,
- jaki byl `event_key`,
- jaki byl `tx_group_id`,
- czy operacja byla powiazana z paczka (`package_id`) albo payment intent (`intent_id`),
- czy wpisy debit/credit sumuja sie logicznie.

Dla mint dodatkowo musi byc widoczny osobny moment kreacji (`mint_create`) oraz operator z `can_mint`.

### 31.20 Automatyczne korekty i inicjalizacja w `client_api`

W `client_api` istnieja trzy mechanizmy, ktore moga wykonac akcje pomocnicze poza typowa komenda zapisu.

1. `GET /client-api/accounts` moze wykonac `_repair_person_default_accounts`.
   - Cel: jezeli konto domyslne osoby zostalo zamrozone (`is_archived != 0`), panel przy odczycie kont przenosi `is_default` na inne aktywne konto tej samej osoby i waluty.
   - Decyzja: to jest poprawne i moze zostac jako drugi mechanizm zabezpieczajacy.
   - Docelowo glowna zmiana defaultu powinna dziac sie w funkcji, ktora zamraza konto, ale odczyt kont moze nadal naprawiac reczne zmiany DB albo niespojny stan po awarii.

2. `GET /client-api/auth/me` oraz `POST /client-api/auth/login` moga wykonac `_unlock_adult_guardian_access_if_needed`.
   - Cel: jezeli konto dziecka ma juz wiek 18+ na podstawie `persons.date_of_birth`, system usuwa `guardian_person_id` i dezaktywuje dostepy `access_role='guardian'` w `wallet_account_access`.
   - Decyzja: zostawiamy to jako drugi check wykonywany przy logowaniu/profilu, bo wiek powinien byc sprawdzany w momencie uzycia konta.
   - Mechanizm nie powinien tworzyc nowych kont ani zmieniac sald.

3. `@app.before_request` dla `/client-api/*` wykonuje `_ensure_client_api_schema`.
   - Cel: upewnic sie, ze wymagany schemat client API/finansow istnieje przed obsluga requestu.
   - Technicznie moze to zmienic DB przez inicjalizacje schematu albo dopisanie brakujacych elementow struktury.
   - Decyzja: ten punkt wymaga uwagi. W modelu pustej, jawnie przygotowanej bazy nie chcemy ukrytych migracji podczas zwyklego requestu.
   - Docelowo inicjalizacja schematu powinna byc jawna przy starcie albo w osobnej komendzie migracyjnej, a request powinien co najwyzej zwrocic czytelny blad brakujacego schematu.

### 31.21 Domyslny hub i rekomendacja trasy w `client_app`

`persons.default_hub` jest preferencja osoby albo profilu biznesowego. Nie jest obowiazkowym hubem, nie wybiera trasy bez decyzji uzytkownika i nie jest automatycznie zapisywany do paczki.

Hub poczatkowy:

- przy tworzeniu paczki panel odczytuje `default_hub` zalogowanego profilu,
- jezeli hub istnieje i jest dostepny, zostaje przesuniety na pierwsza pozycje listy hubow poczatkowych,
- rekomendowany hub jest stale oznaczony niebieskim tekstem w stylu tagu `Koperta`, a po najechaniu reaguje takim samym mocniejszym odcieniem jak pozostale aktywne przyciski,
- uzytkownik nadal moze wybrac dowolny inny hub,
- rekomendacja nie dotyczy automatycznie listy hubow docelowych.

Hub docelowy odbiorcy:

- rekomendacja powstaje dopiero po poprawnym rozpoznaniu istniejacego odbiorcy przez `person_id` oraz po podaniu jego adresu dostawy,
- backend zwraca wtedy prywatny `default_hub` odbiorcy, a frontend przesuwa go na pierwsza pozycje listy hubow docelowych,
- rekomendowany hub docelowy ma ten sam niebieski wyglad i reakcje hover co rekomendowany hub poczatkowy,
- przy recznie wpisanym, nierozpoznanym odbiorcy rekomendacja nie jest tworzona,
- jezeli odbiorca zostanie zmieniony, wyczyszczony albo jego weryfikacja nie powiedzie sie, poprzednia rekomendacja musi zostac usunieta,
- poniewaz dane odbiorcy sa uzupelniane po wyborze trasy, rekomendacja moze byc widoczna przy powrocie do korekty huba docelowego,
- samo wskazanie rekomendacji nie nadpisuje huba juz wybranego przez uzytkownika.

Stan formularza:

- `receiverDefaultHub` jest czescia roboczego szkicu formularza przechowywanego w pamieci przegladarki,
- przejscie do Finansow i powrot do budowania paczki nie powinno kasowac tej rekomendacji ani pozostalych danych szkicu,
- rekomendacja staje sie czescia paczki dopiero wtedy, gdy uzytkownik jawnie wybierze ten hub jako start albo cel.

Prywatnosc:

- publiczna podpowiedz weryfikacyjna odbiorcy nie ujawnia `default_hub`,
- pole moze zostac zwrocone dopiero w pelnym prywatnym payloadzie: dla wlasnego profilu albo po poprawnej weryfikacji odbiorcy zgodnie z konfiguracja,
- `default_hub` mozna zmienic w ustawieniach profilu, ale zmiana nie modyfikuje istniejacych paczek.

### 31.22 Ustawienia profilu, kont i dostepow w `client_app`

Wejscie do ustawien znajduje sie pod ikona kola zebatego w gornym pasku panelu. ID profilu pozostaje widoczne, ale nie jest edytowalne.

Zakladki ustawien:

1. `Profil`
   - zmiana danych osoby albo firmy,
   - zmiana nazwy wyswietlanej firmy bez zmiany jej stalego ID,
   - zmiana telefonu, emaila, adresu i `default_hub` zgodnie z walidacja backendu,
   - zapis przez `POST /client-api/profile`.

2. `Bezpieczenstwo`
   - zmiana hasla aktualnie zalogowanego profilu,
   - operacja nie zmienia `person_id`, `business_id` ani identyfikatorow kont.

3. `Konta`
   - podglad wlasciwosci posiadanych i udostepnionych kont,
   - miejsce pod przyszle ustawienia zamrozenia, limitow, potwierdzania wplat i powiadomien,
   - zaznaczenie aktywnej karty konta nie jest tym samym co `wallet_accounts.is_default`.

4. `Widok`
   - ustawienia sa przechowywane w `persons.ui_settings_json`,
   - JSON dotyczy tylko prezentacji i wygody obslugi; nie przechowuje sald, uprawnien ani blokad kont,
   - zapis i odczyt odbywa sie przez `/client-api/ui-settings`,
   - backend akceptuje tylko jawna liste kluczy i wartosci.

5. `Dostepy`
   - lista osob i rol majacych aktywny wpis w `wallet_account_access`,
   - obsluga zaproszen do konta,
   - nadawanie i aktualizacja uprawnien `can_view`, `can_transfer`, `can_cash_in`, `can_cash_out` i `can_manage_access`,
   - cofniecie dostepu dezaktywuje odpowiedni wpis dostepowy,
   - wlasciciel albo wlasny dostep bazowy nie moze zostac przypadkowo zmieniony ani odebrany z tego panelu.

Panel ustawien jest warstwa UI. Wszystkie zmiany danych i uprawnien musza byc ponownie walidowane przez Client API; frontend nie jest zrodlem uprawnien ani zrodlem prawdy o profilu.

### 31.23 `persons.ui_settings_json`

Domyslna wartosc kolumny to pusty obiekt JSON `{}`. Wartosci domyslne sa definiowane w `config.yaml` jako `system_settings.client_ui_defaults_json` i podczas synchronizacji konfiguracji trafiaja do `app_settings`. Client API przy odczycie naklada zapisane ustawienia osoby na te wartosci domyslne. Wbudowane wartosci backendu i frontendu sa tylko zabezpieczeniem na wypadek braku albo uszkodzenia konfiguracji.

`persons.ui_settings_json` przechowuje wylacznie ustawienia rozniace sie od aktualnych wartosci domyslnych. Zapis formularza usuwa z JSON klucze rowne konfiguracji. Przycisk `Przywroc ustawienia domyslne` zapisuje dokladnie `{}`, dlatego dalsze zmiany domyslnych w `config.yaml` automatycznie obejmuja taki profil bez przepisywania tabeli `persons`.

Obslugiwane ustawienia:

- `hide_balances` - ukrywa salda na kartach kont i w kolumnie salda historii,
- `account_alias_shortcuts` - wlacza skrot `:ALIAS` (np. `:MAIN` albo `:CAACWA2`); frontend moze rozwinac wylacznie taki zapis do `PERSON_ID:ALIAS` zalogowanego profilu, np. `:CAACWA2` do `PCWBAI:CAACWA2`, a backend rozpoznaje alias, znajduje konkretne `account_id` i nadal wykonuje pelna walidacje konta,
- frontend nie zamienia separatora `:` na `-` i nie dopisuje zalogowanego `person_id` po rozpoznaniu myslnika; `-` jest czescia pelnego technicznego `account_id`, ktory moze miec format niezalezny od `PERSON_ID-ALIAS` (szczegolnie dla kont hubowych i systemowych), dlatego taka zamiana moglaby zmienic wskazanego odbiorce albo utworzyc nieistniejacy identyfikator,
- reguly interpretacji `OWNER:ALIAS`, wyszukania konta w odpowiednim scope oraz kontroli jego aktywnosci i dostepu naleza do backendu; przegladarka nie moze zgadywac technicznego `account_id` na podstawie samego tekstu wpisanego przez uzytkownika,
- `show_account_aliases` - pokazuje aliasy kont,
- `show_full_account_ids` - pokazuje pelne identyfikatory kont,
- `show_account_scope` - pokazuje typ zakresu konta,
- `default_currency` - domyslnie otwiera `VKES` albo `KES`,
- `history_limit` - zakres czasu: tydzien, 2 tygodnie, miesiac, kwartal, pol roku, rok albo bez limitu czasu,
- `history_compact` - zmniejsza wysokosc wierszy historii,
- `lock_default_account_order` - blokuje przeciaganie prywatnych kart kont i zmiane `is_default` z poziomu kart; tryb staff wymusza te blokade niezaleznie od ustawienia osoby,
- `merge_internal_transfers` - w widoku wszystkich kont laczy pare `transfer_debit` i `transfer_credit` tego samego wewnetrznego przelewu w jeden wiersz prezentacyjny,
- `date_format` - polski format lokalny, sama data albo ISO,
- `number_format` - polski, angielski albo techniczny zapis liczb,
- `show_tx_group` - pokazuje identyfikator TX przy wpisie historii,
- `show_operational_details` - pokazuje klikalne szczegoly operacji systemowych i hubowych,
- `notification_mode` - `visual` albo `visual_sound`,
- `language` - obecnie zawsze `pl`,
- `theme` - ciemny, jasny albo wysoki kontrast,
- `start_page` - Finanse, Paczki albo Ustawienia.

`history_limit` nie jest limitem liczby rekordow. Client API filtruje `wallet_ledger.db_ts` wedlug wybranego okresu. Opcja `all` zwraca cala dostepna historie dla kont, do ktorych aktor ma `can_view`.

Scalanie przelewow wewnetrznych jest tylko formatowaniem historii. Dziala w widoku wszystkich kont i wymaga dokladnie jednej pary `transfer_debit` + `transfer_credit` z tym samym `tx_group_id`, waluta oraz przeciwnymi kwotami. Wiersz debit jest ukrywany, a pozostawiony wiersz credit pokazuje w opisie czerwone saldo konta zrodlowego sprzed operacji, kwote debit i alias konta zrodlowego, strzalke oraz zielony alias konta docelowego. Saldo sprzed operacji jest wyliczane jako `saldo_po_debit - kwota_debit`. Kolumna kwoty zachowuje zielony credit, a kolumna salda zachowuje saldo konta docelowego po operacji. Widok pojedynczego konta oraz dane `wallet_ledger` nie sa zmieniane.

Push jest obowiazkowym kanalem synchronizacji i nie moze zostac wylaczony przez `ui_settings_json`. `notification_mode` zmienia tylko sposob zwrocenia uwagi uzytkownika. W obu trybach zdarzenie jest odbierane, aktualizuje dane panelu i trafia do standardowej obslugi powiadomien.

W trybie osoby prywatnej `lock_default_account_order=true` blokuje przeciaganie kart i zmiane konta domyslnego z poziomu listy kont. Po ponownym wylaczeniu blokady osoba moze znow przeciagac wlasne, aktywne konta `scope=person`. Blokada nie zmienia aktualnej wartosci `wallet_accounts.is_default`.

W trybie staff blokada zmiany konta domyslnego jest zawsze aktywna, niezaleznie od `lock_default_account_order`. Pierwsza karta przedstawia konto `scope=staff`, ktorego alias w `account_id` odpowiada aktywnemu `staff_id` (powiazanie potwierdza `hub_staff.payout_account_id`); nastepnie wyswietlane jest prywatne konto domyslne, pozostale konta prywatne, inne konta staff i konta dostepowe. Jest to wylacznie kolejnosc prezentacji i nie aktualizuje `is_default`. Jesli osoba ma kilka aliasow staff, priorytet otrzymuje tylko alias uzyty w aktywnym trybie pracy.

Zakladka `Bezpieczenstwo` w trybie osoby zmienia haslo osoby. W aktywnym trybie staff zmienia PIN konkretnego `staff_id`: wymaga tokenu kontekstu staff, poprawnego obecnego PIN-u i nowego PIN-u niekolidujacego z PIN-em innego aktywnego pracownika tego samego huba. Operacja nie zmienia prywatnego hasla `person_id`.


### Wyjasnienie modeli kryptograficznych

---

## Co jest teraz vs. co wdrazamy

### Stan obecny — dwa poziomy zabezpieczen

Kazdy wpis w `wallet_ledger` ma teraz:

1. **`entry_hash`** — odcisk palca tresci wpisu. Hash z: `owner_id`, kwota, saldo, `seq`, waluta, `event_key`, metadata. Jesli ktos zmieni choc jeden bajt w wierszu, hash nie bedzie sie zgadzal.

2. **`hmac_signature`** — podpis systemowy. Liczony z `entry_hash + poprzedni_entry_hash`. Tworzy lancuch — zmiana jednego wpisu niszczy podpisy wszystkich kolejnych. Klucz HMAC lezy po stronie serwera (env lub `hmac_keys`).

To jest jak **lista polaczona z pieczecia** — kazde ogniwo jest polaczone z poprzednim. Wyrwanie ogniwa ze srodka jest wykrywalne.

### Co to oznacza w praktyce teraz

Jesli ktos ma dostep do bazy danych i chce sfalszowac przelew — zmienic kwote z 100 na 1000 VKES:

```
Wpis seq=42: amount=100, balance=1100
             entry_hash = sha256(... amount=100 ...)
             hmac = hmac(entry_hash_42 + entry_hash_41)
```

Jesli zmieni `amount=1000` → `entry_hash` przestaje sie zgadzac.  
Jesli poprawnie przepisze `entry_hash` → `hmac_signature` przestaje sie zgadzac.  
Jesli przepisze tez `hmac_signature` → nie moze, bo nie zna klucza HMAC.

**System jest chroniony przed zewnetrznym atakiem na baze**, ale jest jeden problem: klucz HMAC lezy na tym samym serwerze. Osoba z dostepem root do serwera ma klucz i moze przepisac wszystko.

---

## Co dodaje `wallet_signatures`

To jest **trzeci, niezalezny poziom** - podpis kryptograficzny z klucza przypisanego do konkretnego konta (`wallet_keys`).

Aktualna implementacja v1:

- podpis jest liczony per `wallet_accounts.account_id`,
- `wallet_keys.owner_id` jest nazwa legacy subjectu i zawiera `account_id`,
- `wallet_signatures` jest podpisem HMAC-SHA256 liczonym kluczem konta z `wallet_keys`,
- podpis obejmuje: `account_id|owner_id|currency|seq|entry_hash|prev_hash`,
- delegated/non-custodial z podpisem klienta bezposrednio w `wallet_signatures` to wariant przyszly, opisany nizej jako model docelowy delegacji.

```
Wpis seq=42 dla konta PJOA7K-MAIN:
  entry_hash    = "abc123..."
  hmac_signature = "def456..."   ← klucz systemowy HMAC

  + wallet_signatures:
    account_id = PJOA7K-MAIN
    seq        = 42
    key_id     = "key_001"
    signature  = hmac_sha256(key_konta, "account_id|owner_id|currency|seq|entry_hash|prev_hash")
```

Roznica:
- **HMAC** uzywa jednego klucza systemowego dla calego systemu
- **`wallet_signatures`** uzywa unikalnego klucza per konto

### Gdzie leza klucze — sedno roznicy

**Teraz (HMAC):**
```
Jeden klucz systemowy → podpisuje WSZYSTKIE wpisy
Klucz lezy w: env VKES_HMAC_KEY lub tabeli hmac_keys
```
Jesli ktos skradnie ten jeden klucz — moze sfalszowac kazda transakcje w calym systemie.

**Po wdrozeniu (`wallet_signatures`):**
```
Klucz konta PJOA7K-MAIN → podpisuje tylko wpisy tego konta
Klucz konta BCCF8R-MAIN → podpisuje tylko wpisy tego konta
Klucze leza w: wallet_keys, zaszyfrowane WALLET_KEK
```
Zeby sfalszowac transakcje konta, atakujacy musi znac klucz **tego konkretnego konta**.

### Analogia do bankowosci

To co jest teraz to jak **bank pieczetuje wszystkie dokumenty jedna pieczatka firmowa** — jesli ktos zdobedzie pieczatke, moze sfalszowac wszystko.

`wallet_signatures` to jak **kazdy dokument jest tez podpisany wlasnorecznie przez wlasciciela konta** — sfalszowanie wymaga kradziezy podpisu konkretnej osoby, nie tylko pieczatki banku.

### Co zmienia `wallet_signatures_require_key=1`

- **Teraz bez flagi:** jesli brakuje klucza konta, wpis ledgera i tak jest zapisywany (tylko bez podpisu). System dziala, ale bez trzeciej warstwy ochrony.
- **Po wlaczeniu flagi:** brak klucza konta = brak mozliwosci zapisu do ledgera = operacja finansowa jest **zablokowana**. System nie pozwoli zapisac transakcji bez kryptograficznego dowodu ze klucz konta istnial w momencie zapisu.

### Podsumowanie roznic

| Aspekt | Teraz | Po wdrozeniu |
|--------|-------|-------------|
| Wykrycie zmiany wpisu | ✅ `entry_hash` | ✅ `entry_hash` |
| Wykrycie zmiany kolejnosci | ✅ HMAC chain | ✅ HMAC chain |
| Kradziez 1 klucza kompromituje | Caly system | Tylko jedno konto |
| Non-custodial przelew bez klucza klienta | ✅ blokowany | ✅ blokowany + dowod w `wallet_signatures` |
| Dowod ze klucz konta istnial | ❌ brak | ✅ `wallet_signatures.key_id` + `signature` |
| Audyt moze potwierdzic per-wpis | HMAC tylko | HMAC + podpis konta |
| Mozliwosc operacji bez klucza konta | ✅ (cicho pomijany) | ❌ (twardy blad) |

Glowna zmiana bezpieczenstwa to przejscie od **"system zaswiadcza ze transakcja sie odbyla"** do **"konto kryptograficznie potwierdza kazdy wpis w swoim lancuchu"**. To jest roznica miedzy dziennikiem z pieczatka a dziennikiem z wlasnorecznym podpisem wlasciciela na kazdej stronie.

---

## Trzy modele custody

| Model | `custody_mode` | Kto trzyma klucz prywatny | Kto podpisuje `wallet_signatures` | Cel |
|-------|---------------|--------------------------|----------------------------------|-----|
| Custodial | `custodial` | Serwer | Klucz techniczny serwera | Wygoda, masy, niski prog wejscia |
| Non-custodial | `non-custodial` | Klient (mnemonic) | Klucz techniczny konta (serwer, KEK) | Swiadomi uzytkownicy, kontrola dostepu |
| Non-custodial + delegation | `non-custodial-delegated` | Klient (mnemonic) | Klucz techniczny serwera; klient daje osobny dowod autoryzacji | Podpisana dyspozycja i audyt niezalezny od sesji serwera |

Roznia sie **jedna kolumna** w `wallet_accounts.custody_mode` i **jedna logika** w zapisie `wallet_signatures`. Reszta kodu jest identyczna.

### Co zmienia sie w bazie dla `non-custodial-delegated`

Dla `non-custodial-delegated` tabela `wallet_keys` nadal zawiera **techniczny, zaszyfrowany KEK klucz serwera** dla `account_id`. Jest on konieczny, aby kazdy wpis `wallet_ledger` otrzymal jednolity techniczny podpis w `wallet_signatures`. Nie jest to klucz klienta i nie pozwala serwerowi udawac jego dyspozycji.

Klucz publiczny klienta jest w `wallet_account_keys`; mnemonic ani private key klienta nigdy nie trafiaja do DB. Podpis klienta oraz jego powiazanie z nonce, finalnym debit ledger i TX sa zapisywane w `wallet_transfer_challenges`. Kazdy z dostepem do bazy moze zweryfikowac autoryzacje klienta bez dostepu do `WALLET_KEK`, a jednoczesnie audit techniczny dalej sprawdza `wallet_signatures` dla obu stron wpisu.

---
## Przelew krok po kroku — porownanie modeli

### Model `custodial` (dla odniesienia)

```
Klient klika "Wyslij 100 VKES do Jana"
    ↓
POST /transfer {amount: 100, to: "PJAN...", currency: "VKES"}
Authorization: Bearer <JWT>
    ↓
Serwer sprawdza JWT → weryfikuje uprawnienia → wykonuje przelew
    ↓
Serwer podpisuje wpis ledgera swoim kluczem technicznym
    ↓
OK, done
```

Klient nie robi nic specjalnego. Jedno zadanie HTTP. Serwer ma klucz prywatny konta — podpisuje sam.

---

### Model `non-custodial`

Klient ma seed phrase (24 slowa). W przegladarce/aplikacji jest biblioteka kryptograficzna ktora z seed phrase wyprowadza klucz prywatny — **nigdy nie wychodzi poza urzadzenie**.

**Krok 1** — Klient klika "Wyslij 100 VKES do Jana"

**Krok 2** — Klient wysyla zadanie przelewu:
```
POST /transfer {amount: 100, to: "PJAN...", currency: "VKES"}
    ↓
Serwer widzi ze konto jest non-custodial
Serwer generuje nonce (losowy string, jednorazowy)
Serwer zwraca:
  {status: "signature_required", challenge: {nonce: "abc123xyz", from_account: "PJOA7K-MAIN"}}
```

**Krok 3** — Aplikacja klienta (w przegladarce):
```
message = "wallet_transfer_v1|FROM|TO|100.00|VKES|reason|actor|nonce"
podpis = ed25519_sign(klucz_prywatny, message)
```

**Krok 4** — Klient odsyla podpis:
```
POST /transfer {amount: 100, to: "PJAN...", nonce: "abc123xyz", signature: "podpis..."}
    ↓
Serwer weryfikuje: ed25519_verify(klucz_publiczny_konta, nonce, podpis) → OK
Serwer wykonuje przelew
Serwer podpisuje wpis ledgera SWOIM kluczem technicznym konta (z wallet_keys)
    ↓
OK, done
```

> **Co klient podpisuje:** canonical message z kontem zrodlowym, odbiorca, kwota, waluta, reason, actor, nonce, expiry, TX i opcjonalnym package ID.  
> **Slabosc:** podpis obejmuje dane biznesowe, ale nie finalny `entry_hash` z seq i saldem.
> **Serwer po weryfikacji:** ma klucz techniczny konta w `wallet_keys` (zaszyfrowany KEK) i sam podpisuje wpis ledgera.

---

### Model `non-custodial-delegated` — Opcja A (podpisanie zamiaru)

**Krok 1** — Klient klika "Wyslij 100 VKES do Jana"

**Krok 2** — Klient wysyla zadanie przelewu:
```
POST /transfer {amount: 100, to: "PJAN...", currency: "VKES"}
    ↓
Serwer widzi custody_mode = non-custodial-delegated
Serwer generuje nonce
Serwer zwraca challenge z danymi transakcji:
{
  status: "signature_required",
  challenge: {
    nonce: "abc123xyz",
    amount: 100,
    currency: "VKES",
    to_account: "PJAN...",
    from_account: "PJOA7K-MAIN",
    tx_group_id: "TX-...",
    expires_at: "...Z"
  }
}
```

**Krok 3** — Aplikacja klienta buduje wiadomosc do podpisu:
```
message = "wallet_transfer_intent_v3|PJOA7K-MAIN|PJAN...|100.00|VKES|reason|actor|abc123xyz|expires_at|package_id|tx_group_id"
podpis = ed25519_sign(klucz_prywatny, message)
```

**Krok 4** — Klient odsyla podpis:
```
POST /transfer {..., nonce: "abc123xyz", signature: "podpis..."}
    ↓
Serwer weryfikuje podpis z message zawierajacym from+to+amount+currency+reason+actor+nonce+expiry+package+TX
    ↓
Serwer wykonuje przelew
Serwer zapisuje techniczny `wallet_signatures` oraz dowod klienta w `wallet_transfer_challenges` (signature, key_id i linki do ledger).
    ↓
OK, done
```

> **Co klient podpisuje:** `from + to + amount + currency + reason + actor + nonce + expiry + package + TX`. Klient potwierdza konkretny zamiar.  
> **Dowod klienta:** `wallet_transfer_challenges` zawiera podpis klienta oraz linki do finalnych rekordow ledger. `wallet_signatures` pozostaje podpisem technicznym.  
> **Slabosc:** klient nie podpisuje dokladnego wpisu ledgera (`entry_hash`). Audytor musi osobno sprawdzic ze dane w `message` zgadzaja sie z danymi w wpisie ledgera.

---

### Model `non-custodial-delegated` — Opcja B (podpisanie wpisu)

**Krok 1** — Klient klika "Wyslij 100 VKES do Jana"

**Krok 2** — Klient wysyla zadanie:
```
POST /transfer {amount: 100, to: "PJAN...", currency: "VKES"}
    ↓
Serwer widzi custody_mode = non-custodial-delegated
Serwer:
  - zapisuje snapshot seq, prev_hash i balance bez blokowania DB podczas oczekiwania na podpis
  - wylicza pending_entry_hash z aktualnym seq i balance
  - generuje nonce
Serwer zwraca:
{
  status: "signature_required",
  challenge: {
    nonce: "abc123xyz",
    pending_entry_hash: "sha256_hash_calego_wpisu",
    seq: 43,
    new_balance: 1000.00,
    amount: -100,
    from_account: "PJOA7K-MAIN",
    to_account: "PJAN...",
    currency: "VKES"
  }
}
```

**Krok 3** — Aplikacja klienta:
```
- weryfikuje ze amount, to_account, currency zgadzaja sie z tym co klient chcial wyslac
- buduje message: "wallet_transfer_entry_v3|abc123xyz|expires_at|sha256_hash_calego_wpisu"
podpis = ed25519_sign(klucz_prywatny, message)
```

**Krok 4** — Klient odsyla podpis:
```
POST /transfer {..., nonce: "abc123xyz", signature: "podpis..."}
    ↓
Serwer weryfikuje podpis
Serwer sprawdza czy seq i balance nadal sie zgadzaja
Serwer wykonuje INSERT atomowo (ten sam entry_hash ktory klient podpisal)
Serwer zapisuje techniczny `wallet_signatures` oraz dowod klienta w `wallet_transfer_challenges` (signature, key_id i linki do ledger).
    ↓
OK, done
```

> **Co klient podpisuje:** `nonce + pending_entry_hash` — dokladnie ten wpis ktory trafi do ledgera, z konkretnym `seq`, `balance`, `amount`, odbiorca.  
> **Audyt jednym krokiem:** `ed25519_verify(klucz_publiczny, nonce+entry_hash, signature)` — jesli sie zgadza, klient podpisal dokladnie ten wpis.

---

## Zestawienie wszystkich modeli

| Aspekt | `non-custodial` | `delegated` Opcja A | `delegated` Opcja B |
|--------|----------------|--------------------|--------------------|
| Co klient podpisuje | from + to + amount + currency + reason + actor + nonce + expiry + TX | from + to + amount + currency + reason + actor + nonce + expiry + TX | `nonce + expiry + entry_hash` wpisu |
| Kto podpisuje `wallet_signatures` | serwer (klucz techniczny) | serwer (klucz techniczny) | serwer (klucz techniczny) |
| Audyt jednym krokiem | ❌ niemozliwy | ⚠️ czesciowy | ✅ pelny |
| Zlozonosc implementacji | niska | srednia | wysoka |
| Round-tripow HTTP | 2 | 2 | 2 |
| Stan seq w czasie podpisu | nie | nie | snapshot + stale retry |
| Klient wie co podpisuje | tak (dane biznesowe) | tak (dane biznesowe) | tak (caly wpis) |
| Serwer moze sfalszowac majac KEK | tak | nie* | nie |

> * W Opcji A audit porownuje podpisana wiadomosc z finalnymi rekordami ledger zapisanymi w `wallet_transfer_challenges`.


### Historyczna rekomendacja implementacji (wdrozona)

- **Finance_task.md v1** — obsluguje `custodial` i `non-custodial`. Wdrozyc jako pierwsza kolejnosc.
- **`non-custodial-delegated` Opcja A** — wlasciwy wybor dla v1 delegation. Prostszy, brak blokowania `seq`, klient podpisuje dane biznesowe ktore rozumie.
- **`non-custodial-delegated` Opcja B** — dla systemow obslugujacych bardzo duze kwoty lub gdy regulacje wymagaja podpisu na dokladnym wpisie ledgera.

`custody_mode` oraz `delegation_signature_mode` sa obecnie wymuszane przez schema i finance core.

### Stan wdrozenia i gwarancje delegated

- System obsluguje `custodial`, `non-custodial`, `non-custodial-delegated/intent_v1` oraz `non-custodial-delegated/entry_v2`.
- Mnemonic jest generowany lokalnie i potwierdzany przed utworzeniem konta. Backend otrzymuje tylko public key.
- Dodatkowe konto najpierw rezerwuje na serwerze jednoznaczny `owner_scope/account_index`; frontend nie przewiduje indeksu i nie skanuje innych sciezek.
- Opcja A podpisuje canonical business intent razem z nonce, expiry, TX oraz package/intent ID.
- Opcja B podpisuje `wallet_transfer_entry_v3|nonce|expires_at|pending_entry_hash`; zmiana seq, salda, prev hash, HMAC key lub payload daje `stale`.
- `wallet_transfer_challenges` przechowuje podpis klienta i finalne linki debit/credit. `wallet_signatures` nadal przechowuje niezalezny techniczny podpis serwera.
- Audit ponownie weryfikuje Ed25519 i porownuje challenge z finalnym ledgerem; nie ufa samej fladze w metadata.
- Odwolany public key natychmiast uniewaznia oczekujacy challenge.
- Prepaid A/B jest atomowy: paczka `paid`, debit, credit i zuzycie challenge sa zatwierdzane razem.
- Konta hub/staff/system nie uzywaja delegated. `VKES_SYSTEM_MINT` jest jedynym wyjatkiem i zachowuje administracyjny mnemonic w modelu `non-custodial/none`.

---

## Aktualizacja PRD: atomowosc runtime i bezpieczenstwo kanalow dostepu

Ponizsze zasady sa obowiazujacym stanem po audycie runtime, finansow, Client API i Flask Admin API. Szczegolowy raport powykonawczy oraz testy znajduja sie w `Finance_task.md`, punkt 18.

### Podroz paczki, worek i finanse jako jedna operacja

1. Wyslanie oraz przyjecie worka sa pojedynczymi operacjami biznesowymi wykonywanymi w jednym `BEGIN IMMEDIATE`.
2. Ten sam commit obejmuje stan runtime, `packages`, `package_events`, `wallet_ledger`, aktualizacje `payment_intents`, `bags`, `bag_events`, `hubs.bag_stock`, `hub_box_inventory`, `hub_asset_inventory` oraz kasowanie zuzytego worka.
3. Funkcje niskiego poziomu musza przyjac polaczenie callera. Nie wolno wykonywac wewnetrznego commitu, jezeli trwa `_runtime_db_transaction()`.
4. Blad dowolnej czesci robi rollback calosci. Runtime jest wtedy przeladowywany z DB.
5. Odroczone wpisy finansowe pozostaja na obiekcie paczki do udanego commitu. Nie wolno ich czyscic przed zatwierdzeniem DB.
6. Kazdy finansowy wpis paczki musi miec `tx_group_id` i fingerprint wskazujacy zapisany `package_events.entry_hash`.
7. Elementy jednego splitu finansowego korzystaja ze wspolnego TX; kolejne niezalezne zdarzenie dostaje nowy TX.
8. Asset nie jest zwykla paczka, ale jego oczekujacy ledger i tracking musza zostac zebrane przez snapshot.

### Jednorazowe przejscia stanow worka

1. Przejscie `LOADING -> IN_TRANSIT` jest atomowym claimem i wymaga zgodnosci `holder_id` z aktywnym `staff_id` kuriera.
2. Przejscie `IN_TRANSIT -> RECEIVED` jest atomowym claimem i rowniez wymaga zgodnosci holdera.
3. Powodzenie wymaga zmiany dokladnie jednego rekordu. Drugi rownolegly request otrzymuje konflikt/stale i nie wykonuje splitu ani wyplaty.
4. Zwolnienie lub cofniecie rezerwacji z panelu kuriera wymaga, aby aktor byl aktualnym holderem worka.
5. Kurier nie moze zmieniac stanu ani zwalniac worka innego kuriera.

### Snapshot runtime

1. Publiczne `persist_runtime_snapshot(...)` serializuje caly cykl collect -> commit -> clear jedna blokada procesu.
2. Blokada timera autosave nie jest wystarczajaca do ochrony ledgera; snapshot ma osobna blokade obejmujaca zapis.
3. Obecny runtime ma jednego aktywnego writera procesu. Wdrozenie wieloprocesowe wymaga kolejki, jednego writer service albo persystowanego claimu DB.

### Ochrona danych klienta

1. Przy `client_lookup_verification_enabled=1` znajomosc `person_id` nie daje dostepu do telefonu, e-maila ani adresu innej osoby bez poprawnych odpowiedzi.
2. Gdy `client_lookup_verification_enabled=0`, dodatkowe pytania sa pominiete, a poprawny `person_id` pozwala uzupelnic formularz danymi osoby.
3. Przy aktywnej weryfikacji przed jej zakonczeniem mozna pokazac tylko ograniczony publiczny hint.
4. Challenge jest powiazany z zalogowanym requesterem, ma TTL i przechowuje hash odpowiedzi zamiast odpowiedzi jawnej.
5. Bledne odpowiedzi sa limitowane przez persystowana tabele `auth_login_attempts`.
6. Tryb `0` jest ustawieniem POC i ujawnia dane kazdemu zalogowanemu klientowi znajacemu `person_id`; przed produkcja nalezy uzyc trybu `1`, silniejszej zgody/push albo ograniczenia zakresu danych.

### Cash-out klienta

1. Pracownik huba nie moze obciazyc konta VKES klienta tylko na podstawie swojego `can_cash_out` do KES huba.
2. Cash-out wymaga `payment_intent` typu `cash_out` w statusie `authorized`.
3. Intent musi zgadzac sie co do kwoty, payer account, payee account, waluty, metody i huba.
4. Debit VKES klienta, credit VKES huba, burn KES huba i `authorized -> settled` sa zatwierdzane atomowo.
5. Warunkowa zmiana statusu intenta zabezpiecza przed jego podwojnym uzyciem.

### Sekrety JWT i Flask Admin

1. `CLIENT_API_TOKEN_SECRET` jest obowiazkowy, ma minimum 32 bajty i nie moze byc identyczny z `VKES_HMAC_KEY`.
2. Nie istnieje fallback JWT do klucza HMAC ledgera.
3. Wszystkie metody `/api/*` Flask Admin, takze `GET`, podlegaja ochronie middleware.
4. Zdalny lub proxied Flask Admin wymaga `FLASK_ADMIN_API_TOKEN` przekazanego jako `X-Admin-Token` albo Bearer.
5. Bez tokenu dozwolony jest tylko bezposredni loopback. Przy reverse proxy token admina jest obowiazkowy.

### PIN personelu i synchronizacja manifestu

1. PIN jest technicznym, tymczasowym mechanizmem POC dla roli staff; nie jest haslem prywatnego `person_id`.
2. `hub_staff.pin` i `hub_manifest.yaml` przechowuja obecnie jawny PIN w formie znormalizowanej do wielkich liter.
3. Jest to swiadomy kompromis umozliwiajacy pelna synchronizacje manifest <-> DB. Jawny PIN nie jest docelowym standardem produkcyjnym.
4. Manifest -> DB oraz DB -> manifest musza obejmowac PIN ownera, managera, workera, kuriera i central staff.
5. Zmiana PIN-u w Client API wymaga aktywnego kontekstu staff, starego PIN-u, nowej niekolidujacej wartosci i optimistic check starego rekordu.
6. Zmiana PIN-u oraz oznaczenie DB jako nowszego zrodla manifestu sa jednym commitem. Nastepny sync `prefer_file=False` eksportuje PIN do YAML.
7. Aktywacja i zmiana PIN-u korzystaja z persystowanego limitu prob `auth_login_attempts`; limit przetrwa restart aplikacji.
8. Porownanie PIN-u korzysta z porownania staloczasowego.
9. Przed produkcja jawne PIN-y musza zostac zastapione bezpiecznym resetem/rotacja lub magazynem sekretow, co pozwoli ponownie wlaczyc haszowanie bez potrzeby odwracania hasha do manifestu.

## 32. Reguly po audycie routingu kont i aktora finansowego (2026-07-22)

Ponizsze zasady sa obowiazujacym modelem po zamknieciu punktow 2-7 ostatniego audytu bezpieczenstwa. Dotycza `client_api`, `finance_core`, `ledger_service`, `ledger_seed.py` oraz finansowego trybu staff w `client_app`.

### 32.1. Payment intent zawsze wskazuje konkretne konta

1. Dla platnosci VKES `payer_account_id` i `payee_account_id` sa wymagane w rekordzie `payment_intents`.
2. Jezeli uzytkownik poda zwykly `person_id`, resolver najpierw wybiera jedno aktywne konto VKES wlasciwego scope, a dopiero potem tworzy intent.
3. Jezeli poda alias albo pelny `account_id`, system waliduje konkretne konto, walute, blokade i uprawnienia.
4. `payer_owner_id` i `payee_owner_id` opisuja strony procesu/push, ale nie zastepuja konta, na ktorym zostanie zapisany ledger.
5. Dotyczy to zarowno `/client-api/payments/create`, jak i `/client-api/payments/request`.
6. Konto `staff`, `hub` albo `system` nie moze zostac wybrane przez sam `person_id` tylko dlatego, ze ma tego samego `owner_person_id`.

### 32.2. Osoba i aktor operacyjny sa rozdzieleni

1. `person_id` jest tozsamoscia osoby i sluzy do autoryzacji dostepu do konta, widocznosci push oraz sprawdzania `wallet_account_access`.
2. W trybie prywatnym `wallet_ledger.actor_id = person_id`.
3. W aktualnie obslugiwanym trybie staff/kurier `client_app` przekazuje zweryfikowany token aktywnego `staff_id`; po ponownej walidacji `wallet_ledger.actor_id = staff_id`.
4. Nieprawidlowy lub obcy token staff blokuje operacje. System nie wraca wtedy po cichu do `person_id` jako aktora.
5. W `payment_intents`:
   - `created_by` przechowuje osobe/profil procesu,
   - `created_by_actor_id` przechowuje aktora tworzacego,
   - `authorized_by_actor_id` przechowuje aktora zatwierdzajacego.
6. Przy rozliczeniu `incoming_payment_offer` ledger korzysta z aktora inicjujacego. Przy `payment_request` korzysta z aktora zatwierdzajacego.
7. TUI zachowuje dotychczasowa zasade: logowanie staff podpisuje operacje aktywnym `staff_id`, a logowanie klienta w `3:Finanse` podpisuje ja `person_id`.

### 32.3. Onboarding i lista kont nie mieszaja scope

1. `is_client_financially_onboarded()` sprawdza tylko konta zgodne z typem profilu: `person` dla profilu prywatnego albo `business` dla profilu biznesowego.
2. Samo `owner_person_id` nie wystarcza do uznania konta staff, huba lub systemu za prywatne konto klienta.
3. `list_wallet_accounts()` zwraca konta tylko dla odpowiedniego scope i wlasciciela.
4. Konta udostepnione sa osobnym widokiem opartym o `wallet_account_access`; nie sa dolaczane do listy kont wlasnych.
5. Jedna osoba moze miec rownoczesnie konta `person`, `business`, `staff`, `hub` i `system`, ale te zakresy musza pozostac rozdzielone w routingu, onboardingu i UI.

### 32.4. Ledger nie zgaduje konta po wlascicielu

1. Jedyna produkcyjna sciezka zapisu wpisu prowadzi przez `ledger_service`.
2. `append_ledger_entry()` i `append_ledger_entry_pair()` wymagaja jawnego `account_id` dla kazdej nogi operacji.
3. Usuniety zostal fallback wybierajacy konto na podstawie samego `owner_id`; zapobiega to zapisowi na konto innego scope.
4. `ledger_seed.py` pobiera wszystkie aktywne `wallet_accounts.account_id`, wylicza ich wlasciciela tylko pomocniczo i zapisuje wpis poczatkowy na konkretnym koncie.
5. Seed jest wznawialny per konto: po bledzie nie pomija kont, ktore nie dostaly jeszcze wpisu.

### 32.5. Alias `MAIN` nie jest domyslny dla kazdego konta

1. Alias jest odczytywany tylko z czesci `account_id` po separatorze `-`.
2. Jezeli `account_id` nie zawiera `-`, jego pelna wartosc jest nazwa i adresem konta.
3. `MAIN` istnieje tylko wtedy, gdy identyfikator ma jawny suffix `-MAIN`, np. `PJOA7K-MAIN` albo `BPEB3M-MAIN`.
4. Konta systemowe i hubowe, np. `VKES_SYSTEM_MINT`, `VKES_SYSTEM_OPERATING`, `VKES_AA_OPERATING` i `KES_AA_OPERATING`, nie dostaja sztucznego `-MAIN` i sa wyswietlane w calosci.
5. Konto staff ma jawny identyfikator aliasowy osoby i roli, np. `PJOA7K-MAAJOAV`; nie jest zamieniane na `PJOA7K-MAIN`.
6. Skrot samego `person_id` moze rozwiazac tylko konto `person` albo `business`. Dla staff, hub i system wymagany jest pelny `account_id` albo jawny, zwalidowany alias routingu.
7. UI nie buduje aliasu `MAIN` przez samo sprawdzenie braku separatora. To usunelo blad, przez ktory konto systemowe moglo byc pokazane jako `MAIN`.

### 32.6. Testy zamykajace punkty audytu

Pokryte sa nastepujace przypadki:

- platnosc po samym `person_id` zapisuje konkretne konta w `payment_intents`,
- ta sama osoba z kontami wielu scope nie otrzymuje obcego konta jako prywatnego,
- przelew i akceptacja payment intent w trybie staff zapisuje `staff_id` jako aktora,
- owner-only zapis ledger jest odrzucany,
- seed ledger zapisuje po `account_id` i jest idempotentny,
- testy nie zakladaja juz, ze konto bez `-` ma alias `MAIN`.

Weryfikacja po wdrozeniu: pelny zestaw testow `159 passed`, a build `client-app` zakonczyl sie poprawnie.

## 33. Obowiazujacy model nadania paczki i testowego Flask po audycie (2026-07-24)

Ten rozdzial uzupelnia opis wdrozonych zasad z punktow 1-16 audytu. W razie
roznicy z wczesniejszym opisem awaryjnego flow pierwszenstwo ma ponizsza
semantyka oraz implementacja wspolnego core.

### 33.1. Jedna operacja nadania

1. TUI, Client API, Hub API i Admin API buduja wspolny
   `SubmitParcelCommand` i wywoluja `submit_parcel_command()`.
2. Nadanie obejmuje w jednej transakcji DB walidacje, zapis paczki, przypisanie
   do worka, oplaty, `package_events`, `wallet_ledger`, intent platniczy oraz
   dane pomocnicze klienta, tagu i assetu.
3. Nieudany krok wycofuje cala operacje. Nie wolno zwracac sukcesu po zapisaniu
   tylko paczki albo tylko finansow.
4. Kazdy odroczony wpis finansowy otrzymuje konkretny `tx_group_id`; wpisy
   nalezace do jednego splitu korzystaja ze wspolnego TX.

### 33.2. Statusy i identyfikatory paczki

- `local`, `global` i `created` sa szkicami/szablonami i nie rezerwuja finalnego
  czteroznakowego numeru paczki.
- `paid` jest voucherem przedplaconym oznaczonym `TX...`; jego aktywacja jest
  mozliwa tylko w hubie nadawczym zapisanym w voucherze.
- Przy fizycznym nadaniu system rezerwuje finalny kod czteroznakowy. Kod moze
  zostac ponownie uzyty po czasie zgodnie z zasadami POC; rozroznienie historii
  zapewniaja czas, `package_events.seq`, TX i lancuch hash.
- `package_events` jest append-only. Historia nie jest zastapiona przez
  `INSERT OR REPLACE` ani czyszczona przy ponownym uzyciu kodu.
- `package_id` jest identyfikatorem logistycznym, a `tx_group_id` laczy
  operacje finansowe i zdarzenia tej samej platnosci. Nie sa zamienne.

### 33.3. Worki i reczne dopisanie

1. System automatycznie wybiera albo tworzy worek `OPEN` dla pierwszego
   odcinka trasy.
2. Worek `SEALED` oznacza dla automatyki: nie dokladaj kolejnej paczki i
   przygotuj nowy worek dla tego kierunku.
3. Pracownik moze jednak recznie wybrac `SEALED`, gdy wie, ze paczka fizycznie
   sie zmiesci. Drugie potwierdzenie `Enter` dopisuje paczke bez zmiany statusu
   worka.
4. Operacja recznego dopisania jest atomowa i zapisuje `BAG_ITEM_ADDED` z
   aktywnym `staff_id`.
5. Nie mozna tym mechanizmem dopisywac do `RESERVED`, `LOADING`, `IN_TRANSIT`,
   `RETURNED` ani `RECEIVED`.
6. Jezeli zapis paczki do worka nie powiedzie sie, nadanie jest odrzucone i
   nie powstaje czesciowo zatwierdzony zapis finansowy.

### 33.4. Potwierdzenie i aktor

- Operacja KES wymaga jawnego potwierdzenia `Enter`; samo wybranie metody nie
  finalizuje nadania.
- Operacja huba wymaga aktywnego `staff_id`. Nie ma cichego fallbacku do
  `person_id`, gdy pracownik nie zostal rozpoznany.
- TUI moze wykorzystac aktywnego pracownika zalogowanego do huba; Flask musi
  odczytac i przekazac aktywnego pracownika huba przed nadaniem.
- W finansach aktor staff jest rozdzielony od osoby uzytej do autoryzacji i
  kontroli dostepu.

### 33.5. Testowy flow Flask

`/api/add_parcel` pozostaje prywatnym panelem testowym, ale korzysta z pelnego
flow produkcyjnego core:

1. Sprawdza istnienie huba startowego i docelowego oraz aktywna sesje
   pracownika huba.
2. Ustawia `_staff_id` na aktywnego aktora operacyjnego.
3. Uzywa testowego nadawcy `COO` i odbiorcy `CFO`, pobierajac ich dane przez
   `hub_staff.person_id` i `persons`.
4. Stosuje preset tagu `Koperta` do wymiarow, wagi i pozostalych danych.
5. Oblicza cene wspolnym `compute_parcel_payment_amount()`.
6. Tworzy standardowy payment intent VKES z konkretnego konta COO do
   konkretnego konta operacyjnego huba, wysyla push i autoryzuje platnosc jako
   COO.
7. Przekazuje finalne nadanie jako `SubmitParcelCommand` do
   `submit_parcel_command()`; Admin API nie wykonuje wlasnego SQL dla
   paczki ani wlasnego transferu finansowego.
8. Do danych testowych dodaje `_audit_source=FLASK_test` oraz `_test_flow=true`.
   Wartosc `FLASK_test` jest widoczna w metadanych audytowych.
9. Przy bledzie nadania anuluje przygotowany payment intent. Przy sukcesie
   zapis paczki, worka i finansow wykonuje wspolny core.
10. Automatyczna dostawa jest opcjonalna i zalezy od ustawienia `auto_deliver`;
    nie zmienia zasad zapisu ani autoryzacji nadania.

Flask jest projekcja/testowym API wspolnego runtime. Nie tworzy drugiego modelu
routingu, cen, statusow worka ani ksiegowania.

### 33.6. Zasady audytowe

- `package_events` i `wallet_ledger` sa historiami append-only.
- Dane klienta, assetu i tagow musza zostac zapisane w tej samej transakcji
  co paczka.
- Payment intent przechowuje konkretne konta platnika i odbiorcy.
- Aktywacja `TX.../paid` usuwa voucher dopiero po udanym zakonczeniu calej
  operacji; nieudana aktywacja pozostawia voucher do ponowienia.
- Zmiana statusu worka, dopisanie paczki i finansowe skutki podrozy nie moga
  byc zatwierdzane czesciowo.

Weryfikacja po wdrozeniu punktu 16: `230 passed`. Szczegolowy raport punktow
1-16 znajduje sie w `Finance_task.md`, sekcja 21.

## 34. Granice API, domeny i DAL (2026-07-25)

### 34.1. Niezalezne procesy HTTP

1. `client-app` korzysta z publicznego `client_api.py`.
2. `hub-app` korzysta z osobnego `hub_api.py` na porcie `5002`.
3. `hub_api.py` nie importuje `client_api.py`, nie udostepnia jego tras i nie
   wymaga uruchomionego procesu Client API.
4. `flask_server.py` pozostaje osobnym testowym API.
5. Rozdzielenie procesow izoluje restart i awarie HTTP, ale nie usuwa wspolnej
   zaleznosci od DB, hosta i modulow domenowych.

### 34.2. Wspolna domena

API nie kopiuja logiki paczek ani finansow. Wywoluja wspolne moduly:

- `courier_logic_poc.py` dla paczek, tras, workow i runtime,
- `finance_core.py` dla kont, intencji i rozliczen,
- `ledger_service.py` dla ksiegi i podpisow,
- `db_storage.py` oraz wyspecjalizowane repozytoria dla persystencji.

Zmiana transportu HTTP nie moze tworzyc drugiego algorytmu ceny, routingu,
platnosci, aktora ani zapisu paczki.

### 34.3. Warstwa dostepu do danych

1. Jedynym miejscem bezposrednio tworzacym polaczenie SQLite jest wspolna
   fabryka `ledger_common.sqlite_connect()`.
2. `db_connection.open_db()` jest adapterem uzywanym przez repozytoria.
3. `db_connection.begin_immediate()` rozpoczyna standardowa transakcje zapisu.
4. Warstwy HTTP `client_api.py`, `hub_api.py` i `flask_server.py` nie wykonuja
   surowego SQL i nie zarzadzaja polaczeniami.
5. SQL Client API jest rozdzielony wedlug domen na
   `client_identity_repository.py`, `client_finance_repository.py` i
   `client_parcel_repository.py`.
6. SQL Hub API znajduje sie w `hub_repository.py`, a pomocnicze odczyty
   testowego Flaska w `flask_repository.py`.
7. Serwis aplikacyjny moze koordynowac jedna transakcje i wywolania domenowe,
   ale zapytania SQL pozostaja w repozytoriach.

### 34.4. Atomowosc

- Zewnetrzny serwis operacji otwiera jedno polaczenie i jedna transakcje.
- Funkcje domenowe wywolane w tej operacji otrzymuja to samo `conn`.
- Sukces wszystkich krokow konczy sie jednym `commit`.
- Blad dowolnego kroku konczy sie jednym `rollback`.
- Funkcja wewnetrzna nie moze otwierac drugiego polaczenia dla czesci tej
  samej operacji.

### 34.5. Zabezpieczenie architektury

Test `test_architecture_boundaries.py` wykrywa:

- ponowne dodanie tras huba do Client API,
- import Client API przez Hub API,
- bezposrednie `sqlite3.connect()` poza wspolna fabryka,
- bezposrednie wykonywanie SQL w warstwach HTTP.

Osobny test uruchamia rzeczywisty proces Hub API przy zablokowanym imporcie
Client API, sprawdza health, loguje staff obu hubow i wykonuje pelne nadanie
KES przez HTTP. Test sprawdza finalna paczke, eventy, payment intent, worek,
`bag_parcels` oraz wpis platnosci w ledgerze.

### 34.6. Odswiezanie runtime miedzy procesami

1. Zmiana runtime jest zapisywana razem ze zdarzeniem w transactional outboxie
   w tej samej transakcji co dane biznesowe.
2. Dopiero udany `COMMIT` budzi dispatcher; rollback nie publikuje zdarzenia.
3. Hub API otrzymuje jawny event uniewazniajacy runtime i przed kolejnym
   uzyciem wykonuje pojedynczy `reload_runtime_topology_from_db()`.
4. Client API stosuje ten sam mechanizm dla swojej projekcji runtime.
5. Reload jest chroniony blokada procesu. Kolejny event pozostawia runtime jako
   wymagajacy ponownego odswiezenia, zamiast uruchamiac cykliczny odczyt DB.
6. Nie istnieje stale polaczenie kontrolne ani odczyt `PRAGMA data_version` na
   kazdym zadaniu HTTP.

### 34.7. Ustawienia i aktor nadania

- Persystencja `app_settings` i `hub_editor_rings` znajduje sie w
  `system_settings_repository.py`; stare funkcje w `db_storage.py` sa tylko
  delegatami kompatybilnosci.
- Synchronizacja konfiguracji, Flask, audyt finansowy i runtime korzystaja
  bezposrednio z repozytorium ustawien.
- `parcel_cash_payment` oraz `parcel_vkes_payment` wykonane podczas nadania w
  hubie przechowuja aktywny `staff_id` w `wallet_ledger.actor_id`.
- `SYSTEM_RUNTIME` pozostaje aktorem tylko operacji automatycznych systemu.

### 34.8. Odczyty ksiegi

1. Odczyty ostatnich sald, tekstowej historii i strukturalnych wpisow
   `wallet_ledger` znajduja sie w `wallet_read_repository.py`.
2. Repozytorium odczytu nie wykonuje zapisu, synchronizacji ani ukrytego
   bootstrapu.
3. Saldo konta pochodzi z wpisu o najwyzszym `seq` dla pary
   `account_id + currency`.
4. Kwoty przechowywane w DB jako jednostki calkowite sa konwertowane na kwoty
   uzytkowe dopiero na granicy repozytorium.
5. Flask, runtime/TUI i narzedzie porownujace ledger korzystaja bezposrednio
   z repozytorium. Delegaty w `db_storage.py` istnieja tylko dla zgodnosci
   starszych importow i nie zawieraja SQL.
6. Test architektury blokuje ponowne umieszczenie zapytan tych odczytow w
   `db_storage.py`.

### 34.9. Odczyty tozsamosci

1. Odczyty `persons` i `hub_staff` potrzebne formularzom, TUI i Flask
   znajduja sie w `identity_read_repository.py`.
2. Repozytorium odpowiada za dane klienta i staff, listy identyfikatorow,
   wyszukiwanie po telefonie/e-mailu, indeks staff i aktywna obsade huba.
3. Dane osoby z `persons` maja pierwszenstwo przed zgodnosciowa kopia danych
   osobowych w `hub_staff`.
4. Aktywna obsada wynika z aktywnych sesji staff, a jej kolejnosc pozostaje
   stala: managerowie przed workerami.
5. `db_storage.py` nadal eksportuje stare nazwy jako fasada zgodnosci, ale
   delegaty nie zawieraja SQL.
6. TUI, runtime, Flask i serwis topologii korzystaja bezposrednio z
   repozytorium tozsamosci.

### 34.10. Odczyty paczek

1. Odczyty `packages`, `package_events` i powiazan paczka-ledger znajduja sie
   w `package_read_repository.py`.
2. Repozytorium obsluguje listy paczek, wyszukiwanie szkicow i voucherow
   `paid`, historie, eventy, wymiary oraz rehydratacje runtime.
3. Funkcje uzywane wewnatrz operacji atomowej przyjmuja istniejace `conn` i
   nie zamykaja polaczenia nalezacego do wywolujacego.
4. Odczyt nie wykonuje migracji, `ALTER TABLE`, bootstrapu ani ukrytego
   zapisu. Docelowy schemat musi byc gotowy przed obsluzeniem requestu.
5. Kwoty z DB sa konwertowane z jednostek calkowitych dopiero na granicy
   repozytorium.
6. `db_storage.py` zachowuje publiczne delegaty zgodnosci bez surowego SQL.

### 34.11. Odczyty workow i magazynu huba

1. Odczyty `bags`, `bag_parcels`, `hub_ready_pickup`, `hubs.bag_stock`,
   `hub_box_inventory`, `hub_asset_inventory` oraz
   diagnostycznych `bag_events` znajduja sie w `bag_read_repository.py`.
2. Repozytorium obsluguje wybor otwartego worka dla trasy, odbior worka,
   odczyt jego ladunku i typu, zawartosc worka, listy workow huba, kolejke
   paczek gotowych do odbioru, assety oraz wyliczenie potrzeb rebalansu.
3. Funkcje wywolywane wewnatrz operacji atomowej przyjmuja istniejace `conn`,
   odczytuja niezatwierdzony stan tej samej transakcji i nie zamykaja
   polaczenia nalezacego do wywolujacego.
4. W szczegolnosci `get_bag_cargo()` nie moze otwierac drugiego polaczenia,
   gdy otrzymalo `conn`; zapobiega to rozjazdowi stanu i blokadzie
   `SQLITE_BUSY` podczas nadania paczki.
5. `set_bag_cargo(..., conn=...)` nie zatwierdza i nie zamyka przekazanego
   polaczenia. `commit` albo `rollback` wykonuje zewnetrzna operacja atomowa.
6. Wspolne parsery i serializer ladunku oraz metryk worka znajduja sie w
   `bag_payloads.py`, dzieki czemu odczyt i zapis stosuja ten sam format JSON.
7. TUI i runtime korzystaja bezposrednio z repozytorium. `db_storage.py`
   zachowuje delegaty odczytowe dla kompatybilnosci, natomiast operacje
   zapisujace sa opisane w nastepnej sekcji.
8. Test architektury blokuje ponowne umieszczenie SQL tych odczytow w
   delegatach `db_storage.py`.

### 34.12. Zapisy workow i magazynu huba

1. Punktowe zapisy `bags`, `bag_parcels`, `hub_ready_pickup` oraz operacyjnego
   stanu opakowan w tabelach inventory znajduja sie w
   `bag_write_repository.py`.
2. Jezeli funkcja nie otrzyma `conn`, otwiera wlasne polaczenie, rozpoczyna
   `BEGIN IMMEDIATE` i odpowiada za `commit`, `rollback` oraz `close`.
3. Jezeli funkcja otrzyma `conn`, wykonuje wszystkie odczyty i zapisy na tym
   polaczeniu. Nie zatwierdza go, nie wycofuje i nie zamyka; odpowiada za to
   zewnetrzna operacja atomowa.
4. Zasada obejmuje ladunek i status worka, przypisanie paczek, metryki,
   odbior/transfer, aktywacje skrzynek, BAG_STOCK oraz kolejke odbioru.
5. Zmiana `bags.id` podczas transferu aktualizuje w tej samej transakcji
   zalezne `bag_parcels.bag_id`. Kontrola FK jest odroczona do konca
   transakcji, poniewaz obecny FK nie ma `ON UPDATE CASCADE`.
6. Synchronizacja niepelnego obiektu worka z runtime nie usuwa relacji
   `bag_parcels`, jezeli `_parcels_fully_loaded` ma wartosc false.
7. `db_storage.py` zachowuje publiczne nazwy jako delegaty zgodnosci i nadal
   koordynuje pelny snapshot runtime. Punktowe delegaty i pomocnicze zapisy
   snapshotu nie zawieraja juz wlasnego SQL.
8. Aktualizacje finansowe i statusy domeny `packages` nie sa przenoszone do
   repozytorium workow; powinny trafic do osobnego repozytorium zapisu paczek.
9. Test architektury blokuje powrot SQL tych zapisow do delegatow fasady, a
   testy transakcyjne sprawdzaja rollback calej grupy operacji na przekazanym
   polaczeniu.

### 34.13. Zapisy paczek

1. Punktowe zapisy stanu `packages` znajduja sie w
   `package_write_repository.py`.
2. Repozytorium odpowiada za rejestracje paczki, zmiane statusu, huba i
   salda, przyjecie jednej paczki albo wszystkich paczek worka, korekte
   salda oraz warunkowe usuniecie wpisu tymczasowego.
3. Bez przekazanego `conn` repozytorium otwiera wlasne polaczenie, rozpoczyna
   `BEGIN IMMEDIATE` i odpowiada za `commit`, `rollback` oraz `close`.
4. Z przekazanym `conn` repozytorium nie zatwierdza, nie wycofuje i nie
   zamyka transakcji. Dzieki temu stan paczki, worka, eventy i finanse moga
   zostac zatwierdzone albo wycofane jako jedna operacja domenowa.
5. Ogolna aktualizacja stanu nie zmienia wpisu `TX...` ze statusem `paid`.
   Voucher przedplacony moze zostac aktywowany tylko przez dedykowany flow,
   ktory sprawdza platnosc i wykonuje pozostale zapisy atomowo.
6. Czteroznakowy identyfikator paczki moze zostac ponownie wykorzystany
   wylacznie po zakonczeniu poprzedniego cyklu statusem `delivered` albo
   `cancelled`. Historia `package_events` nie jest wtedy kasowana, a nowy
   cykl dopisuje dalsze eventy.
7. Usuniecie z `packages` moze wymagac oczekiwanego statusu. Jezeli warunek
   nie jest spelniony, cala transakcja zostaje wycofana; zapobiega to
   czesciowemu utworzeniu albo zwrotowi paczki.
8. `package_events`, hash/HMAC eventu i koordynator pelnego nadania pozostaja
   oddzielone od punktowego repozytorium stanu. Lancuch audytowy obsluguje
   osobne repozytorium opisane w nastepnej sekcji.
9. Runtime korzysta bezposrednio z repozytorium zapisu paczek.
   `db_storage.py` zachowuje zgodnosciowe delegaty bez surowego SQL.
10. Testy sprawdzaja jednostki calkowite, wymiary, rollback na przekazanym
    polaczeniu, ochrone `paid`, ponowne uzycie kodu, przyjecie paczek worka
    i atomowe niepowodzenie usuniecia warunkowego.

### 34.14. Lancuch `package_events`

1. Operacyjny zapis i audyt `package_events` znajduja sie w
   `package_event_repository.py`.
2. Repozytorium odpowiada za punktowy append, synchronizacje rosnacej
   historii runtime, kolejny `seq`, jednostki calkowite `amount`,
   `finance_tx_group_id`, `entry_hash`, `hmac_signature` oraz weryfikacje
   calego lancucha paczki.
3. Eventy sa append-only. Konflikt `(package_id, seq)` nie jest ignorowany
   ani zastepowany; synchronizacja zglasza blad i pozwala koordynatorowi
   wycofac cala transakcje.
4. Gdy repozytorium otrzyma `conn`, nie zatwierdza, nie wycofuje i nie
   zamyka polaczenia. Event paczki moze dzieki temu wejsc do tej samej
   transakcji co stan paczki, worek i wpisy `wallet_ledger`.
5. Gdy repozytorium samo otwiera polaczenie, stosuje `BEGIN IMMEDIATE`.
   Rezerwacja `MAX(seq)+1` i append sa wtedy chronione jedna transakcja
   zapisu SQLite.
6. Payload podpisu obejmuje `package_id`, `seq`, pusty lub jawny
   `entry_text`, `event_key`, hub, aktora staff, kwote, opcjonalne metadane
   oraz opcjonalny finansowy TX. Zmiana ktoregokolwiek z tych pol po zapisie
   jest wykrywana przez audyt.
7. `event_hashing.py` jest wspolnym, bezstanowym modulem obliczania
   hash/HMAC dla `package_events` i `bag_events`. Nie wykonuje SQL i nie
   zarzadza transakcja.
8. Operacyjny zapis nie wykonuje `ALTER TABLE`, nie tworzy indeksow i nie
   naprawia schematu. Schemat przygotowuje kontrolowany `init_db` przed
   uruchomieniem API/TUI.
9. `tracking_holder` oraz stare tekstowe duplikaty nadania, wydania i
   przyjecia nie sa ponownie dopisywane przez synchronizacje historii.
10. Przepisanie historycznego tekstu po zmianie nazwy huba jest mozliwe
    tylko dla niepodpisanych danych legacy. Obecnosc `entry_hash` blokuje
    modyfikacje podpisanej historii.
11. `courier_logic_poc.py` oraz `package_event_audit.py` korzystaja
    bezposrednio z repozytorium. Delegaty `db_storage.py` zachowuja zgodnosc
    starszych importow, ale nie zawieraja SQL.
12. Testy sprawdzaja poprawny lancuch, wykrycie manipulacji, brak klucza,
    jednostki calkowite, rollback, filtrowanie, idempotencje synchronizacji
    i blokade powrotu SQL do fasady.

### 34.15. Lancuch `bag_events`

1. Operacyjny zapis i audyt `bag_events` znajduja sie w
   `bag_event_repository.py`.
2. Kazdy event zawiera `bag_id`, `event_key`, hub, `actor_id` oraz
   `parcel_ids_json` bedacy migawka paczek w kolejnosci
   `bag_parcels.pos, package_id`.
3. Lancuch jest niezalezny dla kazdego `bag_id` i uporzadkowany rosnacym
   `bag_events.id`.
4. Powtarzalne statusy sa dozwolone i zawsze dopisywane. Sekwencja
   `OPEN -> RESERVED -> OPEN` opisuje trzy rozne decyzje operacyjne.
5. Payload eventu, `entry_hash` i `hmac_signature` sa obliczane wspolnym
   modulem `event_hashing.py`. Zmiana aktora, statusu, huba albo migawki
   paczek po zapisie jest wykrywana przez audyt.
6. Gdy repozytorium otrzyma `conn`, nie wykonuje `commit`, `rollback` ani
   `close`. Event worka uczestniczy wtedy w tej samej transakcji co paczki,
   inventory, ledger i usuniecie zuzytego worka.
7. Bez przekazanego `conn` repozytorium rozpoczyna `BEGIN IMMEDIATE` i
   odpowiada za cala wlasna transakcje.
8. Operacyjny append nie tworzy ani nie migruje schematu. Tabele, indeksy,
   normalizacja historycznych nazw eventow oraz trigger `db_ts` sa
   przygotowywane przez kontrolowany `init_db`.
9. Rezerwacja worka jest zatwierdzana tylko wtedy, gdy wpis `RESERVED`
   zostal poprawnie dopisany.
10. `commit_runtime_operation` wymaga jednego poprawnego wpisu dla kazdego
    przekazanego eventu worka. Blad appendu wycofuje cala operacje, lacznie
    z utworzona paczka, stanem worka i zmianami inventory.
11. Runtime korzysta bezposrednio z repozytorium. `db_storage.py` zachowuje
    delegaty zgodnosci bez SQL, a odczyty diagnostyczne pozostaja w
    `bag_read_repository.py`.
12. Testy sprawdzaja migawke i jej kolejnosc, lancuch hash/HMAC,
    powtarzalne eventy, wykrycie manipulacji, brak klucza, rollback
    przekazanego polaczenia oraz fail-closed calej operacji.

### 34.16. Snapshot operacyjny runtime

1. Snapshot inwentarza huba, kolejki `hub_ready_pickup`, workow i relacji
   `bag_parcels` obsluguje `runtime_snapshot_repository.py`.
2. Snapshot operacyjny nie zapisuje topologii, pracownikow ani polaczen
   hubow. Te dane sa oddzielna domena.
3. Bez przekazanego `conn` repozytorium rozpoczyna `BEGIN IMMEDIATE` i
   odpowiada za `commit`, `rollback` oraz `close`.
4. Z przekazanym `conn` repozytorium nie zatwierdza, nie wycofuje i nie
   zamyka polaczenia. Pelne nadanie moze polaczyc stan runtime, paczke,
   eventy i finanse w jednej transakcji.
5. `full_snapshot=False` dopisuje i aktualizuje widoczny stan, ale nie usuwa
   innych workow. Usuniecie workow nieobecnych w runtime jest dozwolone
   tylko dla jawnego `full_snapshot=True`.
6. Worek oznaczony jako niepelnie odtworzony nie synchronizuje swojej listy
   paczek. Istniejace `bag_parcels` pozostaja wtedy bez zmian.
7. Ten sam `bag_id` znaleziony w wielu kolekcjach runtime jest zapisywany
   tylko raz. Kolekcja huba ma pierwszenstwo przed lista workow w trasie.
8. Operacyjny snapshot nie tworzy i nie migruje schematu. Wymagane tabele
   przygotowuje `init_db`.
9. `db_storage.py` zachowuje nazwy `persist_hub_inventory_only`,
   `persist_bag_state_only` i `persist_runtime_state_only` jako delegaty bez
   SQL. Nadal koordynuje polaczenie snapshotu operacyjnego z topologia w
   pelnym commicie.
10. Testy sprawdzaja zapis calego snapshotu, brak przedwczesnego commitu,
    ochrone czesciowo odtworzonych workow, kontrolowane czyszczenie pelnej
    migawki oraz granice architektoniczne.

### 34.17. Zapis topologii

1. Zapis `hubs`, `hub_links`, `hub_staff`, `hub_bag_counters` oraz
   zachowanie `hub_direction_counters` obsluguje
   `topology_write_repository.py`.
2. `db_storage.py` zachowuje `_persist_topology_tables()` i
   `persist_topology_only()` jako delegaty zgodnosci bez SQL.
3. Repozytorium topologii bez przekazanego `conn` rozpoczyna
   `BEGIN IMMEDIATE`; z przekazanym polaczeniem nie wykonuje `commit`,
   `rollback` ani `close`.
4. Pelny snapshot sklada zapis topologii i operacyjny snapshot runtime na
   jednym polaczeniu. Blad ktorejkolwiek czesci wycofuje obie.
5. Polaczenia hubow przechowuja tylko jawna blokade albo jawny dystans.
   Usuniecie nadpisania z runtime usuwa odpowiadajacy rekord `hub_links`,
   ale nie usuwa hubow.
6. Istniejace dane opisowe huba, naliczenia oraz wspolrzedne geograficzne
   sa zachowywane podczas aktualizacji obiektu runtime.
7. Brakujacy jednoliterowy `local_name` nie jest uzupelniany podczas zapisu
   snapshotu, zwyklego startu, synchronizacji istniejacej DB ani zmiany
   topologii. Kod z alfabetu RFC4648 przydziela Admin API podczas tworzenia
   nowego huba. Jedynym wyjatkiem jest jawny bootstrap calkowicie pustej DB,
   ktory odtwarza zapisane kody z manifestu. Pusty kod w istniejacej bazie jest
   bledem danych wymagajacym jawnej operacji administracyjnej.
8. Istniejacy kurier zapisany w DB pozostaje w `hub_staff`, gdy lista
   kurierow runtime jest pusta. Zapobiega to utracie konfiguracji podczas
   czesciowego startu.
9. Powiazanie `hub_staff.person_id` wykonuje osobne
   `identity_write_repository.py`. Repozytorium nie zaklada nowej osoby;
   laczy tylko jeden jednoznaczny aktywny rekord po znormalizowanym
   telefonie albo e-mailu.
10. Zapis operacyjny nie tworzy tabel, indeksow ani kolumn. Schemat
    przygotowuje `init_db`.
11. Testy obejmuja huby, linki, role staff, managera workera, kuriera,
    liczniki, zachowanie kuriera z DB, laczenie osoby, rollback
    przekazanego polaczenia oraz blokade powrotu SQL do fasady.

### 34.18. Odczyt i rehydracja runtime

1. SQL potrzebny do odtworzenia runtime znajduje sie w
   `topology_read_repository.py`.
2. Repozytorium zwraca neutralny snapshot slownikow. Nie importuje i nie
   tworzy klas `Hub`, `Worker`, `Parcel` ani `Bag`.
3. Snapshot zawiera huby, staff, aktywne sesje staff, linki, stan workow i
   skrzynek, `hub_ready_pickup`, opcjonalne paczki z `package_events`,
   opcjonalne worki z `bag_parcels` oraz ostatnie saldo kazdego wlasciciela
   i waluty.
4. Wszystkie zapytania samodzielnego odczytu sa wykonywane w jednej
   transakcji. Repozytorium zamyka ja przed rozpoczeciem rehydracji obiektow,
   dzieki czemu nie utrzymuje blokady odczytu podczas pracy logiki
   domenowej.
5. Sekcje paczek i workow mozna pominac, gdy wywolujacy nie przekazal
   odpowiednich klas runtime. Ogranicza to niepotrzebny odczyt duzych tabel.
6. Z przekazanym `conn` repozytorium nie zatwierdza, nie wycofuje ani nie
   zamyka polaczenia i przywraca poprzedni `row_factory`.
7. Repozytorium jest read-only. Nie tworzy tabel ani indeksow, nie dodaje
   kolumn i nie wykonuje korekt danych geograficznych.
8. `db_storage.load_runtime_topology()` odpowiada za mapowanie snapshotu na
   obiekty domenowe, odtworzenie relacji oraz awaryjne dolaczenie aktywnej
   paczki do kontenera. Funkcja nie wykonuje juz SQL.
9. DB pozostaje zrodlem prawdy: huby nieobecne w snapshotcie sa usuwane z
   runtime, a stan pracownikow i polaczen jest budowany od nowa.
10. Testy sprawdzaja zawartosc i kolejnosc snapshotu, opcjonalne sekcje,
    wlasnosc przekazanego polaczenia, realna rehydracje `Hub` i `Worker`
    oraz blokade powrotu SQL do koordynatora.

### 34.19. Atomowy koordynator operacji

1. `commit_runtime_operation()` i `commit_full_operation()` sa
   koordynatorami transakcji. Nie zawieraja zapytan SQL.
2. Koordynator otwiera polaczenie przez centralna fabryke, rozpoczyna
   `BEGIN IMMEDIATE`, wywoluje kolejne repozytoria, a na koncu wykonuje
   jeden `commit` albo jeden `rollback`.
3. Kolejnosc wpisow finansowych wzgledem `package_events`, stala kolejnosc
   splitu oraz odczyt fingerprintu eventu obsluguje
   `runtime_ledger_repository.py`.
4. Repozytorium odroczonego ledgera wymaga `tx_group_id`. Dla wpisu paczki
   wymaga rowniez fingerprintu odpowiadajacego eventu. Brak ktoregos
   elementu przerywa cala operacje.
5. Faktyczny append do ksiegi nadal wykonuje kanoniczny `ledger_service`;
   nie istnieje drugi algorytm salda, hash ani HMAC.
6. Warunkowe ustawienie `payment_intents.status = settled` wykonuje
   `payment_intent_write_repository.py`. Zapytanie zawiera oczekiwany
   poprzedni status i opcjonalne powiazanie TX.
7. Gdy intent zostal rownolegle zmieniony, aktualizacja obejmuje zero
   rekordow i repozytorium zglasza konflikt. Koordynator wycofuje paczke,
   eventy, ledger i stan worka.
8. Aktualizacje lokalizacji i statusu elementow tabel inventory znajduja
   sie w `bag_write_repository.py`.
9. Usuniecie worka wykonywane w ramach operacji usuwa jawnie jego
   `bag_parcels` oraz rekord `bags` na tym samym polaczeniu.
10. Przekazane `conn` pozostaje wlasnoscia koordynatora. Zadna z
    wywolywanych operacji nie moze go zatwierdzic, wycofac ani zamknac.
11. Koordynator nie wykonuje migracji schematu. Wszystkie wymagane tabele,
    kolumny i klucze musza byc przygotowane przez startowe `init_db`.
12. Testy obejmuja kolejnosc ledgera, podpisy wpisow, warunkowe przejscie
    intenta, konflikt statusu, rollback inventory, atomowe usuniecie worka
    oraz architektoniczny zakaz SQL w koordynatorach.

### 34.20. Administracja hubami

1. SQL operacji administracyjnych znajduje sie w
   `hub_admin_repository.py`. Repozytorium obsluguje metadane huba,
   wspolrzedne i ich walidacje, nazwy lokalne, blokady usuniecia, rename
   oraz delete.
2. `db_storage.py` pozostaje fasada zgodnosci dla TUI i Flask. Delegaty nie
   wykonuja SQL; zachowuja natomiast dotychczasowe komunikaty
   `system_logs` dla rozpoczecia, sukcesu i bledu operacji.
3. Zmiana nazwy huba jest atomowa. Wszystkie aktualne referencje sa
   aktualizowane w jednej transakcji przed zmiana klucza `hubs.name`.
4. Rename obejmuje `hub_links`, `hub_box_inventory`, `hub_asset_inventory`,
   `hub_direction_counters`, `hub_bag_counters`, `hub_ready_pickup`,
   `hub_staff`, `bags`, biezace pola huba w `packages` oraz
   `persons.default_hub`.
5. `hub_runtime_state` nie jest czescia docelowego modelu i nie jest
   odczytywane ani aktualizowane. Stan opakowan huba przechowuje
   `hubs.bag_stock`, `hub_box_inventory` i `hub_asset_inventory`.
6. Podpisana historia pozostaje niemutowalna. Rename nie zmienia
   `package_events.hub_code2`, `bag_events.hub_code2` ani wpisow
   `wallet_ledger`. Opcjonalna korekta starego `entry_text` jest mozliwa
   tylko wtedy, gdy historia nie ma `entry_hash`.
7. Usuniecie bez `force` jest blokowane przez worki wychodzace i
   przychodzace, kolejke odbioru oraz aktywne paczki zwiazane z hubem.
8. Usuniecie z `force=True` anuluje aktywne paczki i zeruje ich biezace
   referencje do huba. Nastepnie jawnie usuwa operacyjny stan huba z
   workow, kolejki odbioru, inventory, staff, licznikow i linkow.
9. Jawne czyszczenie jest wymagane, poniewaz nie wszystkie aktualne tabele
   maja FK do `hubs` z `ON DELETE CASCADE`. Operacja nie moze pozostawic
   osieroconego staff, inventory ani worka ze starym hubem zrodlowym.
10. Rename i delete stosuja `BEGIN IMMEDIATE`, jeden `commit` oraz jeden
    `rollback`. Failpoint po czesci zmian musi przywrocic caly stan sprzed
    operacji.
11. Repozytorium nie migruje schematu podczas operacji. Tabele, kolumny i
    indeksy przygotowuje wylacznie kontrolowane `init_db`.
12. Testy obejmuja docelowy schemat bez `hub_runtime_state`, wszystkie
    aktualne referencje rename, blokady delete, wymuszone usuniecie bez
    osieroconych rekordow, zgodnosc zwyklego `sqlite3.Row`/tuple oraz
    rollback po failpoincie.

### 34.21. Logi, rezerwacje i liczniki operacyjne

1. Append do `system_logs` obsluguje `system_log_repository.py`.
   Samodzielne wywolanie otwiera `BEGIN IMMEDIATE`; przekazane `conn`
   pozostaje wlasnoscia nadrzednej transakcji.
2. Rezerwacje licznikow workow i czteroznakowych kodow paczek obsluguje
   `counter_repository.py`.
3. Licznik worka obraca sie w skonfigurowanym zakresie i nie zatwierdza
   zmian wykonanych na przekazanym polaczeniu.
4. Rezerwacja kodu paczki sprawdza wszystkie 256 wartosci dla pary
   `(hub docelowy, kierunek)` i pomija kod aktywnej paczki. Kody zakonczonej
   paczki moga zostac ponownie wykorzystane.
5. Przesuniecie `hub_direction_counters` i wpis
   `system_logs/COUNTER_RESERVE` uczestnicza w tej samej transakcji.
   Rollback wycofuje oba.
6. Startowy seed licznikow oblicza `MAX(dir_counter) + 1` z istniejacych
   paczek tylko wtedy, gdy tabela licznikow jest pusta.
7. Rezerwacja worka znajduje sie w `bag_write_repository.py`. Dozwolone
   stany poczatkowe to `OPEN` i `SEALED`; opcjonalny hub
   zrodlowy musi odpowiadac rekordowi worka.
8. Zmiana na `RESERVED`, `holder_id`, czas rezerwacji i event
   `bag_events/RESERVED` sa atomowe. Brak eventu wycofuje zmiane worka.
9. Lista kurierow i ich stawki sa odczytywane przez
   `identity_read_repository.py`. Kolejnosc jest deterministyczna:
   `hub_name`, potem `staff_id`.
10. Runtime importuje repozytoria bezposrednio. Nazwy zachowane w
    `db_storage.py` sa delegatami zgodnosci bez SQL.
11. `persist_runtime_topology()` i `commit_tracking_only()` sa
    koordynatorami transakcji bez surowych zapytan i bez operacyjnych
    migracji schematu.
12. Testy obejmuja rotacje, pomijanie zajetego kodu, rollback logu i
    licznika, seed historyczny, rezerwacje worka fail-closed, projekcje
    kurierow oraz architektoniczny zakaz powrotu tych zapytan do fasady.

### 34.22. Zimny start i reset operacyjny

1. Startowe seedy stanu huba znajduja sie w
   `runtime_seed_repository.py`. Nie tworza tabel ani kolumn i wymagaja
   schematu przygotowanego przez `init_db`.
2. `hubs.bag_stock` jest uzupelniany osobno dla kazdego huba. Wpis istniejacego
   huba nie blokuje seeda huba dodanego pozniej.
3. Seed nie nadpisuje istniejacej liczby workow. `standard_bag_count`, jezeli
   podano, ma pierwszenstwo przed ogolnym `bag_count`.
4. Worki są zasobem zbiorczym i nie otrzymują indywidualnych rekordow inventory.
   Skrzynki i assety maja techniczne `id` w osobnych tabelach.
5. Assety korzystaja z nieograniczonej puli `id >= 0`. Skrzynki korzystaja
   z niezaleznej puli `id >= 1024`; rozdzielenie tabel usuwa konflikt ID.
6. Seed assetow jest idempotentny per hub i uzupelnia tylko brakujaca liczbe.
   Gdy cala wymagana partia nie miesci sie w puli, transakcja jest wycofywana
   bez czesciowego seeda.
7. Reset testowych danych obsluguje
   `operational_reset_repository.py`. Jest to jawne narzedzie developerskie,
   a nie zwykla operacja klienta albo huba.
8. Reset usuwa `packages`, `package_events`, `bags`, `bag_parcels`,
   `bag_events`, `hub_ready_pickup`, liczniki kierunkow i `system_logs`.
   Liczniki workow wracaja do zera, a `BAG_STOCK` do zadanej wartosci.
9. Reset zachowuje huby i linki, osoby, staff, ustawienia, konta,
   `wallet_ledger` i podpisy finansowe.
10. Reset nie wykonuje DDL. Stara operacja `DROP TABLE app_counters` zostala
    usunieta, poniewaz operacyjny reset nie moze zmieniac schematu.
11. Wszystkie zmiany resetu sa jedna transakcja. Blad na dowolnym etapie
    przywraca paczki, eventy, worki, liczniki, logi i inventory.
12. Fasada zachowuje niezalezny plik `reset_audit.log` i komunikaty
    START/DONE/FAIL. SQL resetu pozostaje w repozytorium.
13. Synchronizacja config/manifest, runtime i skrypt startowy importuja seed
    bezposrednio z repozytorium.
14. Po tym etapie `db_storage.py` wykonuje SQL tylko podczas kontrolowanej
    inicjalizacji, migracji, tworzenia triggerow i backfillu schematu.
    Operacyjne zapytania sa w repozytoriach domenowych.

Weryfikacja po wydzieleniu warstw: `354 passed`; buildy `client-app` i
`hub-app` zakonczone poprawnie.

### 34.23. Zamkniecie punktu 22 i jawna droga do bazy serwerowej

#### 34.23.1. Stan obecny

1. Punkt 22 jest zamkniety dla obecnego etapu SQLite/POC.
2. `client_api` i `hub_api` sa oddzielnymi procesami HTTP. Awaria lub restart
   jednego API nie zatrzymuje bezposrednio drugiego API.
3. Oba API, Flask i TUI korzystaja ze wspolnych modulow domenowych oraz
   repozytoriow. Warstwy HTTP nie zawieraja operacyjnego SQL.
4. Polaczenia SQLite sa otwierane przez wspolna fabryke. Obowiazuja wspolne
   ustawienia timeoutu, `busy_timeout`, kluczy obcych i `row_factory`.
5. Operacje atomowe otrzymuja jedno polaczenie i wykonuja jeden
   `BEGIN IMMEDIATE`, jeden `commit` albo jeden `rollback`.
6. Repozytorium wywolane z przekazanym `conn` nie moze samodzielnie wykonac
   `commit`, `rollback` ani `close`.
7. Operacyjne odczyty, zapisy, snapshoty, administracja, liczniki, seedy,
   logi i reset sa rozdzielone na repozytoria domenowe.
8. `db_storage.py` pozostaje kontrolowanym miejscem inicjalizacji, migracji,
   triggerow i backfillu schematu oraz fasada zgodnosci dla starych wywolan.
   Nie zawiera operacyjnego SQL.
9. SQLite pozostaje wspolnym punktem awarii obu API i pozwala tylko na jeden
   aktywny proces zapisu. Oddzielenie procesow HTTP nie usuwa tego ograniczenia.
10. Stan zostal potwierdzony pelnym zestawem `354 passed`, buildem obu
    aplikacji Vite i kontrola `git diff --check`.

#### 34.23.2. Dlaczego PostgreSQL nie jest wdrazany teraz

1. Obecny etap jest POC i nie wymaga jeszcze rownoleglych zapisow z wielu
   hostow ani wysokiej dostepnosci bazy.
2. Dodanie samego sterownika PostgreSQL albo przelacznika w konfiguracji nie
   oznaczaloby prawdziwej obslugi PostgreSQL.
3. Aktualny schemat i czesc repozytoriow nadal uzywaja elementow SQLite:
   placeholderow `?`, `PRAGMA`, `BEGIN IMMEDIATE`, `sqlite3.Row`,
   `STRFTIME`, `AUTOINCREMENT` i semantyki konfliktow SQLite.
4. Automatyczne tlumaczenie tych elementow w locie byloby ryzykowne dla
   finansow, lancuchow hash/HMAC, licznikow i operacji append-only.
5. Utrzymywanie dwoch dialektow przed faktyczna migracja zwiekszaloby koszt
   testow i ryzyko rozjazdu bez korzysci dla obecnego POC.
6. Dlatego obecnie nie dodaje sie pozornego adaptera, zaleznosci `psycopg`,
   przelacznika PostgreSQL ani drugiego schematu.
7. Brak adaptera PostgreSQL nie oznacza, ze punkt 22 jest otwarty. Punkt 22
   dotyczyl uporzadkowania granic procesu, domeny, DAL i SQLite i jest
   zakonczony. Migracja silnika jest oddzielnym przyszlym etapem.

#### 34.23.3. Warunki rozpoczecia migracji

Migracje do bazy serwerowej nalezy rozpoczec, gdy wystapi co najmniej jeden
z ponizszych warunkow:

1. API klienta i API huba maja dzialac na roznych hostach.
2. System wymaga wielu rownoleglych writerow.
3. Pomiary pokazuja istotne oczekiwanie na blokade SQLite albo regularne
   `SQLITE_BUSY` mimo poprawnych, krotkich transakcji.
4. Wymagane sa replikacja, automatyczny failover, centralne backupy,
   point-in-time recovery albo wysoka dostepnosc DB.
5. Wolumen paczek, eventow i ledgera przekracza bezpieczny zakres zmierzony
   w testach obciazeniowych SQLite.
6. Wymagania produkcyjne zabraniaja wspoldzielenia jednego pliku DB przez
   wszystkie procesy.

Decyzja nie moze opierac sie wylacznie na liczbie plikow lub zapytan.
Podstawa sa pomiary czasu blokad, czasu transakcji, liczby zapisow,
rozmiaru tabel i wymagania dostepnosci.

#### 34.23.4. Etapy przyszlej migracji

1. Zamrozic kontrakty domenowe i odpowiedzi API testami regresyjnymi.
2. Zinwentaryzowac w repozytoriach wszystkie elementy zalezne od SQLite:
   `PRAGMA`, funkcje daty, konflikty, autoinkrementacje, placeholdery,
   introspekcje schematu i zalozenia dotyczace `row_factory`.
3. Zdefiniowac jawny kontrakt backendu dla:
   otwarcia polaczenia, rozpoczecia transakcji, odczytu rekordow,
   obslugi konfliktu, klasyfikacji bledow i zamkniecia polaczenia.
4. Dodac sterownik PostgreSQL jako jawna zaleznosc dopiero wtedy, gdy
   istnieje srodowisko integracyjne z prawdziwym serwerem PostgreSQL.
5. Utworzyc docelowy schemat PostgreSQL w wersjonowanych migracjach.
   Produkcyjny PostgreSQL nie moze polegac na startowym DDL z `init_db`.
6. Przeniesc zapytania repozytoriow na jawny dialekt PostgreSQL. Nie
   stosowac ogolnego, niekontrolowanego zamieniania tekstu SQL.
7. Dla licznikow, sald, intentow, voucherow i refundow zastosowac atomowe
   warunki `UPDATE`, blokady rekordow lub inne mechanizmy wspolbieznosci
   PostgreSQL zachowujace obecne reguly biznesowe.
8. Zachowac kwoty jako jednostki calkowite. Migracja nie moze przywrocic
   `REAL`, `FLOAT` ani binarnych obliczen pieniedzy.
9. Uruchomic ten sam zestaw testow repozytoriow na SQLite i PostgreSQL,
   a testy wspolbieznosci oraz rollbacku dodatkowo na PostgreSQL.
10. Przygotowac narzedzie kontrolowanego eksportu i importu danych oraz
    raport liczby rekordow, sum sald i zgodnosci lancuchow przed i po
    migracji.
11. Wykonac probe migracji na kopii danych, potem smoke test wszystkich
    klientow: TUI, Flask, `client_api`, `hub_api`, `client-app` i `hub-app`.
12. Produkcyjne przelaczenie wykonac w oknie serwisowym po zatrzymaniu
    writerow SQLite. Nie stosowac niekontrolowanego dual-write.
13. Zachowac kopie SQLite tylko do rollbacku i audytu. Po zatwierdzeniu
    migracji PostgreSQL staje sie jedynym zrodlem prawdy.

#### 34.23.5. Kryteria odbioru PostgreSQL

Migracja jest zakonczona dopiero, gdy:

1. Wszystkie aplikacje korzystaja z jednej skonfigurowanej fabryki
   polaczen i nie otwieraja SQLite poza narzedziem migracyjnym.
2. Schemat PostgreSQL powstaje z wersjonowanych migracji.
3. Przechodza testy sald, splitow, mint, KES/VKES, payment intents,
   przedplat, refundow, paczek, workow i sesji.
4. Podwojne rownolegle zadanie nie moze wykonac podwojnego zwrotu,
   rozliczenia, intake, odbioru worka ani rezerwacji kodu.
5. `package_events`, `bag_events`, `wallet_ledger` i
   `wallet_signatures` zachowuja zasade append-only oraz zgodne
   `seq`, hash, HMAC, TX i fingerprint.
6. Blad dowolnego kroku operacji wycofuje cala transakcje.
7. Po migracji zgadzaja sie liczby rekordow, salda kont i wyniki audytow.
8. Test zatrzymania jednego API nie zatrzymuje drugiego, a zatrzymanie
   jednego hosta aplikacji nie uszkadza wspolnej DB.
9. Backup, restore i rollback zostaly przetestowane, a nie tylko opisane.
10. Wyniki testow obciazeniowych i blokad sa zapisane jako punkt odniesienia
    dla dalszego strojenia.

#### 34.23.6. Status

- Punkt 22: `ZAMKNIETY` dla SQLite/POC.
- Adapter PostgreSQL: `PRZYSZLE ZADANIE`, niewymagane obecnie.
- Strojenie czestotliwosci synchronizacji: po pomiarach obciazenia.
- Do czasu migracji SQLite pozostaje jedynym zrodlem prawdy i nie jest
  uruchamiany rownolegle z drugim silnikiem DB.

### 34.24. Usuniecie operacyjnej fasady `db_storage.py`

1. Operacyjny kod nie importuje juz z `db_storage.py` koordynatorow commitow,
   obslugi sesji staff ani administracji huba.
2. Koordynacje zapisu runtime wykonuje
   `runtime_operation_repository.py`. Modul sklada repozytoria topologii,
   snapshotu runtime, paczek, eventow, workow, inventory, payment intents
   i ledgera na jednym przekazanym polaczeniu.
3. Start i zakonczenie sesji staff wykonuje
   `staff_session_repository.py`. Zachowuje rozpoznanie `person_id`,
   `staff_id`, PIN, zrodlo logowania i wspolny `login_sessions`.
4. Operacje administracyjne huba dla Flask sa obslugiwane przez
   `hub_admin_service.py`, ktory korzysta z `hub_admin_repository.py` i
   zachowuje wymagane wpisy `system_logs` dla geometrii huba.
5. TUI pobiera metadane huba bezposrednio z `hub_admin_repository.py`.
6. `courier_logic_poc.py` pobiera operacyjne commitery, sesje staff,
   walidacje geometrii i append ledgera bezposrednio z odpowiednich modulow.
7. `flask_server.py` korzysta bezposrednio z koordynatora runtime, serwisu
   administracji huba i repozytorium sesji staff.
8. Pozostale importy `db_storage.py` sa celowe: `init_db` przygotowuje
   schemat, a `load_runtime_topology` wykonuje rehydracje obiektow domenowych
   przekazanych przez runtime. Rehydracja nie jest operacyjnym repozytorium
   SQL i pozostaje osobna warstwa koordynacji.
9. `config_manifest_sync.py` i `hub_api.py` korzystaja z `init_db` tylko
   podczas startu, zgodnie z granica schematu/migracji.
10. Test architektoniczny blokuje powrot importow operacyjnych delegatow
    z `db_storage.py` do `courier_logic_poc.py`, `flask_server.py` i
    `terminal_ui.py`.
11. Weryfikacja po refaktorze: `355 passed`, kompilacja zmienionych modulow
    oraz importy Flask, TUI i runtime zakonczone poprawnie.
12. Zmiana nie dodaje tabel ani kolumn i nie zmienia kontraktow API,
    transakcji, ledgera ani zasad synchronizacji DB.


## Zasada walidacji numerow telefonu

System uzywa biblioteki `phonenumbers` jako jednego zrodla prawdy dla
walidacji i formatowania numerow. Numer wpisany bez `+` jest domyslnie
kenijski i otrzymuje prefiks `+254`. Numer wpisany z `+` jest analizowany
wedlug podanego prefiksu miedzynarodowego.

Biblioteka rozpoznaje kod kraju oraz mozliwe dlugosci krajowej czesci numeru.
Frontend nie stosuje stalego limitu 15 cyfr: licznik i blokada pola odnosza
sie do krajowej czesci numeru, bez prefiksu. Wyszukiwanie po telefonie jest
uruchamiane od trzeciej cyfry krajowej czesci, a nie od pierwszej cyfry
prefiksu. W `hub-app` wyniki sa pokazywane jako podpowiedzi i po wyborze
uzupelniaja dane osoby. `client-app` korzysta z dokladnego wyszukania po
zatwierdzeniu pola, bez listowych podpowiedzi.

## 35. Obowiazujacy model formularza nadania paczki (2026-07-28)

Ponizszy rozdzial jest aktualnym kontraktem zachowania formularza dla
`client_api`/`client-app` oraz `hub_api`/`hub-app`. Starsze opisy formularza
nalezy traktowac jako historyczne, jezeli roznia sie od tego rozdzialu.

### 35.1. Pola i kolejnosc

W sekcji `Nadawca` i `Odbiorca` pola sa przetwarzane w kolejnosci:
`ID -> telefon -> email -> imie/nazwa -> nazwisko/pelna nazwa -> adres`.
Dla firmy dochodza `TAX/KRA/PIN` oraz `Kraj podatkowy`. Frontend moze pokazac
wycene robocza, ale cena, dane stron i utworzenie paczki sa ostatecznie
sprawdzane przez backend.

### 35.2. ID i wyszukiwanie

- ID jest zamieniane na wielkie litery; hasla i PIN-y pozostaja bez zmian.
- `hub-app` pokazuje aktywne podpowiedzi po pierwszym znaku i filtruje je po
  kazdej zmianie.
- Zwykle ID sa wyszukiwane w `persons`. Prefiksy `C`, `W`, `M` i `O` szukaja
  aktywnych wpisow staff oraz ich powiazanych `person_id`.
- Prefiks `B` nie szuka staff. Samo `B` oznacza nowa firme, a pelne `B...`
  oznacza istniejacy identyfikator firmy.
- Gdy jedna podpowiedz jest identyczna z wpisanym ID, lista znika. Po
  usunieciu znaku wraca, jezeli wynik nie jest juz identyczny.
- Po rozpoznaniu staff ID pracownik nadal widzi staff ID. Backend tymczasowo
  mapuje je na `person_id`; dopiero udane nadanie zapisuje `person_id` jako
  identyfikator strony paczki.

`client-app` nie pokazuje prefiksowej listy ID. Pelne ID jest sprawdzane po
`Tab`, `Enter` albo opuszczeniu pola. Dane rozpoznanej osoby sa pobierane z
DB, a nie skladane lokalnie.

### 35.3. Telefon i email

- Numer bez `+` jest traktowany jako kenijski i otrzymuje `+254`.
- Numer z `+` jest analizowany wedlug kraju przez biblioteke `phonenumbers`.
- Licznik telefonu obejmuje tylko krajowa czesc numeru, bez prefiksu kraju.
- Wyszukiwanie telefonu zaczyna sie po trzech cyfrach czesci krajowej.
- Wyszukiwanie emaila zaczyna sie po trzech znakach przed `@`.
- `hub-app` pokazuje podpowiedzi telefonu i emaila, a `client-app` wykonuje
  tylko dokladne wyszukanie po zatwierdzeniu pola.
- Po poprawnej walidacji telefon jest formatowany po opuszczeniu pola i
  oznaczany na zielono. Bledny telefon lub email jest oznaczany na rozowo.
- Jednoznaczne dopasowanie aktywnej osoby uzupelnia pozostale dane z DB.
  Wynik niejednoznaczny nie jest wybierany automatycznie.

### 35.4. Podpowiedzi i klawisze w hub-app

Podpowiedzi sa osobnym nakladanym oknem, wiec nie zmieniaja wysokosci
formularza. Najpierw sa pokazywane nad polem, a przy wiekszej liczbie wynikow
pozostala czesc pod polem.

- `Tab` ukrywa podpowiedzi i przechodzi dalej; ponowne wejscie filtruje je od nowa.
- `Shift+Tab` wraca do poprzedniego pola.
- Strzalki nawiguja po podpowiedziach, ale same nie wpisuja wyboru.
- `Spacja` zatwierdza jedyna lub zaznaczona podpowiedz.
- `Enter` zatwierdza podpowiedz i przechodzi do nastepnego pola.
- `Backspace` usuwa jeden znak ID i czysci dane tej osoby, pozostawiajac
  skrocone ID do dalszego filtrowania.
- `Delete` czysci cale ID i dane osoby.
- Drugie `Delete` w krotkim czasie czysci cala sekcje osoby tylko wtedy, gdy
  pierwsze usuniecie faktycznie usunelo zawartosc. Inny klawisz lub klikniecie
  anuluje drugie usuniecie.

### 35.5. Znacznik B i tworzenie firmy

Wpisanie samej litery `B` przelacza formularz na firme. Wymagane sa nazwa,
pelna nazwa, telefon, adres, `business_tax_id` i `business_tax_country`;
email, jezeli jest podany, musi przejsc walidacje.

TAX nie jest sprawdzany pod katem unikalnosci. Rozne firmy moga miec ten sam
TAX. Telefon i email pozostaja unikalne; konflikt jednego z nich zatrzymuje
operacje.

Firma jest tworzona atomowo razem z udanym nadaniem lub platnoscia. Po sukcesie
znacznik `B` zostaje zastapiony wygenerowanym ID `B...`, ktore trafia do
`persons` i rekordu paczki. Blad walidacji, platnosci albo zapisu wycofuje
calosc i nie pozostawia osieroconej firmy.

Zasady te sa wspolne dla `client-app` i `hub-app`; roznica polega na tym, ze
tylko `hub-app` pokazuje prefiksowe podpowiedzi i pozwala pracownikowi na
korekty kontaktu rozpoznanej osoby.

### 35.6. Tymczasowa zasada wyboru konta dla PUSH VKES w hub-app

Przy platnosci `PUSH VKES` za paczke nadawana w hubie pracownik nie wybiera,
nie wpisuje i nie zmienia `payer_account_id`. System automatycznie wybiera
aktywne domyslne konto VKES nadawcy oznaczone w `wallet_accounts` przez:

- `currency = 'VKES'`,
- `is_default = 1`,
- aktywny stan konta (`is_archived = 0`),
- zgodnosc wlasciciela konta z rozpoznanym `person_id` albo biznesowym ID
  nadawcy.

Zrodlem prawdy jest flaga `is_default`, a nie tekstowy sufiks `-MAIN`.
Interfejs moze nazywac takie konto `MAIN`, ale backend nie wyznacza go przez
analize nazwy `account_id`.

Nie wolno stosowac fallbacku do pierwszego, ostatniego ani dowolnego innego
konta VKES nadawcy. Brak jednego aktywnego konta domyslnego, blokada konta,
brak uprawnienia do przelewu albo niewystarczajace saldo zatrzymuja utworzenie
PUSH i zwracaja pracownikowi jednoznaczny komunikat.

Po poprawnej walidacji backend zapisuje konkretne domyslne `payer_account_id`
w `payment_intents` i przechodzi do `awaiting_push`. Do czasu wdrozenia
rozszerzonego wyboru kont zasada ta jest obowiazujacym uproszczeniem
systemowym dla `hub-app`; panel huba nie udostepnia listy pozostalych kont
nadawcy.

## 36. Warstwa HTTP Hub API po migracji na ASGI (2026-07-29)

### 36.1. Obowiazujacy stos

`hub_api` nie korzysta juz z Flask, Werkzeug ani wbudowanego serwera
deweloperskiego. Obowiazujacy stos to:

- FastAPI jako warstwa HTTP,
- Pydantic jako walidacja kontraktu transportowego,
- ASGI jako interfejs serwera,
- Granian jako proces serwera,
- `hub-app` jako osobny frontend React/Vite.

Proces jest uruchamiany przez:

```text
python -m granian --interface asgi --host 0.0.0.0 --port 5002 \
  --workers 1 kenya_courier.interfaces.hub_api:app
```

`hub_api.py` udostepnia fabryke `create_app(db_path)` oraz globalne
`app = create_app()`. Plik jest composition root i zawiera tylko lifecycle,
middleware, rejestracje routerow oraz obsluge statycznego frontendu.

Podzial modulow:

- `hub_api_auth.py`: PIN, JWT, sesja, `HubPrincipal` i dependency auth,
- `hub_api_contracts.py`: modele Pydantic,
- `hub_api_responses.py`: wspolne odpowiedzi i handlery JSON,
- `hub_api_routes/auth.py`: login, me i logout,
- `hub_api_routes/events.py`: token, stream i disconnect SSE,
- `hub_api_routes/context.py`: health i kontekst huba,
- `hub_api_routes/clients.py`: osoby, staff, telefon i email,
- `hub_api_routes/parcels.py`: reguly, trasa, walidacja, konta i nadanie.

FastAPI nie przejmuje logiki domenowej. Operacje paczek, platnosci, tras,
osob i kont nadal przechodza przez `HubService`, repozytoria i wspolne
moduly domenowe. Routery nie wykonuja SQL.

### 36.2. Lifecycle i ograniczenie SQLite

Przed przyjeciem ruchu lifespan FastAPI inicjalizuje wymagane schematy,
sesje i rate limit. Blad inicjalizacji zatrzymuje start procesu.

Przy zamknieciu procesu:

- adapter post-commit jest wyrejestrowywany,
- streamy SSE sa zamykane,
- polaczenia kontrolne repozytorium sa zwalniane.

Do czasu migracji z SQLite i procesowego runtime Hub API dziala z jednym
workerem Granian. Lokalny runtime i lokalny broker SSE nie moga byc
niezaleznie powielone przez wiele workerow. Wiele instancji wymaga wspolnego
stanu i brokera/outboxu.

### 36.3. Kontrakt REST i Pydantic

Dotychczasowe 21 tras REST zachowuje prefiks `/hub-api`, metody HTTP oraz
odpowiedzi JSON wymagane przez `hub-app`. Modele Pydantic sprawdzaja ksztalt
requestu, ale nie zastepuja walidacji domenowej.

Formularz paczki przekazuje do `HubService` tylko pola faktycznie wyslane
przez frontend. Domyslne pola modelu transportowego nie moga nadpisywac
tagu, sposobu odbioru, ceny ani innych wartosci ustalanych przez serwis.

Kazdy blad `/hub-api/...` ma format JSON. Bledny JSON i bledy Pydantic sa
mapowane na `400` dla zgodnosci z dotychczasowym UI. Brak autoryzacji daje
`401`, brak zasobu `404`, zla metoda `405`, konflikt `409`, rate limit `429`,
brak gotowosci `503`, a nieobsluzony blad `500` bez ujawniania szczegolow.

CORS dopuszcza tylko originy jawnie zapisane w `HUB_API_CORS_ORIGINS`.

### 36.4. Sesja i tokeny

Glowny JWT pracownika wymaga:

- poprawnego podpisu,
- `aud=hub_api`,
- `typ=hub_staff_session`,
- aktywnego `jti` w `login_sessions`,
- aktywnego `staff_id`,
- zgodnosci aktualnego przypisania pracownika do huba.

Rola i hub zapisane w tokenie nie sa zrodlem prawdy; sa ponownie sprawdzane
w DB. PIN zachowuje rate limit, a logout zamyka konkretna sesje.

Hub API wymaga osobnego `HUB_API_TOKEN_SECRET` o dlugosci minimum 32
bajtow. Nie wolno uzywac `CLIENT_API_TOKEN_SECRET` jako fallbacku ani
`VKES_HMAC_KEY` jako sekretu JWT. Brak osobnego sekretu blokuje wydawanie
i weryfikacje tokenow Hub API. Zmiana sekretu uniewaznia wszystkie
dotychczasowe sesje Hub API i wymaga ponownego logowania pracownikow.

Token SSE jest osobnym, krotkotrwalym JWT:

- `aud=hub_api_sse`,
- `typ=hub_sse_session`,
- ten sam `staff_id`, `session_id` i `hub_name`,
- brak prawa wykonywania operacji REST.

### 36.5. Obowiazkowy kanal SSE

Hub API udostepnia:

1. `POST /hub-api/events/token`,
2. `GET /hub-api/events`,
3. `POST /hub-api/events/disconnect`.

Minimalne zdarzenia:

- `ready`,
- `hub_context_update`,
- `hub_accounts_update`,
- `staff_presence_update`,
- `parcel_update`,
- `payment_intent_update`,
- `network_update`,
- `session_closed`.

Kolejka jest izolowana wedlug huba, pracownika i sesji. Zdarzenie huba AA
nie moze trafic do huba BA. Stream ma keepalive, limit kolejek, TTL i
kontrolowane zamkniecie po logout, rozlaczeniu albo utracie sesji.

Frontend wywoluje endpoint tokenu, ktory ustawia krotkotrwale cookie
`HttpOnly`, otwiera `EventSource` bez tokenu w URL i automatycznie ponawia
polaczenie. Zdarzenie jest sygnalem do pobrania autorytatywnego stanu REST;
nie jest komenda finansowa ani zrodlem prawdy.

Otwarty panel Hub Finance ma jednego wlasciciela odswiezania: chroniony
snapshot `GET /hub-api/finance/cash-exchange` aktualizuje wspolne
`context.accounts`, dostepnosc i biezaca wymiane. Odczyt kontekstu w tle
nie nadpisuje tych kont swoim starszym wynikiem. Zdarzenia kont (takze
przelewow/HOLD), uprawnien, platnosci, wymiany i jej dostepnosci oraz
`ready`/`stream_reset` invaliduja snapshot i aktualnie wybrana historie.
Sama tresc push nie zastepuje snapshotu operacji.

Odnowienie SSE nie resetuje konta/okresu ani lokalnych filtrow historii.
Dane liczenia gotowki pozostaja przy tej samej `intent_id`; nowa operacja
zaczyna pusty formularz. Konto bez prawa odczytu traci zaznaczenie.
Generacja odczytu i tozsamosc sesji/huba odrzucaja spoznione wyniki;
paginacja nie moze dolaczyc starej strony do nowego wyboru.

Invalidacje sa scalane w jednym wlascicielu odswiezania i korzystaja
z tego samego harmonogramu co komendy. GET ma ograniczony czas oraz
maksymalnie trzy proby znanej invalidacji; po ich wyczerpaniu mozliwe jest
jawne ponowienie albo ponowienie przy online/focus. Poprawnie uzgodniony
panel nie wykonuje okresowego pollingu. Nie ponawia sie automatycznie
komend finansowych; blad odczytu nie kasuje bledu ani potwierdzenia komendy.
Komendy maja pierwszenstwo przed oczekujacymi odczytami, z FIFO miedzy
komendami. Trwajacy GET konczy sie albo osiaga timeout 10 s; trwajacy POST
nie jest anulowany. Dla ochrony odswiezen przed zaglodzeniem po czterech
komendach dopuszczany jest jeden oczekujacy GET. Pilne zamkniecie
dostepnosci po deadline pomija ten wyjatek, ale nie wyprzedza wczesniejszych
komend. Burst push nie tworzy kolejki kolejnych kopii tego samego odczytu.
Wynik komendy trafia do karty od razu; busy zapisu nie czeka na uzgodnienie
sald/historii. Zamkniecie kontekstu odrzuca oczekujace requesty i blokuje
stare wyniki, bez anulowania juz wyslanego zapisu. Aktualny kontekst
uzgadnia jego skutki przez chroniony snapshot, nie przez ponowienie POST.
Odpowiedz `already_processed` oznacza potwierdzenie wczesniejszego
rozliczenia, nie nowy sukces finansowy. UI pokazuje jawny komunikat;
zwykly odczyt w tle go nie kasuje. Wspolne wdrozenie: task 38.4 i 38.8.

Otwarty Sorting uzgadnia chroniony snapshot pracy po `ready`/reconnect
oraz `stream_reset`, nawet gdy `work_id` jest bez zmian. Jedyny wlasciciel
snapshotu scala burst invalidacji i odrzuca wyniki poprzedniej generacji,
sesji lub starszej rewizji. Komenda uniewaznia wczesniejszy GET, nigdy
nie anuluje POST; po wyniku uzgadnia prace ponownie. Zakonczona/usunieta
praca nie wraca ze spoznionej odpowiedzi. Pusty snapshot biezacego fokusa
nie jest rownowazny trwalemu zakonczeniu: ten sam OPEN work moze wrocic
przez nowy autorytatywny odczyt. Formularz i zaznaczenie pozostaja tylko
dla nadal dostepnej paczki w tej samej pracy i tej samej planowanej akcji.
Odczyty sa ograniczone czasowo i liczba prob, z jawnym retry, bez pollingu.
Odmowa spoznionej decyzji innej sesji pozostaje widoczna po uzgodnieniu;
pierwszy poprawny commit wygrywa w DB, nie w kolejce przegladarki (task 38.5).

#### 36.5A. Transport tokenu SSE: Hub API i Client API

Token SSE w obu aplikacjach jest osobnym, krotkotrwalym JWT bez prawa do
wykonywania operacji REST. Ponizsze zasady dotycza sposobu przekazania tokenu
do `EventSource`, a nie jego przeznaczenia ani zakresu uprawnien:

1. `client_api` zapisuje token SSE w cookie `HttpOnly`, a przegladarka
   dolacza cookie automatycznie do
   `GET /client-api/events/{connection_id}/{stream_id}`. Cookie ma sciezke
   jednej generacji jednej karty. Kod JavaScript nie odczytuje tokenu;
   identyfikatory dokumentu/generacji w URL nie sa tokenem logowania.
2. `hub_api` stosuje ten sam model: `POST /hub-api/events/token` ustawia
   cookie `kc_hub_sse`, a `GET /hub-api/events` odczytuje token z cookie.
3. Cookie `HttpOnly` jest preferowanym transportem. Ogranicza ryzyko
   zapisania tokenu w historii adresow, logach reverse proxy, diagnostyce,
   zrzutach ekranu albo przypadkowo skopiowanym adresie.
4. Samo cookie nie zastepuje tokenu. Token nadal jest podpisanym JWT, lecz
   jego przechowywanie i przesylanie obsluguje przegladarka. `SameSite=Strict`,
   ograniczony `Path`, krotki TTL oraz `Secure` przy HTTPS sa obowiazkowe.
5. Przekazywanie tokenu SSE w query string jest zabronione w obu aplikacjach.
   Token nie moze trafic do historii adresow, logow reverse proxy, diagnostyki,
   zrzutow ekranu ani przypadkowo skopiowanego adresu.
6. Token SSE pozostaje oddzielony od glownego JWT sesji pracownika albo
   klienta. Cookie zmienia jedynie bezpieczny sposob transportu, a nie
   semantyke zdarzen i uprawnien.

### 36.6. PUSH VKES wykonany w innym procesie

Akceptacja PUSH odbywa sie w procesie `client_api`, dlatego lokalna kolejka
Hub API nie jest wystarczajaca. Kazdy zapis `payment_intent_events` tworzy w
tej samej transakcji typowany `PostCommitEvent`. Po `COMMIT` dispatcher:

1. kieruje `payment_intent_update` do payera/payee i osob z `can_view`,
2. wyznacza konkretny `hub_code2`,
3. przekazuje event prywatnym mostem HTTP do procesu Hub API,
4. publikuje go do kolejek SSE tylko tego huba.

Nie istnieje cykliczny odczyt tabeli intentow. Po reconnect Hub SSE wykonuje
jednorazowy snapshot aktywnych intentow z DB. Utrata nietrwalego eventu nie
moze zgubic platnosci ani ponowic rozliczenia; DB pozostaje zrodlem prawdy.
Po odebraniu statusu `authorized` panel huba ponownie wysyla ten sam formularz
z `payment_intent_id`. Backend ponownie sprawdza trase, cene, nadawce, hub,
saldo i domyslne konto VKES. Utworzenie paczki oraz przejscie intenta do
`settled` nastepuja w jednym commicie domenowym. Ponowienie z intentem juz
rozliczonym zwraca istniejacy `package_id` i nie tworzy drugiej paczki.

#### 36.6A. Obecnosc klienta przy PUSH za paczke

`parcel_payment_request` utworzony przez hub jest kontrolowany inaczej niz
zwykly szybki PUSH klient-klient. Brak aktywnego Client SSE nie anuluje
intenta i nie zmienia `awaiting_push`. Pracownik widzi `online` albo `offline`
i moze czekac na zalogowanie klienta albo jawnie przerwac operacje.

Obecnosc jest stanem nietrwalym:

1. Client API wyznacza ja z istniejacych kolejek SSE w pamieci procesu.
2. Hub API wykonuje jedno sprawdzenie po utworzeniu PUSH oraz jedno po
   reconnect Hub SSE.
3. Kolejne przejscia `online/offline` sa wysylane zdarzeniowo przez prywatny
   most HTTP miedzy procesami i dalej przez istniejacy Hub SSE.
4. Prywatne endpointy wymagaja wspolnego `X-KC-Internal-Secret` i nie sa
   publikowane w OpenAPI.
5. Nie istnieje tabela obecnosci, heartbeat SQL ani nowa kolumna intenta.
6. Zdarzenie obecnosci nie zmienia statusu, salda ani uprawnien.

##### 36.6A.1. Bezpieczenstwo prywatnego mostu HTTP

Naglowek `X-KC-Internal-Secret` uwierzytelnia komunikacje proces-proces, ale
tylko wtedy, gdy jego wartosc jest rzeczywistym sekretem. Stala wartosc
domyslna zapisana w kodzie jest publiczna dla kazdego, kto zna repozytorium,
i nie stanowi zabezpieczenia. Ukrycie endpointu w OpenAPI rowniez nie ogranicza
dostepu sieciowego.

Poprzedni, wykryty przez audyt model lokalnego POC:

1. Client API i Hub API dzialaja na tym samym komputerze, a most laczy sie
   przez `127.0.0.1`.
2. Istnial fallback `kenya-courier-local-presence`. Poniewaz serwery Granian
   sluchaja na `0.0.0.0`, prywatna trasa byla osiagalna rowniez z sieci LAN.
3. Osoba znajaca fallback moglaby falszywie zglosic `online` albo `offline`.
   Nie moglaby tym endpointem przelac srodkow ani zaakceptowac platnosci,
   poniewaz endpoint weryfikuje istniejacy intent i publikuje tylko nietrwaly
   sygnal prezentacyjny. Falszywy stan nadal moze jednak wprowadzic pracownika
   huba w blad, dlatego wymaga naprawy.

Wdrozony model przedprodukcyjny dla jednego komputera:

1. Oba procesy otrzymuja ten sam losowy `KC_INTERNAL_PRESENCE_SECRET` o
   dlugosci co najmniej 32 bajtow.
2. Sekret jest przekazywany przez srodowisko albo magazyn sekretow. Nie trafia
   do kodu, repozytorium, `config.yaml`, DB ani `hub_manifest.yaml`.
3. Brak albo zbyt krotki sekret zatrzymuje start API. Zabroniony jest fallback
   do stalej wartosci, pustego sekretu lub sekretu JWT/HMAC ledgera.
4. Prywatne endpointy przyjmuja polaczenia tylko z systemowego adresu klienta
   `127.0.0.1` albo `::1`. Nie ufaja `X-Forwarded-For`, jezeli nie ma jawnie
   skonfigurowanego zaufanego proxy.
5. Sekret jest porownywany w stalym czasie. Odmowa nie publikuje zdarzenia SSE
   i nie ujawnia, ktora czesc uwierzytelnienia byla bledna.

Docelowy model po rozdzieleniu API na osobne serwery:

1. Ograniczenie localhost zostaje zastapione uwierzytelnieniem usluga-usluga.
2. Kazde zadanie jest podpisane HMAC z metody HTTP, sciezki, pelnego payloadu,
   timestampu i jednorazowego nonce. Odbiorca sprawdza podpis, krotkie okno
   czasu i brak ponownego uzycia nonce.
3. Transport korzysta z TLS. Statyczny sekret przesylany samodzielnie w
   naglowku nie jest wystarczajacym modelem docelowym dla polaczenia
   miedzyserwerowego.
4. Nawet poprawnie uwierzytelniony most moze tylko odczytac/publikowac stan
   obecnosci. Nie otrzymuje prawa do zmiany statusu intenta, salda, ledgera ani
   paczki. Operacje finansowe nadal przechodza przez kanoniczne komendy domeny
   i autorytatywny zapis DB.

Lokalna czesc naprawy jest zakonczona i oznaczona w `task_futur.md`.
Otwarty pozostaje tylko HMAC/TLS wymagany po rozdzieleniu API na osobne
serwery.

Po stronie klienta oczekujacy hubowy PUSH przenosi przegladarke do
`Finanse`. Interfejs pozwala zaakceptowac lub odrzucic platnosc oraz wykonac
przelew z innego wlasnego konta VKES na konto oznaczone aktualnie
`is_default=1`. Nazwa `MAIN` jest w tym komunikacie nazwa funkcjonalna, a nie
wymuszeniem literalnego aliasu `MAIN`. Pozostale
akcje sa czasowo ukryte albo nieaktywne wylacznie w UI. Client API nie dodaje
z tego powodu blokady endpointow; jest to prowadzenie klienta przy stanowisku,
a nie granica bezpieczenstwa.

Blokada obejmuje tworzenie kont, zmiane konta domyslnego, zaproszenia do kont,
inne payment intenty oraz koperte platnosci. Odczyt kont i historii pozostaje
dostepny, aby klient mogl wybrac konto zrodlowe i sprawdzic stan. Nieudany
odczyt historii, kont albo zaproszen nie moze skasowac blokady. Blokada jest
zdejmowana dopiero po udanym, autorytatywnym odczycie listy oczekujacych
payment intentow albo terminalnym zdarzeniu SSE.

Zdarzenie `authorized` moze dotrzec przez SSE przed odpowiedzia HTTP tworzaca
PUSH. Hub App buforuje takie zdarzenie wedlug `intent_id`, scala je z
odpowiedzia REST i natychmiast uruchamia finalizacje. Bufor jest ograniczony,
a zdarzenie innego intenta nie moze zmienic aktualnie obslugiwanej platnosci.
Wywolania mostu HTTP podczas rejestracji i zamkniecia Client SSE sa wykonywane
poza petla zdarzen ASGI, aby niedostepny drugi proces nie blokowal pozostalych
requestow i streamow.

#### 36.6B. Kontrola dostepnosci PUSH VKES w formularzu huba

Hub App nie pobiera ani nie pokazuje salda klienta podczas podsumowania.
Kazde otwarcie listy metod platnosci mysza, dotykiem albo klawiatura wywoluje
nowa walidacje domyslnego konta VKES nadawcy. Odpowiedz zawiera tylko:

- `available`,
- `reason=available|insufficient_funds|account_unavailable|invalid_form`.

Opcja `PUSH VKES` jest zielona, gdy aktualna kontrola przeszla. Brak srodkow
daje czerwone `PUSH VKES, BRAK SRODKOW`, a pozostala niedostepnosc czerwone
`PUSH VKES, NIEDOSTEPNE`. Nie ma dodatkowego komunikatu pod lista i wynik nie
jest trwala decyzja. Wlasciwe wyslanie PUSH zawsze ponawia kanoniczna
walidacje, poniewaz saldo moglo zmienic sie po sprawdzeniu listy.

Lista metod platnosci jest kontrolowanym komponentem Hub App, a nie natywnym
`select`, dlatego wynik asynchronicznej kontroli zmienia kolor i tekst rowniez
w otwartym menu. Zmiana nadawcy, trasy, ceny albo danych formularza uniewaznia
poprzednie zapytanie, zamyka liste i przywraca stan `unknown`. Sama zmiana
wybranej metody `HUB/VKES` nie uniewaznia wyniku dla niezmienionej paczki.

### 36.7. Uruchomienie i testy

`start_hub_app.bat` uruchamia Granian na porcie `5002` i Vite na porcie
`3002`. Port backendu moze zostac przejety tylko od procesu rozpoznanego jako
Granian z targetem `kenya_courier.interfaces.hub_api:app`.

Obowiazkowy gate obejmuje:

- kontrakt REST,
- bledy JSON i CORS,
- JWT, sesje i rate limit,
- izolacje SSE,
- prawdziwy proces Granian,
- `ready`, zdarzenie i rozlaczenie streamu,
- zmiane statusu intenta zapisana drugim procesem,
- build `hub-app`,
- pelne testy domeny finansowej i paczkowej.

Migracja warstwy HTTP nie dodaje tabel ani kolumn do DB.

Statyczne endpointy wyszukiwania sa rejestrowane przed dynamicznym
`/hub-api/clients/{person_id}`. Jest to wymagane przez routing FastAPI, aby
`/hub-api/clients/search` nie zostalo zinterpretowane jako klient o ID
`search`.

## 37. Warstwa HTTP Client API po migracji na ASGI (2026-07-29)

### 37.1. Obowiazujacy stos i izolacja procesu

Publiczny `client_api` korzysta z:

- FastAPI,
- Pydantic,
- ASGI,
- Granian,
- React/Vite `client-app`,
- REST/JSON dla komend i odczytow,
- SSE dla jednokierunkowego push.

Uruchomienie:

```text
python -m granian --interface asgi --host 0.0.0.0 --port 5001 \
  --workers 1 kenya_courier.interfaces.client_api:app
```

Client API i Hub API sa niezaleznymi procesami. Nie importuja swoich
warstw HTTP i nie wspoldziela endpointow. Korzystaja ze wspolnej domeny,
repozytoriow i DB. Awaria jednego procesu nie moze bezposrednio zatrzymac
drugiego.

### 37.2. Warstwy Client API

- `client_api.py`: composition root, lifecycle, CORS, routery i SPA,
- `client_api_contracts.py`: modele Pydantic,
- `client_api_auth.py`: transportowa fasada auth i principal,
- `client_api_responses.py`: JSON i handlery bledow,
- `client_api_transport.py`: izolowany request context,
- `client_api_sse.py`: natywny stream ASGI blokujacy na kolejce zdarzen,
- `client_api_handlers.py`: framework-neutralna orkiestracja przypadkow
  uzycia,
- `client_api_routes/`: routery tematyczne.

Warstwa HTTP nie wykonuje SQL. Operacje finansowe i paczkowe przechodza
przez serwisy, `finance_core`, `courier_logic_poc` i repozytoria.

Kazda operacja HTTP w `client_api_routes/` musi miec jawny dekorator
FastAPI, jawna metode, sciezke, model Pydantic i typowane parametry
sciezki. Zabroniona jest centralna tabela tras oraz dynamiczna
rejestracja przez `SPECS`, `router.add_api_route()` albo dobor modelu
requestu na podstawie tekstowej nazwy handlera.

Wspolny adapter routerow moze tylko utworzyc izolowany request context,
uruchomic istniejacy synchroniczny handler w threadpoolu i znormalizowac
odpowiedz. Nie moze podejmowac decyzji o routingu, autoryzacji domenowej,
modelu requestu ani przypadku uzycia. Dzieki temu deklaracja endpointu
jest czytelna w jednym pliku, widoczna dla IDE, Pydantic i OpenAPI oraz
zgodna z modelem routerow Hub API.

### 37.3. Kontrakt i walidacja

Client API zachowuje prefiks `/client-api`, dotychczasowe nazwy pol oraz
kody HTTP wymagane przez `client-app`.

Kontrakt ma:

- `62` unikalne sciezki,
- `64` operacje HTTP,
- JSON z polem `ok`,
- JSON z `error` i opcjonalnym `field_errors` przy bledzie.

Pydantic sprawdza dane transportowe. Nie zastepuje walidacji:

- salda,
- uprawnien,
- custody,
- podpisu,
- konta,
- payment intenta,
- trasy,
- ceny,
- paczki.

Bledny JSON i blad Pydantic daja `400`. Brak sesji daje `401`, brak prawa
`403`, brak zasobu `404`, zla metoda `405`, konflikt `409`, rate limit
`429`, blad serwera `500`, a brak gotowosci `503`. Endpoint API nie zwraca
strony HTML bledu.

Trasy `phone-lookup`, `email-lookup` i `lookup/verify` sa rejestrowane
przed dynamicznym `/clients/{client_id}`.

### 37.4. Tokeny i sesje

Client API zachowuje:

- `client_session`,
- `client_sse`,
- `courier_context`.

Glowny JWT wymaga `CLIENT_API_TOKEN_SECRET` dluzszego niz 32 bajty i
roznego od `VKES_HMAC_KEY`. Kazdy chroniony request sprawdza aktywny
`jti` w `login_sessions`, aktywna tozsamosc oraz typ aktora.

Konto systemowe nie moze logowac sie przez publiczny Client API.
`password_must_change` ogranicza dostep do dozwolonych endpointow do
czasu zmiany hasla. Logout zamyka konkretna sesje.

Token kuriera jest dodatkowym kontekstem `staff_id`, a nie zamiennikiem
sesji klienta. Operacja wykonana w trybie staff zachowuje prawdziwego
aktora personelu.

### 37.5. SSE klienta

Obowiazkowe endpointy:

1. `POST /client-api/events/token`,
2. `GET /client-api/events/{connection_id}/{stream_id}`,
3. `POST /client-api/events/disconnect`.

Stream:

- rozpoczyna sie zdarzeniem `ready`,
- obsluguje `finance_update` i `finance_error`,
- ma keepalive,
- ma limity kanalow oraz waznosc JWT ograniczona waznoscia prywatnej sesji,
- izoluje zdarzenia wedlug ownera,
- zamyka sie po disconnect, logout albo utracie sesji,
- jest automatycznie odnawiany przez `client-app` z nowa generacja tej karty,
- nie wygasza aktywnej kolejki na podstawie wieku ani pustych keepalive.

POST token/disconnect pojedynczego kanalu wymaga `connection_id` i
`stream_id`. ID dokumentu nie jest odczytywane z sessionStorage; nowa
karta, kopia karty i reload maja niezalezne ID. Jedna prywatna sesja moze
miec wiele kanalow, w granicach limitow SSE. Limit login_sessions jest
oddzielnym mechanizmem i nie zamyka logowania tylko dlatego, ze otwarto
druga karte. Pelny aktualny kontrakt opisuje sekcja 38.9.

Token SSE jest krotkotrwaly i nie daje prawa do REST. Jest ustawiany jako
cookie `HttpOnly` przez `POST /client-api/events/token`; natywny `EventSource`
otwiera stream bez tokenu w query string. Szczegolowe atrybuty cookie i zasady
uniewazniania opisuje sekcja 38.9.

### 37.6. Zmiany wykonane przez Hub API albo TUI

Lokalna kolejka Client API nie widzi automatycznie commitu wykonanego w
innym procesie. Problem rozwiazuje wspolny dispatcher post-commit:

1. repozytorium zapisujace intent, ledger albo event zlecenia kolejkuje
   typowany deskryptor na tym samym `conn`,
2. rollback usuwa deskryptor bez publikacji,
3. udany `COMMIT` uwalnia event do lokalnego adaptera albo prywatnego mostu,
4. Client API kieruje event tylko do uprawnionych ownerow i ich SSE.

Dispatcher nie pobiera pieniedzy, nie autoryzuje i nie ponawia operacji.
Po zdarzeniu frontend pobiera autorytatywny stan przez REST. TUI korzysta z
dlugotrwalej subskrypcji konkretnego agregatu lub ownera i wykonuje jeden
odczyt projekcji po evencie.

### 37.7. SQLite i skalowanie

Client API dziala z jednym workerem, poniewaz obecnie ma:

- SQLite z jednym aktywnym writerem,
- lokalne kolejki SSE,
- nietrwaly store lookup challenge,
- procesowy runtime paczek.

FastAPI i Granian technicznie obsluguja wiele workerow, ale wlaczenie ich
teraz rozdzieliloby stan sesyjny procesu. Wiele instancji wymaga:

1. PostgreSQL,
2. wspolnego brokera albo trwalego outboxu,
3. wspolnego challenge store,
4. runtime niezaleznego od pojedynczego procesu.

### 37.8. Frontend, OpenAPI i uruchomienie

FastAPI serwuje `client-app/dist`. Fallback SPA jest ostatnia trasa i nie
przechwytuje `/client-api/...`.

CORS korzysta z jawnej listy `CLIENT_API_CORS_ORIGINS`. Swagger, OpenAPI
i ReDoc sa kontrolowane przez `CLIENT_API_DOCS_ENABLED`; na publicznym
wdrozeniu dokumentacja powinna zostac wylaczona albo ograniczona przez
reverse proxy.

`start_client_api_prod.bat` i `start_client_app.bat` uruchamiaja Granian
z targetem `kenya_courier.interfaces.client_api:app`. Waitress i Werkzeug nie sa juz sciezka
uruchomienia Client API.

Gate migracji obejmuje:

- komplet 64 operacji,
- Pydantic i bledy JSON,
- JWT, sesje i rate limit,
- transfery, custody i podpisy,
- payment intents,
- paczki, quote i refund,
- SSE i routing zmian zewnetrznych po `COMMIT`,
- prawdziwy proces Granian,
- build obu frontendow,
- pelny zestaw testow domenowych.

Migracja nie dodala tabel ani kolumn do DB.
## Admin API po migracji FastAPI/ASGI

Stan obowiazujacy od 2026-07-29:

1. Testowy i administracyjny panel HTTP nie korzysta juz z Flask,
   Flask-CORS, Werkzeug ani Waitress.
2. Publicznym composition root jest `admin_api.py`, ktory udostepnia
   `kenya_courier.interfaces.admin_api:app` typu FastAPI.
3. Warstwa HTTP sklada sie z:
   - kontraktow Pydantic w `admin_api_contracts.py`,
   - autoryzacji w `admin_api_auth.py`,
   - metadanych transportowych w `admin_api_transport.py`,
   - normalizacji JSON w `admin_api_responses.py`,
   - jawnych routerow w `admin_api_routes/`.
4. Zestaw publicznych operacji pozostaje zgodny z poprzednim panelem:
   30 operacji `POST`, 17 operacji `GET` i kanal SSE `/stream`.
5. Router:
   - waliduje transport przez Pydantic,
   - tworzy jawne body, query i metadata,
   - deleguje do handlera,
   - nie wykonuje SQL ani logiki domenowej.
6. `admin_api_handlers.py` zachowuje logike adaptera starego panelu,
   ale nie zna globalnego requestu i nie importuje frameworku HTTP.
7. Dane odczytowe panelu pobiera `AdminRepository` z
   `admin_repository.py`.
8. Operacje paczek, workow, tras i finansow nadal deleguja do
   wspolnych modulow domenowych. Migracja HTTP nie tworzy drugiej
   implementacji biznesowej.
9. Wszystkie trasy administracyjne, lacznie z odczytami i SSE, sa
   chronione wspolna polityka:
   - jezeli ustawiono `ADMIN_API_TOKEN`, wymagany jest poprawny token,
   - przejsciowo akceptowana jest nazwa `FLASK_ADMIN_API_TOKEN`,
   - bez tokenu dostep jest mozliwy tylko z bezposredniego localhost,
   - naglowek proxy nie zmienia polaczenia zdalnego w lokalne.
10. Bledy API sa zawsze JSON. Bledy Pydantic sa mapowane na HTTP 400,
    aby zachowac kontrakt istniejacego panelu.
11. `/stream` jest natywnym SSE FastAPI przez
    `sse-starlette.EventSourceResponse`.
    Po polaczeniu wysyla snapshot `init`, potem zdarzenia runtime i
    kontrolne `ping`.
12. Produkcyjnym/headless serwerem jest Granian z interfejsem ASGI i
    jednym workerem.
13. Jeden worker jest obecnie wymagany, poniewaz topologia, paczki i
    kolejka zdarzen posiadaja wspolny stan in-memory, a baza jest
    SQLite. Zwiekszenie liczby workerow bez przeniesienia runtime do
    zewnetrznego magazynu rozdzieliloby stan.
14. Tryb hybrydowy TUI + Admin API pozostaje trybem developerskim.
    Serwer ASGI jest wtedy osadzony w tym samym procesie co TUI, aby
    oba wejscia korzystaly z tych samych obiektow runtime.
15. `start.ps1` i `cli.py server` uruchamiaja
    `admin_api_runner.py`. Stary zgodnosciowy launcher `flask_server.py`
    zostal usuniety; Admin API ma jedna sciezke uruchomienia.
16. Historyczny znacznik metadata `FLASK_test` pozostaje bez zmiany.
    Jest identyfikatorem istniejacych testowych paczek, a nie nazwa
    aktywnego frameworku.
17. Migracja nie dodala tabel ani kolumn i nie zmienila atomowosci
    operacji domenowych.

Gate wdrozenia:

- OpenAPI zawiera dokladnie 48 operacji,
- rzeczywisty Granian przechodzi smoke REST i SSE,
- brak aktywnych importow Flask/Flask-CORS/Waitress,
- pelny zestaw testow: `398 passed`.

## Typowane granice domenowe paczek i payment intentow

Stan obowiazujacy od 2026-07-29:

1. Framework HTTP waliduje transport, ale komendy domenowe nie
   importuja FastAPI ani Pydantic z warstwy HTTP. Modele Pydantic
   domeny sa niezalezne od protokolu i moga byc tworzone rowniez przez
   TUI, test albo proces runtime.
2. Finalne nadanie paczki przechodzi przez `SubmitParcelCommand`.
   Komenda zawiera jawnego aktora, huby, strony paczki, gabaryty,
   opcje zawartosci, wybor platnosci, kontekst operacyjny i oczekiwana
   cene w minor units.
3. `submit_parcel_command()` jest jedyna publiczna droga finalnego
   nadania do prywatnego atomowego wykonawcy
   `_execute_parcel_submission_command()`.
4. Jednokierunkowe mapowanie formularza adaptera na
   `SubmitParcelCommand` znajduje sie w `parcel_command_mapper.py`,
   poza routerami i bez zaleznosci od frameworku HTTP. Projekcja
   komendy z powrotem do starego formularza nie istnieje.
5. Utworzenie payment intenta przechodzi przez
   `CreatePaymentIntentCommand`.
6. VKES ma dwie konkretne nogi kont: payer i payee. KES reprezentuje
   zewnetrzny wplyw gotowki, dlatego nie moze miec wewnetrznego konta
   platnika, ale musi miec konkretne konto KES odbiorcy.
7. Confirm, settle, reject i cancel maja osobne komendy aktora.
   Adaptery tworza komendy i serializuja typowany wynik.
8. Tozsamosc sesji i aktor operacji nie sa tym samym polem:
   `created_by_identity` zachowuje zalogowana osobe, natomiast
   `ActorContext.actor_id` zachowuje staff/person/system faktycznie
   wykonujacy operacje.
9. Kwoty w modelach domenowych sa integerami minor units. Konwersja do
   historycznego formatu major-unit odbywa sie tylko w adapterze
   zgodnosci.
10. Migracja modeli nie zmienia granic transakcji, optimistic update
    statusow, atomowosci paczki, kolejnosci ledgera ani zasad custody.
11. Client API, Hub API, Admin API i TUI tworza modele domenowe.
    Publiczne adaptery zgodnosci przyjmujace dowolny `dict` zostaly
    usuniete.

Gate po wdrozeniu granicy paczki i payment intentow:

- pelny zestaw testow: `402 passed`.

### Usuniecie starych wejsc slownikowych mutacji

Stan obowiazujacy od 2026-07-30:

1. Krytyczna mutacja o stalym schemacie przyjmuje model komendy, a nie
   dowolny `dict`.
2. Finalne nadanie ma jedno publiczne wejscie
   `submit_parcel_command(SubmitParcelCommand)`.
3. Szkic ma jedno publiczne wejscie
   `save_parcel_draft_command(SaveParcelDraftCommand)`.
4. Dispatch, przyjecie i finalizacja workow korzystaja odpowiednio z
   `DispatchLoadingCommand`, `ReceiveBagsCommand` oraz
   `FinalizeReceivedBagsCommand`.
5. Przedplata VKES korzysta z `CreatePrepaidParcelCommand` i zwraca
   `CreatePrepaidParcelResult`; implementacja nie odbudowuje
   historycznego `package: dict`.
6. Usuniete zostaly:
   `submit_parcel_request()`, `execute_parcel_submission()`,
   `save_parcel_request_draft()`, `tui_save_created_package()`,
   `dispatch_set_loading()`, `receive_apply_received_for_hub()` oraz
   `receive_finalize_received_for_hub()`.
7. Usuniete zostaly odwrotne projekcje komendy do starego formularza.
   Mapper dziala tylko w kierunku formularz adaptera -> komenda.
8. Usuniete zostaly martwe pliki `parcel_service.py` i `patch.py`.
9. Prywatny sufiks `_impl` oznacza kanonicznego wykonawce komendy.
   Nie oznacza adaptera zgodnosci i nie stanowi drugiego publicznego
   wejscia.
10. TUI pozostaje wspierane. Buduje te same modele domenowe co API,
    bez zaleznosci od FastAPI.
11. Slownik jest nadal dozwolony tam, gdzie dane sa naturalnie
    dynamiczne albo sa projekcja transportowa: odpowiedz JSON,
    `metadata_json`, mapa cargo oraz read/preview formularza.
12. `validate_parcel_request()` nie wykonuje mutacji i dlatego moze
    zwracac slownik podgladu dla UI. Nie wolno delegowac z niego
    finalnego zapisu przez ukryty `dry_run=False`.
13. Typowany wynik wewnetrzny jest wymagany przy sukcesie nadania i
    szkicu. Naruszenie kontraktu daje kontrolowany
    `ERR_SUBMIT_CONTRACT` albo `ERR_DRAFT_CONTRACT`.
14. Zmiana nie modyfikuje schematu DB, SQL, atomowosci, kolejnosci
    `package_events`, kolejnosci `wallet_ledger`, TX ani aktora.
15. Test architektoniczny blokuje ponowne dodanie usunietych wejsc,
    projekcji `_to_legacy_form` oraz martwych plikow.

Gate po usunieciu kompatybilnosci:

- testy skupione: `153 passed`,
- pelny zestaw po uruchomieniu wszystkich procesow Granian:
  `451 passed`, bez pominiec.

### Zamkniecie siedmiu etapow migracji domenowej

Stan obowiazujacy od 2026-07-30:

1. Client API nie emuluje requestu Flask.
2. Client API, Hub API i Admin API sa aplikacjami FastAPI/ASGI
   uruchamianymi produkcyjnie przez Granian.
3. Kontrakty i dynamiczne slowniki zostaly zinwentaryzowane.
4. Modele domenowe sa niezalezne od transportu HTTP.
5. Krytyczne mutacje paczek, finansow, podrozy i magazynu maja
   typowane komendy i wyniki.
6. Wszystkie adaptery, lacznie z TUI, tworza wspolne modele.
7. Historyczne wejscia mutacji `dict` zostaly usuniete.
8. Kwoty autorytatywne sa minor units `INTEGER`; major units sa tylko
   projekcja na granicy UI lub zgodnosci.
9. Koncowy gate obejmuje OpenAPI, parity, audyt ledgera, podpisy,
   restart, zimny start i synchronizacje config/manifest.
10. Trzy rzeczywiste procesy Granian przeszly testy REST/SSE, a pelny
    zestaw zakonczyl sie wynikiem `451 passed` bez pominiec.

Status migracji: `ZAMKNIETA`.

## Typowana przedplata paczki VKES

Stan obowiazujacy od 2026-07-30:

1. Atomowa przedplata paczki korzysta z
   `CreatePrepaidParcelCommand` i `CreatePrepaidParcelResult`.
2. Komenda zawiera pelne dane stron, gabarytow, zawartosci i odbioru,
   konkretne konto platnika, aktora oraz kwote w minor units.
3. `package_id` musi zaczynac sie od `TX-` i byc identyczne z
   `tx_group_id`. Jedna przedplata i jej dwa wpisy ledgera pozostaja
   polaczone tym samym TX.
4. Hub startowy i docelowy musza byc rozne, a wszystkie gabaryty i
   kwota dodatnie.
5. Podpisana przedplata wymaga jednoczesnie `signature` i `nonce`.
   Brak jednego z tych pol zatrzymuje komende przed DB.
6. Przedplate moze autoryzowac osoba albo jawny staff. Aktor systemowy
   nie moze tworzyc przedplaty klienta.
7. Client API tworzy komende przez
   `create_prepaid_parcel_command_from_form()` i wywoluje
   `execute_create_prepaid_parcel_command()` bez posredniego slownika
   `package`.
8. Zwykla przedplata deleguje do `WalletTransferCommand`, a
   non-custodial do `ExecuteSignedWalletTransferCommand`.
9. Ten sam `ActorContext` przechodzi z Client API do wpisow transferu.
   Domena nie rozpoznaje ponownie aktora z pierwszej litery ID.
10. Granica atomowa pozostaje bez zmiany. Utworzenie nowej osoby albo
    firmy, rekord `packages/paid` i transfer do
    `VKES_SYSTEM_OPERATING` uzywaja jednego polaczenia oraz jednego
    `BEGIN IMMEDIATE`.
11. Blad tworzenia strony paczki, konflikt paczki, brak salda, blad
    podpisu lub ledger powoduje wspolny rollback. Nie pozostaje sama
    osoba, sama paczka ani jednostronny wpis finansowy.
12. Domyslny tryb odbioru przedplaty pozostaje `ID:`. Challenge
    `stale/expired` nadal moze zostac odswiezony przez Client API.
13. Historyczne `create_prepaid_parcel(package=dict)` oraz jego mapper
    legacy zostaly usuniete. Produkcja i testy wywoluja bezposrednio
    `execute_create_prepaid_parcel_command()`.
14. Test architektoniczny blokuje ponowne dodanie starego wejscia,
    mappera legacy albo wywolania slownikowego w Client API.

Gate po typowaniu przedplaty:

- testy ukierunkowane: `107 passed`,
- testy po usunieciu adaptera: `89 passed`,
- pelny zestaw testow: `444 passed`.

## Typowane expiry i recovery payment intentow

Stan obowiazujacy od 2026-07-30:

1. Startowe odzyskiwanie payment intentow przechodzi przez
   `RecoverPaymentIntentsCommand`. Jest to komenda systemowa i nie moze
   zostac wykonana jako person ani staff.
2. Komenda zawiera jawny czas UTC z timezone oraz prog wieku starego
   KES parcel intenta. Czas uzyty do cutoffu i timestampow jednej
   operacji jest identyczny.
3. `execute_recover_payment_intents_command()` jest jedyna droga do
   prywatnej implementacji recovery. Historyczna funkcja
   `recover_pending_intents()` zostala usunieta; produkcja,
   diagnostyka i testy tworza jawna komende.
4. W jednej poczatkowej transakcji system:
   - anuluje `awaiting_offline_response`,
   - anuluje stare `created` KES parcel intenty bez `package_id`,
   - naprawia `authorized` na `settled`, jezeli istnieje juz ledger,
   - pobiera pozostale `authorized` do kontrolowanego wznowienia.
5. Parcel payment i cash-out nie sa automatycznie rozliczane przez
   startup. Pozostaja `authorized`, poniewaz moze je zuzyc tylko
   atomowa operacja paczki albo wyplaty.
6. Pozostale intenty `authorized` sa rozliczane przez istniejacy
   `SettlePaymentIntentCommand`. Recovery nie ma osobnej implementacji
   transferu ani ledgera.
7. Kazdy settlement zachowuje osobna transakcje. Awaria jednego intenta
   nie cofa prawidlowo odzyskanych, niezaleznych intentow.
8. `RecoverPaymentIntentsResult` raportuje liczniki wszystkich zmian
   oraz liste nieudanych intentow z ich identyfikatorami i przyczynami.
9. Nie wolno ignorowac bledu settlementu. Wynik recovery ma wtedy
   `ok=False`, a nieprzetworzony intent pozostaje gotowy do diagnostyki
   albo kontrolowanego ponowienia.
10. Recovery jest idempotentne: ponowne uruchomienie nie duplikuje
    wpisow ledgera i nie wykonuje drugi raz zakonczonej operacji.

Gate po wdrozeniu expiry i recovery:

- pelny zestaw testow: `419 passed`.

Po usunieciu adaptera recovery:

- testy recovery, restartu i architektury: `76 passed`,
- pelny gate: `444 passed`.

## Typowany push i podpisana autoryzacja payment intenta

Stan obowiazujacy od 2026-07-30:

1. Przejscie payment intenta do `awaiting_push` odbywa sie przez
   `SendPaymentIntentPushCommand`.
2. Aktualizacja statusu push jest warunkowa wzgledem poprzedniego
   statusu. Rownolegly request nie moze nadpisac nowszego stanu
   intenta.
3. Non-custodial challenge powstaje przez
   `StartPaymentIntentSignatureCommand`, ktory zawiera jawnego aktora
   i kontrolowany TTL.
4. `PaymentIntentSignatureChallenge` jest kanonicznym kontraktem
   danych do podpisu. Kwota domenowa jest integerem minor units;
   adapter HTTP moze prezentowac zgodny format major-unit.
5. Challenge wiaze podpis z intentem, kontami payer/payee, kwota,
   waluta, TX, package_id, aktorem, nonce, expiry i aktywnym kluczem.
6. Weryfikacja przechodzi przez
   `VerifyPaymentIntentSignatureCommand`. Komenda moze zawierac
   `expected_nonce` otrzymany przez klienta razem z challenge.
7. Niezgodny nonce zatrzymuje operacje bez skonsumowania challenge.
   Chroni to klienta przed podpisaniem starszej wiadomosci i
   zweryfikowaniem nowszego rekordu tego samego intenta.
8. Domena nie ufa payloadowi HTTP. Ponownie buduje wiadomosc z
   aktualnego intenta, sprawdza hash, rekord challenge, aktywny klucz,
   TTL i podpis Ed25519.
9. Status `authorized` moze powstac dopiero po atomowym oznaczeniu
   challenge jako `verified`. Nastepnie wykonywany jest typowany
   `ConfirmPaymentIntentCommand`.
10. Client API przekazuje do komend rzeczywistego aktora person/staff
    oraz nonce. Historyczne adaptery `send_push_for_intent()`,
    `start_signature_challenge()` i `verify_signature_challenge()`
    zostaly usuniete; nie istnieje alternatywna implementacja
    kryptografii.
11. Offline OTP pozostaje oddzielnym use-case. Nie wolno traktowac go
    jako podpisu Ed25519 ani laczyc jego challenge z
    `wallet_transfer_challenges`.

Gate po wdrozeniu push i podpisanej autoryzacji:

- pelny zestaw testow: `421 passed`.

Po fizycznym usunieciu adapterow push i podpisu:

- testy i diagnostyka buduja te same komendy co wejscia produkcyjne,
- serializacja challenge do JSON pozostaje tylko operacja
  transportowa,
- test architektoniczny wymaga braku trzech historycznych funkcji,
- testy skupione: `106 passed`,
- funkcjonalny gate: `443 passed`; procesowy smoke Granian byl
  niedostepny z powodu nasycenia lokalnego srodowiska istniejacymi
  workerami,
- schemat DB, SQL, walidacja podpisu i granice transakcji nie zostaly
  zmienione.

## Typowany read model payment intenta

Stan obowiazujacy od 2026-07-30:

1. Pojedynczy payment intent jest odczytywany przez
   `PaymentIntentStatusQuery` i zwracany jako
   `PaymentIntentReadModel`.
2. Read model zawiera pelny rekord potrzebny domenie: status, typ,
   metode, walute, delivery mode, konta, ownerow, aktorow, TX,
   package_id, powod, note, blad i timestampy.
3. Kwota w read modelu jest integerem minor units. Kwota major-unit
   powstaje tylko w mapperze zgodnosci HTTP/TUI.
4. `_get_payment_intent_impl()` jest jedynym zapytaniem odczytujacym
   pojedynczy rekord. Historyczne `get_payment_intent()` zostalo
   usuniete; wszystkie wejscia uzywaja typed query.
5. Client API i Admin API korzystaja bezposrednio z typed query oraz
   read modelu dla endpointow statusu.
6. Prawo widocznosci intenta pozostaje odpowiedzialnoscia adaptera
   sesji Client API. Read model nie omija ani nie zastepuje
   autoryzacji uzytkownika.
7. Historyczny slownik pozostaje zgodny: mapper przywraca pole
   `amount` i zachowuje wszystkie dotychczasowe nazwy tylko na
   granicy transportowej.
8. Migracja read modelu nie zmienia schematu bazy, SQL ani cyklu
   stanow payment intenta.

Gate po wdrozeniu read modelu:

- pelny zestaw testow: `424 passed`.

Po usunieciu adaptera `get_payment_intent()` test architektoniczny
blokuje jego powrot. Testy i diagnostyka odczytuja pola bezposrednio z
`PaymentIntentReadModel`.

Weryfikacja koncowa domkniecia adaptera:

- testy skupione: `90 passed`,
- AST nie zawiera definicji ani wywolan `get_payment_intent()`,
- pelny gate obejmuje `444` przypadki; `443` przeszly w dwoch
  sekwencyjnych grupach, a test uruchamiajacy rzeczywisty proces Granian
  przeszedl w izolowanym powtorzeniu po jednorazowym timeoutcie startu,
- zmiana nie modyfikuje schematu DB ani cyklu stanow payment intenta.

## Bezposrednie komendy payment intenta w adapterach

Stan obowiazujacy od 2026-07-30:

1. Client API, Hub API, Admin API, runtime i TUI nie wywoluja
   historycznych adapterow lifecycle payment intenta.
2. Kazde wejscie tworzy bezposrednio odpowiednia komende domenowa:
   create, push, confirm, settle, reject, cancel, signature albo
   recovery.
3. Kwota create jest przekazywana jako integer `amount_minor`.
   Konwersja z formatu uzytkownika odbywa sie przed utworzeniem
   komendy.
4. Aktor i zrodlo operacji sa jawne:
   - Client API przekazuje person albo aktywny staff,
   - Hub API przekazuje zalogowany staff huba,
   - Admin API bez rozpoznanej osoby przekazuje `SYSTEM_ADMIN`,
   - TUI przekazuje person albo staff aktywnego panelu,
   - recovery i automatyczne przejscia przekazuja aktora systemowego.
5. Admin API nie moze deklarowac przypadkowego ludzkiego aktora, jezeli
   token administracyjny nie identyfikuje tej osoby. Wyjatkiem jest
   kontrolowany flow testowy, ktory jawnie rozwiazuje staff COO.
6. Odczyt pojedynczego intenta w logice decyzji przechodzi przez
   `PaymentIntentStatusQuery` i `PaymentIntentReadModel`.
7. Flow oczekujace jawnie przekazuja `delivery_mode=waiting`.
   Adapter nie moze zalezec od odmiennego defaultu modelu domenowego.
8. Non-custodial confirm przekazuje nonce otrzymany razem z challenge.
   Brak albo niezgodnosc nonce podlega walidacji domenowej.
9. Historyczne funkcje `create_payment_intent()`,
   `confirm_payment_intent()`, `settle_payment_intent()`,
   `reject_payment_intent()` i `cancel_payment_intent()` zostaly
   fizycznie usuniete z `finance_core.py`. Jedynym publicznym wejsciem
   mutacji sa funkcje przyjmujace odpowiednie komendy domenowe.
10. Test architektoniczny analizuje wywolania AST w Client API, Hub API,
    Admin API, runtime i TUI. Dodanie wywolania starego adaptera ma
    zatrzymac gate testow.

Gate po podlaczeniu wszystkich wejsc:

- pelny zestaw testow: `425 passed`.

Po fizycznym usunieciu adapterow lifecycle:

- testy i diagnostyka tworza te same komendy co kod produkcyjny,
- `finance_test_commands.py` jest tylko testowym builderem komend,
- test architektoniczny blokuje przywrocenie pieciu starych funkcji,
- testy skupione: `140 passed`,
- `443` pozostale przypadki pelnego gate przeszly; test procesu
  Granian zostal zablokowany przez nasycone istniejacymi workerami
  srodowisko uruchomieniowe, a nie przez zmiane domenowa,
- brak zmian schematu DB, SQL i granic transakcji.

## Typowane transfery i operacje gotowkowe

Stan obowiazujacy od 2026-07-30:

1. Zwykly transfer, signed transfer, mint, prepaid oraz refund
   korzystaja z `WalletTransferCommand`.
2. Komenda zawiera konkretne konta, jawnego aktora, kwote minor units,
   walute, powod, TX, package_id i metadata audytowe.
3. Ownerzy sa odczytywani z walidowanych kont wewnatrz transakcji.
   Owner przekazany przez adapter nie jest zrodlem prawdy.
4. Podpis non-custodial jest weryfikowany przed utworzeniem komendy
   wykonawczej. Publiczny transfer nie przyjmuje flagi
   `signature_verified`.
5. Dane `entry_v2` i bypass akceptacji przychodzacej sa prywatnym
   kontekstem zaufanych use-case, a nie polami publicznego requestu.
6. Mint pozostaje transferem z konta oznaczonego jako mint. Wszystkie
   wpisy jednej emisji maja wspolny TX.
7. Refund prepaid uzywa tej samej implementacji transferu i zachowuje
   atomowosc z usunieciem anulowanej paczki.
8. Operacje gotowkowe maja osobne komendy domenowe dla deklaracji KES,
   platnosci paczki, finansowania huba KES/VKES, cash-in i cash-out.
9. Cash-out wymaga autoryzowanego payment intenta VKES. Intent, kwota,
   payer account, payee account i hub sa ponownie sprawdzane w tej
   samej transakcji.
10. Cash-in i cash-out zachowuja wspolny TX dla wszystkich nog KES i
    VKES. Nie wolno rozbijac ich na osobne commity.
11. Rozwiazanie kont huba i klienta odbywa sie w transakcji use-case,
    a nie jako niezabezpieczony odczyt w routerze.
12. Produkcyjne wejscia nie wywoluja historycznych adapterow zwyklego
    transferu ani gotowki. Client API, TUI i runtime tworza bezposrednio
    odpowiedni `WalletTransferCommand` albo `HubCash...Command`.
13. Kwota jest konwertowana do `amount_minor` przed przekroczeniem
    granicy domenowej. Slownik z kwota major-unit powstaje dopiero w
    mapperze wyniku nalezacym do warstwy adaptera.
14. Zwykly transfer KES pozostaje zabroniony. Operacje KES sa dozwolone
    tylko przez wyspecjalizowane komendy huba, ktore sprawdzaja
    uprawnienia, konta i wymagane powiazanie z VKES.
15. Podpisany transfer jest wyjatkiem od bezposredniego wywolania
    wykonawcy komendy: najpierw musi zuzyc zapisany challenge i
    zweryfikowac nonce, TTL, klucz, podpis oraz warunki `entry_v2`.
    Dopiero zaufana czesc tego use-case tworzy `WalletTransferCommand`.
16. Prepaid custodial tworzy komende transferu bezposrednio wewnatrz
    tej samej transakcji co paczka. Zachowuje `package_id`, TX i prefix
    eventu; nie wykonuje dodatkowego commitu przez adapter zgodnosci.
17. Test architektoniczny zabrania wywolan starych adapterow transferu
    i gotowki w Client API, Hub API, Admin API, runtime, TUI oraz
    wewnetrznych use-case `finance_core.py`.
18. Historyczne adaptery transferu i gotowki zostaly fizycznie usuniete
    po migracji produkcji, testow i narzedzi diagnostycznych. Nie wolno
    przywracac ich jako drugiego publicznego interfejsu.
19. Autoryzacja signed transfer ma dwa osobne kontrakty:
    `BuildWalletTransferChallengeCommand` oraz
    `ExecuteSignedWalletTransferCommand`. Nie wolno laczyc utworzenia
    challenge z jego wykonaniem.
20. Typowany `WalletTransferChallenge` zawiera komplet podpisywanych
    danych, ale kwote przechowuje domenowo jako `amount_minor`.
    Historyczne `amount` jest tworzone tylko przez mapper JSON.
21. Komenda wykonania wymaga nonce, podpisu, konkretnych kont, aktora,
    waluty, kwoty i powodu. Wszystkie te dane sa porownywane z
    utrwalonym challenge przed uruchomieniem transferu.
22. Dla `entry_v2` zaufana implementacja nadal sprawdza oczekiwany
    `seq`, `prev_hash`, saldo oraz `pending_entry_hash`. Adapter nie moze
    podac flagi potwierdzajacej te kontrole.
23. `SignedWalletTransferResult` jawnie zwraca nonce, key_id, informacje
    o podpisie i status challenge. Stan stale/expired pozostaje
    rozpoznawalny przez Client API bez parsowania tekstu bledu.
24. Client API, prepaid i TUI mint tworza komendy signed transfer
    bezposrednio. Historyczne funkcje challenge/execute nie istnieja,
    a test AST blokuje ich ponowne dodanie lub wywolanie.
25. Testy integracyjne i diagnostyka korzystaja z
    `finance_test_commands.py`. Modul ten buduje te same komendy
    domenowe co produkcja i mapuje ich typowane wyniki; nie zawiera
    alternatywnej logiki finansowej.
26. Usuniecie adapterow nie zmienilo schematu DB, kryptografii,
    atomowosci, TX ani kolejnosci wpisow ledgera.

Gate po wdrozeniu transferow i operacji gotowkowych:

- pierwotny gate modeli i wykonawcow: `405 passed`,
- gate po bezposrednim podlaczeniu produkcyjnych wejsc: `426 passed`,
- gate po typowaniu calej autoryzacji signed transfer: `427 passed`,
- gate po fizycznym usunieciu adapterow: `427 passed`.

## Typowane otwarcie worka i zapis paczki w hubie

Stan obowiazujacy od 2026-07-30:

1. Otwarcie albo znalezienie worka jest opisane przez
   `OpenBagCommand`, a wynik przez `OpenBagResult`.
2. Zapis paczki w worku lub skrzynce jest opisany przez
   `StoreParcelCommand`, a wynik przez `StoreParcelResult`.
3. Komenda przechowuje stabilne identyfikatory. Obiekty `Hub`, `Bag`
   i `Parcel` sa tylko kontekstem wykonania i nie przeciekaja do
   kontraktu domenowego.
4. Przed mutacja wykonawca porownuje huby, `package_id` i opcjonalny
   identyfikator wymuszonego kontenera z obiektami runtime.
5. Aktorem jest pracownik przypisany do huba albo
   `SYSTEM_RUNTIME` dla rzeczywistej operacji automatycznej.
6. `allow_sealed` jest dozwolone tylko razem z jawnym
   `selected_container_id`. Nie jest globalnym obejściem statusu worka.
7. `Hub.ensure_open_bag()` oraz `Hub.add_parcel_to_storage()` sa
   adapterami dla istniejacego TUI i runtime. Buduja komendy i nie
   zawieraja alternatywnej logiki magazynowej.
8. Prywatne implementacje pozostaja pojedyncze:
   `_ensure_open_bag_impl()` i `_add_parcel_to_storage_impl()`.
9. Nie zmieniono granicy transakcji runtime, rezerwacji stocku,
   zapisu worka, `bag_events`, relacji paczka-kontener ani
   automatycznego plombowania.
10. Wynik magazynowania rozroznia kontener od lokalnego
    `ready_for_pickup`.
11. Dispatch `LOADING` korzysta z `DispatchLoadingCommand` i
    `DispatchLoadingResult`.
12. `CargoOverride` typuje liczbe pustych workow i kody skrzynek.
    Dynamiczna mapa pozostaje indeksowana przez `bag_id`.
13. `cargo_overrides=None` oznacza automatyczny rebalance, natomiast
    `{}` oznacza jawnie brak dodatkowego cargo. Tych wartosci nie wolno
    laczyc.
14. `dispatch_set_loading()` jest wylacznie historycznym adapterem
    zgodnosci. TUI i runtime tworza bezposrednio
    `DispatchLoadingCommand`, a jedyna prywatna mutacja znajduje sie w
    `_dispatch_set_loading_impl()`.
15. Fizyczne przyjecie worka i rozladunek cargo korzystaja z
    `ReceiveBagsCommand` oraz `ReceiveBagsResult`.
16. `ReceiveCargoSelection` laczy liczbe pustych workow i kody skrzynek
    dla jednego `bag_id`; adapter TUI scala do niego dawne dwie mapy.
17. Aktor staff przyjecia musi nalezec do huba docelowego.
18. `receive_apply_received_for_hub()` jest historycznym adapterem
    zgodnosci. TUI tworzy bezposrednio `ReceiveBagsCommand`, a jedyna
    prywatna mutacja znajduje sie w
    `_receive_apply_received_for_hub_impl()`.
19. Finalizacja zawartosci przyjetego worka korzysta z
    `FinalizeReceivedBagsCommand` i `FinalizeReceivedBagsResult`.
20. Komenda zawiera hub, unikalna liste `bag_id`, dynamiczna mape
    wybranych `package_id` per worek oraz jawnego aktora.
21. Klucze mapy wyboru musza nalezec do listy workow komendy. Jedna
    paczka nie moze zostac wybrana w dwoch workach.
22. Aktor staff musi nalezec do huba finalizujacego. Rzeczywista
    automatyczna operacja moze uzyc aktora systemowego.
23. Szczegoly wyniku sa typowane przez `FinalizeBagDetail` i
    `FinalizeParcelAction`; rozrozniaja `TRANSFER`, `SORTING` oraz
    `OUTTAKE`.
24. `receive_finalize_received_for_hub()` pozostaje historycznym
    adapterem zgodnosci. TUI tworzy bezposrednio
    `FinalizeReceivedBagsCommand`, a mapper odpowiedzi zachowuje pola
    `_pending_transfer`, `_transfer_to`, `_pending_transfer_to` i
    `_pending_new_bid`.
25. Jedyna prywatna mutacja finalizacji znajduje sie w
    `_receive_finalize_received_for_hub_impl()`.
26. `hub_database_override` jest kontekstem wykonania runtime, a nie
    polem komendy domenowej.
27. Finalizacja nadal wykonuje planowanie, zmiany workow i paczek,
    `package_events`, `bag_events`, inventory, splity i wpisy ledgera
    w dotychczasowej pojedynczej transakcji `BEGIN IMMEDIATE`.

Gate po wdrozeniu:

- gate po otwarciu worka i zapisie paczki: `430 passed`,
- gate po typowaniu dispatchu `LOADING`: `434 passed`,
- gate po typowaniu przyjecia i rozladunku cargo: `438 passed`,
- gate po typowaniu finalizacji, outtake i przepakowania:
  `442 passed`.

## Wspolne komendy paczki dla Client API, Hub API, Admin API i TUI

Stan obowiazujacy od 2026-07-30:

1. Finalne nadanie z Hub API, Admin API i TUI korzysta z jednego
   `SubmitParcelCommand` oraz `submit_parcel_command()`.
2. Client API dla przedplaty korzysta z
   `CreatePrepaidParcelCommand`, poniewaz paczka i transfer VKES musza
   pozostac jedna operacja atomowa.
3. Szkic do pozniejszej zaplaty ma osobny kontrakt
   `SaveParcelDraftCommand`. Client API i TUI korzystaja z tego samego
   wykonawcy `save_parcel_draft_command()`.
4. Szkic `local/global` moze byc niepelny. `created` nadal wymaga
   kompletnej trasy, stron, gabarytow, zawartosci i danych odbioru.
5. Rezerwacja identyfikatora `TMP`, zapis paczki i ewentualne utworzenie
   osoby albo firmy sa wykonywane w jednej dotychczasowej transakcji.
6. Kazda komenda zawiera jawny `ActorContext`: identyfikator, typ,
   source i opcjonalny hub. Domena nie zgaduje kanalu z przypadkowych
   pol formularza.
7. TUI nie importuje FastAPI ani modeli HTTP. Tworzy te same modele
   domenowe Pydantic bezposrednio z wartosci formularza.
8. `validate_parcel_request()` jest niezmieniajacym stanu preview.
   Slownik jego odpowiedzi jest dozwolonym formatem UI i nie stanowi
   drugiej drogi mutacji.
9. TUI i runtime tworza bezposrednio komendy dispatchu. TUI tworzy
   bezposrednio komendy przyjecia cargo i finalizacji workow.
10. Produkcyjne adaptery nie wywoluja starych wejsc slownikowych.
    Test architektoniczny analizuje call sites i blokuje ich powrot.
11. Historyczne adaptery pozostaja czasowo tylko dla testow zgodnosci i
    narzedzi. Ich usuniecie nie moze nastapic przed przepieciem
    wszystkich pozostalych uzytkownikow.
12. Podlaczenie adapterow nie zmienia schematu DB, transakcji, TX,
    eventow paczki, `bag_events` ani kolejnosci wpisow ledgera.

## Typowana podroz paczki i finalny settlement

Stan obowiazujacy od 2026-07-30:

1. Zleceniem domenowym podrozy jest `CourierTripCommand`. Jedna komenda
   obejmuje cala uporzadkowana liste workow jadacych z jednego huba do
   drugiego, kuriera oraz aktora przyjecia w hubie docelowym.
2. Komenda podrozy nie przyjmuje kwot payoutu ani elementow splitu jako
   zaufanych danych. Dystans, saldo paczki, stawka, bonus oraz udzialy
   kuriera, managera i huba wylicza aktualny stan domeny.
3. Aktor transportu jest kurierem typu `staff`. Aktor przyjecia jest
   pracownikiem huba docelowego. Przed rozpoczeciem mutacji system
   ponownie sprawdza pod blokada runtime, czy aktywny pracownik huba
   docelowego nie zmienil sie od chwili utworzenia komendy.
4. Decyzja runtime i komenda musza miec identyczne huby, kuriera oraz
   identyczna uporzadkowana liste workow. Rozbieznosc zatrzymuje
   operacje przed pierwsza mutacja.
5. `execute_courier_trip_command()` jest jedyna droga do wykonania
   prywatnej mutacji podrozy. Historyczny adapter `apply_assignment()`
   zostal usuniety. Aktywacja `LOADING`, market job i TUI tworza
   `CourierTripCommand` przez mapper runtime i wywoluja executor
   bezposrednio.
6. Granica transakcji pozostaje bez zmiany: ruch workow, stan paczek,
   `package_events`, odroczone wpisy `wallet_ledger`, `bag_events`,
   inventory i koncowy snapshot sa zatwierdzane przez istniejacy
   koordynator operacji runtime.
7. Nie istnieje jeden TX dla calej wielopaczkowej podrozy. Kazde
   niezalezne zdarzenie finansowe ma wlasny TX, natomiast wszystkie
   nogi jednego splitu zachowuja wspolny TX tego zdarzenia.
8. Finalne dostarczenie korzysta z `ParcelSettlementCommand`.
   Komenda zawiera `package_id`, hub, odbiorce i jawnego aktora staff.
9. Komenda finalnego settlementu celowo nie ma kwoty ani TX.
   Oplata delivery, split, `check_balance`, wyzerowanie salda i TX
   wynikaja z domeny i nie moga zostac narzucone przez HTTP albo TUI.
10. `execute_parcel_settlement_command()` jest jedyna droga do
    prywatnego wykonania dostarczenia. Historyczny adapter
    `deliver_parcel_and_settle()` zostal usuniety. Admin API i TUI
    tworza `ParcelSettlementCommand` przez mapper runtime i wywoluja
    typowanego executora bezposrednio.
11. Awaryjny reload runtime po wyjatku nie moze zastapic pierwotnego
    bledu podrozy. Jezeli sam reload sie nie powiedzie, propagowana jest
    nadal przyczyna, ktora zatrzymala operacje domenowa.

Gate po wdrozeniu podrozy i settlementu:

- pelny zestaw testow: `411 passed`.

Po usunieciu adaptera `deliver_parcel_and_settle()`:

- testy komend, Admin API, TUI i architektury: `78 passed`,
- pelny zestaw testow: `444 passed`.

Adapter `apply_assignment()` zostal rowniez usuniety. Kazde wejscie
podrozy przekazuje jawnie wybranego kuriera i korzysta bezposrednio z
`CourierTripCommand`; test architektoniczny blokuje powrot starego
wejscia. Testy ukierunkowane: `99 passed`; pelny gate: `444 passed`.

## Typowane anulowanie paczki i refund

Stan obowiazujacy od 2026-07-30:

1. Anulowanie paczki jest jednym use-case opisanym przez
   `CancelParcelCommand`. Nie jest skladane w routerze z osobnego
   usuniecia paczki i osobnego przelewu.
2. Komenda wymaga aktora typu `person` oraz jawnej tozsamosci
   uwierzytelnionego principala. Publiczny kontrakt nie przyjmuje
   listy `actor_ids` ani innego pola pozwalajacego callerowi rozszerzyc
   uprawnienia.
3. Uprawnienie do anulowania wynika z przeciecia tozsamosci sesji z
   `sender_code` albo `receiver_code` paczki. Dane z body requestu nie
   sa zrodlem autoryzacji.
4. `execute_cancel_parcel_command()` jest jedyna droga do prywatnej
   mutacji anulowania. Historyczny adapter `cancel_client_parcel()`
   zostal usuniety; Client API i testy tworza `CancelParcelCommand`
   bezposrednio.
5. Dla statusow `local`, `global` i `created` anulowanie usuwa wpis
   `packages` bez operacji finansowej.
6. Dla statusu `paid` konto platnika i kwota refundu sa odczytywane z
   oryginalnego debetu `wallet_ledger`. Nie wolno przyjmowac ich z
   requestu ani formularza.
7. Refund wykorzystuje `WalletTransferCommand`, aktora
   `SYSTEM_RUNTIME`, ten sam `tx_group_id` co przedplata oraz event keys
   `parcel_prepaid_refund_debit` i `parcel_prepaid_refund_credit`.
8. Pominiecie akceptacji przychodzacej jest prywatna polityka
   refundu. Nie moze byc wystawione jako publiczna flaga transferu.
9. Sprawdzenie statusu, wykrycie poprzedniego refundu, obie nogi
   ledgera i usuniecie vouchera `TX.../paid` wykonuja sie w jednym
   `BEGIN IMMEDIATE`.
10. Blad dowolnej nogi refundu wycofuje cala transakcje. Paczka
    pozostaje `paid`, a ledger nie zawiera czesciowego zwrotu.
11. Jezeli refund istnieje, ponowne anulowanie nie zapisuje kolejnego
    zwrotu. Moze jedynie usunac pozostaly wpis paczki.
12. Wynik domenowy `CancelParcelResult` przechowuje kwote zwrotu w
    minor units. Format major-unit i status HTTP sa odpowiedzialnoscia
    adaptera.
13. Test architektoniczny blokuje ponowne dodanie historycznego
    wejscia `cancel_client_parcel()`.

Gate po wdrozeniu anulowania i refundu:

- pelny zestaw testow: `415 passed`.

Po usunieciu nieuzywanego adaptera `cancel_client_parcel()`:

- testy obszaru anulowania i API: `72 passed`,
- pelny zestaw testow: `444 passed`.

## Typowane Offline OTP dla payment intenta

Stan obowiazujacy od 2026-07-30:

1. Offline OTP jest niezaleznym sposobem autoryzacji payment intenta.
   Nie jest podpisem Ed25519 i nie moze korzystac z challenge, nonce
   ani tabel przeznaczonych dla podpisanego transferu.
2. Rozpoczecie, weryfikacja i anulowanie sa trzema osobnymi komendami:
   `StartOfflineOtpChallengeCommand`,
   `VerifyOfflineOtpResponseCommand` i
   `CancelOfflineOtpChallengeCommand`.
3. Kazda komenda wymaga konkretnego `intent_id` oraz jawnego
   `ActorContext`. Start zapisuje inicjujacego pracownika. Weryfikacja
   i anulowanie sa wykonywane przez `SYSTEM_RUNTIME`, zgodnie z
   istniejacym cyklem autoryzacji.
4. Challenge i odpowiedz maja zawsze dokladnie szesc cyfr. Warunek
   jest sprawdzany na granicy HTTP oraz ponownie przez model domenowy.
5. Challenge jest generowany przez kryptograficzny generator
   `secrets`, a oczekiwana odpowiedz nadal wynika z HMAC wlasciciela i
   challenge zgodnie z dotychczasowym protokolem.
6. Rekord autoryzacji pozostaje w `approval_requests` z
   `approval_type='offline_otp'`. Jest to osobny magazyn od
   `wallet_transfer_challenges`, ktory obsluguje podpisane przelewy.
7. Poprawna odpowiedz przeprowadza intent z
   `awaiting_offline_response` przez kanoniczna komenda potwierdzenia.
   Niepoprawna lub wygasla odpowiedz nie autoryzuje intentu.
8. Admin API i TUI korzystaja bezposrednio z komend domenowych.
   Historyczne adaptery Offline OTP nie istnieja, a test
   architektoniczny blokuje ich przywrocenie.
9. Migracja nie zmienia schematu bazy, tabel, statusow payment intenta
   ani granic transakcji.
10. Blad walidacji OTP zawsze zwraca JSON HTTP 400. Szczegoly bledu sa
    ograniczone do serializowalnych pol `type`, `loc` i `msg`, dlatego
    wewnetrzny obiekt wyjatku Pydantic nie moze zmienic odpowiedzi w
    HTTP 500.

Gate skupiony dla modeli, audytu, restart recovery i architektury:
`105 passed`. Pelny gate projektu: `445 passed`; jeden rzeczywisty test
procesu Granian zostal pominiety ze wzgledu na stan lokalnego
srodowiska.

## 38. Stabilnosc, sesje i baza po 12-punktowym audycie technicznym

Stan obowiazujacy od 2026-07-30. Ta sekcja opisuje reguly wykonawcze po
migracji API i domeny. Rozroznia wymagania wdrozone od swiadomych
ograniczen POC.

### 38.1. Identyfikatory finansowe

1. `intent_id`, `intent_code`, `tx_group_id`, nonce, challenge i kody OTP
   wymagajace nieprzewidywalnosci korzystaja z `secrets` albo rownowaznego
   kryptograficznego generatora.
2. Globalny `random.seed(...)` nie moze sterowac identyfikatorami
   finansowymi.
3. Deterministyczna symulacja uzywa prywatnego obiektu generatora
   ograniczonego do symulacji.
4. Generator nie zastapuje ograniczen `PRIMARY KEY` i `UNIQUE` w DB.
5. `intent_id` pozostaje technicznym kluczem payment intenta.
   `intent_code` pozostaje krotszym kodem przeznaczonym dla czlowieka.
   `tx_group_id` laczy nogi jednej operacji ksiegowej.
6. Standardowy `tx_group_id` ma postac `TX-{8HEX}-{4HEX}`. Voucher `paid`
   klienta zawsze dostaje `TX-{kod_czlowieka}-{8HEX}-{4HEX}`. Adapter huba
   moze jawnie wlaczyc `include_intent_code_in_tx_group`, uzyskujac
   `TX-{intent_code}-{8HEX}-{4HEX}`. Flaga nie zmienia znaczenia TX:
   caly identyfikator nadal jest jednym kluczem grupy finansowej.

### 38.2. Lifecycle procesow Granian

1. Test procesu ASGI musi zamknac proces nadrzedny i wszystkie workery.
2. Cleanup jest wykonywany w `finally`.
3. Na Windows wymagane jest zakonczenie calego drzewa procesu.
4. Test nie moze byc uznany za zakonczony, jezeli pozostawil worker
   Granian albo `multiprocessing.spawn`.
5. Zasada testowa nie zastapuje produkcyjnego managera uslug.

### 38.3. Prywatnosc wyszukiwania osoby

`client_lookup_verification_enabled=0` oznacza:

- brak dodatkowych pytan,
- automatyczne uzupelnienie danych po poprawnym pelnym ID,
- tryb przeznaczony dla POC.

Przed publicznym wdrozeniem nie wolno pozostawic tego trybu bez
dodatkowych zabezpieczen. Publiczny model musi ograniczyc enumeracje ID,
liczbe prob i zakres danych zwracanych przed weryfikacja.

### 38.4. Spojnosc runtime miedzy procesami

1. Client API i Hub API otrzymuja po `COMMIT` typowany event zapisany trwale w
   `post_commit_outbox`; event jest sygnalem, a DB pozostaje zrodlem prawdy.
2. Zmiana aktywnosci huba, linku albo topologii oznacza runtime jako nieaktualny
   i powoduje jeden reload przed kolejna wycena lub mutacja zalezna od trasy.
3. Awaria transportu uruchamia retry konkretnego rekordu outboxu z opoznieniem,
   bez skanowania tabel biznesowych. Restart odtwarza niewyslane rekordy.
4. Reload nie moze pracowac rownolegle z mutacja worka, paczki,
   snapshotu, podrozy albo settlementu.
5. Hub API, Client API i Admin API tylko sprawdzaja schemat w trybie read-only.
   Migracje, uzupelnianie kolumn i synchronizacja danych startowych sa
   wykonywane wylacznie podczas uruchamiania glownego TUI.

### 38.5. Blokada read/write runtime

1. Wspolny `RuntimeRWLock` chroni globalny runtime jednego procesu.
2. Odczyty map, tras, wycen i projekcji uzywaja blokady read.
3. Reload, rehydracja i wszystkie mutacje runtime uzywaja blokady write.
4. Writer ma priorytet, aby reload nie glodowal przy stalej serii
   odczytow.
5. Writer moze byc reentrant w tym samym watku.
6. Upgrade aktywnej blokady read do write jest zabroniony.
7. Timeout blokady jest osobnym bledem technicznym.
8. Blokada procesu nie jest blokada rozproszona i nie pozwala wlaczyc
   wielu workerow dla wspolnego runtime w pamieci.

### 38.6. Jawne PIN-y jako ograniczenie POC

1. Aktualnie PIN jest synchronizowany w dwie strony miedzy
   `hub_staff.pin` i manifestem.
2. Porownanie stale czasowo nie oznacza, ze zapis plaintext jest
   bezpieczny.
3. Prawdziwe dane wymagaja hasha z salt, resetu PIN-u i zakazu eksportu
   sekretu do manifestu.
4. Do zakonczenia migracji PIN-ow obecny model jest oznaczony jako POC,
   nie jako docelowe uwierzytelnienie.

### 38.7. Retencja logow i otwarty zapis YAML

1. `system_logs` przechowuje wpisy maksymalnie 30 dni.
2. Cleanup jest wykonywany przy inicjalizacji DB i po insercie przez
   trigger `trg_system_logs_retention`.
3. Usuniecie starego logu jest kontrolowanym wyjatkiem od append-only;
   aktywne wpisy nie sa aktualizowane ani zastepowane.
4. `config.yaml` i `hub_manifest.yaml` wymagaja jeszcze atomowego zapisu
   przez plik tymczasowy i replace.
5. Cala operacja `read -> compare -> write` wymaga blokady
   miedzyprocesowej.
6. `notes/AUTO-SYNC` wymaga retencji 30 dni niezaleznej od
   `system_logs`.
7. Do wdrozenia punktow 4-6 rownolegly start procesow synchronizujacych
   YAML pozostaje jawnym ograniczeniem.

### 38.8. Limity logowania

Docelowy rate limit sklada sie z trzech niezaleznych warstw:

1. konto albo `staff_id`,
2. konto/staff + IP,
3. IP globalne z wyzszym progiem.

Limit nowej proby nie moze zamknac aktywnej sesji innego pracownika.
Client API nie moze pozwalac na blokowanie znanego konta wylacznie przez
powtarzanie jego identyfikatora. Hub API nie moze pozwalac jednej osobie
zablokowac calego wspolnego IP huba po kilku blednych PIN-ach.

Pelne wdrozenie tej reguly jest czescia planu wielosesyjnego stanu huba.

### 38.9. SSE Client API

1. Glowny JWT sesji i token SSE sa roznymi tokenami.
2. Token SSE zawiera `typ=client_sse`, `sub`, `jti`, `actor_type`,
   `iat`, `exp`, `session_exp`, `connection_id`, `stream_id`,
   `stream_open_until` i `finance_staff_id`. JWT nie moze byc wazny
   dluzej od prywatnej sesji. Osobne 30 s ogranicza dopuszczenie nowego GET,
   nie czas zycia juz otwartego kanalu.
3. `jti` wskazuje aktywny rekord `login_sessions`.
4. Token SSE nie jest przekazywany w URL ani zwracany do kodu
   JavaScript.
5. `POST /client-api/events/token` ustawia cookie `kc_client_sse`:
   - `HttpOnly`,
   - `SameSite=Strict`,
   - path `/client-api/events/{connection_id}/{stream_id}`,
   - Max-Age 30 s dla otwarcia tej generacji,
   - `Secure` przy HTTPS.
6. Cookie jest magazynem zarzadzanym przez przegladarke, a nie plikiem
   projektu.
7. `EventSource` otwiera `/client-api/events/{connection_id}/{stream_id}`
   bez query tokenu. Nie ma GET starej sciezki ani kanalow bez generacji.
8. Stream sprawdza sesje przy otwarciu, przed chronionym zdarzeniem oraz
   po skierowanej invalidacji. Idle wysyla tylko keepalive, bez pollingu DB.
9. Logout, revoke albo expiry uniewaznia stream.
10. Disconnect pojedynczego kanalu wskazuje prywatny SID, dokument i
    dokladna generacje; usuwa tylko jej cookie i kanal. Pozny cleanup nie
    zamyka nastepcy ani innej karty. Logout calej sesji jest osobna operacja.
11. SSE jest sygnalem zmiany. REST i DB pozostaja zrodlem prawdy.
12. Kazda proba otwarcia, rowniez StrictMode/reconnect, otrzymuje nowa
    monotoniczna generacje w obrebie dokumentu. Broker rezerwuje i konsumuje
    ja jednokrotnie, atomowo, oraz odrzuca replay/spoznione POST/GET.
    Disconnect przed otwarciem uniemozliwia wskrzeszenie tej generacji.
13. Rejestr dopuszczen jest ograniczony w pamieci (domyslnie 8192);
    wygasle leases sa czyszczone przy requestach, nie przez okresowy scan.
    JWT dawnego dopuszczenia nie otwiera kanalu po wygasnieciu lease.

### 38.10. Aktualny kontekst finansowy staff

1. Rola, hub, `person_id`, aktywnosc i konto wyplat staff nie sa
   przechowywane w bezterminowym cache procesu.
2. Operacja odczytuje aktualny stan DB.
3. Zmiana roli, aktywnosci albo konta wyplat obowiazuje bez restartu API.
4. Brak aktywnego staff nie moze byc zastepowany losowym workerem.

### 38.11. SQLite WAL

Kazde aplikacyjne polaczenie plikowej SQLite przez wspolna fabryke
ustawia:

```text
PRAGMA busy_timeout = 30000
PRAGMA journal_mode = WAL
PRAGMA synchronous = NORMAL
```

WAL pozwala odczytom dzialac podczas zapisu. Nie tworzy wielu
rownoleglych writerow. Na SQLite obowiazuje jeden worker na proces API i
serializacja transakcji zapisu. Wiele workerow oraz instancji wymaga
PostgreSQL i zewnetrznego brokera/outboxu dla zdarzen.

#### 38.11.1. Co oznaczaja pliki SQLite

Przy wlaczonym WAL obok `kenya_courier.db` pojawiaja sie czasem:

- `kenya_courier.db-wal` - dziennik zmian oczekujacych na checkpoint do
  glownego pliku bazy,
- `kenya_courier.db-shm` - plik wspoldzielonej pamieci uzywany przez
  polaczenia SQLite do koordynacji odczytow i pozycji wpisow WAL.

Oba pliki sa elementem jednego mechanizmu SQLite, a nie dodatkowymi bazami
ani drugim zrodlem prawdy. Nie wolno usuwac ich podczas pracy procesu.
Po poprawnym zamknieciu polaczen SQLite moze wykonac checkpoint i usunac je
automatycznie. Jezeli pozostaja po awarii, sa czescia odzyskiwania tej samej
bazy i nie nalezy ich kasowac przed sprawdzeniem integralnosci.

#### 38.11.2. Jak SQL zapisuje dane w trybie WAL

WAL wlacza sie na polaczeniu SQLite, a nie na pojedynczym `INSERT`:

```sql
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA busy_timeout = 30000;
```

Zwykla transakcja nadal wyglada tak:

```sql
BEGIN IMMEDIATE;
INSERT INTO example_table(value) VALUES (:value);
UPDATE example_table SET value = :new_value WHERE id = :id;
COMMIT;
```

SQL nie zapisuje bezposrednio do pliku `.db-wal`. Aplikacja wykonuje
`INSERT`, `UPDATE` i `COMMIT` na bazie, a SQLite fizycznie zapisuje zmienione
strony najpierw do WAL. Dopiero pozniejszy checkpoint przepisuje te strony
do glownego pliku `.db`.

`COMMIT` konczy transakcje logiczna. Po nim inne polaczenie widzi nowy stan
zgodnie z izolacja SQLite, nawet gdy dane fizycznie sa jeszcze w WAL. WAL
nie jest druga baza, kolejka SQL ani miejscem, ktore aplikacja powinna
odpytywac instrukcja `SELECT`.

`BEGIN IMMEDIATE` pozwala procesowi wejsc w transakcje zapisu i blokuje
konkurencyjnych writerow. `busy_timeout` nie uruchamia drugiego zapisu
rownolegle; tylko pozwala poczekac na zwolnienie blokady. Gdy czas minie,
SQLite zwraca `SQLITE_BUSY`/`database is locked`, a aplikacja musi wykonac
rollback i obsluzyc blad.

#### 38.11.3. Rola plikow `.db-wal` i `.db-shm`

Przy pracy WAL obok glownego pliku moga powstac:

- `kenya_courier.db-wal` - dziennik stron zmienionych po ostatnim
  checkpointcie,
- `kenya_courier.db-shm` - pomocniczy plik wspoldzielonej pamieci i indeksu
  WAL dla polaczen SQLite.

Pliki te sa czescia jednej bazy i moga zniknac po checkpointcie oraz
poprawnym zamknieciu wszystkich polaczen. Nie wolno ich usuwac podczas
pracy procesu, bo inne polaczenie moze ich wlasnie uzywac do odczytu lub
odzyskania zatwierdzonych stron.

W projekcie sa wylaczone z kontroli Git przez:

```gitignore
*.db-wal
*.db-shm
```

To tylko reguła kontroli wersji. Nie wylacza WAL i nie usuwa plikow z
dysku. Odczyt, zapis, checkpoint i odzyskiwanie pozostaja odpowiedzialnoscia
SQLite.

#### 38.11.4. Co WAL poprawia, a czego nie rozwiazuje

WAL pozwala czytelnikom kontynuowac odczyt podczas aktywnej transakcji
zapisu i ogranicza konflikty odczyt-versus-zapis. Nadal istnieje tylko
jeden aktywny writer SQLite dla danego pliku bazy. WAL nie zapewnia:

1. wielu rownoleglych transakcji zapisu,
2. kolejki aplikacyjnej dla nieograniczonej liczby procesow,
3. automatycznego rozwiazywania konfliktow biznesowych,
4. ochrony przed usunieciem danych przez bledne SQL.

Przy duzej liczbie rownoleglych writerow potrzebna jest baza serwerowa,
np. PostgreSQL, zamiast dalszego zwiekszania liczby procesow SQLite.

### 41. Przeplyw opakowania i danych paczki w Hub App

#### 41.1. Odczyt danych po wyborze kierunku

Po kliknieciu huba na mapie oraz po zmianie statusu przelacznika Hub App
wykonuje pelne `GET /hub-api/context`. Backend pobiera aktualny stan z DB:

1. worki z `bags`, niezaleznie od ich statusu,
2. powiazania z `bag_parcels`,
3. dane paczek z `packages`,
4. skrzynki z `hub_box_inventory` i assety z `hub_asset_inventory`,
5. mape, konta i zalogowanych pracownikow.

Drzewo worka jest panelem informacyjnym. Pokazuje wszystkie znane statusy,
w szczegolnosci:

```text
OPEN, SEALED, RESERVED, LOADING, IN_TRANSIT, RETURNED, RECEIVED
```

Nowy status dopisany w DB rowniez pozostaje widoczny jako nieaktywny tekst.
Tylko `OPEN` i `SEALED` maja aktywny przelacznik.

#### 41.2. Informacje wyswietlane przy paczce

`bag_parcels.package_id` jest kluczem odczytu paczki. Jesli rekord paczki
istnieje w `packages`, backend dolacza:

- code4 do wyswietlenia,
- trase wyliczona tym samym mechanizmem runtime co formularz,
- trase teoretyczna jako zapas, gdy trasa operacyjna jest niedostepna,
- `dim_x`, `dim_y`, `dim_z` z `packages.dimension_json`,
- objetosc `dim_x * dim_y * dim_z`,
- wage z `dimension_json`.

Wizualny format ma postac:

```text
GAYM   AA->BA->DA
0,1 x 0,2 x 0,5 m = 0,010 m3 | 2,0 kg
```

Separator dziesietny i grupowanie liczb wynikaja z ustawien formatu liczb
aktywnego pracownika Hub App.

#### 41.3. Osierocone powiazanie paczki

Jesli `bag_parcels.package_id` wskazuje rekord, ktorego nie ma w `packages`,
DB zawiera osierocone powiazanie. W takim przypadku mozna bezpiecznie
pokazac tylko identyfikator paczki z `bag_parcels`; nie wolno wymyslac
wymiarow, wagi ani pelnej trasy na podstawie agregatu worka. `bag_metrics_json`
opisuje worek jako calosc i nie jest zrodlem danych pojedynczej paczki.

Taki przypadek wymaga odtworzenia nadrzednego rekordu `packages` z kopii
DB albo audytu migracyjnego. Przyszle usuwanie paczki powiazanej z workiem
powinno byc blokowane relacja FK albo procedura domenowa, aby nie powstawaly
nowe osierocone wpisy.

#### 41.4. Zmiana statusu worka

Przelaczenie `OPEN/SEALED` przebiega nastepujaco:

```text
odczyt statusu z DB
  -> wyslanie expected_status + status docelowy
  -> warunkowy UPDATE
  -> changes() = 1: COMMIT i pelne odswiezenie context
  -> changes() = 0: odczyt aktualnego statusu, ROLLBACK, HTTP 409,
                    pelne odswiezenie context
```

Przyklad konfliktu: pracownik widzi `SEALED`, ale inny proces ustawia
`RESERVED`. Pierwszy pracownik wysyla `expected_status=SEALED` i
`status=OPEN`; warunek SQL nie pasuje, wiec `RESERVED` pozostaje bez zmian,
a interfejs pokazuje `RESERVED` jako nieaktywny stan informacyjny.

### 38.12. Kodowanie tekstu

1. Pliki zrodlowe sa czytane i zapisywane jako UTF-8.
2. Nowe techniczne teksty UI pozostaja ASCII, jezeli Unicode nie jest
   wymagany przez dany widok.
3. Znane sekwencje mojibake sa objete testem regresyjnym.
4. Build nie moze ponownie wprowadzic uszkodzonego napisu do artefaktu.

### 38.13. Stan odbioru audytu

- zamkniete: `1, 2, 4, 5, 9, 10, 11, 12`,
- czesciowo zamkniety: `7`,
- swiadomy tryb POC: `3, 6`,
- plan otwarty: `8`.

Gate po ostatnich poprawkach:

- pelny zestaw: `464 passed`,
- build Client App: poprawny,
- build Courier Viz: poprawny z istniejacymi ostrzezeniami lint,
- SQLite: `journal_mode=wal`,
- DB: `integrity_check=ok`.

## 39. Planowany wielosesyjny stan pracy huba

**Status: model sesji i presence wdrozony; egzekwowanie gotowosci w pelnym
flow kurierskim pozostaje kolejnym etapem.**

### 39.1. Rozdzielenie stanow

System ma rozdzielic:

1. aktywna sesje pracownika,
2. aktora konkretnej operacji,
3. deklaracje obecnosci operatora,
4. wynikowy stan huba,
5. dostepnosc uslug,
6. administracyjna aktywnosc topologii.

`hubs.is_active_manual` pozostaje administracyjnym stanem topologii i nie
jest zmieniane przez login, logout, przerwe ani przelogowanie.

### 39.2. Stany obecnosci

Hierarchia wyniku:

```text
CLOSED = 0
PAUSE  = 1
SLEEP  = 2
OPEN   = 3
```

Najwyzsza deklaracja aktywnego operatora wygrywa. Przyklad:

- `PAUSE + OPEN = OPEN`,
- po wylogowaniu operatora `OPEN` pozostajacy `PAUSE` daje `PAUSE`,
- brak deklaracji daje `CLOSED`, chyba ze ostatni operator jawnie wybierze
  kontrolowany stan przerwy zgodny z regulami sesji.

Znaczenie:

- `OPEN`: pelna obsluga zgodnie z flagami uslug,
- `SLEEP`: brak zwyklej obslugi klienta, ale mozliwa obsluga kuriera,
- `PAUSE`: hub liczy sie jako otwarty organizacyjnie, ale czasowo nie
  obsluguje klientow ani kurierow,
- `CLOSED`: brak obslugi operacyjnej.

### 39.3. Planowane dane

Snapshot tabeli `hubs` ma otrzymac:

- `hub_presence_mode`,
- `presence_updated_at`,
- `presence_updated_by`,
- `can_exchange_kes_to_vkes`,
- `can_exchange_vkes_to_kes`,
- `can_accept_client_parcels`,
- `can_release_client_parcels`,
- `can_accept_courier_parcels`,
- `can_accept_bags`,
- `can_release_bags`.

Zrodlem prawdy operatorow ma byc nowa tabela
`hub_presence_sessions` powiazana z `login_sessions`. Historia ma byc
append-only w `hub_presence_events`.

Minimalne eventy:

- `hub_operator_joined`,
- `hub_operator_relogin`,
- `hub_operator_left`,
- `hub_presence_opened`,
- `hub_presence_paused`,
- `hub_presence_sleep`,
- `hub_presence_closed`,
- `hub_capability_changed`,
- `hub_presence_recalculated`.

### 39.4. Login, przelogowanie i logout

1. Pierwszy login pyta, czy otworzyc hub, czy wejsc obserwacyjnie.
2. `Przeloguj` zmienia operatora w tej samej karcie bez zmiany aktora
   operacji rozpoczetym przez poprzednika.
3. `Wyloguj` zamyka konkretna sesje i deklaracje operatora.
4. Ostatni operator jawnie wybiera `CLOSED`, `PAUSE` albo `SLEEP`.
5. Stan i uslugi sa widoczne obok przyciskow przelogowania oraz logout,
   a nie ukryte w odleglym Setup.
6. Telefon, komputer i druga karta maja niezalezne `session_id`.

### 39.5. Atomowosc

Jedna komenda zmiany obecnosci ma w jednej transakcji:

1. sprawdzic sesje, staff, hub i uprawnienia,
2. zmienic deklaracje operatora,
3. przeliczyc wynik pozostalych deklaracji,
4. zapisac snapshot `hubs`,
5. zapisac event,
6. wykonac commit.

Restart odtwarza stan z DB. Stan nie moze zalezec od pamieci jednej
przegladarki ani procesu.

### 39.6. Raport czasu pracy Hub App

Hub App udostepnia raport `Czas pracy` oparty na `login_sessions` i
append-only `hub_presence_events`. Raport nie sumuje rekordow sesji. Dla
jednego `staff_id` scala nakladajace sie przedzialy, a deklaracje operatora
rozstrzyga priorytetem `OPEN > SLEEP > PAUSE`. Dzieki temu telefon i komputer
uzywane rownolegle nie tworza podwojnych godzin pracy.

Raport rozdziela:

- czas obecnosci online,
- czas operatora stanowiacy podstawe HR,
- czas `OPEN`, `SLEEP`, `PAUSE` i obserwacji,
- czas nakladania sesji i maksymalna liczbe sesji,
- dzienny stan huba oraz chronologiczna os zdarzen.

Aktywne sesje sa obcinane do czasu wygenerowania raportu. Odpowiedz HTTP nie
ujawnia surowych identyfikatorow sesji ani tokenow. Referencja `S{seq}` sluzy
wylacznie do rozpoznania, ze dwa punkty osi dotycza tej samej kolejnosci
logowania.

Czas operatora moze stanowic podstawe do wyliczenia pensji po dolaczeniu
zatwierdzonej stawki. Nie jest sam w sobie kwota wynagrodzenia. Dane sesyjne
nie sa tez miara ilosciowego performance; liczba paczek, workow i operacji
finansowych musi pochodzic z odpowiednich eventow domenowych.

### 39.7. Indywidualny widok pracownika

`Czas Pracownika` pokazuje zawsze jedna osobe. Domyslnie jest nia pracownik
aktualnej sesji Hub App; wybor innego `staff_id` zmienia caly raport i os
czasu, a nie tylko etykiete naglowka.

Kazdy lokalny dzien `Africa/Nairobi` zawiera unikalny czas zalogowania,
unikalny czas operatora, rozklad `OPEN/SLEEP/PAUSE`, czas obserwacyjny,
overlap sesji, pierwsze logowanie i ostatni punkt aktywnosci. Aktywna sesja
ma jawny znacznik `ongoing`; interfejs nie przedstawia chwili wygenerowania
raportu jako rzeczywistego wylogowania.

Widok moze sluzyc pracownikowi do kontroli wlasnej obecnosci, a HR do
sprawdzenia dni pracy, przerw i podstawy czasowej. Nadal nie wylicza kwoty
pensji ani ilosciowego performance bez polityki wynagrodzen i eventow
domenowych.

## 40. Identyfikacja paczki: code4 i trwaly klucz techniczny

### 40.1. Historia decyzji

Poprzedni model traktowal czteroznakowy kod, np. `GAYM`, jednoczesnie jako
kod dla czlowieka i `packages.id`. Kod mogl wrocic do obiegu po zakonczeniu
paczki. Zachowywalo to bardzo krotkie oznaczenie, ale laczylo dwie rozne
rzeczy: wygodna etykiete i trwaly klucz rekordu.

Ten model zostal zastapiony. Cztery znaki nadal moga powtarzac sie po
czasie, lecz kazda finalna paczka ma odrebny, niezmienny rekord w DB.
Powodem zmiany jest ochrona historii append-only oraz jednoznaczne
powiazanie paczki, eventow, workow i finansow.

### 40.2. Nowy format

```text
widoczne dla czlowieka: GAYM
wewnetrzne packages.id: GAYM-BH-xdjHurh
```

Sufiks jest numerycznym Base64URL czasu UTC `YYYYMMDDhhmmssSSS`.
Przyklad:

```text
2026-08-01T21:22:46.753Z
-> 20260801212246753
-> BH-xdjHurh
-> GAYM-BH-xdjHurh
```

Base64URL stosuje `-` i `_` zamiast znakow `+` i `/`, dlatego techniczny
klucz jest bezpieczny w URL. Sufiks rozroznia wielkie i male litery. Tylko
prefiks `code4` jest normalizowany do wielkich liter.

### 40.3. Rozdzielenie prezentacji i zapisu

Czlowiek widzi cztery znaki w Client App, Hub App, TUI, komunikatach
nadania, odbiorze, kartach paczki i inventory assetu. Backend zachowuje
pelny identyfikator w:

- `packages.id`,
- `package_events.package_id`,
- `bag_parcels.package_id` i runtime workow,
- wpisach `wallet_ledger` powiazanych z paczka,
- komendach domenowych, anulowaniu i wewnetrznych odpowiedziach API.

`TMP-...` oznacza nadal szkic/szablon i uzywa sekwencyjnej czesci Base32,
np. `TMP-A`. `TX-...` oznacza voucher, przedplate albo grupe finansowa.
Zwykly TX operacji niebedacej voucherem ma format `TX-{8HEX}-{4HEX}`.
Voucher `paid` klienta oraz platnosc utworzona przez Hub App maja format
`TX-{kod_czlowieka}-{8HEX}-{4HEX}`. Nie sa one finalnym
`code4-Base64URL`.

### 40.4. Wyszukiwanie powtarzalnego code4

Po wpisaniu `code4` Hub API i TUI wybieraja najnowszy rekord wedlug
`packages.db_ts DESC`, a przy identycznym czasie wedlug `rowid DESC`.
Podpowiedzi pokazuja maksymalnie jeden, najnowszy rekord dla danego
`code4`. Starszy rekord pozostaje dostepny audytowo po pelnym ID.

Jest to aktualna regula operacyjna i moze ulec zmianie, jezeli w praktyce
wybor najnowszego rekordu nie bedzie wystarczajacy.

### 40.5. Dlaczego package_events ma FOREIGN KEY

Relacja jest jawna:

```text
packages.id
    -> package_events.package_id
```

`FOREIGN KEY` oznacza, ze DB nie pozwoli utworzyc eventu dla
nieistniejacej paczki. Daje to trzy podstawowe gwarancje:

1. kazdy event ma rekord paczki, do ktorego mozna wrocic,
2. blad kolejnosci zapisu albo literowka nie tworzy osieroconej historii,
3. paczki z eventami nie mozna usunac i przez przypadek oderwac od audytu.

Relacja korzysta z `ON DELETE RESTRICT`. Finalny rekord paczki z historia
jest trwaly. Szkic lub voucher bez eventow moze zostac usuniety zgodnie z
jego procedura.

Nie wolno ustawic `UNIQUE(package_id)`, bo jedna paczka ma wiele eventow.
Prawidlowa unikalnosc to:

```text
UNIQUE(package_id, seq)
```

W ten sposob `GAYM-BH-xdjHurh` moze miec eventy 1, 2, 3 itd., ale nie
moze miec dwoch eventow z tym samym `seq`.

### 40.6. Migracja starej historii

Istniejacy event bez rekordu `packages` nie jest usuwany. Przed zalozeniem
klucza obcego system tworzy minimalny nadrzedny rekord ze statusem
`archived_history`. Jest to zachowanie migracyjne, nie nowy status
operacyjny paczki. Od chwili wlaczenia relacji nowe osierocone eventy sa
odrzucane przez SQLite.

## 42. Zlecenie kuriera i rozliczenie po dostarczeniu

### 42.1. Trwaly proces i nietrwala gielda

Gielda ofert jest projekcja runtime budowana na biezaco z DB. Nie przechowuje
snapshotu ofert i po restarcie powstaje od nowa. Klikniecie `Rezerwuj` zmienia
jednak oferte w trwaly proces `courier_job` z publicznym numerem `CJ-*`.

Trwaly proces korzysta z:

- `courier_jobs` - naglowek, uczestnicy, trasa, status i stan rozliczenia,
- `courier_job_items` - opakowania, zamrozony manifest, wagi i uzgodniona kwota,
- `courier_job_events` - append-only historia komend i przekazan,
- `bags`, `bag_parcels`, `bag_events`, `packages` i `package_events` - fizyczny
  stan opakowan i paczek,
- `wallet_ledger` - jedyne zrodlo prawdy dla rozliczenia finansowego.

### 42.2. Stany zlecenia

Podstawowy przebieg ma postac:

```text
RESERVED -> LOADING -> IN_TRANSIT -> RECEIVED -> COMPLETED
```

- `RESERVED`: kurier zarezerwowal opakowanie na okres 10-45 minut,
- `LOADING`: hub zrodlowy zamrozil manifest i podal wage,
- `IN_TRANSIT`: kurier potwierdzil odbior i podal wage,
- `RECEIVED`: hub docelowy przejal custody; wyplata nadal ma stan `PENDING`,
- `COMPLETED`: worker otworzyl opakowanie, porownal zawartosc z manifestem i
  zakonczyl rozliczenie; wyplata ma stan `SETTLED`.

Stała tolerancja `+/- 200 g` została zastąpiona zamrożonym przedziałem netto
`payload_weight_min_kg..payload_weight_max_kg`, obliczanym osobno z wag paczek
w manifeście. Pomiar w zakresie pozwala kontynuować właściwą operację. Pomiar
poza zakresem zapisuje event i uruchamia tryb operacyjny `WEIGHT_REVIEW`; nie
zwalnia opakowania ani aktywnego claimu. `WEIGHT_REVIEW` nie jest etapem
transportu i nie zastępuje kolumny `courier_jobs.status`. Bazowy status nadal
wynosi `RESERVED` (kontrola przed rozpoczęciem ładowania) albo `LOADING`
(kontrola w trwającym procesie), natomiast API wystawia osobno:

```text
status = RESERVED | LOADING
operational_mode = WEIGHT_REVIEW
weight_review_state = OPEN | RESUMED
```

Hub App i Client App wyświetlają wtedy etykietę `WEIGHT_REVIEW`, lecz komendy,
blokady CAS, zapytania DB i przejścia domenowe korzystają z prawdziwego statusu
bazowego. `operational_mode` jest projekcją wyliczaną z bazowego statusu i
`weight_review_state`, a nie kolejną mutowalną kolumną. Dzięki temu rewizja może
czasowo zatrzymać różne etapy bez utraty informacji, na którym etapie transport
faktycznie się znajduje. Flaga sporu pozostaje osobnym sygnałem, a pełny proces
rozstrzygania sporu nadal wymaga osobnego projektu.

Po projekcji `RECEIVED` karta w `Client App -> Obsluga zamowien` nie zmienia
ukladu ani zawartosci. Push aktualizuje tylko status, a dotychczasowe dane huba,
opakowan, wag, manifestu i zegara pozostaja widoczne. Zakonczona karta nie ma
limitu czasu, dopoki kurier pozostaje w tym menu. Odliczanie 60 sekund rozpoczyna
sie dopiero po opuszczeniu menu. Powrot przed uplywem minuty anuluje odliczanie;
kolejne opuszczenie uruchamia nowa pelna minute. Po pelnej minucie poza menu
karta jest ukrywana lokalnie. Mechanizm korzysta ze zdarzenia montowania i
odmontowania widoku oraz `sessionStorage`, bez pollingu i bez zapisu prezentacji
do DB.

### 42.3. Finalizacja w hubie docelowym

SKIP_KM_PRICE_V1 z 2026-10-06 jest wdrozony w kodzie i dodaje tylko filtr
dopuszczenia nowych ofert. Nie zmienia opisanego tutaj rozliczenia.
Kanoniczna specyfikacja i ograniczenia odbioru sa na poczatku PRD.

Po `RECEIVED` Hub App pokazuje dla kazdego opakowania zamrozona liste
`package_id`. Worker musi fizycznie otworzyc opakowanie i jawnie potwierdzic
sprawdzenie zawartosci. Backend ponownie wylicza manifest bezposrednio z
`bag_parcels`; sam checkbox interfejsu nie zastepuje kontroli serwerowej.

Finalizacja wykorzystuje istniejacy mechanizm rozliczenia TUI per paczka.
Zachowane pozostaja:

- wyliczenie udzialu transportowego z `km_rate`,
- bonus przeskoku i surplus,
- podzial kurier/hub/manager,
- kolejnosc tracking -> `package_events` -> fingerprint -> `wallet_ledger`,
- integer minor units, dotychczasowe `event_key`, HMAC i lancuch ledgera.

Premia za przeskok nie jest finansowana z konta `SYSTEM` i nie zwieksza
budzetu paczki. Dla kazdej paczki planer przed wystawieniem oferty rezerwuje
ja jako osobna pozycje `skip_bonus_minor` w zamrozonym planie. Kurier otrzymuje
stawke kilometrowa za rzeczywista trase oraz jawna premie. Oszczednosc wobec
trasy standardowej pozostaje `system_surplus`, a `tail_reserve` obejmuje cala
dalsza droge oraz koncowe wydanie paczki klientowi. Zamkniety budzet ma postac:

```text
current_leg_payout + skip_bonus + destination_handling + tail_reserve
+ system_surplus = balance_snapshot
```

W hubie koncowym `destination_handling` obejmuje `30 VKES` za outtake na
polke, natomiast `tail_reserve` zachowuje osobne `20 VKES` na pozniejsze
wydanie klientowi. Oszczednosc przeskoku nie moze zwiekszac podstawowej
wyplaty kuriera ani konsumowac tej rezerwy.

Przy przeskoku wyplata transportowa kuriera i premia tworza jeden logiczny
transfer ledgera `courier_payout_bonus` (jedna para debet/kredyt), odpowiadajacy
finansowemu wpisowi `courier_bonus` w `package_events`. Kwota transferu jest
suma naleznej kurierowi czesci podstawowej wyplaty i calej premii.
Metadane zachowuja oba skladniki osobno jako `base_payout_minor` oraz
`skip_bonus_minor`, aby audyt mogl odtworzyc naliczenie bez rozbijania jednej
wyplaty na dwa wpisy. Jedna para ledgera obciaza konto huba zrodlowego i
blokade srodkow danej paczki. Cala premia trafia do kuriera jako wynagrodzenie
za ominiecie huba; nie podlega ponownemu podzialowi kurier/hub/manager. Brak
srodkow na premie, obsluge huba i dalsza droge wyklucza przeskok przed
pokazaniem go na gieldzie. Jezeli podstawowa wyplata podlega podzialowi z hubem
lub managerem, ich czesci pozostaja osobnymi wpisami zgodnie z modelem splitu;
nie rozdziela sie natomiast podstawy naleznej kurierowi od jego premii.

Plany zamrozone przed wprowadzeniem `skip_bonus_minor` zachowuja dotychczasowy
fingerprint. Podczas ich finalizacji system wydziela premie z zapisanej puli
biezacego odcinka, bez zmiany historycznego kontraktu i bez obciazania
`SYSTEM`.

Nie powstaje uproszczony wpis wyplaty na podstawie kwoty pokazanej przez
frontend. Kwoty zapisane w `courier_job_items` sa snapshotem oferty, natomiast
rozliczenie wykonuje kanoniczna logika paczki.

### 42.4. Atomowosc i ponowienie

Jedna transakcja `COMPLETED` obejmuje stan runtime, paczki, worki,
`package_events`, wszystkie wymagane wpisy `wallet_ledger`, aktualizacje
`courier_jobs` oraz terminalny `courier_job_event`. Brak wymaganego eventu,
fingerprintu albo wpisu finansowego powoduje rollback calej operacji i
pozostawia zlecenie jako `RECEIVED/PENDING`.

Kazda finalizacja ma `idempotency_key`. Ponowienie tej samej komendy zwraca
istniejace `COMPLETED` i nie uruchamia drugi raz ruchu paczek ani wyplaty.
SSE jest wysylane dopiero na podstawie zatwierdzonego eventu `COMPLETED`.

### 42.5. Odporność push/SSE i odbudowa po restarcie

DB pozostaje jedynym źródłem prawdy. Powiadomienie SSE nie przechowuje stanu
biznesowego i jest wyłącznie sygnałem, że odbiorca ma pobrać aktualna projekcje.
Nie istnieje proces, ktory w tle porownuje liczniki, hashe albo snapshoty tabel.

Kazdy `courier_job_event` po udanym zapisie tworzy `PostCommitEvent` zawierajacy
`job_id`, `event_key`, wersje oraz jawnych odbiorcow: kuriera, hub zrodlowy i
hub docelowy. Dispatcher uwalnia go dopiero po zatwierdzeniu transakcji.
Rollback nie emituje eventu.

Zdarzenie kierowane miedzy procesami jest najpierw utrwalane w
`post_commit_outbox` w tej samej transakcji co zmiana biznesowa. Kazdy rekord
ma lease, ograniczony retry i stan `DEAD`. Dispatcher nalezy do lifecycle ASGI
i jest uruchamiany w `AnyIO TaskGroup`. Uzywa wspolnego
`httpx.AsyncClient`; awaria jednego celu nie moze blokowac lokalnego odbiorcy
drugiego celu. `client` i `hub` sa stalymi trwalymi celami. `admin` jest celem
trwalym tylko wtedy, gdy proces Admin API posiada aktywny systemowy znacznik
obecnosci dla tej bazy. Znacznik istnieje przez czas zycia procesu, jest
zwalniany przez system operacyjny rowniez po awarii i jest sprawdzany tylko
podczas zapisu konkretnego zdarzenia — nie jest pollingiem. Wylaczony Admin nie
tworzy bezuzytecznych retry ani rekordow `DEAD`; po ponownym uruchomieniu
odtwarza jeden aktualny snapshot z DB. Glowne TUI otrzymuje ten sam lokalny
event po `COMMIT` jako obserwator i nie oznacza zadnego rekordu celu jako
dostarczonego. W trybie hybrydowym Admin+TUI invalidacja odtwarza wspolny
runtime przed wyslaniem sygnalu SSE, dlatego oba widoki korzystaja z tej samej
zatwierdzonej projekcji bez timera.

Potwierdzenie projekcji gieldy Client API jest per aktywny obserwator SSE i
`staff_id`, nie globalnie dla rewizji. Poprawna pusta gielda ma fingerprint;
blad projekcji nie jest pustym widokiem, nie podmienia ostatniego poprawnego
fingerprintu ani nie potwierdza kursora tego obserwatora. Sukces A i blad B
pozwalaja od razu powiadomic A, ale cala dostawa eventu pozostaje nieudana.
Ponowienie tej samej rewizji obsluguje B, korzystajac ze wspolnego cache
globalnych ofert i poprawnych projekcji, bez kolejnego builda/push dla A.
Nowy obserwator nie dziedziczy potwierdzenia innej karty. Stan potwierdzen
jest przechowywany tylko w pamieci, ograniczony do zywych kanalow i ich rol.
Kursor potwierdzenia i rewizja push pochodza z tego samego snapshotu co
fingerprinty. Retry starego eventu po nowszym COMMIT nie emituje starej
wersji dla aktualnej projekcji i nie wymusza odtworzenia starego stanu.

ACK i deduplikacja event_id wymagaja sukcesu wszystkich lokalnych adapterow;
czesciowe niepowodzenie zwraca `delivered=0` i nie zamyka eventu jako sukcesu.
Aktualny retry outboxu jest ograniczony (domyslnie 20 prob dla Client API),
z pojedynczymi znanymi terminami i opoznieniem do 60 s plus jitter, bez
cyklicznego skanowania danych biznesowych. Wyczerpanie prob daje jawny
`DEAD`, `last_error` oraz log bledu. Tej samej dostawy mozna jawnie sprobowac
ponownie przez uwierzytelniony wewnetrzny endpoint post-commit-event;
historyczne rekordy DEAD nie sa automatycznie odtwarzane. Nowe zdarzenia
i reconnect odczytuja aktualny stan, nie odgrywaja nieaktualnej projekcji.

Hub, Client i Admin wystawiaja SSE przez `sse-starlette`. Kazdy odbiorca ma
ograniczona kolejke, heartbeat i timeout wysylki. Przepelnienie kolejki moze
usunac najstarszy sygnal, poniewaz stan odtwarza snapshot, a nie historia SSE.

Po restarcie lub reconnect panel wykonuje jeden snapshot aktywnych zlecen,
gieldy i platnosci. Reconnect Client SSE jawnie uruchamia snapshot kont,
historii, inboxa, oczekujacych platnosci i konkretnego otwartego intenta.
Nie odgrywa historycznych powiadomien. Przywrocenie starej
kopii SQLite poza kontrola aplikacji wymaga restartu/reconnect albo recznego
odswiezenia; system nie skanuje pliku DB, `mtime`, rewizji ani eventow w celu
wykrycia zewnetrznej podmiany.

Przegladarka pamieta ostatnie SSE `event_id`, przekazuje `Last-Event-ID` przy
reconnect i stosuje wykladniczy backoff z jitterem. Kursor sluzy do wykrycia
utraty ciaglosci, nie do odgrywania stanu. Po reconnect serwer jawnie nakazuje
snapshot i widok pobiera aktualna projekcje REST.

`event_id`, `entry_hash`, rewizja rynku i `state_hash` pozostaja mechanizmami
audytu, CAS, diagnostyki i wersjonowania odpowiedzi. Nie sa kursorami stalej
petli odczytujacej DB.

### 42.6. Anulowanie podczas zaladunku i rewizja wagi

Anulowanie zgloszone przez kuriera w stanie `LOADING` wymaga pomiaru zwracanego
opakowania przez hub. Pomiar jest porownywany z zamrozonym zakresem netto
`payload_weight_min_kg..payload_weight_max_kg`:

- wartosc wewnatrz zakresu, lacznie z granicami, pozwala od razu zakonczyc
  zlecenie jako `CANCELLED`,
- wartosc poza zakresem otwiera `WEIGHT_REVIEW` bez zwalniania opakowania,
- powrot z `Rewizji` prowadzi do `Wydanie` i udostepnia jawna akcje
  `ZAAKCEPTUJ CANCELED`,
- koncowa akceptacja korzysta z niezmienionej wagi poddanej rewizji; podmiana
  liczby jest blokowana,
- dopiero koncowa akceptacja zwalnia `active_claim`, przywraca poprzedni stan
  opakowania i zapisuje terminalny event `CANCELLED`.

Eventy przechowuja pomiar, zamrozony zakres, strone i wielkosc przekroczenia,
aktora oraz informacje, ze anulowanie zaakceptowano po rewizji. Operacja jest
atomowa i nie tworzy wyplaty kuriera.

### 42.7. Zdarzenia rynku, płatności i terminy

Gielda nie ma trwalego snapshotu ofert. Trigger podnosi
`courier_market_state.revision`, a `EventAwareConnection` otrzymuje od
natywnego SQLite authorizera liste tabel rzeczywiscie zmienionych przez
instrukcje SQL. Nie rozpoznaje tabel przez parsowanie tekstu SQL. Po `COMMIT`
emituje jeden
`courier_market_update`. Frontend pobiera wtedy aktualna mape, obserwowane
drogi i oferty. `state_hash` moze pozostac do diagnostyki, ale nie jest
cyklicznie odczytywany.

Platnosci emituja event z niezmiennego `payment_intent_events`. Zawiera on
bezpieczny status, `intent_id`, wersje `event_id`, termin oraz routing do
ownerow i huba. Nie porownuje sie w tle pelnych rekordow ani ich hashy.

Wygasanie obsluguje `DeadlineScheduler` uruchamiany przez Client API, Hub API
oraz glowne TUI. Przy starcie kazdy proces wykonuje pojedynczy recovery
aktywnych `expires_at`, `reserved_until` i
`reservation_extension_finalize_at`, a potem blokujaco czeka do najblizszego
znanego terminu. Utworzenie, zmiana albo anulowanie terminu aktualizuje kolejke
schedulera zdarzeniem po `COMMIT`. Scheduler nie wykonuje okresowego SELECT-u.

Stan wykonania terminu jest trwaly w `business_deadline_tasks`: zawiera wersje
zrodla, liczbe prob, nastepny znany termin retry, lease CAS i ostatni blad.
Tylko jeden proces moze wykonac dany termin. Starszy event nie nadpisuje
nowszego terminu. Proces, ktory nie uzyska lease, czeka wylacznie do
utrwalonego `locked_until` albo `next_attempt_at`; po `RESOLVED`/`DEAD` usuwa
termin z pamieci i nie odpytuje go cyklicznie. Po wyczerpaniu prob zadanie przechodzi do `DEAD`, emituje
alarm post-commit i nie znika po restarcie. Tabela jest tworzona przez migracje
glownego TUI; API jedynie sprawdza schemat v4. Wersja v4 rozszerza zamkniety
zbior celow `post_commit_outbox` o `admin` bez utraty starszych rekordow.

Event `runtime_invalidation` niesie `changed_tables`. Tabele topologii,
paczek i opakowan sa odtwarzane jako jeden spojny graf obiektow. Sama zmiana
`app_settings` odswieza tylko projekcje ustawien, a tabele zlecen obslugiwane
repozytoryjnie nie wywoluja pelnej rehydratacji, jezeli transakcja nie zmienila
rowniez workow, paczek albo topologii.

SSE keepalive jest dozwolony, poniewaz nie odczytuje stanu biznesowego. Token
ma znany termin waznosci, a logout wysyla jawne zdarzenie zamkniecia kolejki.
Po rozlaczeniu przegladarka nie odtwarza nietrwalej historii; po ponownym
polaczeniu pobiera jeden aktualny snapshot.

`entry_hash`, HMAC eventow oraz HMAC i podpisy `wallet_ledger` nadal
odpowiadaja za integralnosc historii. Sygnal SSE nie jest podpisem, komenda ani
zrodlem prawdy.

## 43. Rozdzielony magazyn huba

Ta sekcja zastępuje historyczne opisy wspólnej tabeli `hub_inventory`.

### 43.1. Tabele i identyfikatory

- `hubs.bag_stock` przechowuje liczbę anonimowych, pustych worków fizycznych.
- `hub_box_inventory` przechowuje wiersz dla każdej fizycznej skrzynki.
- `hub_asset_inventory` przechowuje wiersz dla każdego assetu.
- Tabele skrzynek i assetów mają wspólne kolumny opisowe, masę i wymiary.
  Tylko skrzynki mają dodatkowe indywidualne limity `max_*`.
- Jedynym technicznym identyfikatorem rekordu jest `id`; nie istnieje kolumna
  `inv_code`.
- Assety otrzymują najniższe wolne `id` od `0` i nie mają górnej granicy.
- Skrzynki mają `id >= 1024`. W Code32 wartość `1024` to `BAA`, dlatego
  początkowe identyfikatory skrzynek są od razu trzyznakowe.
- Pula assetów i pula skrzynek są niezależne, ponieważ znajdują się w osobnych
  tabelach. Ten sam numer nie powoduje konfliktu między typami.

### 43.2. Kolumny danych

Obie tabele inventory zawierają wspólny zestaw:

```text
id, hub_code2, status, is_degraded,
name, sn, note, system_date,
weight, dim_x, dim_y, dim_z,
db_ts
```

`hub_box_inventory` zawiera dodatkowo:

```text
max_weight_kg, max_dim_x_m, max_dim_y_m, max_dim_z_m
```

`weight` jest masą w kilogramach, a `dim_x`, `dim_y`, `dim_z` są fizycznymi
wymiarami w metrach. Dla skrzynki pola `max_*` są indywidualnymi limitami;
`NULL` oznacza dziedziczenie standardu `package_box_limits_json`, natomiast
`max_weight_kg=0` oznacza jawny brak limitu wagowego. Objętość pozostaje
wartością pochodną `dim_x * dim_y * dim_z` i nie ma osobnej kolumny.

Kolumny `tare_*` zostały usunięte. Masa własna skrzynki pochodzi z `weight`, a
tolerancje masy pustego opakowania ze standardu W/S. Asset nie ma kolumn
`max_*`, ponieważ nie jest opakowaniem dla paczek.

Nie istnieją `inv_type`, `meta_json` ani `pkg_code4`. Typ wynika z tabeli,
dane opisowe mają osobne typowane kolumny, a powiązanie assetu z paczką wynika
z `packages.parcel_tag` i historii `package_events`. Zawartość skrzynki wynika
z `bags` oraz `bag_parcels`.

### 43.3. Migracja i atomowość

`init_db()` automatycznie przenosi stary model:

1. `BAG_STOCK.meta_json.count` do `hubs.bag_stock`,
2. rekordy `BOX` do `hub_box_inventory`,
3. rekordy `ASSET` do `hub_asset_inventory`,
4. klucze starego `meta_json` do odpowiednich kolumn,
5. historyczne `tare_weight_kg` do `weight`, jeśli nowe pole było puste,
6. zależność cargo skrzynki na `hub_box_inventory(id)`.

Stara tabela jest usuwana dopiero po migracji zależności. Migracja jest
idempotentna: ponowne uruchomienie aktualizuje już przeniesione rekordy zamiast
pozostawiać częściowo stary stan.

### 43.4. Wyszukiwanie Hub API

- Wyszukiwanie opakowań łączy kontenery transportowe z `bags` ze skrzynkami
  stojącymi na półce w `hub_box_inventory`.
- Skrzynka obecna już w `bags` jest deduplikowana z wynikiem półkowym.
- Wyszukiwanie assetu odczytuje bezpośrednio `id`, `name`, `note` i `sn` z
  `hub_asset_inventory`; nie parsuje JSON podczas requestu.
- Szczegóły assetu pokazują typowane pola, aktualny hub, status i historię
  paczek odtworzoną z `packages.parcel_tag` oraz `package_events`.
- Publiczne kontrakty zwracają pole `id`. Kod Code32 jest tylko reprezentacją
  tego ID dla pracownika, a nie drugą kolumną ani drugim identyfikatorem.

## 44. Aktualne zasady zadań kurierskich 11–19

Ta sekcja domyka synchronizację `curier_task.md` od punktu 11. Jeżeli starszy
fragment PRD opisuje stałe `+/- 200 g`, automatyczne dopasowanie W/V/S według
gabarytu, algorytm połowy różnicy, kolumny `tare_*`, trzyznakową bazę każdej
skrzynki albo automatyczne zamknięcie worka przy `9 kg`, obowiązuje poniższy
model.

| Punkt zadania | Obowiązujący wynik |
|---|---|
| 11 | Giełda ma tryb `OPEN + SEALED` albo `SEALED only`; rezerwacja zapamiętuje pierwotny stan, a wyjazd zamyka W/S zarezerwowane jako `OPEN`. |
| 12 | Oferta jest projekcją runtime, lecz skuteczna rezerwacja tworzy trwałe `courier_jobs`, `courier_job_items` i append-only `courier_job_events`. Trasa jest po rezerwacji zamrożona. |
| 13 | Manifest ma zamrożony przedział dopuszczalnej wagi netto wyliczony z wag paczek. Masa W/S nie jest do niego dodawana. |
| 14 | Zakres jest pokazywany stale przy konkretnym opakowaniu jako dolna granica, bieżąca waga netto i górna granica. |
| 15 | Pomiar poza zakresem otwiera `WEIGHT_REVIEW`, zatrzymuje właściwy krok procesu i nie zwalnia claimu. |
| 16 | `Rewizja` jest trwałym trybem diagnostycznym nałożonym na bazowy status, ale korekty paczek są szkicem do chwili jawnej komendy zapisu. |
| 17 | Puste W/S są planowane globalnie po istniejących korytarzach paczek i rezerwowane atomowo jako osobny manifest cargo. |
| 18 | W/S mają wspólny model `weight`, `dim_*`, `max_weight_kg`, `max_dim_*`; obecnie działa tylko informacyjne ostrzeżenie wagowe. |
| 19 | Egzekwowanie gabarytów i pojemności pozostaje niewdrożone do czasu uzgodnienia sposobu obracania i układania paczek. |

### 44.1. Przedział dopuszczalnej wagi netto

Konfiguracja `package_weight_tolerance_bands_json` zawiera rosnące górne
granice masy pojedynczej paczki. Dla każdej paczki wybierany jest pierwszy pas,
dla którego `weight_kg <= max_weight_kg`; ostatni pas ma granicę `null`.
Tolerancja stała i procentowa sumują się, a część procentowa jest zaokrąglana w
górę do `0,001 kg`.

```text
parcel_tolerance_kg = tolerance_kg
                    + ceil_to_0.001(weight_kg * tolerance_percent / 100)

parcel_min_kg = max(0, weight_kg - parcel_tolerance_kg)
parcel_max_kg = weight_kg + parcel_tolerance_kg

payload_weight_min_kg = suma(parcel_min_kg)
payload_weight_max_kg = suma(parcel_max_kg)
```

Dla niepustego manifestu prezentowane minimum jest co najmniej `0,1 kg`.
Granice, hash polityki i manifest są zamrażane w `courier_job_items` podczas
przejścia do `LOADING`. Aktywnego zlecenia nie przelicza się później według
nowego `config.yaml`. W, V i S z identyczną zawartością mają identyczny zakres
netto.

### 44.2. Wyświetlanie i Rewizja

Przy opakowaniu wyświetlany jest zapis:

```text
dolna granica  ⬇️  bieżąca suma wag paczek  ⬆️  górna granica
```

Środkowa wartość zawsze oznacza zawartość netto. Pomiar na granicy jest zgodny.
Pomiar poza zakresem zapisuje wartość, stronę i wielkość przekroczenia oraz
otwiera `WEIGHT_REVIEW`. Opakowanie nie wraca wtedy na giełdę, timer zlecenia
jest zatrzymany, a kurier nie może potwierdzić kolejnego kroku transportu.

Menu `Rewizja` odtwarza zamrożony manifest, zdarzenie wywołujące kontrolę,
aktora i parametry paczek. Lokalne zmiany wag, najdłuższego boku, sortowania i
ukrycia paczek są szkicem. `Porzuć zmiany` usuwa szkic, ale nie zamyka trwałej
rewizji. Zapis korekty albo rozstrzygnięcie rewizji wymaga osobnej jawnej
komendy domenowej i audytowego eventu.

### 44.3. Parametry W/S a przedział manifestu

Istnieją dwa niezależne pojęcia:

1. `payload_weight_min_kg..payload_weight_max_kg` opisuje dopuszczalną masę
   netto paczek i obecnie steruje kontrolą przekazania;
2. `weight`, `dim_*`, `max_weight_kg`, `max_dim_*` opisują fizyczne opakowanie.

`weight` W/S nie jest dodawane ani do bieżącej wagi netto, ani do zamrożonych
granic. `max_weight_kg` nie rozszerza tolerancji manifestu: jest oddzielnym
limitem zawartości i przy wartości dodatniej może obecnie wygenerować tylko
ostrzeżenie. `dim_*` opisuje bryłę opakowania, a `max_dim_*` otwór dla jednej
paczki; żadna z tych wartości nie wybiera automatycznie W/V/S.

### 44.4. Granica przyszłego trybu egzekwowania

`hub_manifest.yaml` przechowuje dla każdego huba
`container_limits_enforced: false`. Wartość `false` oznacza ręczny wybór W/V/S,
nieblokujące ostrzeżenie wagowe i brak egzekwowania gabarytów. Nie wolno
produkcyjnie włączyć `true`, dopóki nie zostaną zdefiniowane:

- dozwolone obroty paczki względem `max_dim_*`,
- model zajętej objętości i nieregularnego kształtu worka,
- zasada układania wielu paczek,
- rozróżnienie ostrzeżenia i blokady,
- atomowe ponowne sprawdzenie po równoległej zmianie zawartości,
- komunikaty i proces wyjątku dla pracownika.

## 45. Atomowa topologia i zamrozony kontrakt kuriera

### 45.1. Jedno zrodlo grafu

`operational_topology.py` jest wspolnym, framework-neutral zrodlem sasiedztwa
dla routingu, map Hub App i Client App, obserwacji kuriera, gieldy oraz
walidacji kontraktu. Krawedz jest wyliczana jako wzajemne najblizsze
sasiedztwo w sektorze kierunkowym. Jest obserwowana w obie strony pod jednym
kluczem bez kierunku, np. `AA|DA`; kierunek konkretnego kursu pozostaje osobna
cecha oferty.

Wpis:

```json
[{"active_hub":"AA","scale":1,"disabled_hubs":[]}]
```

oznacza wszystkie aktualne drogi od AA do sasiadow w zasiegu jednego kroku.
Lista nie przechowuje kombinacji drog. Resolver uwzglednia huby teoretyczne,
huby operacyjnie aktywne, dynamiczne pojawienie sie blizszego sasiada, jawne
blokady, odleglosc drogi oraz `can_dispatch_bags/can_accept_bags`. Sesja
`observe` daje podglad, ale sama nie otwiera huba.

Efektywny tryb `OPEN`, ustawiony przez aktywnego workera albo managera,
automatycznie ustawia `can_dispatch_bags=1` i `can_accept_bags=1` dla huba.
Regula nie zalezy od roli operatora i jest stosowana także przy odtworzeniu
istniejacej sesji `OPEN`. Zmiana jest atomowa ze zmiana presence i zapisywana
jako `hub_capability_changed`; pozostale tryby nadal bramkuja efektywna
gotowosc.

### 45.2. Rewizja i atomowa zmiana

`topology_state` przechowuje biezaca rewizje i fingerprint grafu, a
append-only `topology_events` zapisuje powod, aktora oraz roznice hubow i
krawedzi. Login/logout operatora, presence, capabilities, move, add, rename,
delete, geo, link i synchronizacja manifestu sa finalizowane we wspolnej
transakcji:

```text
BEGIN IMMEDIATE
  -> snapshot przed zmiana
  -> zapis przez CAS
  -> snapshot po zmianie
  -> topology_event + rewizja
  -> walidacja aktywnych kontraktow
  -> eventy domenowe + outbox
COMMIT
```

Nieudany COMMIT nie zmienia runtime i nie wysyla SSE. Hub API, Client API i
Admin API nie migruja schematu; wymagaja schema v5 wraz z triggerami. Migracje
uruchamia tylko glowne TUI.

### 45.3. Rezerwacja i niezmienny manifest

Przegladarka wysyla klucze wybranych ofert, jawne zmniejszenie cargo,
`expected_market_revision`, `expected_topology_revision` i klucz
idempotencji. Nie jest zrodlem prawdy dla trasy, ceny, typu opakowania ani
zawartosci. Backend po uzyskaniu blokady ponownie sprawdza serwerowa oferte,
obserwacje kuriera, cala trase, status/holder W/V/S, plan cargo i liste paczek.

Skuteczna rezerwacja zapisuje w `courier_jobs` zaakceptowane rewizje,
fingerprint trasy i `route_state=VALID`. `courier_job_items` zapisuje
`reservation_manifest_json/hash` oraz `reserved_content_revision`, a
`bags.content_revision` rosnie przy kazdej legalnej zmianie zawartosci.
Triggery DB blokuja zmiane `bag_parcels` oraz danych trasy paczki w kontenerze
`RESERVED`, `LOADING` albo `IN_TRANSIT`.

### 45.4. Konflikt trasy bez retargetowania

Przed kazdym przejsciem zlecenia backend w tej samej transakcji sprawdza
wersje, idempotencje, aktora i jego sesje, termin DB, status i holdera, cargo,
manifest oraz aktualna topologie.

- gdy trasa nadal jest poprawna, aktualizowana jest tylko rewizja ostatniej
  walidacji;
- gdy trasa przestala byc poprawna przed odbiorem, kontrakt dostaje trwale
  `CANCEL_REQUIRED` i wymaga jawnego anulowania;
- gdy problem powstal po `IN_TRANSIT`, kontrakt dostaje `RETURN_REQUIRED`, a
  kurier oraz oba huby otrzymuja instrukcje fizycznego zwrotu;
- ponowne otwarcie drogi nie wznawia kontraktu po cichu;
- cel, zamrozona trasa, holder i inventory nie sa automatycznie zmieniane.

W/S/V maja te same zabezpieczenia trasy, statusu i manifestu. V nie zmienia
fizycznego stocku. Cargo pustych W/S i custody A sa nadal finalizowane w tej
samej transakcji zlecenia.

### 45.5. Selektywny push map

Event topologii jest sygnalem po COMMIT, nie zrodlem prawdy. Broker zachowuje
fingerprint ostatniego widoku kazdej aktywnej sesji Hub App oraz konfiguracji
obserwacji kazdego zalogowanego kuriera. Po evencie przelicza snapshot i wysyla
`network_update` albo `courier_market_update` tylko wtedy, gdy dany fingerprint
sie zmienil. Uzytkownik offline nie dostaje osobnego zdarzenia; po loginie lub
reconnect pobiera aktualny snapshot.

Frontend ignoruje starsze rewizje. Zwykla zmiana magazynowa, np.
`hubs.bag_stock`, nie jest traktowana jako zmiana grafu tylko dlatego, ze
korzysta z tabeli `hubs`. Projekt pozostaje bez pollingu.

## 46. SSE Pub/Sub: niezalezne kanaly powiadomien

### 46.1. Zasada glowna

SSE jest transportem powiadomien po udanym `COMMIT`, a nie osobna sesja
logowania, magazynem danych ani zrodlem prawdy. Jedna sesja logowania moze miec
wiele niezaleznych kanalow SSE. Kanal jest przypisany do konkretnego
`connection_id`, a nie do nowego rekordu w `login_sessions`.

```text
jedna sesja logowania
|- karta przegladarki 1 -> connection_id A -> token SSE A -> kolejka A
|- karta przegladarki 2 -> connection_id B -> token SSE B -> kolejka B
`- karta przegladarki 3 -> connection_id C -> token SSE C -> kolejka C
```

Otworzenie kolejnej karty albo okna nie tworzy dodatkowej sesji tozsamosci.
Tworzy tylko kolejny kanal powiadomien. Wylogowanie, wygasniecie albo
uniewaznienie sesji zamyka wszystkie jej kanaly SSE. Zamkniecie jednej karty
zamyka tylko jej kanal.

Token SSE jest zwiazany z `session_id` i `connection_id`. Token z jednego
kanalu nie moze posluzyc do odczytu ani zamkniecia innego kanalu. Stan kanalu,
identyfikator polaczenia i kolejka sa runtime'owe; nie tworzymy w DB wiersza
dla kazdej karty. Trwale dane nadal znajduja sie w domenowych tabelach,
rewizjach i `post_commit_outbox`.

### 46.2. Co oznacza karta aplikacji

Karta menu, np. `Gielda`, `Finanse` albo `Paczki`, nie jest osobnym
polaczeniem sieciowym. W jednej karcie przegladarki aplikacja utrzymuje jeden
kanal SSE i moze odbierac rozne typy zdarzen:

- `courier_market_update` dla zlecen i rewizji gieldy;
- `topology_changed` lub `network_update` dla mapy i obserwowanych drog;
- zdarzenia finansowe i platnicze;
- zdarzenia sesji, w tym zamkniecie lub wygasniecie sesji.

Dlatego Gielda moze zostac zaktualizowana w tle, gdy uzytkownik jest w innym
menu. Zdarzenie nie zawiera calej gieldy. Jest sygnalem, ze nalezy sprawdzic
rewizje. Jezeli rewizja sie nie zmienila, aplikacja niczego nie pobiera. Jezeli
jest nowsza, pobiera jeden spojny snapshot przez HTTP API. Po wejsciu do menu,
reconnect albo restarcie pobierany jest aktualny snapshot z DB.

### 46.3. Kolejki i ograniczenia

Kazdy kanal ma wlasna ograniczona kolejke. Jest to ograniczenie techniczne
chroniace pamiec procesu, a nie ograniczenie liczby operacji biznesowych.
Limity sa stosowane na kanal, sesje i wlasciciela odpowiednio do API; nie
wolno przez przypadek wyrzucic kanalu nalezacego do innej sesji.

System nie musi nakladac sztucznego limitu na zwykle korzystanie z aplikacji,
ale musi odrzucic lub zamknac nadmiarowe kanaly, gdy przekraczaja bezpieczna
pojemnosc. Odrzucenie ma jawny powod, a nie ciche usuniecie danych.

Gdy odbiorca nie nadaza i kolejka sie przepelni:

1. kanal zostaje oznaczony jako wymagajacy resetu;
2. frontend dostaje `stream_reset` z `snapshot_required=true`;
3. kanal nawiazuje ponownie polaczenie;
4. frontend pobiera aktualny snapshot i dopiero potem przyjmuje kolejne
   zdarzenia.

Nie probujemy odtwarzac nieskonczonej historii z pamieci i nie uznajemy
przepelnienia za cicha utrate spojnosc widoku.

### 46.4. Wspolne zasady Client, Hub i Admin API

Client API, Hub API i Admin API korzystaja z tego samego modelu:

- zdarzenie jest publikowane dopiero po udanym `COMMIT`;
- outbox przechowuje trwale zdarzenie do czasu potwierdzenia obslugi;
- broker SSE dostarcza je tylko aktywnym, uprawnionym kanalom;
- kolejnosc jest zachowana dla tego samego odbiorcy i agregatu;
- bledy transportu nie cofaja operacji domenowej;
- reconnect nie zaklada, ze poprzednie powiadomienia dotarly — zawsze moze
  zazadac snapshotu;
- ponowienia maja limit, a zdarzenie, ktore nie moze zostac dostarczone,
  otrzymuje jawny stan `DEAD` zamiast nieskonczonej petli.

SSE nie jest pollingiem. Serwer utrzymuje otwarty kanal i czeka na zdarzenie
pochodzace z outboxa lub runtime dispatchera. Timeout/heartbeat sluzy tylko
do utrzymania polaczenia i wykrywania rozlaczenia; nie odczytuje cyklicznie
stanu giełdy, sesji ani sald.

### 46.5. Zasada architektoniczna

W projekcie preferujemy jak najmniej ograniczen biznesowych i jak najwiecej
niezaleznych kanalow potrzebnych do pracy. Ograniczenia SSE istnieja tylko po
to, aby pojedynczy blad, zawieszona karta lub odbiorca nie mogl wyczerpac
zasobow calego procesu. Nie tworzymy dodatkowych sesji logowania tylko po to,
aby obsluzyc powiadomienia, nie zapisujemy kanalow SSE jako danych biznesowych
i nie odswiezamy widokow przez cykliczne pytania do bazy.

## 47. Aktualizacja stanu wdrożenia po commicie `9eccc1cd` (2026-09-02)

### 47.1. Zakres przeglądu

Niniejsza aktualizacja opisuje zmiany pomiędzy commitem
`9eccc1cd7f92ba3a3a5a7d844111d20ac989dac9`, który zawierał poprzednią
aktualizację PRD, a commitem `29c61281`, a także bieżące zmiany robocze
dotyczące ikon opakowań. Zakres obejmuje 35 commitów. Po odrzuceniu lokalnego
środowiska `.venv-semantic`, wygenerowanego `dist`, cache Vite i roboczej bazy
SQLite zmieniono około 150 plików źródłowych i dokumentacyjnych.

Najważniejsze wykonane obszary odpowiadają:

- punktowi 15 w `task.md` — ograniczenie wielokrotnych odczytów, obliczeń i renderów;
- punktowi 16 w `task.md` — trwałe, graficzne sortowanie opakowań;
- punktowi 17 w `task.md` — katalog ikon, ikony tagów i opcjonalne wyszukiwanie semantyczne;
- punktom 35–37 w `Finance_task.md` — integralność HOLD, widok blokad oraz
  rozdzielenie szkiców i nadań klienta od fizycznych paczek.

Zmiany zachowują główne granice architektury: API przekazuje zwykłe dane do
warstwy aplikacyjnej, domena nie zależy od FastAPI/Pydantic, wpisy produkcyjne
`wallet_ledger` nadal przechodzą przez `ledger_service`, a synchronizacja
widoków odbywa się zdarzeniowo po `COMMIT`, bez pollingu.

### 47.2. Uporządkowanie statusów zlecenia przed sortowaniem

`WEIGHT_REVIEW` stał się rzeczywistym, trwałym statusem
`courier_jobs.status`. Otwarcie rewizji oraz rewizja powstała przy anulowaniu
zapisują ten stan w DB, a zakończenie rewizji przywraca poprawny stan bazowy
`RESERVED` albo `LOADING`. Migracja rozpoznaje starsze aktywne rekordy, które
miały rewizję zapisaną osobno, i przenosi je do nowego statusu. Listy zleceń,
SSE oraz widoki właścicielskie zostały dostosowane do
tej samej semantyki. Dzięki temu frontend nie musi odgadywać rewizji z kilku
pól i nie może pokazać stanu innego niż używany przez reguły domenowe.

Kolejne poprawki ujednoliciły przejścia giełda → rezerwacja → transport →
przyjęcie i przygotowały źródłowe opakowanie do rozpoczęcia trwałej pracy
`SORTING`. Zmiany te są podstawą punktu 16, a nie osobnym, równoległym
procesem sortowania.

Uwaga 2026-10-10: wzmianka o blokadzie zamkniecia nie byla dowodem wdrozenia
pelnego flow ostatniego operatora. Aktualna, obowiazujaca zasada tymczasowego
zamkniecia przy transportach jest opisana w 66: ostrzezenie i jawna decyzja,
nie bezterminowe blokowanie wylogowania ani automatyczne anulowanie zlecen.

## 48. Punkt 15 `task.md` — ograniczenie marnowania zasobów

### 48.1. Wspólne zadania startowe React

Client App i Hub App korzystają ze wspólnego koordynatora
`web-common/startupTaskCoordinator.js`. Dla klucza obejmującego sesję i
zasób istnieje najwyżej jedno aktywne zadanie startowe. Kolejni odbiorcy
czekają na tę samą obietnicę zamiast wysyłać identyczne żądanie.

Mechanizm rozwiązuje podwójne uruchamianie efektów przez React `StrictMode`
bez wyłączania tego trybu. Poprawny wynik może zostać krótko ponownie użyty,
ale błąd nie jest cache'owany. Wylogowanie, zmiana konta, workera albo huba
unieważnia klucze poprzedniej sesji, więc opóźniona odpowiedź nie może
nadpisać danych nowego użytkownika.

### 48.2. Jeden store finansowy Client App

`FinanceProvider` oraz `financeStore.js` stały się wspólnym źródłem zasobów:
kont, historii, płatności oczekujących, inboxu i zaproszeń. Dashboard,
FinancePage i dzwonek nie uruchamiają już niezależnych odczytów tych samych
danych po `finance_ready` lub `finance_update`.

Każdy zasób ma jedną operację `in-flight`. Jeżeli podczas odczytu nadejdzie
nowszy push, store planuje najwyżej jedno kolejne uzgodnienie, już dla
najnowszego stanu. Odczytywane są tylko zasoby używane przez zamontowane
widoki. Lokalny listener pojedynczej, otwartej intencji płatniczej pozostaje
osobny, ponieważ nie reprezentuje wspólnego snapshotu finansów.

### 48.3. Jeden snapshot zleceń kurierskich

W Client App Dashboard utrzymuje jeden snapshot zleceń dla giełdy, obsługi
zlecenia i dzwonka. W Hub App jeden snapshot w `App.jsx` zasila inbox,
Wydanie/Przyjęcie i Rewizję. Pierwszy wynik jest przekazywany komponentom
potomnym, więc nie wykonują drugiego GET po zamontowaniu.

Równoległe odświeżenia są łączone, delty SSE są scalane bezpośrednio, a push
w trakcie odczytu może spowodować tylko jedno dodatkowe uzgodnienie z DB.
Zakres snapshotu obejmuje zalogowanego workera i hub, dlatego odpowiedź ze
starego zakresu nie może zostać przyjęta po zmianie sesji.

Odtwarzanie nieprzeczytanych powiadomien Hub i Client/Kurier:

- Licznik nie jest niezaleznym skalarem liczacym dostarczenia SSE. Wynika
  z nieprzeczytanych kart zlecen; duplikat tej samej wiadomosci nie zwieksza go.
- Po logowaniu, reconnect i resecie strumienia aktualny snapshot odtwarza
  aktywne karty. Brak lokalnego potwierdzenia odczytu danego stanu oznacza
  nieprzeczytana karte, nawet gdy push powstal bez aktywnego polaczenia.
- Potwierdzenie odczytu dotyczy konkretnego `job_id` i istotnego stanu karty.
  Zmiana statusu, korekta wagi, zwrot albo zatwierdzona zmiana ETA moze
  ponownie zwrocic uwage; sam GET, duplikat, hydratacja pozycji, zmiana
  technicznej wersji i roboczy draft czasu tego nie robia.
- Cicha projekcja wlasnej czynnosci kuriera nie staje sie nowa poczta po
  reconnect. Projekcja dla drugiej strony nie zastepuje jej powiadomienia.
  Hub odtwarza takze korekte LOADING, RECEIVING_STARTED i RETURN_REQUIRED
  w odpowiednim hubie, bez ponownego pokazywania zlecenia w niewlasnym miejscu.
- Odczyt jest lokalny: Hub ma zakres staff + hub, Client zakres osoby.
  Karty tej samej przegladarki synchronizuja potwierdzenia przez storage event;
  osobne urzadzenia nie wspoldziela localStorage. Zmiana ownera/tokena odrzuca
  spoznione odpowiedzi. Nie dodajemy tabel ani globalnego statusu odczytu w DB.
- Otwarta, widoczna i aktywna skrzynka oznacza pokazane karty jako przeczytane;
  ukryta/nieaktywna karta nie kasuje nieprzeczytanych podczas naplywu danych.
  Oznaczenia sa ograniczone do 1000 ostatnich zlecen z ochrona nadal aktywnych.
- Odtwarzamy aktualne aktywne sprawy, nie archiwalna poczte ze wszystkich
  zakonczonych eventow DB. Odebrany terminalny push pozostaje w lokalnej
  skrzynce do odczytu; po odczycie i zamknieciu terminalna karta znika.
- Platnosci oczekujace i blokady odbioru w Client sa liczone z aktualnych list
  spraw wymagajacych decyzji. Sam odczyt koperty ich nie usuwa i nie zastępuje
  zatwierdzenia, odmowy platnosci lub odblokowania odbioru.

Implementacja: `web-common/courierInboxReadState.js`, Hub `App.jsx`, Client
`PaymentsInboxBell.jsx`. Bez dodatkowego pollingu ani drugiego GET per karta.

### 48.4. Węższy Hub Context

Pełny `/hub-api/context` służy obecnie do bootstrapu, reconnectu oraz obsługi
ogólnego `hub_context_update`. Dodano lekkie projekcje kont, personelu/sesji i
sieci: `/context/accounts`, `/context/staff` oraz `/context/network`;
obecność nadal ma własny odczyt.

Zdarzenia paczek, szkiców, płatności i zleceń nie pobierają już całego
kontekstu huba. Każda dziedzina odświeża swój fragment lub scala własną
deltę. Sygnały tego samego zasobu korzystają z zasady `in-flight + najwyżej
jedno queued`, bez cyklicznego sprawdzania stanu.

### 48.5. Opóźnienie zapytań w menu `SZUKAJ`

Wyszukiwanie Hub App ma konfigurowalny, jednorazowy debounce. Czas pochodzi z
`system_settings.hub_search_debounce_ms` w `config.yaml`:

```yaml
system_settings:
  hub_search_debounce_ms: '250'
```

Wartość `250` oznacza, że zapytanie zostaje wysłane 250 ms po ostatniej
zmianie tekstu. Nie jest to polling: timer uruchamia się tylko wskutek
czynności workera i wykonuje co najwyżej jeden odczyt dla końcowego tekstu.

Dokładny przebieg wygląda następująco:

1. Każda zmiana tekstu rozpoczyna jednorazowy timer.
2. Kolejny znak przed upływem czasu usuwa poprzedni timer i rozpoczyna nowy
   dla pełnej, aktualnej wartości. Szybkie wpisanie `B`, `BA`, `BAD` powoduje
   jeden request dla `BAD`, a nie trzy requesty.
3. Jeżeli poprzedni timer zdążył uruchomić `fetch`, kolejna zmiana wywołuje
   `AbortController.abort()`. Backend mógł już rozpocząć pracę, dlatego
   frontend dodatkowo porównuje numer sekwencyjny. Spóźniona odpowiedź nie
   może zastąpić wyniku nowszego zapytania.
4. Zmiana rodzaju wyszukiwania, wyczyszczenie pola lub opuszczenie menu
   `SZUKAJ` również usuwa timer i anuluje request poprzedniego zakresu.
5. Nie wprowadzono minimalnej długości. Jednoznakowe szkice, np. `A`, są
   prawidłowe. Brak wyniku pozostawia wpisany tekst i pokazuje pustą listę.
6. Komponenty nie wykonują bezpośredniego `fetch`; przekazują `AbortSignal`
   do `hub-app/src/api.js`, zgodnie ze wspólną granicą transportową aplikacji.

Hub API odczytuje ustawienie przez wspólny mechanizm `app_settings`, ogranicza
je do zakresu `0..2000` ms i zwraca jako `search_debounce_ms` w
`/hub-api/parcels/rules`. Hub App pobiera regułę podczas startu zalogowanej
sesji. `0` wyłącza zauważalne oczekiwanie, ale nadal pozostawia wykonanie
asynchroniczne. Wartość brakująca albo niepoprawna wraca do 250 ms.

Po ręcznej zmianie `config.yaml` trzeba wykonać standardową synchronizację
konfiguracji przez TUI, a następnie ponownie uruchomić Hub API. Dopiero nowa
sesja Hub App otrzyma zaktualizowaną regułę. Samo zapisanie YAML nie zmienia
ustawienia aktywnego procesu.

### 48.6. Wspólny zegar rezerwacji i osobne czasy załadunku

Drugi szczegółowo opisany mechanizm dotyczy zegarów zleceń. Panel nie tworzy
osobnego interwału sekundowego dla każdej karty. Komponent nadrzędny utrzymuje
jeden zegar `now` i przekazuje go wszystkim kartom, co ogranicza liczbę
timerów i zapewnia identyczny moment wyświetlania.

Grupę rezerwacji definiuje para `(courier_id, from_hub_name)`. Wszystkie
aktywne zlecenia tej grupy mają wspólny termin `reserved_until`. Dodanie
kolejnej oferty z tego samego huba nie może skrócić terminu; może go tylko
wydłużyć i atomowo zsynchronizować pozostałe zlecenia.

`reserved_until` pozostaje trwałą kolumną każdego zlecenia. Jawne
`RESERVATION_EXTENDED` zużywa prawo do jednorazowego przedłużenia wyłącznie
dla wybranego CJ. Pozostałe zlecenia otrzymują audyt
`RESERVATION_GROUP_DEADLINE_SYNCED`, ale zachowują własną możliwość przyszłego
przedłużenia.

Pierwsze `Aktywuj załadunek` zmienia na `LOADING` tylko wybrane zlecenie i
uruchamia jego indywidualny czas pracy. Pozostałe zlecenia `RESERVED` tego
kuriera w hubie nadal wymagają osobnego potwierdzenia. Serwer zapisuje im
`reservation_paused_at`, scheduler ich wtedy nie wygasza, a Hub App i Client
App pokazują `00:00`, aby nie sugerować, że zostały już wydane.

Po aktywacji kolejnej karty jej czas załadunku biegnie od jej własnego eventu
`LOADING`. Wspólny jest zatem wyłącznie termin rezerwacji przed pierwszym
załadunkiem. Czasy faktycznej obsługi pozostają osobne, służą statystykom i
nie łączą kilku CJ w jeden kontrakt.

### 48.7. Indeksowe wyszukiwanie B-tree i prefiksy Code32

Przed zmianą `EXPLAIN QUERY PLAN` wykazywał pełne skany `packages`, `hubs` i
historii assetów oraz skan głównego indeksu z dodatkowym sortowaniem dla
`bags`. Przyczyną były funkcje `UPPER`, `TRIM` i `COALESCE` wykonywane w
predykatach oraz ogólne wyszukiwanie przez `LIKE`.

Obecny mechanizm działa następująco:

1. Indeks B-tree przechowuje uporządkowane wartości i wskazania rekordów.
   Prefiks nie jest szukany jako dowolny `LIKE`, lecz jako zakres od
   wpisanego prefiksu do jego górnej granicy. SQLite przechodzi bezpośrednio
   do początku zakresu i czyta tylko pasujące sąsiednie rekordy.
2. Indeks wyrażenia musi odpowiadać predykatowi znak w znak. Przykładowo
   `UPPER(SUBSTR(COALESCE(id, ''), 1, 4))` obsługuje kod paczki, natomiast
   `UPPER(TRIM(COALESCE(parcel_tag, '')))` obsługuje tag historii assetu.
   Równoważnie wyglądająca, ale inna składnia SQL mogłaby ponownie wywołać
   pełny `SCAN`.
3. Skrzynki i assety mają numeryczny `INTEGER PRIMARY KEY`, a worker wpisuje
   Code32. Backend przelicza prefiks Code32 na jeden lub kilka zakresów
   liczbowych i odczytuje je bezpośrednio po kluczu głównym. Nie dodano
   zduplikowanej tekstowej kolumny kodu.
4. `EXPLAIN QUERY PLAN` jest kryterium testowym. Testy wymagają użycia
   właściwego indeksu i wykrywają regresję, w której zmiana zapytania wraca do
   skanowania całej tabeli.

Indeksy obejmują kod paczki, tag historii assetu, identyfikator aktywnego
kontenera i kod huba. Przyspieszają wybór kandydatów, ale nie zmieniają wyniku
ani reguł autoryzacji i widoczności.

Wyszukiwanie dowolnego fragmentu nazwy, notatki lub numeru seryjnego nadal ma
postać `LIKE '%tekst%'` i z definicji nie zna początku zakresu. Zwykły B-tree
nie przyspieszy takiego zapytania, dlatego nie dodano pozornych, bezużytecznych
indeksów. FTS5 pozostaje możliwym przyszłym rozszerzeniem, jeżeli rozmiar
danych uzasadni koszt osobnej tabeli tekstowej i triggerów synchronizacji.

### 48.8. Składnikowy fingerprint rynku

Trzecim mechanizmem jest wersjonowany fingerprint, który pozwala ustalić, czy
widok konkretnego kuriera rzeczywiście się zmienił, bez ponownego sortowania i
haszowania jednego wielkiego JSON-a.

Przepływ jest następujący:

1. Backend buduje jeden wspólny zestaw ofert dla aktualnej rewizji rynku.
2. Z niego tworzy widok konkretnego kuriera: `offers`, `loading` i projekcję
   topologii. Pełne dane nadal są źródłem prawdy; fingerprint jest tylko
   skrótem do porównywania.
3. Przed haszowaniem oferty są kopiowane. Z planu redystrybucji usuwany jest
   globalny `market_revision`, ponieważ zmiana niewidoczna dla kuriera nie
   powinna niepotrzebnie wysłać mu powiadomienia.
4. Każda oferta dostaje osobny SHA-256 identyfikowany przez `job_key` i
   `bag_id`. Każdy wpis `loading` ma własny SHA-256 identyfikowany przez ID i
   status. Kanoniczne bajty identycznego składnika trafiają do ograniczonego
   cache'u `CLIENT_API_MARKET_COMPONENT_CACHE_MAX`, domyślnie 2048 wpisów.
5. Z hashy składników powstaje mały manifest. Wiersze są ustawiane
   deterministycznie według identyfikatora i hasha, a klucze JSON są
   sortowane. Manifest ma jawną wersję `courier-market-components-v1`.
6. Kanoniczny JSON manifestu jest kodowany do UTF-8, a jego SHA-256 tworzy
   `market_fingerprint`. Topologia ma osobny wersjonowany fingerprint.
7. Dla aktywnego połączenia SSE przechowywany jest poprzedni fingerprint.
   Identyczna wartość oznacza brak widocznej zmiany i brak push. Inna wartość
   powoduje lekki `courier_market_update` tylko dla właściwego kuriera.
8. Po sygnale Client App pobiera snapshot. Jeżeli klucz rewizji i kuriera
   nadal pasuje, GET zwraca zapisaną projekcję i gotowy fingerprint zamiast
   ponownie uruchamiać planer, sortowanie, serializację i haszowanie.

```text
oferta/loading
  -> hash składnika
  -> uporządkowany manifest hashy
  -> kanoniczne bajty
  -> market_fingerprint
  -> porównanie
  -> push tylko po rzeczywistej zmianie
```

Zmiana jednej oferty tworzy nowy hash tylko dla dotkniętego składnika oraz
nowy hash małego manifestu. Cache jest ograniczony i nie przechowuje
nieograniczonej historii. SHA-256 nie zastępuje DB, pełnego snapshotu,
walidacji transakcyjnej ani sprawdzenia rewizji; jedynie obniża koszt
porównania stanu już policzonego.

### 48.9. Stan punktu 15

Najważniejsze optymalizacje Client App, Hub App, wyszukiwarki oraz fingerprintu
rynku są wdrożone. Punkt 15 pozostaje jednak szerszym audytem, a nie w pełni
zamkniętym zadaniem. Nadal otwarte są m.in. scalanie odświeżeń Admin UI,
część zaawansowanych wariantów projekcji przyrostowej i niezaznaczone kryteria
odbioru z `task.md`. Nie wolno interpretować wykonanych optymalizacji jako
zgody na usunięcie walidacji transakcyjnej, rewizji lub snapshotu po reconnect.

Aktualizacja 2026-10-03: scalanie zasobow Admin UI i start StrictMode zostaly
wdrozone, a odbior integracji pozostalych wariantow jest zapisany w task.md
15.6/15.7. Opis powyzej zachowuje poprzedni stan, nie aktualny backlog Admina.
Nowe zasady, historia i ograniczenia sa opisane w rozdziale 60.

## 49. Punkt 16 `task.md` — trwałe graficzne sortowanie

### 49.1. Trwały model procesu

`SORTING` jest rzeczywistym statusem `bags.status`. Rozpoczęcie pracy wykonuje
atomowe `RECEIVED -> SORTING` i tworzy lub odtwarza rekord pracy. Dodano cztery
tabele procesu:

- `hub_sorting_works` — nagłówek pracy jednego opakowania źródłowego;
- `hub_sorting_work_items` — pozycje paczek i ich bieżący stan;
- `hub_sorting_worker_focus` — bieżący wybór/focus sesji workera;
- `hub_sorting_item_attempts` — pomiar prób, anulowań i konfliktów.

Repozytorium `hub_sorting_repository.py` odpowiada za rozpoczęcie pracy,
dzierżawy wyboru, atomowe zakończenie pojedynczej pozycji i finalizację
tranzytu. `courier_job_service.py` pozostaje warstwą reguł domenowych i
rozliczeń. Hub API udostępnia typowane komendy rozpoczęcia, ruchu paczki,
wyboru i finalizacji; frontend nie zapisuje stanu sortowania samodzielnie.

### 49.2. Współpraca wielu workerów

Kilka aktywnych sesji może pracować nad tym samym opakowaniem. Każda komenda
ponownie sprawdza wersję pracy, stan paczki i docelowego opakowania. Ruch
wygrany przez jednego workera atomowo przechodzi do `DONE`; konkurencyjna
próba otrzymuje konflikt i nie wykonuje drugiej wypłaty.

Zmiany innych workerów są dostarczane przez outbox/SSE po `COMMIT` i nanoszone
bez lokalnej animacji, aby nie sugerować, że bieżący worker wykonał cudzą
czynność. `POWROT` opuszcza widok, ale nie usuwa trwałej pracy ani wykonanych
ruchów.

### 49.3. Ekran `SORTING`

Hub App otrzymał pełnoekranową kartę opartą na `docs/design/prototypes/sort.drawio`: osiem pól
kierunkowych w układzie 3×3, źródłowe opakowanie w centrum oraz szafę paczek
poniżej. Paczki są skalowane według wymiarów, zachowują pełne identyfikatory,
a linie SVG prowadzą od półki do kierunku lub konkretnego opakowania.

Widok obsługuje kolejność domyślną, ręczne warianty sortowania i rekomendację
`MAX TRANZYT`. Rekomendacja nie wykonuje operacji automatycznie. Jawny wybór
workera ma pierwszeństwo przed propozycją planera.

Dla maksymalnie 30 paczek renderowane są wszystkie półki. Powyżej tego progu
działa wirtualizacja: DOM zawiera półki widoczne i po sześć elementów zapasu
nad oraz pod viewportem. Zaznaczona paczka pozostaje zamontowana, a linie są
rysowane tylko dla widocznych elementów. Scroll jest grupowany przez klatkę
animacji, nie przez polling. Dla testowego zestawu 100 paczek widok utrzymuje
zwykle około 17–19 półek zamiast 100.

### 49.4. Atomowe ruchy paczek

Worker może przenieść paczkę do istniejącego opakowania `OPEN`, utworzyć nowy
worek `W` lub opakowanie wirtualne `V`, wybrać fizyczną skrzynkę `S`, wykonać
`OUTTAKE` albo pozostawić część paczek w źródle i wykonać `GO_TRANSFER`.

Ruch jest zapisywany razem z właściwym rozliczeniem paczki. Stan UI zmienia
się dopiero po sukcesie backendu. Ostatnia przeniesiona paczka nie zamyka
automatycznie źródła; zamknięcie wymaga jawnego `END_SORTING`. Jeżeli po lewej
zostaje co najmniej jedna paczka nadająca się do wspólnego tranzytu, worker
może wybrać tranzyt całego pozostałego opakowania zamiast przepakowania.

### 49.5. Bezpieczny wybór skrzynki i finalizacja

Wybór fizycznej skrzynki tworzy dwuminutową dzierżawę `SELECTING_BOX` w DB.
Blokada działa między sesjami i zapobiega równoczesnemu przypisaniu tej samej
paczki. Opuszczenie wyboru, zmiana menu lub anulowanie zwalnia dzierżawę
natychmiast; timeout jest zabezpieczeniem awaryjnym.

`END_SORTING` kończy pracę po wykonaniu wymaganych ruchów. `GO_TRANSFER`
korzysta z istniejącego atomowego rozliczenia transferu i nie tworzy
równoległej ścieżki finansowej. Zakończona karta pozostaje dostępna do
przeglądu do chwili jawnego powrotu.

### 49.6. Metryki pracy

Zaznaczenie paczki rozpoczyna próbę mierzoną czasem serwera. Zmiana wyboru lub
powrót ją anuluje, poprawny atomowy ruch kończy jako `COMPLETED`, a przegrane
równoległe próby są oznaczane jako konflikt. Widok managera agreguje kategorie
ruchów, p50, p90, średnią, anulowania i konflikty w oknie 7 dni. Raport
odświeża się na żądanie i po zdarzeniu sortowania, bez pollingu.

Punkt 16 został wdrożony etapowo i działa funkcjonalnie. Notatki szczegółowe
oraz `docs/design/prototypes/sort.drawio` pozostają kryteriami dalszego dopracowania grafiki i UX.

## 50. Punkty 35–37 `Finance_task.md` — HOLD i nowy cykl życia paczki

### 50.1. Punkt 35 — niezmienniki finansowe HOLD

HOLD jest trwałą rezerwacją środków, a nie wpisem księgowym. Saldo dostępne
jest liczone jako saldo ostatniego wpisu ledger pomniejszone o sumę aktywnych
`remaining_amount_minor`. Utworzenie HOLD nie zmienia właściciela pieniędzy i
nie dodaje sztucznego debetu do `wallet_ledger`.

Przed wypłatą lub zmianą budżetu system egzekwuje w jednej transakcji:

```text
P = packages.balance
H = wallet_fund_holds.remaining_amount_minor
L = saldo księgowe konta huba
T = suma aktywnych HOLD-ów konta

P = H
L >= T
```

System wymaga dokładnie jednego właściwego HOLD-u paczki, poprawnego łańcucha
`wallet_fund_hold_events`, zgodnego HMAC, kolejnego `seq`, zgodności konta i
wersji compare-and-set. Brak HOLD-u, podwójny HOLD, rozjazd `P/H`, brak
pokrycia `L/T` albo uszkodzony podpis kończy operację rollbackiem. Nie ma
automatycznego wyrównywania ani awaryjnej wypłaty.

### 50.2. Atomowe capture, `check_balance` i `system_top_up`

Rzeczywista wypłata zapisuje pod jednym `finance_tx_group_id`: debit konta
huba i credit odbiorcy przez `ledger_service`, zmniejszenie
`packages.balance`, `HOLD_CAPTURED`, odpowiadający `package_event` oraz hash
wpisu debit ledgera w evencie HOLD. Po zapisach niezmienniki są sprawdzane
ponownie przed `COMMIT`.

Końcowy `check_balance` wykonuje rzeczywisty transfer pozostałości
HUB → SYSTEM i zeruje saldo paczki oraz HOLD przez capture. Nie używa
`HOLD_RELEASED`, bo pieniądze faktycznie opuszczają konto huba.

Wydłużenie trasy przez `system_top_up` wykonuje rzeczywisty przelew
SYSTEM → konto huba, zwiększa `packages.balance`, dopisuje `HOLD_ADJUSTED` i
zwiększa rezerwę o identyczną kwotę. Ledger, event paczki i event HOLD mają
wspólny TX. Brak środków SYSTEM albo błąd dowolnego elementu cofa całość.

### 50.3. Punkt 36 — saldo dostępne i projekcja HOLD w Client API

Client API zwraca dla każdego uprawnionego `account_id` saldo księgowe,
kwotę zablokowaną, saldo dostępne i liczbę aktywnych blokad. Mechanizm nie
zależy od rodzaju właściciela konta, chociaż obecnie HOLD-y transportowe
powstają głównie na kontach operacyjnych hubów.

Historia scala rzeczywiste wpisy ledger z efemeryczną projekcją bieżącego
HOLD-u. Jest to jedna żółta, ujemna pozycja `HOLD` z opisem
`Paczka {package_id}` i identyfikatorem `hold_id:version`. Częściowy capture
zastępuje ją mniejszą projekcją, a pełny capture lub release usuwa ją z
widoku. Projekcja nie zmienia `wallet_ledger`. Dodano filtr historii `HOLD`.

Po zmianie blokady outbox/SSE odświeża finanse tylko osób posiadających
uprawnienie `view` do danego konta. Hub API nadal pokazuje workerowi wyłącznie
`available_balance`, bez powodów i technicznej historii blokad.

Nowe wpisy `parcel_payment` zapisują podpisane metadane potrzebne do opisu:
hub, zlecenie, ID i typ kontenera oraz paczkę. Client API składa z nich zwarty
opis z ikoną W/V/S podczas odczytu. Starszy ledger pozostaje nietknięty.

### 50.4. Punkt 37 — rekordy przed `CREATION` poza `packages`

`packages` przechowuje teraz wyłącznie fizycznie utworzone paczki. Szkice i
gotowe nadania klienta zostały rozdzielone:

- `hub_parcel_drafts` przechowuje szkice `LOCAL`, `GLOBAL` lub `WORKER`, w
  trybie `ONE_TIME` albo `REUSABLE`;
- `client_parcel_submissions` przechowuje kompletne nadania klienta w stanie
  `HELD` albo `PAY_AT_HUB`, wraz z kanonicznym payloadem, hashem i HMAC.

Szkic huba ma dodatni `rowid`, a kod workera to najkrótszy
`Code32(rowid - 1)`: `A...7`, następnie `BA...`. Generator atomowo wybiera
najniższy wolny numer. Nadanie klienta ma pełne ID w rodzaju
`OHV7J-C229F886-6512`; UI pokazuje pięcioznakowy kod z sumą kontrolną, a DB
pilnuje jego jednoznaczności. Constrainty blokują nowe `TMP-*` i `TX-*` w
`packages`; typ rekordu wynika z tabeli, a nie z prefiksu.

### 50.5. Płatność przed utworzeniem i atomowe `CREATION`

Nadanie opłacane VKES przed utworzeniem paczki blokuje środki nadawcy przez
HOLD. Nie tworzy wtedy wpisu ledger, paczki ani eventu `payment_creation`.
Przy potwierdzeniu przez workera jedna transakcja:

1. ponownie sprawdza źródło, trasę, cenę, HMAC, HOLD i wybór opakowania;
2. capture'uje HOLD płatnika i wykonuje bezpośredni przelew nadawca → hub;
3. tworzy finalne `packages.id` oraz `payment_creation`;
4. zapisuje wartość i saldo paczki;
5. tworzy osobny transportowy HOLD na koncie huba;
6. usuwa nadanie klienta albo szkic `ONE_TIME` dopiero po powodzeniu zapisów.

Szkic `REUSABLE` pozostaje dostępny. Błąd dowolnego kroku cofa capture,
ledger, paczkę, event i usunięcie źródła. HOLD płatnika oraz HOLD transportowy
huba są dwoma osobnymi zobowiązaniami.

`INTAKE` jest osobnym, późniejszym commitem: umieszcza istniejącą paczkę w
W/V/S, zapisuje event przyjęcia i capture'uje z transportowego HOLD-u tylko
należność za tę pracę. Worker może po `CREATION` pozostawić paczkę na półce;
nie cofa to poprawnej płatności ani utworzenia paczki.

### 50.6. Trzy niezależne wyszukiwarki

Hub App i Hub API rozdzielają `PACZKI` (wyłącznie `packages`), `SZKICE`
(wyłącznie `hub_parcel_drafts` z kontrolą widoczności) i `NADANIA KLIENTA`
(wyłącznie `client_parcel_submissions` dla huba startowego). Każdy typ ma
własny endpoint i repozytorium. Frontend nie wymaga `TMP-` ani `TX-`.

Utworzenie, konsumpcja i zmiana tych agregatów publikuje zdarzenia po
`COMMIT`; ponowne dostarczenie nie może powtórzyć capture, `CREATION` ani
`INTAKE`.

### 50.7. Rzeczywisty stan punktów finansowych

Kod nowych operacji i blokada nowych `TMP-*`/`TX-*` są aktywne. Zapisane w
`Finance_task.md` wyniki walidacji to: pełny `pytest` — 1075 testów, finance
regression — 163 testy, poprawny audyt łańcucha i oba buildy Vite. Są to
wyniki z implementacji punktu 37, a nie ponowne uruchomienie wykonane podczas
samej aktualizacji PRD.

Ponizszy wynik gate'a i lista brakow sa historia etapu opisanego w 50.7,
nie nowym odczytem DB z 2026-10-02. Nowszy odbior finansowy opisuje 55.9,
a wdrozony powrot z PENDING_INTAKE - 56.3. Nie usuwamy poprzedniego wyniku
ani nie przypisujemy mu daty aktualnej weryfikacji.

Rollout gate bieżącej, historycznej bazy nadal zgłasza stare rekordy HOLD:
`active_hold_subject_missing` oraz `capture_ledger_mismatch`. Zgodnie z zasadą
fail-closed nie są one automatycznie naprawiane. Punkt 35 wymaga jeszcze
kontrolowanego audytu/backfillu albo resetu danych POC, a flow przywrócenia
`PENDING_INTAKE` pozostaje do zaprojektowania. Przyszły HOLD dla PUSH
VKES → VKES również nie został wdrożony.

## 51. Punkt 17 `task.md` — katalog ikon i wyszukiwanie semantyczne

### 51.1. Kontrolowany katalog ikon

Do obu aplikacji dodano `lucide-react` i `react-icons`. Główna baza zawiera
`icon_catalog` (dozwolone klucze, aliasy, kategorie i rewizje),
`icon_type_defaults` (domyślne ikony typów) oraz `tag_icon_mappings`
(zatwierdzone decyzje `tag -> icon_key`).

Powtarzalny importer zasila katalog oficjalnymi metadanymi Lucide. Drugi
importer odczytuje przypięte eksporty Font Awesome, Bootstrap, Feather,
Material i Ionicons oraz wyprowadza słowa z nazw komponentów. Katalog nie
przechowuje surowego SVG i nie zależy od zewnętrznego API w runtime.

### 51.2. Bezpieczny resolver React

Frontend otrzymuje wyłącznie `icon_key`. `CatalogIcon.jsx` rozwiązuje go
przez lokalną listę providerów i manifest Lucide. API ani tekst tagu nie mogą
zbudować dowolnego importu JavaScript lub przesłać SVG do wykonania. Resolver
Lucide jest ładowany leniwie, aby pełna mapa nie weszła do początkowego
bundle.

Osiem ikon projektu w `custom-icons/` ma stabilne klucze `pt:*` i jest
renderowane jako kontrolowane lokalne zasoby. Klucze projektowe są wykluczone
z automatycznych kandydatów tagów, dopóki nie mają zatwierdzonego znaczenia.

### 51.3. Ikona tagu w Hub App

Po zatwierdzeniu tagu formularz wykonuje jedno zapytanie, które zwraca
najlepszą ikonę i listę kandydatów. W czasie oczekiwania chip pokazuje stan
ładowania. Kliknięcie gotowej ikony otwiera już pobrany pasek maksymalnie
pięciu propozycji i nie wykonuje drugiego GET. Dopiero wybór wysyła POST
zapisujący mapowanie.

Ranking uwzględnia dokładne mapowanie, oficjalne tagi, aliasy logistyczne,
nazwę eksportu, kategorię i negatywne konteksty. Wyniki są przeplatane
providerami. Ręczny wybór zapisuje się atomowo i wysyła SSE po `COMMIT`.
Panel Szukanie ma też osobny typ `Ikona` do przeglądania katalogu bez zmiany
mapowań tagów.

### 51.4. Opcjonalna usługa BGE-M3

Dodano oddzielny proces `icon_semantic_api.py` z logiką w
`icon_semantic_service.py`. Model BGE-M3 nie jest ładowany do Hub API, Client
API ani TUI. Przy `semantic_icons.enabled: false` system nie łączy się z AI.

Usługa cache'uje wektory w ignorowanym pliku
`runtime-cache/icon-embeddings-bge-m3.npz`. Fingerprint obejmuje format,
model, rewizję katalogu i opisy. Wynik AI zawiera tylko klucze kandydatów,
które Hub API ponownie sprawdza w `icon_catalog`. AI nie może zmienić tagu,
paczki, trasy, ceny, HOLD-u ani ledgera; wybór zatwierdza worker.

### 51.5. Wspólne ikony opakowań — bieżący stan roboczy

Bieżące, jeszcze niezatwierdzone zmiany używają jednego
`containerIconKey()` w Hub App i Client App. Resolver rozróżnia otwarty i
zamknięty worek, skrzynkę oraz worek wirtualny i zastępuje wcześniejsze pary
emoji typu + kłódka jedną ikoną. Integracja obejmuje giełdę, obsługę zleceń,
Rewizję, Sortowanie i mapę Opakowania.

Brak statusu jest interpretowany bezpiecznie jako wariant zamknięty, poza
skrzynką stojącą na półce, która jest otwarta. Stany skrzynki `RETIRED`,
`INACTIVE` i `DISABLED` używają osobnego wariantu. Ikony projektowe korzystają
z maski `currentColor`, bez przesyłania surowego SVG przez API.

### 51.6. Stan i dalsze etapy punktu 17

Pierwszy etap katalogu i ikon tagów oraz infrastruktura BGE-M3 są wdrożone.
Pozostają: pełne wykorzystanie tagów i ikon w Client App oraz sortowaniu,
zatwierdzenie semantyki własnych SVG i przyszłe `semantic_documents` z
`pgvector` po migracji do PostgreSQL.

Lokalne środowisko `.venv-semantic` zostało dodane do historii zmian razem z
zależnościami binarnymi. Nie jest to funkcja produktu; znacząco zwiększa
repozytorium i powinno zostać potraktowane jako osobny problem higieny Git.
Usunięcie go z historii lub indeksu wymaga osobnej, świadomej operacji i nie
jest częścią tej aktualizacji dokumentacji.

## 52. Podsumowanie otwartych granic po aktualizacji

Ta lista zachowuje stan poprzedniej aktualizacji. Nowsze informacje
o punkcie 24, gate'ach, poczekalni i zmianach roboczych sa w 55.9 i 58.3;
starszych wynikow HOLD oraz planow nie traktowac jako odczytu biezacej DB.

1. Nie wolno włączać produkcyjnego rollout gate na starej bazie, dopóki
   historyczne niespójności HOLD nie zostaną rozwiązane audytem, backfillem
   albo resetem danych POC.
2. Punkt 15 nie jest w całości zamknięty; Admin UI i część kryteriów odbioru
   nadal pozostają otwarte.
3. Punkt 16 działa etapowo, ale grafika i wymagania z `docs/design/prototypes/sort.drawio` mogą być
   dalej dopracowywane bez zmiany trwałej maszyny stanów.
4. PUSH VKES → VKES nie korzysta jeszcze z ogólnego HOLD-u intencji.
5. Historyczna zaleglosc `PENDING_INTAKE` zostala zastapiona wdrozonym
   procesem podsumowania i atomowego umieszczenia w opakowaniu; aktualny
   opis oraz ograniczenia znajduja sie w 56.3 (aktualizacja 2026-10-02).
6. BGE-M3 jest opcjonalne i domyślnie wyłączone; nie jest warunkiem działania
   ikon ani tworzenia paczki.
7. Bieżąca integracja wspólnych ikon opakowań znajduje się w niezapisanym
   stanie roboczym i przed zatwierdzeniem wymaga buildów obu aplikacji oraz
   testów resolvera.


### 2026-10-01: aktualna architektura po punkcie 24

Historyczne rozdzialy PRD opisujace fasady `courier_logic_poc`, `db_storage`,
`finance_core`, `hub_app_service` i zbiorcze handlery nie sa instrukcja ich
odtwarzania. Aktualny plan i odbior znajduja sie w `docs/tasks/task.md`, punkt 24.
Procesy należą do `application/{runtime/owners,parcels,courier,finance,hub,configuration}`,
SQL do waskich repozytoriow/portow w infrastructure, a adaptery HTTP do
`interfaces/{client,admin}` i routerow Hub API. Modele Hub/Bag/Parcel sa w domain.
`RuntimeServices`, `ClientApiServices`, `AdminApiServices` i `HubApiServices` sa
rekordami konkretnych wlascicieli. Composition roots dostarczaja wymagane
zaleznosci; rekordy nie implementuja delegatow ani zgodnosci ze starym API.
Formaty finansowe i kontrakty HTTP/SSE zachowano. Pilot wdrozenia ma osobne
kryterium danych i nie jest zastępowany przez wynik testow.

Pelne porownanie poprzedniego i obecnego modelu, naprawy wykryte podczas
ekstrakcji oraz wynik odbioru i review znajduja sie w rozdziale 55 ponizej.
Ten krotki wpis z 2026-10-01 nie oznacza zaliczenia pilota finansowego.

## 53. Przeglad historii PRD i zakres uzupelnienia - 2026-10-02

### 53.1. Kiedy dokument byl ostatnio zapisany

Ostatni commit zmieniajacy ten plik przed niniejsza aktualizacja to
`30cf7ce78d436c57ca09f8506659b60703f6e513`, z 2026-10-01,
16:18:40 +01:00 (Europe/London). Dodawal m.in. krotkie podsumowanie
architektury po punkcie 24. Nie byl pelnym opisem wszystkich nowych funkcji.
Pozniejszy commit `bc215d0d` z 2026-10-01, 19:39:26 +01:00 naprawil cztery
problemy po review, ale nie uzupelnil PRD o ich opis.

Przed edycja PRD mial tez niezacommitowana zmiane tytulu na PPTT.
Zachowano ja. Data commitu oznacza ostatni zapis w historii Git, nie dowodzi
daty ostatniej edycji lokalnego pliku ani kompletnego przegladu produktu.

### 53.2. Dlaczego przeglad siega dalej niz ostatni commit

Porownano historie PRD, zmiany funkcjonalne po `f64de039` (2026-09-14),
aktualne wejscia i wlascicieli w kodzie oraz punkty 18-25 task.md.
Uwzgledniono tez wczesniejsze funkcje opisane w zadaniach, ale niepelnie
przeniesione do PRD: wydanie paczek, lokalizacje i zarzadzanie personelem.
Przejrzano zmiany robocze osobno od commitow; nie utozsamiamy ich z wydaniem.

| Zrodlo zmian | Brakujaca informacja / obecna dokumentacja |
| --- | --- |
| Punkty 18-19 task.md, wdrozenie 2026-09-03 | Lokalizacja na polce i wydanie klientowi: 56.1 |
| Punkt 21, commit `3592dfe7`, 2026-09-11 | Hierarchia personelu, korekty, PIN i dezaktywacja: 56.2 |
| `fedc56e9`, 2026-09-15 | Jednorazowa konwersja kwot nadan klienta i prezentacja kontekstu finansow: 56.4 |
| `5b631798`, 2026-09-17 | Reczna rezerwacja zestawu i rzeczywisty szybki przebieg Admina: 54.1 |
| `41d16e96`, 2026-09-21 | Historyczny AUTO TEST: punkt 23 task.md; wycofanie: 54.2 |
| Punkt 20, `5b5f9735` / `486df6ca`, 2026-09-24 | Pakiet src, porty persistence i jawny UoW: 57 |
| Punkt 24, `8cb240b9` / `bacb0164` / `7c81e0fe` / `30cf7ce7` | Dekompozycja odpowiedzialnosci, nie samo przeniesienie plikow: 55 |
| `bc215d0d`, 2026-10-01 | Cztery poprawki po finalnym review: 55.8 |
| Biezace zmiany robocze i decyzje z 2026-10-02 | Widoczna marka PPTT i plan audytu except, bez nowych napraw TUI: 58 |

To uzupelnienie dokumentacji na podstawie kodu i zapisanych dowodow.
Nie uruchamialo scenariusza na bazie roboczej, nie migrowalo DB i nie
stanowi nowego PASS testow, live check AUTO TEST ani finansowego rollout gate.

## 54. Admin API i courier-viz - reczne scenariusze po wycofaniu AUTO TEST

### 54.1. Reczny scenariusz: szybkie wykonanie, prawdziwe operacje

Admin API i `courier-viz` sa narzedziem operatora do obserwacji i testowania
systemu. Nie zastepuja logowania klienta ani produkcyjnej obslugi kuriera.

- Mapa pozwala zalogowac testowego managera przez Shift+LPM, workera przez
  Ctrl+Shift+LPM i wylogowac personel przez Ctrl+LPM. Manager/worker sa
  rozpoznawani przez testowe PIN-y `XX1` / `XX2` i rzeczywiste przypisania.
  Powstaja sesje i zmienia sie presence, a nie tylko kolor huba w React.
- PPM sluzy do testowego nadania z aktywnego huba. Zwykly wariant korzysta
  z VKES COO; Ctrl+PPM wybiera KES. Nadanie ma zwyklego aktora, walidacje,
  intenty i holdy. Brak aktora, uprawnien lub srodkow nie jest omijany.
- Globalna gielda Admina nie jest ograniczona obserwowanym sektorem kuriera.
  Oferta nadal powstaje ze wspolnego planera i podlega jego walidacji.
- Ctrl+PPM na ofertach wybiera zestaw. Zaznaczenie innego wariantu tego
  samego worka usuwa poprzedni wariant, aby nie rezerwowac go dwa razy.
  Wspolna regula wyboru jest w `web-common/courierOfferSelection.js`.
- `ZABIERZ` rezerwuje zestaw przez `reserve_courier_jobs`; powstaja prawdziwe
  job_id i batch_id. Domena moze polaczyc albo rozdzielic zlecenia.
  Istniejace zlecenia mozna odczytac i dokonczyc zamiast tworzyc je ponownie.

Szybki przebieg wykonuje kolejne komendy bez celowego oczekiwania na czas
podrozy: przygotowanie, potwierdzenie wagi, LOADING, start IN_TRANSIT,
RECEIVING_STARTED, odbior, sortowanie i zakonczenie. To nie jest bezposrednie
ustawienie `COMPLETED`. Pozostaja eventy, cargo, transfery paczek, ledger,
wynagrodzenie kuriera i odbior koncowy. Operacje majace odrebny lifecycle
zachowuja odrebne transakcje; caly przejazd nie jest jednym sztucznym commitem.

Poprawiono odtworzenie kontekstu kuriera podczas RECEIVING_STARTED, aby
odbior po tym stanie nie tracil aktora transportu. Nazwane kroki należą
obecnie do `interfaces/admin/courier_execution.py`, a reguly i zapisy do
wspolnych procesow application i repozytoriow, nie do dawnej fasady.

Mapa ma osobna warstwe animacji tras (`adminMapAnimation.js`). Wariant
standardowy i podswietlony przeskok sa rozpoznawane osobno, a ruch na mapie
moze rozwinac odcinki przez aktywne linki huba. Animacja zapetla wskaznik,
ale nie przesuwa paczki w DB, nie finalizuje zlecenia i nie nalicza wyplaty.
Wizualnego uplywu czasu nie traktujemy jako potwierdzenia rzeczywistej dostawy.

### 54.2. Wycofanie AUTO TEST - punkt 27, 2026-10-03

Autonomiczny generator w Admin API zostal wycofany. Stan funkcjonalny
sprzed generatora wskazuje commit `5b631798` (2026-09-17); generator
dodal commit `41d16e96` (2026-09-21). Powrot nie cofa pozniejszych zmian
Clean Architecture, FastAPI, routingu, SSE i optymalizacji zasobow.

Nie ma przycisku AUTO TEST, panelu raportu, runnera w lifespan ani kanalow
`GET /api/auto-test`, `POST /api/auto-test/toggle`,
`GET /api/auto-test/report` i SSE `auto_test_update`.
Start lub zmiana topologii Admina nie generuje ruchu w DB.

Usuwane sa trzy pomocnicze tabele: `admin_auto_test_runs`,
`admin_auto_test_parcels`, `admin_auto_test_events` z ich indeksami.
Aktualny kontrakt schematu to v19; TUI i reset nie tworza tych tabel,
a Hub/Client/Admin nie wymagaja ich do startu. Usuniecie stanu generatora
nie kasuje rzeczywistych paczek, workow, rezerwacji, eventow ani ledgeru.

Reczny scenariusz 54.1 pozostaje. Nadanie korzysta z COO/CFO, domyslnych
danych koperty i nowego worka na kazda paczke. ZABIERZ nadal wykonuje
rzeczywiste komendy, zachowujac wpisy i rozliczenia. Historyczny opis
autotestu pozostaje w punkcie 23 task.md, oznaczonym jako wycofany.

Osobny szybki runner w Pythonie i rozbudowa Admina do wizualizacji sieci
sa przyszlym zakresem; nie zostaly wdrozone przez samo wycofanie.
Plan, narzedzie czyszczenia DB i dowody odbioru: punkt 27 task.md.

## 55. Punkt 24 task.md - architektura przed i po dekompozycji

### 55.1. Co zmieniamy, a czego nie

Punkt 20 przygotowal pakiet i oddzielil SQL przez porty. Punkt 24
zlikwidowal agregaty, ktore mimo nowej struktury nadal skupialy wiele
niezaleznych procesow. To nie jest tylko kosmetyczne dzielenie duzego pliku.
Nazwy nowych modulow wskazuja konkretny proces i jego wlasciciela.

Zachowano produktowe reguly cen/tras, kontrakty HTTP/SSE, role, kody,
minor units, hash/HMAC i podpisy. Nie wprowadzono PostgreSQL, nowych
ekranow ani nowych formatow finansowych. Naprawiono jednak bledy ujawnione
przy ekstrakcji i testach rollbacku. Rozdzielamy te naprawy od samego
przeniesienia odpowiedzialnosci.

### 55.2. Mapa wszystkich 13 usunietych agregatow

Sciezki ponizej sa wzgledem `src/kenya_courier/`. Dawne pliki nie sa
aktywnymi fasadami i nie wolno ich odtwarzac jako re-eksportow zgodnosci.

| Poprzedni wlasciciel | Obecny podzial | Zmiana zasady |
| --- | --- | --- |
| application/courier_logic_poc.py | domain/hub_model, container_model, parcel_model, staff_models; application/runtime/{state,transactions,rehydration,owners}, parcels; interfaces/runtime_composition | Modele bez I/O, jawny stan runtime oraz konkretni wlasciciele operacji; brak globalnego monolitu |
| application/courier_job_service.py | application/courier: cargo_queries, sorting_commands, receiving_weight_commands, route_commands, deadline_commands i procesy F1-F7 | Konsument wywoluje konkretna komende, nie zbiorcza fasade |
| application/finance_core.py | application/finance i application/identity | Rozdzielone konta, tozsamosc, intenty, transfery, cash i audyt; jeden ledger writer |
| interfaces/client_api_handlers.py | interfaces/client, client_api_composition, ClientState | 19 konkretnych wlascicieli; stan i wymagane callbacki per aplikacja |
| infrastructure/db_storage.py | infrastructure/schema, runtime_snapshot_repository; application/runtime/snapshot_builder | Adapter czyta rekordy; modele buduje aplikacja; schemat ma nazwane etapy |
| interfaces/admin_api_handlers.py | interfaces/admin, admin_api_composition, AdminState | 24 wlascicieli, w tym osobne etapy scenariusza, projection, broker i runner |
| application/hub_app_service.py | application/hub, interfaces/hub_api_services | 15 wlascicieli procesow Hub i 7 waskich portow operacji zamiast jednej uslugi |
| infrastructure/hub_repository.py | Waskie hub_*_repository, application/ports/hub_data | 10 portow / 61 metod; zapytania maja konkretne zastosowanie |
| application/config_manifest_sync.py | application/configuration, port ConfigurationDocuments | Osobne config, manifest, identity, export i bootstrap; kontrolowana publikacja dokumentow |
| infrastructure/finance_operations_repository.py | Waskie adaptery/porty finance, account, payment, transfer | Brak repozytorium zbierajacego wszystkie finansowe operacje |
| infrastructure/courier_operations_repository.py | Adaptery courier, dispatch, cargo, receiving, sorting | Zapisy na conn wlasciciela procesu, bez ukrytego lifecycle |
| application/cash_exchange_service.py | application/cash_exchange | Autoryzacja, dostepnosc, wykonanie, claim/completion i projekcje wymiany |
| infrastructure/runtime_operations_repository.py | runtime_*_operations ports i odpowiadajace adaptery | 112 metod w 8 grupach; wspolny conn, nie nowe transakcje dla kazdej metody |

`RuntimeServices`, `ClientApiServices`, `AdminApiServices` i `HubApiServices`
przechowuja konkretne uslugi. Nie sa zamiennikiem dawnego modulu z setkami
delegatow. Composition root jawnie sklada zaleznosci; wymagany port nie jest
wyszukiwany w globalach, przez getattr ani przez import runtime TUI.

### 55.3. Runtime i modele: z globali do wlasciciela instancji

Wczesniej globalny runtime i szerokie moduly byly wspolnym punktem dostepu
do topologii, ustawien, DB, cache i operacji. Sam import modulu potrafil
powiazac konsumenta ze stanem innego wejscia lub testu.

Teraz RuntimeState posiada dane i blokade, RuntimeTransactions posiada
lifecycle operacji, a RuntimeRehydrator buduje i waliduje kandydat projekcji.
Wlasciciele runtime otrzymuja tylko potrzebne dane i porty. Modele Hub,
Bag, Parcel i personelu należa do domain; nie lacza sie samodzielnie z DB.

Hub, Client i Admin API skladaja runtime w `interfaces/runtime_composition`.
API nie importuja terminalowego root. TUI ma wlasny composition root;
ewentualny tryb hybrydowy otrzymuje wspolny runtime jawnie. Dwie aplikacje
Client z roznymi DB nie wspoldziela brokera ani ustawien przez globale.

Bootstrap odtwarza stan z DB, a nie z ostatniej pamieci procesu. Shutdown
zamyka zasoby konkretnej app. Restart Admin tej samej instancji resetuje
readiness i ponownie wczytuje ustawienia oraz strategie z DB, zamiast
pozostawiac poprzednia wartosc hub_fee i stary kanal zdarzen.

### 55.4. Persistence i transakcje: jeden wlasciciel pelnej operacji

Wczesniej aplikacja mogla wykonywac SQL na surowym connection i mieszac
repozytorium, kroki procesu, commit oraz aktualizacje RAM. Wewnetrzny
helper otwierajacy drugi writer lub wykonujacy ukryty commit lamal atomowosc.

Obecna granica to framework-neutralne komendy, porty operacji i UnitOfWork.
Application decyduje o przebiegu; infrastructure wykonuje SQL. Wyniki
repozytoriow sa materializowane, nie wymagaja iterowania kursora przez API.
UnitOfWork udostepnia konkretne operacje i lifecycle, nie dowolne execute.

1. Koordynator rozpoczyna BEGIN IMMEDIATE dla calej operacji biznesowej.
2. Repozytoria i kroki korzystaja z tego samego conn/UoW. Nie wykonuja
   wlasnego commit, rollback ani close dla polaczenia otrzymanego z zewnatrz.
3. Zagniezdzona operacja runtime uzywa aktywnego conn. Jej blad oznacza
   rollback-only: nawet przechwycenie bledu przez wywolujacego nie pozwala
   zatwierdzic czesciowej operacji zewnetrznej.
4. Pozny blad wycofuje powiazane zapisy kontenera, paczki, intentu, holda,
   ledgeru i eventow w zakresie danego procesu.
5. Po udanym commicie mozna opublikowac zdarzenia i odbudowac projekcje.
   Awaria projekcji po commicie wymaga odzyskania/diagnostyki, nie ponownego
   obciazenia konta ani automatycznego powtorzenia zatwierdzonej komendy.

DB nadal jest zrodlem prawdy; RAM jest projekcja. Snapshoty odbudowy nie
tworza dodatkowego magazynu paczek ani alternatywnego salda finansowego.
Oddzielne procesy biznesowe moga miec oddzielne commity; zasada jednego
UoW dotyczy spojnej operacji, nie calego dnia pracy lub podrozy kuriera.

### 55.5. Podzial procesow paczki, opakowania, kuriera i finansow

**Paczki i opakowania:** nadanie ma nazwane kroki przygotowania, stron,
wyceny, platnosci, utworzenia, wyboru kontenera i zapisu; creation, draft,
intake i pickup maja osobnych wlascicieli. Hub API zachowuje osobne flow
KES, VKES, PAID, ASSET i replay, ale nie osobna implementacje ich SQL.
Seal zapisuje status i event razem; pusta BOX wraca do inwentarza w tej
samej operacji co usuniecie kontenera i ARCHIVED. Model Bag nie robi I/O.

**Kurier F1-F7:** rezerwacja, waga/handover, LOADING/trip, odbior, sortowanie,
settlement/cancel/return/dispute oraz deadline/ETA/cargo maja konkretne
komendy i porty. CourierRuntimeContext zastapil przekazywanie calego
runtime modulu. Przyjecie i finalizacja korzystaja z pelnej transakcji
runtime; osobna testowa DB nie usprawiedliwia sciezki pomijajacej finanse.
Interaktywne pytania i renderowanie pozostaja w adapterach.

**Finanse G1-G6:** oddzielono identity/password/onboarding, konta/dostepy/
klucze, intenty/PUSH/recovery, podpisy/OTP/transfer, cash/prepaid/ASSET i
historie/audyt. Koordynator settlement podejmuje decyzje commit/rollback;
wewnetrzne kroki zwracaja wynik lub disposition zamiast zatwierdzac fragment.
Wszystkie wpisy wallet_ledger przechodza przez ledger_service, kwoty w DB
pozostaja integer minor units, a wymagany klucz podpisu nie jest pomijany.

**Konfiguracja i schemat:** config, manifest, normalizacja ID, synchronizacja
osob i eksport maja osobne procesy. Schema jest podzielona na grupy i kroki;
runtime snapshot repository zwraca rekordy, a snapshot_builder buduje modele.
Zapis metadanych/notatek dokumentu jest publikowany po powodzeniu operacji.
SQLite i plik YAML nie sa jedna transakcja rozproszona: blad publikacji
pliku jest jawny (`export_error`, a dla zatwierdzonego file->db takze
`db_committed`), nie udaje rollbacku zatwierdzonej DB.

### 55.6. HTTP, SSE i izolacja zasobow

Pydantic pozostaje na granicy HTTP, a procesy korzystaja z neutralnych
kontraktow. Router wskazuje konkretnego wlasciciela. API nie wymaga
odtworzenia proxy request ani zbiorczych handlerow starego flow.

ClientState i AdminState przechowuja stan swoich aplikacji. Broker,
post-commit sink/observer, dedupe i dispatcher maja jawna przynaleznosc
do DB i lifespan. Zamkniecie jednej aplikacji nie rozlacza drugiej.
Zdarzenie dla DB A nie ma trafic do odbiorcy DB B tylko dlatego, ze oba
procesy dzialaja w tym samym interpreterze. SSE nadal sygnalizuje zmiane;
odbiorca pobiera aktualny snapshot zgodnie z kontraktem zasobu, bez pollingu.

Diagnostyka Hub API odczytuje wlasny runtime pod read lock. Nie bierze
licznikow z globalnego procesu TUI. Auth, kontrakty REST/SSE i granice
uprawnien nie zostaly zastapione nowymi zasadami przy podziale modulow.

### 55.7. Naprawy wykryte podczas ekstrakcji - nie tylko zmiana nazw

| Poprzednie zachowanie | Wprowadzona poprawka / znaczenie |
| --- | --- |
| Samodzielny seal zatwierdzal status przed pozna awaria zapisu eventu | Status SEALED i event należa do jednego UoW; wlasny i zewnetrzny rollback |
| Seal pustej BOX usuwal bag/ARCHIVED przed pozna awaria inwentarza | Powrot skrzynki na polke, usuniecie kontenera i event sa atomowe |
| Draft wewnatrz aktywnej operacji otwieral drugi writer, dajac database is locked | Draft i zapis osob dolaczaja do aktywnego conn; rollback calego procesu |
| Schema ikon wykonywala executescript podczas nadania, wywolujac ukryty commit | Jawne DDL execute na tym samym conn; pozna awaria KES/VKES wycofuje rowniez finanse |
| Pierwszy startup nie zakladal prawidlowo triggera content_revision | Poprawiony przebieg schema; sprawdzenie fresh bootstrap i ponownego no-op |
| Zdarzenie post-commit trafialo do odbiorcow dwoch DB | Sink/observer/dispatcher sa powiazane z konkretna DB i app |
| Restart tej samej Admin app zachowywal stare ustawienia/broker | Reset readiness i reload ustawien/strategii, nowy i prawidlowo zamykany kanal |

Historia task.md obejmuje tez naprawy przepiecia konsumentow TUI wykonane
wtedy w ramach punktu 24. Nie oznacza to nowego zakresu napraw TUI;
aktualna decyzja dotyczaca audytu except jest w rozdziale 58.

### 55.8. Cztery poprawki po review - commit bc215d0d

- Dwie nowe osoby z tymi samymi inicjalami otrzymywaly kolidujacy kod.
  Kod kazdej osoby jest teraz wyliczany bezposrednio przed jej zapisem na
  tym samym conn. Dotyczy draftu i nadania; nadawca nie jest nadpisywany
  przez odbiorce. Pozny blad nadal wycofuje obie osoby wraz z operacja.
- Wybor kontenera odwolujacy sie do usunietego Hub.get_bags pomijal realne
  otwarte worki i skrzynki. RuntimeContainerOptions otrzymuje wymagany
  odczyt RuntimeHubBagQueries; uwzglednia OPEN BAG/VIRTUAL_BAG/BOX, pomija
  SEALED i kontroluje mozliwosc nowej pustej BOX.
- Reczne add_manual_bag Admina nie przekazywalo runtime_snapshots.
  Composition wiaze teraz zapis z wlasna DB Admina i wymaganym portem;
  POST zapisuje OPEN z prawidlowym hubem zrodlowym i docelowym.
- Diagnostyka Hub API korzystala z globalnego runtime TUI. Teraz czyta
  HubRuntimeAccessService konkretnej app pod read lock; endpoint pozostaje
  uwierzytelniony, a dwie rozne DB daja wlasne liczniki/bootstrap report.

### 55.9. Odbior techniczny a pilot finansowy

Zapisane dowody sa wynikami historycznych przebiegow z task.md 24.8-24.10,
nie nowymi testami wykonanymi podczas edycji PRD.

| Sprawdzenie / granica | Zapisany wynik |
| --- | --- |
| Finalny odbior 24.9, 2026-10-01 | 2870 pytest PASS; 563 finance regression PASS; Client build PASS; instalacja poza repo i trzy API PASS |
| Audyt DB na kopii | 45 lancuchow / 2362 wpisy ledger i podpisy PASS; 142 holdy PASS |
| Obowiazkowy rollout gate | FAIL tylko min_intents: 0/20 w oknie 24 h; audyt i krytyczne bledy 0 |
| Po review 24.10 | 41 focused PASS; pelny pytest 2876 PASS / 1 FAIL |
| Pozostaly FAIL pelnego zestawu | test_closed_bag_submission_guard: test_tui_lists_only_open_containers_for_manual_selection; atrapa oparta na starym odczycie TUI |
| N+1 / lifecycle | Nadanie KES: reads 285->279, commit 3->1; network 13/13, kontenery 9/9, dossier 8/8; rezerwacja 19/19 i 1/1 commit |

Zakonczono implementacje i odbior techniczny punktu 24, bez otwartej listy
dalszych ekstrakcji. Nie oznacza to zaliczenia produkcyjnego rollout gate
ani pelnego zielonego pytest po review. Nie przepisujemy wyniku 2876/1 na PASS.
Wynik 0/20 jest migawka konkretnego gate'a, nie nowym odczytem dzisiejszej DB.

Pilot wymaga co najmniej 20 rzeczywistych intentow w aktualnym oknie 24 h
i zaliczenia gate'a z domyslnymi progami. To nie sa "20 testow do dopisania"
mimo skrotowego opisu commitu. Nie obnizamy progu, nie zmieniamy timestampow
i nie dopisujemy rekordow recznie dla PASS. AUTO TEST nie zastępuje tego
kryterium ani nie zalicza go automatycznie. Pelne DONE/merge finansow
wymaga oddzielnego pozytywnego wyniku wedlug task.md 24.5 i 24.9.

Duzy plik nie jest automatycznie monolitem. Routing, lifecycle holdow,
presence i niektore koordynatory pozostawiono z uzasadniona spojnoscia.
Progi >1000 linii/modul lub >150 linii/funkcja wymagaja oceny, nie sztucznego
podzialu transakcji ani tworzenia nowego agregatu. Testy architektury
sprawdzaja granice/importy; testy rzeczywistej SQLite sprawdzaja pozne
rollbacki, retry/replay, aktorow, podpisy i publikacje po commit.

## 56. Uzupelnienie funkcji Hub App i Client App

### 56.1. Lokalizacja na polce i fizyczne wydanie klientowi

Punkty 18-19 task.md sa wdrozone. Zwykla paczka odlozona przez OUTTAKE
trafia do hub_ready_pickup, z opcjonalna hierarchiczna sciezka lokalizacji
prywatnej dla huba i notatka pickup_note. Sciezka liczbowa nie narzuca
znaczenia poziomow. Tagi/ikony miejsca pochodza z hub_storage_locations
i centralnych mapowan, nie z kopii SVG w paczce.

Podczas sortowania gorne pole LOKALIZACJA sluzy do parse/podgladu,
a dolne SHELF do zatwierdzenia przez Enter. Tab tylko nawiguje.
OUTTAKE zapisuje miejsce wraz z istniejacym ruchem/finansami w jednym UoW.
Lokalizacja nie jest wymaganym warunkiem wydania i nie jest udostepniana
Client App/kurierowi jako prywatny plan magazynu huba.

Tryb `Odbior` w Szukaniu czyta tylko polke zalogowanego huba. Kod wskazuje
paczke; poczatkowy `/` wskazuje prefiks lokalizacji. Dla lokalizacji lista
zwraca ograniczona liczbe najstarszych pasujacych paczek, nie wszystkie dane
ukrywane pozniej przez React. Karta pokazuje osobe, sciezke/tagi, notatke
i rzeczywisty czas wejscia READY_PICKUP. Tylko jedna karta odbioru jest
aktywna lokalnie; zamkniecie widoku nie usuwa paczki z DB.

Autoryzacja obejmuje cztery metody: ID, PHONE, EMAIL i PASSWORD. ID jest
domyslne; worker porownuje dane dokumentu, telefon albo email i swiadomie
potwierdza wydanie suwakiem. PASSWORD jest sprawdzane przez backend,
bez ujawnienia oczekiwanego hasla workerowi. Dla PASSWORD obowiazuje limit
pieciu blednych prob i odblokowanie przez nadawce. Potwierdzenie nadawcy
jest odblokowaniem, nie piata metoda odbioru. Termin to 216 godzin (9 dni).
Finalna komenda usuwa wpis polki i zapisuje
wydanie/rozliczenie atomowo; SSE dopiero po commit. Asset OUTTAKE zachowuje
osobny final_note i wraca do zasobow, nie do tej polki dla klienta.

### 56.2. Setup: personel i dane huba

W Setup dostepne sa karty Wlasciciel/Menadzer/Pracownik ograniczone rola.
Worker widzi wlasne dane i moze poprawic dozwolone dane personalne.
Manager widzi siebie i przypisanych workerow/kurierow; owner cala hierarchie
biezacego huba i karte Dane huba. Pola rozrozniaja edycje, odczyt i wartosci
generowane. Nie jest to centralna administracja siecia.

Dodanie personelu wybiera/zaklada osobe i dozwolone przypisanie z managerem,
PIN-em, uprawnieniami oraz stawkami. person_id, staff_id i rola istniejącego
przypisania sa niemutowalne; korekta nazwiska/imienia zachowuje wymagane
inicjaly. Owner moze dodac managera; manager tylko workera/kuriera swojego
zespolu. Dostepy wymagaja can_manage_access i nie moga nadac wiekszych praw
niz ma operator. can_mint i tworzenie ownera nie sa operacjami tej karty.

Dezaktywacja ustawia is_active=false i uniewaznia sesje staff_id;
historyczny rekord pozostaje. Reaktywacja tej samej osoby/przypisania nie
tworzy konkurencyjnego staff_id. Procenty sa walidowane, a zmiany stawek
nie przeliczaja zakonczonych operacji. Korekty DB/manifestu kontroluja
manifest_revision, zapisują audyt i uniewazniaja widok przez hub_settings_update.
Frontend nie edytuje YAML ani DB bezposrednio. Granica publikacji pliku
i zatwierdzonej DB jest opisana w 55.5.

Router `hub-api/settings` ma odczyt/dodanie/korekte/dezaktywacje staff,
reset PIN-u i odczyt/korekte huba. Uprawnienia sprawdza backend, nie tylko
widocznosc przycisku. PIN jest resetowany bez zwracania starego sekretu.

### 56.3. Poczekalnia PENDING_INTAKE ma juz proces powrotu

Wczesniejszy zapis w 50 i 52 o braku przywrocenia opisuje dawny etap.
Obecny kod zawiera HubParcelIntakeService i ParcelIntakeCommands.

`GET /hub-api/parcels/intake/pending-summary?package_id=...` odczytuje
przygotowana, juz oplacona paczke dla huba i aktualne opcje opakowania.
`POST /hub-api/parcels/intake/pending-dispatch` przyjmuje package_id i
jawny container_selection. Nie tworzy nowej paczki ani drugiej platnosci.

Przed zatwierdzeniem odtwarzane sa dane finansowe/autorskie, aktualna trasa
i dostepnosc kontenera. Istniejacy kontener musi nadal byc otwarty i miec
poprawny kierunek; nowa BOX wymaga aktualnej dostepnosci inwentarza.
Blad wyboru nie tworzy zastepczego opakowania. Polecenie dla uprawnionego
operatora zapisuje umieszczenie, nalezne wpisy intake i snapshot, po czym
warunkowo konsumuje rekord przygotowania wedlug jego wersji na tym samym UoW.
Konflikt dwoch sesji lub pozny blad wycofuje calosc.

Po sukcesie status odpowiedzi to created i znany jest container_id/type.
Retry rozpoznaje juz istniejace przypisanie zamiast dolaczac drugi raz.
created_by paczki nie staje sie automatycznie wykonujacym intake staff_id;
autor i aktor nowej operacji to rozne dane. Powstaje parcel_update oraz
uniewaznienie odpowiednich projekcji po powodzeniu operacji.

Testy rehydration i attachment sprawdzaja dane, status/kierunek, brak
zastepczego kontenera, ponowna kontrole stock oraz odrzucenie wadliwego
wyboru. To opis wdrozonego flow, nie deklaracja bezblednosci wszystkich
parserow: szerszy audyt except pozostaje planem w punkcie 25.

### 56.4. Jednostki kwot i kontekst prywatny/firmowy Client App

Poprawka z `fedc56e9` usunela podwojna konwersje initial_value dla nadan
klienta. Repozytorium zwraca stored.amount_minor w minor units, tak samo
jak inne rekordy persistence; granica Client API przelicza dokladnie raz
na wartosc prezentowana. Nie zmieniono ceny ani skali zapisu DB.

FinancePage rozroznia ladowanie kont i historii. Przelacznik kontekstu
prywatnego/firmowego jest przy akcjach finansowych; przy kilku rolach
wybierana jest konkretna rola staff. Podczas pobierania nowego kontekstu
ostatnie karty kont moga pozostac widoczne, ale nieinteraktywne. Zablokowane
sa wtedy rotacja/drag/wybor i zarzadzanie kontem do otrzymania nowej listy,
aby stara karta nie uruchomila operacji jako nowy aktor.

Historia zachowuje obszar roboczy takze podczas ladowania i pustego wyniku,
a liczby korzystaja z jednego stylu kolumn. Kwota formularza Hub/Client
nie zawija sie przypadkowo. Zmiany prezentacji nie zmieniaja routingu kont,
wyboru default ani reguly uprawnien finansowych.

## 57. Punkt 20 - pakiet, porty i uruchamianie po uporzadkowaniu repo

Dokumentacja jest w docs, testy w tests, skrypty w scripts, eksperymenty
i diagnostyki w tools, a mutable log/cache/backup w var. Kod produkcyjny
jest instalowalnym pakietem src/kenya_courier z warstwami domain,
application, infrastructure i interfaces. Paczkowane dane seed sa w data.
Robocza SQLite, config.yaml i hub_manifest.yaml pozostaja zasobami projektu.

Punkt 20.9 oddzielil wykonywanie SQL od koordynacji application przez
waskie porty, repozytoria i wspolny UnitOfWork. Nie zachowano rownoleglych
rootowych modulow kompatybilnosci. Punkt 24 wykorzystal ten fundament,
aby rozdzielic pozostale agregaty wedlug odpowiedzialnosci opisanych w 55.

pyproject.toml odkrywa pakiety w src i konfiguruje pytest pythonpath=["src"],
nie ["."]. Test importuje pakiet, nie przypadkowy plik w katalogu glownym.
Instalacja wheel obejmuje pakietowe dane seed; rzeczywisty start poza repo
byl czescia odbioru. To nie oznacza, ze dowolny katalog bez konfiguracji
i topologii stanie sie gotowym hubem.

Obowiazujace wejscia:

```text
python -m granian --interface asgi --host 0.0.0.0 --port 5002 --workers 1 kenya_courier.interfaces.hub_api:app
python -m granian --interface asgi --host 0.0.0.0 --port 5001 --workers 1 kenya_courier.interfaces.client_api:app
python -m kenya_courier.interfaces.admin_api_runner --headless
```

Admin API domyslnie pracuje na 5000; courier-viz jest jego osobnym frontendem.
Console entrypointy pakietu to kenya-courier-admin i kenya-courier-tui.
Stare rootowe `hub_api:app`, import finance_core/clp i launcher Flask nie
sa aktualnymi sposobami uruchamiania. Skrypty operacyjne wskazuja kwalifikowane
moduly i katalog projektu. Jeden worker pozostaje ograniczeniem obecnej
architektury runtime; sama dekompozycja nie umozliwia scale-out.

Bootstrap i sync maja jawne porty konfiguracji i DB. Nie skonfigurowana
topologia jest odrzucana; test fresh DB dostarcza jawny fixture. Brak kluczy
finansowych lub danych nie jest naprawiany przez przywrocenie starego flow.

## 58. Zmiany robocze PPTT i otwarte granice - 2026-10-02

### 58.1. Marka a nazwa techniczna

W niezacommitowanym drzewie tytuly stron/API, README i naglowki aplikacji
przechodza na **PPTT (Package Push Towards Target)**. Hub, Client i
courier-viz korzystaja ze wspolnego `web-common/assets/Logo_PPTT.svg`.
To aktualna praca nad widoczna marka, nie migracja kontraktow.

Pakiet Python nadal nazywa sie kenya_courier, dystrybucja kenya-courier,
a DB, targety Granian, nazwy zmiennych srodowiskowych i klucze biznesowe
nie zostaly automatycznie przemianowane. Punkt 24 nie wykonywal rebrandingu;
te pozniejsze zmiany opisujemy osobno i nie deklarujemy nowego wydania
ani weryfikacji buildow w ramach tej edycji dokumentu.

### 58.2. Audyt except to plan, nie ukonczona naprawa

Punkt 25 task.md zawiera ocene handlerow i plan napraw. Skan z 2026-10-02
znalazl 65 produkcyjnych handlerow z samym pass: 37 poza TUI i 28 w TUI.
Nie kazdy jest bugiem: oczekiwany QueueEmpty i cleanup wymagaja innej
oceny niz pomijanie uszkodzonego salda, metadanych security lub zapisu DB.
Logger w handlerze sam w sobie nie dowodzi prawidlowego wyniku operacji.

Decyzja uzytkownika: wszystkie pozycje dotyczace wylacznie TUI E38-E65 sa
POMIJALNE, nie beda naprawiane i nie blokuja odbioru tego zadania. To nie
jest usuniecie TUI z produktu ani naprawienie jego znanych problemow.
Wspolna logika uzywana przez API pozostaje w zakresie mimo konsumenta TUI.
E01-E37, T01-T09 i dodatkowe R pozostaja ocenionym backlogiem, nie wynikiem
nowej implementacji. Nie zapisujemy ich tutaj jako wdrozonych poprawek.

### 58.3. Aktualny status zamiast automatycznego zamykania planow

- Punkt 24: implementacja i odbior techniczny zakonczone; rollout pilota
  finansowego nadal ma osobne, niespelnione w zapisanym przebiegu kryterium.
- Po review pelny pytest ma udokumentowany jeden FAIL TUI; testy poza TUI
  przeszly. Nie dopisujemy fikcyjnego pelnego PASS.
- AUTO TEST Admina wycofano w punkcie 27. Osobny runner Python pozostaje
  przyszlym zakresem, a reczny scenariusz jest zachowany.
- Poczekalnia ma jawny intake; nie pozostaje dawnym ogolnym brakiem procesu.
- Ogolny HOLD dla PUSH VKES->VKES, pozostale etapy ikon/AI i inne plany z
  dawnych rozdzialow nie zostaly automatycznie wdrozone przez punkt 24.
- Zmiany logo/marki w drzewie roboczym nie sa dowodem finalnego wydania.

Historia zmian, szczegolowa macierz testow i warunki odbioru pozostaja
w task.md i jego archiwum. PRD opisuje zasady produktu i architektury;
nie usuwa niezaliczonych gate'ow ani nie zastepuje raportu wykonania.

## 59. Grafy sasiedztwa w RAM - punkt 26 task.md, 2026-10-03

### 59.1. Model przed i po

Poprzednio kazdy odczyt sasiadow huba odtwarzal dane calej topologii i
wykonywal kanoniczny resolver. Dijkstra ponawiala ten koszt dla kolejnych
odwiedzanych hubow. Nowy model zachowuje te same reguly sektorow, remisow
i wzajemnego najblizszego sasiedztwa, ale buduje dwie niemutowalne listy
sasiedztwa raz z jednego wejscia: teoretyczna i operacyjna. Routing dostaje
jawna pare grafow i indeks hubow; petla trasy wykonuje lookup sasiadow.

DB pozostaje zrodlem prawdy. Grafy naleza do instancji RuntimeState w RAM,
nie do singletona modulu. Oddzielne procesy i bazy maja oddzielne grafy;
jawnie wspoldzielony runtime API ma jednego ownera. Restart usuwa cache
i buduje grafy ponownie z DB. Nie zapisujemy grafow do DB, YAML ani pliku.

### 59.2. Odswiezanie i koszt trasy

Geometria, kody i sklad sieci zmieniaja oba grafy. Efektywna dostepnosc
huba oraz blokady drog zmieniaja tylko operacyjny. Zamkniecie najblizszego
huba moze wybrac innego sasiada w sektorze; graf operacyjny nie jest wiec
tylko grafem teoretycznym po usunieciu zamknietych wezlow. Dodatkowy login
w juz dostepnym hubie nie wymusza budowy, jezeli wejscie jest identyczne.

Koszty drog, rating, oplaty, ladunek i stany inventory nie sa kluczem
cache sasiedztwa. Routing nadal ocenia aktualny edge_cost, strategie A/B,
ignore_item, wykluczenia, blokady i wymagane flagi manualnej aktywnosci.
Graf w RAM nie jest cache wynikow tras, sald, sesji ani autoryzacji.

Istniejacy post-commit/outbox jest sygnalem invalidacji. Runtime odczytuje
dane i rewizje w jednym snapshotcie DB, porownuje osobne fingerprinty obu
trybow i publikuje tylko kompletny kandydat. Nie dodano pollingu ani TTL.

### 59.3. Spojnosc, awarie i transakcje

Publikacja odbywa sie pod runtime write lockiem po sprawdzeniu rewizji DB,
rewizji runtime i generation invalidacji. Starszy lub uniewazniony kandydat
nie nadpisuje nowszego grafu/hubow. Read lock chroni caly przebieg wraz z
mutowalnymi obiektami Hub; sam niemutowalny graf nie wystarczylby do tego.
Admin obejmuje ta granica takze snapshot SSE i odczyt po swojej komendzie.
Invalidacja z outboxa czeka na zakonczenie juz rozpoczetej operacji.

Awaria budowy/reloadu albo zaobserwowana invalidacja blokuje nowe uzycie
grafu do czasu autorytatywnego odtworzenia. Zachowany ostatni dobry graf
jest dostepny jedynie dla jawnej diagnostyki, nie jako ukryty fallback.
Odtworzenie projekcji nie ponawia zapisow finansowych ani zakonczonej
komendy. Snapshot aktywnej transakcji/override ma lokalny graf i nie
publikuje niezatwierdzonych zmian jako cache procesu. Rollback kuriera
przywraca projekcje utrwalonych danych.

Finalna rezerwacja, nadanie i przejscia kontraktow nadal waliduja rewizje,
trase, capabilities i zamrozony manifest w tej samej transakcji DB.
Optymalizacja nie omija CAS i nie zmienia ledger/HMAC ani jednostek kwot.
Pomiary, testy roznicowe, lista plikow oraz wynik gate'ow sa w task.md
i task26_graph_inventory.md; nie sa deklaracja dopuszczenia pilota.

## 60. Odbior optymalizacji zasobow - punkt 15, 2026-10-03

### 60.1. Admin: bootstrap i zdarzeniowe odswiezanie

Poprzednio nakladajace sie eventy Admina uruchamialy kolejne lancuchy GET,
a mount powtarzal dane juz otrzymane w init SSE. Teraz init jest zrodlem
bootstrapu hubow/paczek, a reducer i koordynator maja osobne lanes state,
jobs i deliveries. Rownoczesne sygnaly lacza sie w jeden przebieg. Nowszy
sygnal podczas HTTP wymaga jednego kolejnego odczytu; opozniona odpowiedz
poprzedniej epoki nie moze odtworzyc starego stanu lub zmienic loading.

Startowe jobs/couriers/deliveries dziela istniejacy mechanizm
sharedStartupTasks z Client/Hub. StrictMode pozostaje wlaczony. Jego probny
mount nie tworzy drugiego SSE. Rzeczywisty unmount zamyka stream i blokuje
stare callbacks; reconnect uniewaznia dane i odtwarza autorytatywny init.
Blad nie jest cache'owany. Reczny force i committed event wymagaja swiezego
odczytu. Zachowano delty, animacje, logi, wybor ofert i aktywnego kuriera.

### 60.2. Tozsamosc odswiezania Finance i Hub Jobs

Wspolny store nie wystarczal: ten sam event mogl ponownie pobrac zasob po
zakonczeniu poprzedniego HTTP. Aktualny model pamieta ograniczona liczbe
bezpiecznych tozsamosci, oddzielnie dla zasobu i sesji. Wpis ledgeru oznacza
account_id/currency/seq, hold oznacza account_id/currency/hold_id/hold_version,
a intent oznacza intent_id i trwaly event_id. Brak znanego kontraktu pozwala
jedynie rozpoznac konkretna dostawe event_id, nie zgadywac globalna rewizje.

Hub jobs laczy projection i notification po job_id/event_seq albo trwalym
event_id. Sam version zlecenia nie wystarcza: dwa zdarzenia sortowania moga
miec ten sam version i oba wymagaja odswiezenia. Dedup dotyczy GET, nie
obslugi UI obu sygnalow. Nieznana tozsamosc nie jest pomijana.

Potwierdzamy tylko eventy przypisane do zakonczonego requestu; nowy sygnal
pozostaje queued. Blad pozostawia dirty i moze byc ponowiony tym samym
sygnalem albo recznie, bez pollingu. Coverage jest ograniczone do 256 wpisow
Finance/Hub i 512 per lane Admina. Eviction dopuszcza bezpieczny dodatkowy GET,
nigdy utrate wymaganej zmiany. Reconnect/ready/reset zeruje epoke; nowy token
sesji tworzy nowego owner-a i stare HTTP/SSE nie zmieniaja jego danych.

### 60.3. Read-only rynek i wspolna topologia

Historia 2026-08-20: scope rynku nie zapisywal INFO/DEBUG, ale WARN/ERROR
nadal wykonywal DML i COMMIT do system_logs. To bylo sprzeczne z kontraktem
read-only GET. Teraz diagnostyka rynku wszystkich poziomow jest procesowa.
Zimny bootstrap, held bag i nieudany build nie tworza logu DB. Logi komend,
ledger i zdarzenia biznesowe pozostaja trwale poza waskim read scope.

Poprzedni snapshot topologii byl wspolny tylko wewnatrz pojedynczego eventu.
Teraz kazdy jawny owner API/runtime ma TopologySnapshotProvider z jednym
biezacym zestawem faktow po rewizji i changed_at. Kolejny odczyt sprawdza
lekka wersje i przechwycony czas SQL, potem filtruje fakty w RAM. Zwrocony
snapshot jest odizolowany od mutacji odbiorcy. Starszy czytelnik nie moze
cofnac biezacego cache. Inna baza lub runtime ma niezaleznego owner-a.

Wygasniecie sesji moze zmienic efektywna dostepnosc bez nowego COMMIT.
Przed lookupem ofert Client/Admin odswieza waska projekcje presence w RAM
z tego samego read-only conn i czasu, jezeli jej fingerprint/wersja sie
zmienily. Write lock tutaj chroni publikacje w pamieci, nie oznacza zapisu
SQLite. Nie otwieramy drugiego conn w aktywnej komendzie finansowej i nie
publikujemy jej niezatwierdzonego stanu. Zachowujemy tozsamosci Hub/cargo;
presence refresh nie laduje workow ani paczek. Awaria/revision race blokuje
zwracanie niezgodnego stanu zamiast udawac sukces ze starego cache.

Globalne oferty sa wspolne tylko dla kompletnego klucza rynku/topologii,
hasha stanu, efektywnej dostepnosci i runtime. Nie jest to cache sald,
autoryzacji ani warunkow zatwierdzenia. Komenda rezerwacji nadal sprawdza
swiezy stan i CAS w swojej transakcji; stara oferta po zmianie lub wygasnieciu
sesji jest odrzucana bez zapisu zlecenia, claimu i ledgeru.

### 60.4. Diagnostyka opt-in i granice odbioru

PPTT_RESOURCE_DIAGNOSTICS=1 przed startem wlacza ograniczone liczniki RAM
per trace, runtime, trigger i znana rewizje. Domyslnie sa off. Nie dodano
tabeli, schematu, pollingu, timera ani watku diagnostyki; zadne SQL, sekrety,
tokeny i payloady nie sa przechowywane. Manualny chroniony odczyt Admin
runtime-metrics dotyczy tylko jego procesu, nie innych API.

Native SQLite trace liczy callbacki/proby (takze powtorzenia triggerow),
nie dowodzi liczby logicznych zapytan ani skutecznego COMMIT. Liczniki
skutecznych granic i wywolania globalnego buildera/routingu maja osobne
definicje. Eviction i reset moga utracic obserwacje; jest to ograniczone
okno diagnostyczne, nie kompletny audyt. Awaria obserwatora ustawia health
bit i nie zmienia wyniku operacji biznesowej. Szczegoly i testy:
docs/tasks/task15.6A_resource_diagnostics.md oraz task15_acceptance_report.md.

Odbior obejmuje wybrane warianty A-D, nie wdrozenie wszystkich alternatyw
audytu. Materializowana projekcja w DB, worker rynku, jawne bump-y per
komenda, zakresowy dziennik krawedzi i automatyczny dirty-tracking UoW
pozostaja niewdrozone. Nie usunieto wymaganych guardow, reconnect/recovery,
pelnych snapshotow awaryjnych ani testow atomowosci. Gate probki pilota
finansowego pozostaje oddzielny; optymalizacja nie oznacza dopuszczenia pilota.

Odbior techniczny 2026-10-03: 4609 testow pelnego zestawu PASS, 581 testow
finance PASS, 222 testy frontendowe PASS, trzy builds i trzy Chromium probe
PASS (Hub desktop/mobile). Ledger/signature audit: 45 chains / 2362 entries
PASS; fund holds: 142 PASS. Gate pilota nadal exit 2 tylko z powodu probki
0/20 intentow w oknie 24h; progi nie zostaly obnizone.
Historia pierwszego nieudanego przebiegu i napraw cleanupu oraz smoke testu
jawnego otwarcia pracy huba jest zachowana w raporcie odbioru. Sam login
bez operator presence nie jest juz traktowany jako sesja operacyjna przez
fallback pustej tabeli. Nie przywracamy starego flow ani nie pomijamy testow.

## 61. Domkniecie punktu 15 i wspolny zegar Client/Hub - 2026-10-03

### 61.1. Zakres aktualizacji i historia

Ostatni wpis PRD przed tym uzupelnieniem byl w commicie `624429cc`
(2026-10-03): sekcja 60 dokumentuje tamten odbior integracji. Pozniejszy
commit `27171e98` zawiera poprawki kontroli punktu 15 oraz rozszerzenie
zegara frontendowego. Ta sekcja uzupelnia jego zmiany, nie zastepuje historii
sekcji 48/60 ani nie przedstawia dawnych wynikow testow jako nowego przebiegu.

Zrodla szczegolowego zakresu: `docs/tasks/task.md`, podpunkty 15.2.6,
15.4.9, 15.5.1, 15.10 i ostateczny rejestr 15.11; implementacja i testy
z commita `27171e98`. Zmiany ponizej nie zmieniaja formatu ledger/HMAC,
jednostek kwot, zasad rezerwacji ani wymagan gate pilota.

### 61.2. Jeden zegar prezentacyjny na dokument aplikacji

Przed zmiana panel wydania Hub wspoldzielil czas miedzy kartami, ale inne
liczniki w Client/Hub uruchamialy wlasne sekundowe interwaly. Teraz
`web-common/frontendClock.js` jest wspolnym wlascicielem zegara, a oba
frontendy subskrybuja go przez adaptery `useFrontendClock` oparte na React
`useSyncExternalStore`. Jest jeden aktywny sekundowy interwal na dokument
aplikacji, niezaleznie od liczby odbiorcow. Oddzielne karty przegladarki
i urzadzenia maja oddzielne instancje; nie ma globalnego zegara wszystkich
sesji ani nowego zegara po stronie serwera.

Pierwszy aktywny odbiorca uruchamia interwal i odswieza czas; ostatni
unsubscribe go zatrzymuje. Powrot do widoku od razu odczytuje Date.now().
Liczniki wyliczaja czas z daty startu/deadline i biezacego timestampu,
nie z liczby wykonanych tickow. Uspienie lub opoznienie przegladarki nie
powoduje odliczania zaleglych sekund pojedynczo. Zamrozone wartosci oraz
niepoprawne daty nie wymagaja aktywnej subskrypcji.

Zrodlo czasu wspoldziela countdown/elapsed powiadomien i zlecen, rynek
kuriera, panel wydania/przyjecia oraz dostepnosc finansowa Hub. Aktywnosc
workera moze odswiezyc timestamp bez nowego interwalu. Jednorazowy deadline
bezczynnosci finansow nadal steruje zamknieciem dostepnosci. Tick zegara
nie pobiera danych HTTP/DB i nie zastapil SSE pollingiem. Timeouty animacji,
debounce i jednorazowe deadline pozostaja osobnymi mechanizmami.

Wspolny timestamp nie laczy kontraktow: deadline grupy rezerwacji oraz
indywidualny czas zaladunku kazdego zlecenia zachowuja dotychczasowe reguly.
Test architektoniczny skanuje zrodla Client/Hub i blokuje powrot lokalnych
interwalow; testy store oraz Chromium obejmuja wielu odbiorcow, opozniony
tick, StrictMode, unmount/remount i zatrzymanie po ostatniej subskrypcji.

### 61.3. Deduplikacja zlecen Client takze po zakonczonym GET

Sekcja 60.2 opisywala deduplikacje Finance i Hub Jobs. W Client wspoldzielony
loader zlecen usuwal rownolegle GET, ale duplikat dostarczony po zakonczeniu
HTTP mogl ponownie pobrac ten sam snapshot. Naprawa rozszerza ochrone na
zakonczone odczyty, nie tylko na request in-flight.

Client przechowuje oddzielne, immutable listy pending i successful tozsamosci
per staff/epoka sesji, ograniczone do 256 wpisow kazda. Tozsamosc pochodzi
z job_id/event_seq lub jawnego ID zdarzenia, nie z samego version zlecenia.
Duplikat znany jako pending lub successful nie planuje dodatkowego GET.
Potwierdzenie nastepuje dopiero po udanym odczycie aktualnego requestu;
eventy, ktore przyszly pozniej, pozostaja do kolejnego odswiezenia.

Blad HTTP nie potwierdza eventu i pozwala na retry. Reconnect, nieznany
sygnal i zmiana tokenu uniewazniaja pokrycie, zamiast zakladac, ze pamiec
poprzedniej sesji jest nadal aktualna. Opozniona odpowiedz starego requestu
nie nadpisuje danych nowej sesji. Eviction dopuszcza dodatkowy bezpieczny
GET, nigdy utrate nowej zmiany. Nie jest to deduplikacja trwalych zapisow
biznesowych ani gwarancja jednego GET na zawsze.

Dowod zachowania obejmuje rzeczywisty Dashboard w StrictMode z mockowanym
HTTP/SSE: projection -> zakonczony GET -> notification tego samego eventu
bez drugiego GET, nowe zdarzenie, 503/retry, reconnect i nowa sesja.

### 61.4. Zapis inventory tylko huba operacji

Przed naprawa lokalne pobranie/zwrot fizycznego worka moglo materializowac
inventory calej sieci z RAM. Nieaktualna projekcja obcego huba mogla wiec
nadpisac poprawny zapas w DB. Odtworzony przypadek: AA/BA/CA/DA mialy po
10 workow, lecz RAM obcych hubow pokazywal 100; pobranie worka w AA
zmienialo AA na 9 i niepoprawnie zapisywalo 100 dla BA/CA/DA.

Obecnie take_bag i return_bag przekazuja konkretny hub_name. Materializacja
inventory obejmuje tylko ten hub; brak wymaganego huba jest bledem,
nie pustym zakresem udajacym sukces. Obce zapasy nie sa zapisywane.
Numer kontenera, zmiana zapasu i pozostale zapisy operacji zachowuja
dotychczasowe polaczenie oraz atomowy rollback DB/RAM i licznika.
Nie jest to nowy model magazynu ani usuniecie walidacji konkurencyjnych
operacji; naprawiono zakres utrwalania, nie wszystkie zasady inventory.

### 61.5. Waskie komendy topologii Admin i wymagany schemat batch

Zwykle komendy Admina nie wywoluja juz save_full_snapshot po lokalnej zmianie.
save_topology_changes przekazuje jawne zmiany do portu i repozytoriow:
aktywnosc lub wspolrzedne konkretnego huba, dokladne pary zmienionych drog
(takze auto_relink) oraz rekordy nowego huba/staff i jego poczatkowy zapas.
Niezalezne huby i drogi nie sa materializowane ani kasowane, nawet jezeli
dziela koniec z droga zmieniana przez komende. UPSERT omija no-op.

Oczekujace historie paczek i wpisy finansowe przechodza dotychczasowym
single write path w tym samym conn co komenda; bufory sa rozliczane dopiero
po COMMIT. Blad wycofuje zapis i odtwarza projekcje Admina z zatwierdzonego
DB. Dodanie worka nie uruchamia nastepnego pelnego autosave. Pelny snapshot
pozostaje tylko w jawnych sciezkach recovery, diagnostyki i kontrolowanego
zamkniecia TUI, nie jako ukryta zgodnosc zwyklej komendy.

Batch ustawien wymagajacy scalonej rewizji rynku wymaga aktualnego schematu
courier_market_state.batch_depth oraz singleton=1. Usunieto fallback,
ktory pomijal brak kolumny; brak schematu lub singletona przerywa operacje
przed zapisem ustawien, zamiast udawac poprawny batch. Repozytorium nie
migruje DB podczas requestu. Niezmieniony zestaw nadal jest no-op bez DML
i zwiekszenia rewizji; zmieniony zestaw zachowuje jedna transakcje i jeden
sygnal rewizji.

### 61.6. Skrzynka transportowa wymaga inventory_id

Historyczna sciezka odczytu BOX bez inventory_id probowala rozpoznac
skrzynke przez dekodowanie numeru transportowego. Zostala usunieta.
Podpowiedzi, szczegoly karty i projekcja opakowan korzystaja wylacznie
z bags.inventory_id i wymagaja istniejacego rekordu hub_box_inventory.
Brak/niepoprawne ID albo brak inventory oznacza blad danych; nie wybieramy
innej skrzynki i nie zwracamy domyslnego stanu jako poprawnego wyniku.

Code32 wpisywany przez workera przy wyborze skrzynki z polki nadal jest
poprawnie dekodowany do klucza inventory. Nie mylic tego z usunieta proba
odtworzenia inventory_id z nazwy kontenera transportowego. BAG/VIRTUAL
nie wymagaja inventory skrzynki. Zmiana wykorzystuje istniejacy schemat
i wymagania zapisu/triggerow, nie dodaje nowej migracji DB.

### 61.7. Zamkniety zakres, odlozone warianty i stan dowodow

Punkt 15 jest zamkniety w calym wybranym zakresie. Rejestr 15.11 rozdziela
zakonczone podpunkty, niewybrane/odlozone warianty i zabezpieczenia zachowane
celowo. Stary opis problemu lub alternatywnego rozwiazania nie otwiera
automatycznie zadania. Powrot wymaga konkretnej regresji, wyniku testu lub
zmiany wymagan. Warianty poza zakresem wymagaja osobnego zadania i pomiaru;
nie traktujemy ich jako wdrozonych ani jako zaleglosci odbioru.

W szczegolnosci nie wdrozono dodatkowego cache autoryzacji, FTS5 dla
substringow nazw/notatek, React Query/SWR, automatycznego UoW, trwalej
projekcji rynku SQL ani osobnego workera projekcji. Wyszukiwanie
LIKE '%fragment%' nadal moze skanowac; zakonczony zakres indeksow prefiksowych
nie jest deklaracja indeksowania wszystkich zapytan. Planer redystrybucji
i helpery maja opisane osobne snapshoty; nie deklarujemy jednego wspolnego
SQL snapshotu wszystkich funkcji rynku.

Dowody kolejnych odbiorow, nie nowe testy uruchomione przy tej edycji PRD:

- Poprawki 15.10: pelny pytest 4646 PASS, regresja finansowa 581 PASS;
  audyt ledger/signatures 45 chains / 2362 entries PASS i 142 holds PASS.
- Rozszerzenie 15.2.6: 235 testow Node PASS, build Client/Hub i Chromium
  zegara oraz regresje jobs/finance PASS; skupiony pytest 33 PASS.
- Ponowny przeglad zamkniecia: 268 testow backendowych PASS i 235 Node PASS.
  Testy backendowe pracowaly na izolowanych backupach SQLite; szczegoly,
  czasy i lokalne artefakty sa w task.md, nie byly to ponowne pelne suite.

Gate pilota finansowego pozostaje oddzielny. Ostatni zapisany wynik to
0/20 rzeczywistych intentow w oknie 24 h, a nie stale stwierdzenie o DB.
Przed rolloutem wymagany jest nowy gate z niezmienionym progiem; nie
generujemy sztucznych platnosci ani nie uznajemy zamkniecia punktu 15
za zgode na uruchomienie pilota.

Rozmowa o Nano ID oraz przeksztalcaniu UUID do wielkich liter byla analiza,
nie wdrozeniem. Nie podmieniono generatorow, formatu tx_group_id ani
historycznych identyfikatorow. Odnalezienie skryptu WAL/SHM i roboczych
zrzutow TXT rowniez nie zmienilo zasad biznesowych systemu.

<a id="parcel-operational-v1"></a>

## 62. Punkt 41: historia podrozy i ostatnia potwierdzona lokalizacja (2026-10-08)

Ta sekcja normuje obecny kontrakt operacyjny v1 dla API/WEB. Historyczne
opisy braku RESERVED/LOADING/IN_TRANSIT/RECEIVED w historii paczki oraz
`status=in_hub` przez cala podroz nie sa alternatywnym flow ani fallbackiem.
Nie zmienia sie wyceny, rozliczenia SKIP, hash/HMAC, zasad rezerwacji ani
fizycznej tozsamosci opakowania przez samo rozszerzenie historii paczki.
Dokumentacja kontraktu nie jest potwierdzeniem pelnego odbioru punktu 41.
Wyniki poszczegolnych etapow i pozostaly zakres sa w task.md, punkt 41.

### 62.1. Trzy odrebne zapisy

| Zapis | Znaczenie i granica |
| --- | --- |
| `package_events.event_key` | Podpisana historia paczki. Uzgodnione logistyczne eventy transportu i zakonczenia rezerwacji pozwalaja uprawnionym klientom i hubom czytac przebieg rzeczywistych odcinkow. Nie kopiuje sie wszystkich eventow worka/zlecenia |
| `packages.status` | Krotka custody do filtrowania: pending_intake, hub_storage, courier_custody, hub_processing, hub_sorting, ready_pickup, delivered |
| `packages.package_status` | Wersjonowany obiekt JSON: aktualna phase/location/transport, ostatnia skuteczna operacja, dwa osobne dowody miejsca, incident i istotny operacyjny trace |

Ustawienie `package_status_json` w config opisuje kategorie ryzyka wyceny;
nie jest slownikiem custody ani operacyjnym dokumentem paczki. Draft oraz
platnosc prepaid nie dowodza fizycznego nadania i nie dostaja fikcyjnej
podrozy opakowania. Creation wybiera jedna rzeczywista galaz przyjecia.

### 62.2. Publiczne eventy i finanse

RESERVED zapisuje sie po skutecznym claimie zaakceptowanego itemu,
LOADING po skutecznym rozpoczeciu zaladunku, IN_TRANSIT po przejeciu
manifestu przez kuriera, RECEIVED po rzeczywistym przyjeciu tego opakowania
i rozliczeniu w docelowym hubie. Kazdy event obejmuje dokladne paczki
zamrozonego manifestu itemu. Nie obejmuje przypadkowych paczek w hubie,
pozniejszej zawartosci opakowania ani pominietego huba na trasie SKIP.

Kazdy z tych czterech eventow ma SQL `amount=NULL`, brak finansowego TX
i nie tworzy ksiegowania ledgeru. Zachowuje stabilna tozsamosc przyczyny,
job/item, aktora, opakowanie, faktyczne konce odcinka oraz czas UTC.
Tracking wybiera amount IS NULL; finance amount IS NOT NULL, takze zero.
Skuteczne anulowanie albo wygasniecie rezerwacji dopisuje odpowiednio
`CANCELLED` albo `EXPIRED` do paczek objetych tym claimem, rowniez z
`amount=NULL` i bez finansowego TX. Powtorzenie tej samej decyzji nie
dopisuje drugiego eventu. Anulowanie nie oznacza przybycia do huba ani
fizycznego zwrotu paczki; te operacje wymagaja osobnego dowodu.
Przyklad RESERVED -> CANCELLED -> RESERVED -> EXPIRED pozostaje w pelnej
historii czterema zdarzeniami, nawet jesli uproszczona karta B je redukuje.
`check_balance(amount=0)` bez TX jest poprawnym finansowym sprawdzeniem
salda, nie przejazdem, nowa oplata ani aktualizacja ostatniego miejsca.
Nie dorabiac mu TX ani nie zamieniac logistycznego NULL na zero.

Operacyjny checkpoint ma osobne `operation_key`: np. publiczne IN_TRANSIT
odpowiada skutecznemu `departed`. Nie trzeba tworzyc publicznego eventu
dla kazdego pomiaru, decyzji sortowania, wejscia w ekran i odczytu.
Finansowe courier/courier_bonus pozostaja dowodem rozliczenia przewozu;
nowe logistyczne eventy nie podwajaja przejechanych odcinkow ani wyplaty.

### 62.3. Aktualny stan, ostatnia operacja i wiarygodnosc miejsca

Dokument v1 ma schema_version, monotoniczne revision, phase, last_checkpoint,
location, last_confirmed, last_parcel_observation, transport, incident,
attachment_episode_id i trace. Odczyt odrzuca brak/uszkodzenie dokumentu,
sprzecznosc custody/membership/huba lub dowodu; nie naprawia DB i nie
odtwarza miejsca z aktualnej topologii ani nieaktualnego runtime.

Kazdy checkpoint zawiera stabilny checkpoint_id, seq, operation_key,
occurred_at UTC z pelna data/czasem, aktora i rodzaj dowodu. Dla odpowiedniej
operacji zachowuje job/item/work/command/event IDs, source/target i powod.
Revision nie zalezy od dlugosci zachowanego trace. Jednakowy czas dwoch
operacji nie daje kolizji: kolejnosc wyznacza seq, nie zegar przegladarki.

| Pole | Co wolno z niego wywnioskowac |
| --- | --- |
| `last_checkpoint` + `phase` | Ostatnia skuteczna czynnosc i jej wynik; niekoniecznie fizyczne obejrzenie paczki |
| `location` | Aktualne przypisanie/custody: hub, dokladne opakowanie i typ, poczekalnia, sortowanie, polka albo tranzyt; placement moze byc pending |
| `last_confirmed` | Ostatnie potwierdzone przekazanie/miejsce, jego wlasny czas i dowod: np. przejecie manifestu opakowania |
| `last_parcel_observation` | Ostatnia potwierdzona indywidualna obserwacja tej konkretnej paczki; przy braku takiego dowodu jawne null |
| `incident` | Raport braku/znalezienia lub rozbieznosci; nie dowodzi nowego przypisania i nie usuwa starszego potwierdzenia |

Rezerwacja, pomiar calego worka, otwarcie sortowania, decyzja retained,
rename i odczyt nie udaja indywidualnej obserwacji. Evidence odroznia
container_manifest, parcel_observation, system_record oraz reported.
Nie przedstawia sie czasu raportu/GET jako czasu fizycznego obejrzenia.
VIRTUAL to logiczne grupowanie, nie fizyczne pudlo. Nieznanego miejsca
odlozenia ani numeru polki nie wolno wymyslac.

`current_hub_name` pozostaje pojedynczym kodem. W tranzycie zachowuje hub
zrodlowy ostatniego przekazania; odcinek znajduje sie w transport:
from_hub_name, original_to_hub_name, effective_to_hub_name, direction,
courier/job/item. Cel nie jest potwierdzona obecnoscia ani pozycja GPS.
Zwrot zmienia effective_to i direction, nie pierwotny kontrakt original_to.

Korekta 2026-10-11: po skutecznym wydaniu zwyklej paczki klientowi
(`status=delivered`, `package_status.location.type=customer`)
`packages.current_hub_name` jest SQL `NULL`. Paczki nie ma juz w hubie.
Czyszczenie nastapuje w tej samej transakcji co checkpoint wydania,
zwolnienie polki i rozliczenie; blad operacji wycofuje calosc. Samo
otwarcie formularza odbioru, nieudana autoryzacja lub podglad nie czyszcza
tego pola. Dla assetu przyjetego do zasobow (`asset_received_into_stock`,
`location.type=asset_stock`, rowniez `status=delivered`) kod huba pozostaje.

Przed korekta pole zachowywalo ostatni hub rowniez po wydaniu klientowi.
Teraz nie wolno interpretowac huba wydania jako biezacej obecnosci paczki:
hub wydania pozostaje w `package_events.hub_code2` i w historycznym
kontekscie checkpointu/`package_status.location.hub_name`. Nie przepisujemy
podpisanych eventow, receiptow ani historii. Odczyty operacyjne, wyszukiwanie
i audyt integralnosci stosuja te sama regule SQL `NULL` dla customer,
kod huba dla asset_stock. GET ani start API nie naprawiaja starszych
rekordow automatycznie; korekta ich biezacego pola jest jawna i nie
dopisuje fikcyjnego kolejnego wydania.
Sprawa/incydent zgloszony po wydaniu nadal moze nalezec do huba wydania:
powiazanie jest sprawdzane w zapisanym, zweryfikowanym kontekscie wydania,
nie przez ponowne wypelnienie `current_hub_name`. Obcy hub bez powiazania
z paczka lub jej transportem nie uzyskuje przez to dostepu do sprawy.
Docelowy hub staje sie miejscem custody dopiero po skutecznym przyjeciu.

### 62.3A. UTC w danych, czas lokalny w prezentacji (zasada globalna)

Timestamp konkretnego zdarzenia oznacza jednoznaczny instant UTC. DB,
API, push, podpisy i techniczne eksporty zachowuja UTC oraz oznaczenie
strefy (`Z` lub jawny offset); nie zapisujemy lokalnego zegara jako UTC.
Istniejacy kontrakt SQLite timestampu bez strefy oznacza UTC, nie lokalny
czas przegladarki. Nie zgadujemy jednostki epoch: Python/JWT sekundy,
JavaScript Date milisekundy, zgodnie z kontraktem danego pola.

Wszystkie etykiety konkretnej daty/godziny w Client, Hub i Admin App
pokazuja lokalna strefe przegladarki uzytkownika. W terminalu jest to
lokalna strefa hosta operatora. Dotyczy to historii, sesji, powiadomien,
terminow podpisu, raportow oraz osi paczek A/B/C. Opcja wygladu `ISO`
w UI zmienia sposob zapisu etykiety, nie przelacza prezentacji na UTC.
Nie wyswietlamy surowego UTC bez strefy jako rzekomo lokalnej daty.
Gdy potrzebna jest pelna precyzja dowodu operacyjnego, etykieta lokalna
zachowuje ulamek sekundy ze zrodla i pokazuje lokalny offset.

Czas trwania, TTL, liczba minut i data bez godziny nie sa instantami.
Nie przesuwamy ich o offset. Lokalny filtr dnia historii porownuje
instanty z lokalnymi granicami dnia. Biznesowe grupowanie dni pracy
`Africa/Nairobi` z 39.7 pozostaje bez zmian, ale timestampy akcji tego
raportu nadal sa prezentowane w lokalnej strefie odbiorcy raportu.
Zmiana prezentacji nie zmienia seq, deadline, historycznych timestampow,
hashy, podpisow ani rozliczen; DST nie sluzy do porzadkowania zdarzen.

### 62.4. Hooki zakonczonych operacji

| Skuteczna operacja | Checkpoint / wynik |
| --- | --- |
| Nadanie WAITING | created_waiting / pending_intake; bez fikcyjnego worka |
| Nadanie NORMAL albo lokalny OUTTAKE | created_in_container / stored_in_container albo created_on_shelf / ready_pickup |
| Poczekalnia -> opakowanie | intake_attached; ten sam package_id, bez drugiego creation/oplaty |
| Claim i waga zrodla | reserved, source_weight_recorded; custody nadal w hubie |
| Konflikt pomiaru i decyzja | weight_review_opened/resolved; zachowane miejsce i faza wznowienia |
| Start loading i wyjazd | loading_started, potem departed; dopiero departed daje courier_custody/in_transit |
| Rezygnacja przed wyjazdem | cancellation_requested, po akceptacji reservation_released; paczka zostaje w opakowaniu |
| Zwrot po wyjezdzie | return_required, po faktycznym odbiorze return_received; bez fikcyjnej wizyty w pierwotnym celu |
| Obsluga odbioru | receiving_started i destination_weight_recorded nie sa jeszcze received |
| Odebranie konkretnego opakowania | received / hub_processing, received_pending_handling; atomowy settlement |
| Utrwalona dalsza instrukcja | awaiting_transfer albo awaiting_sorting; nie sam GET planu |
| Osobna praca sortowania | sorting_started / hub_sorting, konkretne source i work |
| Pozostawienie lub ruch jednej paczki | sorting_retained albo sorting_moved; moved zachowuje stare/nowe opakowanie, nie przestawia rodzenstwa |
| Gotowy TRANSFER | transfer_ready / awaiting_courier, hub_storage; tego samego opakowania nie udaje nowego fizycznego placement |
| Wykonany OUTTAKE | shelved_for_pickup / ready_pickup; rzeczywisty wpis polki |
| Wydanie klientowi lub finalizacja zasobu | delivered / customer albo asset_received_into_stock / asset_stock; terminalna custody delivered |
| Istniejaca sprawa | missing_reported, lost_reported, found_reported, incident_resolved; bez samoczynnej korekty membership |

Jedna komenda moze zapisac kilka zakonczonych krokow w tym samym UoW;
latest opisuje jej koncowy wynik, trace zachowuje wykonana kolejnosc.
TRANSFER bez osobnej pracy sortowania nie dopisuje sorting_started.
END_SORTING nie cofa paczki juz przeniesionej do nowego opakowania.
sorting_retained zapisuje decyzje, source, aktora/czas, lecz zachowuje
starszy dowod; jest to wazne dla szukania paczki pozniej zgloszonej jako brak.

### 62.5. Retencja, atomowosc i ochrona manifestu

Jedyna flaga: `package_settings.package_operational_trace_full`, domyslnie 1.
1 zachowuje dostepny trace; 0 zaczyna nowy odcinek dopiero po rzeczywistym
nowym fizycznym przypisaniu do BAG/BOX, z kotwica before/after i poprzedniego
episode. Retained, rename, TRANSFER tego samego opakowania i VIRTUAL nie
czyszcza listy. Latest, oba dowody z czasem, revision i trwala deduplikacja
w parcel_checkpoint_receipts pozostaja. Zmiana flagi dziala przez konfiguracje
na zywo dla nastepnych zapisow; nie kasuje danych samym ustawieniem.
0 -> 1 nie odtwarza wczesniej skroconego trace. Publiczne/finansowe eventy
nie sa usuwane przez te flage.

Komenda korzysta z jednego caller-owned conn i jednego commit: uprawnienia,
claim/CAS, rzeczywisty ruch, publiczne eventy, checkpoint/receipt, wymagane
finanse i outbox. Awaria dowolnej paczki albo ledgeru cofa caly krok.
Checkpoint nie zmienia zamrozonej trasy/zawartosci manifestu ani
bags.content_revision. Zmiana custody jest dozwolona tylko przez odpowiedni
chroniony zapis; nie przez dowolny snapshot/flush starego runtime.
Identical retry odczytuje trwaly wynik bez nowego seq/czasu/oplaty;
sprzeczna druga decyzja lub zmieniony payload tego samego klucza sa odrzucone.
Blad odpowiedzi/push po commit nie cofa DB i nie upowaznia do ponownej wyplaty.

### 62.6. Odczyty na zadanie i granice dostepu

Hub Szukaj czyta maly aktualny latest, nie pelny trace wszystkich wynikow.
Pokazuje osobno ostatnia operacje, oczekiwane przypisanie, ostatnie
potwierdzone przekazanie i indywidualne "ostatnio widziana", jesli istnieje.
Szczegoly/slad sa odczytywane dopiero po otwarciu uprawnionego dossier.
Kazda strona trace przypina exact package_id i revision; zmiana rewizji
wymaga ponownego otwarcia, nie scalenia stron roznych stanow.
Sesja/rola/hub i dane sa sprawdzane w tym samym aktualnym snapshotcie.
Lista i dossier odbioru maja jawny BEGIN IMMEDIATE dla istniejacego auth
housekeeping/expiry; to nie zapis fikcyjnej fizycznej obserwacji.

Client odczytuje uzgodniona historie i bezpieczna projekcje przy otwarciu
paczki przez uprawnionego nadawce/odbiorce. Nie otrzymuje operatorskiego
trace, hasel logowania, technicznych sekretow, command IDs ani prywatnego
dossier z push. Uzgodnione haslo odbioru paczki jest osobna instrukcja:
uprawniony nadawca i odbiorca widza je jawnie w odczycie karty A opisanym
w rozdziale 63. Nie oznacza to zgody na broadcast hasla ani innych sekretow.
Nie ma pollingu historii ani broadcastu nowego checkpointu do wszystkich.
Opozniony odczyt nie nadpisuje karty nowej sesji/huba/otwarcia. Po wydaniu
Hub czyta natywny wynik zamiast wymyslac checkpoint w przegladarce;
komendy finansowej nie anuluje/ponawia automatycznie po bledzie odczytu.

### 62.7. Cutover, zakres wstrzymany i odbior

Na swiezej DB instalowany jest aktualny schemat; creation zapisuje
aktualna galaz operacyjna. Dla istniejacej DB cutover jest osobnym jawnym
procesem na spojnej kopii z preflight: brak chronionych claims/przejazdow,
jednoznaczne placement, aktualne klucze i poprawne lancuchy. Blad przerywa
calosc. Migracja nie fabrykuje dawnych eventow, obserwacji i dat; revision=0
oraz null potwierdzenia oznaczaja brak takiego historycznego dowodu.
Zwykly GET, startup API i biznesowa komenda nie uruchamiaja takiej naprawy.
Nie wdrazac na roboczej DB bez zatwierdzonego cutover i odbioru.

Nowe fizyczne komendy weighing_started, waiting_room_placed, parcel_observed,
wrong_container_detected i custody_reconciled wymagaja odrebnego uzgodnienia
potwierdzenia, aktora, dozwolonego wejscia/wyjscia i wersji kontraktu.
Nie sa dopuszczone przez samo zarezerwowanie nazw w planie. Report found
nie moze zastapic fizycznego scan albo uprawnionej korekty przypisania.
Fizyczna Rewizja (revision_requested/received/resolved, review_area) pozostaje
WSTRZYMANA wedlug curier 15-16. TUI oraz polityka/topologia hubow z punktu 40
pozostaja WSTRZYMANE; nie deklarujemy odbioru hybrid/TUI dla nowych stanow.

Warunki zakonczenia API/WEB: rzeczywiste komendy kazdej galezi, rollback
poznej awarii, replay/recovery, dwie sesje jednej osoby i dwoch operatorow,
oba tryby retencji, swieza DB/kopia, HMAC/ledger/HOLD/TX integrity,
pelny pytest, bramki finansowe, buildy i odbior przegladarki. Wymagany
realny pilot finansowy pozostaje HOLD; nie obnizamy progow i nie fabrykujemy
platnosci. Test samego reducera ani obecna dokumentacja nie zamykaja odbioru.

Zrodla kontraktu: [task.md, punkt 41](../tasks/task.md),
[tabela podrozy z odrebnym baseline](../reference/parcel_journey_events_AA_BA_DA_EA.md),
[slownik custody](../../src/kenya_courier/domain/parcel_custody.py),
[model operacyjny](../../src/kenya_courier/domain/parcel_operational_status.py),
[reducer checkpointow](../../src/kenya_courier/domain/parcel_checkpoint.py).

### 62.8. Ochrona zapisu i pozniejsze uzupelnienia

Zmiana przypisania lub custody nie moze ominac natywnego checkpointu.
Techniczny `parcel_custody_write_permits` jest uprawnieniem do konkretnego
zapisu w tej samej transakcji, nie nowa decyzja biznesowa ani trwala sesja.
Guardy i dowody operacji maja wykrywac zapis bez uzgodnionego checkpointu,
nie tworzyc historii po fakcie. Awaria wycofuje rowniez event, permit,
zmiane manifestu i finansowe skutki danej komendy. Przy sukcesie nie moze
pozostac nieskonsumowane uprawnienie do dowolnej pozniejszej zmiany.

Przyjecie manifestu potwierdza transport jego paczek, ale nie wymysla
indywidualnego obejrzenia kazdej sztuki. Pozostawienie paczki w tym samym
worku po sortowaniu jest jawna operacja, nie domyslne "widziano".
Materialne zmiany chronionego manifestu wymagaja wlasciwej komendy;
odczyt, synchronizacja cache ani zmiana nazwy nie moga ich dopisac.
Wersja dokumentu operacyjnego v1 i wersja schematu DB to rozne numery.
Pozniejszy schemat v25 listy paczek nie jest nowa wersja custody.

<a id="client-parcel-cards-v1"></a>

## 63. Client: karty paczek A/B/C i pelna historia - 2026-10-09

Zrodlo wymagan: [task.md, punkt 42](../tasks/task.md), uzgodnienia rozmowy
oraz aktualny kod Client. To opis najnowszej wersji, nie suma wszystkich
prototypow. Zakres 42.0-42.18 jest odebrany; 42.19 i 42.20 sa wdrozone
w kodzie, ale ich odbior wizualny pozostaje otwarty.

### 63.1. Tozsamosc, czas i wspolne reguly

Lista zawiera wszystkie dostepne paczki klienta jako nadawcy lub odbiorcy,
takze zakonczone. Dostep do formularzy nadania wymaga uprawnienia platnika.
Kazdy odczyt sprawdza aktualna sesje i ACL; posiadanie ID nie daje dostepu.
Kluczem karty jest dokladna tozsamosc rekordu, nie sam krotki kod paczki.

DB przechowuje chwile UTC; wszystkie daty i godziny sa prezentowane
w lokalnej strefie uzytkownika zgodnie z 62.3A. Daty biznesowe i czas
trwania nie podlegaja automatycznej konwersji jak timestamp.
NOW oznacza ostatni dostepny stan, nie GPS ani zdarzenie zapisane teraz.
Brak daty, adresu lub dowodu nie moze byc uzupelniony wymyslona wartoscia.

Trasa klienta laczy rzeczywiscie przebyta droge, zaakceptowany aktualny
odcinek i pozostaly plan. Pominiety hub SKIP nie jest pokazywany ani
przekreslany. Powrot do faktycznie odwiedzanego huba jest osobna wizyta;
nie usuwamy powtorzen kodu globalnym deduplikowaniem.
Prezentacja nie zmienia trasy w DB i nie tworzy nowych eventow.

### 63.2. A: minimalistyczna karta podstawowa

- Os wypelnia szerokosc karty, ma jasna czesc pozostala i ciemna przebyta.
  W tranzycie wypelnienie dochodzi do polowy aktualnego odcinka; to umowna
  wizualizacja, nie pomiar postepu. Punkty hubow rozkladaja sie responsywnie,
  z uwzglednieniem szerokosci dat przy obu brzegach i marginesow osi.
- Daty nad punktami: dzien.miesiac i godzina:minuta, bez roku. Pierwszy
  hub korzysta z INTAKE, kolejne z RECEIVED, odbior z delivery.
  Przyszle huby nie otrzymuja fikcyjnych dat.
- Huby maja niebieska ikone huba i tekst 1.08 rem. Podpisy hubow i NOW
  zaczynaja sie 3 px ponizej dolnej krawedzi punktu, nie samej osi.
  NOW ma niebieska ikone paczki wewnatrz ramki.
- Nad osia ID z ikona paczki zajmuje obszar przy 1/3 szerokosci,
  a pierwotna cena paczki przy 2/3. Dopasowanie tekstu zachowuje margines
  3 px u gory i dolu. Ich kolor jest taki sam jak trojkata; aktualny
  wariant nie przyciemnia ich dawna przezroczystoscia 70%.
- Dwa dolne pola maja szara ramke 1 px, odstepy 3 px przy brzegach
  i miedzy polami; zaczynaja sie 5 px ponizej podpisow hubow. Nie zaslaniaja
  warstwy podpisow osi. Pierwsza linia zajmuje polowe dostepnej wysokosci,
  dwie nastepne po jednej czwartej; tekst dopasowany i wysrodkowany.
- Lewe pole: imie i nazwisko drugiej strony, adres, uwaga. Prawe pole:
  instrukcja odbioru, dane kontaktowe/ID osoby, ikony tagow i special care.
  Przy dokumencie instrukcja pokazuje ikone i imie/nazwisko odbiorcy;
  przy telefonie, emailu lub hasle odpowiednia wartosc. Haslo jest jawne
  dla obu uprawnionych stron, bez gwiazdek. Nie pokazujemy calego profilu
  wlasciciela konta drugi raz, ale instrukcja dokumentu dotyczy odbiorcy.
- Informacje poprzedzaja niebieskie ikony; duza ikona przy ID zachowuje
  kolor trojkata. Ikony tagow maja rozne kolory inne niz niebieski,
  bez tekstowych nazw tagow. Nie zastepujemy brakujacej ikony przypadkowa.

### 63.3. B: uproszczona os zdarzen

Klikniecie A pobiera swieze szczegoly tej jednej paczki i zastepuje A
karta B. B nie wraca do A przy zwyklym kliknieciu. Os przewija sie plynnie
kolem myszy, dotykiem, strzalkami oraz klikaniem odpowiedniej polowy pola.
Sterowanie karta, zaznaczanie tekstu i gest przewijania nie otwieraja C.

Opisy znajduja sie naprzemiennie nad i pod osia. Male ramki dopasowuja
szerokosc do tresci, maja rowne wewnetrzne odstepy po obu stronach
i najwyzej trzy linie. Godzina znajduje sie przy punkcie osi, nie jako
trzecia linia w ramce daty. Numer dnia ma 27 px, obok sa dwa wiersze
z dniem tygodnia oraz miesiacem/rokiem. Godziny i podpisy hubow maja
1.08 rem; przed hubem jest niebieska ikona, w ramce NOW ikona paczki.
Os zaczyna sie i konczy 10 px od krawedzi pola oraz biegnie jasnym kolorem
od NOW do konca widocznego obszaru, nie urywa sie na ostatnim evencie.

Ludzkie opisy wynikaja ze wspolnego slownika istniejacych eventow:

| Event | Znaczenie w karcie B |
| --- | --- |
| payment_creation / creation | Utworzenie paczki |
| intake | Przyjecie do wskazanego huba |
| RESERVED | Rezerwacja transportu paczki |
| LOADING | Rozpoczecie zaladunku |
| IN_TRANSIT | Paczka w drodze do wskazanego huba |
| RECEIVED | Przybycie do huba; na koncu do huba docelowego |
| sorting / transfer | Sortowanie / przekazanie paczki |
| outtake | Gotowa do odbioru; nadawca widzi oczekiwanie, odbiorca instrukcje |
| delivery | Paczka odebrana |
| PACKAGE_MISSING_REPORTED / PACKAGE_CONFIRMED_LOST | Zgloszenie braku / potwierdzenie zagubienia |
| PACKAGE_FOUND / PACKAGE_UNCLAIMED | Zgloszenie znalezienia / nieodebranej paczki |
| PICKUP_AUTH_FAILED / PICKUP_AUTH_LOCKED / PICKUP_AUTH_UNLOCKED | Nieudana / zablokowana / odblokowana autoryzacja odbioru |
| PICKUP_EXPIRED | Uplyw terminu odbioru |

Slownik przygotowuje tlumaczenia, nie tworzy nowych zdarzen w DB.
CANCELLED i EXPIRED sa pomijane tylko w B. Serie ponownych rezerwacji
w tym samym etapie redukujemy do ostatniego RESERVED z jego prawdziwa
data. Nie laczymy w ten sposob roznych zakonczonych przejazdow.
Oczekiwanie na kuriera moze wynikac z phase i podpisu NOW, bez fabrykowania
publicznego eventu. B pokazuje najwyzej jeden przyszly hub za NOW, bez daty.
Poczatkowa pozycja przewijania wskazuje ostatnia rzeczywista akcje.

### 63.4. C: rozkladana pelna historia

Po otwarciu B Shift/Ctrl przy wskazniku nad karta uzbraja rozkladanie.
Alternatywa dla kazdego urzadzenia jest stale widoczny trojkat w prawym
dolnym rogu. Klikniecie trojkata uzbraja/rozbraja; kolejne klikniecie pola
otwiera C. PPM nie jest zastepowany tym mechanizmem.
Polprzezroczysta kolorowa zakladka wysuwa sie z LEWEJ strony na okolo
1/5 szerokosci, pozostajac przycieta wewnatrz karty. Zwolnienie modyfikatora
chowa ja, chyba ze zostala uzbrojona trojkatem. Uzbrojona karta nie przewija
osi B przez klikniecia, ktore maja otworzyc C.

A i B maja identyczna wysokosc bazowa, obecnie 148 px, bez rozpychania
sasiadow przy zamianie. C rozklada trzy dodatkowe panele na zawiasach
jak prototyp delivery_card, do lacznie 4H (obecnie 592 px). Nie jest to
zwykla animacja height. Zamkniecie odwraca trzy zlozenia i wraca do A
z pamieci. Przepelnienie tresci jest przewijane wewnatrz, nie zwieksza H.

Pelna pionowa historia zawiera kazde udostepniane zdarzenie w porzadku
chronologicznym, rowniez finansowe, kazde CANCELLED i EXPIRED. Wpis ma
surowy event_key oraz ludzki opis. Aktualny wariant NIE pokazuje dodatkowych
linii z kwotami, saldem ani wycena; nie usuwa z tego powodu samych eventow.
Brak finansowego TX przy amount=0 nie zmienia klasyfikacji z 62.2.

Os jest przesunieta w lewo; odstepy od tekstow po obu stronach sa rowne,
a poziome separatory przechodza przez obie kolumny. Data jest wspolnym
komponentem B/C oraz paneli animacji: duzy dzien, dwa mniejsze wiersze,
godzina C 22 px po prawej stronie daty z odstepem 6 px. Godzina jest
wysrodkowana bez dodatkowego przesuniecia o 2 px; nie ma trzeciego wiersza.
NOW ma tekst 22 px, niebieska ikone paczki w ramce i zwykly podpis fazy
po prawej. Nazwy eventow, np. RESERVED i LOADING, maja kolor osi;
biale i szare teksty nie zmieniaja koloru razem z osia.

Wszystkie faktycznie odwiedzone i pozostale planowane huby az do celu
maja punkty na osi; SKIP jest pomijany, tak jak w A/B. Nazwa huba z
niebieska ikona jest w lewej kolumnie daty, rozmiar 22 px. Po prawej
sa dostepne dane huba z niebieskimi ikonami: adres/nazwa, GPS, 3 words,
plus code, kontakty, hub_note, zdjecie i rating. Godziny otwarcia pokazujemy
tylko z wiarygodnego zrodla; obecnie brak takiego pola oznacza brak danych,
nie wymyslony harmonogram. Przyszle punkty nie udaja juz wykonanych akcji.

### 63.5. Automatyczna skala czasu B (42.19)

Skale wyznacza czysty model prezentacji, nie nowe eventy DB. Zachowuje
kolejnosc zdarzen i powtorzenia; brak, bledny lub cofajacy sie timestamp
nie upowaznia do tworzenia fikcyjnej daty. Punkty pomocnicze sa odrebne
od eventow, hubow i NOW. Czas trwania liczymy z chwil UTC, a brakujace
dni z lokalnego kalendarza, uwzgledniajac doby DST 23/25 godzin.

- Jeden lub dwa brakujace dni: pokazujemy reprezentatywny punkt kazdego,
  zwykle lokalne poludnie, scisle pomiedzy rzeczywistymi akcjami.
- Dluzsza luka: najwyzej dwa reprezentatywne dni, okolo 1/3 i 2/3 luki,
  oraz czytelne oznaczenie kompresji czasu. Nie doklejamy 28 dni miesiaca.
- Pomocnicze godziny sa opcjonalne dla luk od dwoch godzin; kroki
  1/2/3/6/12 godzin, najwyzej cztery punkty na luke, zalezne od miejsca.
  Brakujace dni maja pierwszenstwo. Przy krotkiej luce punktow nie dodajemy.
- Etykieta oznacza przerwe w WIDOCZNEJ historii, nie dowod bezruchu
  paczki ani nieistnienia innych zapisow. Punkty sa neutralne kolorystycznie.
- Odstepy maja minimum potrzebne napisom i ograniczona skladowa czasowa;
  skompresowana luka jest oznaczona. NOW nie rozciaga osi przez Date.now,
  a przyszly hub nie otrzymuje wyliczonego ETA.
- Zmiana szerokosci zachowuje logiczna kotwice i jej polozenie wewnatrz
  viewportu, nie tylko scrollLeft; nie pobiera danych ponownie.

Przyklady: 06.10 11:26 -> 08.10 14:46 dostaje punkt 07.10 okolo 12:00.
Przejazd 10:00 -> 16:00 moze dostac punkty 12:00 i 14:00.
Dwie akcje oddalone o miesiac maja najwyzej dwa punkty dni i kompresje;
dwie akcje oddalone o trzy minuty nie potrzebuja sztucznych punktow.

### 63.6. Kolory, incydenty i zakonczona paczka (42.20)

Os i dawne zielone teksty zachowuja kolor roli: nadawca zielony,
odbiorca czerwony; w C zmienia kolor tylko os i jej akcenty, nie wszystkie
teksty. Kolor ramki/trojkata jest osobna decyzja:

| Priorytet | Stan | Ramka i trojkat |
| --- | --- | --- |
| 1 | Potwierdzony odbior klienta | Szara karta skrocona |
| 2 | Potwierdzone przybycie do celu, oczekiwanie lub aktywny incydent | Niebieskie |
| 3 | Zwykla podroz | Ramka zielona/czerwona; trojkat koloru zlecenia |

Tranzyt do celu ani rezerwacja nie sa jeszcze przybyciem. Stary rozwiazany
incydent nie utrzymuje niebieskiej ramki na zawsze; pozniejszy incydent
administracyjny nie kasuje dowodu zakonczonego odbioru. Poza stanami
specjalnymi trojkat korzysta z koloru aktualnego zlecenia obliczanego jak
w innych panelach; bez zlecenia z lokalnego przydzialu wolnego koloru.

Zakonczona paczka zaczyna jako szara jedna linia: ID, lokalna data/godzina
odbioru, przypisany odbiorca imie/nazwisko i pierwotna cena, z niebieskimi
ikonami. Tekst 1.5 rem, padding 2 px, dostepny obszar dotykowy co najmniej
44 px. Na waskim ekranie mozna przewinac caly wiersz bez obcinania danych.
Nie ma trojkata ani poczatkowego pobierania pelnej historii/kontaktow.
Klikniecie otwiera A, potem B i C; zamkniecie C wraca do A, nie do malej
ramki. Ponowna wizyta w zakladce przywraca poczatkowy wariant listy.

Odbior jest dowodzony natywnym customer handover oraz odpowiadajacym mu
eventem delivery, nie dowolnym tekstem statusu. W podpisie pokazujemy
przypisanego odbiorce z systemu. Nie wprowadzamy tym punktem odbioru przez
pelnomocnika ani nowej adnotacji faktycznej tozsamosci innego odbierajacego;
istniejaca techniczna komenda Admina nie jest nowym klienckim flow.

### 63.7. Odczyty, cache wizyty i ograniczona lista

Nie ma pollingu, przycisku odswiezania ani push historii wszystkich paczek.
Kazda wizyta w zakladce Paczki posiada strony listy, dane A/B/C i stan
przewijania. Pierwsze wejscie pobiera strone danych podstawowych; pierwsze
otwarcie B jednej paczki pobiera jej swieze szczegoly, pierwsze C reszte
pelnej historii. Kolejne otwarcia/animacje pracuja na pamieci wizyty.
Wyjscie z zakladki usuwa te dane; powrot jest nowym odczytem.

Rozszerzenie 42.20 doprecyzowuje dawna zasade trzech odczytow: kazda
kolejna strona listy wymaga swojego GET, a pierwsze otwarcie skroconej
odebranej paczki pobiera jej summary A. Nie jest to ukryte odswiezanie.
Nie ma automatycznych POST, nieograniczonych retry ani pobierania calego
archiwum. Blad wymaga jawnej ponownej proby, bez petli zapytan.

Lista jest malej wielkosci: domyslnie 20, maksymalnie 50 rekordow na strone,
sortowanie malejace po niezmiennym created_at UTC i stabilnej dokladnej
tozsamosci. Nowa paczka zaczyna nowa wizyte na gorze. Nie sortujemy po
zmiennym db_ts ani samym krotkim kodzie. Paginacja jest kursorowa, bez
OFFSET, pelnego COUNT oraz osobnego zapytania dla kazdej karty.
Podpisany kursor jest zwiazany z sesja, aktorem, wizyta i limitem.
Watermark czlonkostwa zapobiega wmieszaniu pozniejszych lub ponownie
wstawionych rekordow, takze z dawna data. Nie utrzymujemy dlugiej
transakcji DB przez caly czas wizyty; kazda strona ma aktualna autoryzacje.

Frontend buforuje co najwyzej jedna strone do przodu na pozycje przewijania;
przycisk starszych paczek jest nawigacja, nie odswiezaniem. Wirtualizacja
ma mierzone spacery i bufor okolo 400 px. Otwarta lub sfokusowana karta
nie znika z DOM. Usuniecie zamknietej karty poza ekranem nie usuwa jej
cache ani nie wywoluje ponownego GET po powrocie. Pozne odpowiedzi starej
sesji/wizyty sa ignorowane; cleanup usuwa dane wraz z haslem odbioru.

Schemat v25 dodaje niezmienne packages.created_at, indeksy oraz
parcel_list_entries - monotoniczne czlonkostwo, NIE druga historie paczki.
Triggery zapisu/usuniecia dzialaja na tym samym conn. Migracja dat wymaga
dowodu z pelnego technicznego ID lub payment_creation; brak dowodu
przerywa migracje atomowo, bez fallbacku na dzisiejsza date lub db_ts.
Na dzien tej aktualizacji schemat jest przygotowany w kodzie, ale nie
zastosowany do lokalnej DB. Standardowy bootstrap TUI instaluje schemat;
API jedynie weryfikuje readiness, a GET nie migruje DB.

### 63.8. Wlasnosc kodu i odbior

Prototypy timeline_A, timeline_B i timeline_delivery_card sa referencja
graficzna, nie zaleznoscia produkcyjnego builda. Potrzebny kod i zasoby
maja wlasne miejsce w Client; usuniecie katalogow prototypow nie moze
uszkodzic aplikacji. Nie dodajemy obcego mechanizmu danych z prototypu.
Slownik eventow, wspolny format daty, projekcja trasy i model skali
pozostaja wydzielone od renderowania i HTTP.

Slady odbioru sa w 42.18-42.20.8 task.md. Zakres 42.18 mial pelny
pytest 6778 PASS i akceptacje wizualna. Pozniejszy zakres 42.20 ma 235
testow Node PASS, skupione testy Python, build i scenariusze browser
desktop/mobile oraz pager 10000 rekordow. Jego pelny przebieg zakonczyl
sie 6776 PASS / 5 FAIL; piec przypadkow poprawiono i sprawdzono osobno.
Nie powtorzono calego przebiegu po tych poprawkach, wiec nie deklarujemy
nowej pelnej zielonej bramki. Odbior wizualny 42.19/42.20 jest nadal otwarty.

<a id="admin-network-observation-v1"></a>

## 64. Admin: obserwacja sieci, gielda i transport - 2026-10-09

Rozwiniecie [task.md, punkt 37](../tasks/task.md). Admin jest narzedziem
wizualizacji, nie generatorem AUTO TEST. Animacja nie wykonuje transportu,
nie rezerwuje zlecen i nie zmienia pieniedzy.

### 64.1. Oddzielne kanaly obserwacji

Paczki oraz Zamowienia maja dwa male przelaczniki ustawione pionowo
w gornym pasku, bez przesuwania sasiednich elementow podczas zmiany.
Zimny start: obydwa OFF. Backend potwierdza maske subskrypcji danej
przegladarki; oczekiwanie lub blad nie udaje aktywnego strumienia.
OFF zatrzymuje przygotowanie/wysylanie danych warstwy, usuwa jej cache
i odrzuca opoznione odpowiedzi. ON wymaga swiezego snapshotu i dopiero
potem delt. Reconnect odtwarza uzgodniona maske, nie wlacza warstw sam.

Siec, huby i obecni kurierzy sa niezalezna projekcja podstawowa.
Wylaczenie obserwacji nie zatrzymuje biznesowego procesu, ledgeru,
outboxu ani komunikacji Hub/Client. Kazda karta Admina ma swoja maske.
Nie pobieramy zamowien jako ukrytej zaleznosci warstwy paczek ani odwrotnie.
Stary pipeline paczek jest izolowany do pozniejszego przeprojektowania.
Dane sa odczytywane i propagowane po commit; snapshot/revision, delty
i ograniczone porcje zastepuja pelny odczyt calej sieci przy kazdym push.

Aktywny kurier oznacza aktywna sesje PRACY kuriera, nie prywatny login.
Lista pokazuje online; po wylogowaniu nazwisko szarzeje i znika po jednej
minucie lokalnego timera. Hover nazwiska pokazuje juz wczytane obserwowane
trasy bez HTTP, takze podczas tej szarej minuty. Klik online wlacza niebieski
fokus kuriera i jego staff_id przy hubach; ponowny klik wylacza, inny
kurier zastepuje fokus. Nie jest to zmiana aktora ani uprawnien.

### 64.2. Zwarte drzewo zamowien

A to odcinek trasy, dystans z ikona i liczba zamowien; B to opakowanie,
zlecenie, stan, kurier i cena; C to zawarte paczki. Bez dodatkowej ramki
admin-order-card i pustych tras. Wiersze sa ciasne, z ramkami, czcionka
jak u kuriera. A/B rozwijaja sie strzalka z przodu, bez bag-expand.
Nie pokazujemy suwakow, ceny/km, wag, gabarytow ani czasow podrozy.
Cena worka jest zawsze ostatnia z prawej; event i staff_id po jej lewej.
Event jest zielony, ID zlecenia ma kolor opakowania, wyznaczany tak samo
jak w Hub/Client; powtorzenia kolorow na calej sieci sa dopuszczalne.

Kolejnosc odcinkow wynika z pierscieni wokol x=0,y=0, nie z wybranego
huba startowego: od centrum na zewnatrz, w pierscieniu zgodnie z zegarem
od godziny 12. Uwzgledniamy dodatkowe odcinki SKIP. Oba kierunki i typy
ofert zachowuja odrebna tozsamosc mimo wspolnej geometrii.

Nadanie ID zleceniu: niebieskie miganie ramki widocznego wpisu.
Zmiana eventu: zielone miganie i aktualny podpis. Potwierdzone zakonczenie
w nastepnym hubie: czerwone miganie, czerwona swiecaca ramka jeszcze
15 sekund, potem usuniecie. Deduplikowany push nie restartuje timera;
anulowanie, reconnect czy OFF nie udaja takiego zakonczenia.
Sama korekta ceny, wagi lub czasu nie udaje zmiany eventu.

Paczka C pokazuje ID, trase, ikony tagow/special care bez nazw oraz
srodki na dalsza droge rozdzielone GiPayMoney od ceny odcinka paczki.
Zero jest wartoscia, brak to brak danych. Wariant oferty SKIP AA-DA juz
przed rezerwacja pokazuje AA -> przekreslone BA -> DA, bez usuwania kodu BA.
Ta sama paczka w standardowej ofercie AA-BA zachowuje BA bez przekreslenia.
To lokalna prezentacja wariantu, nie zmiana trasy ani historii w DB.
Po przyjeciu oferty, w RESERVED/LOADING i IN_TRANSIT, zielone sa wszystkie
kody i strzalki zakresu AA..DA, lacznie z przekreslonym BA. Rezerwacja nie
zmienia geometrii podgladu mapy; zmienia oznaczenie zakresu w tekscie.
Po przyjeciu w hubie konczy sie podswietlenie calego zakresu. Po anulowaniu
nie utrwalamy fikcyjnego przejazdu; ponownie widoczne oferty maja wlasne
niezalezne warianty. Pozniejszy prawdziwy powrot do BA nie jest przekreslany.

### 64.3. Hover i wskazanie kierunku

Hover tylko liter kodow odcinka A, nie calego rozwijanego wiersza,
pokazuje pomaranczowy odcinek BEZ animacji kierunkowej: grupa zawiera
zlecenia w obie strony. Hover trasy paczki C pokazuje cala rzeczywista
przebyta i zaakceptowana/planowana droge, z wariantem SKIP konkretnej oferty
juz przed rezerwacja oraz ruchomymi
kreskami wskazujacymi jej kierunek jak w Client/Kurier.
Przekreslony hub nie moze przywrocic nieaktualnej drogi do BA na mapie.

Hover aktywnego ID zlecenia rozjasnia je, nazwisko kuriera i cala jego
strzalke na mapie tym samym kolorem zlecenia; nie jest niebieskim fokusem
kuriera. Efekt trwa tylko podczas hover/focus. Push aktualizuje wskazanie
po ID, nie utrzymuje starego obiektu pod nieruchomym wskaznikiem.
Wyjscie, zamkniecie drzewa, OFF lub usuniecie obiektu czysci wskazanie.

### 64.4. Strzalki procesu i animacja tranzytu

Rezerwacja ma linie i strzalke przy hubie z kolkiem na koncu, etykieta
uproszczonego ID zlecenia/staff_id i minutami przy przedluzeniu linii,
nie pod nia. Poziomy fragment konczy sie przy rozdzieleniu obu podpisow.
Linia, kolko i strzalka maja wspolny kolor zlecenia. Uklad preferuje
bliskosc huba, brak nakladania/przeciec i dopasowanie napisow 0.5-1 rem.
Po potwierdzonym przejsciu do obslugi w hubie strzalka staje sie linia.
Minuty aktualizuja sie co minute, nie sekundowym ruchem napisow.

IN_TRANSIT usuwa wskazanie przy hubie startowym i uruchamia znacznik
w kolorze zlecenia z etykieta bez CJ-. Biegnie po zaakceptowanym odcinku,
czeka 2 sekundy na starcie i 2 sekundy na koncu, po czym zaczyna od nowa.
To petla wizualna, nie GPS i nie symulacja powrotu kuriera.
Obsluga w hubie docelowym dodaje wskazanie przy tym hubie; potwierdzone
przyjecie zachowuje pomaranczowa kreske przez okres wygaszania wpisu.

Przez hover zlecenia jego znacznik nadal biegnie, pozostale znaczniki
zatrzymuja sie w miejscu. Wybrana etykieta ma najwyzsza warstwe,
a podpowiedz huba pozostaje widoczna. Po wyjsciu pozostale wznawiaja ruch.
OFF/unmount usuwa animacje i timery; preferencja reduced motion jest
respektowana. Nie wymaga to wlaczania ani pobierania warstwy paczek.

### 64.5. Jedna polityka korekty czasu dla Hub, Client i Admin

Zmiana czasu rezerwacji lub ETA przez operatora jest roboczym draftem.
Wspolna polityka wynosi 60 sekund od OSTATNIEJ zmiany; kolejna korekta
przesuwa termin publikacji. Dany Hub moze od razu pokazac lokalny draft,
ale Client i Admin otrzymuja dopiero zatwierdzone RESERVATION_EXTENDED
lub TRANSIT_ETA_EXTENDED. Ich snapshot, push i reconnect nie omijaja
tej zasady przez bezposredni odczyt pending draftu.
To ograniczenie publikacji korekt, nie opoznienie RESERVED, LOADING,
IN_TRANSIT, RECEIVED ani finansowych operacji. Wygasniecie i guardy
bezpieczenstwa nadal dzialaja wedlug aktualnego kontraktu.

Zrodla: [warstwa zamowien](../../courier-viz/src/AdminOrderLayer.jsx),
[tranzyt](../../courier-viz/src/AdminTransitLayer.jsx),
[preview tras](../../courier-viz/src/AdminRoutePreview.jsx),
[polityka czasu](../../src/kenya_courier/domain/courier_timing_policy.py).

<a id="live-config-and-decisions-v1"></a>

## 65. Aktualne kontrakty przekrojowe i zakres otwarty - 2026-10-09

### 65.1. Konfiguracja na zywo (task 38.9)

Zmiana ustawien nie wymaga restartu jako sposobu odswiezania cache.
Zapis, rewizja konfiguracji i outbox sa atomowe; procesy otrzymuja
zdarzenie po commit i odswiezaja zalezne dane. Podstawa zakresu jest
[inwentarz konfiguracji](../reference/live_configuration_inventory.md).
Obejmuje nie tylko limity opakowan, ale wycene, katalogi, ikony,
ustawienia sesji, timeouty, geo oraz ich pochodne projekcje.

Kazdy API ma wlasny runtime i przyjecie nowej wersji. Brak otwartej
przegladarki SSE nie zatrzymuje aktualizacji backendu. Przed operacja
stosujemy aktualne ustawienia nawet przy opoznionej wiadomosci.
Nowy spojny kandydat cache jest podmieniany atomowo; nie przywracamy
TTL ani pollingu jako zrodla poprawnosci. Zapis bez zmiany efektywnych
danych nie wymusza przebudowy wszystkiego.

UI odswieza zalezne zasoby, zachowuje poprawne formularze i wskazuje
uniewaznione wybory. Nie wysyla decyzji automatycznie po zmianie cennika.
Zamrozone manifesty/umowy, zaplacone wyceny, fizyczne cechy istniejacych
assetow i historyczne code1 nie zmieniaja sie przez zmiane domyslnych
ustawien. Wylaczone warstwy Admina pozostaja OFF.
Wyjatkiem od swiezego renderowania kart jest jawny cache wizyty Paczki
z rozdzialu 63: ustawienie nie powoduje ukrytego GET historii wszystkich.
Obsluga otwartych kontekstow TUI pozostaje odrebnym zakresem HOLD.

### 65.2. Wersja calej wyceny i idempotencja nadania (task 39.1)

pricing_version identyfikuje pelna wycene, nie tylko numer cennika.
Obejmuje kanoniczne dane formularza, metode/konto platnosci, ustawienia
cenowe oraz strategie, siec, trase, dystans i wynik w minor units.
Hash SHA256 rozroznia zmieniona decyzje nawet przy identycznej kwocie.
Nie jest kluczem idempotencji ani formatem podpisu ledgeru.

Przed skutecznym nadaniem backend sprawdza aktualna wycene i rewizje
w granicy atomowej operacji. Wymagane potwierdzenie kwoty i wersji
nie jest zastepowane zaufaniem do preview JS. Rozbieznosc daje 409
z aktualna wycena, bez stworzenia osob, HOLD, intentu ani ksiegowania.
Powiazanie platnosci/tx_group obejmuje decyzje nadania i wersje wyceny;
nie mozna uzyc tej samej zgody dla innego formularza o podobnej cenie.

idempotency_key jest wymagany dla konkretnej decyzji. Ponowienie po
utracie odpowiedzi nie tworzy drugiej paczki lub platnosci. Korekta
potwierdzenia tej samej decyzji po odrzuceniu wyceny nie moze obchodzic
tej ochrony. Nowe swiadome nadanie po sukcesie ma nowy klucz; nie
zabraniamy dwoch rzeczywiscie zamierzonych paczek o tych samych danych.
Zmieniony payload juz zaakceptowanego klucza jest odrzucany; dowod
decyzji pozostaje dostepny po promocji technicznego ID formularza.

### 65.2A. Zakonczenie nadania i kolejna paczka w Hub App (Finance 43)

Uzgodnienie 2026-10-11: zatwierdzona platnosc, utworzenie nadanej paczki,
wymagane eventy/ledger i zapisany wynik z instrukcja umieszczenia paczki
sa jedna atomowa operacja. Gdy worker otrzyma potwierdzony sukces oraz
instrukcje, nadanie jest ZAKONCZONE. Nie ma dalszej platnosci tego samego
ID i nie pytamy o powtorzenie zakonczonej platnosci. Ta zasada dotyczy
sukcesu nadania, nie samego istnienia roboczego ID/draftu lub intentu.

Nastepne nadanie to nowa paczka, rowniez gdy nadawca, odbiorca, trasa
i wszystkie dane formularza sa identyczne. Zanim kolejna platnosc zostanie
dopuszczona, otwieramy nowe podsumowanie: aktualna wycena i jej wersja,
mozliwe opakowania, WSZYSTKIE dostepne rodzaje platnosci, aktualne salda
huba oraz nadawcy, konto platnika i uprawnienia. Nie odtwarzamy dostepnosci
metod z poprzedniej paczki. Przy ostatecznej komendzie backend ponownie
sprawdza aktualny stan w tej samej transakcji co obciazenie; podsumowanie
nie rezerwuje sald i nie gwarantuje ich po zmianie w innej sesji.

Nowa decyzja ma nowy `idempotency_key` i nowe ID paczki. Intent,
autoryzacja/challenge/podpis oraz stan oczekiwania PUSH sa nowe, jezeli
metoda ich wymaga; nie przenosimy ich ze starej operacji. Sesja i aktor
uwierzytelnionego workera pozostaja bez zmian, przy ponownej weryfikacji
uprawnien. Czyszczenie stanu formularza nie oznacza kasowania historycznych
kluczy, intentow, eventow lub ledgeru w DB. Awaria odswiezenia podsumowania
nie cofa sukcesu poprzedniej paczki, ale blokuje nowa platnosc na starych
danych. Opoznione odpowiedzi HTTP/SSE starej proby nie zmieniaja nowej.

Techniczny retry, podwojny klik lub utracona odpowiedz tej SAMEJ decyzji
odzyskuja istniejacy wynik, bez drugiej paczki i bez drugiego obciazenia.
Nieznany wynik wymaga uzgodnienia ze stanem backendu, nie przypisania
nowego klucza na podstawie timeoutu. Potwierdzona nieoplacona odmowa,
rollback lub rejected PUSH pozwalaja natomiast swiadomie rozpoczac nowa
decyzje, bez komunikatu sugerujacego pobranie pieniedzy. Przed zmiana
metody/danych zamykamy nieoplacona probe atomowo z kontrola jej wyniku;
opozniona komenda nie moze rozliczyc starej i nowej proby obok siebie.
Wygrywajacy rownolegle settlement oznacza sukces starej proby, nie
anulowanie. Terminalnych intentow nie przywracamy do aktywnego stanu.

Przyklady normatywne:

- Klient odrzucil PUSH VKES, bez settlement: worker moze wykonac nowe
  podsumowanie i wyslac nowy PUSH albo wybrac KES. Stara odmowa pozostaje
  w historii; nie blokuje nowej decyzji i nie jest dowodem zaplaty.
- Za mala gotowka KES i odmowa bez skutkow: po korekcie kwoty i bezpiecznym
  zamknieciu starej proby rozpoczynamy nowa decyzje, nie zmieniamy hasha
  komendy przypisanej do starego klucza.
- Poprawne nadanie pierwszej paczki zmniejszylo saldo huba/nadawcy:
  worker otrzymuje instrukcje. Druga identyczna paczka ma nowe podsumowanie;
  metoda, na ktora zabraklo srodkow, nie jest juz dopuszczona. Pierwsza
  paczka i jej rozliczenie sa niezmienne, nawet jezeli drugi submit odmowiono.
- Commit zakonczyl nadanie, lecz odpowiedz zaginela: retry starego klucza
  zwraca pierwsza paczke i jej instrukcje, nigdy kolejna platnosc.
- PAID/INTAKE nadal przyjmuje juz oplacona paczke bez kolejnego pobrania.
  Dane istniejacego vouchera nie staja sie nowa platnoscia przez sam reset UI.

Implementacja i dowody: [Finance_task.md](../tasks/Finance_task.md), punkt 43.
Kontrakt powyzej nie oznacza zamkniecia testow lub odbioru TUI; te zakresy
maja osobno udokumentowany status.

### 65.3. Sesje, push, uprawnienia i kolejki (task 38)

Kazda karta przegladarki ma wlasna tozsamosc strumienia, nie skopiowany
identyfikator z local/sessionStorage. Dozwolone mnogie sesje sa kopiami
synchronizowanymi z DB: pierwsza poprawna atomowa decyzja wygrywa,
druga sprzeczna jest odrzucana. Dotyczy jednej osoby w dwoch kartach
oraz dwoch osob uprawnionych do tej samej operacji. Limit jednej sesji
uniewaznia poprzednia wedlug aktualnej polityki, nie tworzy pomocnika.

Nie sprawdzamy firmowej roli cyklicznie co 15 sekund. Uprawnienie jest
weryfikowane w aktualnym snapshotcie/tej samej transakcji co chroniona
operacja. Zdarzenie zmiany rol uniewaznia kontekst i strumien; reconnect
ponownie autoryzuje dostep. Push nie jest zamiennikiem atomicznego guarda.
Suwak prywatny/firmowy filtruje kontekst kont; nadawca zaproszenia oraz
udzielania dostepu pozostaje osoba prywatna, zgodnie z ustalonym flow.

Nieudane odswiezenie nie moze bezpowrotnie zatrzymac aktualizacji.
Retry jest ograniczony i dotyczy nieudanej czesci; sukcesy nie sa
przeliczane drugi raz ani nie udaja sukcesu calej rewizji. Pozne dane
starej sesji/huba sa odrzucane. Reconnect/reset ponownie uzgadnia stan.
Sortowanie zachowuje poprawny layout i wybor, ale nie przywraca paczki,
ktora juz zostala przekazana ani zakonczonej pracy.

Hub Finance daje pierwszenstwo komendom uzytkownika przed oczekujacymi
GET sald/historii. Odczyty sa laczone wedlug zasobu; burza eventow nie
tworzy nieograniczonej kolejki. Rozpoczetego odczytu nie udajemy anulowanego,
ale oczekujace odswiezenia nie moga blokowac kolejnych komend. Potwierdzenie
POST nie czeka na zakonczony refresh calego panelu. Formularze/filtry
pozostaja zachowane, a brak odpowiedzi nie powoduje ponownej platnosci.

### 65.4. Polityki setup i ikony (task 39.2-39.4)

Edycja polityki sesji ma expected_version i atomowy CAS. Wersja obejmuje
efektywne ustawienie i override danej osoby; liczba aktywnych sesji nie
jest wersja polityki. Konflikt zachowuje niezapisany formularz zamiast
cicho nadpisac cudza zmiane. Kandydat ustawien runtime/jezyka jest
publikowany spojnie, bez przepisywania tekstow dawnych zdarzen w DB.

Mapowania ikon rowniez maja rewizje i expected_version; po commit
zalezne widoki Hub/Client odswiezaja potrzebne mapowania w porcjach,
nie caly katalog okolo 11000 ikon przy kazdej zmianie. Formularze
i wskaznik odczytu nie gubia stanu. Systemowe statusy/presety maja
stale systemowe przypisania; edytowalne package_tags maja dane startowe
w config, potem stan i uzgodniona synchronizacje DB. Odbudowa katalogu
i odbudowa mapowan sa odrebnymi krokami; reset nie moze polegac na
nieistniejacej poprzedniej DB jako jedynym zrodle ikon.

### 65.5. Pakiety i granice odpowiedzialnosci

Client App, Hub App i courier-viz sa osobnymi projektami React/Vite,
z wlasnymi package.json, lockfile i buildem. web-common dostarcza wspolny
kod, m.in. wycene zgodna z Pythonem; nie jest dodatkowym procesem API.
React dziala w przegladarce, Vite sluzy developmentowi/buildowi; produkcja
korzysta z gotowych assetow. Backend jest pakietem kenya_courier z
odrebnymi composition roots API i jawnie dostarczonym runtime hybrid.
Nie przywracamy globalnych usunietych facade ani singletonu TUI w API.
SQLite pozostaje single-writer; nie zwiekszamy liczby workerow Granian.

Uzupelnienie 2026-10-09: ciezsze strony/panele frontendowe sa osobnymi
modulami ladowanymi przy pierwszym otwarciu. Cache modulu nie zmienia
regul cache danych wizyty Paczki. Blad pobrania panelu pozostawia
nawigacje dostepna i wymaga jawnego retry, bez odtwarzania komend.
Stale ikony interfejsu maja jedna liste `web-common/uiIconList.mjs`.
Ekrany odwoluja sie do trwalych rol `ui:hub`, `ui:weight`, `ui:parcel` itd.;
wymiana wartosci na liscie i przebudowanie aplikacji zmienia ikone we
wszystkich tych miejscach. Build zawiera tylko wskazane SVG, bez pobierania
providerow przy pierwszym uzyciu stalej ikony. Lista nie zmienia przypisan DB.
CatalogIcon laduje pozostale ikony z DB na zadanie, w malych porcjach React
Icons, nie cala kolekcje; wszystkie obslugiwane nazwy pozostaja dostepne.
Identyczny klucz katalogu moze uzyc SVG juz dostarczonego w stalym zestawie.
Format paczek jest walidowany podczas builda, a wspolny renderer i React
korzystaja z cache przegladarki. Nie stosujemy zmiany progu ostrzezen
jako optymalizacji. Pomiary przed/po i bramki sa w
[raporcie pobierania frontendow](../reference/frontend_loading_audit_2026_10_09.md).

### 65.6. Nie utozsamiac dokumentacji z zamknieciem backlogu

| Zakres | Stan na 2026-10-09 |
| --- | --- |
| Publiczne eventy/custody punktu 41 | Aktualny kontrakt w 62; nowe fizyczne komendy wymagaja osobnego flow |
| Karty 42.0-42.18 | Zamkniete i zaakceptowane wedlug zapisu odbioru |
| Skala 42.19 i pelna lista 42.20 | Implementacja/testy istnieja; odbior wizualny otwarty |
| Lokalny schemat v25 listy | Przygotowany; nie deklarujemy wykonanej migracji lokalnej DB |
| TUI, fizyczna Rewizja curier 15-16 | Odlozone / HOLD, nie zamykane testami API |
| Topologia/polityka hubow task 40 | Wymaga omowienia zamkniecia, relokacji i oczekiwania na koniec zadan |
| SKIP_KM_PRICE_V1 i realny pilot finansowy | Kod nie oznacza zgody rollout; HOLD odbioru pozostaje |
| Pozostale kierunki i kredyt/kaucja | Odrebny backlog, nie automatycznie wykonany ta aktualizacja |

Zamkniecie huba na stale lub relokacja nie moga uniewaznic paczek i
przyjetych zlecen w drodze. Rozdzial 65.1 o aktualizacji cache nie ustala
polityki drain/close ani nie daje zgody na natychmiastowe usuniecie huba.
Realny wymagany pilot 20 intencji i okres obserwacji nie jest zastapiony
testami syntetycznymi lub obnizeniem progu bramki. Otwarte wymagania
pozostaja w [indeksie przyszlych zadan](../tasks/task_future.md).

### 65.7. Pochodzenie tej aktualizacji

Porownano ostatni wiekszy zapis PRD a23d71dc (2026-10-08, kontrakt 41),
ostatnia zmiane PRD 79a104db (UTC/local, 2026-10-08) oraz pozniejsza
historie Git do 4cf34180 (2026-10-09). Uzgodnienia A/B/C potwierdzaja
m.in. 170a0bb9, bfd3f47a, a647ab12, 874218c9, 16f5375e i 4cf34180;
431192fb uzupelnial eventy i wizualizacje procesow. Rozszerzenia 42.19
i 42.20 opisano rowniez na podstawie aktualnych plikow roboczych i taskow,
nie przypisujac im nieistniejacego commita.
Wykorzystano dostepna historie tej rozmowy; nie deklarujemy odczytu
innych, niedostepnych archiwow czatow. Nowsze zaakceptowane korekty
zastepuja starsze warianty: C bez linii kwot, zakladka z lewej, zegar C
22 px bez offsetu, A/B wspolne H, SKIP pomijany w Client i przekreslany
w Admin. Zapis PRD sam w sobie nie uruchamia migracji, testu ani rollout.

## 66. Tymczasowe zamkniecie huba, ETA i aktywny transport - 2026-10-10

### 66.1. Obowiazujacy flow: cztery reguly transportu i piec regul zamkniecia

1. Po potwierdzeniu wyjazdu `IN_TRANSIT` opakowanie jest u kuriera.
   Zlecenie znika z biezacego wydania huba zrodlowego i z jego wskaznika
   na mapie Admina. Nie znika rekord kontraktu, audyt ani manifest.
   Hub AA nie musi pozostawac otwarty po przekazaniu transportu AA -> DA.
   Dopiero jawne `ZGLOS ZWROT` kuriera przywraca zlecenie do obslugi
   fizycznego zwrotu w AA; sama niedostepnosc DA tego nie robi.
   Zwykle LOADING nie oznacza wyjazdu: zlecenie nadal jest w panelu
   Wydanie, ale znika jego powiadomienie w dzwonku, jesli nie wymaga
   decyzji workera. Flaga visible projekcji powiadomien nie okresla
   fizycznego polozenia opakowania ani widocznosci w panelu Wydanie.
2. `transit_eta_at` jest oczekiwanym terminem przyjazdu, nie terminem
   waznosci kontraktu. Uplyw ETA nie konczy transportu, nie zwalnia
   opakowan ani HOLD, nie zmienia trasy i nie nalicza automatycznie
   dodatkowej oplaty. `EXPIRED` rezerwacji przed odebraniem opakowania
   jest innym zdarzeniem i zachowuje dotychczasowe reguly.
3. Wylogowanie operatorow, wygasniecie ich sesji oraz tymczasowe
   CLOSED/PAUSE/SLEEP nie zmieniaja zamrozonej zaakceptowanej trasy,
   stawki, manifestu, custody ani `cancellation_state`. Przeliczanie
   dostepnej gieldy nie jest ponownym wyznaczaniem przyjetego transportu.
   Brak operatora docelowego jest przeszkoda w fizycznym przyjeciu teraz,
   nie powodem `CANCEL_REQUIRED` albo `RETURN_REQUIRED`.
4. Kurier po uplywie ETA ma zwykle aktywne zlecenie i moze dostarczyc je
   pozniej, takze nastepnego dnia. Do czasu potwierdzonego przyjecia
   przechowuje opakowania pod swoja odpowiedzialnoscia. Przy otwartym
   hubie worker wybiera zwykle przyjecie i potwierdza wage. Nie jest
   potrzebne tworzenie kolejnego CJ, ponowna rezerwacja ani korekta ETA,
   zeby wolno bylo przyjac opozniony transport.
5. Wylogowanie pyta o zakres sesji zgodnie z rozdzialem o sesjach.
   Jesli po wybranym wylogowaniu nie zostanie operator, backend pod
   `BEGIN IMMEDIATE` odczytuje faktycznie nadjezdzajace `IN_TRANSIT`:
   CJ, staff_id kuriera i ETA. Zgloszony zwrot liczy sie jako przyjazd
   do huba zrodlowego, a nie do dawnego celu. Lista nie obejmuje zwyklej
   rezerwacji kuriera, ktory jeszcze nie ruszyl.
6. Ostatni operator dostaje ostrzezenie `Do huba jedzie kurier` i zwykle
   przyciski `ZAMKNIJ HUB`, `POZOSTAW PAUSE`, `POZOSTAW SLEEP`, `WROC`.
   WROC nie konczy biezacej sesji. CLOSED i PAUSE sa mozliwe po jawnym
   potwierdzeniu mimo pokazanych transportow; nie blokujemy pracownika
   w nieskonczonosc. Gdy pomiedzy pokazaniem listy a potwierdzeniem
   ruszy nowe zlecenie, odpowiedz 409 ponownie pokazuje aktualna liste.
   Nowe zlecenie tez musi byc objete swiadoma decyzja operatora.
7. Zamkniecie sesji/obecnosci, stan huba, audyt i trwale powiadomienia
   dla dotknietych kurierow powstaja w jednej transakcji. Awaria zapisu
   powiadomienia wycofuje takze zamkniecie. Dopiero po commit istniejacy
   outbox wysyla push. Nie dodajemy drugiego mechanizmu, pollingu ani
   timera anulujacego zlecenie. Przy `scope=all` pozostaje dotychczasowy
   jawny etap: zamkniecie innych wlasnych sesji, potem decyzja ostatniej.
8. Kurier otrzymuje `DESTINATION_HUB_CLOSED`: hub zamkniety, transport
   nadal aktywny i opakowania u niego. Ponowne otwarcie wysyla
   `DESTINATION_HUB_REOPENED`. Wygasniecie sesji, PAUSE albo odebranie
   zdolnosci przyjmowania wysyla `DESTINATION_HUB_UNAVAILABLE`, bez
   przypisywania workerowi celowego zamkniecia. Wiadomosc dotyczy tylko
   kurierow rzeczywiscie w drodze do danego huba, w ich sesjach klienta;
   nie jest globalnym powiadomieniem wszystkich klientow/kurierow.
   Start transportu lub jawnego zwrotu do juz niedostepnego huba takze
   zapisuje informacje o niedostepnosci, bez uniewazniania kontraktu.
9. Odbiorca pusha stosuje wersje zlecenia: spoznione CLOSED nie nadpisuje
   nowszego REOPENED. Ostatnia informacja dostepnosci jest odtwarzana
   z `courier_job_events` przy wczytaniu zlecenia, bez nowego pollingu.
   Po zgloszeniu zwrotu informacja starego celu nie jest aktualnym
   ostrzezeniem: istotny jest hub zwrotu. Admin przywraca wskaznik
   przy hubie zrodlowym i wizualny kierunek powrotu; oryginalny kontrakt
   i przebieg paczki pozostaja w DB bez przepisywania historii.

### 66.2. Przyklady, atomowosc i niezmienniki

| Sytuacja | Efekt |
| --- | --- |
| AA wydaje AA -> DA, worker AA wylogowuje sie | IN_TRANSIT/VALID pozostaje; brak wskaznika wydania AA; kurier nadal jedzie do DA |
| Ostatni worker DA wybiera WROC po ostrzezeniu | Biezaca sesja i stan huba bez zmiany; nie powstaje CLOSED ani powiadomienie zamkniecia |
| Worker DA potwierdza CLOSED o 19:00, ETA bylo 19:15 | Jedna transakcja zamkniecia i powiadomienia; cel DA nadal wazny, opakowanie u kuriera |
| ETA minelo w nocy, DA otwiera sie rano | IN_TRANSIT nadal aktywne; kurier dostaje REOPENED i zwykle przyjecie jest mozliwe |
| Sesja DA wygasa automatycznie | UNAVAILABLE, nie twierdzenie o swiadomym zamknieciu; brak anulowania kontraktu |
| Drugie zlecenie rusza po pokazaniu ostrzezenia | Zamkniecie bez jego potwierdzenia odrzucone; nowa lista, sesja nadal aktywna |
| Drugi worker nadal pracuje w DA | Zwykle wylogowanie pierwszego nie zamyka dostepnosci i nie wysyla CLOSED |
| Kurier jawnie zglasza zwrot DA -> AA | Zapis RETURN_REQUIRED w cancellation_state; custody nie zwalnia sie do potwierdzenia zwrotu; widoczna obsluga zwrotu w AA |
| Zamkniecie i przyjecie proboja jednoczesnie | Single-writer i expected_version rozstrzygaja kolejnosc; nie ma podwojnego przyjecia ani utraty opakowania |
| Awaria zapisu eventu CLOSED/outbox | Rollback zamkniecia, sesji, audytu i powiadomienia razem |

Wiadomosci dostepnosci sa eventami zlecenia, nie nowymi zdarzeniami
przekazania paczki ani wpisami finansowymi. Sam CLOSED/REOPENED nie tworzy
`package_events`, payout, TX ani dodatkowego `RECEIVED`. Aktualizowana jest
wersja CJ potrzebna do synchronizacji sesji; podpisany lancuch eventow
zachowuje pelny audyt. Daty zapisujemy UTC, pokazujemy w czasie lokalnym.

### 66.3. Blokada fizyczna, stare konflikty i granica zakresu

Jawna blokada fizycznej drogi, brak huba w DB albo niespojnosc manifestu
pozostaja rzeczywistym konfliktem. Nie staja sie poprawne tylko dlatego,
ze hub zostal otwarty. Po pickup taki konflikt nie oddaje custody do
zrodla: kurier musi jawnie zglosic i fizycznie potwierdzic zwrot.

Walidacja zamrozonej trasy sprawdza istnienie hubow, jawne blocked_links,
zgodnosc opakowania/odcinka oraz zaakceptowany fingerprint. Nie odbudowuje
kontraktu na podstawie dzisiejszego grafu obecnosci. Kolejny login huba,
zmiana jego sesji ani uplyw ETA nie retargetuja CJ. Tymczasowe zamkniecie
nie jest administracyjnym usunieciem, relokacja albo trwala likwidacja huba;
te operacje i polityka drain pozostaja odrebnym zakresem task 40.

Gdy stary `ROUTE_INVALIDATED` powstal jedynie przez brak obecnosci, obecna
walidacja moze przywrocic VALID po potwierdzeniu oryginalnego fingerprintu
i manifestu. Dodaje `ROUTE_REVALIDATED`, nigdy nie usuwa dawnego eventu.
Nie wolno tak usunac `MANIFEST_INVALIDATED` ani nadal istniejacej blokady
fizycznej. Hub API przy starcie wykonuje to uzgodnienie przez obecna
komende aplikacyjna w transakcji, bez instalowania schematu lub recznej
korekty danych w przegladarce. Nie dodano nowej tabeli dla tego flow.

Ten rozdzial zastepuje sprzeczne starsze opisy tymczasowego zamkniecia,
w szczegolnosci wariant automatycznego SLEEP/zakazu CLOSED z curier_task 23
oraz twierdzenie PRD 47.2 o wdrozonej blokadzie zamkniecia. Starsze opisy
przeliczania gieldy (9.2-9.4) nie dotycza przepisania przyjetego kontraktu.
Nie rozszerzamy tu reguly ekonomii SKIP ani autoryzacji odbioru opakowania.

### 66.4. Weryfikacja zachowania

Testy kontraktu obejmuja ostrzezenie/WROC bez zmiany DB, swiadome CLOSED,
PAUSE -> CLOSED, wygasniecie sesji, ponowne otwarcie, opozniony transport
i zwykle przyjecie nastepnego dnia z rozliczeniem. Osobno sprawdzamy nowe
zlecenie pomiedzy ostrzezeniem a potwierdzeniem, dwie sesje podejmujace
decyzje jednoczesnie, pozostanie drugiego operatora, kierunek jawnego
zwrotu, spoznione powiadomienia i odbior tylko przez wlasciwego kuriera.
Awaria zapisu eventu ma wycofac cala transakcje zamkniecia. Niespojnosc
manifestu ani faktyczna blokada drogi nie moga zostac automatycznie uznane
za poprawna trase. Test przegladarkowy obejmuje desktop i telefon.

Na kopii lokalnej bazy potwierdzono przypadek `CJ-4UIUWUW`: bledny konflikt
`frozen_route_hub_inactive` zostal uzgodniony do IN_TRANSIT/VALID z eventem
ROUTE_REVALIDATED, bez zmiany ledgeru. Nie byla to reczna korekta produkcyjnej
bazy. Przed wznowieniem pracy wymagany jest restart API z nowym kodem.
Odbior pilota finansowego 20 intencji jest osobna bramka, nie zostaje
zamkniety przez te testy ani przez uzupelnienie PRD.

### 66.5. PUSH i aktualnosc karty Wydanie / Przyjecie (2026-10-11)

Powiadomienie o CJ i pelna lista zlecen maja odrebne role. PUSH moze
zawierac tylko identyfikator, status i kierunek; karta potrzebuje pelnego
odczytu HTTP, wraz z opakowaniami, wagami i manifestem. Powiadomienie i
projekcja tego samego eventu nadal wywoluja tylko jeden wspolny odczyt.

PUSH odebrany podczas GET uniewaznia odpowiedz tego GET. Starsza pusta
lista nie moze usunac nowo ogloszonego CJ. Jeden odczyt uzupelniajacy
obejmuje nowe zdarzenia i identyfikatory z odrzuconej odpowiedzi.

Kazdy rozpoznany event uruchamia najwyzej jedna probe odczytu. Odczyt
ma limit 10 sekund i abort, ale blad lub timeout nie uruchamia retry.
Blad pozostaje widoczny. Duplikat tego samego eventu, powrot do karty,
focus okna i odzyskanie sieci nie ponawiaja nieudanej proby. Nowy event,
jawna akcja odczytu lub reconnect SSE moga uruchomic nowy odczyt.
Odczyt uzupelniajacy po nowym PUSH podczas GET obsluguje nowe zdarzenie,
nie jest ponowieniem po bledzie. Nie ma cyklicznego odpytywania listy.

Zmiana sesji, huba lub odmontowanie aplikacji usuwa wlasciciela odczytu,
anuluje HTTP. Stara odpowiedz nie moze zmienic
nowej sesji. Nie dodano tabeli, pollingu ani zmian zapisu finansowego.
Regresja przegladarkowa dla AA -> DA obejmuje spozniona pusta liste,
blad GET bez retry, pelna karte z workiem po nowym PUSH na desktopie
i telefonie; HTTP/SSE w tym tescie sa symulowane, nie zmieniaja roboczej DB.

### 66.6. Uzgadnianie PUSH z odczytami Hub i Client App (2026-10-11)

PUSH nie zawsze zawiera pelny rekord. Numer zdarzenia SSE nie jest wersja
rekordu biznesowego. Pelny HTTP zlecenia o tej samej wersji moze uzupelnic
opakowania i manifest mimo braku `event_id`; zachowuje ostatni kursor
PUSH. Starsza wersja HTTP nie nadpisuje nowszego zlecenia. Dotyczy to
takze odczytu szczegolow uruchamianego pomocniczo po powiadomieniu CJ.

Odczyty zasobow finansowych klienta, kontekstu huba, statusu platnosci,
wymiany gotowki i blokad odbioru maja limit 10 sekund oraz AbortSignal.
Timeout zwalnia zajetego wlasciciela odczytu i pokazuje blad, ale nie
uruchamia ponowienia. Nie dodajemy pollingu. Nowy sygnal podczas GET
uniewaznia jego snapshot i kolejkuje jeden odczyt aktualnego stanu;
nie jest to retry po bledzie. Zakonczenie sesji lub odmontowanie
wlasciciela uniewaznia i anuluje jego niedokonczone odczyty. Nawet
transport ignorujacy abort nie moze pozniej opublikowac starego wyniku.

Modal tworzenia platnosci nasluchuje od otwarcia, nie dopiero po POST.
Wczesne aktualizacje przechowuje w ograniczonym buforze w pamieci,
wedlug `intent_id`. Po POST stosuje aktualizacje pasujaca do otrzymanej
intencji. Starszy GET/PUSH nie cofa stanu koncowego do oczekiwania ani
autoryzacji do wczesniejszego etapu. Aktualizacje polaczenia nadal sa
obslugiwane. Wyjscie z modala uniewaznia tez spozniona odpowiedz POST.
Nie zmieniamy komend platnosci, autoryzacji ani zasad rozliczen ledgeru.

Zakonczenie wymiany gotowki przez PUSH anuluje oczekujacy GET statusu.
Stary snapshot nie przywraca zakonczonej intencji, a powtorzony komunikat
koncowy nie wywoluje drugi raz akcji zakonczenia. Ochrona zakonczonych
identyfikatorow jest ograniczona i przechowywana tylko w pamieci panelu.

Lista blokad odbioru odswieza sie po `pickup_auth_update`, `finance_ready`
i `client_stream_reset`. Nie traci zatem zmian zaszlych podczas przerwy
SSE. Odpowiedzi sa przypisane do aktualnej sesji i generacji odczytu;
GET rozpoczetym przed nowszym PUSH nie wolno przywrocic starej blokady.
Blad jest widoczny w panelu powiadomien, bez automatycznej petli retry.

Testy obejmuja terminalny PUSH przed odpowiedzia POST, status po
reconnect, spozniony GET wymiany gotowki, blokady odbioru po reconnect
i resecie oraz timeout bez retry. Regresje prawdziwych komponentow React
w StrictMode wykonujemy na desktopie i telefonie z symulowanym HTTP/SSE.
Nie dodano tabel ani zmian backendowego zapisu finansowego.

Dowody z 2026-10-11: pelny pytest 6941 PASS, regresja finansowa 664 PASS,
Hub App 279 i Client App 261 testow JS PASS, oba buildy PASS, regresje
przegladarkowe Hub/Client na desktopie i telefonie PASS. Testy Python
korzystaly z niezaleznych kopii SQLite utworzonych przez backup ze zrodla
`mode=ro`; testy HTTP/SSE przegladarki byly symulowane. Audyt kopii DB:
ledger, podpisy, rezerwacje i reguly biznesowe PASS. Bramka pilota na
sprawdzonej kopii pozostala FAIL jedynie przez 17 intencji wobec wymaganych
20; progu nie obnizano ani nie dopisywano sztucznych intencji.
