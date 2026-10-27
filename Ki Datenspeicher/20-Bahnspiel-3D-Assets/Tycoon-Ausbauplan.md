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

## Ideen für später

- 3D-Modelle für Güterbahnhof/Lokschuppen/Stellwerk aus Kenney Modular Buildings (CC0) zusammensetzen.
- Mehr Zugtypen aus dem Quaternius Modular Train Pack (CC0, FBX→GLB).
- Ausschreibungen zwischen echten Spielern (Backend).
