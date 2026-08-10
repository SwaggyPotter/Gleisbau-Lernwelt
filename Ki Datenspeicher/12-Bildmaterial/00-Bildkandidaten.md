---
tags: [bildmaterial, lizenzen, recherche]
autor: Claude
---

# Bildkandidaten für die App

Aktueller Stand: Die App hat **keine einzige Fotografie oder Illustration** —
jede Kachel/jedes Modul nutzt nur abstrakte `ion-icon`-Umrisse. Auf Tims
Wunsch (2026-08-10) recherchiert: ein passendes, rechtssicher nutzbares Foto
pro Themenquiz-Thema + Dashboard-Header + Materialrechner.

## Lizenz-Rahmen für diese Recherche

Nutzungskontext der App: beruflich/Ausbildung (Berufsschul-Charakter), **nicht
gewinnbringend** — keine Werbung, keine Bezahlschranke, nichts wird verkauft.
Damit sind neben CC0/Public Domain und CC BY/BY-SA (mit Namensnennung) auch
CC BY-NC-Lizenzen grundsätzlich nutzbar. Bezahlte Stock-Bibliotheken (Getty,
Shutterstock, Adobe Stock) waren ausgeschlossen.

**Ergebnis:** Für alle 12 Themen wurde ein Treffer auf **Wikimedia Commons**
gefunden — durchweg **CC BY-SA (2.0/3.0/4.0)** oder **Public Domain**, eine
CC-BY-NC-Lösung war nirgends nötig. Andere Quellen (Pixabay, Unsplash,
DB-Pressefotos) wurden nicht gebraucht.

## Methode / Verlässlichkeit

- Jede Lizenzangabe stammt aus der strukturierten Wikimedia-Commons-API
  (`action=query&prop=imageinfo&iiprop=extmetadata`), nicht aus einer
  Bildunterschrift oder Drittseite.
- Für die 6 auffälligsten/kompositorisch wichtigsten Bilder wurde die
  Bilddatei zusätzlich heruntergeladen und visuell geprüft — dabei flog ein
  ursprünglicher Kandidat für "Bettung und Schotter" raus (zeigte in
  Wirklichkeit nur eine einzelne verwitterte Schwelle, kein
  Schotter-Querschnitt).
- Claude hat danach 2 der Lizenzangaben stichprobenartig unabhängig über die
  Commons-API nachgeprüft (Schönberg-Foto, Kleineisen-Klemme) — beide exakt
  bestätigt.
- **Trotzdem vor dem tatsächlichen Einbau:** jede Commons-Dateiseite (Link in
  der Tabelle) einmal selbst öffnen und die Lizenzbox oben rechts ansehen —
  Commons-Metadaten können sich in seltenen Fällen ändern (z. B. bei
  nachträglich geklärten Urheberrechtsstreitigkeiten).

## Bildkandidaten

| # | Thema | Commons-Dateiseite | Lizenz | Namensnennung | Warum passend |
|---|---|---|---|---|---|
| 1 | Gleisbau-Grundlagen | [Gleisbau in Schoenberg (1).jpg](https://commons.wikimedia.org/wiki/File:Gleisbau_in_Schoenberg_(1).jpg) | CC BY-SA 4.0 | Siegbert Brey (Snoopy1964), CC BY-SA 4.0, via Wikimedia Commons | Gleiserneuerung im Einschnitt bei Kiel-Schönberg — Schiene, Betonschwellen, alter/neuer Schotter und Böschung in einem Bild |
| 2 | Spurweite und Gleisgeometrie | [Genshagener Heide-Kurve.JPG](https://commons.wikimedia.org/wiki/File:Genshagener_Heide-Kurve.JPG) | CC BY-SA 3.0 | Global Fish, CC BY-SA 3.0, via Wikimedia Commons | Normalspur-Kurve, klare Gleisgeometrie ohne verdeckenden Zug |
| 2 (Alt.) | — | [Harzbahn Stiege reversal loop 1.jpg](https://commons.wikimedia.org/wiki/File:Harzbahn_Stiege_reversal_loop_1.jpg) | CC BY-SA 3.0 | Smiley.toerist, CC BY-SA 3.0 | Optisch stärker, **aber Schmalspur (1000 mm)** — nur mit Hinweis auf die abweichende Spurweite verwenden |
| 3 | Schienen | [Thermite rail welding 33.jpg](https://commons.wikimedia.org/wiki/File:Thermite_rail_welding_33.jpg) | CC BY-SA 4.0 | Cjp24, CC BY-SA 4.0, via Wikimedia Commons | Aluminothermisches Schienenschweißen in Aktion |
| 4 | Schwellen | [Eisenbahnschienen mit Betonschwellen.jpg](https://commons.wikimedia.org/wiki/File:Eisenbahnschienen_mit_Betonschwellen.jpg) | CC BY-SA 4.0 | Noebse, CC BY-SA 4.0, via Wikimedia Commons | Schienen auf Betonschwellen (B70-Typ) in Reihe, Düsseldorf Hbf |
| 5 | Bettung und Schotter | [Workers manually levelling gravel (Ballast)…, Tamil Nadu 01.jpg](https://commons.wikimedia.org/wiki/File:Workers_manually_levelling_gravel_(Ballast)_in_the_railway_track,_Tamil_Nadu_01.jpg) | CC BY-SA 4.0 | PJeganathan, CC BY-SA 4.0, via Wikimedia Commons | Arbeiter beim Schotter-Verteilen direkt im Gleisbett |
| 6 | Schienenbefestigung und Kleineisen | [Clamp 4401.jpg](https://commons.wikimedia.org/wiki/File:Clamp_4401.jpg) | CC BY-SA 4.0 | Chris Light, CC BY-SA 4.0, via Wikimedia Commons | Nahaufnahme einer Pandrol-Spannklemme auf der Schwelle |
| 7 | Handwerkzeuge im Gleisbau | [SOUTHERN RAILWAY … NARA 556898.jpg](https://commons.wikimedia.org/wiki/File:SOUTHERN_RAILWAY_RIGHT-OF-WAY_WORK_CREW_JACK_UP_A_RAIL_THEY_ARE_REMOVING_OLD_TIES_AND_REPLACING_THEM_WITH_NEW_ONES..._-_NARA_-_556898.jpg) | Public Domain | US-Bundesbehörde (NARA) — gemeinfrei, keine Namensnennung nötig | Arbeiter hebt Schiene mit Gleiswinde (Handwerkzeug) beim Schwellentausch, 1974 |
| 8 | Kleingeräte und Maschinen | [Work on the railway line - fitting a fishplate.jpg](https://commons.wikimedia.org/wiki/File:Work_on_the_railway_line_-_fitting_a_fishplate_-_geograph.org.uk_-_1754311.jpg) | CC BY-SA 2.0 | Evelyn Simak, CC BY-SA 2.0, via Wikimedia Commons/Geograph | Schienenbohrmaschine im Einsatz beim Laschenanbau |
| 9 | Messmittel und Vermessung | [Measurement Trolley 832.jpg](https://commons.wikimedia.org/wiki/File:Measurement_Trolley_832.jpg) | CC BY-SA 4.0 | Chen Melling, CC BY-SA 4.0, via Wikimedia Commons | Gleismesswagen (Plasser & Theurer EM-80E) auf echtem Gleis |
| 10 | Trassenplan lesen | [Railway bridge, Fiesby Curve, aerial 2018.jpg](https://commons.wikimedia.org/wiki/File:Railway_bridge,_Fiesby_Curve,_aerial_2018_-_geograph.org.uk_-_5661711.jpg) | CC BY-SA 2.0 | Chris (geograph.org.uk), CC BY-SA 2.0 | Luftbild einer echten Trassenführung/Kurve — bewusst kein Dokumenten-Scan |
| 11 | Dashboard-Header | [2019 Cogload Junction renewal - ballast excavators (66558).JPG](https://commons.wikimedia.org/wiki/File:2019_Cogload_Junction_renewal_-_ballast_excavators_(66558).JPG) | CC BY-SA 4.0 | Geof Sheppard, CC BY-SA 4.0, via Wikimedia Commons | Breites Landschaftsformat, zwei Gleisbagger mitten in der Erneuerung — starkes "Handwerk in Aktion"-Bild |
| 12 | Materialrechner | [Loading bay at Hakkila rail yard…, 2021.jpg](https://commons.wikimedia.org/wiki/File:Loading_bay_at_Hakkila_rail_yard_in_Vantaa,_Finland,_2021.jpg) | CC BY-SA 4.0 | Coen, CC BY-SA 4.0, via Wikimedia Commons | Große Schotter-/Kies-Halde mit Radlader als Größenvergleich |

## Hinweis zu Share-Alike (CC BY-SA)

Share-Alike greift nur, wenn das **Bild selbst** verändert und weiterverbreitet
wird (z. B. zugeschnitten und neu veröffentlicht) — nicht die App als Ganzes,
in die es eingebettet wird. Namensnennung ist trotzdem in jedem Fall
Pflicht (z. B. in einem "Bildnachweise"-Abschnitt oder direkt am Bild).

## Nächster Schritt (noch nicht umgesetzt)

Bilder sind bisher nur recherchiert, nicht heruntergeladen/eingebaut. Für den
Einbau: Originalauflösung von der jeweiligen Commons-Dateiseite laden
(nicht die Vorschaugröße), sinnvoll komprimieren/zuschneiden fürs Kartenformat,
in `src/assets/bilder/` ablegen, Namensnennungen zentral in einer
"Bildnachweise"-Seite oder im Footer sammeln.
