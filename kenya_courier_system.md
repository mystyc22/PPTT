# System Kurierski dla Nairobi - Podsumowanie Planowania



## Historia Kluczowych Decyzji



Ta sekcja dokumentuje **dlaczego** podjęliśmy pewne decyzje i jakie alternatywy odrzuciliśmy.



### Dlaczego NIE ma centralnego HUB-a?



**Początkowa koncepcja:**

- Rozważaliśmy hierarchię: HUB główny -> HUB strefowy -> pod-strefy

- Przykład: "HUB 2.3" = północny-wschód w strefie północnej

- System zagnieżdżony (HUB 5 -> HUB 2 -> HUB 2.3 -> punkt końcowy)



**Dlaczego odrzucone:**

- Za skomplikowane dla małych sklepów/fryzjerów

- Punkty to NIE wyspecjalizowane sortownie z maszynami

- Trudne do zarządzania i skalowania

- Hierarchia tworzy single points of failure



**Finalna decyzja:**

- **Płaska sieć równorzędnych punktów**

- Każdy punkt to mały sklep/restauracja/fryzjer

- Jeśli punkt ma duży ruch -> powstaje drugi obok (organiczne rozrastanie)

- Brak głównego HUB-a = brak wąskiego gardła



---



### Dlaczego max 9 kierunków w sortowni?



**Rozważane opcje:**

- Dzielić na wszystkie punkty (teoretycznie możliwe)

- 12-15 kierunków (więcej opcji routingu)

- 9 kierunków (siatka 3×3, pomijając środek)



**Dlaczego 9:**

- **Ludzie sortują, nie maszyny** - więcej worków = więcej pomyłek

- 9 to granica gdzie człowiek nie gubi się

- Punkty z większym ruchem mogą mieć więcej, ale to wyjątek

- Worki muszą być łatwe do identyfikacji (numery 2-9)



**Ale:** Liczba nie jest sztywna - w praktyce może być 8-12 w zależności od punktu



---



### Dlaczego przepakowanie ma być minimalne?



**Problem:**

- Początkowo myśleliśmy: każdy punkt otwiera worek, sortuje, pakuje na nowo

- To standard w tradycyjnych sortowniach



**Dlaczego to źle dla nas:**

- **Każde otwarcie worka = ryzyko błędu**

- Ludzie (nie maszyny) mogą pomylić paczki

- Dodatkowy czas = wolniejsza dostawa

- Punkty to małe sklepy - nie mają czasu na przepakowania



**Rozwiązanie:**

- **Inteligentne pakowanie** - tagi NFC mówią "otwórz" lub "przekładaj"

- Worek otwierany tylko gdy kod się ZMIENIA

- System projektuje worki z myślą o minimalizacji przepakowań

- "Dziel tylko gdy oszczędzasz pracę"



---



### Dlaczego kody tras (4.4.5) a nie bezpośrednie adresy?



**Alternatywa:**

- Każda paczka ma adres końcowy

- System GPS wyznacza trasę

- Punkty muszą wiedzieć dokładne lokalizacje



**Dlaczego odrzucone:**

- Kiepski internet w Nairobi

- Nie wszyscy mają smartfony z GPS

- Adresy w Nairobi chaotyczne (brak numeracji ulic)

- Za złożone dla małych punktów



**Dlaczego kody kierunkowe:**

- **Prosty system relatywny** - każdy punkt zna swoich 8 sąsiadów

- Działa offline (kod 9 = południowy-wschód)

- Nie wymaga map ani GPS

- Łatwo skalować (dodanie punktu = aktualizacja sąsiadów)



---



### Dlaczego "dziel worki wcześniej" ma próg (10-25 paczek)?



**Początkowa koncepcja:**

- Zawsze dzielić jak najwcześniej (maksymalna optymalizacja)

- Lub: nigdy nie dzielić (minimalizacja pracy punktów)



**Problem z "zawsze dziel":**

- 98 paczek kierunek A + 2 paczki kierunek B

- Tworzenie osobnego worka dla 2 paczek = nieekonomiczne

- Transport 2 worków droższy niż praca sortowni



**Problem z "nigdy nie dziel":**

- 50 paczek kierunek A + 50 paczek kierunek B

- Punkt musi otworzyć, przesortować

- Zbędna praca gdy można było podzielić wcześniej



**Złoty środek - próg:**

- Dziel tylko gdy **obie grupy duże** (>10-25 paczek)

- Dziel tylko gdy **oszczędzasz pracę** w następnym punkcie

- Jeśli mała grupa (<10) -> wysłać razem, punkt podzieli



**Dokładny próg:** Do ustalenia empirycznie (testy w terenie)



---



### Dlaczego system aukcji zamiast stałych stawek?



**Alternatywy:**

- Stałe stawki (100 KES za km)

- Taryfa taksówkowa (licznik)

- Negocjacje 1-on-1 (kurier vs nadawca)



**Dlaczego aukcja dynamiczna:**

- **Kurierzy pracują na zlecenie** - nie mamy kontroli nad podażą

- Stawki muszą się dostosować do popytu/podaży

- Ruchliwa trasa (dużo kurierów) = niższe ceny

- Trudna trasa (mało kurierów) = wyższe ceny

- System uczy się i optymalizuje



**Problem do rozwiązania:**

- Jak zbalansować by jeden kurier nie brał wszystkiego?

- Jak subsydiować deficytowe trasy?

- Szczegóły mechanizmu aukcji (timing, przelicytowanie)



---



### Dlaczego marker zamiast drukarek?



**Problem:**

- Chcieliśmy QR kody dla każdej paczki

- Wymaga drukarek w każdym punkcie



**Realia Nairobi:**

- Problemy z drukarkami (awarie, brak tuszu, prąd)

- Kosztowne dla małych sklepów

- Wolne (drukowanie zwleka nadanie)



**Rozwiązanie - marker:**

- Pracownik pisze kod markerem na paczce

- NFC tag wielokrotnego użytku (przyklejany)

- QR kod opcjonalny (dla tych co mają telefon)

- **Inteligentne wpisywanie** - wystarczy 2-4 litery, system podpowiada



---



### Dlaczego koszt dla nadawcy się NIE zmienia po nadaniu?



**Pytanie:**

- System zmienia trasę dynamicznie (P1->P5->P6 na P1->P2->P6)

- Czy nadawca płaci więcej za dłuższą trasę?



**Decyzja: NIE**



**Dlaczego:**

- **Nadawca płaci za rezultat** (dostawa A->B), nie za proces

- Zmiany tras to wewnętrzna optymalizacja systemu

- Chroni nadawcę przed nieprzewidywalnymi kosztami

- System balansuje koszty wewnętrznie (prowizje, subsydia)



**Wyjątek:**

- Nadawca SAM dopłaca (chce przyspieszyć) -> wtedy tak, płaci więcej

- Ale system nie podnosi ceny automatycznie



---



### Dlaczego brak weryfikacji tożsamości przy odbiorze?



**Pytanie:**

- Jak zapobiec kradzieży? Ktoś podsłucha kod i odbierze paczkę



**Rozważane opcje:**

- Dowód osobisty + kod

- Numer telefonu + SMS

- Zdjęcie odbiorcy

- Biometria



**Decyzja: Tylko kod**



**Dlaczego:**

- **Prostota** - małe sklepy nie mają czasu na weryfikacje

- Brak infrastruktury (czytniki, bazy danych)

- Kiepski internet (nie da się sprawdzić online)

- **Akceptowalne ryzyko** - nadawca może wysłać kod dopiero gdy odbiorca jest w punkcie



**Przyszłość:**

- Może: opcja "odbiór z dowodem" (płatne, dla wartościowych paczek)

- Może: PIN dodatkowo (generowany przy nadaniu)



---



### Dlaczego płaska sieć zamiast klasycznego hub-and-spoke?



**Klasyczny model (hub-and-spoke):**

```

Wszystkie paczki -> HUB centralny -> sortowanie -> dystrybuacja

```

**Plusy:** Efektywne sortowanie, łatwe zarządzanie

**Minusy:** Wąskie gardło, wymaga infrastruktury



**Nasz model (mesh network):**

```

Punkt -> Punkt -> Punkt -> Punkt (każdy sortuje lokalnie)

```

**Plusy:** Skalowalne, odporne na awarie, organiczne

**Minusy:** Więcej przepakowań (ale minimalizujemy przez inteligentne worki)



**Dlaczego wybraliśmy mesh:**

- Brak kapitału na centralną sortownię

- Nairobi = rozproszone, korki (HUB centralny byłby bottleneck)

- Chcemy małe punkty (sklepy) nie wielkie magazyny

- Model rośnie organicznie (dodanie punktu = update sąsiadów)



---



### Dlaczego priorytet dla kuriera który już jedzie?



**Scenariusz:**

- Kurier zarezerwował A->B, w drodze

- Nowa paczka A->B dochodzi do punktu A

- Pytanie: Czy dać temu samemu kurierowi?



**Decyzja: TAK (z opcją odmowy)**



**Dlaczego:**

- **Oszczędność** - nie czekać na drugiego kuriera

- Kurier i tak jedzie, dodatkowa paczka = bonus

- Szybsza dostawa dla nadawcy



**Ale:** Kurier może odmówić (brak miejsca, pasażer na motocyklu)



**Alternatywa odrzucona:**

- Każda paczka osobna aukcja

- Wydłużałoby czas dostawy, więcej kurierów potrzebnych



---



### Dlaczego czas dostawy NIE jest priorytetem?



**Pytanie:**

- Dlaczego list może iść 5 dni na 10 km?



**Kontekst Nairobi:**

- Brak infrastruktury pocztowej

- Ludzie przyzwyczajeni że nie ma dostaw

- **Priorytet: żeby w ogóle działało** i było tanie



**Filozofia:**

- **Ekonomia > Szybkość**

- Nadawca wie że tanio = wolno

- Opcja express dla pilnych (drożej)

- System optymalizuje koszt, nie czas



**Z czasem:**

- Jak sieć się rozwinie -> będzie szybciej naturalnie

- Więcej punktów = krótsze trasy

---



### Dlaczego Magnetyzm Kierunkowy (Sektorowy) a nie punktowy?



**Początkowa koncepcja:**

- Bonus za konsolidację (magnetyzm) naliczany tylko jeśli inna paczka w hubie A jedzie dokładnie do tego samego huba B.



**Problem:**

- Zbyt rzadkie występowanie bonusu. Jeśli paczka 1 jedzie P4 -> A1 -> P5, a paczka 2 jedzie P4 -> A1 -> P3, to system nie widział konsolidacji na pierwszym odcinku (P4->A1), mimo że obie paczki "chcą" jechać na północ.



**Decyzja: Magnetyzm Kierunkowy (Sektory)**

- Bonus naliczany, jeśli paczka jedzie w tym samym **sektorze** (kierunku) co inne zasoby w sieci.

- Każdy hub sprawdza swoich 8 sektorów geograficznych.

- Jeśli kurier i tak jedzie na Północ (sektor 1), to każda paczka "północna" dostaje rabat (-80 VKES).



**Zaleta:**

- Tworzenie "autostrad" i naturalnych potoków transportowych.

- System samoczynnie dąży do łączenia paczek w większe grupy, nawet jeśli ich cele końcowe są różne, o ile leżą w tym samym kierunku.



---



### Dlaczego Magnetyzm 2.0 (B-magnetyczna) i alternatywne korytarze?



**Problem:**

Standardowa logika (A) szukała magnetyzmu tylko na trasie najkrótszej. Jeśli obok, w sąsiednim sektorze, istniała już "autostrada" (worki w transporcie), system jej nie widział, mimo że mogła być ekonomicznie lepsza dla sieci.



**Decyzja:**

Wprowadzenie **Logiki B (Magnetyzm 2.0)**, która:

1. Sprawdza, czy cel leży bliżej lewej czy prawej granicy obecnego sektora.

2. Wyznacza trasę alternatywną przez ten sąsiedni sektor.

3. Teoretycznie "zeruje" koszty odcinków, na których już jadą odpowiednie worki.

4. Wybiera alternatywę, jeśli jej teoretyczny koszt jest niższy od standardu.



**Zaleta:**

System aktywnie "zasysa" paczki do istniejących korytarzy transportowych, zamiast wysyłać kurierów na puste, nowe trasy tylko dlatego, że są o 1 km krótsze.



---



### Dlaczego zysk z optymalizacji (Skip Profit) trafia do kuriera?



**Początkowa koncepcja:**

- Oszczędność z ominiętego huba (50 KES) trafiała do "Firmy" (Systemu) jako zysk z optymalizacji.



**Decyzja: Zmiana na bonus dla kuriera**

- Całość zaoszczędzonej prowizji ominiętego huba trafia bezpośrednio do portfela `vkes_balance` kuriera.



**Dlaczego:**

- **Motywacja**: Kurierzy sami szukają skrótów i optymalnych dróg.

- **Nagroda za spryt**: To kurier ryzykuje i wkłada wysiłek w omijanie zatorów (np. hub A1 jest zapchany).

- **Zasada win-win**: System ma mniej przeładowań (paczka bezpieczniejsza), a kurier zarabia więcej przy tym samym dystansie.



---



### Dlaczego Audyt Finansowy jest osobnym modułem?



**Decyzja: Eksternalizacja audytu do `financial_audit.py`**



**Dlaczego:**

- **Single Source of Truth**: Logika sprawdzania, czy system "nie gubi pieniędzy", musi być nienaruszalna i łatwa do weryfikacji. 

- **Czystość kodu**: Główny plik logiki (`courier_logic_poc.py`) stał się zbyt duży. Audyt to funkcja nadzorcza, nie operacyjna.

- **Bezpieczeństwo**: Łatwiej audytować samą funkcję audytującą, gdy jest odizolowana od skomplikowanych algorytmów routingu.

### Dlaczego Logowanie Strukturalne (JSON) zamiast Printów?



**Problem:**

- Klasyczne `print()` zaśmiecają konsolę i uniemożliwiają łatwe filtrowanie.

- Frontend React (SSE) nie potrafi "zrozumieć" zwykłego tekstu, co prowadzi do błędów parsowania.



**Decyzja: Przejście na `log()` i format JSON**

- Wprowadzono funkcję `log(message, data, level)`, która produkuje maszynowo czytelny JSON.

- **LOG_MODE**: Możliwość przełączenia całego systemu w tryb "silent" (dla Flaska) lub "json".



**Zaleta:**

- Systemy zewnętrzne (frontend, audyt, analityka) mogą w czasie rzeczywistym konsumować logi bez ryzyka craszu.

- Łatwiejsze debugowanie trudnych błędów (wyścigi, błędy stanowe) dzięki metadanym w logach.



---



### Dlaczego Stabilność i Concurrency (Thread-safety) są priorytetem?



**Problem:**

- Serwer Flask jest wielowątkowy. Gdy jeden wątek (SSE) czyta dane, a drugi (API) je modyfikuje, Python wyrzuca `RuntimeError: dictionary/list changed size during iteration`.



**Rozwiązanie:**

- **Snapshots**: Wszystkie iteracje po kolekcjach w metodach `.to_dict()` są owijane w `list()`, co tworzy bezpieczną kopię danych do odczytu.

- **Globalne przechwytywanie błędów**: Flask serwer posiada `handle_exception`, który zapisuje każdy crash do `crash.log`.



**Zaleta:**

- System nie "zdycha" przy dużym ruchu na froncie. 

- Nawet jeśli wystąpi błąd, mamy pełny traceback w logu, co pozwala na naprawę bez zgadywania.



---



### Zysk Systemu (Company Profit) - Logika v3.0



**Zasada:**

Wszystkie oszczędności wynikające z optymalizacji trasy i decyzji topologicznych trafiają do portfela Firmy (`total_optimization_savings`).



**Detale:**

- **Skip Profit**: Jeśli kurier ominie huba (przeskok bezpośredni), zarezerwowana opłata za ten hub (50 VKES) zostaje wycofana z budżetu paczki i trafia do Firmy. Kurier otrzymuje standardową zapłatę za przejechane kilometry.

- **Transit Bonus**: Jeśli paczka przejeżdża przez hub w zaplombowanym worku (tranzyt bez otwierania), różnica między standardową prowizją a niską opłatą za przeładunek (10 VKES) stanowi zysk Firmy.

- **Dlaczego?** Firma jest właścicielem algorytmu optymalizacji i infrastruktury. Zysk z "matematyki" trasy pozwala na utrzymanie serwerów i subsydiowanie trudnych odcinków, gdzie budżet paczki mógłby nie starczyć na opłacenie kuriera.



**Zasada zachowania:**

Jeśli trasa teoretyczna przewiduje 3 huby, a kurier odwiedzi tylko 1 (pominie 2), to prowizja za te 2 ominięte huby (100 VKES) trafia do portfela `_company_profit`. Kurier zarabia na czystym dystansie.



---



### Dlaczego UI v4 przeniosło tooltipy z Canvas do HTML Overlay?



**Problem:**

Tooltipy rysowane bezpośrednio na canvasie były statyczne, nieklikalne i ulegały rozmazaniu. Trudno w nich było umieścić tabele czy animowane listy.



**Decyzja:**

- **Hybrid UI**: Logika animacji (krążące worki, trasy) zostaje na Canvas (płynność). Detale (HubCard, BagPopup) to HTML Overlay (flexbox, CSS, interaktywność).

- **Zasada**: Najechanie na element canvasa (Hub, Bag) aktywuje stan w React, który pozycjonuje "pływający" `div` nad mapą.



---



### Dlaczego wprowadzono archiwum BAG zamiast logów konsoli?



**Problem:**

Śledzenie losów doręczonych paczek w konsoli tekstowej było niemożliwe przy dużym ruchu. Historia znikała przy odświeżeniu strony.



**Decyzja:**

Wprowadzenie dedykowanego panelu `ðŸ› BAG` (Archiwum), który:

1. Przechowuje pełny `tracking_history` każdej paczki od pierwszego nadania (L001).

2. Pozwala na audyt finansowy (payment_history) po fakcie.

3. Daje operatorowi dowód doręczenia (delivered_at).



---



### Architektura Serwera FLASK (Hybrid Communication)



**Koncepcja:**

Serwer Flask (v5.0) nie jest zwykłym API. To "State Synchronizer" działający w dwóch trybach jednocześnie:



1. **SSE (Server-Sent Events)**: Jednokierunkowy strumień zdarzeń (`parcel_moved`, `hub_update`, itp.). Frontend dostaje powiadomienie natychmiast po zmianie w Core Engine.

2. **HTTTP JSON API**: Giełda zleceń (`/api/jobs`) i akcje kuriera (`/api/apply_job`) odbywają się klasycznie. Frontend odpytuje o giełdę (polling) lub reaguje na eventy SSE.



**Dlaczego tak?**

- SSE jest lżejsze niż WebSockety i łatwiejsze w debugowaniu.

- Pozwala zachować "reaktywność" mapy bez przeładowywania całej aplikacji.



---



### Lokalizacja i Warunki

- **Miejsce**: Nairobi, Kenya

- **Problem**: Brak funkcjonującej infrastruktury pocztowej

- **Ograniczenia techniczne**: 

  - Kiepski internet

  - Problemy z drukarkami

  - Ograniczone zasoby technologiczne



### Cel Biznesowy

- Nie nastawienie na zysk, ale **nie może być strata**

- Priorytet: **cena i ekonomia** (nie szybkość dostawy)

- List może iść 5 dni na 10 km - to akceptowalne

- Nadawca i odbiorca muszą być o tym poinformowani



---



## Model Operacyjny



### Struktura Sieci

- **Bez centralnej sortowni**

- Sieć punktów odbioru/nadania w **małych sklepach** wokół Nairobi

- Każdy punkt = mini-sortownia

- Małe sklepy (nawet 5 klientów/dzień) mogą przystąpić - dodatkowy dochód



### Transport

- **Kurierzy**: motocykle (boda-boda) i taksówki

- Kurierzy pracują **na zlecenie** (nie zatrudnieni)

- Praktycznie tylko prywatny transport

- System **giełdy transportowej** z dynamicznym pricingiem



---



## System Worków i Sortowania



### Zasady Workowania

- **Max 9 kierunków jednocześnie** = 9 otwartych worków w punkcie

- Więcej worków = ryzyko pomyłek przy sortowaniu

- Jeden worek = jeden punkt docelowy

- **Brak podziału standard/priority** - wszystkie paczki równe, różnią się tylko ceną



### Zamykanie Worków

- **Kurier zamyka worek** poprzez rezerwację

- Może jechać z 1 paczką lub 50 - jego decyzja

- Jeśli po rezerwacji ktoś nada kolejną paczkę do tego samego punktu -> dodaje do worka przed przyjazdem kuriera

- Gdy worek pełny -> sklep zamyka, otwiera nowy do tego samego kierunku



### Zarządzanie Stanem Worka (Mapa vs Terminal)



**Zasada Rozdzielności Interfejsów:**



1. **Wizualizacja (Mapa/React):**

   - Stan **Aktywny (Active)** jest niezbędny i przydatny. Pozwala na wizualną kontrolę "celownika" dla paczek (niebieska poświata). Ułatwia szybką orientację, gdzie aktualnie trafia towar.

   

2. **Terminal (CLI/Python):**

   - **BEZWZGLĘDNY ZAKAZ AUTOMATYZACJI** przy wyborze pojemnika. Jeśli w punkcie znajduje się więcej niż jedna otwarta jednostka (worek/skrzynka PKG) do tego samego celu, system **musi zapytać operatora o wybór za każdym razem**. 

   - Automatyczny wybór "aktywnego" worka w terminalu jest niedozwolony, ponieważ drastycznie zwiększa ryzyko pomyłki fizycznej (włożenie paczki do innego worka niż wskazał system bez świadomej decyzji człowieka).



3. **Stan Zaplombowany (Sealed):**

   - Zaplombowanie to sygnał: **"Nie pytaj mnie więcej o ten worek"**. 

   - System całkowicie wyklucza zaplombowane jednostki z listy wybieralnej. Zmniejsza to liczbę opcji i eliminuje ryzyko pomyłkowego "dołożenia" paczki do transportu, który jest już gotowy do drogi.



### Rotacja Worków

- ⚠️ **Problem do rozwiązania**

- Worki będą wielokrotnego użytku

- Trzeba wymyślić system wymiany/zwrotu worków

- Prawdopodobnie kilka opcji + monitoring zużycia



---



## System Kodowania i Identyfikacji



### Technologie

- **NFC tagi**: Wielokrotnego użytku, nie zużywają się

- **QR kody**: Dla osób z telefonem

- **Marker**: Główna metoda - kod pisany markerem

- **Krótkie kody**: 2-3 literki wystarczą (np. "A47K")



### Inteligentne Wpisywanie

- System rozpoznaje kod nawet z częściowych liter

- Jeśli "QR3" to wystarczy

- Jeśli kolizja -> system poprosi o więcej liter

- Bardzo mało prawdopodobne duplikaty w jednym worku



### Urządzenia w Sklepie

- **Podstawa**: komórka

- Możliwość dostarczenia lepszego sprzętu

- Skanowanie: kamera telefonu lub czytnik NFC

- ⚠️ **System łączności do rozwiązania** (offline/online mode)



---



## Proces Sortowania w Punkcie



### Przyjęcie Przesyłki od Kuriera

```

1. Kurier przywozi worek

2. Pracownik skanuje WOREK (nie zawartość)

3. System: "Worek #347 z Punktu A, ~50 listów"

4. Kurier zwalnia się z odpowiedzialności, zostawia worek, odjeżdża

5. Worek czeka na przepakowanie

```



### Sortowanie - Praktyczne Zastosowanie Kierunków



**W każdym punkcie sortowni:**



Punkt ma **8 worków otwartych jednocześnie** (lub mniej, jeśli nie wszystkie kierunki aktywne):



```

Punkt P5 ma worki:

[1]  - Północ-Północny-Wschód (0-45°)

[2]  - Północny-Wschód-Wschód (45-90°)

[4]  - Wschód-Południowy-Wschód (90-135°)

[5]  - Południowy-Wschód-Południe (135-180°)

[7]  - Południe-Południowy-Zachód (180-225°)

[8]  - Południowy-Zachód-Zachód (225-270°)

[10] - Zachód-Północny-Zachód (270-315°)

[11] - Północny-Zachód-Północ (315-360°)

```



**Proces sortowania:**



1. Pracownik skanuje paczkę

2. System pokazuje: **"WOREK [4]"**

3. Pracownik wkłada do worka oznaczonego **[4]**

4. System pamięta: "paczka w worku [4], na górze"

5. **Logistics Command Center**: System generuje jawne komendy dla pracownika Hubu, eliminując potrzebę domysłów:

    - **[OTWÓRZ WOREK]**: Worek musi zostać otwarty (paczki mają różne trasy lub dotarły do celu).

    - **[PRZESUŃ WOREK]**: "Przerzut" - przekładaj worek bez otwierania do kolejnego sektora.

    - **[ZMIANA KIERUNKU]**: Flaga informująca o dynamicznej zmianie trasy przez silnik ekonomiczny.



**Etykieta worka:**

```

WOREK [4]

Kierunek: Wschód-Południowy-Wschód (90-135°)

Zawiera: 23 paczki

Do punktów: P7, P9, P6 (przykład)

```



**Zamknięcie worka:**

- Kurier rezerwuje -> worek się zamyka

- Tag NFC na worku zawiera:

  - Numer worka

  - Kierunek [4]

  - Lista paczek (ID)

  - Kod trasy każdej paczki (np. 4.4.5)

```

1. Pracownik skanuje paczkę (QR/NFC) lub wpisuje kod z markera

2. System wyświetla: "WOREK B" (informacja ogólna)

3. System pokazuje szczegóły: "2 paczki do B, 5 do D"

4. Pracownik wkłada do właściwego worka

5. System pamięta kolejność pakowania (góra/dół worka)

```



### Pomoc przy Przepakowaniu

- System podpowiada: "prawdopodobnie 2 paczki na górze worka"

- Jeśli znajdzie od razu -> może oznaczyć resztę jako "całość, inny kierunek"

- Jeśli nie znajdzie -> musi skanować wszystkie

- **Tylko sugestia**, paczki mogą się przesunąć podczas transportu



### Weryfikacja Kompletności

- **Nie sprawdza się zawartości** przy odbiorze worka (za dużo czasu)

- Braki wychodzą dopiero przy przepakowaniu

- **Akceptowalne ryzyko** - paczki mogą ginąć

- Trzeba się z tym liczyć w modelu biznesowym



---



## Giełda Transportowa - Mechanizm



### Jak Kurier Widzi Zlecenia

```

ðŸ“ Punkt A -> Punkt B (8 km)

ðŸ“¦ 3 paczki (łącznie 5 kg)  

ðŸ’° 250 KES



[WEŹ ZLECENIE]



⬅️ Powr?t: Punkt B -> Punkt C (3 km po drodze)

ðŸ“¦ 2 paczki (3 kg)

ðŸ’° +150 KES

RAZEM: 400 KES za rundę

```



### Market Advisory (System Doradczy)



Giełda zleceń nie jest tylko pasywną listą. System aktywnie skanuje "horyzont" i ostrzega kurierów:



*   **[POCZEKAJ! Nadchodzi worek w tym samym kierunku]**: Wyświetlane, gdy silnik wykryje, że inny kurier jest właśnie w drodze do tego huba z paczkami w tym samym kierunku.

*   **Cel**: Zachęcenie kuriera do poczekania na "doładowanie" worka, co drastycznie zwiększa jego ZYSK (bonus za konsolidację) przy niemal tym samym koszcie paliwa.



### Agregacja Przesyłek

- **System automatycznie grupuje** paczki do tego samego punktu

- Sklep pakuje je do jednego worka "dla punktu B"

- Kurier widzi wielkość, wagę, cenę grupy

- Może wziąć ile chce (1 worek lub 10 worków)



### Dynamiczny Pricing

- Jeśli kurier czeka -> stawka rośnie (dochodzą kolejne paczki do grupy)

- **Ryzyko**: inny kurier może zabrać zlecenie

- Kurier może zaproponować własną cenę

- ⚠️ **Szczeg?ły pricingu = osobny temat**



### Express i Podbijanie Stawki

- **Będzie opcja express** za wyższą cenę

- **Dynamiczne podbijanie**: 

  - Paczka nie rusza się kilka dni

  - System/nadawca może podnieść stawkę

  - Nadawca może wrócić do punktu i dopłacić

  - System pomaga (nie oferuje całej stawki od razu)



### Rezerwacja

- Kurier rezerwuje zlecenie

- **Limit czasowy** (do ustalenia - 30 min? 1h?)

- Po timeout - stawka rośnie automatycznie?

- Rezerwacja zamyka worek w systemie



### Optymalizacja Tras

- System może podpowiadać: "Po drodze punkt X, +2 paczki, +100 KES?"

- **Nawigacja/planowanie tras**: prawdopodobnie niepotrzebne

- Kurierzy znają miasto lepiej (jeżdżą pod prąd na autostradzie zamiast 10 km objazd)

- Wystarczy **lista paczek po kolei** zamiast mapy



---



## Proces Nadania Paczki



### Scenariusz 1: Klient Ma Telefon/Internet

```

1. Klient w domu -> Aplikacja online

2. Wpisuje: wagę, gabaryty, cel, zawartość, punkt nadania, punkt odbioru

3. System wycenia i ustala trasę przez punkty pośrednie

4. Klient idzie do wybranego punktu z paczką

5. Punkt przyjmuje, waży, weryfikuje

6. Kod marker na paczce

```



### Scenariusz 2: Klient BEZ Telefonu

```

1. Klient idzie do punktu

2. Pracownik punktu wpisuje dane do systemu

3. System wycenia

4. Pracownik pisze kod markerem na paczce

5. Punkt przyjmuje paczkę

```



### Routing

- **Klient wybiera**: punkt nadania (najbliższy sklep) + punkt odbioru (blisko odbiorcy)

- **System układa trasę** między punktami (punkty pośrednie)

- Automatyczne wyznaczanie najlepszej drogi



### Rodzaje Przesyłek

- Różne opcje nadania: szkło, wielko gabarytowe, ciężkie

- Różne ceny w zależności od typu

- System uwzględnia to w wycenie



---



## Proces Odbioru Paczki



### Standardowy Odbiór

```

1. Klient przychodzi do punktu odbioru

2. Podaje kod (z markera/SMS/appki)

3. Punkt sprawdza system -> paczka jest

4. Wydaje paczkę klientowi

```



### Weryfikacja

- **Kod wystarczy** do odbioru

- Brak dodatkowej weryfikacji (dowód, telefon)

- ⚠️ **Ryzyko kradzieży kodu** = akceptowalne



### "Ostatni Punkt"

- System informuje punkt: "To ostatni punkt - WYDAĆ KLIENTOWI"

- Blokada dalszego przepakowania

- Paczka nie może jechać dalej

- Alert dla punktu: nie pakować, tylko wydać



---



## Płatności i Model "Budget-to-Zero"



System oparty jest na całkowitej transparentności i dystrybucji wszystkich środków transportowych do kurierów.



### Dystrybucja Funduszy

1.  **Cena całkowita**: Płacona przez nadawcę na starcie (10 KES/km + 50 KES/hub).

2.  **Reserved Hub Fees**: System rezerwuje po 50 KES dla każdego Hubu na trasie (Przeładunki + Meta).

3.  **Transport Budget**: Pozostała kwota to czysty budżet dla kurierów.

4.  **Zasada Zero**: Każda paczka musi mieć saldo dokładnie 0.0 KES po doręczeniu.



### Oszczędność = Bonus dla Kuriera

Jeśli kurier ominie zaplanowany Hub (np. jadąc bezpośrednio P2->P9 zamiast P2->P4->P9), zarezerwowana opłata dla ominiętego Hubu (50 KES) nie przepada, lecz jest automatycznie wypłacana kurierowi jako **Bonus za Skok (Skip Bonus)**. To motywuje kurierów do szukania najkrótszych, najsprawniejszych dróg.



### Audyt i Historia

Każda paczka posiada jawną historię transakcji, widoczną w panelu "Skanuj magazyny". Można sprawdzić dokładnie, ile pobrał każdy hub i każdy kurier na każdym etapie podróży.



### System Optimization Profit

System śledzi oszczędności wynikające z optymalizacji tras (np. gdy kurier pojedzie skrótem). Nadwyżka budżetu, która nie została skonsumowana przez kilometry, jest raportowana jako zysk platformy/systemu. Pozwala to na realną ocenę wydajności algorytmu `AssignmentEngine`.

### System Logowania Technicznego

System posiada centralną funkcję `log()`, która zastępuje `print()`. Pozwala to na:

- Wysyłanie strukturalnych danych do frontendu bez przerywania strumienia SSE.

- Logowanie do pliku `crash.log` w przypadku awarii serwera.

- Łatwe wyciszenie wszystkich komunikat?w w trybie produkcyjnym (`LOG_MODE = "silent"`).



---



### Ekonomika vs Realia Operacyjne (Debata)

Pojawia się dylemat: czy system powinien dążyć do maksymalnej konsolidacji za wszelką cenę?



1.  **Ryzyko Centralizacji**: Zbyt silne promowanie zysku z konsolidacji może "pchać" wszystkie paczki przez jeden centralny hub (np. A1), tworząc zatory (bottlenecks). To niszczy ideę sieci rozproszonej.

2.  **Ryzyko Przeładunków**: Każdy dodatkowy hub na trasie to statystycznie większa szansa na zgubienie lub uszkodzenie paczki. Skrócenie drogi (konsolidacja okrężna) może być ekonomicznie zyskowne, ale operacyjnie ryzykowne.

3.  **Złota Zasada**: "Mniej rąk dotyka paczki = bezpieczniejszy biznes". System musi balansować zysk finansowy z prostotą logistyczną.



### Rozważania o "Zysku Systemu"

Wprowadzenie wskaźnika **Zysku Platformy** jako KPI pozwoli na mierzenie efektywności, ale nie może być jedynym parametrem sterującym. Algorytm musi uwzględniać "karę za złożoność" (complexity penalty) dla każdej trasy z wieloma przeładunkami.



### Krytyczne (Brak Rozwiązania)

1. **Rotacja worków** - system wymiany, zwroty, zarządzanie opakowaniami

2. **System łączności** - offline/online mode, synchronizacja danych

3. **Szczegóły pricingu** - algorytmy, podwyżki, limity

4. **Płatności** - metody, timing, kryptowaluty



### Ważne (Częściowo Ustalone)

5. **Weryfikacja tożsamości** przy odbiorze - czy kod wystarczy?

6. **Odpowiedzialność za straty** - kto płaci za zginięte paczki?

7. **Limit czasowy rezerwacji** - ile kurier może trzymać rezerwację?



### Dodatkowe

8. **Strategia odbioru paczek od nadawców** - wspomniany jako "osobny temat, najbardziej rozbudowany"

9. **Monitoring paczek** - jak nadawca śledzi przesyłkę?

10. **Obsługa reklamacji** - co gdy paczka zaginie?



---



## Kluczowe Założenia Filozofii Systemu



1. **Prostota > Perfekcja** - system musi działać mimo ograniczeń

2. **Ekonomia > Szybkość** - tańsze, wolniejsze dostawy są OK

3. **Akceptacja ryzyka** - paczki mogą ginąć, to koszt biznesu

4. **Samoorganizacja** - kurierzy i punkty działają niezależnie

5. **Skalowalność** - zaczynamy od małej sieci wokół Nairobi

6. **Lokalność** - każdy punkt to przedsiębiorca zarabiający dodatkowo

7. **Technologia dopasowana do warunków** - marker zamiast drukarek, NFC jako backup



---



## Następne Kroki Do Omówienia



Priorytetowe tematy do dalszej dyskusji:

- [ ] Rotacja worków - konkretne rozwiązania

- [ ] System łączności offline/online

- [ ] Szczegóły dynamicznego pricingu

- [ ] Strategia odbioru paczek (wspomniany jako "najbardziej rozbudowany")

- [ ] Model płatności i kryptowaluty

- [ ] Monitoring i tracking przesyłek



---



## System Kodowania Paczek - Szczegóły



### Filozofia Kodów

- **Długość kodu nie ma znaczenia** - może być 20 liter

- Kod może zawierać: kierunek, hasło odbioru, checksum, inne dane

- Pracownik NIE musi wpisywać całego kodu



### Inteligentne Wpisywanie (jak EAN-13)

```

Kod pełny: KE-NBA-WS-047-X92K-PASS789 (20 znaków)



Pracownik wpisuje: "X92K" (4 znaki)

↓

System: ✅ "Worek B" (znalazł jedną paczkę)



LUB jeśli kolizja:



System: ⚠️ "2 paczki: X92K-A lub X92K-B - wybierz"  

Pracownik: dodaje literę -> "X92KA"

System: ✅ "Worek B"

```



### Offline Mode

- **QR kod zawiera pełne dane**

- Aplikacja może zdekodować bez internetu

- Działa jak kod kreskowy - autonomicznie

- NFC tag przechowuje więcej danych niż QR



### Technologie

- **Marker** - główna metoda (kod pisany markerem)

- **QR kod** - dla osób z telefonem, więcej danych

- **NFC tag** - wielokrotnego użytku, offline, dodatkowe dane



---



## Routing Dynamiczny - System Tras (ZAKTUALIZOWANY)



### Kluczowa Zmiana: Uniwersalny System Kierunków



**System oparty na kątach geograficznych (0-360°), nie na pozycji w siatce.**



Każdy punkt w sieci:

- Oblicza kąt do każdego innego punktu (GPS coordinates)

- Przypisuje do 8 sektorów ([1], [2], [4], [5], [7], [8], [10], [11])

- Sortuje paczki do worków według sektorów



**Uniwersalność:**

- Działa na dowolnym układzie punktów (regularny grid, chaotyczny rozkład)

- Niezależny od liczby punktów w sieci

- Jednoznaczny - ten sam kąt = ten sam kierunek zawsze



### Struktura Sieci - Siatka 9×9 (Przykład)



**Układ współrzędnych: (0,0) = dolny-lewy róg, Y rośnie na północ**



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



P1 (B7) - Mały sklep              (7.5, 32.5)

P2 (A3) - Fryzjer                 (2.5, 12.5)

P3 (C9) - Restauracja, średni ruch (12.5, 42.5)

P4 (D2) - Sklep spożywczy, duży ruch (17.5, 7.5)

P5 (E5) - Sklep, BARDZO duży ruch (22.5, 22.5)

P6 (F1) - Apteka                  (27.5, 2.5)

P7 (I7) - Sklep, średni ruch      (42.5, 32.5)

P8 (H1) - Punkt                   (37.5, 2.5)

P9 (G4) - Sklep, średni ruch      (32.5, 17.5)



Współrzędne: (x, y) w km, (0,0) = dolny-lewy róg

x = kolumna (A=2.5, B=7.5, ... I=42.5)

y = wiersz  (1=2.5, 2=7.5, ... 9=42.5)

```



### NIE MA Centralnego Hubu!

- **Płaska sieć równorzędnych punktów**

- Każdy punkt to mały sklep, restauracja, fryzjer (NIE wyspecjalizowana sortownia)

- Jeśli punkt ma duży ruch -> może powstać drugi punkt obok (odciążenie)

- Brak hierarchii, brak "głównego HUB-a"



### System Kodów Kierunkowych - UNIWERSALNY (Oparty na Kątach)



**KLUCZOWA ZMIANA:** Kierunki oparte na **kątach geograficznych**, nie pozycji w siatce!



**8 kierunków zgodnie ze wskazówkami zegara (od 0° = północ = 12:00):**



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



[1]  = 0° - 44.999...°    (0° należy do [1])

[2]  = 45° - 89.999...°   (45° należy do [2])

[4]  = 90° - 134.999...°  (90° należy do [4])

[5]  = 135° - 179.999...° (135° należy do [5])

[7]  = 180° - 224.999...° (180° należy do [7])

[8]  = 225° - 269.999...° (225° należy do [8])

[10] = 270° - 314.999...° (270° należy do [10])

[11] = 315° - 359.999...° (315° należy do [11])

```



**WAŻNE:** Granica sektora należy do sektora "w prawo" (zgodnie ze wskazówkami zegara).

- Przykład: 45° należy do sektora [2], nie [1]

- Przykład: 90° należy do sektora [4], nie [2]



**Zalety tego systemu:**

- ✅ **Uniwersalny** - działa na dowolnej siatce (3×3, 4×4, 5×5, 9×9)

- ✅ **Geograficzny** - oparty na rzeczywistych wsp?łrzędnych GPS

- ✅ **Sp?jny** - ten sam kierunek zawsze oznacza ten sam kąt

- ✅ **Niezależny od układu punktów** - nie ma znaczenia czy siatka regularna czy chaotyczna



**Jak obliczać kierunek (układ: (0,0)=dolny-lewy, Y rośnie na północ):**

```python

def oblicz_kierunek(punkt_start, punkt_cel):

    # Różnica współrzędnych

    dx = punkt_cel.x - punkt_start.x  # wschód = dodatni

    dy = punkt_cel.y - punkt_start.y  # północ = dodatni (Y rośnie w górę)



    # Oblicz kąt (0° = północ, zgodnie ze wskazówkami zegara)

    kat = atan2(dx, dy) * 180 / pi

    if kat < 0:

        kat += 360

    

    # Przypisz do sektora (granica należy do sektora "w prawo")

    if 0 <= kat < 45:

        return 1

    elif 45 <= kat < 90:      # 45° należy do [2]

        return 2

    elif 90 <= kat < 135:     # 90° należy do [4]

        return 4

    elif 135 <= kat < 180:    # 135° należy do [5]

        return 5

    elif 180 <= kat < 225:    # 180° należy do [7]

        return 7

    elif 225 <= kat < 270:    # 225° należy do [8]

        return 8

    elif 270 <= kat < 315:    # 270° należy do [10]

        return 10

    elif 315 <= kat < 360:    # 315° należy do [11]

        return 11

```



### Przykłady Zastosowania - Siatka 9×9 (Pole 5×5 km)



**Setup:** Każde pole = 5km × 5km, punkt w środku pola, **(0,0) = dolny-lewy róg**



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



Współrzędne: (x, y) w km, (0,0) = dolny-lewy róg, Y rośnie na północ

```



---



### Przykłady Obliczania Kierunków



**Wzór na kąt (układ: (0,0) = dolny-lewy, Y rośnie na północ):**

```

Î”x = cel.x - start.x  (wschód dodatni, zachód ujemny)

Î”y = cel.y - start.y  (północ dodatnia, południe ujemne)

kąt = atan2(Î”x, Î”y) w stopniach (0° = północ, zgodnie ze wskazówkami zegara)

```



---



**Przykład 1: P7 -> P5**

```

Start: P7 (42.5, 32.5)

Cel:   P5 (22.5, 22.5)



Î”x = 22.5 - 42.5 = -20.0 km (zachód)

Î”y = 22.5 - 32.5 = -10.0 km (południe)



Dystans = √(400 + 100) = 22.4 km



Kąt = atan2(-20, -10) ≈ 243.4?

243.4° mieści się w 225° - 269.999...°



Kierunek: [8] ✅ (zach?d-południowy-zachód)

```



---



**Przykład 2: P1 -> P7**

```

Start: P1 (7.5, 32.5)

Cel:   P7 (42.5, 32.5)



Î”x = 42.5 - 7.5 = +35.0 km (wschód)

Î”y = 32.5 - 32.5 = 0 km



Dystans = 35.0 km



Kąt = atan2(35, 0) = 90.0°

90° należy do [4] (90° - 134.999...°)



Kierunek: [4] ✅

```



---



**Przykład 3: P7 -> P4**

```

Start: P7 (42.5, 32.5)

Cel:   P4 (17.5, 7.5)



Î”x = 17.5 - 42.5 = -25.0 km (zachód)

Î”y = 7.5 - 32.5 = -25.0 km (południe)



Dystans = √(625 + 625) = 35.4 km



Kąt = atan2(-25, -25) = 225.0°

225° należy do [8] (225° - 269.999...°)



Kierunek: [8] ✅

```



---



**Przykład 4: P6 -> P8**

```

Start: P6 (27.5, 2.5)

Cel:   P8 (37.5, 2.5)



Î”x = 37.5 - 27.5 = +10.0 km (wschód)

Î”y = 2.5 - 2.5 = 0 km



Dystans = 10.0 km



Kąt = atan2(10, 0) = 90.0°

90° należy do [4]



Kierunek: [4] ✅

```



---



**Przykład 5: P8 -> P6**

```

Start: P8 (37.5, 2.5)

Cel:   P6 (27.5, 2.5)



Î”x = 27.5 - 37.5 = -10.0 km (zachód)

Î”y = 2.5 - 2.5 = 0 km



Dystans = 10.0 km



Kąt = atan2(-10, 0) = 270.0°

270° należy do [10] (270° - 314.999...°)



Kierunek: [10] ✅

```



---



### Pełne Trasy - Przykłady



**Trasa 1: P1 -> P8**

```

Możliwa trasa: P1 -> P5 -> P9 -> P8



P1 (7.5, 32.5) -> P5 (22.5, 22.5):

  Î”x = +15, Î”y = -10

  Kąt ≈ 123.7? -> Kierunek [4]



P5 (22.5, 22.5) -> P9 (32.5, 17.5):

  Î”x = +10, Î”y = -5

  Kąt ≈ 116.6? -> Kierunek [4]



P9 (32.5, 17.5) -> P8 (37.5, 2.5):

  Î”x = +5, Î”y = -15

  Kąt ≈ 161.6? -> Kierunek [5]



KOD TRASY: 4.4.5

```



---



**Trasa 2: P8 -> P6 -> P4 -> P2**

```

P8 (37.5, 2.5) -> P6 (27.5, 2.5):

  Î”x = -10, Î”y = 0

  Kąt = 270° -> Kierunek [10]



P6 (27.5, 2.5) -> P4 (17.5, 7.5):

  Î”x = -10, Î”y = +5

  Kąt ≈ 296.6? -> Kierunek [10]



P4 (17.5, 7.5) -> P2 (2.5, 12.5):

  Î”x = -15, Î”y = +5

  Kąt ≈ 288.4? -> Kierunek [10]



KOD TRASY: 10.10.10

```



---



### Jak System Używa Kodów Tras



**1. Sortowanie w punkcie nadania (P1):**

```

Paczka #123: P1 -> P8

System oblicza trasę: P1->P5->P9->P8, kod: 4.4.5

P1 sortuje do worka [4] (pierwszy kod w trasie)

```



**2. Przepakowanie w punkcie pośrednim (P5):**

```

Worek trafia do P5

P5 skanuje paczkę #123

Kod trasy: 4.4.5

P5 patrzy na drugi kod: [4]

P5 pakuje do worka [4] (do P9)

```



**3. Ostatni punkt przed celem (P9):**

```

Worek trafia do P9

P9 skanuje paczkę #123

Kod trasy: 4.4.5

P9 patrzy na trzeci kod: [5]

P9 pakuje do worka [5] (do P8 - cel końcowy)

```



### Przykład Tras: P1 -> P6



**Trasa 1: P1 -> P5 -> P9 -> P6**

```

KOD TRASY: 4.4.7



P1 (B7) sortuje:

- Kierunek [4] (wschód-południowy-wschód względem P1) -> worek do P5



P5 (E5) sortuje:

- Kierunek [4] (wschód-południowy-wschód względem P5) -> worek do P9



P9 (G4) sortuje:

- Kierunek [7] (południe-południowy-zachód względem P9) -> worek do P6

```



**Trasa 2: P1 -> P2 -> P4 -> P6**

```

KOD TRASY: 7.4.4



P1 (B7) -> P2 (A3): kierunek [7] (południe-południowy-zachód)

P2 (A3) -> P4 (D2): kierunek [4] (wschód-południowy-wschód)

P4 (D2) -> P6 (F1): kierunek [4] (wschód-południowy-wschód)

```



### Algorytm Routingu - Optymalizacja Dynamiczna



System **NIE wybiera tylko najkrótszej** trasy, ale optymalizuje według wielu czynników:



```

Czynniki uwzględniane:



1. Odległość (bazowa - algorytmy najkrótszej ścieżki)

2. Obciążenie punktów (P5 przeciążony 200 paczkami? -> omiń)

3. Dostępność kurierów (brak kurierów na P1->P5? -> wybierz P1->P2)

4. Łączenie przesyłek (w P9 czeka paczka z P7->P6? -> jedź przez P9, opłacalne)

5. Koszty transportu (która trasa tańsza)

6. Czas oczekiwania (P2 szybko sortuje vs P5 wolno)

7. Niezawodność (rating punktów - czy gubią paczki?)

8. Sytuacje losowe (nie pogoda w Kenii - zawsze słońce, ale np. parada, wypadek)

```



### Dynamiczna Zmiana Tras



**System może zmienić trasę w trakcie:**



```

Początkowy plan:

P1 -> P5 -> P9 -> P6 (4.4.7)

Koszt: 300 KES, Czas: 2 dni



System dostaje update:

- P5 przeciążony (200 paczek czeka)

- W P9 dodatkowa paczka z P7->P6 (opłaca się łączyć)



Nowy plan może być:

A) P1 -> P2 -> P4 -> P6 (7.4.4) - jeśli P5 zbyt wolny

B) Zachować 4.4.7 - jeśli łączenie w P9 daje oszczędność

```



**WAŻNE: Koszt dla nadawcy już nie ulega zmianie!**

- Nadawca płaci ustaloną cenę przy nadaniu

- System może zmienić trasę by zoptymalizować koszty wewnętrzne

- Nadawca widzi tylko aktualną trasę paczki (tracking)



### Zmiana Trasy - Gdzie i Kiedy?



**Przepakowanie raczej ODPADA:**

- Za dużo pracy

- Każde otwarcie worka = możliwy błąd (ludzie, nie maszyny)

- Zmiany następują dynamicznie **w następnym hubie** gdzie i tak jest przepakowanie



**Minimalizacja przepakowań = priorytet!**



---



## Inteligentne Pakowanie Worków - Optymalizacja Pracy



### Problem: Zbędne Przepakowania



**Scenariusz typowy (ŹLE):**

```

P1 ma 10 paczek do P6, wszystkie trasa 4.4.7



P1 pakuje -> Worek [4] (10 paczek)

↓

P5 dostaje worek [4]

-> OTWIERA

-> Wszystkie paczki mają kod [4] (dalej do P9)

-> PRZEPAKOWUJE do nowego worka [4]

= ZBĘDNA PRACA!

```



### Rozwiązanie: Pakowanie z Przewidywaniem



**Tag NFC na worku zawiera pełną trasę:**

```

Worek ID: #W12345

Trasa: P1 -> P5 -> P9 -> P6

Kod trasy: 4.4.7

Następny przystanek: P5

Kod dla następnego: [4] (do P9)

Zawartość: 10 paczek (lista ID)

```



**P5 skanuje worek:**

```

System: "Worek 4.4.7, następny kod: [4] (do P9)"

-> NIE OTWIERAJ

-> Przekładaj cały worek do kuriera P5->P9

```



**P9 skanuje worek:**

```

System: "Worek 4.4.7, kod zmienia się na [7] (do P6)"

-> MUSI OTWORZYĆ (kod się zmienia)

-> Przepakuj do worka [7]

```



### Reguła: Dziel Worki Wcześniej TYLKO Gdy Oszczędzasz Pracę



**Scenariusz 1: Opłaca się dzielić wcześniej**

```

P1 ma paczki do P6:

- 98 paczek: trasa 4.4.7 (P1->P5->P9->P6)

- 50 paczek: trasa 4.2.7 (P1->P5->P7->P6)



Analiza:

- Obie grupy zaczynają [4] z P1 (do P5)

- W P5 się rozchodzą (kod [4] do P9 vs [2] do P7)

- Grupa B duża (50 paczek = pełny worek)



Decyzja P1:

-> Pakuj 2 worki: "4.4" (98) i "4.2" (50)



P5 dostaje 2 worki:

-> NIE otwiera żadnego

-> Przekłada "4.4" dalej (do P9)

-> Przekłada "4.2" dalej (do P7)

= OSZCZĘDNOŚĆ PRACY

```



**Scenariusz 2: NIE dziel - nie ma sensu**

```

P1 ma paczki do P6:

- 98 paczek: trasa 4.4.7

- 2 paczki: trasa 4.2.7



Analiza:

- Grupa B mała (2 paczki = prawie pusty worek)

- Transport 2 worków zamiast 1 = drożej

- P5 i tak musi otworzyć (kody się rozchodzą)



Decyzja P1:

-> Pakuj 1 worek: [4] (100 paczek razem)



P5 dostaje 1 worek:

-> Otwiera (musi, kody się rozchodzą)

-> Dzieli na "4.4" (98) i "4.2" (2)

= P5 robi pracę, ale oszczędzamy transport

```



### Próg Decyzyjny - Kiedy Dzielić?



**System dzieli worki wcześniej tylko gdy spełnione WSZYSTKIE warunki:**



```

WARUNEK 1: Mniejsza grupa ≥ X paczek (pr?g: 10-25 paczek?)

WARUNEK 2: Tworzy co najmniej pół-pełny worek (>50% pojemności)

WARUNEK 3: Oszczędza pracę w następnym punkcie (punkt nie musi otwierać)



Przykład TAK:

- Grupa A: 98 paczek (pełny worek)

- Grupa B: 50 paczek (pełny worek)

-> DZIEL ✅ (P5 nie musi otwierać)



Przykład NIE:

- Grupa A: 98 paczek  

- Grupa B: 5 paczek (1/10 worka)

-> NIE DZIEL ❌ (transport 2 work?w droższy niż praca P5)

```



### Sytuacja Mieszana - Wiele Tras



**Przykład złożony:**

```

P1 ma do różnych celów:

- 60 paczek: 4.4.7 (rozchodzą się w P9 -> P6)

- 30 paczek: 4.4.8 (rozchodzą się w P9 -> P4)

- 20 paczek: 4.2.7 (rozchodzą się w P5 -> P7)



Opcje pakowania:



A) 3 worki: "4.4.7", "4.4.8", "4.2"

   -> Zbyt rozdrobnione, drogi transport



B) 2 worki: "4.4" (90 paczek), "4.2" (20)

   -> P5 przekłada oba bez otwierania

   -> P9 otwiera "4.4", dzieli na [7] i [8]

   -> OPTYMALNE ✅



C) 1 worek: [4] (110 paczek)

   -> P5 musi otworzyć, dzielić

   -> Więcej pracy

   -> Tylko jeśli grupa "4.2" < 10 paczek

```



**Zasada ogólna:**

Dziel na poziomie **pierwszego punktu rozbieżności**, ale tylko jeśli obie grupy wystarczająco duże (>10-25 paczek).



### Dynamiczna Zmiana vs Zamknięte Worki



**Pytanie:** Co jeśli P1 zaplanował worek "4.4.7", ale w P5 system zmienia trasę na "4.2.7"?



```

Worek już zamknięty, w transporcie:

-> Jedzie dalej do P5 według planu



P5 skanuje worek:

-> System: "ZMIANA TRASY - przekieruj do worka [2], nie [4]"

-> P5 musi otworzyć, przepakować do [2]

-> Nie da się uniknąć

```



**Ale:** System minimalizuje takie sytuacje:

- Zmiana tras dopiero w następnym punkcie (nie w trakcie transportu)

- Jeśli worek zamknięty -> raczej nie zmieniać (chyba że awaria punktu)



### Kluczowa Filozofia



> **"Dziel tylko gdy oszczędzasz pracę, nie gdy tworzysz dodatkową"**



- Każde otwarcie worka = ryzyko błędu

- Ludzie sortują, nie maszyny -> minimalizuj przepakowania

- Lepiej 1 worek z mieszanką niż 2 prawie puste worki

- Dziel tylko gdy OBE grupy uzasadniają osobny worek



---



## System Aukcji i Pricingu - Szczegóły (Do Dopracowania)



### Podstawowe Zasady



**Giełda Transportowa:**

- Kurierzy widzą zlecenia w swoim rejonie

- Widoczne: punkt A->B, liczba paczek, waga, gabaryty, cena

- Mogą czekać (stawka rośnie) lub brać od razu

- Ryzyko: inny kurier zabierze



**Dynamiczny Pricing:**

- System uczy się z historii ("za ile jeżdżą na trasie A->B")

- Cena startowa dostosowana do: pory dnia, dnia tygodnia, liczby kurierów, popytu

- BRAK podziału standard/priority - wszystkie równe, różne ceny



### Agregacja i Margines



**Przykład budowania zlecenia:**

```

Paczka 1 do worka A->B: wartość 100 KES

Paczka 2 dochodzi: wartość 80 KES

Paczka 3 dochodzi: wartość 120 KES

...

5 paczek razem: wartość 500 KES



System wystawia dla kurierów: 450 KES

Margines: 50 KES (na negocjacje + prowizja systemu)

```



**UWAGA:** Ceny paczek różne (od gabarytów, nie stałe po 100 KES)



**Dodanie kolejnej paczki:**

```

Paczka 6 dochodzi: wartość 100 KES

System NIE dodaje całych +100 do oferty kurierskiej

Dodaje tylko +20 -> zlecenie = 470 KES

Margines wzrasta do 130 KES

```



### Aukcja - Mechanizm (DO DOPRACOWANIA)



**Podstawowy Flow:**

```

1. System wystawia: 450 KES

2. Kurierzy obserwują

3. Nikt nie bierze -> po czasie system dodaje +30 -> 480 KES

4. "AUKCJA OTWARTA - 10 minut"

5. Kurier A: "Wezmę za 420 KES" ← WSZYSCY WIDZĄ

6. Czekamy 10 minut...

   - Nikt nie da mniej -> Kurier A WYGRYWA

   - Kurier B: "Wezmę za 400 KES" -> Reset timera, kolejne 10 min

```



**Transparentna licytacja w dół (aukcja holenderska)**



### Podbijanie Stawki przez Nadawcę



**Paczka nie rusza się:**

```

Dzień 1: Stawka 450 KES, nikt nie bierze

Dzień 2: System wysyła alert do nadawcy:

  "Twoja paczka nie ruszyła

  Obecna stawka: 480 KES

  Dopłać 50 KES -> dostawa szybciej?"



Nadawca dopłaca +100 KES

System MOŻE dodać tylko część (np. +50) do oferty kurierskiej

Reszta (+50) = prowizja/rezerwa na deficytowe trasy

```



**Nadawca ZAWSZE może podbić cenę** - nie odmawiamy pieniędzy!



### Express i Deficytowe Przejazdy



**Express:**

- Będzie opcja za wyższą cenę

- Gwarantuje szybszą dostawę

- Szczegóły: DO USTALENIA



**Deficytowe trasy (ubocze, mało kurierów):**

```

Punkt Z na uboczu

Kurier chce: 800 KES

Nadawca zapłacił: 500 KES

System dopłaca: 300 KES z puli prowizji



Ale: trzeba limitować, żeby nie wypalić rezerw

```



**Dynamiczna prowizja (pomysł):**

```

Ruchliwa trasa (CBD->Westlands): 5% prowizji (sama się kręci)

Trudna trasa (Nairobi->ubocze): 0% lub dopłata (subsydiujemy)

```



### Balansowanie Szans Kurierów - KRYTYCZNE



**Problem:** Jeden kurier zabiera wszystko, inni głodują



**Pomysły na rozwiązanie:**



1. **Soft Limit (miękkie ograniczenie)**

   - Kurier z 10+ zleceniami -> jego oferty widoczne z opóźnieniem 5 min

   - Daje szansę innym

   - Ale jeśli nikt nie weźmie -> on może



2. **Rating Boost dla Nowych**

   - Nowy kurier (0-10 paczek): +50 pkt

   - Średni (11-50): normalnie

   - Doświadczony (50+): -20 pkt

   - Przy równej cenie -> wyższy rating wygrywa



3. **Kolejki Rotacyjne**

   - Pool A: kurierzy <5 paczek dziś (priorytet)

   - Pool B: wszyscy (otwarte po 10 min)



4. **Daily Cap**

   - Max 20 zleceń/dzień

   - Po 20 -> nadal może, ale bez priorytetu



5. **Dynamic Handicap**

   - Kurier z 15 paczkami -> automatycznie +5% do oferty

   - Mniej atrakcyjny, ale może wygrać



**WAŻNE:** Zamiast kar -> bonusy dla słabszych

- Nie ograniczaj topowych (niesprawiedliwe)

- Pomagaj słabszym (rating boost, wcześniejszy dostęp)



**NA POCZĄTKU:** Kod z wieloma zmiennymi do zarządzania balansem

**Z CZASEM:** System ureguluje się sam (uczenie maszynowe)



### Rezerwacja i Priorytety



**Rezerwacja:**

- Kurier rezerwuje zlecenie

- Zamyka worek w systemie

- Ma ustalony czas dojazdu (lub ustala sam)

- Po timeout (nie dotarł) -> aukcja od nowa



**Priorytet po rezerwacji - Niespodzianki:**

```

Kurier zarezerwował, jedzie (10 min)

Nowa paczka A->B dochodzi



System:

-> Automatycznie dodaje do jego zlecenia

-> Kurier dostaje powiadomienie

-> Może odmówić TYLKO z przyczyn technicznych (brak miejsca na motocyklu)

-> Jeśli odmówi -> nowe zlecenie na tę paczkę

```



**Kto by odmówił?** Jak i tak jedzie, dodatkowa paczka = więcej kasy



### Timing Aukcji - Adaptacyjny



**WAŻNE: To NIE jest system minutowy!**



```

Ruchliwy punkt (CBD, centrum):

-> Aukcje co 30-60 minut

-> Szybka rotacja paczek

-> Dużo kurierów



Spokojny punkt (przedmieścia, ubocze):

-> Aukcje co kilka godzin

-> Wolna rotacja

-> Mało kurierów



System dostosowuje timing do ruchu w sortowni

```



### Algorytm Uczenia (DO OPRACOWANIA)



System śledzi i uczy się:

- Historia akceptowanych ofert (za ile brali trasę A->B)

- Pora dnia (rano korki = drożej)

- Dzień tygodnia (weekend = mniej kurierów?)

- Liczba aktywnych kurierów (podaż)

- Liczba oczekujących paczek (popyt)

- ~~Pogoda~~ (w Kenii zawsze słońce ☀️)

- Sytuacje losowe (parada, wypadek, etc.)



**Przykład:**

```

Trasa A->B:

- Normalnie: 400 KES (nauczony)

- Piątek rano (payday + korki): 550 KES

- Niedziela pogodnie: 300 KES

```



### Elementy Do Dopracowania



⚠️ **Wymagają dalszej dyskusji:**



1. Dokładny mechanizm aukcji (kto wygrywa, kiedy, jak)

2. Algorytm marginesu (ile zostawić na negocjacje)

3. Próg dzielenia worków (10? 25 paczek?)

4. Timeout rezerwacji (30 min? 1h?)

5. Kolizja ofert (2 kurierów ta sama cena -> rating? losowo?)

6. Limit przelicytowań (nie chcemy walki o 1 KES)

7. Prowizja systemu (kiedy, ile, dynamiczna?)

8. Subsydiowanie deficytowych tras (ile, jak długo?)



---



---



## WSZYSTKIE ZALEŻNOŚCI SYSTEMU - LISTA KOMPLEKSOWA



### 1. ROUTING - Parametry i Algorytm



**Czynniki oceny trasy (WSZYSTKIE brane pod uwagę):**



| Parametr | Opis | Waga (do ustalenia) | Uwagi |

|----------|------|---------------------|-------|

| Dystans | Odległość fizyczna w km | 0.3? | Krótsza = lepsza |

| Przesiadki | Liczba punktów pośrednich | 0.2? | Każde = ryzyko błędu |

| Obciążenie | Czy punkty przeciążone | 0.2? | >100 paczek = problem |

| Kurierzy | Dostępność na trasie | 0.15? | Brak = czekanie |

| Rating | Niezawodność punktów | 0.1? | Historia błędów |

| Czas | Średni czas sortowania | 0.05? | Szybsze = lepsze |

| Łączenie | Inne paczki w kierunku | bonus | Ekonomia |



**Zmiana tras - warunki:**

- Nowa paczka nadana w "okolicy" (DO ZDEFINIOWANIA: region? promień? kierunek?)

- Paczka na północy NIE wpływa na południe

- Częstotliwość: DO USTALENIA (co minutę? przy zapełnieniu? przy rezerwacji?)



**Regiony (izolacja zmian) - DO USTALENIA:**

- Północ (1-3), Centrum (4-6), Południe (7-9)?

- Dynamiczne granice?



### 2. PUNKTY - Dodawanie, Zamykanie, Obciążenie



**Dodawanie punktów:**

- Spontaniczne (sklepy aplikują)

- Strategiczne (system rekomenduje na podstawie: ruch, dystans, czas dostawy)

- Zagęszczenie (przy dużym ruchu powstają dodatkowe obok)



**Pytania DO USTALENIA:**

- Jak dzielić obciążenie między sąsiednie punkty?

- Czy automatycznie włączać do routingu?

- Jak szybko aktywować nowe punkty?



**Zamykanie punktów (awaria):**



Przypadek 1: Paczka JUŻ w zamkniętym punkcie

- OPCJA A: Przekierowanie awaryjne (kurier zabiera do innego)

- OPCJA B: Czekanie (worek zostaje, alert nadawcy)

- DO USTALENIA: Która? Jak długo czekać?



Przypadek 2: Paczka PLANOWANA przez zamknięty

- Automatyczne przeliczenie trasy (omija punkt)



**Detekcja zamknięcia - DO USTALENIA:**

- Ping co X minut?

- Punkt sam zgłasza?

- Jak szybko reagować?



### 3. PAKOWANIE WORKÓW - Logika Dzielenia



**Zasada:** Dziel tylko gdy oszczędzasz pracę, nie gdy tworzysz dodatkową



**Warunki dzielenia:**

```

IF (punkt_rozbieżności ISTNIEJE)

   AND (grupa_A >= próg_min)  // próg DO USTALENIA: 10? 25 paczek?

   AND (grupa_B >= próg_min)

   AND (oszczędność_pracy > koszt_transportu_2_worków)

THEN dziel worki

ELSE pakuj razem

```



**Przypadki:**

- 98 + 50 paczek -> DZIEL (oba pełne worki)

- 98 + 5 paczek -> NIE DZIEL (5 to za mało)

- 60 + 30 + 20 paczek -> Pakuj do poziomu pierwszej rozbieżności



**DO USTALENIA:**

- Minimalny próg dla osobnego worka (paczki)

- Czy system może zmieniać trasy zamkniętych worków?

- Jak weryfikować worki bez otwierania?



### 4. KOSZTY I EKONOMIA



**Dla nadawcy:**

- Cena ustalana przy nadaniu = STAŁA (nie zmienia się przy zmianie trasy)

- Widzi tylko orientacyjną trasę



**Dla systemu:**

```

Nadawca płaci: 500 KES



Podział (przykład):

P1->P5: 200 KES (kurier)

P5->P9: 150 KES (kurier)

P9->P6: 100 KES (kurier)

Razem kurierzy: 450 KES



Prowizja systemu: 50 KES (10%?)

```



**DO USTALENIA:**

- % prowizji systemu

- Czy prowizja dynamiczna? (ruchliwe vs deficytowe trasy)

- Jak dzielić koszt między odcinki? (równo? proporcjonalnie?)



**Deficytowe trasy:**

```

Kurier chce: 800 KES

Nadawca zapłacił: 500 KES

System dopłaca: 300 KES z puli prowizji

```



**DO USTALENIA:**

- Limity subsydiowania

- Jak długo można dopłacać?

- Które trasy priorytetowo?



### 5. PRZEPAKOWANIA - Minimalizacja



**Problem:** Każde otwarcie worka = ryzyko błędu (ludzie, nie maszyny)



**Rozwiązanie:** Tagi NFC na workach

```

Worek #W123:

- Cel: P6

- Trasa: P1->P5->P9->P6

- Kod: 4.4.7

- Otworzyć w: P9 (dopiero tam!)

- Zawartość: 15 paczek (lista ID)



P5 skanuje -> "Przekładaj dalej, nie otwieraj"

```



**DO USTALENIA:**

- Czy każdy punkt musi przeładować?

- Czy kurier może pominąć punkt pośredni?

- Jak weryfikować zamknięte worki?



### 6. AUKCJE I PRICING (częściowo ustalone)



**Giełda transportowa:**

- Kurierzy widzą: punkt A->B, paczki, waga, cena

- Mogą czekać (stawka rośnie) lub brać od razu

- Transparentna licytacja w dół



**Margines:**

```

5 paczek = 500 KES wartości

System oferuje: 450 KES

Margines: 50 KES (negocjacje + prowizja)



Paczka 6 dochodzi (100 KES)

System dodaje: +20 KES (nie +100)

Margines rośnie: 130 KES

```



**DO DOPRACOWANIA:**

- Dokładny mechanizm aukcji (kto wygrywa, kiedy)

- Algorytm marginesu (ile zostawić)

- Timeout rezerwacji (30 min? 1h?)

- Kolizja ofert (2 kurierów ta sama cena)

- Balansowanie szans (żeby nie jeden zabierał wszystko)



**Timing - ADAPTACYJNY:**

- Ruchliwy punkt: aukcje co 30-60 min

- Spokojny punkt: co kilka godzin

- NIE jest to system minutowy!



**Uczenie się:**

- Historia ofert (za ile jeździli)

- Pora dnia/tydzień

- Liczba kurierów (podaż)

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

-> Może odmówić TYLKO z przyczyn technicznych (brak miejsca)

```



### 8. TECHNOLOGIA I OFFLINE MODE



**Kody:**

- Marker (główna metoda)

- QR kod (zawiera pełne dane, offline)

- NFC tag (wielokrotny użytek, więcej danych)



**Inteligentne wpisywanie:**

- Kod pełny: 20 znaków

- Pracownik: wpisuje 4 znaki

- System: rozpoznaje (lub pyta o więcej przy kolizji)



**Offline:**

- QR/NFC zawierają pełne dane

- Aplikacja działa bez internetu

- Synchronizacja gdy dostępna



**Urządzenia w sklepie:**

- Podstawa: komórka

- Możliwość dostarczenia lepszych

- DO USTALENIA: wymogi offline/online



---



## PEŁNA LISTA PYTAŃ DO ROZSTRZYGNIĘCIA



### PRIORYTET 1 - Routing i Symulacja

1. [ ] Wartości wag dla 7 parametrów oceny trasy (0.3, 0.2, 0.15...)

2. [ ] Definicja "okolicy" (region/promień/kierunek)

3. [ ] Częstotliwość przeliczania tras

4. [ ] Podział na regiony izolacji



### PRIORYTET 2 - Pakowanie

5. [ ] Minimalny próg dla osobnego worka (10? 25 paczek?)

6. [ ] Algorytm decyzji dzielenia (dokładny)

7. [ ] Czy zmiana tras zamkniętych worków możliwa?



### PRIORYTET 3 - Punkty

8. [ ] Dzielenie obciążenia między sąsiednie

9. [ ] Reakcja na zamknięcie (czekać/przekierować/ile)

10. [ ] Szybkość detekcji awarii

11. [ ] Kryteria strategicznych lokalizacji



### PRIORYTET 4 - Ekonomia

12. [ ] % prowizji systemu (stały/dynamiczny)

13. [ ] Podział kosztu między odcinki

14. [ ] Limity subsydiowania deficytowych

15. [ ] Czy prowizja rośnie przy dopłatach nadawcy



### PRIORYTET 5 - Aukcje (szczegóły)

16. [ ] Mechanizm wygrywania (pierwszy/najlepszy rating/czas)

17. [ ] Timeout rezerwacji

18. [ ] Rozwiązanie kolizji ofert

19. [ ] System balansowania szans kurierów

20. [ ] Limit przelicytowań



### PRIORYTET 6 - Techniczne

21. [ ] Czy punkty zawsze muszą przeładowywać?

22. [ ] Czy kurierzy mogą pomijać punkty?

23. [ ] Weryfikacja zamkniętych worków

24. [ ] Wymogi offline/online mode



---



*OSTATNIA AKTUALIZACJA: 2026-02-25 (Faza PoC zintegrowana)*



---



# WDROŻONA DOKUMENTACJA TECHNICZNA (PoC 2026)



Poniższa sekcja dokumentuje finalne zmiany w logice routingu, ekonomii i monitoringu, które zostały zaimplementowane i przetestowane w symulacji `courier_logic_poc.py`. Dokumentacja ta pozwala na odtworzenie projektu od zera.



## 1. Topologia Sieci: Zasada Wzajemnej Widoczności (MNN)



Aby wyeliminować nierealistyczne "skróty" i wymusić naturalny przepływ przez sieć hubów, wprowadzono rygorystyczną zasadę **Mutual Nearest Neighbor**.



### Algorytm Połączeń:

Hub A łączy się z Hubem B **tylko wtedy**, gdy:

1. Hub B jest najbliższym sąsiadem Hubu A w danym sektorze kątowym.

2. **ORAZ** Hub A jest najbliższym sąsiadem Hubu B w sektorze przeciwległym.



**Efekt:** Sieć jest rzadsza, ale bardziej spójna. Trasy długodystansowe (np. P2 -> P7) nie przeskakują już punktów, lecz układają się w logiczne łańcuchy (P2 -> P10 -> P5 -> P7).



---



## 2. Nowy Silnik Ekonomiczny (Pricing)



Wycena paczki została zunifikowana pod kątem prostoty rozliczeń i braku przecinków (skalowanie ×10).



### Formuła dla Klienta:

`CENA = (Liczba_Hubów * 50 + Dystans_KM * 10) * Waga_Paczki`



### Podział Środków (Zero-Sum Game):

Każda paczka posiada własne **Saldo**, z którego wypłacane są prowizje:

- **Hub Startowy/Przeładunkowy/Meta:** `50 KES * waga` (opłata stała za sortowanie i magazynowanie).

- **Transport (Kurier):** `Dystans_odcinka * 10 * waga` (opłata zmienna za kilometry).

- **Zysk z Optymalizacji:** Wszystkie środki pozostałe w paczce po dostarczeniu (wynikające ze skrótów kuriera) stanowią czysty zysk systemu. Dzięki temu "nadwyżka" nie ginie, lecz zostaje w systemie jako realna oszczędność.



---



## 3. Logika "Hop-Skipping" i Motywacja Kurierów



Wprowadziliśmy mechanizm pozwalający kurierom na dynamiczną optymalizację trasy przy zachowaniu priorytetu konsolidacji.



### Zasada Przeskoku:

Na Giełdzie Zleceń wystawiane są dwie opcje dla tej samej paczki:

1. **Opcja Standard:** Dostawa do najbliższego sąsiada (np. P2 -> P10).

2. **Opcja Skip-Hop:** Możliwość przeskoczenia huba (np. P2 -> P5), jeśli w hubie pomijanym (P10) nie ma aktualnie innych paczek czekających w tym samym kierunku.



### Bonus za Przeskok:

Kurier wykonujący "Skip-Hop" przejmuje prowizję huba, który został pominięty (`50 KES * waga`). Jest to nagroda za oszczędność czasu i uproszczenie logistyki.



---



## 4. Monitoring Finansowy i Śledzenie Paczek



Każdy obiekt `Parcel` w systemie posiada teraz historię transakcji:

- `payment_history`: Lista wszystkich wypłat (kto, ile, za co).

- `balance`: Kwota pozostała do wydania na dalszą drogę.



Podczas skanowania magazynu (`network_status`), system wyświetla pełny audyt każdej paczki, zapobiegając "ginięciu" pieniędzy w systemie.



---



## 5. Historia Zmian (Audit Log - Droga do Rozwiązania)



6. **Faza 6: Financial Audit & Optimization Profit** - Wdrożenie klasy Parcel z balansem i historią transakcji. Ustalenie mechanizmów audytu finansowego.

7. **Faza 7: Magnetic Routing 2.0 & Courier Incentives** - Implementacja Logiki B (alternatywne korytarze sektorowe) oraz przekierowanie zysku z optymalizacji bezpośrednio do kurierów.



---



## 6. Magnetyzm 2.0 (Logika B - Zaawansowany Routing)



Wdrożono dwupoziomowy system wyznaczania tras, sterowany globalną zmienną `ROUTING_STRATEGY`.



### 6.1 Algorytm Selekcji (Routing Selector)

1. **Wylicz trasę A**: Standardowa Dijkstra z uwzględnieniem prostego magnetyzmu sektorowego.

2. **Sprawdź "Early Exit"**: Jeśli trasa A już korzysta z magnetyzmu (istniejące worki na jej drodze), system kończy pracę i zwraca trasę A.

3. **Analiza Sektorowa**:

   - Oblicz kąt start -> cel.

   - Porównaj odległość kątową do środków sąsiednich sektorów (Lewy vs Prawy).

   - Wybierz sektor `alt_sector`, który jest bliżej geograficznie.

4. **Trasa Alternatywna**: System wyznacza trasę wymuszającą pierwszy skok w `alt_sector`.

5. **Wirtualne Zerowanie (Teoretyczne)**: 

   - Każdy segment trasy alternatywnej, który pokrywa się z *dowolnym* istniejącym workiem w sieci, otrzymuje `teoretyczny_koszt = 0`.

6. **Decyzja Ekonomiczna**: Jeśli `suma_kosztów_teoretycznych_B < koszt_A`, system wybiera wariant B.



### 6.2 Przejrzystość ("Widoczność Technologii")

Podczas pracy mózgu (Assigner) lub nadawania paczki, system loguje proces decyzyjny:

- `[LOGIKA B] Analiza trasy alternatywnej (Sektor X)...`

- `[LOGIKA B] Znaleziono darmowe odcinki...`

- `[LOGIKA B] WYBRANO TRASĘ ALTERNATYWNĄ / Pozostaję przy trasie A`



---



### 6.3 Przykład praktyczny (Flask, konkretne huby)

Poniższy scenariusz pokazuje **kiedy Logika B realnie zmienia trasę**.

Założenie: `ROUTING_STRATEGY = 'B'`.



**Cel:** paczka `AA -> EA` zostaje "przyciągnięta" do korytarza.



1) **Zasięj korytarz** (dodaj paczki, aby powstały worki na każdym odcinku):

- `AA -> CA`

- `CA -> BQ`

- `BQ -> PA`

- `PA -> EA`



2) **Dodaj paczkę docelową**:

- `AA -> EA`



**Efekt oczekiwany:**

- Logika A (standard) zwykle wybiera: `AA -> BA -> DA -> EA`

- Logika B wybierze: `AA -> CA -> BQ -> PA -> EA`, ponieważ na tych odcinkach

  już istnieją worki (korytarz jest "autostradą").



**Wniosek:** Logika B zmienia trasę tylko wtedy, gdy istnieją aktywne worki na

alternatywnym korytarzu i przez to koszt teoretyczny alternatywy spada poniżej A.



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



### Główne Parametry

- `COST_PER_HUB = 50`

- `COST_PER_KM = 10`

- `SECTOR_COUNT = 8` (Sektory przypisane do kodów 1, 2, 4, 5, 7, 8, 10, 11)



### Kluczowe Algorytmy (Pseudokod)



**1. Wyznaczanie Połączeń (MNN):**

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

    # Wypłata dla kuriera

    payout = (actual_dist * 10 * weight)

    # Bonus jeśli kurier zrobił przeskoczył hub

    if used_skip_hop:

        payout += (50 * weight) 

    parcel.balance -= payout

    

    # Wypłata dla Hubu docelowego

    parcel.balance -= (50 * weight)

```



---



## 6. Rozszerzony Model Danych - Nairobi Courier v0.2



Ta sekcja dokumentuje zmiany wdrożone w celu profesjonalizacji zarządzania hubami oraz pracownikami.



### 6.1 Model Pracowników (Worker Model)

Każdy Hub działa jako mała komórka organizacyjna z własnym zespołem.



| Klasa | Pole | Opis |

| :--- | :--- | :--- |

| **Worker** | `id`, `name`, `pin` | Unikalny identyfikator, Imię i PIN (4-6 cyfr). |

| | `is_manager` | Flaga określająca uprawnienia zarządcze. |

| | `balance` | Indywidualne saldo zarobków pracownika. |

| | `rates` | Procentowy udział w prowizjach (Intake, Transfer, Delivery). |

| **Hub** | `workers[]` | Lista wszystkich pracowników przypisanych do punktu. |

| | `active_workers[]`| Pracownicy aktualnie zalogowani (wsparcie wielu urządzeń). |

| | `logged_in_manager`| Manager aktualnej zmiany, do którego trafia reszta prowizji. |



### 6.2 Logika Podziału Prowizji (Split-Fee Mechanism)

System automatycznie dzieli prowizję huba przy każdej operacji:

1. **Pracownik** dostaje `hub_fee * worker_rate`.

2. **Manager zmiany** dostaje pozostałą część `hub_fee * (1.0 - worker_rate)`.

3. Jeśli manager sam obsługuje paczkę, otrzymuje 100% prowizji.



### 6.3 Szczegółowe Stawki Hubów (PRD 4.3)

Zrezygnowano ze stałego 50 KES na rzecz stawek procentowych lub kwotowych zależnych od typu operacji:

- **Intake Rate** (Przyjęcie): np. 5% lub stała kwota.

- **Transfer Rate** (Przeładunek): np. 10% lub stała kwota.

- **Delivery Rate** (Wydanie): np. 5% lub stała kwota.



### 6.4 Zaawansowany Monitoring i Chain of Custody

Każda akcja w systemie jest teraz precyzyjnie śledzona i logowana.



| Parametr | Szczegóły |

| :--- | :--- |

| **Timestamping** | Wszystkie zdarzenia stemplowane `[YYYY-MM-DD HH:MM:SS]`. |

| **Historia Finansowa** | `payment_history` zawiera listę wszystkich wypłat z dokładnością do 2 miejsc po przecinku (`round(x, 2)`). |

| **Audit Log** | Śledzenie każdego pracownika (`handled_by`) i kuriera odpowiedzialnego za przedmiot. |



---



## 7. Zarządzanie Zasobami i Opakowaniami (v0.3)



Wprowadzono 3 poziomy monitorowania przedmiotów w sieci Nairobi.



### 7.1 Grupa 2: Opakowania Monitorowane (PKG-XXX)

- **Identyfikacja**: Unikalne ID (np. `PKG-P1-01`).

- **Chain of Custody**: System wymusza skanowanie przy każdym przekazaniu. 

- **Własność**: Zawsze przypisane do konkretnego kuriera lub hubu.



### 7.2 Grupa 3: Zasoby Administracyjne (AST-XXX)

- **Zaszyte w Hubie**: Sprzęt taki jak drukarki, skanery, wagi.

- **Obowiązkowe Notatki**: Każdy ruch assetu (transfer do innego hubu) wymaga wpisania powodu (notatki).

- **Historia Nieusuwalna**: W przeciwieństwie do zwykłych paczek, historia AST nigdy nie znika i stanowi pełny audyt majątku firmy.



### 7.3 Grupa 4: Balansowanie Obciążenia (Load Balancing)

Inteligentne rozkładanie ruchu w celu uniknięcia "zatorów" (congestion).



#### A. Wskaźnik Zatoru (Operacyjny)

- **Formuła**: `Obciążenie = (Liczba paczek w hubie) / (Liczba pracowników)`.

- **Kara Dijkstra**: Jeśli `obciążenie > 20` paczek na pracownika, system dolicza wirtualną karę do dystansu: `penalty = (obciążenie - 20) * 2 km`.

- **Cel**: System automatycznie omija Huby, które są "wolne" lub "zatkane", wybierając dłuższą geograficznie, ale szybszą operacyjnie drogę.



#### B. Logistyka Worków (Bags Inventory)

- **Zasoby**: Każdy Hub startuje z zapasem **100 worków**.

- **Hitchhiking (Autostop)**: System dąży do wyrównania stanu worków poprzez przewożenie pustych opakowań "przy okazji" transportu paczek. Kurier nie dostaje za to dodatkowej opłaty, ale zwiększa to sprawność operacyjną sieci.

- **Brak Kar**: Stan worków jest czysto informacyjny i nie wpływa na trasowanie paczek klienta.



---



## 8. Specyfikacja Techniczna Rozliczeń (v0.3)



### 8.1 Precyzja i Rounding

Wszystkie obliczenia finansowe muszą być zaokrąglane do dwóch miejsc po przecinku. Zakaz używania `int()` do obcinania kwot.

- `price = round(total_unit_cost * weight, 2)`

- `p_share = round((p.weight / total_weight) * total_payout, 2)`



### 8.2 Hub Fee Split

Stawka Hubu jest dzielona dynamicznie:

- **Worker Cut**: `effective_fee * worker_rate` (zaokrąglone do 0.01).

- **Manager Cut**: `effective_fee - worker_cut`.



---



*Dokument zaktualizowany: 2026-03-02*

*Status: Faza v0.4 Wdrożona - Logika Magnetyczna 2.0 i Pełny Audyt*



---



## 9. Dynamiczny Routing i Model Finansowy v0.5



### 9.1 Kluczowa Decyzja: Hub Fee = 50 KES FLAT



**Hub fee jest opłatą stałą - jak czynsz. Nie zależy od wagi paczki.**



```

Formuła wyceny: hubs × 50 + km × 10 × waga

                ──────────   ────────────────

                flat         skaluje z wagą

```



Stara wersja dokumentu pokazywała `3 × 100 = 300 KES` - to był błąd. Prawidłowo: `3 × 50 = 150 KES`.

Transport skaluje się z wagą bo kurier fizycznie wiezie ciężar. Hub płaci za samo zatrzymanie paczki.



---



### 9.2 Faza 1: System Wag Hubów (Miękkie Sterowanie Ruchem)



Każdy hub ma pole `routing_weight` które wpływa na koszt krawędzi w Dijkstrze:



```

routing_weight = 0      -> neutralny (domyślny)

routing_weight = +200   -> mocno omijany (przeciążony, zamykający się)

routing_weight = +9999  -> praktycznie wyłączony z routingu

routing_weight = -200   -> wymuszone przejście (centrum logistyczne)

```



**Nowe pola w klasie Hub:**

- `routing_weight = 0` - miękka waga routingowa

- `closing_warning = None` - etap procedury zamknięcia (`"30min"` / `"10min"` / `"CLOSING"`)

- `closing_blocked = False` - czy kurier jest w drodze (nie można zamknąć)



**Nowe funkcje:**

- `set_hub_weight(hub, weight, reason)` - ręczne ustawienie wagi przez admina

- `auto_adjust_hub_weight(hub)` - automatyczna regulacja na podstawie fill rate i ratingu

- `escalate_hub_closing(hub, hub_database)` - 3-etapowa procedura zamknięcia

- `reactivate_hub(hub, hub_database)` - reaktywacja po przerwie



**Procedura zamknięcia (3 etapy):**

```

ETAP 1: routing_weight = +200  -> nowe paczki zaczynają omijać

        closing_warning = "30min"

ETAP 2: routing_weight = +9999 -> praktycznie niewidoczny

        closing_warning = "10min"  + komunikat o kurierze w drodze

ETAP 3: is_active_manual = False -> faktyczne wyłączenie

        routing_weight = 0 (reset)

```



Menu admina: `[5]` procedura zamknięcia, `[6]` reaktywacja.

`auto_adjust_hub_weight()` wywoływany po każdym transporcie w `apply_assignment()`.



---



### 9.3 Faza 2: Podwójna Wycena A+B i Dynamiczny km_rate



**Mechanizm B (theoretical=True):** trasa przez pełną sieć (wszystkie huby aktywne)

**Mechanizm A (theoretical=False):** trasa przez aktywne huby (rzeczywista)



```

cena_B = hubs_theo × 50 + km_theo × 10 × waga

cena_A = hubs_akt  × 50 + km_akt  × 10 × waga

operational_budget = MAX(cena_A, cena_B)   ← klient płaci tyle

```



**Zasada:** Klient nigdy nie płaci mniej niż przy pełnej sieci. Jeśli trasa jest dłuższa (bo hub offline), klient płaci więcej.



**Dynamiczny km_rate:**

```

hub_fees_reserved = actual_hubs × 50   (flat)

transport_budget  = operational_budget - hub_fees_reserved

km_rate           = transport_budget / (actual_km × waga)

```



**Nowe pola w klasie Parcel:**

- `actual_route = []` - bieżąca trasa operacyjna (lista Hub)

- `is_subsidized = False` - True gdy system dopłacił do paczki



**Nowe funkcje:**

- `calculate_dual_price(start_hub, end_hub, weight)` - zwraca dict z `operational_budget`, `km_rate`, `actual_route`, `cena_A`, `cena_B`

- `settle_transport_leg(parcel, from_hub, to_hub)` - pobiera koszt odcinka z dynamicznym `km_rate`, zwraca kwotę dla kuriera



`create_and_add_parcel()` używa teraz `calculate_dual_price()` do wyceny.



---



### 9.4 Faza 3: Przeliczanie Tras i Dofinansowanie



**Zasada:** Trasa przeliczana ZDARZENIOWO - nie cyklicznie. Tylko gdy hub znika.

Sprawdzamy tylko HOP1 i HOP2 - dalsze huby dostosują się naturalnie przy kolejnym skoku.



**recalculate_bag_route(bag, current_hub, hub_database):**

```

1. Mechanizm A: nowa trasa od current_hub do end_hub (tylko aktywne huby)

2. Jeśli brak trasy -> HOLDING (worek czeka, nie wystawiany na giełdę)

3. Jeśli trasa istnieje:

   - Oblicz nowy km_rate = (saldo - remaining_hubs × 50) / (new_km × waga)

   - Zaktualizuj bag.to_hub jeśli hop1 się zmienił

   - ALERT jeśli zmienił się sektor -> fizyczne przekłożenie worka

4. Loguj zmianę w payment_history każdej paczki

```



**top_up_if_needed(parcel, from_hub, to_hub):**

```

next_hop_cost = 50 + dist × 10   (flat hub + transport po std stawce)

if parcel.balance < next_hop_cost:

    deficyt = next_hop_cost - parcel.balance

    system dopłaca deficyt

    parcel.is_subsidized = True

    total_optimization_savings -= deficyt

```

Wywoływać PRZED pobraniem opłaty huba i PRZED settle_transport_leg.



**Podpięcie do manage_topography [3]:** przy wyłączaniu huba system automatycznie wywołuje `recalculate_bag_route` dla wszystkich worków których hop1 wskazywał na wyłączany hub.



---



### 9.5 Faza 4: Skip-Hop (Pominięcie Pośredniego Huba)



Skip-hop pozwala zapieczętowanemu workowi przejechać bezpośrednio do hub+2 omijając hub+1, gdy nie ma powodu zatrzymywać się pośrodku.



**Warunki kwalifikacji:**

1. Worek jest ZAPIECZĘTOWANY (`BagStatus.SEALED`)

2. W bieżącym hubie NIE ma innych worków jadących w tym samym kierunku sektorowym

3. W hub+1 (pomijanym) NIE ma paczek do konsolidacji w tym samym kierunku

4. Trasa ma >= 3 elementy (jest co pominąć)



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

3. km_rate przeliczony z odzyskanym budżetem

4. Loguj: "SKIP-HOP: P2 -> (skip A1) -> P5 | +50 VKES do transportu"

```



**W job_market:** przy każdym zleceniu sprawdzane jest `check_skip_hop_eligibility`. Jeśli eligible, giełda wyświetla `⚡ SKIP-HOP dostępny: omiń A1 -> jedź do P5`.



---



### 9.6 Tabela Wariantów Symulatora (Trasa P2->P7, waga=2kg)



| Wariant | Zdarzenie | km_rate | Alert obsługi |

|---------|-----------|---------|---------------|

| 1 | Normalna trasa P2->A1->P5->P7 | stały | NIE |

| 2 | A1 offline przy nadaniu | stały (MAX) | NIE |

| 3 | A1 znika, worek w P2 (hop1) | spada - dłuższa trasa | TAK - zmiana sektora |

| 4 | P5 znika, worek w P2 (hop2) | spada - dłuższa trasa | NIE - hop1 bez zmian |

| 5 | P5 znika, worek W DRODZE | czekaj na dostarczenie | NIE |

| 6 | P7 (cel) znika, paczka w P5 | bez zmian - HOLDING | NIE |



---



### 9.7 Magnetyzm 2.0 - Status i Przepis na Przyszłość



System posiada przełącznik `ROUTING_STRATEGY` (`'A'` / `'B'`) w menu `[8]`.



- **Logika A (domyślna):** zdecentralizowana Dijkstra z wagami hubów

- **Logika B (Magnetyzm 2.0):** alternatywne korytarze kierunkowe



**Decyzja:** Do czasu pełnych testów produkcyjnych pozostaje jako przełącznik. Logika hubów (routing_weight, edge_cost, wycena A+B) działa identycznie w obu trybach. Magnetyzm 2.0 wpływa tylko na wybór trasy, nie na ceny.



Po testach: rozważyć czy Logika B staje się domyślną lub jedyną.



---



---



*Dokument zaktualizowany: 2026-03-02*

*Status: Faza v0.5 Wdrożona - 4 Fazy Dynamicznego Routingu, Hub Weights, Dual Pricing A+B, Route Recalculation, Skip-Hop*

*NASTĘPNY KROK: Testy produkcyjne obu logik (A/B), decyzja o Magnetyzmie 2.0 jako domyślnym*



---



## 10. DO PRZEMYŚLENIA - Odporność Sieci (Przyszłe Wersje)



> ⚠️ Poniższe punkty NIE są pilne ani wymagane do MVP.

> Są wynikiem analizy edge-case'ów awaryjnych i mają być omówione przed wdrożeniem produkcyjnym.

> Obecny system jest odpowiedni do skali - małe sklepy, nie centrum logistyczne.



---



### 10.1 Cascading Failure - Awaria Wielu Hubów Jednocześnie



**Scenariusz:** 2 huby padają jednocześnie, trzeci hub zostaje przeciążony ruchem z obu.



**Obecny stan:** `routing_weight` automatycznie rośnie przy przeciążeniu, co zniechęca routing do przeciążonego huba. Ale brak globalnego progu dla całej sieci.



**Do przemyślenia:**

- Czy potrzebny jest globalny `network_health_score`?

- Próg po przekroczeniu którego system wyświetla alert admina: *"Sieć przeciążona - rozważ ręczne interwencje"*

- Czy routing ma się zatrzymać (HOLD ALL) czy działać degraded?



---



### 10.2 Synchronizacja Stanu Po Reaktywacji Huba



**Scenariusz:** Hub B pada i wraca po 2 godzinach. Część paczek była w tranzycie do B.



**Obecny stan:** `reactivate_hub()` włącza hub i resetuje `routing_weight`. Worki które czekały (HOLDING) automatycznie wychodzą na giełdę. Ale brak sprawdzenia duplikatów zleceń.



**Do przemyślenia:**

- Czy po reaktywacji powinno być `reconciliation_check()` - porównanie worków zarejestrowanych jako jadące do B vs. worki faktycznie w B?

- Ryzyko: kurier dostał zlecenie do B przed awarią, B wróciło - czy zlecenie jest wciąż aktualne?

- Ewentualne rozwiązanie: `bag.courier_assigned = courier_id` - lock na worku który jest w transporcie



---



### 10.3 Stany Częściowej Awaryjności Huba



**Scenariusz:** Hub działa, ale jeden pracownik jest chory - hub może przyjmować ale nie wysyłać.



**Obecny stan:** Hub jest albo `is_active_manual = True` albo `False`. Brak stanów pośrednich.



**Do przemyślenia:**

- Dodanie statusu `receive_only` / `dispatch_only` (już zaplanowane w task.md)

- Przy `receive_only`: Dijkstra traktuje hub jak ważony koniec trasy (można tam dotrzeć ale nie można startować)

- Przy `dispatch_only`: hub może wysyłać ale nie przyjmuje nowych paczek od klientów



**Prawdopodobna implementacja 1 linią:**

```python

hub.mode = "normal" | "receive_only" | "dispatch_only" | "hold"

```

Dijkstra sprawdzałby `hub.mode` przy każdej krawędzi.



---



*Sekcja dodana: 2026-03-02 | Do omówienia przed wdrożeniem produkcyjnym*



---



## 11. Specyfika Portfela Hubu i Rozliczeń KES (Debt Reduction Model)



> [!IMPORTANT]

> **UWAGA WAŻNE:** Portfel Hubu (`vkes_balance`) oraz gotówka fizyczna (`kes_balance`) działają w modelu redukcji długu systemu wobec partnera (Huba). Nie należy mylić salda Huba z zarobkami personelu.



### 11.1 Mechanizm Redukcji Długu

Huby w Nairobi pełnią rolę punktów wymiany walut i inkasentów. Przy nadaniu paczki gotówkowej (KES):

1. **Wzrasta `kes_balance`**: Hub fizycznie przyjmuje gotówkę od klienta.

2. **Wzrasta `vkes_balance`**: System zalicza tę gotówkę jako spłatę długu wobec Huba. Ponieważ Hub startuje z ujemnym saldem (np. -10,000 VKES jako kaucja startowa), każda wpłata KES przybliża go do zera (zmniejsza zadłużenie systemu).



### 11.2 Separacja Salda Huba i Zarobków

- **Saldo Huba**: Odzwierciedla stan rozliczeń między Firmą a właścicielem punktu (kasa/kaucja).

- **Zarobki Personelu**: Prowizje za operacje (Intake/Transfer/Delivery) trafiają bezpośrednio do portfeli pracowników (`Worker.balance`), a nie do salda Huba.



### 11.3 Logowanie Transakcji

Wszelkie operacje zasilenia portfela Hubu poprzez gotówkę muszą być logowane jako **"[Zasilenie Kaucji]"** lub **"[Spłata Długu]"**, aby odróżnić je od standardowych operacji logistycznych.



---



## 12. Ewolucja Techniczna i Modernizacja Serwera (Architektura v0.7)



*Sekcja dodana: 2026-03-04 | Dokumentacja zmian strukturalnych i wizualizacji live*



W fazie POC v0.7 dokonano głębokiej przebudowy serwera Flask oraz frontendu React, aby umożliwić dynamiczne zarządzanie siecią i poprawić czytelność kodu.



### 12.1 Refaktoryzacja Modułowa (Service-Oriented)

W celu uniknięcia "Monolitu Flask", logika biznesowa została wyodrębniona z warstwy transportowej HTTP do dedykowanych serwisów:

- **`event_service.py`**: Zarządzanie stanem sieci, kolejką SSE i snapshotami dla frontendu.

- **`hub_service.py`**: Logika topologii (MNN), włączanie/wyłączanie węzłów oraz inteligentne reroutowanie worków.

- **`parcel_service.py`**: Walidacja domenowa i proces tworzenia/rejestracji paczek w systemie.



### 12.2 Wizualizacja Topologii w Czasie Rzeczywistym (MNN Live)

Wprowadzono pełne śledzenie zmian w sieci na poziomie frontendu:

- **Topology Diff**: Serwer oblicza różnicę (added/removed links) przy każdej zmianie stanu huba (manual toggle lub wylogowanie pracownika).

- **Animacja Stanu**: React Canvas wizualizuje zanikające połączenia (czerwony dash) oraz nowo powstałe magistrale (pomarańczowy puls).

- **Inteligentny Rerouting**: Worki znajdujące się w ruchu są automatycznie przekierowywane na nowe, najlepsze trasy (Dijkstra) w momencie wypadnięcia węzła z sieci.



### 12.3 Standaryzacja Interfejsu i Logów

- Jednolita nomenklatura ról: **"Worker "** (wyrównany do "Manager").

- Model logowania zdarzeń maszynowy (JSON) dla stabilności SSE.

- Nowe metody interakcji: Double-click / Mid-click dla administracji topologią.



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



Poniższa sekcja została przeniesiona w całości z pliku `logistc_code.md`.



# PRD v2: System kodow "Marker & Hub" (wersja wdrozeniowa)



Projekt: miejski system logistyczny low-tech (Nairobi)  

Cel: wdrozyc kodowanie paczek/workow + walidacje sieci hubow + integracje z edytorem polaczen.



## 1. Zakres wdrozenia (MVP)

- Generowanie kodu paczki (3 znaki).

- Generowanie kodu worka (dynamiczny string trasy).

- Walidacja i przydzial identyfikatorow hubow.

- Reakcja systemu na dodanie/usuniecie huba i polaczenia w Hub Editor.

- Walidator nazw hubow (program serwerowy + API).



## 2. Slownik i byty

- `GlobalHubID` (2 znaki): adres docelowy paczki.

- `LocalHubMark` (1 znak): stempel huba dopisywany na worku.

- `ParcelCode` (4 znaki): zakodowane 20 bitow (RFC 4648).

- `BagCode` (min 2 znaki): `SL...` (`S`=start mark, `L`=licznik, dalej kolejne huby).



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



3. Kod worka (`BagCode`, dynamiczny string)

- Start: 2 znaki `AB`:

  - `A` = `LocalHubMark` huba, ktory otworzyl worek,

  - `B` = licznik worka 0..31 dla tego huba.

- Tranzyt: kazdy kolejny hub dopisuje swoj `LocalHubMark`.

- Przyklad:

  - start `AB`,

  - po tranzycie przez hub `D`: `ABD`.

- Uzycie:

  - fizyczny slad trasy worka i diagnostyka przeplywu.



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



## 6. Kod worka (sztafeta)

Format:

- znak 1: `LocalHubMark` huba startowego,

- znak 2: licznik modulo (`0..31` lub `0..20` zaleznie od alfabetu),

- znak 3+: kolejne `LocalHubMark` hubow na trasie.



Zasady:

- Kod worka jest historia trasy i musi byc append-only.

- Po kazdym przyjeciu worka system wymaga dopisania lokalnego znaku huba.

- Unikalnosc worka w runtime: `(start_hub, counter, open_time_window, status=open)`.



## 7. Sasiedztwo hubow i "kolorowanie" (LocalHubMark)

Wymaganie biznesowe:

- Hub nie moze miec tego samego `LocalHubMark` co:

  - sasiedzi 1-hop,

  - sasiedzi 2-hop.



Algorytm (po zmianach topologii):

1. Zbuduj graf aktywnych polaczen.

2. Dla huba `H` wyznacz zbior zabronionych znakow:

   - znaki wszystkich wezlow w odleglosci <=2 od `H`.

3. Przydziel pierwszy wolny znak z puli.

4. Gdy brak wolnego znaku:

   - uruchom lokalne recoloring BFS na obszarze do 2 hop od `H`,

   - jesli dalej brak, oznacz stan `UNSAT` (wymagany fallback, sekcja 12).



Uwagi:

- Przy dynamicznym dodawaniu/usuwaniu linii recoloring dotyczy tylko zmienionego obszaru, nie calej mapy.

- Operacja musi byc atomowa (transakcja + lock topologii).



## 8. Integracja z Hub Editor (dodaj/usun polaczenie)

Po `link_add` / `link_remove`:

1. Zapisz zmiane topologii.

2. Przelicz sasiedztwo/routing.

3. Przelicz `LocalHubMark` dla wezlow dotknietych zmiana (1-2 hop od obu koncow krawedzi).

4. Waliduj ograniczenie 2-hop.

5. Emituj zdarzenie SSE: `topology_changed` + diff `recolored_hubs`.



Po `hub_add` / `hub_delete`:

- ten sam pipeline + walidacja nazwy huba (sekcja 9).



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

   - Re-kolorowanie tylko przy dodaniu nowego huba (walidacja 1-hop i 2-hop).

   - Po nadaniu znaki nie zmieniaja sie automatycznie przy codziennej pracy.

2. Licznik worka:

   - Ustalenie: ciagly rollover (modulo), bez resetu czasowego.

3. Spojnosc z edytorem:

   - Ustalenie: na teraz wystarczy przy dodaniu huba (nie po kazdym kliknieciu linii).



## 13. Plan implementacji (kolejnosc)

1. Migracja do DB (SQLite pilot) jako warstwa zrodla prawdy.

2. Dodac walidator nazw hubow + endpoint.

3. Dodac modul recoloring 2-hop (lokalny, atomowy).

4. Spiac recoloring z operacjami Hub Editora.

5. Kody paczki/worka jako kolejny etap po stabilizacji DB.

6. Dodac audit + offline conflict handling.

7. Testy E2E:

   - add hub, add link, remove link, recolor, generowanie kodu paczki/worka.



## 14. Kryteria akceptacji

- Kazdy nowy hub po walidacji dostaje poprawny `GlobalHubID` i `LocalHubMark`.

- Po zmianie polaczen nie ma konfliktu znakow w 2-hop.

- Kod paczki ma zawsze 4 znaki i poprawny podzial bitow (`HubID+Direction+Counter`).

- Kod worka poprawnie rozrasta sie o kolejne huby.

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

- Po `add/remove link` i `add/delete hub`:

  - przeliczyc routing,

  - uruchomic recoloring 2-hop lokalnie,

  - zwalidowac konflikt `LocalHubMark`.

- Emitowac SSE diff: `recolored_hubs`, `changed_links`.



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

- Integracja: hub editor -> recoloring -> generowanie kodow.

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



### 17.2 Kod worka `BagCode` (append-only)

- Start:

  - znak 1 = `LocalHubMark` huba startowego (RFC 4648),

  - znak 2 = licznik worka (RFC 4648, modulo lokalne).

- Licznik worka:

  - per hub, zakres `0..31`,

  - `next_counter = (current + 1) % 32`.

- Tranzyt:

  - kazdy kolejny hub dopisuje swoj `LocalHubMark` na koncu.

- Zasada:

  - kod worka jest tylko dopisywany (append-only),

  - poprzednich znakow nie wolno zmieniac.



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

- Opcjonalnie: `wallet_signatures` (per-owner podpis HMAC dla wpisu) zapisywany w osobnej tabeli z `key_id`.

- Flagi:

  - `WALLET_SIGNATURES=1` wlacza zapis podpisow per-owner.

  - `WALLET_SIGNATURES_REQUIRE_KEY=1` wymusza istnienie klucza (brak klucza = blad zapisu).

  - `WALLET_SIGNATURES_VERIFY=1` wlacza weryfikacje podpisow w audycie.



Audyt:

- przejscie od pierwszego wpisu, sprawdzanie `entry_hash` i `prev_hash`.

- weryfikacja HMAC dla kazdego wpisu.

- opcjonalna weryfikacja `wallet_signatures` (gdy `WALLET_SIGNATURES_VERIFY=1`).

- rozbieznosc = brak spojnosci lub edycja historii.



### 19.3 Klucze i bezpieczeństwo

- Klucz HMAC przechowywany w zmiennej srodowiskowej (np. `VKES_HMAC_KEY`).

- Klucz nie trafia do DB ani do plikow z danymi.

- Rotacja klucza wymaga nowego `key_id` w wpisach lub migracji podpisow.

- Opcjonalny vault kluczy wallet:

  - `wallet_keys` przechowuje klucze per owner, zaszyfrowane AES-256-GCM.

  - KEK w zmiennej `WALLET_KEK` (nigdy w DB).

  - `wallet_signatures` przechowuje podpis + `key_id` dla kazdego wpisu.



### 19.4 Hierarchia prowizji dla kurierow

- Kurierzy maja taki sam model payout_pct jak pracownicy (intake/transfer/delivery/outtake).

- Podzial: owner_pct -> manager_rate -> courier_rate.

- Różnice (system/hub cut) logowane w historii paczki jako osobne wpisy.

- Kurier jest przypisany do huba i managera (odpowiedzialnosc + rozliczenia).



### 19.5 Jeden manifest (hub_manifest.yaml)

- Kurierzy sa zarzadzani przez huby i zapisani pod managerami w `hub_manifest.yaml`.

- `courier_manifest.yaml` jest usuniety (jeden manifest = jedna prawda).

- Sync kurierow idzie przez `config_manifest_sync.py` i `hub_staff` w DB.



### 19.6 Zmiany z dzisiaj (podsumowanie)

- Aktualizacja testow do nowych nazw hubow (dynamicznie z DB).

- Usuniecie `test_api.py` (ręczny test HTTP niepotrzebny w repo).

- Courier payout split wdrozony w runtime (logi paczek zawieraja rozbicie).



### 19.7 Key management plan (Phase 7)

- Current: klucze wallet sa opcjonalne i wylaczone domyslnie.

- Gdy wlaczone:

  - `wallet_keys` przechowuje zaszyfrowane klucze per owner (AES-256-GCM).

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

5. Usunąć runtime logi (`hub.vkes_history` / `worker.action_log`) jako źródło prawdy.



### 19.9 Operacje (audit/compare)

- Szybki audit CLI:

  - `python ledger_audit.py` (weryfikacja hash + HMAC).

  - `WALLET_SIGNATURES_VERIFY=1 python ledger_audit.py` (dodatkowo podpisy per-owner).

- Porownanie runtime vs ledger:

  - `python ledger_compare.py --min-diff 0.01` (VKES domyslnie).

- Panel terminalowy:

  - `Admin Sync` -> `[8] Ledger audit`, `[9] Ledger compare`, `[10] Seed wallet keys`, `[11] Seed runtime state`, `[12] Seed ledger zero`.

- Gdy wlaczysz `wallet_signatures=1`:

  - wymagany `WALLET_KEK` i klucze w `wallet_keys` dla kazdego ownera.

  - przy `wallet_signatures_require_key=1` brak klucza = blad zapisu.

  - klucze generuj narzedziem: `python wallet_seed_keys.py --db kenya_courier.db`.

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



### 19.13 End-to-end przeplyw finansowy (Wodospad opłat)

W systemie caly kaskadowy podzial zyskow jest zapisany pod parametrem `payout_pct`. W pliku konfiguracji YAML ma on odrebne znaczenie w zaleznosci od galezi - inne dla Wlasciciela Huba, a inne jako ulamek przypisany do samego pracownika wewnatrz Huba. Dziala to zawsze kaskadowo jako dwojstopniowy Wodospad Oplat, eliminujacy reczne poprawki po stawkach.



1. **Platnosc Nadawcy / Finansowanie**:

   - wpis poczatkowy do ledgera. Wirtualne srodki zasilaja dany pakiet na start trasy poprzez pobrany debet od startowego huba na rzecz podanej waluty VKES/KES.

   - wpis do `wallet_ledger` z `entry_hash`, `prev_hash`, `hmac_signature`.



2. **Poziom pierwszy opłat: "Lokalny Hub <-> Franczyza/System" (`owner.payout_pct`)**:

   - Skonfigurowany na korzeniowym poziomie definicji samego Huba (`owner.payout_pct` w `hub_manifest.yaml`).

   - Podstawowa opłata pobrana za obsługę paczki w danym punkcie (czyli np. kwota `delivery_fee` = 30 VKES) dzieli sie procentowo wg tego mnoznika na dwie glowne czesci:

     - **„System Cut” (Prowizja Systemu):** Jesli hub w konfigu ma przypisane np. 80% zysku ze swojej prowizji (`owner.payout_pct: 80.0`), to System od razu zdejmuje nadrzedne 20% (6 VKES). Zostaje to bezposrednio zalogowane jako samodzielny zapis transferu w `hub_fee_system` - bezposrednio na wspolny bilans calej Firmy Matki (Centrali).

     - **„After Owner” (Pula dla Huba):** Uratowana na hubie resztkowa prowizja to pozostale 80% pierwotnej obnizki wartosci (24 VKES). Ta wlasnie baza budzetu dopiero teraz splywa bezszmerowo w dół na etap pracowniczy.



3. **Poziom drugi opłat: "Zysk Huba <-> Personel" (`staff.payout_pct`)**:

   - Drugi stopien ciec pod przypisana kwotę pracownika skladowany jest bezposrednio w zagniezdzonej wlasciwosci wewnatrz tablicy konfiguracyjnej z rozroznieniem na akcje logistyki (`staff: payout_pct: intake: 50, delivery: 50...`) - przypiete na sztywno do loginow dla uzytkownika skanera stacji.

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

- **Opcjonalna identyfikacja wlasciciela**: `wallet_signatures` per owner (zaszyfrowane klucze).

- **Gwarancje**:

  - spojnosc historii i mozliwosc audytu.

  - pojedyncze zrodlo prawdy (ledger).

  - czytelne, filtrowalne wpisy dla UI.

- **Ograniczenia**:

  - to nie blockchain publiczny; autoryzacja opiera sie o klucze serwera i polityke dostepu.

  - cofanie to zawsze **compensating entry**, nie usuwanie historii.



### 19.15 Odtworzenie systemu z PRD (skrót procesu)

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



Poniższe punkty przeniesione z `design_decisions.md`, aby PRD było jedynym źródłem prawdy:



1. **Admin‑Controlled Lifecycle**

   - Data: 2026-03-10 (przeniesione z design_decisions.md)

   - Tylko funkcje Admin/POC (np. `create_and_add_parcel`) generują i wprowadzają paczki do sieci.

   - Huby są pasywnymi węzłami magazynowymi i przetwarzającymi.



2. **Temporary “50 marker” (prowizyjny placeholder)**

   - Data: 2026-03-10 (przeniesione z design_decisions.md)

   - W wielu miejscach kodu używane jest `50` jako tymczasowa prowizja huba.

   - Cel: szybkie testy finansowe bez pełnej konfiguracji stawek.

   - Docelowo: pełne zastąpienie dynamicznymi lookupami stawek.



3. **Auto‑Login of Workers (tryb testowy)**

   - Data: 2026-03-10 (przeniesione z design_decisions.md)

   - Nowo utworzone huby mogą automatycznie logować pracowników.

   - W produkcji logowanie ma być manualne.

   - PIN-y w manifest/DB (manualny login):

     - manager: `AA1`, `BA1`, ... (code2 + `1`)

     - worker:  `AA2`, `BA2`, ... (code2 + `2`)

   - TUI: po wyborze opcji „Panel” system prosi o PIN i automatycznie wybiera hub powiązany z PIN-em.



4. **Legacy Greedy Router (benchmark)**

   - Data: 2026-03-10 (przeniesione z design_decisions.md)

   - Zachowany tylko do porównań z obecnym routingiem (Dijkstra/Yen).

   - Nie jest aktywnym mechanizmem routingu.



5. **Monitoring Visibility (SHOW_ALL_HUBS)**

   - Data: 2026-03-10 (przeniesione z design_decisions.md)

   - Domyślnie `network_status` filtruje puste huby dla czytelności logów.

   - Flaga `SHOW_ALL_HUBS` pozwala wymusić pełny widok.



## 19.17 Addendum (2026-03-12) - Package Events Format v2

- `event_type` removed from `package_events`.

- Classification: `amount = NULL` => tracking, `amount != NULL` => finance.

- `event_key` is the stable action key and is included in the hash payload.

- `entry_text` stores only missing data (no duplicated fields).

  - Tracking (payment_creation): `[BAG_OR_BOX][PATH_DETAILS][PAYMENT_MODE][ KM: x.x][KG:x.x]`

  - Finance payouts: `[{FROM}] -> [{TO}]` (no amounts in entry_text).

- Hash chain remains per package (seq is single chain per package).

- Docs updated: `event_entry_formats.md`, `package_event_catalog.md`, `tak wyglada zapis teraz zdarzen.md`.



## 19.19 Addendum (2026-03-16) - Walidacje przed `payment_creation`

- Przed wygenerowaniem wpisu `payment_creation` wykonywane są walidacje:

  - poprawność paczki (dane wejściowe, masa, route),

  - stan i blokady hubów (np. hub wyłączony / zablokowany),

  - dostępność środków (KES/VKES) zgodnie z trybem płatności.

- Walidacje te muszą wykonać się **przed** zapisem tracking/finanse, aby nie powstawały błędne wpisy.



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

     - VKES: zmniejsza saldo platnika (kuriera, jesli wybrany), system przyjmuje VKES (`event_key=vkes_sys`).

     - VKES: dodatkowy wpis finansowy w `package_events` (`payment_vkes_system`, `amount` > 0) jako baza fingerprintu.



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

   - Ostateczny wpis potwierdzajacy stan skarbonki paczki i moment wyzerowania salda przy wydawaniu (outtake).

   - Jesli zostala w paczce kwota nietypowa (+/-), \check_balance\ samo to wychwytuje i bezposrednio wysyla kwote do ledgera.

   - Usunieto logi \company_profit_unsettled\ / \company_loss_correction\, poniewaz operacje te wprost robi pole \check_balance\.

   - Zawsze konczy paczke z JSON metadata resultujaca 0.00.





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

- `transfer.from_id` = surowy `bag_id` (stary numer worka).

- `transfer.to_id` = nowy numer worka po sealed‑transit (ten, ktory czeka na kolejnego kuriera).



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

- `id` (PK), `package_id`, `seq`, `entry_text`

- `event_key`, `hub_code2`, `staff_id`, `amount`, `metadata_json`

- `entry_hash`, `hmac_signature`, `db_ts`

- UNIQUE(`package_id`, `seq`), FK -> `packages(id)`

- Indeksy: `idx_package_events_pkg_seq`, `idx_package_events_time`



**system_logs**

- `id` (PK), `db_ts`, `level`, `message`, `data_json`

- Indeks: `idx_system_logs_ts`



**staff_logins**

- `id` (PK), `staff_id`, `source`, `seq`, `db_ts`

- FK: `staff_id` -> `hub_staff(staff_id)` (uproszczony)

- Indeksy: `idx_staff_logins_staff_ts`, `idx_staff_logins_staff_seq`

- **Semantyka**: brak pola `action`. Stan wynika z parzystości `seq`:

  - `seq` nieparzysty = **login**

  - `seq` parzysty = **logout**

- `source` służy do zapisu źródła logowania (np. `tui`, `web`, `api`; w przyszłości także IP jeśli dostępne).

- **Runtime**: przy starcie odczytuje `staff_logins` i odtwarza stan `active_workers` / `logged_in_manager`

  na podstawie ostatniego `seq` per `staff_id` (bez tworzenia nowych tabel).



**hub_inventory (BAG_STOCK)**

- `hub_code2`, `inv_type` (BAG_STOCK), `meta_json` (count), `db_ts`



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

- `pos`, `db_ts`



**hub_ready_pickup**

- PK (`hub_name`, `package_id`)

- `pos`, `db_ts`



**wallet_ledger**

- `id` (PK), `owner_id`, `package_id`, `currency`, `seq`

- `amount`, `balance`

- `entry_hash`, `hmac_signature`

- `entry_text`, `event_key`, `metadata_json`, `from_owner`, `fingerprint`, `db_ts`

- UNIQUE(`owner_id`, `currency`, `seq`)

- Indeks: `idx_wallet_ledger_fingerprint`



**wallet_signatures**

- `id` (PK), `owner_id`, `currency`, `seq`, `key_id`, `signature`, `db_ts`

- UNIQUE(`owner_id`, `currency`, `seq`)



**wallet_keys**

- `id` (PK), `owner_id`, `key_id`, `nonce`, `ciphertext`, `is_active`, `db_ts`

- UNIQUE(`owner_id`, `key_id`)



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

- **Bonus Magnetyzm (konsolidacja)**: Trasa jest oceniana pod kątem możliwości połączenia z innymi workami jadącymi w tym samym sektorze.

  - Zniżka wynosi bazowo **-80 pkt** dla węzłów pośrednich (co fizycznie może stakować się dwukrotnie na wejście i wyjście, jeśli na hubie 'B' leży worek = -160 pkt).

  - Worek pochodzący ze stacji startowej (`is_start_edge=True` uaktywnia `bag_at_a=True`) automatycznie aplikuje pełną, podwójną zniżkę **-160 pkt**! Zabieg ten wyrównuje magnetyzm u źródła, sprawiając że nowe paczki naturalnie i równie agresywnie "sklejają" swoje trasy od samego startu z paczkami podróżującymi "obok", bez nienaturalnego blokowania na podstawie odległości.

- Finalny koszt: `max(10, int(cost))` (dla wartosci skonczonych).



**Skip-Hop (AssignmentEngine)**

- System automatycznie bada możliwość wykonania tzw. "przeskoku", omijając węzeł po drodze i jadąc bezpośrednio do kolejnego.

- Aktywator wymaga ścisłej rygorystyczności (`Strict All-Match`): Zniżkę i szlak omijający można otrzymać WYŁĄCZNIE wtedy, kiedy **absolutnie każda** paczka w wirtualnym zlewku/worku ma punkt `hop2` jako kolejny węzeł na swojej teoretycznej mapie. 

- Jeśli jakakolwiek paczka w zaplombowanym worku ma punkt pobytu i wyładowania na lokalnym docelowym hubie (`next_h`), skip-hop zostaje automatycznie ZABLOKOWANY, pozwalając na poprawny transport bez jeżdżenia paczek na około. Decyzja nie zależy już od pierwszej paczki z brzegu w worku (`sample_parcel`), ale analizuje sumiennie całą jego zawartość.

- **Współistnienie Worków (Ko-Konsolidacja na Bieżącym Węźle):** Rozwiązuje problem "ślepoty drugiego huba". Pakiety znajdujące się dopiero na 1 punkcie (startowym) korzystają swobodnie z agresywnego magnesu (-160) łącząc drogi obok siebie. Jednak torba na węźle tranzytowym odcinała się od węzła skupiając się tylko na możliwości skrótu. Giełda została więc o to rozbudowana i precyzyjnie likwiduje ofertę przeskoku, jeśli fizycznie tuż obok kuriera na aktualnym peronie (np. *PA*), znajduje się inny samotny worek pragnący podjechać we to samo omijane dawniej miejsce, wymuszając z nim wspólny rejs. Podobne sprawdzenie odbywa się również dla sąsiedniego węzła, który kurier podjąłby się ominąć (`next_h`).



**Dijkstra**

- Standardowy Dijkstra po sasiedach z `edge_cost`, respektuje `excluded_edges` i `excluded_nodes`.

- Zwraca trase obiektow hubow + koszt calkowity.



**Routing Strategy B (get_optimal_route)**

- Najpierw trasa Dijkstra.

- Jezeli brak "magnetyzmu" (konsolidacji), wybiera alternatywny sektor (lewy/prawy) i probuje trase startujaca z alternatywnego sasiada, jesli istnieje.



### 19.21.3 Worki i sealed-transit

**Bag ID**

- Worek dostaje realny numer w momencie otwarcia w danym kierunku (lokalny mark + licznik RFC4648, modulo 32).



**Dodanie paczki do worka**

- `add_parcel_to_storage` wybiera worek na podstawie kierunku i stanu.

- Jeśli w kierunku nie ma otwartego worka, system automatycznie otwiera nowy, nadaje mu numer i wkłada paczkę.

- Jeśli worek w tym kierunku był zamknięty, a pojawia się nowa paczka, tworzy się nowy worek z nowym numerem.



**Sealed transit**

- Jesli wszystkie paczki w worku maja ten sam `next_common_hop`, worek zostaje sealed i nie jest otwierany.

- Zmiana ID przy sealed:

  - Bag: `old_id + local_mark` (np. `GA` -> `GAA`).

  - Box: `base_id-sector` (np. `X7-2`).



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

**Tracking-only (amount = NULL gdy brak finansow)**

- `payment_creation`, `intake`, `courier`, `courier_bonus`, `sorting`, `transfer`,

  `outtake`, `delivery`, `check_balance`, `route_change_job`.



**Finance-linked (amount != NULL)**

- `payment_vkes_system`, `hub_fee_*`, `courier_*`, `company_profit_*`, `system_top_up`, `transport_payout`.



### 19.21.6 Schemat `metadata_json` (kluczowe eventy)

**payment_creation**

- `path_details`, `payment_mode`, `km`, `weight`.



**intake**

- `balance`, `source_id`, `bag_id`, `staff_id` (balance na poczatku).



**courier / courier_bonus**

- `balance`, `from_hub`, `to_hub`, `km`, `bag_id`, `container_type`, `courier_id`.



**sorting**

- `container_type`, `container_id`, `dir_sector`, `from_hub`.



**transfer**

- `from_id` (bag_id), `to_id` (nowy numer worka po sealed), `hub`.



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



## 21. Migrated Agent Briefing (2026-03-10)



### 21.1 Kontekst projektu (skrót)

- System symuluje sieć kurierską w Nairobi.

- Paczki są transportowane przez huby, finansowane w VKES.

- Firma zarabia na optymalizacjach (skip-hop, sealed transit).

- Globalny licznik zysku firmy: `total_optimization_savings`.



### 21.2 Kluczowe pliki (operacyjnie)

- `courier_logic_poc.py`: logika biznesowa (paczki, worki, routing, finanse).

- `flask_server.py`: HTTP API, wywołuje logikę i zwraca JSON.

- `event_service.py`: SSE (push zdarzeń do frontendu).

- `parcel_service.py`: walidacja i tworzenie paczek.

- `hub_service.py`: włączanie/wyłączanie hubów i pracowników.



### 21.3 Transport i routing (skrót)

- Paczki są przewożone w **workach** (`Bag`) kierunkowych.

- Routing: Dijkstra, tryby:

  - `theoretical=True` → wycena i pełna sieć.

  - `theoretical=False` → realny transport (tylko aktywne huby).

- AssignmentEngine generuje **dwie decyzje** dla każdego worka:

  - normalna (najbliższy hub na trasie),

  - skip-hop (ominięcie jednego huba, bonus +50 VKES).

  To zachowanie jest zamierzone (kurier wybiera jedną).



### 21.4 Naprawione błędy (historyczne)

1. **Routing przez offline hub**  

   `add_parcel_to_storage()` używało `theoretical=True`.  

   Zmienione na `theoretical=False` (trasa realna).

2. **Niepełna mapa połączeń w UI**  

   `Hub.to_dict()` brał tylko sąsiadów teoretycznych.  

   Zmieniono na UNION teoretycznych i aktywnych.

3. **Zła trasa w `create_and_add_parcel()`**  

   Zwracało trasę teoretyczną; teraz zwraca trasę rzeczywistą paczki.

4. **Podwójne rozliczenie paczki** (`api_apply_job`)  

   Odrzucenie worków już zabranych przed `apply_assignment`.

5. **Brak księgowania resztkowego salda paczki**  

   Po `apply_assignment` wywoływany auto-odbiór dostarczonych paczek.



### 21.5 Zasady których nie zmieniać

- Dwie decyzje z AssignmentEngine są celowe (skip + normal).

- `theoretical=True` w planowaniu jest poprawne; wyjątek to `add_parcel_to_storage`.

- Blok rozliczania assetów w `apply_assignment` (AST) nie dotyczy paczek.



### 21.6 Przykładowy przepływ finansowy paczki (skrót)

```

Nadanie (KES)           +654.00 VKES

Skip-hop P2->P5         -274.00 VKES

Firma skip-profit         +6.00 VKES

Sealed transit P5        +40.00 VKES

Transport P5->P7         -224.00 VKES

Delivery fee P7          -30.00 VKES

deliver_to_customer      +20.00 VKES

Saldo końcowe:            0.00 VKES

```



## 22. Agent Review Notes (2026-03-10)



### 22.1 Najważniejsze odpowiedzi (skrót)

1. **Kierunki w PRD**: 9 to błąd; realnie 8 (0–7).

2. **`add_parcel` i start=end**: gałąź zostaje jako bezpiecznik.

3. **`ledger_compare` vs `ledger_runtime_compare`**: jedna logika źródłowa, wrappery.

4. **`try/except Exception` przy importach**: docelowo `ImportError` + hard-fail.

5. **Backfill z `entry_text`**: ryzykowny; preferować `metadata_json`.

6. **`INSECURE_DEV_KEY`**: dev OK, prod musi być hard-fail.

7. **`get_app_setting` w dwóch miejscach**: preferowana jedna funkcja w `db_storage`.

8. **`ledger_seed` tylko gdy pusty**: świadoma polityka bezpieczeństwa; opcja “seed missing” do rozważenia.

9. **Dual-write**: jeden writer + testy zgodności, rollback = stop migracji.

10. **`courier_logic_poc`**: docelowo do refaktoru (SimulationContext).

11. **`financial_audit`**: powinien ostrzegać, gdy `ledger_read=0`.



### 22.2 Wyjaśnienie `owner_type` / `owner_id` (ledger)

Przykład wpisu:

```

owner_type: "hub"

owner_id: "DA"

```

Znaczenie:

- `owner_type` = typ konta (hub/worker/manager/courier/system).

- `owner_id` = identyfikator z manifestu (np. hub `DA`, worker `W-DA-P1`, courier `C-DA-1`).



### 22.3 Modele podpisu w ledgerze (3 warianty)

1. **HMAC‑only (obecny)**  

   Jeden klucz serwera (`VKES_HMAC_KEY`) podpisuje całą historię.

2. **HMAC + per‑konto signatures (docelowy w systemie)**  

   Serwerowy HMAC + klucze per‑owner w `wallet_keys`.

3. **Model seed/mnemonic (krypto)**  

   Osobny system (seed → public/private keys), inna architektura.



### 22.4 Terminologia bezpieczeństwa

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



**Pełny snapshot (tylko gdy potrzebny):**

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

| Hub local_name | A | DB | cache w runtime | Nie | przy zmianie/auto-przydziale |

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

5. Commit-keys zapisują natychmiast (bez debouncingu), aby zachować real-time.

6. Usuwamy podwojne snapshoty w tych samych punktach (np. job_market -> apply_assignment).

7. Dlugie operacje (np. apply_assignment) blokują autosave w trakcie i robią jeden snapshot na końcu.



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





## Addendum (2026-04-04) – Runtime → DB Refactor (plan + stan końcowy)



### Cel

- DB jest jedynym źródłem prawdy.

- Runtime = cache + obiekty robocze (bez utrzymywania stanu finansowego i historii poza DB).

- Flask i Terminal korzystają z tych samych zapisów/odczytów.



### Zakres (co przebudowaliśmy)

- Runtime stanu paczek/worków/hubów działa wyłącznie jako cache (odtwarzany z DB).

- Usunięcie legacy: `global_profit_history`, runtime wallet logs, `payment_history` jako źródło prawdy.

- Zmiana przepływów w Flask i Terminal tak, by po każdej zmianie stanu zapisywać do DB i odświeżać cache.



### Zasady nienaruszalne (NIE ZMIENIAĆ LOGIKI)

- Kolejność: tracking (`package_events`) → fingerprint → `wallet_ledger` musi zostać taka sama.

- Wzory naliczania (p_share, courier_bonus, company_profit_surplus, skip_surplus, hub_fee) bez zmian.

- Te same `event_key` i ta sama kolejność wpisów w `package_events` oraz `wallet_ledger`.

- Refactor dotyczy tylko warstwy I/O (zapis/odczyt/odświeżanie cache).



### Etapy (status na dziś)



**Etap 0: Inwentaryzacja**

- [x] Spis struktur runtime-only i zależności UI.

- [x] Mapa miejsc zapisu do DB i miejsc tylko runtime.



**Etap 1: Jednolity reload runtime z DB**

- [x] Wspólna funkcja reload (Flask i Terminal) zawsze z `in_transit_bags`.

- [x] Runtime po reloadzie = stan w DB (bags, bag_parcels, hub_ready_pickup, hub_inventory:BAG_STOCK).

- [x] Blokada tworzenia runtime bez zapisu do DB.



**Etap 2: Usunięcie legacy finansów w runtime**

- [x] `global_profit_history` → no-op i potem usunięte logowanie.

- [x] `add_system_profit_delta()` usunięte (było no-op).

- [x] `payment_history` w Parcel nie jest źródłem prawdy (UI czyta z DB).

- [x] runtime wallet logs → no-op.



**Etap 3: Ready-for-pickup tylko z DB**

- [x] `hub.ready_for_pickup` jako cache z `hub_ready_pickup`.

- [x] Dodawanie/usuwanie = zapis do DB + reload cache.

- [x] Usunięte bezpośrednie dopisywanie bez zapisu.



**Etap 4: Worki i tranzyt**

- [x] Worki w hubach i w tranzycie tylko z DB (`bags` + `bag_parcels`).

- [x] `IN_TRANSIT_BAGS` jako cache ładowany z DB i zapisywany przy zmianach.

- [x] Po operacji worka (seal/transfer/arrive) zapis do DB + reload runtime.



**Etap 5a: Synchronizacja Flask ↔ Terminal (DB-only)**

- [x] DB jako źródło prawdy, runtime tylko cache.

- [x] Po każdej zmianie stanu: zapis do DB + odświeżenie cache w obu procesach.

- [x] Sygnalizacja odświeżeń po commitach DB: **SSE/zdarzenia**, bez pollingu.

- [x] UI w Flask i Terminal reaguje na sygnały bez konfliktów.



**Etap 5: Logowanie pracowników**

- [x] Stan loginu z DB (`staff_logins`), runtime tylko odczyt.

- [x] Usunięty auto-login jako fallback.



**Etap 6: Porządki i usunięcie nieużywanego kodu**

- [x] Usunięte nieużywane zapisy do `global_profit_history`.

- [x] Usunięte wywołania `add_system_profit_delta`.

- [x] Runtime wallet logs i `payment_history` pozostają jako no-op (bez wpływu na DB).



**Etap 7: Walidacje i testy**

- [x] `runtime_db_audit.py` — runtime vs DB (liczniki).

- [x] `runtime_restart_audit.py` — zgodność po reset+reload.

- [x] `runtime_flow_audit.py` — przepływ zdarzeń paczki.

- [x] `runtime_finance_audit.py` — spójność fingerprintów `package_events` ↔ `wallet_ledger`.



### Notatki o kolejności zapisu (kluczowe)

- Tracking → `package_events` → fingerprint → `wallet_ledger`.

- Bez bufora: dopuszczalne różnice czasów o ms, ale kolejność logiczna zachowana.



### Ryzyka (zostają)

- Zbyt agresywne usuwanie runtime list (UI musi mieć źródło w DB).

- Duże obciążenie DB przy każdym reloadzie (w razie potrzeby cache/partial refresh).

## Addendum (2026-04-04) ? Package Events + Ledger Map

# Powiazania: package_events <-> wallet_ledger <-> inne tabele



Ten dokument opisuje, jakie zdarzenia paczki generuja wpisy w `package_events`,

jakie wpisy finansowe trafiaja do `wallet_ledger`, oraz gdzie sa powiazania z innymi tabelami.



## Zasada fingerprint

- `wallet_ledger.fingerprint` = **pelny `entry_hash`** ostatniego wpisu trackingowego w `package_events`.

- Kolejnosc: **tracking -> zapis `package_events` -> `entry_hash` -> wpis w `wallet_ledger`**.

- Ledger **nie dopina fingerprintu pozniej**.



## Mapowanie zdarzen (tracking -> ledger)

- `payment_creation` (tracking) -> ledger: `kes_cre` (KES) lub `vkes_sys` (VKES).

- `payment_vkes_system` (tracking) -> ledger: `vkes_sys` (SYSTEM).

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

Ponizsza sekcja opisuje stan wdrozenia na podstawie aktualnego kodu (`courier_logic_poc.py`, `terminal_ui.py`, `flask_server.py`, `db_storage.py`).

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

### B) MIGRATION_SINGLE_FLOW_PLAN.md - stan wdrozenia

Wdrozone:
- Wspolny kontrakt backend:
  - `build_parcel_request(...)`
  - `compute_parcel_preview(...)`
  - `submit_parcel_request(...)`
- TUI korzysta z backendowego flow (preview + submit).
- Flask korzysta z tego samego flow:
  - `POST /api/add_parcel`
  - `POST /api/parcel_preview`
- Ujednolicenie logiki tworzenia paczki i walidacji.

Uwaga:
- `parcel_service.py` nadal istnieje jako warstwa kompatybilnosciowa (legacy helper), ale kluczowy flow idzie przez wspolny kontrakt couriera.

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
- `submit_parcel_request(...)` pobiera `base_value` z wyceny zaawansowanej i przekazuje do tworzenia paczki.

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
- W kodzie nadal wystepuja wywolania `persist_runtime_snapshot(...)` w punktach operacyjnych (to zgodne z "checkpoint commit", ale nie jest pelnym przejsciem na wyłącznie granularne commity per tabela).
- Dalsza optymalizacja "minimal row writes only" pozostaje obszarem iteracji.

### F) Spójnosc „drogi do celu” i event flow (aktualny stan)

Potwierdzony obecny flow paczki:
- `payment_creation` -> `intake` -> `courier` -> `sorting/transfer` -> `outtake` -> `delivery` -> `check_balance`

Dla asset:
- finalizacja biznesowa i inventory na `outtake` (bez oczekiwania na odbior klienta),
- tracking/ledger pozostaja spiete przez obecny model eventów i fingerprintów.

## PRD Update 2026-04-12 (Asset + Inventory + Route Flow)

Ostatnia duza aktualizacja PRD przed tym wpisem byla z dnia pliku: **2026-04-05**.
Poniżej zebrane zmiany z ostatnich dni po migracjach runtime/DB i wdrozeniach w kodzie.

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
  - dla assetu domkniecie następuje na **outtake** w hubie docelowym (nie czeka na customer `delivery`),
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
- Format czasu jest UTC (`...Z`), co moze dawac roznice względem czasu lokalnego.

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
- `submit_parcel_request(...)` pobiera `price_base` z `preview_package_pricing(...)`
  i przekazuje jako `base_value` do tworzenia paczki.

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

Ta sekcja opisuje wdrożenie zunifikowanego systemu zarządzania inwentarzem (worki, skrzynki) oraz automatyczny mechanizm utrzymywania równowagi zasobów w sieci.

### 1. Konsolidacja Inwentarza (Inventory Consolidation)
Wycofano przestarzałą tabelę `hub_runtime_state`. Wszystkie zasoby fizyczne są teraz zarządzane przez centralną tabelę `hub_inventory`.
- **Worki (BAG_STOCK)**: Przechowywane jako zasób zbiorczy typu `BAG_STOCK`. Stan liczbowy huba znajduje się w polu `meta_json`. Worki są anonimowe.
- **Skrzynki (ASSET/BOX)**: Każda skrzynka posiada unikalny `inv_code` i jest śledzona indywidualnie.
- **Zakresy Kodów**: 
  - `0-1023`: Assety sprzętowe (drukarki, skanery).
  - `1024+`: Skrzynki (Boxy).
  - `90000+`: Wirtualne kody dla inwentarza worków.

### 2. Mechanizm Ciągłego Rebalansingu (Continuous Stabilization)
System został zaprojektowany tak, aby dążyć do naturalnej równowagi zasobów w każdym punkcie sieci, bez konieczności ręcznego definiowania sztywnych limitów.

#### Zasady działania:
- **Algorytm Połowy Różnicy (Half-Diff)**: Przy każdym transporcie z Huba A do Huba B, system wylicza różnicę stanów. Przesyłana jest połowa tej różnicy, co zapewnia najszybszą stabilizację przy minimalnej liczbie operacji.
- **Automatyczne Worki (Folded Rebalance)**:
  - Puste worki są "ukryte" wewnątrz aktywnego transportu (`empty_bags_carried`).
  - Są niewidoczne jako osobne paczki, ale ich liczba jest rejestrowana w TUI (znacznik `+Nw`).
- **Fizyczne Skrzynki (Box Rebalance)**:
  - Jeśli Hub docelowy ma mniej skrzynek, system automatycznie "doczepia" puste skrzynki do kuriera.
  - Skrzynki są wybierane losowo z puli Huba startowego (`inv_code`).
  - Zachowują swoją tożsamość przez cały transport i są przyjmowane w celu jako aktywne zasoby.

### 3. Zasady Operacyjne i Interfejs
- **Widoczność Giełdy**: Krawędzie tras na giełdzie (`Marketplace`) wyświetlają zapotrzebowanie na skrzynki ikoną 📦 oraz liczbę dodatkowych worków.
- **Pojemność Kuriera**: System rebalansowania skrzynek respektuje maksymalną pojemność kuriera, wykorzystując tylko wolne sloty transportowe.
- **Unloading Logic**: Przyjęcie transportu automatycznie rozpakowuje zasoby rebalansujące do lokalnego inwentarza huba docelowego, aktualizując ich lokalizację w bazie danych.


---

## 22. Bag Events Flow — Pełna sekwencja zdarzeń worka (2026-05-17)

### 22.1 Sekwencja statusów worka (bag_events)

Każdy worek przechodzi przez następujące statusy, logowane w tabeli `bag_events`:

```
OPEN → SEALED → RESERVED → LOADING → IN_TRANSIT → RECEIVED → (TRANSFER/SORTING/OUTTAKE) → ARCHIVED
```

| Status | Kto wywołuje | Co się dzieje |
|--------|-------------|---------------|
| OPEN | Hub (auto przy nadaniu paczki) | Worek otwarty, przyjmuje paczki |
| SEALED | Hub (auto przy pełnym worku lub ręcznie) | Worek zamknięty, gotowy na giełdę |
| RESERVED | Kurier (bierze zlecenie z giełdy) | Worek zarezerwowany, timer 30min |
| LOADING | System (dispatch) | Cargo rebalancing (puste worki/skrzynki ładowane) |
| IN_TRANSIT | Kurier (rusza w trasę) | apply_assignment — finanse kuriera naliczane |
| RECEIVED | Pracownik huba docelowego | Worek dotarł, czeka na sortowanie |
| TRANSFER | Pracownik (strzałka prawo) | Worek jedzie dalej (sealed, nowe ID) |
| SORTING | Pracownik (strzałka prawo per paczka) | Paczki rozdzielane do nowych worków |
| OUTTAKE | System (paczka dotarła do celu) | Paczka trafia do ready_for_pickup |
| ARCHIVED | System (worek pusty po sortowaniu) | Worek usunięty z DB, inwentarz +1 |

### 22.2 Flow w TUI (panel Przyjęcie/Tablica)

1. Worek IN_TRANSIT pojawia się pod kurierem `🚚[C-XX-1]`
2. Pracownik naciska strzałkę prawo (x2) → status RECEIVED
3. Cargo (puste worki/skrzynki) musi być zatwierdzone PRZED sortowaniem:
   - Strzałka prawo (x2) na `🎒+N` → dodaje worki do stanu huba → 🆗
   - Strzałka prawo (x2) na `🧃[XXX]` → aktywuje skrzynkę w hubie → 🆗
4. Po zatwierdzeniu cargo, paczki mogą być sortowane:
   - Strzałka prawo (x2) na paczce → sorting do worka → `[→ BCD]` (ID worka)
   - Gdy zostają paczki w jednym kierunku → worek auto-promote do TRANSFER
5. Transfer worka:
   - Strzałka prawo (x2) na worku z `[TRANSFER → G]` → sealed, nowe ID
   - Paczki dostają `[BUF → BUFF]` (stary ID → nowy ID)
6. Drzewo NIE jest przebudowywane — wszystkie zmiany in-place (set_label)
7. Wpisy zostają widoczne do opuszczenia trybu przyjęcia

### 22.3 Flow w Flask (fast_flow)

Flask `/api/apply_job` wykonuje pełny cykl w jednym kroku:

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

### 22.4 Cargo (puste worki/skrzynki) — rozładowanie

- **TUI:** Ręczne zatwierdzenie (strzałka prawo x2 na cargo node). Blokada sortowania/transferu dopóki cargo nie zatwierdzone.
- **Flask:** Automatyczne rozładowanie przy RECEIVED (`auto_unload_cargo=True`).
- **Rebalancing:** `dispatch_set_loading` automatycznie ładuje cargo do worka na podstawie `_calculate_rebalance_needs` (różnica stanów między hubami).

---

## 23. Poprawki Flask — Spójność i Optymalizacja (2026-05-17)

### 23.1 Naprawione problemy spójności

1. **Silent mode bug** — `apply_assignment` w `LOG_MODE="silent"` (Flask) wywoływał `reload_runtime_topology_from_db()` po `ready_changed`, co nadpisywało runtime balance starymi danymi z DB. Usunięte.
2. **km_rate nadpisywanie** — `_rebuild_runtime_parcel_metrics()` (wywoływana przez reload) przeliczała `km_rate` dynamicznie z aktualnego balance zamiast zachować stałą z kreacji. Usunięte reloady z flow transportu.
3. **system_subsidy w delivery** — Flask sztucznie doładowywał balance do 20 VKES przed delivery. Usunięte — check_balance pokazuje surowe dane.
4. **Brak persist po auto-delivery** — delivered paczki nie były zapisywane do DB. Dodany `commit_runtime_operation`.
5. **Brak persist po toggle_bag_status** — zmiana statusu worka nie przetrwała restartu. Dodany `commit_runtime_operation`.

### 23.2 Optymalizacje

1. **Usunięty `reload_runtime_topology_from_db()`** z `tui_send_created_package` — nie przelicza Dijkstry dla wszystkich paczek po nadaniu.
2. **Usunięty reload z pętli** w `market_apply_loading_status` — nie nadpisuje km_rate per bag.
3. **`_persist_topology_db`** — flush ledger tylko dla paczek z pending entries (nie ALL).
4. **Login/logout** — `commit_runtime_operation` zamiast `commit_full_operation` (lżejszy).
5. **`api_hubs_add/move`** — poprawiona kolejność: persist → recalculate (nie odwrotnie).
6. **Usunięty `_recolor_local_names`** z login/logout (login nie zmienia topologii).
7. **Usunięte martwe funkcje** — `_package_code4_map`, `_format_wallet_text`, `_normalize_wallet_history_entry`.

### 23.3 Zasada: Flask = TUI

- Flask fast_flow używa `apply_market_job(defer_arrival=False)` — ta sama funkcja co TUI.
- Jedna ścieżka finansowa — brak rozbieżności w naliczaniu kwot.
- `dispatch_set_loading` wywoływane wewnątrz `apply_market_job` (cargo rebalancing).
- `auto_unload_cargo=True` tylko w Flask (TUI wymaga ręcznego zatwierdzenia).

---

## 24. Panel Odbioru Paczki — Uproszczone hasło (2026-05-17)

### 24.1 Format `pickup_auth` w DB

Pole `pickup_auth` w tabeli `packages` przechowuje:
- `""` (pusty) = brak hasła → wydaj bez pytania
- `"ID:"` = weryfikacja po danych osobowych odbiorcy (imię+nazwisko)
- `"Phone:"` = weryfikacja po telefonie
- `"Email:"` = weryfikacja po emailu
- **Cokolwiek innego** = to jest hasło, trzeba je podać przy odbiorze

### 24.2 Flow odbioru (TUI)

1. Pracownik wchodzi w tryb "Szukaj" (opcja 1)
2. Wpisuje ID paczki (4 znaki)
3. System sprawdza `pickup_auth`:
   - Pusty lub etykieta (ID:/Phone:/Email:) → auto-verify, wydaj bez pytania
   - Tekst hasła → pracownik musi wpisać hasło, system porównuje
4. Po weryfikacji: strzałka prawo (x2) → `deliver_to_customer`

### 24.3 Rehydracja paczki z DB

Gdy paczka jest w `hub_ready_pickup` (DB) ale nie w `TRACKED_ITEMS` (runtime):
- `get_ready_for_pickup()` automatycznie odbudowuje obiekt Parcel z DB
- Ładuje: balance, pickup_auth, receiver data, last_event_hash
- Dodaje do `TRACKED_ITEMS` — delivery może działać normalnie

---

*Dokument zaktualizowany: 2026-05-17*
*Status: Flask/TUI spójność naprawiona, panel przyjęcia z in-place updates*

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
   - Najpierw uruchamiany jest podglad/validacja `submit_parcel_request(..., dry_run=True)`.
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
   - Po wyborze metody platnosci (`KES` albo `VKES`) i opakowania TUI wykonuje drugi przebieg `submit_parcel_request(..., dry_run=False)`.
   - Ten drugi przebieg ponownie sprawdza dane.
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
   - flow push/polling dla `VKES`,
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
   - polling push idzie przez `get_next_pending_push_for_payer`,
   - zamykanie intentu po udanym submit idzie przez `mark_intent_settled_external`
     (status/package binding, bez dodatkowego wpisu ledger),
   - Flask korzysta z tego samego bridge helpera, gdy dostanie `payment_intent_id`.

4. HMAC i audit:
   - wpisy ledger z `finance_core` zapisują `hmac_key_id` (aktywny klucz z `hmac_keys` albo `ENV_DEFAULT`),
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
   - `actor_id` wskazuje osobe/system, ktory ma dostep. Dla ludzi docelowo jest to `persons.person_id`, nie `client_id` ani `hub_staff.staff_id`.
   - `actor_type` okresla typ aktora: `client|staff|system`.
   - `access_role` opisuje role operacyjna: `owner|guardian|cashier|operator|viewer|auditor|system`.
   - Flagi uprawnien okreslaja akcje: `can_view`, `can_transfer`, `can_cash_in`, `can_cash_out`, `can_mint`, `can_manage_access`.
   - `is_active`, `valid_from`, `valid_to`, `db_ts` okreslaja aktywnosc i okres obowiazywania dostepu.

3. Bezpieczenstwo finansow ma dwie warstwy.
   - Warstwa 1: kontrola w kodzie i flow aplikacji (logowanie, wybrany hub, ekran, akcja, aktualny actor).
   - Warstwa 2: kontrola w DB przez aktywny wpis `wallet_account_access` dla `actor_id + account_id + permission`.
   - Operacja finansowa musi przejsc obie warstwy.

4. `wallet_accounts` i `wallet_account_access` sa rozdzielone.
   - `wallet_accounts` mowi, jakie konta istnieja i do jakiego technicznego ownera/zakresu naleza.
   - `wallet_accounts.owner_person_id` wskazuje osobe profilu tam, gdzie konto jest osobowe/biznesowe/systemowe.
   - `wallet_account_access` mowi, kto moze widziec albo uzyc konkretnego konta.
   - Wlasciciel konta i osoba uprawniona do operacji to nie zawsze ta sama osoba.

5. Przyklady dostepu:
   - pracownik huba jako kasjer: `actor_id=PCWBAI`, `account_id=VKES_AA_OPERATING`, `can_transfer=1`,
   - pracownik huba jako podglad: `can_view=1`, `can_transfer=0`,
   - opiekun dziecka: `actor_id=PFAAAK`, `account_id=PJOA7K-MAIN`, `access_role=guardian`.

6. Centralni aktorzy systemowi sa zapisywani w `hub_staff` z technicznym hubem `SYSTEM`.
   - Przyklady: `BOSS`, `CEO`, `COO`, `CFO`, auditor, support.
   - `system_users` nie jest juz aktywnym modelem operacyjnym i nie jest tworzone przez nowy seed.
   - Operator mint jest czlowiekiem/central staff z grantem `can_mint=1`, a nie anonimowym wpisem systemowym.
   - Wlasciciel huba operacyjnie jest obslugiwany przez `hub_staff(role='owner')`.
   - Hub nadal jest ownerem finansowym swoich kont (`wallet_accounts.owner_id = AA`, `BA`, itd.).
   - Dostep wlasciciela do kont huba wynika z `wallet_account_access`, gdzie `actor_id = persons.person_id` osoby podlinkowanej przez `hub_staff.person_id`.

7. `hub_manifest.yaml` zawiera `owner.id`.
   - Format ID wlasciciela huba: `O + HUB_CODE2 + INICJALY + SEQ_BASE32 + CHECKSUM`.
   - Przyklad: `OAAUFAH`.
   - Ten sam czlowiek posiadajacy kilka hubow moze miec osobne operacyjne ID per hub.
   - Synchronizacja manifestu tworzy/aktualizuje `persons` dla ownera/personelu oraz `hub_staff(role='owner')`.
   - `persons.person_id` nie jest generowany ze `hub_staff.staff_id`; ma format profilu osoby, np. `PJOA7K`.
   - `hub_staff` przechowuje role operacyjna w hubie, `staff_id`, PIN i parametry huba; dane personalne sa powiazane przez `hub_staff.person_id`.
   - Synchronizacja danych personalnych personelu jest jednokierunkowa: `hub_manifest.yaml -> persons`.
   - Manifest nie synchronizuje wszystkich klientow i nie przenosi hasel; hasla sa w `persons.password_hash/password_salt`.
   - `db_storage` nie tworzy osob z `hub_staff`; moze tylko naprawic brakujace `hub_staff.person_id`, jesli pasujacy rekord juz istnieje w `persons`.
   - Synchronizacja nadaje wlascicielowi dostep do kont `KES` i `VKES` danego huba przez `wallet_account_access` z `actor_id = person_id`.

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
   - Pola wymagane w manifest: `id`, `owner_name`, `owner_surname`, `pin`, `vkes_debit_limit`.

2. Owner nie aktywuje huba logistycznie.
   - Owner nie trafia do `active_workers`.
   - Owner nie powinien wplywac na mape, trasy, gielde ani dostepnosc operacyjna huba.
   - Jezeli owner chce pracowac jako manager/worker, musi miec osobne konto operacyjne.

3. Logowanie ownera jest audytowane.
   - Kazda proba logowania ownera daje wpis do `system_logs`.
   - Ponowne logowanie, gdy poprzedni stan byl `logged in`, zapisuje wymuszony `logout` i nowy `login`.
   - Wyjscie z panelu ownera zapisuje `logout`.

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
   - `package_status_json`, `package_tags` i `package_tag_presets_json` obsluguja prefiksy widocznosci:
     - `£Nazwa` - ukryte dla panelu huba/TUI, widoczne dla panelu klienta jako `Nazwa`,
     - `$Nazwa` - ukryte dla panelu klienta, widoczne dla panelu huba/TUI jako `Nazwa`.
   - Prefiks widocznosci jest metadana konfiguracji. Po odczycie system zdejmuje prefiks i do logiki paczki trafia czysta wartosc.
   - Prefiksy dzialaja tak samo dla statusow, tagow i presetow tagow, np. `"$Koperta"` w `package_tag_presets_json` ukrywa preset `Koperta` przed klientem.
   - Statusy sa lista zamknieta definiowana przez admina w `package_status_json`. Uzytkownik nie moze dopisac nowego statusu ani w TUI, ani w panelu klienta.
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

2. Seed runtime (DB-only) w `hub_inventory`:
   - rekordy `inv_type='BAG_STOCK'` (po jednym na hub) z domyslna liczba workow.

3. Seed finance baseline:
   - `wallet_accounts` (konta domyslne dla ownerow),
   - `hub_staff(role='owner')` (wlasciciele hubow z `hub_manifest.owner.id`),
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
   - `payer_owner_id`, `payer_account_id` - kto placi i z ktorego konta,
   - `payee_owner_id`, `payee_account_id` - kto przyjmuje i na ktore konto,
   - `amount`, `currency`, `method`,
   - `reason`, `note`, `package_id`,
   - `created_by` - kto utworzyl intent.

4. Statusy uzywane w panelu klienta:
   - `awaiting_push` - powiadomienie czeka na decyzje,
   - `authorized` - decyzja pozytywna/autoryzacja wykonana,
   - `settled` - platnosc rozliczona i wpisana do `wallet_ledger`,
   - `rejected` - odbiorca odrzucil,
   - `cancelled` - nadawca anulowal,
   - `failed` - proces nieudany, np. brak srodkow w chwili akceptacji,
   - `failed_sender_disconnected` - szybka sesja zostala zamknieta, bo inicjator utracil polaczenie.

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
   - jesli nadawca utraci polaczenie, proces jest zamykany statusem `failed_sender_disconnected`, zeby odbiorca nie zostal z martwym popupem.

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
   - przy dodatkowym koncie non-custodial panel generuje nowy mnemonic/public key dla kolejnego `account_index`,
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

Wprowadzono tabele `persons` jako docelowe zrodlo danych osobowych i logowania.

Znaczenie:

- `persons` opisuje fizyczna osobe.
- `clients` opisuje profil klienta prywatnego albo biznesowego.
- `hub_staff` opisuje role osoby w konkretnym hubie.
- Centralne role systemowe sa trzymane jako `hub_staff(hub_name='SYSTEM')`.
- `system_users` nie jest aktywnym modelem w aktualnym kodzie.

Kluczowa zasada:

- jedna osoba moze miec wiele profili i rol,
- haslo docelowo nalezy do `persons`, nie do pojedynczego `client` ani roli `hub_staff`,
- `clients` i `hub_staff` nadal moga trzymac dane osobowe jako cache/fallback kompatybilnosci, ale nowe odczyty powinny preferowac `persons`.

Nowe/potwierdzone pola `persons`:

- `person_id` - publiczny identyfikator osoby/profilu w formacie `P + PREFIX2 + SEQ_BASE32 + CHECKSUM`, np. `PJOA7K`,
- `person_type` - np. `human`,
- `first_name`, `last_name`, `full_name`,
- `phone`, `email`, `address`,
- `is_child`,
- `guardian_person_id`,
- `password_hash`, `password_salt`, `password_updated_ts`,
- `recovery_json`,
- `metadata_json`,
- `is_active`.

Telefon i email sa unikalne tylko wtedy, gdy istnieja. Brak telefonu albo emaila jest dopuszczalny.

`person_id` nie jest generowany ze `staff_id`. `staff_id` jest rola/loginem w konkretnym hubie, a `person_id` identyfikuje czlowieka niezaleznie od liczby hubow i rol.

### 30.2 `clients`: profil prywatny i biznesowy

`clients` nie jest juz jedynym miejscem tozsamosci. Jest profilem uzytkownika widocznym dla panelu klienta.

Dodane/utrwalone pola:

- `person_id` - laczy profil klienta z osoba,
- `client_kind`:
  - `private` - profil prywatny,
  - `business` - profil firmowy,
  - `technical` - ewentualny profil techniczny,
- `company_name` - nazwa firmy dla profilu `business`,
- `business_tax_id` - numer podatkowy/rejestracyjny firmy,
- `business_tax_country` - kraj numeru podatkowego,
- `linked_private_client_id` - opcjonalne powiazanie business z prywatnym profilem.

Jedna osoba moze miec:

- jeden profil prywatny,
- wiele profili biznesowych,
- wiele kont finansowych pod kazdym profilem.

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
3. System sprawdza ostatni stan `staff_logins` dla znalezionych rol.
4. Jezeli PIN pasuje do dokladnie jednej aktywnej sesji, panel otwiera sie bez pytania o `staff_id`.
5. Jezeli PIN jest poprawny, ale sesja nie jest aktywna, system prosi o `staff_id` i sprawdza pare `PIN + staff_id`.
6. Po poprawnym `PIN + staff_id` system zapisuje login do `staff_logins` i `system_logs`.
7. Pracownik/owner nie podaje prywatnego hasla osoby do pracy w hubie.
8. Haslo osoby z `persons` dotyczy panelu klienta / konta osoby, nie pracy hubowej.
9. To nie jest docelowy model bezpieczenstwa; PIN jest tymczasowym mechanizmem testowym.
10. Wyjscie z panelu zapisuje wylogowanie w `staff_logins`.

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

- konto ma ownera w `wallet_accounts.owner_id`,
- operacje wykonuje aktor (`actor_id`),
- aktor musi miec aktywny wpis w `wallet_account_access`,
- jeden wiersz = jeden aktor + jedno konto + jedna rola dostepu.

Nie trzymamy listy osob w jednej kolumnie. Jezeli 5 osob ma dostep do konta, w tabeli jest 5 wierszy.

Uprawnienia:

- `can_view`,
- `can_transfer`,
- `can_cash_in`,
- `can_cash_out`,
- `can_mint`,
- `can_manage_access`.

Przyklady:

- klient prywatny ma `can_view=1`, `can_transfer=1` do swojego konta VKES,
- owner huba ma `can_cash_in=1` i/lub `can_cash_out=1` do kont KES huba,
- operator mint ma `can_mint=1` do `SYSTEM_VKES_MINT`,
- rodzic/opiekun moze miec `can_view=1` albo `can_transfer=1` do konta dziecka,
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

- jezeli czlowiek podaje kwote albo podejmuje decyzje finansowa, operacja musi miec `actor_id` i przejsc `wallet_account_access`,
- przyklad: `execute_hub_cash_create`, `execute_hub_cash_to_vkes`, `execute_cash_in`, `execute_cash_out`, zwykly transfer z konta,
- operacje automatyczne bez decyzji czlowieka moga uzywac jawnego aktora technicznego `SYSTEM_RUNTIME`,
- `SYSTEM_RUNTIME` ma dostep tylko przez wpisy `wallet_account_access`, wiec jego uprawnienia mozna wlaczyc/wylaczyc per konto,
- wpisy finansowe powiazane z paczka przechodza przez wrapper package ledger:
  - gdy metadata zawiera `staff_id`, wrapper dopisuje `actor_id=persons.person_id`, `actor_type=person`, `actor_source_staff_id=staff_id`,
  - gdy brak czlowieka w kontekscie, wrapper dopisuje `actor_id=SYSTEM_RUNTIME`, `actor_type=system_runtime`,
  - dla platnosci KES/VKES przy tworzeniu paczki `create_and_add_parcel` przekazuje `staff_id` do metadata, aby aktorem byl czlowiek obslugujacy paczke.

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
- `from_owner` - zrodlo/kontekst,
- `metadata_json` - dodatkowy kontekst,
- `entry_hash`, `hmac_signature`, `hmac_key_id` - integralnosc/audyt.

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

Zwykly przelew wykonuje `execute_wallet_transfer`.

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

Emisja i przelew do systemu albo innego konta nie jest jednym zwyklym przelewem.

Model ledger:

```text
TX1:
SYSTEM_VKES_MINT  +kwota  event_key=mint_create

TX2:
SYSTEM_VKES_MINT  -kwota  event_key=mint_transfer_debit
SYSTEM_VKES       +kwota  event_key=mint_transfer_credit
```

Znaczenie:

- `mint_create` pokazuje moment kreacji VKES,
- drugi `tx_group_id` pokazuje transfer utworzonych srodkow,
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
- `payer_owner_id`,
- `payee_owner_id`,
- `reason`,
- `note`,
- `package_id`,
- `tx_group_id`.

Statusy:

- `created`,
- `awaiting_push`,
- `awaiting_offline_response`,
- `awaiting_signature`,
- `authorized`,
- `settled`,
- `rejected`,
- `cancelled`,
- `failed`,
- `failed_sender_disconnected`.

Zasada:

- `payment_intents` mowi, co zostalo poproszone/zaakceptowane/odrzucone,
- `wallet_ledger` mowi, gdzie faktycznie poszly pieniadze.

### 30.17 Push `online` i `waiting`

`online`:

- szybka sesja platnosci,
- odbiorca/platnik musi byc online w momencie utworzenia,
- jezeli odbiorca jest offline, system nie tworzy aktywnej sesji albo oznacza niedostarczenie,
- duzy modal zostaje otwarty do czasu wyniku,
- utrata nadawcy zamyka proces statusem `failed_sender_disconnected`,
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
- `used_from_ts` ustawiane przy pierwszym zejściu ponizej zera,
- `due_ts` liczone z `due_days`,
- gdy saldo wraca do `>=0`, stan wraca do `clear`.

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

Ze wzgledu na zmiane modelu ID, kont, dostepow i ledger, stare wpisy finansowo-tozsamosciowe nie sa migrowane semantycznie.

Funkcja pomocnicza:

- `reset_finance_identity_tables`.

Czyści:

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
- `staff_logins`.

Nie czyści automatycznie:

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

Pusta baza startuje z konfiguracji i manifestu, nie z ukrytych fallbackow.

Kolejnosc startu:

1. `config.yaml` synchronizuje ustawienia systemu.
2. `hub_manifest.yaml` jest czytany jako zrodlo topologii, hubow, ownerow, staff i central staff.
3. Synchronizacja manifestu tworzy/aktualizuje:
   - `hubs`,
   - `hub_staff`,
   - `persons`,
   - konta `wallet_accounts`,
   - dostepy `wallet_account_access`,
   - klucze `wallet_keys` dla aktywnych kont.
4. Dopiero po tej synchronizacji system moze wykonywac operacje finansowe.

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

`staff_id` sluzy do roli/logowania/aliasu operacyjnego. Operacje finansowe powinny wskazywac `person_id` jako aktora, jezeli decyzje podejmuje czlowiek.

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

### 31.5 Konta finansowe `wallet_accounts`

`wallet_accounts` opisuje konto, ale nie przechowuje salda.

Najwazniejsze pola:

- `account_id` - jawny numer konta,
- `owner_person_id` - osoba odpowiedzialna/wlasciciel konta tam, gdzie dotyczy,
- `account_scope_type` - zakres konta, np. `person`, `hub`, `system`,
- `account_scope_id` - identyfikator zakresu, np. `PDOBBC`, `AA`, `SYSTEM_VKES_MINT`,
- `account_name` - alias konta, np. `MAIN`, `MAAJOAV`, `OPERATING`, `MINT`,
- `currency` - `VKES` albo `KES`,
- `custody_mode` - `custodial`, `non-custodial`, `system_shared`,
- `require_incoming_approval` - czy konto wymaga potwierdzania przychodzacych platnosci.

`owner_id` nie jest juz zrodlem prawdy w nowym modelu. Nowe przeplywy powinny uzywac `owner_person_id`, `account_scope_type`, `account_scope_id` i `account_id`.

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
VKES_SYSTEM_MINT       +1000 VKES  event_key=mint_create          tx_group_id=TX_CREATE
VKES_SYSTEM_MINT       -1000 VKES  event_key=mint_transfer_debit  tx_group_id=TX_TRANSFER
VKES_SYSTEM_OPERATING  +1000 VKES  event_key=mint_transfer_credit tx_group_id=TX_TRANSFER
```

`mint_create` pokazuje moment kreacji pieniadza, a transfer pokazuje przesuniecie do konta operacyjnego systemu.

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
6. `actor_id` operacji finansowej to `person_id` czlowieka, np. `PDOBBC`.
7. `finance_core` blokuje mint bez `actor_id`.
8. `wallet_account_access` musi zawierac `can_mint=1` dla `actor_id` na koncie `VKES_SYSTEM_MINT`.

To oznacza, ze system nie moze anonimowo kreowac VKES. Kreacja VKES zawsze ma widocznego operatora.

### 31.10 Zwykly przelew VKES

Zwykly przelew wykonuje `execute_wallet_transfer`.

Warunki:

1. `from_account_id` i `to_account_id` musza wskazywac aktywne konta.
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
- `failed`,
- `failed_sender_disconnected`.

Tryby dostarczenia:

- `online` - szybka sesja; odbiorca musi byc online przy utworzeniu,
- `waiting` - oczekujace zlecenie w kopercie; nie wymaga aktywnego czekania nadawcy.

Dla `online`:

- jesli odbiorca offline przy tworzeniu, nie tworzymy aktywnej sesji,
- jesli nadawca zniknie, proces moze zostac zakonczony statusem `failed_sender_disconnected`,
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

- kto byl aktorem (`actor_id`, docelowo `person_id`),
- z jakiego konta wyszly srodki (`from_account_id`),
- na jakie konto weszly srodki (`to_account_id`),
- jaka byla waluta,
- jaka byla kwota,
- jaki byl `event_key`,
- jaki byl `tx_group_id`,
- czy operacja byla powiazana z paczka (`package_id`) albo payment intent (`intent_id`),
- czy wpisy debit/credit sumuja sie logicznie.

Dla mint dodatkowo musi byc widoczny osobny moment kreacji (`mint_create`) oraz operator z `can_mint`.
