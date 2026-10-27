---
tags: [update-log, historie]
autor: Claude
---

# Update-Log

Chronologie der wichtigsten Änderungen am Projekt, neueste zuerst. Basiert auf
`git log` (Autor: Tim / SwaggyPotter) plus manueller Analyse der Commit-Diffs.
Neue Einträge bitte **oben** anfügen.

---

### 2026-10-27 (2) — Tycoon: 10 neue Spielmechaniken (lokal getestet, NICHT deployt)

Tims Auftrag: alle 10 Ideen nacheinander bauen. Plan, Details und Lizenzregel: `20-Bahnspiel-3D-Assets/Tycoon-Ausbauplan.md`.
Neue Dateien unter `src/app/modules/zusatz/tycoon/`: `tycoon-inspektion.ts`, `-wetter.ts`, `-baustelle.ts`, `-personal.ts`, `-gueter.ts`,
`-kapazitaet.ts`, `-ausschreibung.ts`, `-clanprojekte.ts`, `-album.ts`; Logik in `tycoon-engine.ts`, 3D in `tycoon-3d.ts`/`tycoon-deko.ts`.

- **Inspektionsfahrt** (Minispiel Fehler im Gleis antippen, Foto-Bonusfrage), **Wetter/Jahreszeiten** (Schutzmaßnahmen je Strecke, Wetter-Störungen, 2D/3D-Partikel),
  **Baustellen** (Maßnahme + Sperrung + Arbeitsvorbereitung mit Fachfragen, 3D-Baustelle), **Personal** (4 Rollen, Lehrgänge, ab Stufe 3 Lernstand aus der Lernwelt),
  **Güteraufträge** (Güterbahnhof, Waren je Stadt/Gebiet, 3 neue Güterzüge), **Kapazität** (zweites Gleis – auch in 3D –, Ks/ETCS, Pünktlichkeit),
  **Abzweigstellen + Zuglauf** (Strecke teilen, Züge über mehrere Strecken, Knotenbonus, Weichenstörung), **Ausschreibungen** (gegen ausgedachte Mitbewerber),
  **Clan-Großprojekte** (Server!), **Sammelalbum** (Zugtypen + 16 Abzeichen).
- **Backend:** neue Tabellen `tycoon_clan_projekte`, `tycoon_clan_beitraege` (index.ts), Endpunkte `POST /tycoon/clan-projekt`, `POST /tycoon/clan-projekt/beitrag`,
  `/tycoon/welt` liefert `clanProjekt` und `clanBoni`. SQL im Wegwerf-Container auf dem Server geprüft. → **Beim Deploy Backend zuerst.**
- **Nebenbei behoben:** Spiel-Quiz mischt jetzt die Antworten (in 264 von 476 Fragen war die erste Antwort richtig). Handy: Knopfleiste als zweite Zeile (war vorher abgeschnitten).
- **Neues Asset:** Kenney Car Kit 3.1 (CC0) → `src/assets/modelle/kenney-fahrzeuge/` (Radlader, Lkw, Leitkegel für Baustellen).
- Alte Spielstände laden weiter (alle neuen Felder mit Standardwerten). `ng build` ok.

---

### 2026-10-27 — Tycoon: Karte kommerziell nutzbar, 3D-Kamera/Klicks, 2D Standard, mehr Gebäude

- **Kartenlizenz** (Tims Wunsch: auch kommerziell erlaubt): Eurostat-GISCO/EuroGeographics-Grenzen (nur nicht-kommerziell) ersetzt. Deutschland: **BKG VG250** (Stand 01.01.2026, Ebene KRS, Datenlizenz Deutschland – Namensnennung 2.0), Ausland: **Natural Earth admin-1** (Public Domain; Departements, Provinzen, Kantone, Woiwodschaften – teils gröber als NUTS-3). Berlin/Hamburg-Bezirke weiter OSM (ODbL, kommerziell ok). Höhen (AWS Terrain Tiles) und Natural-Earth-Grundkarte waren schon ok. Vorbereitung per `npx mapshaper` (Befehle im Kopf von `tools/tycoon-karte/erzeuge-gebiete.cjs`): Ausland wird an der genauen deutschen Grenze abgeschnitten, Lücken gefüllt → lückenlose Grenzen (geprüft: Saar/Luxemburg, Basel, Neiße). 524 Gebiete (DE 400).
- **IDs:** Deutsche Landkreise behalten ihre NUTS-IDs (Feld `NUTS` in VG250) → gekaufte Landkreise bleiben. Ausland neu: 6-stellig `<Land><Teil>X<Nr>`. **Backend-Migration** (`index.ts`): alte ausländische Gebiete (5-stellige NUTS-IDs außer DE) werden einmalig erstattet („Neue Karte: deine Gebiete im Ausland wurden erstattet“). Hanau (seit 2026 kreisfrei) ist in den Main-Kinzig-Kreis eingerechnet (gleiche NUTS-ID).
- **Quellenvermerk** (`GEBIET_QUELLE`, HTML): „© BKG (2026) dl-de/by-2-0, Datenquellen: VG250 (vereinfacht und für das Spiel umgestaltet)“ mit den von BKG verlangten Links, steht im Panel „Dein Unternehmen“ und in der Bundesland-Übersicht.
- **3D-Klicks:** Fangradien waren in 3D fest (Stadt 20 km!) → in Berlin traf man ständig Berlin. Jetzt wie in 2D in Bildschirmpixeln (`pixelJeEinheit` in `tycoon-3d.ts`, Engine `hit(p, kk)`/`zeichneZu(p, kk)`). Getestet: in der Berlin-Nahansicht treffen Klicks neben dem Sockel die Bezirke.
- **3D-Kamera:** richtet sich beim Start auf das eigene Netz (Streckenenden + Bahnhöfe) aus, höchstens Abstand 75 (`START_RADIUS`) statt bis 380 → Städte, Gleise, Züge nicht mehr winzig. Schilder skalieren ab Abstand 110 (vorher 170).
- **2D ist Standard** (neuer Speicherschlüssel `tycoon-ansicht3d-v2`, alte 3D-Wahl gilt nicht mehr).
- **Mehr 3D-Gebäude** (alle Kenney CC0, auch kommerziell frei): City Kit Commercial (13 Geschäftshäuser, 5 Hochhäuser, Vordach), Suburban (21 Wohnhäuser), Industrial (20 Hallen, Container, Tanks), Train Kit (moderne/runde Straßenbahn, U-Bahn-Wagen, Doppelstock-/Regionalbahn-Endwagen). Jede Stadt hat jetzt einen Bahnhof (Empfangsgebäude + Bahnsteigdach) und ein kleines Güter-/Gewerbeviertel; Spieler-Bahnhöfe bekommen ein Bahnsteigdach. Katalog `/modelle` mit neuer Kategorie „Gebäude“. Ein fertiges CC0-Bahnhofsmodell gibt es nicht verlässlich (nur Prototypen/unklare Lizenzen) → aus Kenney-Teilen zusammengesetzt.
- Lokal getestet (ng serve + Patchright, simuliertes Backend), `ng build` und Backend-`tsc` ok. **Am 2026-10-27 deployt (erst Backend inkl. Erstattungs-Migration, dann Frontend, nach Tims Freigabe). Nichts committet.**

---

### 2026-10-26 (spätabends) — Tycoon: tiefer zoomen, Gebietsnamen auf der Karte

- 2D: Zoom bis 64-fach (vorher 16), Berlin füllt im Fokus den Bildschirm. Neu `beschrifteGebiete()` (`tycoon-gebiete.ts`): Landkreis-/Bezirksnamen in Bildschirmgröße, sobald ein Gebiet groß genug ist (lange Doppelnamen umbrochen).
- Gleise (max. ~12 px) und Züge wachsen beim starken Zoomen nicht mehr mit.
- 3D: Beim Bundesland-Fokus (kleine Länder) eigene, feine Detail-Bodentextur mit Bezirksnamen (`baueDetail`, zOffset), Kamera-Mindestabstand passend zur Größe (Berlin nah).
- Lokal getestet (2D Berlin-Fokus + Mausrad, Landkreise; 3D Berlin-Fokus; keine Fehler), `ng build` ok. **Noch nicht deployt. Nichts committet.**

### 2026-10-26 (abends) — Tycoon: Zoom/Bundesland-Fokus, Strecke ziehen, Testmodus, Update-Fix

- **Alte Version trotz Neuladen:** Ursache war der Angular-Service-Worker ohne Update-Behandlung. `app.component.ts` prüft jetzt beim Start und alle 10 Min. auf eine neue Version (`SwUpdate`), aktiviert sie und lädt einmal neu; Registrierung nach 5 statt 30 s.
- **Zurücksetzen:** eigene Gebiete wurden bis zum nächsten Welt-Abruf (bis 30 s) weiter als eigene angezeigt → Engine entfernt sie sofort, die Seite lädt die Welt direkt nach dem DELETE neu.
- **Testmodus** (`TESTMODUS = true` in `tycoon-zuege.ts`, Tims Wunsch): alles kostenlos (Züge, Strecken, Ausbau, Oberleitung, Bahnhof, Kohlelager, Lack, Upgrades, Ausrüstung, Fremdfirma, Gebiete – der Server speichert trotzdem den Grundpreis für die Einnahmen) und keine Level-/Können-Sperren. Startgeld neu 50.000 €. Zum Abschalten `false` setzen.
- **2D-Karte zoombar:** Mausrad bzw. zwei Finger = zoomen (bis 16×), Ziehen = verschieben, Tippen = auswählen. Städte/Bahnhöfe/Schrift wachsen nur mäßig mit (bis 2×), Gleise halb so breit wie vorher, Züge kleiner; herangezoomt werden die Gebietsgrenzen live (scharf) gezeichnet. Knopf „🌍 Zur Weltkarte“ oben links.
- **Bundesland-Fokus:** im Panel „🔎 <Bundesland> auf der Karte heranzoomen“ – 2D passt das Land in die Karte ein, 3D fährt die Kamera hin (`fokus` in den Weltdaten). Die bisherige große Ansicht heißt jetzt „Übersicht im Fenster (mit Kaufliste)“.
- **Strecke ziehen:** „Strecke herstellen“ (auch direkt im Gebiets-Panel, wenn dort ein Bahnhof steht) → auf Start drücken, gedrückt halten, über eigene Gebiete ziehen, am grün markierten Ziel loslassen = gebaut. Bewegen ohne Taste zeichnet nicht mehr. 3D: linke Taste/Finger zeichnet, rechte Maustaste verschiebt beim Zeichnen.
- **3D:** Gebäude, Bäume usw. halb so groß (`D = 0.5` in `tycoon-deko.ts`), Namensschilder skalieren mit dem Kameraabstand, Auswahlring kleiner.
- Lokal getestet (2D: Fokus, Zoom, Verschieben, Bahnhof gratis, Strecke per Ziehen; 3D: Fokus, keine Fehler), `ng build` ok. **Am 2026-10-26 deployt (Frontend, nach Tims Freigabe). Nichts committet.**

---

### 2026-10-26 (später) — Tycoon 3D: Karte doppelt so groß, Gleise halb so groß

- Tims Wunsch: Landkreise/Bundesländer wirkten neben den Gleisen winzig. `SC` (3D-Einheiten je Welteinheit) 0,1 → 0,2, `UEBERHOEHUNG` mit verdoppelt (Relief sieht gleich aus). Gleis, Schwellen, Schienen, Oberleitung, Züge und Bahnsteige über den Faktor `G = 0.5` in `tycoon-3d.ts` halbiert; Schwellenabstand 0,3, Mastabstand 4 (sonst zu viele Instanzen). Kamera: Grenzen 3–840, Ausrichtung max. Radius 380. Stadt- und Bahnhofsschilder größer, damit sie lesbar bleiben. 2D-Karte unverändert.
- Lokal getestet (3D, keine Fehler). **Am 2026-10-26 deployt (nur Frontend, nach Tims Freigabe). Nichts committet.**

---

### 2026-10-26 — Tycoon: Bundesland-Übersicht und Bahnhöfe

- **Bundesland-Übersicht** (Tims Wunsch): Stadt, Gebiet oder Bahnhof anklicken → im Panel rechts eine Karte des ganzen Bundeslands (Berlin/Hamburg: die Bezirke; Ausland: NUTS-1-Region) als SVG mit Besitzfarben, Städten und Bahnhöfen. Gebiet antippen = auswählen, darunter die Kaufliste aller Gebiete des Landes. „🔍 Große Ansicht“ öffnet dieselbe Karte groß im Fenster (Karte links, gewähltes Gebiet + Liste rechts). Helfer in `tycoon-gebiete.ts`: `gebieteIm(bl)`, `svgPfad`, `innererPunkt`, `regionVon`, `kurzName`; das SVG wird im Engine-Panel gecacht (`landSVG`).
- **Bahnhöfe:** je eigenem Gebiet ein Bahnhofsgebäude (`BAHNHOF` in `tycoon-zuege.ts`: 1.000 €, Abriss ohne Strecken gibt 500 € zurück). Er steht an der zuletzt im Gebiet angeklickten Stelle (gestrichelter Kreis), sonst an `innererPunkt`. Bahnhof anklicken → „🛤 Strecke herstellen“ (gleiches Zeichnen wie bei Städten; Ziele: aufgedeckte Städte + eigene Bahnhöfe). Mit nur einem Bahnhof erscheint der Hinweis „Um die Strecke zu vervollständigen, brauchst du ein weiteres Bahnhofsgebäude …“. Einnahmen: je Bahnhof und angeschlossener Strecke 0,4 €/s (24 €/min) × Zustandsfaktor, bei Störung halbiert (`bfRate`); Strecken zwischen Bahnhöfen bekommen wie alle anderen Fremdzüge, eigene Züge, Störungen und Inspektionen.
- **Datenmodell:** `S.bf = [{ id, g, x, y }]`, `S.bfNext`, `S.bfSumme`; Streckenenden `L.a/L.b` = Stadt-Index 0..99 oder **1000 + Bahnhof-ID** (`knoten(i)` liefert Name/Position). 3D: Bahnsteig + Schild (`syncBahnhoefe`), Gebäude Kenney `kenney-stadt/building-b` über `TycoonDeko`.
- **Backend:** Spielstand-Schema erlaubt Streckenenden bis 99.999 (vorher 99 → Speichern mit Bahnhof-Strecken würde sonst abgelehnt!), ebenso `POST /tycoon/verbindung`; `/tycoon/welt` ignoriert Bahnhof-Enden bei Spielerzahl je Stadt und Clan-Strecken. **Backend muss vor dem Frontend deployt werden.**
- Lokal getestet (ng serve + Patchright, simuliertes Backend): Gebiet → Bahnhof bauen → Hinweis bei einem Bahnhof → zweiter Bahnhof → Strecke Bf ⇄ Bf gebaut, Einnahmen laufen, Speichern mit `bf`; Sachsen-Übersicht, Kauf aus der Liste, große Ansicht; 3D ohne Fehler. `tsc` Frontend/Backend ok. **Am 2026-10-26 deployt (erst Backend, dann Frontend, nach Tims Freigabe). Nichts committet.** Komponenten-CSS-Budget in `angular.json` von 10 auf 16 kB angehoben (Tycoon-SCSS 10,9 kB).

---

### 2026-10-24 — Tycoon: Landkreise als Gebiete in ganz Deutschland, Strecken zeichnen

- **Gebiete statt Stadtbezirke** (Tims Wunsch): ganz Deutschland ist in die 400 Landkreise/kreisfreien Städte aufgeteilt, Berlin und Hamburg in ihre Bezirke (OSM, wie bisher), Nachbarländer im Kartenausschnitt in NUTS-3-Regionen – zusammen 636 kaufbare Gebiete. Bundesland-Grenzen kräftiger und beschriftet, Staatsgrenzen am kräftigsten. Quelle: Eurostat GISCO NUTS 2024 1:1 Mio. als TopoJSON (`tools/tycoon-karte/erzeuge-gebiete.cjs <NUTS_RG_01M_2024_4326_LEVL_3.json>` → `tycoon-gebiete-daten.ts`, ~320 KB). Gemeinsame Grenzbögen werden einmal vereinfacht → keine Lücken zwischen Nachbarn; je Bogen Grenzart (Kreis/Land/Staat). **Lizenz: „© EuroGeographics bezüglich der Verwaltungsgrenzen“, nur nicht-kommerziell + Quellenangabe** (steht im Spiel-Panel). Deutschland-Umriss der Karte kommt jetzt aus denselben Daten. `tycoon-bezirke-daten.ts` auf Berlin/Hamburg gekürzt (`hole-bezirke.cjs` schreibt nur noch diese, `BEHALTEN`).
- **Laufzeit `tycoon-gebiete.ts`:** Dekodieren, Raster-Index (20er Zellen, 20 000 Abfragen ≈ 20 ms), `gebietAn`, `gebietVonStadt`, `stelleErlaubt` (Toleranz 1,2 Einheiten am Rand erlaubter Gebiete gleicht Lücken OSM↔NUTS aus), Preis nach Fläche (100 + 0,2·km², max. 900, Städte mind. 250, mit Spielstadt +50 %), `zeichneGebiete` für 2D und 3D. Besitz-ID = NUTS-ID zur Basis 36 (Bezirke: OSM-ID). Server-Zeile `tycoon_bezirke` mit `stadt = 100` (`GEBIET_STADT`).
- **Strecke zeichnen:** Stadt anklicken → „🛤 Strecke von hier zeichnen“. Die Strecke folgt dem Zeiger (Maus ohne Taste; Handy: Finger ziehen, zwei Finger = Karte verschieben/zoomen; Klick/Tippen setzt Punkt), geht nur über eigene Gebiete bzw. die aktiver Clan-Mitglieder (7 Tage), bleibt sonst an der Grenze stehen (Rest rot, Panel nennt das versperrende Gebiet mit Kauf-/Übernahme-Knopf). Zurückfahren über die eigene Linie kürzt sie, „↶ Stück zurück“, Esc = Abbrechen. An einer erlaubten Zielstadt (grün markiert) rastet sie ein → Stadt antippen oder „Bauen“. Kosten = Länge × 5 € (Umwege kosten mehr). Gespeichert werden ausgedünnte Kontrollpunkte `L.p`; die Linie wird aufgefüllt (≤ 4 Einheiten) und zweimal Chaikin-geglättet. Alte Strecken ohne `p` behalten ihre Kurve und bleiben bestehen.
- **Gebiete im Spiel:** Karte anklicken = Gebiet wählen (Panel: Art, Bundesland, Fläche, Besitzer, Kaufen / Übernehmen 3×). Einnahmen je eigenem Gebiet (Grundpreis × 0,0015 €/s), wenn eine eigene Strecke hindurchführt (≥ 2 Einheiten, Endstädte immer) oder eine Clan-Strecke dort endet; Störung auf einer Strecke hindurch halbiert, +25 % wenn die eigene Strecke auch über Clan-Gebiete führt. Bau-Erlaubnis einer Stadt = ihr Gebiet gehört dir/aktivem Clan-Mitglied. 2D: Gebietsebene vorgerendert (neu bei Besitzänderung), Hover-/Auswahlrand. 3D: Gebiete auf die Bodentextur gezeichnet (Kopie der Grundkarte + Gebiete, neu bei Besitz/Auswahl), Zeichnung als Schlauch über dem Gelände, freie Kamera wird beim Zeichnen gesperrt. Alte Bezirksflächen/-sektoren entfernt.
- **Backend:** `POST /tycoon/bezirke` nimmt nur noch `stadt = 100`; `POST /tycoon/verbindung` bekommt `gebiete` (Gebiete der Endstädte) für die Clan-XP. **Migration beim Start: alte Stadtbezirke (`stadt < 100`) werden einmalig als Gutschrift erstattet und gelöscht.**
- Lokal getestet (ng serve + Patchright, simuliertes Backend): 2D und 3D, Desktop und Handy (Touch per CDP), Umweg um fremdes Gebiet, Bau, Speichern mit `p`, Kauf. `tsc` Frontend/Backend und `ng build` ok. **Am 2026-10-24 deployt (Backend + Frontend, nach Tims Freigabe), Migration lief fehlerfrei. Nichts committet.**

---

### 2026-10-21 — Tycoon: echte Stadtbezirke, Clan-Bauregel, Werkstatt, Kohle/Oberleitung, Europa mit Relief

- **Echte Stadtbezirke** (OpenStreetMap, ODbL – Namensnennung unter dem Bezirksplan; die erzeugte Datei `tycoon-bezirke-daten.ts` steht unter ODbL): Abruf per Overpass `tools/tycoon-karte/hole-bezirke.cjs <cache>` (Städte über Wikidata-ID, Ersatzsuche über örtlichen Namen; gröbste admin_level-Ebene mit 3–30 Bezirken; Ringe zusammensetzen + Douglas-Peucker – **geschlossene Ringe am entferntesten Punkt teilen**, sonst bleibt nichts übrig; `NUR_CACHE=1` = nur aus dem Cache erzeugen). Overpass war stark überlastet (alle öffentlichen Instanzen 502/504) → Lauf dauert Stunden. Stadt-Panel zeigt den Bezirksplan als SVG (antippen = auswählen), 3D: Bezirksumrisse als Bodentextur je Stadt, 2D: echte Flächen. Grundpreis nach Fläche. **Besitz wird jetzt mit der festen OSM-Relations-ID gespeichert** (Ersatzbezirke 0..5), Backend erlaubt `bezirk` bis 2·10⁹.
- **Bau-Regel (Tim):** Strecke nur, wenn in beiden Städten du selbst einen Bezirk hast oder ein Clan-Mitglied mit Bezirk dort, das in den letzten 7 Tagen gespielt hat (`aktiv` aus `tycoon_saves.updated_at`). Die Ausnahme „schon angeschlossen“ entfällt. Boni (Tims Wahl): Clan-Verbindung (Strecke eigener/Mitglieds-Strecken zwischen zwei Städten, in denen der Clan arbeitet) → Bezirke dort +25 %; beim Bau +20 XP für aktive Clan-Mitglieder in den beiden Städten (`POST /tycoon/verbindung`, Gutschrift mit neuer Spalte `xp`). Strecken von Clan-Mitgliedern zählen als Anschluss für Bezirkseinnahmen (`clanStrecken` in `/tycoon/welt`).
- **Werkstatt je Zug:** eigene Lackierung (`ZUG_FARBEN`, 400–600 €) und Upgrades (`ZUG_UPGRADES`: Komfort +15 % Miete, Drehgestelle −30 % Verschleiß, Zusatzwagen +1 Wagen/+20 %, Leistung +10 % km/h, WLAN +10 %; Preis = Faktor × Zugpreis). Zugang über „🔧 Werkstatt“ beim Zug und Shop-Reiter „Deine Züge“. Kaufdialog mit Farbwahl; 3D-Vorschau zeigt Farbe und Zusatzwagen (`Engine3D.zeigeZug(..., farbe)`).
- **Oberleitung als eigener Bau** je Strecke (`L.ol`, Länge × 4 €, ab Level 2); E-Züge brauchen sie, Streckenklassen elektrifizieren nicht mehr automatisch (alte Strecken mit Klasse ≥ 1 behalten ihre Oberleitung). **Kohlelager** je Stadt (2.500 €, `S.lager`): Dampfloks ohne Lager in einer Endstadt → Kohlemangel (60 % Einnahmen, 80 % Tempo). 3D: Lagerhalle bzw. Bahnstrom-Unterwerk an der Stadt.
- **Neue Modelle:** Kenney City Kit Industrial (CC0) → `assets/modelle/kenney-industrie/` (Lager, Unterwerk, Windräder im Norden, Solarfelder, Kühltürme Dortmund/Leipzig, Tanklager Hamburg, Wassertürme).
- **Europa + Höhenrelief:** Natural-Earth-Länder für ganz Europa (`EUROPA` in `tycoon-karte-daten.ts`, vereinfacht), Ländernamen europaweit. Höhen aus AWS Terrain Tiles (SRTM, GMTED2010, ETOPO1, EU-DEM; Zoom 5, 42 Kacheln) → `tools/tycoon-karte/erzeuge-hoehen.py` → `assets/tycoon/hoehen.png` (691 × 851, 8 Bit, Wurzel-skaliert bis 4.800 m) + `tycoon-hoehen-meta.ts`. `tycoon-hoehen.ts`: Laden, `hoeheWelt/hoehe3D` (bilinear), eingefärbtes Relief mit Schummerung. 3D: zwei Geländenetze (Spielgebiet fein, Europa grob und im Spielgebiet abgesenkt), 0,00088 Einheiten/m (~8-fach überhöht); Städte, Gleise (Schotter jetzt als Band), Züge, Deko stehen auf dem Gelände; Antippen schneidet iterativ mit dem Gelände. **Lehre:** falsche Dreiecks-Reihenfolge → Normalen nach unten → Gelände dunkel. 2D-Karte wird einmal vorgerendert (spart Rechenzeit je Bild). Kamera kann bis Europa herauszoomen.
- Lokal getestet. Noch nicht deployt (Backend + Frontend). Nichts committet.

---

### 2026-10-20 (Nacht) — Tycoon: Bezirke, Clans, Stadt-Lichter, Arbeiten, keine Verluste mehr

- **Wirtschaft ohne Verluste** (Tims Wunsch): keine laufenden Kosten mehr (Streckenunterhalt und Zugwartung entfernt). Zustand der Strecke senkt nur die Einnahmen (`condFaktor`: 100 % Zustand = voll, 0 % = 40 %, mit Werkstatt 70 %); „Entgangen“ wird je Strecke gezählt (`L.verlust`). Fehlversuch bei Störungen kostet nichts mehr, Störung bleibt bestehen. Fremdfirma nur, wenn das Geld reicht. Alte Spielstände mit negativem Guthaben starten bei 0 €. Ausrüstung „Werkstatt“ wirkt jetzt auf den Wartungsstau.
- **Mehr Arbeiten:** 6 Störungsarten (Gleislagefehler → Nivellierlatte; Schienenfehler, Schwellenschaden, verschmutzte Bettung, Spurweitenfehler, lockere Kleineisen → Fachfragen aus `assets/themenquiz/<thema>.json`, Anzahl/Mindestzahl je Schwierigkeit). Neue freiwillige Arbeit **Inspektion** je Strecke (3 Fachfragen aus 9 Themen, 2 richtig → +30 % Zustand, Bonus = Länge × 2, +10 XP; Sperrzeit 120 s bzw. 30 s nach Fehlversuch). Menü „🛠 Arbeiten“ im HUD listet Störungen und Inspektionen. Bildbezogene Fragen („Bild/Abbildung/Foto“) werden ausgefiltert, weil das Spiel keine Bilder zeigt. Antworten zeigen Erklärung + Quelle.
- **Bezirke (gemeinsame Karte, Backend):** je Stadt 4 Bezirke (Großstädte 6; Grundpreis 600 bzw. 1.000 €; `bezirkeVon()` in `tycoon-karte.ts`). Kaufen über das neue **Stadt-Panel** (Stadt anklicken). Fremde Bezirke übernehmen = 3 × Grundpreis, der alte Besitzer bekommt den Grundpreis als Gutschrift (wird beim nächsten Laden automatisch gutgeschrieben); frisch gekaufte Bezirke 2 h geschützt; Clan-Bezirke nicht übernehmbar. **Strecken bauen nur noch, wenn man in beiden Städten einen eigenen oder Clan-Bezirk hat** (oder die Stadt schon angeschlossen ist; ohne Serververbindung keine Sperre). Bezirke bringen laufend Geld (Grundpreis × 0,0015 €/s) nur in angeschlossenen Städten; eine Störung an einer Strecke der Stadt halbiert das. 3D: farbige Sektoren um die Stadt (Clanfarbe bzw. feste Spielerfarbe aus der Konto-ID, `spielerFarbe()`), 2D: farbige Tortenstücke.
- **Stadt-Lichter:** über jeder Stadt kreisen Lichtkugeln, eine je anderem Spieler mit Strecke dorthin (max. 6); gelb = in den letzten 15 Min. aktiv (gespeichert), grau = sonst.
- **Clans:** Reiter „🛡 Clans“: gründen (Name, Kürzel 2–4, Farbe aus 10), beitreten, austreten (leerer Clan wird aufgelöst). Clan-Kürzel in der Rangliste, neue Ranglisten-Kategorie „Bezirke“.
- **Backend:** neue Tabellen `tycoon_bezirke`, `tycoon_gutschriften`, `tycoon_clans`, `tycoon_clan_mitglieder` (Startup-Migration); Endpunkte `GET /tycoon/welt`, `POST /tycoon/bezirke` (Transaktion mit `FOR UPDATE`), `POST /tycoon/gutschriften/abholen`, `GET/POST /tycoon/clans`, `POST /tycoon/clans/:id/beitreten`, `POST /tycoon/clans/austreten`; Spiel zurücksetzen gibt die Bezirke frei. SQL vorab im Wegwerf-Container `postgres:16` auf dem Server getestet.
- Lokal getestet (simulierte API). **Noch nicht deployt** (zusammen mit Duellen + Shop-3D: Backend + Frontend). Nichts committet.

---

### 2026-10-20 (spät) — Tycoon-Shop: 3D-Ansicht jedes Zuges

- Shop-Reiter „Züge“ hat oben einen 3D-Betrachter mit dem kompletten Zug (Lok + Wagen + ggf. umgedrehter Endkopf), dreht sich langsam, mit Maus/Finger drehbar. Jede Zeile hat 👁; Umschalten lädt nur den Betrachter neu (gleiche WebGL-Engine wird weiterverwendet, kein neues Canvas je Zug — wichtig fürs Handy). Gewählter Zug ist markiert, Name + km/h stehen unter dem Bild.
- Kaufdialog und „3D ansehen“ zeigen jetzt ebenfalls den ganzen Zug statt nur der Lok.
- Technik: `Engine3D.zeigeZug(dateien, letztesUmgedreht)` (bricht einen noch ladenden älteren Auftrag ab), `zugDateien(typ)` in `tycoon-3d.ts`.
- Lokal getestet. Noch nicht deployt (zusammen mit den Duellen von heute Abend: Backend + Frontend). Nichts committet.

---

### 2026-10-20 (abends) — Tycoon: Duelle, Rangliste mit Kategorien, Lackierungen, Ausrüstung

- **Backend** (`backend/src/routes/tycoon.ts`, neue Tabelle `tycoon_duelle` in `index.ts` → Startup-Migration): Rangliste liefert zusätzlich `xp`, `maxCls` (höchste Streckenklasse aus dem JSON-Spielstand) und `siege`, sortiert nach Erfahrung, max. 100 Einträge. Duell-Endpunkte: `POST /tycoon/duelle` (Gegner + 1 oder 24 Std.; max. 5 offene/laufende, je Paar nur eins), `GET /tycoon/duelle` (wertet abgelaufene aus), `POST …/:id/annehmen` (merkt Startwerte), `…/ablehnen` (auch Zurückziehen), `…/abholen` (Belohnung einmal je Spieler). Messwert = Summe aller Einnahmen (inF + inO aller Strecken) im gespeicherten Stand; Belohnung Sieg 3 🏆 + 100 XP, Remis 2 + 50, Niederlage 1 + 20. Nicht manipulationssicher (Client rechnet), wie der Rest des Tycoon. SQL vorab in einem Wegwerf-Container `postgres:16` auf dem Server getestet (danach gelöscht).
- **Frontend:** Reiter „⚔ Duelle“ (Annehmen/Ablehnen/Zurückziehen, laufender Zuwachs beider Seiten, Restzeit, Belohnung abholen → `handle.belohnung()` schreibt Pokale + XP in den Spielstand). Rangliste mit Kategorien Level/Guthaben/Strecken/Duell-Siege und Knöpfen „⚔ 1 Std.“/„⚔ 24 Std.“. Vor Herausfordern/Annehmen wird der Spielstand sofort gespeichert.
- **Shop** neue Reiter: „Ausrüstung“ (`AUSRUESTUNG` in `tycoon-zuege.ts`: Stopfmaschine −25 % Verschleiß, Schienenschleifzug −30 % Störungshäufigkeit, Werkstatt −20 % Wartung, Gleismesszug +50 % Störungsbonus, Fahrgastinformation +10 % Miete, Umbauzug −20 % Ausbaukosten, Goldene Schaufel für 12 🏆) und „Lackierungen“ (`SKINS`: 6 für Geld ab Level, Chrom 8 🏆, Champion-Violett 20 🏆). Lackierung färbt alle eigenen Züge (3D: Materialkopien je Zug, Farbe × Textur; 2D: Zugfarbe). HUD zeigt „⭐ Level · 🏆 Pokale“.
- **Bugfix (bestand schon vorher):** Geldbeträge in Rangliste/„Netz von …“ waren leer, weil die Angular-Locale `de` nicht registriert ist (`number:…:'de'` gibt nichts aus) → eigene Methode `eur()`.
- Lokal getestet mit simulierter API (Rangliste, Duelle, Belohnung, Lackierung, Ausrüstung). Headless-Screenshots brauchen bei vielen 3D-Objekten länger (Software-GL ~5 fps) → Screenshot-Timeout im Testskript auf 120 s. Nichts committet.

---

### 2026-10-20 — Tycoon: Level-System, Shop, 12 Züge, Streckenklassen bis 300 km/h

- **Neue Datei `tycoon/tycoon-zuege.ts`** (von Engine und 3D gemeinsam genutzt): `ZUEGE` (12 Typen, Index = gespeicherter Zug-Typ, nur hinten anhängen), `KLASSEN` (5 Streckenklassen), `LEVEL_XP`/`levelAus`.
  - Züge: Rangierlok 70 km/h (L1), Dampflok 80 (L1), Diesel-Güterzug 120 (L1), Dampf-Personenzug 100 (L2), Regionalbahn 140 (L2), S-Bahn 160 ⚡ (L3), Regional-Express Doppelstock 160 ⚡ (L3), Schwerer Güterzug 120 ⚡ (L4, mehr Verschleiß), Intercity 200 ⚡ (L5), ICE 250 ⚡ (L6), ICE 300 ⚡ (L8), Hochgeschwindigkeitszug lang 300 ⚡ (L9). Alte Typen 0–3 behalten ihren Index (E-Lok heißt jetzt S-Bahn-Triebzug, ICE kostet neu 18.000 €).
  - Klassen: Nebenbahn 100 km/h ohne Oberleitung → Hauptbahn 160 (elektrifiziert, L2) → Ausbaustrecke 200 (L4) → Schnellfahrstrecke 250 (L6) → Hochgeschwindigkeitsstrecke 300 (L8). Klasse wirkt auf Bau-/Ausbaukosten, Unterhalt, Trassenentgelt der Fremdzüge und Verschleiß. Ausbau immer eine Stufe, Kosten = Länge × 5 × Differenz der Baufaktoren.
- **Spielmechanik:** Geschwindigkeit = min(Zug, Strecke) (120 km/h = bisherige Grundgeschwindigkeit), Fremdzüge max. 110 km/h. E-Züge nur auf elektrifizierten Strecken. Neue Strecken starten als Nebenbahn; **alte Strecken gelten beim Laden als Hauptbahn** (damit gekaufte E-Loks/ICE weiterfahren). Alte ICE fahren auf Hauptbahnen jetzt max. 160 statt ~190.
- **Level/Erfahrung:** Fahrt eigener Zug +1, Zugkauf +5, Strecke +15, Ausbau +10 × neue Klasse, Störung selbst +20/+30/…, Fremdfirma/Fehlversuch +5. Level 1–10 (Schwellen 0/50/150/300/500/800/1200/1700/2300/3000). Level-up-Toast nennt die Freischaltungen. Alte Spielstände: Erfahrung wird aus Strecken, behobenen Störungen und Fahrten geschätzt.
- **Shop** (🛒 im HUD und „Zug kaufen …“ im Strecken-Panel): Reiter „Züge“ (Strecke wählen, alle Züge mit Level-Sperre/„braucht Oberleitung“, Kauf öffnet den 3D-Kaufdialog mit „Zurück zum Shop“) und „Strecken ausbauen“ (Klassen-Übersicht + Ausbau-Knöpfe). Panel zeigt Klasse, km/h je Zug, Level-Balken.
- **3D:** Triebzüge aus Kenney-Teilen (-a Triebkopf, -b/-c Mittelwagen, Endkopf gedreht); 16 weitere Kenney-GLB (CC0) in `assets/modelle/kenney/` + im Katalog `/modelle`. Elektrifizierte Strecken mit Oberleitungsmasten (Thin Instances) und Fahrdraht, ab Ausbaustrecke Betonschwellen; ausgebaute Strecken werden neu erzeugt.
- Balancing ist grob geschätzt (Einnahmen pro Zeit ≈ Miete × km/h; Kaufpreise so gewählt, dass schnelle Züge etwas rentabler sind, aber teure Streckenausbauten brauchen). Lokal getestet. Nichts committet.

---

### 2026-10-20 — Tycoon: Nachbarländer, 26 neue Städte, Karte verschieben

- **Kartenausschnitt erweitert** (Generator neu ausgeführt): lon 3,6–17,8 / lat 46,7–56,2, Karte 1063 × 1133, alle Länder im Ausschnitt aus Natural Earth (Deutschland heller + dickere Grenze), Ländernamen auf der Karte (`LAENDER_NAMEN` in `tycoon-karte.ts`), `aufLand()` für die Deko.
- **Städte 12 → 38** (nur hinten angehängt, Indizes alter Spielstände bleiben gültig): 13 deutsche (Bremen, Kiel, Magdeburg, Erfurt, Kassel, Münster, Mannheim, Karlsruhe, Freiburg, Augsburg, Regensburg, Würzburg, Saarbrücken) + 13 im Ausland (Kopenhagen, Amsterdam, Brüssel, Luxemburg, Straßburg, Zürich, Innsbruck, Salzburg, Wien, Prag, Breslau, Posen, Stettin; Feld `land`). Alte Spielstände: `vis` wird auf die neue Länge gebracht, und beim ersten Laden werden einmalig die 2 nächsten Nachbarn jedes Streckenendpunkts aufgedeckt.
- **Starre Ansicht beweglich:** Ziehen = Karte verschieben (Bodenpunkt bleibt unter dem Finger), Mausrad / zwei Finger = zoomen, Blickwinkel bleibt fest; Tippen weiterhin = Spielklick (unter 8 px Bewegung). Kameraziel auf die Karte begrenzt.
- Deko: Häuserringe kleiner (Nachbarstädte teils nur ~5 Einheiten auseinander), Abstandsprüfung über alle Städte; mehr Wälder (ganze Karte, nur auf Land); Großstädte zusätzlich Amsterdam, Brüssel, Kopenhagen, Wien, Prag, Zürich.
- **Fallstrick:** Ein verwaister `ng serve` (TaskStop beendet den Kind-Node-Prozess nicht) lieferte nach einem Typfehler still den letzten guten Stand aus → Test sah „nichts geändert“. Dev-Server per Port 4300 / Kommandozeile `ng.js serve` gezielt beenden und Build-Log auf Fehler prüfen.
- Lokal getestet (Desktop, Handy, 2D). Nichts committet.

---

### 2026-10-19 (Nacht) — Tycoon: Deutschlandkarte, echte Gleise, starre Kamera

- **Karte:** Deutschland-Umriss + Nachbarländer aus Natural Earth 1:50m (Public Domain), erzeugt von `tools/tycoon-karte/erzeuge-karte.cjs` → `tycoon/tycoon-karte-daten.ts` (ca. 31 KB). `tycoon/tycoon-karte.ts`: Projektion (lon0 5,6 / lat0 55,25 / 115 Einheiten je Breitengrad, Längengrade × cos 51,2°), Kartengröße 732 × 977, die 12 Städte an echten Koordinaten (Reihenfolge unverändert — Spielstände speichern Stadt-Indizes, alte Strecken werden automatisch neu verlegt), `inDeutschland()`, `zeichneKarte()` (2D-Karte und 3D-Bodentextur). 1 Einheit ≈ 0,97 km (Panel-Anzeige angepasst). Streckenkurven etwas flacher (±18 % statt ±28 %), damit sie nicht über die Grenze ausscheren.
- **Gleise:** statt farbiger Röhre jetzt Schotterbett + Holzschwellen (alle Strecken zusammen als Thin Instances eines Quaders, Abstand 0,42) + zwei Schienen. Gewählte Strecke: Schienen leuchten orange. Schotterfarbe zeigt weiter den Zustand.
- **Starre Ansicht (Standard):** Kamera fest, richtet sich automatisch neu aus, wenn neue Städte aufgedeckt werden. Knopf „Kamera frei“ schaltet Drehen/Zoomen frei (localStorage `tycoon-kamera-frei`).
- Bäume/Häuser nur noch innerhalb Deutschlands (mehr Wälder: 45 Gruppen + 160 Einzelbäume).
- **Bugfix:** 3D-Klicks nutzten die 2D-Trefferzone × 2,5 — bei der neuen (kleiner skalierten) Hochformat-Karte wurde die Zone riesig und traf falsche Strecken/Störungen. Jetzt feste Radien für 3D-Klicks (Strecke 16, Störung 22 Weltkoordinaten).
- Lokal getestet (Desktop + Handy, Strecke antippen, Kauf, 2D-Ansicht). Nichts committet.

---

### 2026-10-19 (spät) — Tycoon-Landschaft: Bäume, Häuser, Hochhäuser

- Neue CC0-Modelle (Kenney, `License.txt` liegt je Ordner bei, zusammen ca. 2,4 MB): `src/assets/modelle/kenney-natur/` (7 Bäume, 2 Büsche, 2 Felsen aus dem Nature Kit), `kenney-vorort/` (Häuser `building-type-a..h`, City Kit Suburban), `kenney-stadt/` (`building-a..h` + 2 Hochhäuser, City Kit Commercial). Eigene Ordner, weil beide City-Kits eine `Textures/colormap.png` mit gleichem Namen haben. Die grauen `low-detail-building-*` wurden verworfen (untexturiert, wirkten wie Betonklötze).
- Neue Datei `tycoon/tycoon-deko.ts`: feste (geseedete) Verteilung — ca. 30 Wälder + Einzelbäume, Büsche/Felsen, je Stadt 9 (Großstadt 14) Gebäude; Großstädte (Berlin, Hamburg, München, Köln, Frankfurt) mit Hochhäusern. Häuser erscheinen erst, wenn die Stadt aufgedeckt ist; alles, was einer gebauten Strecke im Weg steht, wird ausgeblendet. Technik: jedes Modell zu einem Mesh verschmolzen + Thin Instances (wenige Draw Calls, wichtig fürs Handy). Höhe je Gebäudetyp gedeckelt, damit Namensschilder (jetzt auf Höhe 5) frei bleiben; Stadtsockel ist jetzt ein flacher Platz.
- Lehre: `ng build` stürzte mit „cannot allocate memory“ ab, solange Gwen (6,5 GB) in LM Studio geladen war → Modell vor Builds entladen.
- Lokal getestet (Screenshots), Produktions-Build ok. Noch nicht deployt (Stand dieses Eintrags), nichts committet. Offen: 3D-Modelle/Kenney-Credits auf `/bildnachweise` bzw. `/rechte` (CC0 verlangt es nicht, wäre aber fair).

---

### 2026-10-19 (abends) — Tycoon in 3D, alte Kategorie-Ansicht entfernt

- **Alte Kategorie-Ansicht weg:** 7 Seiten (Tycoon, Schienenraten, Schienenmesser, Quizduell, Nivellieren, Volumen, Prozentrechnung) verlinkten im Header noch auf `/kategorie/spiele|rechentrainer` (altes Overlay). Jetzt „Zur Uebersicht“ → `/dashboard` wie alle anderen; Route `kategorie/:id` leitet auf `/dashboard` um. Modul `src/app/modules/kategorie/` ist damit ungenutzt (noch nicht gelöscht).
- **Tycoon 3D:** neue Datei `tycoon/tycoon-3d.ts` (Babylon): Gelände, Städte mit Namensschildern, Strecken (Schotter + Linienfarbe, Zustand färbt den Schotter), Störungskugeln, alle Züge als Kenney-Modelle (Dampflok+Kohle/Holz, Diesel+Container, E-Triebzug, ICE mit Triebkopf an beiden Enden; Fremdzüge = Diesel B + Güterwagen). Liest pro Bild den Zustand über `handle.welt()`, Klicks gehen über `handle.klickWelt()` in dieselbe Spiel-Logik (Trefferzone ×2,5). Umschalter „3D-Ansicht“ in der Leiste (Standard an, Wahl in localStorage `tycoon-ansicht3d`); Kamera richtet sich automatisch auf das Netz aus (Panel rechts bzw. unten berücksichtigt).
- **Kaufdialog:** „… kaufen“ öffnet jetzt einen Dialog mit drehender 3D-Lok (Engine3D-Viewer), Tempo/Miete/Wartung und „Jetzt kaufen“. Eigene Züge haben „3D ansehen“ (geht auch im Ansehen-Modus fremder Netze).
- **Gwen/Cline:** CLI war deinstalliert → `npm install -g cline` neu. Gwen setzte den Kaufdialog-Auftrag (`tools/cline-cli/_auftrag-tycoon-kaufdialog.txt`) nur teilweise um und baute `renderModal` eigenmächtig um → Build-Fehler (vom Wrapper erkannt); Claude hat die Spezifikation dann per Skript angewendet. Fallstricke: Babylon `POINTERTAP` löste nicht aus (eigene Tipp-Erkennung), `dispose(false, true)` auf einer Modell-Instanz löscht die **geteilte** Textur aller Züge (→ weiße Züge).
- Getestet lokal (`ng serve` + Patchright mit simuliertem Backend, Desktop 1280 px und Handy 390 px). **Nicht deployt** — der Produktions-Upload wurde vom Auto-Mode blockiert; Tim muss ihn freigeben oder selbst ausführen. Nichts committet.

---

### 2026-10-19 — Bahnspiel-3D-Assets, Handy-Startseite, 3D-Engine, Quiz-Bilder, Tycoon-Loks

Neuer Vault-Ordner [[20-Bahnspiel-3D-Assets/00-Index]] (Recherche zu 3D-Assets, Struktur wie Ordner 19; Pipeline `tools/bahnspiel-assets/`). Gwen-Lauf scheiterte nach ca. 4 Minuten (3 Schnellfehlschläge, Modell war nicht geladen) — es gibt **keine** Gwen-Rohfunde, alles Geprüfte stammt von Claude: [[20-Bahnspiel-3D-Assets/Verzeichnis-verifiziert]]. Tim hat auf der neuen Review-Seite `/bahnspiel-assets` (Daten `src/assets/bahnspiel-assets/assets.json`, Auswahl nur in localStorage, Export als JSON) entschieden: [[20-Bahnspiel-3D-Assets/Entscheidungen-Tim]].

- **Quiz:** Thema „Schienen“ von 19 auf 24 Fragen (`schiene-f1`..`f5`: Riffeln, Head Checks, Squat + 2 Textfragen). Drei Bilder lokal unter `src/assets/bilder/schienenfehler-*`, Keys `q-schiene-riffeln|head-checks|squat` in `bildnachweise.json` (Squat/Head Checks Public Domain US-DOT, Riffeln CC BY-SA 4.0 Janhajk). Quellen der Fragen sind nur die Commons-Dateiseiten — Fachbelege fehlen noch. **Tims Notizen verwechselten Squat/Flachstelle und Head Checks/Riffeln** (siehe Entscheidungen-Tim); im Quiz sind die richtigen Begriffe verwendet.
- **Tycoon:** 4 Lok-Typen (`TRAINS` in `tycoon-engine.ts`: Dampflok 1.200 €, Diesel 2.500 €, E-Lok 4.500 €, ICE 9.000 €; Faktoren auf Tempo/Miete/Unterhalt, ungeprüft ausbalanciert). Alte Spielstände: Loks ohne `type` = Diesellok.
- **Startseite:** `/dashboard` ist jetzt ein Handy-Homescreen (App-Icons in farbigen Ordnern: Spiele, Rechner, Lernfelder LF10–14 / LF01–09, Wissenstests, „Mehr“ mit Forum (nur eingeloggt), Offline, 3D-Modelle) mit Suche. Header nur noch: online-Anzeige, Design, Konto, Abmelden, Admin-Links (Schlüssel/Fragen/Bilder/Benennen). Fortschrittszähler (Abgeschlossen/In Arbeit/Offen) entfielen. `/apps` leitet auf `/dashboard`. **Lehre:** Ein Getter in der Vorlage, der bei jedem Change-Detection-Lauf neue Objekte liefert (`gruppen`), baute die Seite endlos neu auf und ließ den Tab nach dem Login abstürzen — Ergebnis jetzt gecacht + `trackBy`.
- **Gate/401-Fix:** Server gibt `/assets/*` nur mit Cookie `glw_gate` aus (Caddy, seit 2026-10-02, kein Basic-Auth-Popup mehr). Ein veraltetes im Browser gespeichertes Passwort ergab ein falsches Cookie → alle Assets 401. `syncGateCookie()` prüft jetzt den SHA-256 des gespeicherten Passworts und verwirft den Login (Reload → Login-Maske) bei Abweichung.
- **3D-Engine:** `@babylonjs/core`+`loaders` (v7, Apache-2.0), Hülle `src/app/shared/engine3d/engine3d.ts` (Szene, Kamera, GLB laden, Viewer, Gleis-Diorama mit fahrendem Zug), Katalog `modell-katalog.ts`, Seite `/modelle` (Lazy-Modul, Engine per dynamischem Import). 28 GLB (Kenney Train Kit CC0 + Lok 32kda CC0) unter `src/assets/modelle/`. Wichtig: `engine.disableUniformBuffers = true` (sonst zeichnete Software-GL nichts). Test nur per Headless-Chromium (Software-Rendering), nicht auf echter GPU.
- **Deploy:** alles auf den Server (frontend-dist) hochgeladen, **nichts committet** (Tim pusht per GitHub Desktop).

Offen: Modelle im Tycoon nutzen; Diorama-Optik; Gwen-Lauf zu Ordner 20 neu starten (Modell vorher laden: `tools/gwen-modell-laden.cmd`); Lizenzen der Blender-Addons (Auto Rails, 3DT, Ryan King) ungeprüft; Kenney-Download braucht Referer `https://kenney.nl/assets/train-kit` (sonst 403); Quizquellen der neuen Fragen mit Fachbeleg ergänzen; Tim-Spielidee (Lok kaufen/vermieten, Schwellenabstand als Aufgabe, Regelabstand noch zu belegen).

---

### 2026-10-16 — Gleisbau-Wissensbibliothek (Vault-Ordner 19)

Tim wollte den Vault zu einem Gleisbau-Gedächtnis ausbauen (Fachrecherche, DB-Richtlinien mit Quellen). Neuer Ordner [[19-Gleisbau-Wissensbibliothek/00-Index]]: 33 Themen (A Regelwerke, B Fachthemen), Gwen-Rohfunde mit automatischem URL-Check (ca. 43 % tote Links), von Claude verifiziertes [[19-Gleisbau-Wissensbibliothek/Regelwerk-Verzeichnis]] und [[19-Gleisbau-Wissensbibliothek/Regelwerk-Zugang-verifiziert]]. Zentrale Befunde: technische DB-Ril nur über Regelwerk@DB bestellbar; DGUV 77 (BG BAU) vs. 78 (Bund und Bahn). Tools: tools/wissensbibliothek/ (topics.cjs, generate-topics.cjs, run-recherche.cjs mit Zeitbudget, Modell-Check pro Versuch, URL-Check). Details und Fehlerbilder: [[19-Gleisbau-Wissensbibliothek/Bericht]].

---

# 2026-09-23 — 10 neue Designs zum Umschalten, Signalwerk als neuer Standard

Tim hatte über die Desktop-Claude-App zehn Design-Vorlagen entwerfen lassen
(`design-reference/gleisbau-designvorschau.html`, dazu ein ausführlicher
Auftragsprompt `design-reference/prompt-claude-code-themes.md`) und wollte
sie in die echte App übernehmen: **Signalwerk** als neuer Standard für alle
Besucher, die übrigen 9 (Baustelle, Blaupause, Bahn-Clean, Nachtschicht,
Messing & Stahl, Bahnsteig-Anzeige, Streckennetz, Gleisbildstellwerk, Gelbe
Flotte) frei wählbar unter dem bereits vorhandenen Design-Umschalter
(Dashboard-Kopfzeile "Design"-Button bzw. Profil → Einstellungen → Design).

**Wichtigste Erkenntnis vorab**: Es gab schon ein passendes Fundament — das
Skin-System aus der vorherigen Session (`ThemeService`/`SkinPicker`,
CSS-Custom-Properties `--skin-*` → `--sp-*`/`--font-*`), das App-weit über
35 Dateien hinweg schon konsequent verwendet wurde. Die 10 Designs sind
deshalb als **Erweiterung** dieses bestehenden Systems umgesetzt, nicht als
Neubau: `theme.models.ts` (10 neue `SkinId`s), `theme.service.ts` (volle
Paletten inkl. Radius/Schatten/Schriften 1:1 aus der Referenz übernommen),
`variables.scss`/`konto-theme.scss` (Fonts jetzt ebenfalls über Skin
überschreibbar), neue `src/theme/designs.scss` für kleine globale
Zusatzakzente (Baustelle-Warnstreifen oben, Schriftschnitt-Korrektur für
einschnittige Fonts).

**Zwei echte, vorher unbemerkte Bugs gefunden und mitgefixt** (wären sonst
bei den neuen HELLEN Designs — Baustelle, Bahn-Clean, Streckennetz —
aufgefallen): `--sp-text`/`--sp-text-muted`/`--sp-border`/`--font-*` waren
in `variables.scss` UND zusätzlich unabhängig in 14 Seiten-SCSS-Dateien
sowie in `konto-theme.scss`s Mixin **hartkodiert auf die dunklen
Streckenplan-Werte**, nicht überschreibbar. Ohne den Fix wäre auf einem
hellen Design der Fließtext (heller Text auf hellem Grund) unlesbar
gewesen. Fund kam vor dem Ausliefern per gezieltem Grep, nicht erst beim
visuellen Test — die 14 Dateien enthielten Byte-für-Byte denselben
6-zeiligen Block, per `perl`-Script in einem Rutsch sauber gefixt.

**Schriftschnitt-Detail aus der Referenz übernommen**: VT323 (Bahnsteig),
Share Tech Mono (Gleisbildstellwerk) und Press Start 2P (Gelbe Flotte)
existieren nur in Schriftschnitt 400 — ohne expliziten Override hätte der
Browser sie bei den App-weit hartkodierten `font-weight:700`-Überschriften
"fake-bold" synthetisiert und ihren eigentlichen Terminal-/Pixel-Charakter
verwaschen. Genau wie in der Referenz (die für Bahnsteig deshalb
`font-weight:400` auf Überschriften setzt) per gezieltem, dokumentiertem
`!important`-Override in `designs.scss` behoben.

**Backend mitgezogen**: `user_settings.skin` hatte ein Zod-Enum
(`backend/src/routes/settings.ts`) UND eine Postgres-`CHECK`-Constraint
(`backend/src/index.ts`, `backend/db/init/07_profile_system.sql`) mit der
alten, kürzeren Werteliste — ohne Anpassung hätten eingeloggte Nutzer die
neuen Designs zwar lokal sehen, aber nicht serverseitig speichern können
(Zod/Constraint-Fehler). Beide erweitert, inkl. Migration
(`DROP CONSTRAINT IF EXISTS` + `ADD CONSTRAINT`) für die bereits laufende
Installation.

**Verifiziert per Playwright** (lokaler Dev-Server, `ng serve`, echter
Login durchs Site-Gate): alle 10 Designs + die 6 bestehenden Skins korrekt
im Umschalter, Signalwerk als Standard für neue Besucher (kein gespeicherter
Wert), Farben/Schriften pro Design korrekt aufgelöst (`getComputedStyle`
gegengeprüft), Schriften laden nachweislich nur bei aktivem Theme
(`document.fonts`-Status), kein Flackern beim Neuladen (neues
Anti-FOUC-Bootstrap-Script in `index.html`, direkt nach `commit` geprüft,
noch vor Angular-Bootstrap), Mobile-Breite (390px) geprüft, keine
Konsolenfehler in keinem der getesteten Designs.

**Bewusst NICHT umgesetzt** (Scope-Entscheidung, siehe
`design-reference/prompt-claude-code-themes.md` Abschnitt
"Signatur-Komponenten" für die volle Ambition): die zehn bespoken,
datengekoppelten Signatur-Komponenten aus dem ursprünglichen Auftragsprompt
(z. B. eine neue Split-Flap-Komponente fürs Quiz-Duell, ein
Streckennetz-Lernpfad gekoppelt an echten Fortschritt mit fahrendem Zug,
ein XP-/Level-System für Gelbe Flotte, Fahrstraßen-Animation beim
Seitenwechsel für Gleisbildstellwerk) sowie die eigene `/design-demo`-Route.
Das wäre ein eigenständiges, deutlich größeres Vorhaben (mehrere neue
Komponenten, teils neue Datenmodelle wie ein XP-System, das es aktuell gar
nicht gibt) gewesen als eine reine Farb-/Schrift-/Radius-Umsetzung — bewusst
zurückgestellt, um die App nicht mit unfertigen/riskanten Umbauten zu
belasten. Quiz-Duell und das Login-Gate (`site-gate.component`) behalten
ihr bereits bestehendes, unabhängiges "Steel/Signal"-Farbschema (Absicht aus
einer früheren Session) — sie übernehmen jetzt nur die Schrift des aktiven
Designs, nicht dessen Farben.

**Deployment**: Frontend gebaut und per tar-über-SSH auf den Server
hochgeladen (live). **Backend-Redeploy (Zod/Postgres-Erweiterung) noch
NICHT ausgerollt** — der Auto-Mode-Classifier hat den Upload+Container-
Rebuild-Schritt blockiert (Sicherheitsgrenze für Produktions-Schreibzugriffe
mit Docker-Rebuild), Tim muss diesen einen Schritt selbst freigeben oder
ausführen (Befehl in [[../../server_deployment_michiserver|Server-Deployment-Notiz]]
bzw. Claude-Memory `server_deployment_michiserver.md`). Bis dahin: alle 10
Designs funktionieren für JEDEN Besucher (auch eingeloggt) lokal im Browser
einwandfrei — nur das serverseitige Speichern der Design-Wahl über Profil →
Einstellungen → "Einstellungen speichern" schlägt für die 10 neuen IDs bis
zum Backend-Redeploy still fehl (kein Absturz, nur keine
Sync-Bestätigung).

## 2026-08-26 — HTTP-Basic-Auth durch App-internes Login-Gate ersetzt

Tim konnte von seinem Arbeits-PC aus nicht auf die App zugreifen (der
native Browser-Basic-Auth-Dialog aus dem Firmennetzwerk heraus). Auf seinen
Wunsch wurde der Sitewide-Passwortschutz von der Caddy-Ebene (HTTP Basic
Auth, `deploy/Caddyfile`) in die App selbst verlagert.

**Neu**: `src/app/core/site-gate/` — ein einfaches Login-Formular
(Nutzername/Passwort), das `<ion-app>` umschließt. Bei korrekter Eingabe
(SHA-256-Vergleich gegen einen im Bundle liegenden Hash) wird das Ergebnis
in `localStorage` (`glw-site-auth`) gemerkt, sodass das Formular bei
späteren Besuchen im selben Browser nicht mehr erscheint. Zugangsdaten:
Nutzername `gleisbau`, neues Passwort `Bohle-6100-Schwelle` (Tim
mitgeteilt).

**Bewusster Trade-off**: `basic_auth` wurde komplett aus dem Caddyfile
entfernt — die statischen Dateien (JS/JSON/Assets) sind serverseitig jetzt
ungeschützt, nur noch `robots.txt` (Disallow: /) und ein
`<meta name="robots" content="noindex,nofollow">` verhindern die
Auffindbarkeit über Suchmaschinen. Das ist bewusst ein reines Soft-Gate
("muss ja nicht so sicher sein, soll nur noch nicht öffentlich öffentlich
sein") — wer die direkte Asset-URL kennt, kommt technisch auch ohne Login
an die Rohdaten. Für Tims aktuellen Zweck (Bilder/Inhalte noch nicht final)
ausreichend.

Verifiziert lokal per Playwright (`serve -s` mit SPA-Fallback): Gate
erscheint vor Login, falsches Passwort wird abgelehnt, richtiges Passwort
schaltet frei und übersteht einen Seiten-Reload. Live-Deployment auf
`michiserver` per `docker compose up -d` (Proxy-Container neu erstellt,
Caddy sauber ohne `basic_auth`-Direktive gestartet) — `curl` bestätigt
`200` statt `401` auf `https://app.gleisbau-digital.org/`.

**Offen**: Der Zugriffsfehler vom Arbeits-PC könnte auch ein
Netzwerk-/Firewall-Block gewesen sein (nicht Basic-Auth-spezifisch) — das
lässt sich nur durch einen erneuten Test von dort aus klären.

---

## 2026-08-25 (4) — Backend reaktiviert, App auf echtem Server deployt, Passwort-Gate eingerichtet

Tim wollte Zugriff auf die App von der Arbeit aus, ohne sie öffentlich zu
machen, und "alles was bisher nur für die Probe war" beim Backend fertig
haben. Nach Klärung per Rückfrage (einfaches Sitewide-Passwort statt volles
Konten-System; Server+Domain bereits vorhanden) SSH-Zugang zu Tims eigenem
Heimserver (`michiserver`, 192.168.0.102, Ubuntu, Docker bereits
installiert) erhalten und das Deployment durchgeführt.

**Sicherheitsfix zuerst**: der fest im Code stehende Admin-Zugang
(`admin`/`1234`) wurde entfernt — `ADMIN_EMAIL`/`ADMIN_PASSWORD` sind jetzt
Pflicht-Umgebungsvariablen ohne Default (`backend/src/config.ts`), der
Server startet ohne sie gar nicht erst.

**Deployment-Setup erweitert**: das bisherige `deploy/`-Setup deckte nur
die API ab — neuer `APP_DOMAIN`-Site-Block im Caddyfile serviert jetzt
zusätzlich das gebaute Angular-Frontend (statische Dateien aus
`deploy/frontend-dist/`) mit HTTP-Basic-Auth-Passwortschutz. Kompletter
Stack (Postgres + API + Caddy) läuft jetzt auf `michiserver` unter Docker
Compose, verifiziert per `caddy adapt` (kompilierte Config direkt geprüft,
nicht nur auf Fehlerfreiheit der Logs vertraut).

**Bug unterwegs gefunden und behoben**: ein `$`-Zeichen im generierten
Bcrypt-Passwort-Hash wurde von Docker Compose als Variablenreferenz
fehlinterpretiert und stillschweigend durch einen Leerstring ersetzt (nur
eine unauffällige `"...variable is not set"`-Warnung, kein Fehler) — das
Passwort-Gate hätte mit dem echten Passwort nicht funktioniert. Fix: jedes
`$` in `deploy/.env`-Werten als `$$` escapen, danach per `caddy adapt`
gegengeprüft, dass der kompilierte Hash wirklich stimmt.

**Domain `gleisbau-digital.org` (Cloudflare) — DNS/Portweiterleitung noch
offen**, das ist der letzte Schritt, den nur Tim selbst machen kann
(Router-Zugriff, Cloudflare-Dashboard). Details, Zugangsdaten-Handling und
offene Punkte: [[../07-Offene-Punkte/Offene-Punkte]],
[[../../deploy/README]].

Nebenbei: auf Tims Bitte ("guck mal ob du damit was anfangen kannst")
`https://developers.cloudflare.com/agent-setup/prompt.md` abgerufen und
darüber 13 offizielle Cloudflare-Skills installiert (u. a. `cloudflare`,
`cloudflare-one`, `wrangler`) — für dieses und künftige Cloudflare-Vorhaben
nützlich.

---

## 2026-08-26 (1) — Bilder für Themenquiz-Fragen: 207/667 mit verifiziertem, kommerziell nutzbarem Bild (erste Runde)

Tim wollte spät abends vor dem Schlafengehen: zu möglichst jeder Frage im
Themenquiz ein Bild mit kommerziell nutzbaren Rechten, Quellenverweis und
Lizenznachweis; Fragen ohne passendes Bild explizit auflisten statt leer
lassen; Cline soll den Großteil der Recherche übernehmen.

Neues Architekturmuster: Fragen referenzieren einen `imageKey`, der in
`bildnachweise.json` aufgelöst wird (dasselbe zentrale Register wie für
die Themen-Kachelbilder) — ein Bild kann so mehrere ähnliche Fragen
abdecken, ohne Quelle/Lizenz zu duplizieren, und `/bildnachweise` zeigt
automatisch alles mit an.

24 automatisch generierte Gwen-Rechercheaufträge (einer pro Thema, volle
Fragenliste eingebettet), mit einer nach Kalibrierung entstandenen
mechanischen Regel ("nur Bild, wenn Ergebnistitel mit File: beginnt oder
URL auf Bildformat endet") — Gwen hatte anfangs wiederholt normale
Webseiten als "Bild" ausgegeben und dabei sogar falsche Lizenzen
zugeschrieben. Verifikation über die Wikimedia-Commons-API (Batch-Abfrage
für 130 Kandidaten in 4 statt 130 Anfragen) statt Einzel-WebFetch —
dabei zwei eigene Bugs gefunden und behoben (Lizenz-Regex erkannte "CC
BY-SA" mit Leerzeichen nicht, wodurch fälschlich fast alle als "nicht
kommerziell" markiert wurden; Titel-Abgleich schlug bei Dateinamen mit
Leerzeichen fehl, da URL-dekodierte Namen Unterstriche behalten). Nach
beiden Fixes: alle 129 gültigen Commons-Kandidaten hatten tatsächlich
eine kommerziell nutzbare Lizenz. Zusätzlich 14 inhaltliche Fehltreffer
per Titel-Durchsicht aussortiert (u. a. ein Verkehrsschild "Splitt,
Schotter" statt Gleisschotter, ein Matcha-Tee-Besen statt Weichenbesen,
ein mechanisches Zahnrad "Spur gear" statt Spurweite, ein Nachtzug-
Angebot "European Sleeper" statt Bahnschwelle — alles Wortspiel-
Fehltreffer trotz technisch korrekter Lizenz).

Ergebnis: 76 neue Bildnachweise (jetzt 102 gesamt), 204 Fragen neu
verknüpft (plus 3 aus Runde 19 → 207/667 = 31 % Gesamtabdeckung). 460
Fragen noch ohne Bild, vollständig mit Fragetext gelistet für Tims
eigene Bildproduktion oder eine Fortsetzungsrunde. Details:
[[../14-Gwen-Code-Aufgaben/20-Bilder-fuer-Fragen]],
[[../17-Bilder-fuer-Fragen/00-Fragen-ohne-Bild]].

---

## 2026-08-25 (3) — Trassenplan-Thema ausgeweitet: 23 → 45 Fragen, Schwierigkeitsgrade, eigene Legenden-Grafik (laufend)

Tim wollte das Thema "Trassenplan lesen" groß ausbauen: erst eine
Cline/Gwen-gestützte Massenrecherche nach echten Beispiel-Trassenplänen
mit Erklärungen (Claude prüft nur), dann während einer Abwesenheit
zusätzlich Schwierigkeitsgrade einführen, den Fragenpool erweitern und
nach Möglichkeit (rechtssicher, auch kommerziell nutzbar) Bilder ergänzen.

Fünf Gwen-Batches (25 Suchrichtungen) fanden 77 Kandidaten-Links, davon
72 lebendig (per HTTP-Check geprüft) — dank verschärfter Anti-
Fabrikations-Regeln (Pflicht-Selbsttest zuerst, explizites "keine
gefunden") eine der saubersten Recherchequoten bisher. Bester Fund: das
offizielle **Muster-Legendenheft des Eisenbahn-Bundesamts** (19 Planarten
in Planfeststellungsverfahren, exakte Farbcodes/Linienarten), plus eine
TU-Dresden-Übungsunterlage mit echten Trassierungs-Grenzwerten und ein
Leitfaden auf Basis DB-Ril 800.0110/TSI Infrastruktur.

Daraus direkt umgesetzt: neues optionales Feld `difficulty` (einfach/
mittel/schwer/profi) im Fragenschema mit farbigem Badge in der
Quiz-Oberfläche, alle 23 bestehenden Trassenplan-Fragen eingestuft, 22
neue Fragen mit echten Quellen ergänzt (Fragenpool 23 → 45,
`questionCount` in `topics.json` aktualisiert), neues optionales Feld
`image` fürs Fragenschema plus eine komplett selbst gezeichnete SVG-
Legendengrafik (Bestand/Neubau/Rückbau-Farbcodierung) — keine der
gefundenen echten Pläne hatte eine eindeutig freie, kommerziell
nutzbare Lizenz, daher bewusst kein Bild-Import aus den PDFs.

Details, alle Gwen-Fallstricke dieser Runde und offene Folgeschritte:
[[../14-Gwen-Code-Aufgaben/19-Trassenplan-Erweiterung]],
[[../16-Trassenplan-Ausbau/01-Verifizierte-Quellen]].

---

## 2026-08-25 (2) — Rechte-Recherche zu Quellen-Links und Bildern abgeschlossen, neue Seite `/rechte`

Tim wollte wissen, ob die 645 externen Quellen-Links (Link + eigener
Kurztext) rechtlich unbedenklich sind, und alle Wikimedia-Commons-
Bildlizenzen komplett neu verifiziert haben (nicht nur aus der alten
Recherche übernommen) — explizit als KI-Einschätzung, keine Rechtsberatung.

Alle 258 verlinkten Domains in 7 Kategorien eingeordnet (Wikipedia,
amtliche Gesetzestexte, öffentliche Stellen/BGs, bahnnahe Unternehmen,
kommerzielle Fachlexika, Herstellerseiten, kleine Fachseiten/Foren), die
10 häufigsten einzeln per Impressum/Nutzungsbedingungen geprüft. Ergebnis:
kein einziger Fall mit explizitem Link-/Zitierverbot; reines Verlinken +
eigener Kurztext ist nach EuGH-Rechtsprechung (Svensson/GS Media) und
§ 2/§ 5 UrhG rechtlich unbedenklich. Von 53 `source`-Feldern mit
Anführungszeichen (Verdacht auf Wortlaut-Zitat) waren 18 bereits reine
Titel-/Begriffsnennungen (unproblematisch) und **35 enthielten echten,
zitierten Wortlaut** — diese wurden direkt umgeschrieben auf eigenständige
Kurzformulierungen (Link unverändert).

Alle 25 Wikimedia-Commons-Bildlizenzen einzeln neu gegen die aktuelle
Commons-Dateiseite geprüft: 24 vollständig bestätigt, 1 Korrektur
(`handwerkzeuge`-Bild — Fotograf/Behörde war ungenau als "NARA"
zugeordnet, tatsächlich Jim Pickerell für die EPA; gemeinfreier Status
unverändert korrekt).

Neue Seite `/rechte` (Modul `src/app/rechte/`, gleiches Streckenplan-
Design wie `/bildnachweise` und `/quellenverzeichnis`, dritter
Footer-Link im Dashboard) fasst alles zusammen, inkl. gut sichtbarem
Disclaimer ("Keine Rechtsberatung"). `ng build` grün mit eigenem Chunk,
Playwright-Check ohne Konsolenfehler. Details:
[[../14-Gwen-Code-Aufgaben/18-Rechte-an-Quellen-und-Bildern]].

---

## 2026-08-24 (2) — Themenquiz-Quellenprüfung abgeschlossen: 645/645 Fragen mit Quelle+Link (100 %)

Tim wollte, dass bei jeder Frage in den 24 Themenquiz-/Lernfeld-Quizzen
(645 Fragen) eine Quelle mit direktem Link steht, recherchiert und geprüft
von Gwen, mit einer schlanken Abschluss-Prüfung durch Claude — ausdrücklich
"sehr sauber durchgeführt". Die `source`/`sourceUrl`-Felder und ihr
Rendering existierten bereits im Code (aus einer früheren Runde
vorbereitet), waren aber bei 0/645 Fragen befüllt.

Neuer, selbst-fortsetzender Dispatch-Workflow unter
`tools/themenquiz-quellenpruefung/` (`run-batches.cjs` überspringt
automatisch bereits fertige Batches anhand der App-JSON selbst). Erster
Formatversuch (15 Fragen/Batch, 4 Platzhalter) scheiterte — Gwen driftete
ab Frage 5 auf erfundene generische Antworten statt der echten Fragen.
Nach Verkleinerung auf 5 Fragen/Batch mit 1 einfachem Feld blieb die
Qualität stabil. Über den Verlauf acht verschiedene Parser-/Prozess-Bugs
gefunden und behoben (URLs an Klammern abgeschnitten, doppelte Frage-IDs
überschrieben echte Antworten, BOM-Fallstrick erneut aufgetreten,
doppelt-kodiertes UTF-8, Markdown-Linksyntax leckte in URLs).

**Wichtigster Fund**, erst bei einer Vollprüfung aller 482 eingetragenen
URLs (nicht nur Stichproben) entdeckt: Gwen hat bei mehreren Fragen-Clustern
**erfundene, aber plausibel klingende Domains** als Quelle angegeben,
statt ehrlich "keine gefunden" zu schreiben — z. B. `azmk.de/faq/lfo1/
lfo1_q31.html`, fünfmal in Folge mit zur echten Frage-Nummerierung
passendem Pfad. 45 betroffene Fragen entfernt, `apply-results.cjs` prüft
seither jede neue URL per DNS-Auflösung, bevor sie übernommen wird.
Daneben u. a. mehrere echte 404s, ein 410, mehrere Forenbeiträge und ein
paywalled Link gefunden und entfernt (juraforum.de dagegen per WebFetch
geprüft und trotz Namens als seriöse Rechtsdatenbank bestätigt, behalten).

**Endstand (nach einer zweiten Runde am 2026-08-25): 645/645 Fragen
(100 %) mit echter, verifizierter Quelle**, über alle 24 Themen verteilt.
Build grün, Link-Rendering in der Quiz-Oberfläche per Playwright
bestätigt. Details, komplette Bug-Liste und Fund-Historie:
[[../14-Gwen-Code-Aufgaben/15-Themenquiz-Quellenpruefung]].

---

## 2026-08-25 — Neue Seite "Quellenverzeichnis" + Rechte-Recherche-Auftrag vorbereitet

Tim wollte eine zentrale Seite mit allen Fragen, Antworten und Quellen
für volle Transparenz. Die Quellen-Anzeige direkt im Quiz (per Frage
nach dem Beantworten) existierte bereits aus einer früheren Runde. Neue
Seite `/quellenverzeichnis` gebaut: alle 24 Themen einklappbar, pro Frage
Fragetext/Antwort/Quelle mit Link, Volltextsuche über Fragen/Antworten/
Quellen, Link im Dashboard-Footer neben "Bildnachweise". Details:
[[../14-Gwen-Code-Aufgaben/16-Quellenverzeichnis-Seite]].

Dabei zum zweiten Mal die kaputte `cline`-Installation angetroffen
(`npm install -g cline` behoben) — diesmal am verlässlichen Muster "alle
3 Versuche scheitern in 0 Sekunden" erkannt statt an wechselnden
Fehlermeldungen. Die letzten 9 fehlenden Quellen aus der Vortagesrunde
wurden dabei auch geschlossen (siehe Eintrag oben, jetzt 100 %).

Anschließend wollte Tim eine **Rechte-Recherche** in einer neuen
Chat-Session: prüfen, ob das Verlinken + kurze Begründen mit den 641
externen Quellen-Domains rechtlich unproblematisch ist (oder ob Texte
umgeschrieben werden müssen), plus eine komplette Neu-Prüfung aller
Bildlizenzen (Wikimedia Commons) — Ergebnis soll auf einer neuen Seite
"Rechte an Quellen und Bildern" landen. Auftrag/Prompt dafür vorbereitet
und dokumentiert: [[../14-Gwen-Code-Aufgaben/17-Rechte-Recherche-Auftrag]].
Die Recherche selbst ist noch nicht gestartet — das ist Aufgabe der
nächsten Session.

---

## 2026-08-24 — Alle restlichen Modul-Bilder ergänzt: 14/14 Lernfelder + 4/4 Spiele

Tim wollte, dass ausnahmslos jedes Modul ein Bild hat. Claude hat direkt
weiterrecherchiert (WebSearch/WebFetch, kein erneuter Gwen-Versuch — siehe
Eintrag unten zum siebten Fallstrick) und alle verbleibenden Luecken
geschlossen:

**7 weitere Lernfeld-Fotos** (jedes einzeln ueber die Commons-Dateiseite
verifiziert, Hotlink getestet): LF01 Baustellen einrichten (HafenCity-
Baustelle, Mozzihh), LF02 Bauwerke erschliessen (Baugrube mit Böschung,
Patrick Oberdoerfer), LF05 Holzkonstruktionen (Fachwerk-Abbund, Georg
Hefter), LF06 Beschichten/Bekleiden (Wärmedämmverbundsystem, Handwerker),
LF07 Baugruende erkunden (Rammkernsondierung, Jonas Boerje Lundin), LF10
Gleisanlagen neu bauen (Gleisbau in Probsteierhagen, Siegbert Brey), LF13
Weichen instand halten (Weichenheizung, Fabian Grunder) — alle CC BY-SA
3.0/4.0.

**2 neue Eigen-Grafiken** fuer LF11 (Gleisboegen herstellen und einmessen)
und LF14 (Sonderbauformen), da beide zu abstrakt/unspezifisch fuer ein
passendes Foto sind: `gleisbogen-diagramm.svg` (Bogenradius mit
Mittelpunkt und Winkel) und `sonderbauformen-diagramm.svg`
(Schotteroberbau vs. Feste Fahrbahn + Andreaskreuz). **Damit haben jetzt
alle 14 Lernfelder ein Bild.**

**Spiele-Kacheln nachgezogen**: fiel dabei auf, dass alle 4 Spiele
(Nivellierlatte ablesen, Schienenkopf-Verschleissmesser, Schienen
erkennen, Quiz-Duell) bisher komplett ohne Bild waren. Nivellierlatte
ablesen bekam ein echtes Foto einer Nivellierlatte (Wurzeltee), Schienen
erkennen ein Foto mit vier verschiedenen Schienenprofilen im direkten
Vergleich (Falk2) — fast wörtlich das Spielprinzip. Fuer
Schienenkopf-Verschleissmesser (Nischen-Messgeraet, keine freie
Foto-Quelle auffindbar) und Quiz-Duell (abstraktes App-Feature) je eine
eigene SVG.

**Ergebnis: alle 33 Katalog-Kacheln der App haben jetzt ein Bild** (10
Wissenstests, 14 Lernfelder, 5 Rechentrainer, 4 Spiele). Build gruen,
Playwright bestaetigt alle 11 neuen Bilder rendern korrekt, keine
Konsolenfehler. Details: [[../14-Gwen-Code-Aufgaben/14-Rechentrainer-Umbau]].

---

## 2026-08-23 (2) — Fünf Lernfeld-Bilder recherchiert und eingebaut (LF03/04/08/09/12)

Fortsetzung des Bild-Auftrags aus dem Eintrag unten. Der ueber Gwen
angestossene Recherche-Dispatch ist **gescheitert**: in den ersten beiden
von drei Versuchen missverstand Gwen die Aufgabe komplett (hielt die
Auftragsdatei selbst fuer das Bearbeitungsziel), im dritten Versuch verstand
Gwen die Aufgabe richtig und recherchierte tatsaechlich — bekam aber bei
**jedem** Versuch, eine Wikimedia-Commons-Seite zu laden, HTTP 403 vom
eigenen Fetch-Tool zurueck (ein neues, siebtes Gwen-Fehlerbild, diesmal
strukturell/infrastrukturell statt inhaltlich — siehe [[../00-Start-Hier]]).
Gwen wich deshalb auf Pixabay/Pexels aus, was der vorgegebenen
Commons-Praeferenz widerspricht; der Prozess stuerzte zudem direkt beim
Versuch, die Ergebnisdatei zu schreiben, mit dem bekannten Jinja-Fehler ab
— nichts wurde gespeichert.

Claude hat die erste Bild-Batch daraufhin selbst per WebSearch/WebFetch
recherchiert (Commons ist fuer Claudes Fetch-Zugriff normal erreichbar).
**5 Bilder gefunden, einzeln ueber die echte Commons-Dateiseite verifiziert
(Lizenzbox, Autor, exakte Attribution) und der Hotlink per `curl` auf HTTP
200 getestet**, dann in `katalog.ts` und `bildnachweise.json` eingetragen:

- **LF03 Mauern**: Bricklayer J4.jpg (Jamain, CC BY-SA 3.0)
- **LF04 Stahlbeton**: BGJ Lernfeld 4 – Stahlbeton Waende Rahmenschalung...jpg (Patrick Oberdoerfer, CC BY-SA 4.0)
- **LF08 Erdbau**: Dresden, Fritz-Loeffler-Gymnasium, Baugrube 031.jpg (Bybbisch94 & Christian Gebhardt, CC BY-SA 4.0)
- **LF09 Pflaster**: Paving being laid arp.jpg (Adrian Pingstone/Arpingstone, gemeinfrei)
- **LF12 Weichen**: New point motor.jpg (Phil Sangwell, CC BY 2.0)

Per Playwright bestaetigt: alle 5 Kacheln auf `/kategorie/lernfelder`
zeigen das richtige Bild, Bildnachweise-Seite listet alle 5 Eintraege
korrekt, keine Konsolenfehler, Build gruen. Damit sind 5 von 14
Lernfeldern bebildert. Offen: LF10/LF13 (keine ueberzeugenden Treffer bei
der ersten Suche) sowie LF01/02/05/06/07/11/14 (noch nicht recherchiert).
Details: [[../14-Gwen-Code-Aufgaben/14-Rechentrainer-Umbau]].

---

## 2026-08-23 — Rechentrainer auf Streckenplan umgestellt, Selbstlern-Texte raus, zwei neue Bilder

Der komplette Rechentrainer-Bereich (Nivellieren, Volumen, Prozentrechnung,
Gesamtquiz, Materialrechner) war als letzter Teil der App noch im alten
weiss/hellblauen Ionic-Standarddesign. Jetzt durchgehend Streckenplan-Design
(dunkel, `--sp-*`-Tokens). Bei Nivellieren/Volumen/Prozentrechnung wurden
zusaetzlich die ausfuehrlichen Selbstlern-Texte (Leitfaden-Bloecke,
"Erledigt"-Tracking, Block-Navigation) komplett entfernt — Tim vermittelt
die Inhalte selbst, die App soll nur noch abfragen. Alle drei Seiten sind
jetzt strukturell wie Gesamtquiz: Hero + volle Quiz-Engine, sonst nichts.
Das seit 2026-08-17 bereits tote `SELBSTSTUDIUM_TILES`-Array in
`katalog.ts` wurde mit geloescht (verwies genau auf die jetzt entfernten
Texte). Zwei neue selbst gezeichnete SVG-Grafiken (Nivellieren-Geraet-
Diagramm, Gesamtquiz-Netz-Motiv) schliessen die letzten Bild-Luecken im
Rechentrainer-Bereich, im gleichen Stil wie die bestehenden
Volumen/Prozentrechnung/Trassenplan-SVGs.

**Gwen-Bilanz:** durchwachsen — die globale Cline-Installation war zu
Sitzungsbeginn tatsaechlich kaputt (`npm install -g cline` hat es
behoben, siehe [[../14-Gwen-Code-Aufgaben/14-Rechentrainer-Umbau]]), und
danach trat ein **neues, sechstes Gwen-Fehlerbild** auf: neuer Inhalt wurde
an den alten angehaengt statt ihn zu ersetzen — technisch gueltiges SCSS,
gruener Build, aber die alten (falschen) Regeln haetten dank CSS-Kaskade
gewonnen. Nur durch vollstaendiges Lesen der Datei entdeckt, nicht durch
den Diff allein. Von 6 fuer Gwen vorgesehenen Reskin-Dateien wurde am Ende
nur 1 tatsaechlich brauchbar von Gwen geliefert, der Rest von Claude direkt
geschrieben.

Die Recherche fuer die noch fehlenden 14 Lernfelder-Bilder wurde ueber
Gwen angestossen — Ergebnis siehe Eintrag oben ("Fuenf Lernfeld-Bilder
recherchiert und eingebaut"): der Gwen-Dispatch scheiterte strukturell,
Claude hat die erste Batch stattdessen selbst recherchiert.

Per Playwright bestaetigt: alle 5 Rechentrainer-Seiten + die
Rechentrainer-Kategorieseite durchgehend im neuen Design, keine
Konsolenfehler, neue Bilder rendern korrekt.

---

## 2026-08-22 (4) — Quiz-Duell: Wiedereinstieg zeigt immer die Auswahl statt automatisch das letzte Match fortzusetzen

Bug aus der vorigen Runde: Ionic haelt Seiten im Navigations-Cache am Leben
-- beim erneuten Aufruf von `/zusatz/quizduell/duell` blieb die Komponente
im zuletzt aktiven `state` ("mitten im Spiel") haengen, `ionViewWillEnter`
aktualisierte die "Laufende Spiele"-Liste nur, wenn man zufaellig schon auf
dem Setup-Screen war. Tim wollte stattdessen: raus und wieder rein soll
immer zur Auswahl fuehren (neues Duell starten ODER eines der laufenden
fortsetzen), nicht zwangslaeufig ins zuletzt gespielte Match. Fix:
`ionViewWillEnter` setzt jetzt IMMER auf `state = 'setup'` zurueck (der
Spielstand ist laengst in `localStorage` gesichert, geht also nichts
verloren) und laedt die Liste neu.

Damit funktioniert jetzt auch das eigentliche Ziel dahinter: **mehrere
gleichzeitig laufende Duelle** (Tim: "wie eine Extrakarteikarte" -- passend
zum Vorbild, wo man mit mehreren Leuten parallel offene Duelle haben kann,
ohne zu wissen, wann wer antwortet). Die Datenschicht
(`QuizduellDataService.speichereMatch`, Array in `localStorage`) hat das
schon vorher unterstuetzt, nur der Navigations-Bug verhinderte es in der
Praxis. Per Playwright bestaetigt: zwei parallele Matches (SpielerA/
SpielerB, je gegen eigenen Bot) angefangen, beide erscheinen als eigene
Karten, gezieltes Fortsetzen der ersten Karte laedt wirklich deren eigenen
Stand (nicht den der zweiten).

---

## 2026-08-22 (3) — Quiz-Duell: Feinschliff nach erstem Live-Test (Gast-Namen, mehr Themen, laufende Spiele, Textfarben-Bugfix)

Tim hat die Steel/Signal-Version live getestet und Nachbesserungen
gewünscht — alle direkt von Claude umgesetzt (kleine, praezise Logik-/
Config-Aenderungen an bestehenden Dateien, kein Gwen-Dispatch diese Runde):

1. **Automatischer Gast-Name**: Klick auf "Gegner suchen" ohne Namenseingabe
   erzeugt jetzt `Gast_XXXX` (analog zu den Bot-Namen), statt eine
   Fehlermeldung zu zeigen.
2. **Mehr Themenoptionen pro Runde**: 4 statt 3 Kategorie-Vorschläge
   (`KATEGORIE_OPTIONEN_ANZAHL` in `quizduell.models.ts`). Der Themenpool
   selbst war mit allen 24 `topics.json`-Einträgen (10 Wissenstest + 14
   Lernfelder) schon vorher vollständig.
3. **Name-Wiederverwendung**: Gast-Name wird in `localStorage`
   (`quizduell-gast-name`) gemerkt und beim naechsten Besuch vorausgefuellt.
4. **Laufende Spiele**: jedes angefangene, noch nicht abgeschlossene Match
   wird nach jedem Schritt in `localStorage` (`quizduell-offene-matches`)
   gespeichert. Die Setup-Seite zeigt eine "Laufende Spiele"-Liste mit
   Gegner/Rundenstand, "Weiterspielen" stellt den exakten Punkt wieder her
   (inkl. neu geladener Fragen anhand der gespeicherten Frage-IDs);
   abgeschlossene Matches verschwinden automatisch aus der Liste.
5. **Bugfix schwarzer Text auf dunklem Grund** (Kategoriewahl, Punktestand):
   Ursache war eine bisher unbekannte Ionic-Eigenheit, nicht ein
   Gwen-Fehler — `::slotted(*)` in `<ion-content>` überschreibt geerbte
   `:host`-Farben fuer alles ohne eigene explizite `color`-Regel. Fix:
   `color` zusätzlich explizit auf dem obersten `.app-shell`-Wrapper in
   allen drei Quiz-Duell-Seiten gesetzt. Neue Vault-Notiz dazu in
   [[../00-Start-Hier]] (Design-Abschnitt), da das jede künftige
   eigenständig gestylte `ion-content`-Seite treffen könnte, nicht nur
   Quiz-Duell.

Alle fünf Punkte per Playwright end-to-end bestätigt (Auto-Name, 4
Kategorien, Namens-Vorausfüllung nach Reload, Speichern/Fortsetzen/
Verschwinden eines laufenden Matches, korrigierte Textfarbe per
`getComputedStyle`-Check).

---

## 2026-08-22 (2) — Quiz-Duell nach Tims Referenz-Prototyp umgebaut: Bot-Gegner statt Pass-and-Play, neues Steel/Signal-Design

Tim hat einen selbst (bei einer anderen Claude-Instanz) beauftragten
HTML-Prototyp (`gleisbau-quizduell.html`) als verbindliche Vorlage
geliefert: "genau eins zu eins nachbauen". Umgesetzt, mit zwei
kommunizierten Abweichungen — echte Themenquiz-Fragen statt des
unbelegten Demo-Fragenpools der Vorlage, selbst gehostete Fonts
(Barlow/JetBrains Mono) statt neuer Google-Fonts-Links fuer Inter/IBM
Plex Mono (gleiche Rolle, passt zur bestehenden Font-Konvention).

**Wichtigste Aenderung:** Der Gegner ist jetzt immer ein simulierter
**Trainings-Bot** (Schwellen-Klaus, Weichen-Steller-Bot, Gleisbau-Trainer,
Prellbock-Peter, Signal-Susi — feste Trefferquote 65 % pro Frage, keine
echte KI) statt eines zweiten Menschen am selben Geraet. Simuliertes
Matchmaking ("Gegner wird gesucht" → faellt nach ~3,6s zuverlaessig auf
Bot zurueck) macht das Duell jetzt **allein spielbar**, kein
Geraet-Weiterreichen mehr noetig. Neues, eigenstaendiges visuelles Design
("Steel/Signal") nur fuer Quiz-Duell — dunkle Stahl-Palette, oranges
Schienen-Leisten-Motiv oben im Rahmen, bewusst unabhaengig vom
Streckenplan-Theme des restlichen App, weil Tim explizit diesen Look so
wollte.

**Gwen-Bilanz:** 3 Runden, siehe
[[../14-Gwen-Code-Aufgaben/13-Quizduell-Referenz-Umbau]] — dabei zwei
weitere, bisher nicht dokumentierte Fehlerbilder entdeckt (fehlendes
Anfuehrungszeichen bei eng am `>` stehenden Attributwerten; eine von zwei
Dateien in einem Mehrdatei-Auftrag komplett ausgelassen trotz
`SUCCESS_BUILD_OK`, weil die alte Datei zufaellig weiter gueltiges CSS
war). Die groesste Datei (Duell-Seite, State-Machine mit 7 Phasen) wurde
diesmal direkt von Claude geschrieben, aus Vorsicht nach der
`<br>`-Degenerations-Erfahrung der letzten Runde.

Per Playwright zwei komplette Matches durchgespielt (Gast-Sieg 11:7 gegen
Bot, eingeloggtes Match mit Statistik-/Rating-/Errungenschaften-Update) —
alles bestaetigt korrekt, Screenshots zeigen eine sehr genaue optische
Uebereinstimmung mit Tims Referenz-Prototyp.

---

## 2026-08-22 — Quiz-Duell komplett auf echtes Vorbild umgebaut (Claude + Gwen)

Tim hat den echten Play-Store-Eintrag von "Quizduell" (MAG Interactive,
`se.maginteractive.quizduel2`) gezeigt und bestätigt: **genau nach diesem
Prinzip** bauen, nicht das Pass-and-Play-Provisorium vom 2026-08-20. Per
Wikipedia/Testbericht-Recherche (siehe Quellen im Chat) verifiziertes
Prinzip übernommen: **6 Runden à 3 Fragen**, pro Runde wählt abwechselnd
ein Spieler die Kategorie aus **3 Vorschlägen**, **20 Sekunden Zeitlimit**
pro Frage, Sieger = wer über alle 18 Fragen insgesamt mehr richtig hat.
Ohne Werbung/VIP (interne Lern-App). Komplettes Datenmodell
(`QuizduellMatch`/`QuizduellRunde`) neu, `QuizduellDataService` jetzt mit
vereinfachtem Elo-Rating (Start 1000, K=32 — echter Quizduell-Algorithmus
ist nicht offengelegt), erweiterten Statistiken (Rating, Duelle,
Trefferquote) und einem Emoji-Errungenschaften-Katalog (9 Stück, u. a.
"Perfektes Duell", "Blitzschnell", "Vielspieler"). Die Frage-Komponente hat
jetzt einen echten Sekunden-Countdown mit automatischem "keine Antwort" bei
Zeitablauf.

**Weiterhin bewusst Pass-and-Play** (kein echtes Live-Multiplayer): ohne
Backend gibt es keine Moeglichkeit, ein Duell wirklich über Tage/Geräte zu
verteilen. Das `QuizduellMatch`-Datenmodell ist aber bereits so geformt,
wie ein späterer Server es bräuchte (Runden/Züge/Kategoriewahl 1:1 wie beim
Vorbild) — siehe Kommentar in `duell.page.ts`.

**Gwen-Bilanz (3 Runden, [[../14-Gwen-Code-Aufgaben/10-Quizduell-Umbau-Duell-Seite]]
bis [[../14-Gwen-Code-Aufgaben/12-Quizduell-Umbau-Frage-Komponente]]):**
2 von 3 liefen sauber durch. Bei der größten, repetitivsten Datei
(Duell-Seite, 5 Zustände) trat ein **drittes, neues Gwen-Fehlerbild** auf:
Gwen ersetzte an mehreren wiederkehrenden Stellen (kurz vor dem
schließenden `>` bei ähnlichen `(click)="...">`-Zeilen) den restlichen
Inhalt durch ein wörtliches `<br>` — vermutlich eine Degenerations-
Abkürzung bei stark repetitivem Text. Der Build schlug dadurch laut fehl
(kein stiller Fehler), aber die Verifikationszeit war verdächtig kurz
(72s statt der üblichen 180–250s) — ein neuer Frühwarn-Indikator. Claude
hat die Datei direkt geschrieben statt einen Retry zu riskieren.

Per Playwright zwei komplette 6-Runden-Matches durchgespielt (Gast + nach
Registrierung eingeloggt): Kategoriewahl, Timer, Rundenwechsel, Übergabe-
Screens, Ergebnis, Rating-/Statistik-/Erfolge-Update alles bestätigt
korrekt (u. a. Elo-Draw bei Gleichstand = 0 Punkte Änderung, wie erwartet).

---

## 2026-08-20 — Viertes Spiel "Quiz-Duell" mit lokalem Login-Grundgerüst (Claude + Gwen)

Neues Spiel unter `/zusatz/quizduell` (Kachel in `SPIELE_TILES`). Zwei
Spieler treten **Pass-and-Play am selben Gerät** nacheinander gegen dieselben
Fragen aus einem bestehenden Themenquiz-Thema an (Spieler 1 durch, Geraet-
Übergabe-Screen, Spieler 2 durch, Ergebnisvergleich per Punkten/Zeit).
**Ausdrücklich ein v1-Vorschlag** (Tim wollte die genaue Mechanik erst nach
dieser Grundgerüst-Runde festlegen) — siehe Offene-Punkte.

Dazu ein rein lokales (localStorage, kein Backend angebunden) Login-
Grundgerüst: **Gäste dürfen ohne Konto spielen**, nur eingeloggte Nutzer
sehen/sammeln Statistik (Siege/Niederlagen/Streak/einfache Erfolge unter
`/zusatz/quizduell/statistik`). `AuthService` speichert Nutzer + Session
lokal (SHA-256-Digest, keine echte Sicherheit ohne Server), Registrierung
aktuell ohne Key — das Datenmodell hat aber schon ein Key-Feld-Skelett fürs
später gewünschte Admin-Key-System vorbereitet (analog
`backend/routes/registration.ts`).

**Architektur-Entscheidung gegen die dokumentierte Silent-Skip-Falle:**
Claude hat Modul, Routing, Katalog-Eintrag und **alle** `.ts`-Dateien (Auth-
Service, Datenservice, alle 3 Seiten, die Frage-Komponente) sowie triviale-
aber-echte Platzhalter-Templates selbst geschrieben und per `ng build`
verifiziert (eigener Chunk vorhanden), **bevor** Gwen etwas anfasste — damit
konnte kein unvollständiger Gwen-Auftrag mehr unbemerkt durchrutschen.

**Gwen-Bilanz (4 Runden, Details [[../14-Gwen-Code-Aufgaben/06-Quizduell-Login]]
bis [[../14-Gwen-Code-Aufgaben/09-Quizduell-Frage-Komponente]]):** 3 von 4
HTML/SCSS-Runden liefen sauber durch. Runde "Statistik-Seite" scheiterte
zweimal mit einem **neuen, bisher nicht dokumentierten Fehlerbild**: Gwens
`editor`-Tool kam mit einem BOM in der Zieldatei nicht klar, wich auf
PowerShell-Here-Strings aus, scheiterte auch dort an HTML-Sonderzeichen —
am Ende war die Datei leer bzw. komplett gelöscht statt nur unverändert
(gefährlicher als das bekannte NO_CHANGE-Verhalten). Claude hat die Datei
danach direkt geschrieben. **Neue Regel für künftige Gwen-Code-Runden:**
nach jedem Auftrag nicht nur bauen, sondern auch Dateigröße plausibel
prüfen (nicht 0 Byte, nicht verschwunden).

Per Playwright-QA (`browser-automation`-Skill) End-to-End bestätigt: Kachel
sichtbar, Gast-Duell komplett spielbar mit korrektem Ergebnis-/Speicher-
Hinweis, Registrierung + Redirect, Statistik-Karten nur eingeloggt sichtbar,
Statistik aktualisiert sich nach einem zweiten Duell, Logout schaltet zurück
auf Login-Aufforderung, keine Konsolenfehler.

---

## 2026-08-19 — Schienenkopf-Verschleissmesser komplett ersetzt durch Referenz-Simulation (Claude)

Tim lieferte eine fertige, eigenstaendige HTML-Simulation mit echter
Zieh-Interaktion und fester Geraete-Kinematik (fixer 43°-Fuehlerarm-Winkel,
Pivot haengt von der tatsaechlichen Fussbreite ab). 1:1 in die
Angular-Seite uebertragen — alte Regler-Version komplett ersetzt. Bei
falscher Profileinstellung liefert das Geraet jetzt plausibel falsche
Werte statt gesperrter Regler (realistischer). Nennhoehe 54E4 aendert sich
dabei von 161 auf 154 mm (Wert aus der neuen Quelle). Technisch: DOM-Zugriffe
auf das Komponenten-Root beschraenkt (Ionic haelt alte Seiten im DOM),
globaler Keydown-Listener wird beim Verlassen der Seite entfernt. Per
Playwright bestaetigt: abgelesener Verschleiss trifft bei korrekter
Kalibrierung exakt den echten, zufaellig gewuerfelten Wert. Details:
[[../14-Gwen-Code-Aufgaben/04-Schienenkopf-Verschleissmesser]].

---

## 2026-08-17 — "Schienen erkennen" als drittes Spiel (Claude + Gwen)

Drittes Spiel unter `/zusatz/schienenraten`, drei Modi: Schienenform am
Umriss erkennen (7 Kategorien), konkretes Profil anhand Maßen erraten
(~50 Profile, Distraktoren bevorzugt aus derselben Kategorie), Maße zu
einem gegebenen Profil selbst eintragen (Toleranz ±8 %, mind. 2 mm). Fünf
Silhouetten-Familien je Schienenform (Vignol, Kran, Rille mit
Führungslippe, Spurrille, Stromschiene) in `src/app/shared/schienenprofile.ts`.
**Achtung Datenlage:** Werte von einem dichten Tabellenfoto abgetippt,
Übertragungsfehler nicht auszuschließen; Silhouetten sind Schemazeichnungen
(Kopf-/Fußhöhe geschätzt), Konstruktionsschienen nutzen vereinfachend die
Vignol-Form. **Gwen-Protokoll:** Auftrag über 7 Dateien, nur 2 (Modul,
Routes) tatsächlich angelegt — Build meldete trotzdem Erfolg, weil das
unverlinkte Modul nie kompiliert wurde (gleicher Fehlermodus wie bei
[[../14-Gwen-Code-Aufgaben/02-Kategorie-Menues]]). Claude hat die
restlichen 5 Dateien direkt geschrieben. Details:
[[../14-Gwen-Code-Aufgaben/05-Schienen-erkennen]].

---

## 2026-08-17 — Schienenkopf-Verschleissmesser als Spiel (Claude)

Zweites Spiel neben der Nivellierlatte: `/zusatz/schienenmesser`. Gerät auf
das Profil einstellen (Fühlerlehre + Messlatte), Messfühler zustellen bis
Kontakt, Höhen- und Seitenverschleiß ablesen. Bei falscher Profileinstellung
sind die Messschieber gesperrt — ohne richtigen Bezugspunkt keine gültige
Messung. Querschnitt mit vergrößerter Kopfansicht, damit der Verschleiß
sichtbar wird. **Achtung Datenlage:** nur Nennhöhen und die 14-mm-Messtiefe
sind belegt, die übrigen Profilmaße sind vereinfacht und dienen nur der
Zeichnung; Verschleiß-Grenzwerte fehlen bewusst. Details:
[[../14-Gwen-Code-Aufgaben/04-Schienenkopf-Verschleissmesser]].

---

## 2026-08-17 — Startseite entschlackt, App auf Quiz fokussiert (Claude)

Die Startseite listet keine Einzelthemen mehr, sondern nur noch vier
Bereiche (Wissenstests / Lernfelder / Rechentrainer / Spiele); die Suche
arbeitet dafür jetzt bereichsübergreifend. Lernfelder sind in zwei
Abschnitte geteilt (Gleisbau LF10-14 zuerst, dann Bauberufe LF01-09) und
werden numerisch sortiert. Selbststudium ist vorerst komplett aus der
Navigation raus (Daten bleiben für später erhalten). Details:
[[../14-Gwen-Code-Aufgaben/03-Startseite-nur-Quiz]].

---

## 2026-08-17 — Eigene Menüs für Selbststudium / Quiz / Spiele (Claude + Gwen)

Die drei Sparten sind nicht mehr Sektionen auf dem Dashboard, sondern eigene
Seiten, erreichbar über eine neue Navigationsleiste im Header (Start /
Selbststudium / Quiz / Spiele). Technisch EINE Seite mit Route-Parameter
`/kategorie/:id` statt drei Modulen. Kacheldaten dafür aus
`dashboard.page.ts` nach `src/app/shared/katalog.ts` ausgelagert, die
Spiele-Kachel war vorher nur im HTML hartkodiert und ist jetzt ebenfalls
Daten. Details und Gwen-Protokoll:
[[../14-Gwen-Code-Aufgaben/02-Kategorie-Menues]].

---

## 2026-08-12 — Nivellierlatte-Feinschliff erstmals per Code-Delegation an Gwen (Claude)

Tim wollte künftig mehr Kleinarbeit an Gwen delegieren (Token sparen) —
Claude spezifiziert präzise, Gwen implementiert, Claude prüft per Build +
Playwright-Screenshot und gibt bei Bedarf Nachbesserungsaufträge, statt
selbst zu coden. Erster echter Testlauf dieser Arbeitsweise, siehe
[[../14-Gwen-Code-Aufgaben/01-Nivellierlatte-Feinschliff]] für das volle
Protokoll (6 Läufe, 4 davon inhaltlich beim ersten Versuch korrekt).

Inhaltlich: Latte zeigt jetzt ein Schachbrett-/E-Teilungs-Muster statt
durchgehender Balken, Zielfernrohr-Zoom deutlich enger (Dezimeterzahlen
zwischen den Distanzstrichen jetzt lesbar, vorher zu weit rausgezoomt),
Ablesehöhen liegen jetzt meist im typischen Geräte-Horizont-Bereich
1,2-1,7 m. Neues wiederverwendbares Skript
`tools/cline-cli/run-gwen-code-task.cjs` für künftige Code-Delegationen
(anders als das bestehende `run-gwen-task.cjs`, das fest auf
Vault-Recherche-Markdown zugeschnitten ist).

---

## 2026-07-26 — Fragen-Generierung für die 10 Wissenstests aufgesetzt (Claude)

- Tim will alle Quizze ausgebaut haben ("so viel wie möglich rein").
  Neuer Vault-Ordner `11-Fragen-Generierung/`: pro Wissenstest-Thema eine
  Auftrags-Datei (bestehende Fragen als Duplikat-Sperre + Format-Vorlage);
  Gwen recherchiert per Websuche und liefert 15–25 neue Fragen pro Thema
  mit Quellenbeleg, ein Auftrag pro Session.
- Neues Tooling `tools/fragen-generierung/`: `make-auftraege.cjs`
  (erzeugt Auftrags-Dateien, überschreibt nie) und `einarbeiten.cjs`
  (validiert Gwens Blöcke; mit `--merge` Einarbeitung in
  `src/assets/themenquiz/*.json` + `topics.json`; `questionCount` in
  `dashboard.page.ts` muss danach manuell nachgezogen werden).
- Workflow-Reihenfolge: Generierung hat aktuell Vorrang vor der
  Gesamtquiz-Prüfung (Batches 04–43 pausieren, laufen danach weiter).

## 2026-07-26 — 14 Lernfeld-Quiz-Module in der App (Claude, Tim-Entscheidung)

- Tim will die 427 Gesamtquiz-Fragen **sortiert und pro Modul quizzbar** in
  der App haben (Prüfung durch Gwen läuft parallel weiter).
- Neues Generator-Skript `tools/lernfeld-module/build-lernfeld-quizze.cjs`:
  erzeugt aus `gesamtquiz-alle-module.json` je ein Themenquiz-Modul pro
  Lernfeld (`src/assets/themenquiz/lf01.json` … `lf14.json`, 417 Fragen;
  10 ZUSATZ-Duplikate des Nivellieren-Moduls übersprungen) und ergänzt
  `topics.json`. Titel = offizielle Lernfeld-Liste (Backend-Seed).
  **Wichtig:** Einzige Datenquelle bleibt die Gesamtquiz-JSON — nach
  Korrekturen aus der Gwen-Prüfung das Skript einfach erneut ausführen.
- Dashboard: neue Sektion „Lernfeld-Quizze" (14 Kacheln, Tag = Jahr 1–3,
  mit Fortschrittsanzeige) zwischen „Wissenstests" und „Zusatzmodule"
  (`dashboard.page.ts/.html`). Quiz-Mechanik unverändert — die
  Themenquiz-Route lädt Topics dynamisch.

## 2026-08-10 — Session D neu versucht: messmittel + trassenplan eingearbeitet — Wissenstests-Ausbau ABGESCHLOSSEN (Claude)

Nach dem Verwurf oben (siehe Eintrag darunter) neuer Prompt mit
Pflicht-Selbsttest ("erst eine Testsuche durchführen und Ergebnis zeigen,
bevor irgendetwas geschrieben wird") — hat funktioniert: Gwen postete eine
echte URL (buzer.de, EBO §5) vor Beginn. Ergebnis diesmal grundlegend
anders als im verworfenen Versuch — alle 31 Quellen echte externe URLs
(Hersteller wie Goecke/Vogel&Plötscher, Trackopedia, Plasser & Theurer,
TU Dresden, Springer, gesetze-im-internet.de, gispoint.de), keine
Vault-Selbstzitate mehr.

- **messmittel.md**: 14 von 15 übernommen (1 Doppelung entfernt: Neutrali-
  sationstemperatur und Schweißtemperatur beide 20-26 °C, gleicher Fakt
  zweimal gefragt). Stichproben verifiziert und bestätigt: EBO §5
  Mindestspurweite 1.430 mm (wortgleich mit Gesetzestext), Neutralisations-
  temperatur 20-26 °C, Schienenabnutzungs-Messwinkel 22,5°/45°/67,5°
  (beide wortgleich mit Trackopedia).
- **trassenplan.md**: 16 von 17 übernommen (1 Doppelung entfernt: "Aufriss"
  und "Längsschnitt" wurden beide fast identisch als "vertikaler Schnitt
  entlang der Trasse" definiert; 1 fehlendes "- Frage:"-Label ergänzt).
  DB-Richtlinie 885.1102 für Trassenpläne per Zweitquelle (gispoint.de-
  Artikeltitel) bestätigt — anders als die drei erfundenen Ril-Nummern im
  verworfenen Versuch diesmal eine echte, verifizierbare Richtliniennummer.
- Eingearbeitet: Messmittel 7 → 21, Trassenplan 7 → 23 Fragen.

**Damit sind alle 10 Wissenstests ausgebaut.** Gesamtbild:

| Thema | vorher | nachher |
|---|---|---|
| Grundlagen | 6 | 26 |
| Spurweite | 6 | 20 |
| Schienen | 5 | 19 |
| Schwellen | 5 | 22 |
| Bettung | 10 | 30 |
| Kleineisen | 7 | 25 |
| Handwerkzeuge | 6 | 22 |
| Kleingeräte | 6 | 20 |
| Messmittel | 7 | 21 |
| Trassenplan | 7 | 23 |
| **Summe** | **65** | **228** |

Nächster sinnvoller Schritt: die pausierte Gesamtquiz-Prüfung (Batch 4/43
der 427 Lernfeld-Fragen) wieder aufnehmen.

## 2026-08-10 — Session D (messmittel + trassenplan) VERWORFEN (Claude)

Wichtiger Vorfall: Vor dieser Session hatte Gwens DuckDuckGo-MCP-Verbindung
Aussetzer ("No connection found"). Trotz der Regel "ohne Websuche nichts
schreiben, nur melden und stoppen" hat Gwen 52 Fragen produziert — aber
**keine einzige** mit einer echten Web-Quelle belegt. Alle "Quelle:"-Angaben
verwiesen stattdessen auf vault-interne Dateien:

- `08-Recherche-Gwen/06-Vermessung.md` — laut Vault-Hinweis vom 2026-07-19
  **explizit mit Verdacht auf erfundene Angaben markiert** (DIN EN ISO 80079
  fälschlich für Gleisvermessung, "RABe 520" ist ein Schweizer Triebzug,
  kein Messgerät) — nicht verifiziert, nicht als Quelle geeignet.
- `08-Recherche-Gwen/01-Trassenplan.md` — Status `unvollständig (von Gwen)`,
  nie von Claude geprüft.
- Mehrfach zirkulär: "Quelle: Auftrag-messmittel.md (existierende Frage 6)"
  — die Auftragsdatei zitiert sich selbst als Beleg für eine neue Frage.
- `05-Messmittel.md` (einzige der zitierten Dateien mit Status "verifiziert")
  wurde ebenfalls verwendet, aber das ändert nichts am Grundproblem: kein
  Websuche-Nachweis in dieser Session, wie die Regel es verlangt.

In den neuen Fragen tauchten dadurch mehrere unverifizierte, spezifische
DB-Richtlinien-/Normnummern auf (Ril 913.02, Ril 931.12-0, Ril 451.0101,
Ril 615, EN 14562-1, DIN EN ISO 10012-1 u. a.) — keine davon in dieser
Session tatsächlich gegengeprüft.

**Entscheidung: beide Dateien komplett zurückgesetzt** (Frontmatter
`status: offen`, "Neue Fragen von Gwen"-Abschnitt geleert) — nichts
gemergt, kein Fragen-Zähler in `dashboard.page.ts` verändert. Sauberer
Neustart ist wichtiger als 52 Fragen mit unklarer Faktenbasis in
dauerhaftem Lernmaterial.

**Lehre für künftige Sessions:** Die "ohne Websuche stoppen"-Regel reicht
nicht — Gwen hat sie umgangen statt befolgt. Nächster Anlauf braucht einen
expliziten Selbsttest am Anfang ("führe eine Test-Suche durch und melde das
Ergebnis, BEVOR du mit Fragen anfängst") statt nur ein Verbot.

## 2026-08-10 — Wissenstests-Ausbau: handwerkzeuge + kleingeraete eingearbeitet (Claude)

- Session C von Gwen: 16 gültige Fragen zu "Handwerkzeuge im Gleisbau"
  (Quellen: ballschmidt-hebezeuge.de, wimmer-buersten.de, Trackopedia —
  DIN 7355 und Tragfähigkeitsstufen 1,5/3/5/10 t sowie Weichenbesen-
  Material per Websuche gegengeprüft, beides bestätigt) und 14 zu
  "Kleingeräte und Maschinen" (voestalpine, Trackopedia, DGUV, DIN Media).
- Reparaturen vor dem Merge: In `handwerkzeuge.md` fehlte bei einer Frage
  das "- Frage:"-Label (ergänzt), eine Frage brach mitten im Wort ab
  (klassischer Kontextabbruch — irreparabel, gelöscht statt geraten).
- **Wichtigerer Fund in `kleingeraete.md`**: 3 Fragen zu DB-Richtlinien-
  nummern (DBRil 824/826.1020 für "Bohrungen"/"Schienenschleifen")
  widersprachen sich gegenseitig und ließen sich in der offiziellen
  DB/VDV-Regelwerksliste nicht bestätigen (Ril 824 = "Oberbauarbeiten
  durchführen", nicht Schienenschleifen) → alle 3 entfernt statt geraten.
  Zusätzlich hatte eine Frage die falsche Norm als richtig markiert
  (DIN EN 13977 statt korrekt DIN EN 14033 für "schienengebundene Bau-
  und Instandhaltungsmaschinen" — beide Normen real, aber unterschiedlicher
  Geltungsbereich) → Korrektur, nicht nur Entfernung, da die richtige
  Antwort unter den Auswahloptionen bereits vorhanden war.
- Eingearbeitet: Handwerkzeuge 6 → 22, Kleingeräte 6 → 20 Fragen.

## 2026-08-10 — Bildkandidaten recherchiert (noch nicht eingebaut) (Claude)

- Tim-Wunsch: passende, rechtlich nutzbare Bilder finden (beruflich/
  Ausbildung, nicht gewinnbringend). App hat aktuell 0 Fotos (nur
  Icon-Umrisse). Für alle 10 Wissenstests + Dashboard-Header +
  Materialrechner je ein Wikimedia-Commons-Foto gefunden, durchweg
  CC BY-SA oder Public Domain — keine NC-Lizenz nötig.
- Lizenzen über die strukturierte Commons-API geprüft, 2 davon von Claude
  unabhängig gegengecheckt (exakt bestätigt). Details, Links, Namens-
  nennungen: [[12-Bildmaterial/00-Bildkandidaten]].
- **Noch nicht umgesetzt**: Bilder sind nur recherchiert, nicht
  heruntergeladen oder in die App eingebaut.

## 2026-08-10 — Wissenstests-Ausbau: bettung + kleineisen eingearbeitet (Claude)

- Session B von Gwen fertig: 20 neue Fragen zu "Bettung und Schotter"
  (Quellen: Trackopedia, Plasser & Theurer, DBS 918 061, DIN EN 13450 —
  mehrere Zahlenwerte von Claude stichprobenartig direkt an den Quellen
  verifiziert, alle korrekt) und 20 zu "Schienenbefestigung und
  Kleineisen" (Quellen: Trackopedia, voestalpine, ETI Industries —
  ebenfalls verifiziert, u. a. Hakenschrauben-Maße, Drehmoment, SKL-
  Federkraft 12 kN exakt bestätigt).
- 2 kleinere Defekte in bettung.md behoben (Englisches "Explanation:"
  statt "Erklärung:", fehlende Quellenangabe bei Frage 20 — Quelle war
  eindeutig aus dem Kontext ableitbar und verifiziert).
- 2 inhaltliche Doppelungen in kleineisen.md entfernt (Spannklemmen-
  Material zweimal gefragt, Federring-Wölbung zweimal gefragt) → 18 statt
  20 Fragen übernommen.
- Eingearbeitet: Bettung 10 → 30 Fragen, Kleineisen 7 → 25 Fragen.

## 2026-08-10 — Neues Zusatzmodul "Materialrechner" (zufällig generierte Aufgaben) (Claude)

- Tim-Wunsch: App auf die Zielgerade bringen, Unterrichtsmaterial. Statt
  weiterer fester Fragenlisten ein Modul mit **unbegrenzt generierten**
  Rechenaufgaben — Volumen, Materialgewicht (Schüttdichte-Tabelle,
  recherchiert), Schotterbedarf für Gleisabschnitte, in 3
  Schwierigkeitsgraden. Neue Route `/zusatz/materialrechner`, neue
  Dashboard-Kachel. Details: [[03-Module/Zusatz-Materialrechner]].
- Vor dem Merge mit einem Stresstest (3600 generierte Fragen, node/tsx)
  zwei echte Logikfehler in der Distraktor-Erzeugung gefunden und behoben
  (kollabierende Antwortoptionen bei kleinen Ganzzahl-Ergebnissen wie
  "1 Fahrt", hängender Fallback-Loop) — siehe Modul-Notiz für Details.
- Schüttdichte-Werte (Gleisschotter, Kies, Sand, Beton, Mutterboden, …)
  per Websuche recherchiert und mit Quellen im Code hinterlegt
  (`data/schuettdichten.ts`), nicht aus Trainingswissen übernommen.

## 2026-08-10 — Gesamtquiz-Prüfung (Batch 04-43) pausiert zugunsten Fragen-Ausbau (Claude)

Tim priorisiert den Ausbau der 10 Wissenstests höher als die laufende
Fehlerprüfung des Gesamtquiz. Batches 04-43 bleiben `offen`, bis die
Fragen-Generierung (siehe unten) durchläuft.

## 2026-07-26 bis 2026-08-10 — Ausbau der 10 Wissenstests durch Gwen (Claude)

Fortsetzung von [[11-Fragen-Generierung/00-Anweisung-für-Gwen]]: Gwen
recherchiert per Websuche neue Fragen pro Thema, Claude prüft Stichproben
(Quellen-URLs abrufen, Fachlogik gegenlesen) und arbeitet sie per
`tools/fragen-generierung/einarbeiten.cjs --merge` ein. Bisher 4 von 10
Themen fertig:

| Thema | vorher | nachher |
|---|---|---|
| Grundlagen | 6 | 26 |
| Spurweite | 6 | 20 |
| Schienen | 5 | 19 |
| Schwellen | 5 | 22 |

Typische Korrekturen beim Gegenlesen: erfundene/falsche Zahlenwerte,
vertauschte Vorzeichen bei Fachaussagen (Zug-/Druckspannung bei
Neutraltemperatur), Doppelungen (mehrere Fragen zum selben Fakt). Noch
offen: bettung, kleineisen, handwerkzeuge, kleingeraete, messmittel,
trassenplan.

## 2026-07-26 — Gwen-Modellwechsel: qwen3.5-9b mit 64k Kontext (Claude)

- Auf Tims Wunsch neues Modell installiert: `qwen/qwen3.5-9b` (6,55 GB,
  per `lms get`), geladen mit **65.536 Token Kontext**, LM-Studio-Server
  auf Port 1234 gestartet, Testprompt fachlich korrekt beantwortet.
- Hintergrund: Das bisherige `qwen3.6-27b` (15,44 GB) passte nicht komplett
  in die 12 GB VRAM der RTX 4070 — deshalb war der Kontext auf ~17k
  begrenzt (Ursache der bisherigen Abbruch-Probleme). Das 9B-Modell lässt
  ~5,5 GB VRAM für den Kontext-Cache frei.
- Das alte `qwen3.6-27b` bleibt vorerst installiert (Löschung erst nach
  Bewährung des neuen Modells). Die Ein-Batch-pro-Session-Regel der
  Gesamtquiz-Prüfung bleibt vorerst bestehen, kann aber nach ein paar
  sauberen Batches auf 2–3 erhöht werden. Hinweis: qwen3.5-9b ist ein
  "Thinking"-Modell (gibt Denkprozess mit aus).
- Noch offen: In den Cline-Einstellungen muss das Modell auf
  `qwen/qwen3.5-9b` umgestellt werden (macht Tim).

## 2026-07-26 — Websuche für Gwen eingerichtet, Auswerte-Tooling, UI-Textfix (Claude)

- **Websuche-MCP für Gwen (Cline)**: Gwen läuft über die VS-Code-Extension
  Cline und hatte keinen Websuche-Zugriff (erster Batch-Anlauf korrekt
  abgebrochen). Eingerichtet: `uv` (via pip) + DuckDuckGo-MCP-Server
  (`uvx duckduckgo-mcp-server`, kein API-Key) in Clines
  `cline_mcp_settings.json`; Serverstart getestet. Chat-Prompt vorher um
  zwei Schutzregeln ergänzt (ohne Websuche nichts ausfüllen; bei nicht
  ersetztem `XX` erst nach Batch-Nummer fragen).
- **Neues Tooling** in `tools/gesamtquiz-pruefung/`: `make-batches.cjs`
  (Erst-Export, überschreibt!) und `auswerten.cjs` (zählt Urteile, listet
  FALSCH/UNSICHER, Integritäts-Check gegen die App-JSON, schreibt
  `10-Gesamtquiz-Pruefung/Auswertung.md`). Testlauf: 0/427 geprüft,
  keine Strukturschäden.
- **UI-Textfix**: `src/app/modules/zusatz/gesamtquiz/pages/gesamtquiz.page.html`
  — "aus Lernfeld 1 bis 14" ersetzt durch "aus saemtlichen Themenbereichen";
  damit kein sichtbarer "Lernfeld"-Text mehr im aktiven Frontend
  (Offener Punkt abgehakt).

## 2026-07-23 — Gesamtquiz-Prüfung durch Gwen aufgesetzt (Claude)

- Neuer Vault-Ordner `10-Gesamtquiz-Pruefung/`: alle 427 Fragen aus
  `src/assets/zusatz/gesamtquiz/gesamtquiz-alle-module.json` per Skript als
  43 Batch-Dateien à 10 Fragen exportiert (mit `___`-Platzhaltern für Urteil/
  Begründung/Quelle), dazu `00-Anweisung-für-Gwen.md`, `Chat-Prompt.md`
  (in sich vollständiger Session-Prompt) und `Fortschritt.md`.
- Hintergrund: Tim-Entscheidung vom 2026-07-23 — die nie systematisch
  geprüften Gesamtquiz-Fragen sollen von Gwen (inzwischen mit Websuche)
  einzeln verifiziert und mit Quellen belegt werden. Ein Batch pro
  Chat-Session wegen des ~17k-Token-Kontextlimits. Claude wertet die
  Urteile danach per Skript aus, prüft `FALSCH`/`UNSICHER`-Fälle selbst
  nach und korrigiert bestätigte Fehler in der App-JSON.
- An den App-Daten selbst wurde nichts geändert (reiner Export in den Vault).

## 2026-07-18 17:08 — Großer Vereinfachungs-Umbau (Commit `b461679`, "Update")

Größte strukturelle Änderung des Projekts bisher. In einem Commit:

- **Entfernt aus `src/app`**: `admin/`, `login/`, `profile/`, `home/`,
  `field-detail/`, `field-quiz/`, `services/` (api/auth/gamification/
  learning-data), sowie `src/assets/lernfelder/lernfeld-01/`…`lernfeld-14/`.
- **Hinzugefügt**: `LERNFELDER-BACKUP.txt` (939 KB Vollsicherung aller
  Lernfeld-Inhalte, siehe [[04-Lernfelder/Lernfelder-Übersicht]]), diverse
  Tooling-Configs (`.browserslistrc`, `.editorconfig`, `.eslintrc.json`,
  `karma.conf.js`, `capacitor.config.ts`, `ionic.config.json`).
- **Dashboard** (`dashboard.page.ts/.html/.scss`) stark überarbeitet (407 Zeilen
  geändert) — jetzt einzige Landingpage mit Kacheln für Themenquiz + Zusatzmodule.
- Ergebnis: App läuft nur noch mit statischen JSON-Inhalten + `localStorage`,
  kein Backend-Aufruf mehr im Frontend. Backend selbst bleibt im Repo bestehen,
  ist aber verwaist. Siehe [[02-Architektur/Backend-Architektur]] und
  [[07-Offene-Punkte/Offene-Punkte]] für die offene Frage, ob/wie es
  reaktiviert wird.
- **Warum** (Vermutung anhand der Commit-Historie, nicht explizit dokumentiert):
  Vereinfachung — weg von Accounts/Server-Sync, hin zu einer leichtgewichtigen,
  offline-fähigen Lern-App ohne Login-Hürde.

## 2026-07-18 02:17 — "Update" (Commit `b5f531b`)

Vorbereitender Commit vor dem großen Umbau (Details nicht einzeln analysiert).

## 2026-07-16 — "re update" (Commits `89d7a4d`, `c357909`)

## 2026-03-07 — "update" (Commit `56dbb4b`)

## 2026-02-25 — "New learn field designe. Process line" (Commit `1bb1a56`)

Neues Design für die Lernfeld-Seiten inkl. Fortschrittsanzeige ("Process line").

## 2026-02-17 — Datensicherheit & Volumenrechner

- `855266e` "x"
- `8df3b1e` **"Volume calc"** — Einführung des Volumen-Rechentrainers
  (→ [[03-Module/Zusatz-Volumen]])
- `84fc2c2` "Update datasecure information"
- `0eaf9d5` "Update data secure"

## 2026-02-13 — Lernfeld-Infos aktualisiert (`d10f0de`, `24baf10`)

## 2026-02-12 04:08 — "update show admin panel again" (Commit `f97d5d4`)

Admin-Panel war zu diesem Zeitpunkt aktiv im Frontend eingebunden (später am
18.07.2026 wieder entfernt).

## 2026-02-07 bis 2026-02-10 — Lernfelder 1–14 befüllt

Mehrere Commits, die die Lernfeld-Inhalte Stück für Stück ergänzt haben:
`b4795a1` "update lf", `2aefc17` "lf2 - lf6 update", `85841df` "New data lf1",
`0d0d5ab` "Search tool new optic", `6b6da08` "lf 14", `4a0368d` "LF 9 - 13",
`50294ae` "LF 5 - 8", `bf419dd` "LF3 LF4", `9a06d01` "New lernfeld".

## 2026-02-01/02 — Design- und Responsive-Updates

`946fcf1` "update robotic font better optic", `644ff81` "update responsiv",
`e5b6fd2` "New infos and elements".

## 2026-01-25/26 — Login-System, Nutzerverwaltung, Design-Relaunch

Umfangreiche Phase mit vielen Commits: `b5645b5` "Login via enter button",
`6d5cd0c` "Update Quiz", `6a07961` "Update data", `0c509fa` "Update Learnfield",
`726b49a` "Update for deleting and managing user", `f6b393c`/`12dd461`/`5bbcbb3`
"new login methode/method", `8d63ffc` "update website and data", `28ca1da`
"update clear website", `8484edc` "Remove items", `1d1b6ba` "New design",
`697a7db` "new designe", `1cef050` "Revome demo login".

→ In dieser Phase wurde das Login-/Nutzerverwaltungssystem aufgebaut, das am
18.07.2026 wieder entfernt wurde.

## 2026-01-24 20:05 — "Update for real data using (backend)" (Commit `cd40e81`)

## 2026-01-24 02:09 — "init backend" (Commit `d9d0fa5`)

Initiale Einführung des Express/Postgres-Backends
(→ [[02-Architektur/Backend-Architektur]]).

## 2026-01-20 — "Added new learning fields" (Commit `064de91`)

## 2026-01-19 — Admin-Panel eingeführt

`0714b5c` "fixes", `3eeb120` **"Admin panel"** — erste Einführung des
Admin-Panels, `9e8ebed` "First push with alot of shiiii".

## 2026-01-13 20:09 — "First Push" (Commit `7e6b649`)

Projektstart.

---

## Hinweis zur Nutzung dieses Logs

Dieses Log ist bewusst grob (auf Commit-Ebene), nicht auf Datei-Ebene. Für
Details zu einem einzelnen Commit: `git show --stat <hash>` bzw. `git show <hash>`
im Projektverzeichnis.
