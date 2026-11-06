---
autor: Claude
erstellt: 2026-10-27
---

# Gleisbau Tycoon – Ausbauplan (Tims Auftrag 2026-10-27)

Tim: „Alle Ideen umsetzen, eins nach dem anderen. Dabei immer automatisch nach passenden Modellen und anderen
Sachen suchen, die man einbauen kann – die müssen auch zum Geldverdienen freigegeben sein.“

## Lizenzregel für Assets (Tim, 2026-10-27)

1. **Bevorzugt:** CC0 / Public Domain / Lizenzen, die kommerzielle Nutzung ohne Kauf erlauben
   (CC BY, CC BY-SA mit Namensnennung sind auch kommerziell erlaubt → Quellenvermerk im Spiel).
2. **Auch erlaubt:** Assets, die nicht-kommerziell kostenlos sind und für kommerzielle Nutzung
   (z. B. Werbung schalten) eine Lizenz kosten – **höchstens 10–20 € pro Asset/Paket**.
   Diese einbauen, aber unten unter „Später kaufen“ eintragen (Preis, Link, was genau).
3. Nicht erlaubt: „editorial only“, keine Lizenzangabe, teurer als 20 €, echte Marken/Logos (DB, ICE-Design).

## Später kaufen (vor kommerzieller Nutzung)

| Asset | Wo im Spiel | Preis | Link | Stand |
|---|---|---|---|---|
| – (noch nichts) | | | | |

## Die 10 Mechaniken – Reihenfolge und Stand

| # | Mechanik | Stand |
|---|---|---|
| 3 | Inspektionsfahrt: Minispiel Fehler im Gleis erkennen (+ Foto-Bestimmung aus dem Quiz) | ✅ gebaut 2026-10-27 (lokal getestet) |
| 7 | Wetter & Jahreszeiten (Hitze → Gleisverwerfung, Laub, Schnee/Weichen) + Gegenmaßnahmen | ✅ gebaut 2026-10-27 (2D + 3D) |
| 2 | Sperrpausen & Baustellen (Maschinen mieten, Bau mit Fachfragen) | ✅ gebaut 2026-10-27 |
| 1 | Personal & Ausbildung (Können steigt mit Lernmodulen) | ✅ gebaut 2026-10-27 |
| 5 | Güterverkehr mit Waren (Landkreise erzeugen Waren, Güterbahnhöfe) | ✅ gebaut 2026-10-27 |
| 6 | Streckenkapazität & Ausbau (zweigleisig, Signale, ETCS, Verspätungen) | ✅ gebaut 2026-10-27 |
| 4 | Weichen & Abzweige (Netz statt Punkt-zu-Punkt, Knotenbahnhöfe) | ✅ gebaut 2026-10-27 |
| 8 | Ausschreibungen der Bundesländer | ✅ gebaut 2026-10-27 |
| 9 | Clan-Großprojekte (Neubaustrecke, Brücke, Tunnel) | ✅ gebaut 2026-10-27 (Backend-Änderung!) |
| 10 | Sammelalbum / Abzeichen | ✅ gebaut 2026-10-27 |

Details und Entscheidungen je Mechanik werden unten ergänzt, sobald sie gebaut sind.
Deploy nur nach Tims ausdrücklichem „hochladen/updaten“.

## Modell-Recherche (Stand 2026-10-27)

- Quaternius Modular Train Pack – CC0, 15 Züge, FBX/OBJ → GLB umwandeln. https://quaternius.com/packs/modulartrain.html
- Kenney Modular Buildings – CC0, ~100 Teile (Bahnhof/Lokschuppen/Stellwerk bauen). https://kenney.nl/assets/modular-buildings
- Quaternius Downtown City MegaKit – CC0 (Standard gratis), glTF. https://quaternius.com/packs/downtowncitymegakit.html
- KayKit City Builder Bits – CC0, glTF. https://kaylousberg.itch.io/city-builder-bits
- Quaternius Public Transport Pack – CC0. https://quaternius.com/packs/publictransport.html
- Ungeeignet: Poly-Pizza-Züge (meist CC BY, einzeln prüfen), Sketchfab-Bahnhof ohne Lizenz, echte ICE-Modelle (teuer/editorial/Marke).

## Umgesetzt (Details)

- **#3 Inspektionsfahrt** (`tycoon-inspektion.ts`): Gleis von oben läuft durch, Fehler antippen (Schienenbruch, Schwellenbruch,
  fehlende Spannklemme, Schlammstelle, Spurerweiterung, Riffeln); Laub/Steine = Fehlalarm. Je Fund +5 % Zustand + Prämie;
  übersehene Fehler erhöhen `L.risiko` (Störung auf dieser Strecke wahrscheinlicher). Bonus: echtes Foto aus dem Schiene-Quiz bestimmen.
  Alles selbst gezeichnet, keine fremden Grafiken. Nebenbei: Spiel-Quiz mischt jetzt die Antworten (vorher war in 264/476 Fragen die erste richtig).
- **#7 Wetter** (`tycoon-wetter.ts`): Jahreszeit wechselt alle 5 Spieltage; Wetterlage über einem Bundesland mit eigener Strecke
  (Starkregen/Hitze/Laub/Sturm/Schnee). Ungeschützte Strecken langsamer + weniger Einnahmen, ggf. Wetter-Störung (neue Fehlerarten 6–9).
  Schutz je Strecke: Entwässerung, Spannungsausgleich, Vegetationspflege, Weichenheizung. 2D: Tönung + Partikel; 3D: Licht + Partikel.
- **#2 Baustellen** (`tycoon-baustelle.ts`): Stopfen, Schleifen, Bettungsreinigung, Gleiserneuerung; Totalsperrung (schnell, SEV-Kosten,
  nichts fährt) oder Nachtsperrpausen (langsam, 70 %). Arbeitsvorbereitung = 3 Fachfragen, je richtig −15 % Bauzeit. Eigene Maschinen sparen Miete
  (neu: Bettungsreinigungsmaschine). 3D-Baustelle mit Kenney Car Kit (CC0): Radlader, Lkw, Leitkegel.
- **#1 Personal** (`tycoon-personal.ts`): Gleisbau-Rotte, Triebfahrzeugführer, Fahrdienstleiter, Vermesser; einstellen, per Lehrgang
  (5 Fragen, 4 richtig) bis Stufe 5. Ab Stufe 3 Lernstand aus der Lernwelt nötig (localStorage `themenquiz-progress-*`, Fragen mind. einmal richtig).

## Neue Assets

| Asset | Lizenz | Wo |
|---|---|---|
| Kenney Car Kit 3.1 (tractor-shovel, truck, truck-flat, tractor, cone, box, delivery-flat) | CC0 | `src/assets/modelle/kenney-fahrzeuge/`, Baustellen in 3D |
- **#5 Güter** (`tycoon-gueter.ts`): Ware je Stadt/Bahnhofsgebiet; Güterbahnhof (Stadt/Bahnhof) → Aufträge (5–10 Ladungen zum anderen Streckenende,
  Frist, Lohn). Nur Züge mit passender Ware (`ZugTyp.gueter`) zählen. Neue Züge: Kesselwagenzug, Getreidezug, Autotransportzug (Kenney-Wagen).
- **#6 Kapazität** (`tycoon-kapazitaet.ts`): 3 Züge eingleisig, ×2 zweigleisig, +2 Ks, +4 ETCS. Überlast → alle langsamer, Pünktlichkeit sinkt
  (Einnahmen 70–100 %). Mehr Kapazität = mehr Fremdzüge. 3D: zweites Gleis mit eigenem Fahrdraht, Züge je Richtung auf eigenem Gleis.
- **#4 Weichen**: Abzweigstelle teilt eine Strecke an der angeklickten Stelle (Knoten ab 50000); Zuglauf in der Werkstatt (+10 % Miete je weitere
  Strecke); Knoten mit ≥3 Strecken +15 %; Weichenstörung (Fehlerart 10, Thema LF 13).
- **#8 Ausschreibungen** (`tycoon-ausschreibung.ts`): gegen ausgedachte Firmen (keine echten Namen), Gebot × Pünktlichkeitsversprechen; Vertrag 10 Min.,
  Zahlung nur bei eingehaltener Pünktlichkeit (sonst 30 %). Echte Spieler-gegen-Spieler-Ausschreibung wäre eine spätere Backend-Erweiterung.
- **#9 Clan-Großprojekte** (`tycoon-clanprojekte.ts` + Backend): Neubaustrecke/Talbrücke/Basistunnel, Geld oder Arbeitsschicht (5 Fragen, je richtig 1.500 €),
  fertig → Bonus für alle Mitglieder + 100 Erfahrung per Gutschrift.
- **#10 Album** (`tycoon-album.ts`): Zugtypen-Album + 16 Abzeichen mit Prämie.

## Runde 2 (Tims Auftrag 2026-10-27 abends) – alles lokal gebaut und getestet, NICHT deployt

Tim: „Baue das mal ruhig ein, so lange wie du brauchst, immer schön an die Dokumentation denken.“ Weggelassen auf Tims Wunsch:
Fahrplan/Takt, Sicherungsposten-Reaktionsspiel. Kredite nur als Börse (Aktien) umgesetzt.

| Bereich | Was | Dateien |
|---|---|---|
| Lizenz | Zugnamen ohne DB-Marken: „Hochgeschwindigkeits-Triebzug“, „Fernverkehrszug“, „Schnellfahr-Triebzug“; Katalog „Fernverkehrswagen“ | `tycoon-zuege.ts`, `shared/engine3d/modell-katalog.ts` |
| 🎓 Lernen (neuer HUD-Knopf, roter Punkt = Tagesaufgabe offen) | Tägliche Aufgabe (3 Fragen/Kalendertag Berlin, Serie, jeder 7. Tag +1 🏆), Fehlerbilder-Memory (eigene Zeichnungen + 3 Fotos aus dem Quiz), Gleis vermessen (Spurweite 14 mm unter SO ablesen; Überhöhung: Drehknopf bis Libelle einspielt), Stellwerk (Weichen, Fahrstraßen, Verschluss, Hp 0/1/2, 6 Züge), Zwischenprüfung (10 Fragen, 7 richtig) | `tycoon-lernen.ts`, `tycoon-vermessung.ts`, `tycoon-stellwerk.ts`, `fehlerBild()` in `tycoon-inspektion.ts` |
| Einwohner | Echte Einwohner je Gebiet (Wikidata CC0, 539/541; Rest geschätzt). Preis steigt mit Einwohnern; „Lohnt sich?“-Rechnung; Gebiete wachsen bei guter Anbindung bis +50 %, schrumpfen bis −25 %; Fahrgast-Faktor auf Miete | `tools/tycoon-karte/erzeuge-einwohner.cjs` → `tycoon-einwohner-daten.ts`, `tycoon-gebiete.ts` |
| Ereignisse | Großveranstaltung (doppelte Miete), Ferien (+25 %), Streik (30 % Tempo, Tarifeinigung kaufbar), Lieferengpass (+50 % Bau), Förderprogramm (−40 % OL/2. Gleis/Signale) | `tycoon-ereignisse.ts` |
| Berge | Höhenprofil → Tunnel ×4, Brücken ×3, Bergstrecke (>750 m oder steil) ×1,5 auf Bau-/Ausbaukosten; Tunnel/Brücken auf der 2D-Karte | `gelaendeVon()` |
| Tag/Nacht | Sonnenstand zur echten Uhrzeit (Deutschland); 2D dunkel + Stadtlichter + Zuglicht; 3D Licht gedimmt + Lichtschein. Test: `?nacht=1` | `sonnenHoehe()`, `syncNacht()` in `tycoon-3d.ts` |
| Neue Züge (Kenney CC0) | Nachtzug & Autoreisezug (nachts bis ×2, tagsüber 60 %, Ausland +30 %), Doppelstock-Triebzug, Stadtbahn, Tram-Train, Museums-Dampfzug (Wochenende +50 %), Dieseltriebwagen | `tycoon-zuege.ts` (Index 15–21) |
| Geräusche | Komplett im Browser erzeugt (keine Dateien/Lizenzen): Kasse, Horn, Störung, Bau, Erfolg, Fehler, Signal, Fahrgeräusch; 🔊-Knopf | `tycoon-ton.ts` |
| Mitfahren | 3D-Kamera „Hinterher“ oder „Führerstand“ (Knopf 🎥 am Zug) | `mitfahren()` in `tycoon-3d.ts` |
| Gebäude | Stellwerke an Knoten/Abzweigen, Lokschuppen (mit Werkstatt) – Kenney Modular Buildings (CC0) | `src/assets/modelle/kenney-modular/`, `tycoon-deko.ts` |
| Werbung (Platzhalter) | „📺 Sponsor-Video“ im Störungsfenster: Fremdfirma gratis, max. 3×/Std.; zeigt bis zur Anbindung eines Werbepartners nur 15-s-Platzhalter | `tycoon-werbung.ts` (Schalter `WERBUNG.aktiv`) |
| Gemeinschaft (Backend!) | 🏁 Wertung: Woche (Spieler + Clans) und Saison (Quartal) mit Preisen als Gutschrift (neu: Pokale in Gutschriften); 📈 Börse: Aktien je Firma, Kurs aus Einnahmen/Netz/Gebieten × Aktivität; echte Ausschreibungen Spieler gegen Spieler (+ ausgedachte Firmen); Trassen anderer Spieler mieten (Miete/Min. an Besitzer, nur Spielzeit des Mieters); Markt für Gebiete und Züge (Depot im Shop); Strecken stilllegen | `backend/src/routes/tycoon-gemeinschaft.ts`, neue Tabellen in `backend/src/index.ts` |
| Abzeichen | +5: Dranbleiber, Fehlerkenner, Messprofi, Fahrdienstleiter, Geprüft | `tycoon-album.ts` |

Tests: Browser (Patchright) für alle Minispiele, Nacht 2D/3D, Mitfahrt, Gemeinschafts-UI mit gemockter API; Backend-Integrationstest
(38 Prüfungen) gegen eine Wegwerf-Postgres auf dem Server (danach gelöscht). Deploy: erst Backend, dann Frontend – nur nach Tims „hochladen“.

## Neue Assets (Runde 2)

| Asset | Lizenz | Wo |
|---|---|---|
| Kenney Modular Buildings 2.1 (building-sample-tower-b, building-sample-house-a) | CC0 | `src/assets/modelle/kenney-modular/` |
| Einwohnerzahlen | Wikidata CC0 | `tycoon-einwohner-daten.ts` |
| Weitere Kenney-Train-Kit-Modelle (schon vorhanden) | CC0 | Nachtzug, Doppelstock, U-Bahn, Tram usw. |

„Später kaufen“: weiterhin nichts – alles CC0 bzw. selbst gemacht.

## Runde 3 (Tims Auftrag 2026-10-29) – Einstieg und Übersicht

Tim: Tutorial (Startpunkt wählen → Nachbargebiet → Strecke → Geld → Zug …), Bahnhof automatisch je Gebiet, Einwohner und Pendlerziele,
Datum/Uhrzeit mit Tag/Nacht nach Spielzeit, Winter im Norden (Schienenbruch) / Sommer im Süden (Verwerfung), Mitarbeiter per Drag & Drop
(Lohn mindert Einnahmen, bis 95 % Störungen abgefangen, Rest selbst lösen). Ziel: Wissen und Selbermachen bleibt der Hauptweg zum Geld.

| Bereich | Stand | Dateien |
|---|---|---|
| Tutorial 8 Schritte + Startpunkt-Wahl (belegte Gebiete gesperrt) | ✅ gebaut 2026-10-29 (lokal getestet) | `tycoon-engine.ts` (`TUT`, `startHTML`) |
| Bahnhof automatisch in jedem eigenen Gebiet (Stadt = Bahnhof) | ✅ | `sichereBahnhoefe()` |
| Nachbargebiete, Pendler (Schwerkraftmodell), Pendlerstrecke +15 % | ✅ | `nachbarn()`, `gebieteUm()` in `tycoon-gebiete.ts`, `pendlerZiele()` |
| Spieluhr/Kalender, Tag/Nacht nach Spielzeit und Breite | ✅ | `tycoon-zeit.ts` |
| Wetter nach Klimazone, neu „Strenger Frost“ → Schienenbruch | ✅ | `tycoon-wetter.ts`, `klimaVon()` |
| Streckentrupps per Drag & Drop (2D + 3D) | ✅ | `tycoon-trupps.ts`, `truppLeiste()`/`starteTruppZug()` |
| Ausschreibungs-Quiz-Turnier (10 Fragen je Runde, bis ein Sieger übrig ist, Prämie) | ⏳ offen – braucht Backend (Runden, Antworten, Sieger) | – |
| Haupt-/Nebenbahn: Güterbahnhof als eigenes Gebäude im Gebiet, per Nebenbahn angeschlossen | ⏳ offen (Streckenklassen „Nebenbahn/Hauptbahn“ gibt es schon als Ausbau) | – |
| Trupp-Symbole und Nachbar-Markierung auch in 3D | ⏳ offen | `tycoon-3d.ts` |
| Geführtes Tutorial: Fokus-Modus, Pfeile, Infos im Hinweis, Feld-Menü „Bauen“ (Bahnhof jetzt über Bauen) | ✅ gebaut 2026-10-29 (2) | `TUT`, `feldMenue()` |
| Bot-Gegner auf dem Server (6 Firmen, kaufen Gebiete, bauen Strecken, beantworten Gebote) + Begrüßung mittig | ✅ gebaut 2026-10-31 (lokal + Wegwerf-Server getestet) | `backend/src/tycoon-bots.ts` |
| Ideen für das Bau-Menü (Vorschlag an Tim): Park & Ride, Wartungsstützpunkt, Stellwerk, Abstellanlage/Lokschuppen, Umspannwerk, Solarfeld | 💡 Vorschlag | – |

Balancing-Idee dahinter: Trupps kosten einen **Anteil** der Einnahmen der Strecke – je mehr eine Strecke bringt, desto teurer ist es, sie
abzusichern. Ein Netz voller Bereitschaftstrupps verdient also deutlich weniger als ein Spieler, der selbst Störungen löst.

## Vor kommerzieller Nutzung / Veröffentlichung

- Impressum + Datenschutzerklärung; für echte Werbung Einwilligungs-Banner und einen Werbepartner in `tycoon-werbung.ts` einbinden.
- `/bahnspiel-assets` (interne Prüfliste, enthält ungeprüfte/kostenpflichtige Einträge) entfernen oder sperren.
- `TESTMODUS` in `tycoon-zuege.ts` ausschalten (sonst ist alles gratis).

## Ideen für später

- Kosmetik zum Kaufen (Lackierungen, Bahnhofsstile, Clan-Banner) – nur Optik, keine Vorteile.
- Mehr Zugtypen aus dem Quaternius Modular Train Pack (CC0, FBX→GLB).
- Signale als 3D-Modelle an den Streckenenden (rot bei Störung).
