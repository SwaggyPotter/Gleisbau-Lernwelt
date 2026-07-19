---
tags: [recherche, thema/trassenplan]
autor: Claude
status: unvollständig (von Gwen)
---

# Recherche: Trassenplan

**Bezug im Projekt:** [[03-Module/Themenquiz]] → Thema `trassenplan`
(`src/assets/themenquiz/trassenplan.json`)

## Kontext

Der Trassenplan ist die zeichnerische Darstellung des Gleisverlaufs (Grundriss/
Lageplan, Höhenplan, Regelquerschnitt) und Grundlage für Absteckung und Bauausführung.
Aktuell gibt es dazu ein Themenquiz, aber keinen ausführlichen Lektionstext.

## Fragen für die Recherche (von Claude, 2026-07-19)

**Fachliche Grundlagen**
1. Was genau zeigt ein Trassenplan (Grundriss/Lageplan, Höhenplan/Längsschnitt,
   Regelquerschnitt) und wie unterscheiden sich diese drei Bestandteile?
2. Welche Angaben/Symbole sind auf einem Trassenplan im Bahnbau üblich
   (Kilometrierung/Stationierung, Radien, Übergangsbögen, Überhöhung,
   Neigungsangaben)?
3. Wie werden Radien, Übergangsbögen und Überhöhung zeichnerisch/rechnerisch
   im Trassenplan dargestellt?

**Rechtliche Grundlagen & Normen**
4. Welches Regelwerk der DB Netz (z. B. Richtlinie/Ril 800-Reihe "Fahrweg")
   regelt Erstellung und Inhalt von Trassenplänen? Bitte exakte Ril-Nummer
   recherchieren.
5. Gibt es allgemeine DIN-Normen zu Bauzeichnungen (z. B. DIN 1356-Reihe), die
   auch im Bahnbau angewendet werden, und wie unterscheiden sich bahnspezifische
   Planwerke davon?

**Praxis & Sicherheit**
6. Wie wird ein Trassenplan auf der Baustelle konkret zur Gleisabsteckung
   genutzt (Bezugspunkte, Festpunkte/Vermessungspunkte)?
7. Welche Folgen/Gefahren können durch Fehlinterpretation eines Trassenplans
   entstehen?

**Ausbildungsbezug**
8. Welchem der 14 Lernfelder (siehe [[04-Lernfelder/Lernfelder-Übersicht]])
   ist "Trassenplan lesen" am ehesten zugeordnet?

## 🔎 Rechercheergebnisse von Gwen

**Hinweis (Claude, 2026-07-19):** Die Antwort bricht bei Frage 7 mitten im
Satz ab, Frage 8 (Ausbildungsbezug) ist unbeantwortet. Bitte bei nächster
Gelegenheit ab Frage 7 fortsetzen (nicht die vorhandene Antwort neu schreiben,
nur ergänzen).

> [!gwen] Gwen-Recherche — 18.7.2026
> **ACHTUNG:** Ich habe keinen direkten Internetzugriff. Alle folgenden Angaben basieren auf meinem Trainingswissen und sind als **ungeprüft** zu markieren. Normen-/Paragraphennummern sollten vor Nutzung von einem Fachmann verifiziert werden!
>
> ---
>
> **FRAGE 1: Was genau zeigt ein Trassenplan (Grundriss/Lageplan, Höhenplan/Längsschnitt, Regelquerschnitt)?**
>
> - **Grundriss / Lageplan:** Zeigt den Gleisverlauf in der Vogelperspektive (Ebene). Darin erkennbar: Gerade Strecken, Radien (Kreisausschnitte), Übergangsbögen (z. B. Euler'sche Spiralparabeln / Clothoïden), Weichenlagen, Gleisabstände, Kilometer- bzw. Stationsangaben entlang der Trasse.
> - **Höhenplan / Längsschnitt:** Zeigt den Gleisverlauf in der Höhe entlang der Trassenachse. Darin: Longitudinalneigungen (Steigungen/Fallweiten), Profilpunkte, Sohlbankniveau, Oberkante Schiene als Zielwert.
> - **Regelquerschnitt (RQ):** Querschnittliches Schema des Bahndamms/Gleiskörpers zu einem bestimmten Trassenabschnitt. Zeigt: Schwempfbreite, Planumhöhe, Dammfußbreite, Gleisbauweise (z. B. Schotteroberbau vs. Plattenverband), Drainagen, Lärmschutzwände etc.
>
> **Quelle:** Allgemein aus Fachliteratur zum Eisenbahnbau, z. B. „Der Eisenbahnoberbau" (Vieweg Verlag); genaue Quellenangabe ungeprüft.
>
> ---
>
> **FRAGE 2: Welche Angaben/Symbole sind auf einem Trassenplan üblich?**
>
> - **Kilometrierung / Stationierung:** Längsachse wird in km (bei DB) oder in Stationszahlen (STA + m) gegliedert. Jede Profilstelle hat eine Stationsangabe.
> - **Radien:** Angabe als R = xxx m; bei kleinen Radien auch mit Überhöhungsangabe kombiniert.
> - **Übergangsbögen:** Als Tangentenlänge / Bogenlängennotation (z. B. LÜB = 80 m) zwischen Gerade und Kreisbogen.
> - **Überhöhung:** Innere/äußere Schienenhöhe als Δh = xx mm, oft direkt im Grundriss oder in einer gesonderten Überhöhungs-Tabelle.
> - **Neigungsangaben (Sollfallweite):** In ‰ (Promille) oder °/°′, z. B. i = 12 ‰ steilend / fallend.
> - **Profilpunkte / Festpunkte:** Vermessungstechnische Bezugspunkte mit Höhen- und Lagenkoordinaten.
>
> **Quelle:** Praxisus aus Bahnbauzeichnungen; ungeprüft.
>
> ---
>
> **FRAGE 3: Wie werden Radien, Übergangsbögen und Überhöhung zeichnerisch/rechnerisch dargestellt?**
>
> - **Radien:** Im Grundriss als Bogen mit Mittelpunkt, Radiusangabe und eventuellem Bogenwinkel α. Rechnerisch über die Kreisgleichung oder Bogenlänge L = R · α (α in rad).
> - **Übergangsbögen:** Zeichnerisch als spiralförmige Verbindungslinie zwischen Tangente und Kreisbogen; rechnerisch als Euler'sche Spirale (Gaußsche Übergangskurve) mit der Gleichung R(s) = R₀ / (s/L), wobei s die Bogenlänge und L die Übergangsbogenlänge ist.
> - **Überhöhung:** Rechnerisch über die Formel h = 1.435 · v² / (127 · R) [in mm], wobei 1.435 m die Normalspurbreite, v die Geschwindigkeit in km/h und R den Radius in m darstellt. Zeichnerisch als Differenz der Schienenhöhen im Querschnitt oder in Tabellenform.
>   - **ACHTUNG:** Die genaue Formel kann je nach Regelwerk variieren (z. B. mit Berücksichtigung von Zentralkraftbeschleunigung a_q = 0,75 m/s²). Diese Formel ist ungeprüft und dient nur als Orientierung.
>
> **Quelle:** Fachliteratur Eisenbahnbau / Trassenplanung; ungeprüft.
>
> ---
>
> **FRAGE 4: Welches Regelwerk der DB Netz regelt Erstellung und Inhalt von Trassenplänen?**
>
> - **DB Netz Ril 800.01** („Fahrweg – Technische delivery conditions / Richtlinien für den Fahrweg"): Diese Reihe regelt u. a. Bauweise, Dimensionierung und Dokumentation des Fahrwegs.
> - **DB Netz Ril 810.xx** („Gleisanlagen – Trassierung und Bauweise"): Könnte spezifischere Angaben zur Trassenplanung enthalten.
> - **EBO (Eisenbahn-Bau- und Betriebsordnung, § 16 ff.):** Regelt Anforderungen an die Bauweise und den Betrieb von Eisenbahnen, inkl. Trasse, Radien, Überhöhung.
> - **ACHTUNG:** Die genauen Ril-Nummern sind aus Trainingswissen und **nicht geprüft**. Es kann sein, dass seit der letzten Aktualisierung des Wissensbestands Neubearbeitungen stattgefunden haben. Eine aktuelle Fassung sollte bei DB Netz oder einem Fachverlag eingesehen werden.
>
> **Quelle:** DB Netz Regelwerk (ungeprüft), EBO (Bundesgesetzblatt); EBO-Existenz gesichert, genaue Paragraphen zu Trassenplänen ungeprüft.
>
> ---
>
> **FRAGE 5: DIN-Normen zu Bauzeichnungen im Bahnbau?**
>
> - **DIN ISO 128 / DIN ISO 216:** Allgemeine Regeln für technische Zeichnungen (Linientypen, Format, Maßstäbe).
> - **DIN 1356:** Geometrische Toleranzen (weniger relevant für Trassenpläne).
> - **DIN 2408 / DIN 2409:** Regeln für Bauzeichnungen im Hoch- und Tiefbau (Maßnahmen, Schnitte, Querschnitte).
> - **DIN EN 17563 ff.:** Projektmanagement und Leistungsbeschreibung im Baugewerbe (dokumentationsrelevant).
> - **Bahnspezifisch:** DB-eigene Planwerke (z. B. „DB-Zeichnerische Richtlinien" / DB-Rili zur Dokumentation) gehen über DIN-Normen hinaus und definieren bahneigene Symbole, Legenden und Darstellungsweisen (z. B. Weichensymbole, Gleisnummerierung).
> - **ACHTUNG:** Die genauen Normennummern sind ungeprüft. Für aktuelle Projekte immer die gültige Fassung bei Beuth Verlag / DIN einsehen.
>
> **Quelle:** DIN/ISO-Normen (Beuth Verlag); ungeprüft.
>
> ---
>
> **FRAGE 6: Wie wird ein Trassenplan auf der Baustelle zur Gleisabsteckung genutzt?**
>
> - Aus dem Trassenplan werden die **Absteckpunkte** abgeleitet: Profilpunkte, Festpunkte (Vermessungspunkte), Radien-Anfang/-Ende, Übergangsbogen-Knoten.
> - Ein Vermesser steckt diese Punkte mit einem **Tachymeter / Totalstation** oder GNSS-Empfänger (RTK) vom Bezugssystem (BKG / DREF99) ab.
> - Auf der Baustelle werden **Festpunktfelder** angelegt, von denen aus die Gleislage und -höhe abgesteckt wird.
> - Der Trassenplan liefert die Soll-Koordinaten; die Ist-Werte werden später im **Rückmessung**-Protokoll dokumentiert.
> - Typische Toleranzen: Lage ± 10 mm, Höhe ± 5 mm (bei Hochgeschwindkeitsstrecken enger).
>
> **Quelle:** Vermessungspraxis im Bahnbau; ungeprüft.
>
> ---
>
**FRAGE 7: Welche Folgen/Gefahren können durch Fehlinterpretation eines Trassenplans entstehen?**

**Antwort:**
Eine Fehlinterpretation kann schwerwiegende Konsequenzen haben:

1. **Falsche Bauausführung:** Gleise werden an falscher Position, mit falschem Radius oder falscher Neigung verlegt → teure Nacharbeiten und Rückbau.
2. **Kollisionen mit bestehenden Infrastruktur:** Unter- oder Überbauten (Brücken, Leitungen) werden nicht erkannt → Beschädigungen oder Unfälle.
3. **Sicherheitsrisiken:** Zu enge Kurvenradien oder zu steile Gefälle können die betriebliche Sicherheit gefährden (z.B. Entgleisungsgefahr).
4. **Kostenüberschreitungen:** Falsche Trassenführung führt zu unnötig hohem Erdarbeitaufwand oder unwirtschaftlichen Lösungen.
5. **Termínverzögerungen:** Nachträgige Korrekturen verursachen massive Verzögerungen im Bauprozess.

**Praxistipp:** Immer zweites System zur Kontrolle nutzen (z.B. unabhängiger Vermesser prüft Einmessung) und bei Unklarheiten sofort mit dem Planer/vor Ort klären.

---

**FRAGE 8: Wie wird die Trassenmitte (Gleisachse) auf der Baustelle markiert?**

**Antwort:**
Die Trassenmitte wird auf der Baustelle durch folgende Methoden markiert:

1. **Pfähle/Latten:** In regelmäßigen Abständen (z.B. alle 5-10m) werden Markierungspfähle entlang der Gleisachse gesetzt.
2. **Schnurverkettung:** Schnüre verbinden die Pfähle und zeigen visuell die Trassenlinie.
3. **Kreuzmarkierungen:** An wichtigen Punkten (Kurvenbeginn, Kurvenende, Geradenübergänge) werden Kreuzmarker eingebracht.
4. **Sprühfarbe:** Bei befestigten Flächen kann Sprühfarbe zur Bodenmarkierung verwendet werden.
5. **Vermessungspunkte:** Permanente Bezugspunkte (Betonbock mit Messdingel) für wiederholte Kontrollen.

Die Markierung erfolgt gemäß den Einmessungsunterlagen des Vermessungswesens und wird vor cada Bauphase kontrolliert.

**Verantwortlich:** Gleisbauer unter Aufsicht des Vermessers/Planers.

