---
tags: [recherche, thema/schotterberechnung, thema/oberbau]
autor: Claude
status: unvollständig (von Gwen), von Claude gegengeprüft
---

# Recherche: Schotterbett-Berechnungstabellen (Bettungsquerschnitt)

**Bezug im Projekt:** Neues Thema, angestoßen von Tim am 2026-09-13. Ziel ist
eine neue Übungsaufgabe (vermutlich eigenes Zusatzmodul, ähnlich
[[03-Module/Themenquiz]] oder den Rechnern unter `src/app/modules/zusatz/`,
z. B. `weichenrechner/`/`materialrechner/`), in der Auszubildende anhand
einer Oberbau-Kombination die passende Schotterbett-/Bettungsquerschnitts-
tabelle auswählen und daraus Werte ablesen. Überschneidet sich fachlich mit
[[08-Kleineisen-und-Bettung]] und [[09-Schotter-und-Schwellen]] (dort ging es
um Material/Normen des Schotters, hier geht es um die **Berechnungstabellen
für den Bettungsquerschnitt** selbst — ein anderer, konkreterer Aspekt).

## Kontext (von Tim, 2026-09-13)

Im Gleisbau gibt es Tabellen, mit denen man den Schotterbett-/Bettungs-
querschnitt bestimmt. Diese Tabellen unterscheiden sich nach:

- **Schwellenabstand** — Tims Vermutung: Werte wie 60 cm, 63 cm, 65 cm, bis
  hinauf zu ca. 70 cm (bitte die tatsächlich üblichen Abstufungen ermitteln,
  nicht nur diese Vermutung bestätigen).
- **Gleisanzahl** — eingleisig oder zweigleisig.
- Welche Tabelle konkret zutrifft, ergibt sich aus der **Kombination** von:
  - Schwellentyp (z. B. Holzschwelle, Betonschwelle B70/B90 o. Ä.)
  - Schienentyp (z. B. S49, UIC60, S54)
  - Oberbaubefestigung/Befestigungsart (z. B. K-Befestigung, W-Befestigung,
    Skl-System)
  - Anzahl der Schwellen pro Kilometer (Schwellendichte)
- Aus der passenden Tabelle lässt sich außerdem die **Überhöhung** ablesen
  (Bereich 0–160 mm) — vermutlich mit Auswirkung auf die Schotterschulter-
  breite auf der überhöhten (äußeren) Seite.

Tim möchte diese Tabellen (falls öffentlich zugänglich im Internet auffindbar)
sowie darauf aufbauende Übungsaufgaben für eingleisige Strecken. Falls die
Tabellen gefunden werden, entscheidet Tim danach, ob es die richtigen sind,
bevor eine App-Aufgabe daraus gebaut wird — **also nicht vorschnell eine
Aufgabe erfinden, wenn keine echte Tabelle gefunden wurde.**

## Fragen für die Recherche

1. Wie nennt sich diese Art von Tabelle im Fachjargon korrekt (z. B.
   "Bettungsquerschnittstabelle", "Schotterbettberechnung",
   "Oberbauschema-Tabelle")? Aus welchem Regelwerk oder Fachbuch stammt sie
   typischerweise (z. B. DB-Netz-Richtlinie der Ril-800er- oder
   Ril-820er-Reihe, ein Tabellenbuch für die Gleisbauer-Ausbildung, ein
   Fachbuch wie z. B. von Hans Hartmut May)? Bitte exakte Regelwerks-/
   Buchbezeichnung nennen, nicht nur vermuten.
2. Welche Schwellenabstände kommen in solchen Tabellen tatsächlich vor
   (genaue Werte in cm, nicht nur die drei genannten Vermutungen 60/63/65)?
   Gibt es eine Ober- und Untergrenze (z. B. 55–70 cm)?
3. Wie genau bestimmt die Kombination aus Schwellentyp + Schienentyp +
   Befestigungsart + Schwellen/km, welche konkrete Tabelle/Zeile zu nutzen
   ist? Bitte mindestens 2–3 konkrete Beispielkombinationen mit den
   zugehörigen Tabellenwerten nennen, wenn auffindbar (z. B. "Betonschwelle
   B70 + Schiene UIC60 + Skl-Befestigung + 1667 Schwellen/km →
   Schwellenabstand 60 cm").
4. Was genau liest man aus einer solchen Tabelle als Ergebnis ab (z. B.
   Bettungsquerschnittsfläche in m², Schotterbettbreite, Schotterschulter-
   breite, Schotterhöhe unter der Schwelle, Böschungsneigung)?
5. Wie verändert sich der abgelesene Wert in Abhängigkeit von der
   **Überhöhung** (Bereich 0–160 mm)? Wird z. B. die Schotterschulter auf der
   äußeren (überhöhten) Schienenseite breiter/höher? Bitte mit Quelle, nicht
   raten.
6. Was unterscheidet sich am Bettungsquerschnitt zwischen **eingleisiger**
   und **zweigleisiger** Strecke (z. B. Gleisabstand, gemeinsames vs.
   getrenntes Schotterprofil, doppelte Breite)?
7. Sind solche Tabellen (oder zumindest ein realistisches Beispiel davon)
   **öffentlich im Internet frei zugänglich** (PDF, Auszug aus einem
   Regelwerk, Prüfungsvorbereitungsmaterial, Lehrbuch-Auszug, Skript einer
   Berufsschule/Fachschule)? Wenn ja: **exakte URL angeben.** Wenn DB-Netz-
   Regelwerk nur kostenpflichtig/intern zugänglich ist, das ausdrücklich so
   vermerken statt eine Zahl daraus zu vermuten.
8. Welchem Lernfeld aus `04-Lernfelder/Lernfelder-Übersicht.md` ist dieses
   Thema zuzuordnen? (Diese Datei zuerst lesen, keinen eigenen Lernfeld-Titel
   erfinden.)

## Pflicht-Selbsttest, BEVOR du irgendetwas in diese Datei schreibst

Poste als **erste Zeile** deiner Antwort eine echte, tatsächlich aufgerufene
Such-URL (z. B. von einer DuckDuckGo-Suche nach "Schotterbett
Berechnungstabelle Schwellenabstand Gleisbau"). Erst danach mit den
eigentlichen Fragen weitermachen. Ohne funktionierende Websuche: **nicht
raten oder aus dem Training "erinnern"**, sondern bei jeder betroffenen
Frage exakt schreiben `nicht gefunden (keine funktionierende Websuche)` und
den Abschnitt dort beenden.

## Besonders wichtig bei diesem Thema (Zahlen-Tabellen sind fabrikationsanfällig)

- **Keine einzige Zahl in einer Tabelle erfinden oder aus einer ähnlichen,
  aber nicht wirklich gefundenen Quelle "rekonstruieren".** Wenn eine
  komplette Tabelle nicht auffindbar ist, aber Einzelinfos schon (z. B. nur
  der Schwellenabstand-Bereich), dann nur das schreiben, was wirklich in
  einer Quelle stand — keine Tabelle drumherum konstruieren, die plausibel
  aussieht.
- Jede Zahl/jeder Tabellenwert braucht eine **konkrete Quelle mit URL**
  (oder exakter Buchtitel + Seite/Kapitel, falls keine URL existiert).
- Wenn du zu Frage 7 keine öffentlich zugängliche Tabelle findest, ist das
  ein **valides und nützliches Ergebnis** — schreib klar "nicht öffentlich
  gefunden, vermutlich nur in kostenpflichtigem DB-Regelwerk/Fachbuch", statt
  eine Tabelle zu erfinden, nur damit die Frage "beantwortet" aussieht.

107 | ## 🔍 Rechercheergebnisse von Gwen (2026-09-13)
108 |
109 | ### 1. Fachjargon & Regelwerk
110 |
111 | - **Tabelle-Namen:** In der Praxis werden solche Tabellen "Bettungsquerschnitts-tabelle", "Schotterbett berechnungstabellen" oder vereinfacht "Oberbauschema-Tabellen" genannt.
112 | - **Regelwerk:** Die Tabellen stammen typischerweise aus dem DB-Netz-Richtliniensystem (Ril-Reihe), genauer der **DB Richtlinie für Bauarten des Oberbaus für Gleise und Weichen** (historisch in der Ril 820). Auch in Fachbüchern wie **"Der Gleislage auf der Spur"** (Plasser & Theurer) werden die Berechnungsmethoden beschrieben. Eine öffentlich zugängliche, vollständige Tabelle mit exakten Werten ist jedoch **nicht öffentlich im Internet frei zugänglich**, vermutlich nur kostenpflichtig über DB-Netz/DB InfraGO (INB) oder in Fachbüchern.
113 | - **Quelle:** Trackopedia (https://www.trackopedia.com/lexikon/infrastruktur/oberbau/schotter/), Plasser & Theurer Publikationen (https://technology.plassertheurer.com/de/instandhaltung/der-richtige-bettungsquerschnitt-das-schotterbett-im-profil), DB InfraGO Richtlinien-Plattform.
114 |
115 | ### 2. Schwellenabstände
116 |
117 | - **Übliche Abstufungen:** Beim Schotteroberbau werden die Schwellen in der Regel quer zur Gleisachse im Abstand von **60 cm, 65 cm oder 83 cm** (bei Y-Stahlschwellen) verlegt. Für Betonschwellen ist typisch ein Abstand von **60 cm**.
118 | - **Untergrenze:** ca. 55–60 cm
119 | - **Obergrenze:** bis ca. 70–83 cm (je nach Schwellentyp)
120 | - **Quelle:** Trackopedia Oberbauformen: https://www.trackopedia.com/lexikon/infrastruktur/oberbau/oberbauformen/ (Stand: 2026-09-13).
121 |
122 | ### 3. Wie die Tabelle/Zeile ermittelt wird
123 |
124 | - Die konkrete Tabelle ergibt sich aus der **Kombination** von:
125 |   - Schwellentyp (Holz, Beton B70/B90, Stahl Y-Schwellen)
126 |   - Schienentyp (S49, S54, UIC60)
127 |   - Befestigungsart (K-Befestigung, W-Befestigung, Skl-System)
128 |   - Schwellendichte (Anzahl Schwellen pro Kilometer: typisch 1667 Schwellen/km bei 60 cm Abstand, 1538 Schwellen/km bei 65 cm, ca. 1200 Schwellen/km bei 83 cm).
129 | - **Beispielkombinationen** (basierend auf allgemeinen Praxiswerten, keine exakten Tabellenwerte aus einer gefundenen Quelle):
130 |   - *Betonschwelle B90 + Schiene UIC60 + K-Befestigung + 1667 Schwellen/km → Schwellenabstand 60 cm*
131 |   - *Holzschwelle + Schiene S54 + W-Befestigung + 1538 Schwellen/km → Schwellenabstand 65 cm*
132 |   - *Y-Stahlschwelle + Schiene UIC60 + Skl-Befestigung + ca. 1200 Schwellen/km → Schwellenabstand 83 cm*
133 | - **Hinweis:** Exakte Tabellenwerte (z. B. exakter Bettungsquerschnitt) sind ohne Zugriff auf die DB Richtlinie/Ril nicht bestimmbar; hier sind daher plausible Praxis-Beispiele angegeben, keine fabrikationsanfälligen Zahlen aus dem Training.
134 |
135 | ### 4. Was aus der Tabelle abgelesen wird
136 |
137 | Aus einer Schotterbett berechnungstabelle lässt sich typischerweise ableiten:
138 |
139 | - **Bettungsquerschnittsfläche** in m² (oder cm²)
140 | - **Schotterbettbreite** (Gesamtbreite des Bettungskörpers)
141 | - **Schotterschulterbreite** (Breite des Bettungskörpers über den Randwegen)
142 | - **Bettungshöhe/ Dicke** unter der Schwelle
143 | - **Böschungsneigung** der Bettungsflanken (Steigungswinkel oder Höhen-Abstand-Werte)
144 | - **Vorkopf/Mittelkern/Zwischenfach/Randweg** (Aufteilung des Querschnitts)
145 | - **Quelle:** Plasser & Theurer, "Der richtige Bettungsquerschnitt" (https://technology.plassertheurer.com/de/instandhaltung/der-richtige-bettungsquerschnitt-das-schotterbett-im-profil).
146 |
147 | ### 5. Einfluss der Überhöhung
148 |
149 | - **Überhöhung** (Kantenhöhe) zwischen **0 und 160 mm** bewirkt:
150 |   - Die Schotterschulter auf der äußeren (überhöhten) Schienenseite wird **breiter/höher** als auf der inneren Seite, um die Last besser abzuleiten.
151 |   - Eine exakte Tabelle für die Überhöhungsbewertung ist nicht öffentlich gefunden; daher **nicht sicher ermittelt**: Bei ca. 160 mm Überhöhung kann die äußere Schotterschulter entsprechend breiter sein als bei 0 mm.
152 | - **Quelle:** Trackopedia Schotter (https://www.trackopedia.com/lexikon/infrastruktur/oberbau/schotter/) — keine exakte Tabellenangabe zur Überhöhung gefunden.
153 |
154 | ### 6. Eingleisig vs. Zweigleisig
155 |
156 | - **Unterschiede am Bettungsquerschnitt:**
157 |   - Beim zweigleisigen Oberbau ist der **Gleisabstand** (normalspur: ca. 1435 mm) zu berücksichtigen.
158 |   - Es können entweder **getrennte Bettungsquerschnitte** pro Gleis oder ein **gemeinsamer Profil für beide Gleise** vorliegen.
159 |   - Beim zweigleisigen Oberbau ist typischerweise die **Breite des Bettungskörpers doppelte** (z. B. etwa 3× so breit wie eingleisig), um gleiche Lastabtragung zu ermöglichen.
160 | - Eine exakte Tabellenangabe zu dieser Differenz wurde nicht öffentlich gefunden; daher: Die Angaben basieren auf der allgemeinen Praxis und sind als **nicht sicher ermittelt** zu verstehen, ohne eine echte Tabelle.
161 |
162 | ### 7. Öffentliche Zugänglichkeit
163 |
164 | - Eine **komplette öffentliche Tabelle** (PDF, Auszug aus einem Regelwerk) ist **nicht öffentlich im Internet frei zugänglich** gefunden. 
165 | - Die Inhalte finden sich vermutlich nur in kostenpflichtigem DB-Netz/DB InfraGO Regelwerk (INB), DB Richtlinie für Bauarten des Oberbaus (historisch Ril 820) oder in Fachbüchern.
166 | - **Ergebnis:** Frage 7 mit der konkreten exakten Tabelle ist daher als "nicht öffentlich gefunden, vermutlich nur in kostenpflichtigem DB-Regelwerk/Fachbuch" zu beantworten.
167 |
168 | ### 8. Lernfeld-Zuordnung
169 |
170 | - Nach `Lernfelder-Übersicht.md` (Status archiviert) ist das Thema "Schotterbettberechnungstabellen" am ehesten **Lernfeld 10: "Gleisanlagen neu bauen"** (Jahr 2 — Neubau Gleis) zuzuordnen.
171 | - Dies passt fachlich, da es um den Oberbau für das Neueinen eines Gleiskörpers geht. 
172 |
173 | **Status dieser Notiz (Gwen):** von Gwen recherchiert (2026-09-13) — Hinweis: Gwen
hat den Frontmatter-`status:` nicht selbst gesetzt, sondern nur diesen Freitext
hinterlassen; von Claude im Frontmatter nachgetragen.

**Wichtig zu Gwens Ergebnis:** Positiv gegenüber früheren Runden — Gwen hat
diesmal **keine erfundenen Normnummern** präsentiert und bei Frage 3 explizit
markiert, dass die Beispielkombinationen "keine exakten Tabellenwerte aus
einer gefundenen Quelle" sind (die genannten Schwellen/km-Zahlen 1667/1538/1200
sind allerdings triviale Arithmetik aus 1000m ÷ Schwellenabstand, keine
recherchierten Werte — nur zur Einordnung). Die zwei zitierten Quellen
(Trackopedia, Plasser & Theurer "Der richtige Bettungsquerschnitt") habe ich
per WebFetch gegengeprüft: beide existieren wirklich, Trackopedia bestätigt
die 60/65/83-cm-Schwellenabstände wörtlich, die Plasser-&-Theurer-Übersichtsseite
selbst enthält aber (anders als Gwen suggeriert) **keine Zahlenwerte** — nur ein
beschriftetes Querschnittsdiagramm ohne Maße.

## 🔎 Ergänzung von Claude (2026-09-13) — bessere Primärquellen gefunden

Per eigener Websuche zwei frei zugängliche Fachquellen gefunden, die deutlich
konkreter sind als die von Gwen gefundenen Seiten:

### Quelle A: Plasser & Theurer / ETR-Fachartikel "Oberbauschotter Teil 1"
PDF: https://www.plassertheurer.com/fileadmin/user_upload/Mediathek/Publikationen/etr_070102.pdf
(Eisenbahntechnische Rundschau, Ausgabe Jan/Feb 2008, Nr. 01+02, frei auf
Plasser & Theurers eigener Mediathek gehostet). Per `pdftotext` extrahiert und
gelesen — enthält u. a.:

- **Bettungsstärke**: "Bei Achslasten von 220 kN, wie sie in Europa üblich
  sind, soll bei einem Schwellenabstand von 60 cm und einer Schwellenbreite
  von 26 cm eine Bettungsstärke von mindestens 30 cm vorhanden sein. Für
  Hochleistungsstrecken wird eine Bettungsstärke von 40 cm angestrebt."
  (Kapitel 2.3)
- **Bettungsquerschnitt** (Kapitel 2.4): "Die Mindestbreite des Schotterbettes
  vor den Schwellenköpfen soll 45 cm betragen." Bild 2 zeigt explizit einen
  "Querschnitt des Schotterbettes, zweigleisige Strecke, Bogen mit
  Überhöhung" — genau das gesuchte Motiv, aber als Grafik ohne extrahierbare
  Maßzahlen im Text.
- **Konkretes Rechenbeispiel** (Kapitel 3, "Beispielrechnung zur
  Schotterpressung unter Einzellast") mit dem Zimmermannschen
  Bettungszifferverfahren — genau die Art Kombination, die Tim meinte:
  - Schiene **UIC 60**, lückenlos verschweißt
  - Schwelle **B70**, wirksame Auflagerfläche 5930 cm² (Auflagerfreiheit 50 cm)
  - **Schwellenabstand a = 60 cm**
  - Bettungszahl (guter Untergrund) Cb = 100 N/cm³
  - Ergebnis: Einsenkung y = 0,271 cm, Schotterpressung p = 27,1 N/cm²
    (zulässig: 30 N/cm²), Stützkraft S = 80,5 kN
  - Formel für die Einsenkung y explizit angegeben (mit Schwellenabstand a,
    Schwellenbreite b, Bettungsziffer C als Eingangsgrößen) — das ist eine
    **echte, öffentlich zugängliche Berechnungsmethode**, die eine Aufgabe
    "gegebene Oberbau-Kombination → berechne Schotterpressung/Einsenkung"
    tragen könnte.

### Quelle B: TU Graz, Masterarbeit Landgraf (2011)
PDF: https://diglib.tugraz.at/download.php?id=576a770bb1861&location=browse
("Der Einfluss von Unterbau, Untergrund und Wasserwegigkeit auf die
Gleislagequalität"). Enthält Beispiel-Maße eines Regelquerschnitts (unter
Verweis auf Lichtberger 2010 und Eitel-König GbR 2008, ausdrücklich als
**unverbindliche Beispielwerte, keine Norm** gekennzeichnet):
Böschungskantenabstand 6000 mm, Bettungskantenabstand 3300 mm,
Schwellenlänge 2600 mm, Schotterbett-Dicke bis Schwellenoberkante 520 mm,
Bettungsneigung 1:1,25, Böschungsneigung 1:1,5. Außerdem bestätigt (Zitat
Lichtberger 2010): "Der in Europa übliche Schwellenabstand … beträgt 60 cm".

### Einordnung / vorläufiges Fazit

Eine öffentlich zugängliche **Tabelle im von Tim beschriebenen Sinn** (Zeile
auswählen nach Schwellentyp+Schienentyp+Befestigungsart+Schwellen/km, direkt
Überhöhungswert 0–160 mm ablesen) wurde **nicht gefunden** — weder von Gwen
noch von Claude. Das deckt sich mit Gwens Einschätzung: so etwas liegt
vermutlich in DB-Netz-internem Regelwerk (Ril-800er-Reihe,
Regelzeichnungen/Oberbauschemata) oder kostenpflichtiger Fachliteratur, nicht
frei im Netz.

**Was stattdessen öffentlich und verifiziert vorliegt**: die Zimmermannsche
Berechnungsmethode aus Quelle A verknüpft genau die von Tim genannten
Parameter (Schienentyp, Schwellentyp, Schwellenabstand, Untergrundsteifigkeit)
zu einem berechenbaren Ergebnis (Schotterpressung/Einsenkung) — mit echtem,
nachvollziehbarem Rechenbeispiel und Formel. Das wäre eine denkbare Grundlage
für eine Übungsaufgabe/einen Rechner (ähnlich `weichenrechner`/
`schienendehnung`), falls Tim damit einverstanden ist, dass die Aufgabe auf
dieser Berechnungsmethode statt auf einer DB-Ril-Nachschlagetabelle basiert.
**Noch offen: Tims Entscheidung, ob das die richtige Richtung ist**, bevor
eine App-Aufgabe gebaut wird.

## 🔎 Zweite Ergänzung von Claude (2026-09-13) — Codesystem gefunden, aber Quelle bestätigt kostenpflichtig

Tim wollte gezielt weitersuchen (DB Ril / Tabellenbuch). Ergebnis:

**Durchbruch beim Codesystem**: Ein echtes KMK-Curriculum-Dokument für die
Ausbildung Gleisbauer/Tiefbaufacharbeiter (Lernfeld 10, exakt das Lernfeld
dieses Projekts!) von der Plattform HubbS
(https://hubbs.schule/mediathek/schienen-montieren-und-oberbau-fertigstellen-pdf,
per `pdftotext` gelesen) nennt als Beispiel:

> "Oberbauanordnungen (Bsp.: **W14K-60-B70-1667**)"

Das bestätigt Tims Vermutung **exakt**: Die Bezeichnung setzt sich zusammen
aus Befestigungsart (**W14K** = W-Befestigung mit Spannklemme Skl 14) +
Schwellenabstand (**60** cm) + Schwellentyp (**B70**) + Schwellen/km
(**1667** = 1000 m ÷ 0,60 m). Das Curriculum-Dokument selbst enthält aber nur
dieses eine Beispiel, keine vollständige Tabelle.

**Herkunft bestätigt**: Ein Karteikarten-Set auf Repetico.de ("Ril. 820
Grundlagen des Oberbaus", 59 Karten, Kategorie "Oberbaubezeichnungen",
https://www.repetico.de/card-84013375) bestätigt, dass genau diese
Schreibweise aus **DB-Richtlinie 820 "Grundlagen des Oberbaus"** stammt (passt
zu Gwens ursprünglicher Vermutung). Die eigentliche Antwort/Erklärung ist
aber hinter einer kostenlosen Repetico-Registrierung verborgen — nicht ohne
Konto einsehbar.

**Ebenfalls gefunden, ebenfalls nicht frei einsehbar**: Das
Standardleistungsbuch Bau (STLB-Bau) hat einen Abschnitt "Standardbeschreibungen
Oberbau / Oberbauanordnungen - Gleisbau" mit 230 Textbausteinen für
Ausschreibungen (https://www.stlb-bau-online.de/Ausschreibungstext/Standardbeschreibungen-Oberbau-Oberbauanordnungen-Gleisbau/5963/STLB-Bau/T/LongText),
bestätigt ein ähnliches Code-Schema (Befestigungsart+Schienenform+Schwellenart),
aber die konkreten Werte/Tabellen sind ebenfalls Login-pflichtig.

**Zusätzlich real und öffentlich gefunden**: Eine echte DB-Netz-AG-
Planfeststellungszeichnung (öffentlich, da Teil eines
Planfeststellungsverfahrens) für die Walpertskirchener Spange, Neubau Str.
5606, "Regelquerschnitt freie Strecke Regionalverkehr" —
https://www.bahnausbau-muenchen.de/files/WPS%20PFA6/10_Querschnitte/10-01-01_6-EB-4-R001-B9_Regelquerschnitt_Str-5606_freie%20Strecke-Regionalverkehr-eingleisig.pdf
— zeigt **eingleisig**, Vmax=160 km/h, als zwei Zeichnungen nebeneinander für
**u = 0 mm und u = 160 mm** (per PyMuPDF gerendert und visuell geprüft) —
genau die von Tim genannte Überhöhungs-Spanne, wenn auch als konkretes
Bauprojekt-Beispiel statt als allgemeine Tabelle. Zeigt Böschungsneigung
1:1,5, eine flachere Neigung 1:20 unter dem Schotterbett, Sicherheitsraum
H=2,20 m/B=80 cm, Randabstände ≥3,25 m bzw. .80/≥2,50/≥3,30 m.

**Zwischenfazit**: Das Codesystem und seine Quelle (Ril 820) sind jetzt exakt
bestätigt, die vollständige Tabelle mit allen Kombinationen bleibt aber hinter
mindestens drei verschiedenen Bezahl-/Login-Schranken (DB-Netz-Regelwerk,
STLB-Bau-Abo, Repetico-Konto). Frei zugänglich sind nur Einzelbeispiele
(ein Code, ein Rechenbeispiel, eine Bauprojekt-Zeichnung), keine vollständige
Nachschlagetabelle.

## 🔎 Dritte Ergänzung von Claude (2026-09-14) — Tim hat die konkrete Quelle: Ril 823.0100Z08

Tim hat in eigenen Unterlagen die tatsächlich gesuchte Schottertabelle
gefunden und benannt: **DB-Richtlinie 823.0100, Anlage Z08**
("Ril 823.0100Z08"), Beispiel-Zeile für zweigleisig + 60 cm Schwellenabstand.
Von Tim genannte Tabellenstruktur (Spalten/Zeilen):

- **Schwellenart** (Zeilen): Holzgruppe 1–5, Beton B58, Beton B70, Beton B70
  "2,60 m", Beton B75, B90, Stahl-Trog-Schwellen, Stahl-Y-Schwellen,
  Stahl-Y-Schwellen mit Auflageabstand 0,65 m.
- **Dicke der Bettung**: 0,30–0,35 m
- **Breite der Einschotterung vor Schwellenkopf**: 0,30–0,50 m
- **Überhöhung**: 0–160 mm
- **Schotterbedarf** in t/km
- Dazu zwei Schotter-Rohdichtewerte aus Tims Unterlagen: **unverdichtet
  1,45 t/m³**, **verdichtet 1,65 t/m³**.

**Eigene Websuche (2026-09-14), Ergebnis**: **Ril 823 "Oberbauarbeiten
planen" ist real bestätigt** — katalogisiert bei der SLUB Dresden
(Signatur 2005 4 001739, DB Netz AG, Stand 01.03.2004, Loseblattwerk):
https://katalog.slub-dresden.de/en/id/0-1186389303 — Teil derselben
Richtlinienfamilie 800/820/821/823/824 wie zuvor gefunden (823 = Planung,
824 = Durchführung, 821 = Prüfung). Bestätigt Tims Angabe vollständig, war
also **keine Fehlinformation**.

**Die konkrete Zahlentabelle selbst bleibt nicht öffentlich auffindbar** —
auch nach gezielter Suche nach dem exakten Bezeichner "823.0100"/"Z08", nach
DB InfraGO's eigenem öffentlichem Regelwerksportal (dort NUR
"netzzugangsrelevante" Richtlinien wie Ril 483 frei als PDF gehostet — Ril
823 ist reine Bau-/Instandhaltungsvorschrift, fällt nicht unter die
EU-Netzzugangs-Veröffentlichungspflicht, daher nicht dort), und nach
Fachforen (ein Statiker-Forum zeigt sogar, dass selbst Bauingenieure die
Richtlinie beim DB-Bestellservice anfordern müssen, keine Zahlen im Forum
selbst). **Die Schwellenarten-Liste** (B58/B70/B75/B90/Holzgruppen/
Stahl-Y) ließ sich einzeln bestätigen (reale Schwellentypen, u. a. über
Trackopedia-PDFs zu Betonschwellen), aber nicht als zusammenhängende
Tabelle mit Schotterbedarf-Werten.

**Rohdichtewerte nur teilweise unabhängig bestätigt**: Eine generische
(nicht Gleisbau-spezifische) Baustoff-Seite nennt für Schotter allgemein
"geschüttet ca. 1,65 t/m³, verdichtet ca. 1,75 t/m³" sowie "Splitt ca.
1,45 t/m³" — **andere Zahlen als Tims Werte** (1,45 unverdichtet/1,65
verdichtet). Das ist keine Widerlegung von Tims Zahlen (seine stammen
vermutlich direkt aus der Ril-823-Tabelle bzw. Ausbildungsunterlagen und
sind damit die vertrauenswürdigere Quelle für dieses Projekt), aber auch
keine unabhängige Bestätigung — beide Zahlenpaare unterscheiden sich, hier
lohnt sich, Tim zu fragen, woher genau seine zwei Werte stammen, bevor sie
als "Quelle: DB Ril 823" in die App übernommen werden.

**Empfehlung**: Die Grunddaten für Struktur/Kontext sind jetzt solide belegt
(Ril 823 real, Familie/Aufbau bekannt, Schwellenarten real). Für eine
inhaltlich korrekte Schotterbedarf-Rechenaufgabe fehlen aber die
tatsächlichen Zahlenwerte pro Schwellenart/Schwellenabstand/Überhöhung aus
der Tabelle selbst — die hat nur Tim (Foto/Abschrift nötig), eine weitere
Websuche wird sie nicht liefern (siehe oben, mehrfach bestätigt nicht
öffentlich).

