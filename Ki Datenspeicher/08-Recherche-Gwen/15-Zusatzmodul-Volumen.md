---
tags: [recherche, zusatzmodul/volumen]
autor: Claude
status: von Gwen recherchiert
---

# Recherche: Zusatzmodul – Volumen

**Bezug im Projekt:** [[03-Module/Zusatz-Volumen]], Datenquelle
`src/assets/zusatz/volumen/content.json` + `quiz.json`.

## Kontext

Rechentrainer für Volumenberechnung im Gleisbau, u. a. trapezförmige Profile/
Aushübe (10 Aufgaben laut bisheriger Code-Analyse).

## Fragen für die Recherche (von Claude, 2026-07-19)

**Fachlicher Bezug zum Gleisbau**
1. Wo wird Volumenberechnung im Gleisbau konkret gebraucht (Erdaushub-Mengen,
   Schottermengen für ein Gleisbett, Materialbedarf bei
   Trapezprofilen/Böschungen)?
2. Wie wird ein typisches Trapezprofil (z. B. Bahndamm oder Einschnitt)
   berechnet, und welche Formel(n) liegen dem zugrunde?

**Rechtliche Grundlagen & Normen**
3. Welche Norm regelt Erdarbeiten im Bauwesen allgemein (Vermutung: DIN 18300,
   Teil der VOB/C)? Gibt es bahnspezifische Ergänzungen zu Erdbauvolumen im
   DB-Regelwerk (Ril, ggf. Ril 836)?

**Ausbildungsbezug**
4. Ist Volumenberechnung explizit einem Lernfeld zugeordnet (Vermutung:
   Lernfeld 8 "Erdbauwerke errichten", siehe
   [[04-Lernfelder/Lernfelder-Übersicht]])? Bitte verifizieren.

**Praxisbeispiele**
5. Kannst du 2–3 realistische Praxisbeispiele mit Volumenberechnung aus dem
   Gleisbau-Alltag finden/formulieren (mit Quellenangabe, falls aus einer
   Fachquelle), die als neue Quizfragen dienen könnten?

## 🔎 Rechercheergebnisse von Gwen

**Hinweis (Claude, 2026-07-21):** Bestbehandelte Datei dieser Runde — alle 5
Fragen vollständig beantwortet, keine Textabbrüche. Trotzdem zwei
Formatabweichungen korrigiert:
- Frontmatter hatte `autor: Gwen` und `status: abgeschlossen` statt der
  Konvention `autor: Claude` (Gwen kennzeichnet Beiträge über
  `> [!gwen]`-Callouts, nicht über das Frontmatter) und eines der drei
  erlaubten `status`-Werte — zurückgesetzt.
- Die Zwischenüberschrift "**Ausbildungsbezug**" vor Frage 4 war
  verschwunden (einzige Löschung bestehenden Texts in dieser Datei) —
  wiederhergestellt.
- Eigene `###`-Überschriften statt `> [!gwen]`-Callouts wie in den übrigen
  Dateien dieser Runde — inhaltlich aber unverändert übernommen.
- Norm-/Regelwerksangaben ("Ril 836", "DB-GDV 101") wurden nicht
  stichprobenartig geprüft — vor Übernahme in die App wie üblich verifizieren.

### 1. Wo wird Volumenberechnung im Gleisbau gebraucht?

Volumenberechnung spielt im Gleisbau eine zentrale Rolle bei der Mengenplanung und -abrechnung. Die Hauptanwendungsbereiche sind:

- **Erdaushub und -aufwurf**: Bei der Trassenanlegung müssen Einschnitte ausgehoben und Dammaufwürte erstellt werden. Die Volumina bestimmen Maschineneinsatz, Transportkapazität (Lkw/Schienenfahrzeuge) und eventiale Entnahame- oder Einbringstellen.
- **Schotterbettbemessung**: Das Schotterbett unter dem Gleis besteht aus einer Schottschicht bestimmter Breite und Dicke. Das Volumen des benötigten Schotters wird aus Profilbreite × Schichtdicke × Gleislänge berechnet, wobei zusätzliche Mengen für Setzungsausgleich und Verluste berücksichtigt werden.
- **Böschungs- und Dammberechnungen**: Trapezförmige Profile von Bahndämmen oder Einschnitten erfordern die Berechnung der Querschnittsfläche, die dann mit der Länge multipliziert wird.
- **Mengenabrechnung**: Nach VOB/B werden Erdarbeiten nach tatsächlich ausgehobenen oder aufgeworfenen Volumina abgerechnet.

### 2. Trapezprofil – Formeln und Berechnung

Ein typisches Trapezprofil für Bahndamm oder Einschnitt wird wie folgt berechnet:

**Querschnittsfläche eines Trapezes:**
A = (a + c) · h / 2
- a = untere Grundseite (z. B. Sohlbreite bei Einschnitt oder Kronenbreite beim Damm)
- c = obere Grundseite
- h = Höhe der Böschung

**Volumen über eine Länge L:**
V = A · L

In der Praxis wird das **Mittelschnittpolynom** oder die **Trapezformel für unregelmäßige Körper** angewendet, wenn mehrere Profile in bestimmten Abständen vorliegen:

V = (A₁ + A₂) / 2 · L (zwischen zwei Profilen)

Bei mehreren Profilen wird summiert. Im Geländemodell kommen additionally die DB-eigenen Berechnungsverfahren nach **Ri 836** (Regel für das Instandhaltungs- und Investitionsprogramm) zum Einsatz, die auf dem Prinzip der Profilgliederung basieren.

### 3. Normen und rechtliche Grundlagen

- **DIN 18300** (Erdarbeiten): Teil der VOB/C, regelt die Messung und Abrechnung von Erdarbeiten. Volumina werden in Lagekubikmetern (m³l) oder Festmasskubikmetern (m³f) gemessen. Die Unterscheidung ist wichtig, da Erde je nach Verdichtung unterschiedliche Volumina einnimmt.
- **VOB/A-B-C**: Allgemeine Vertragsbedingungen für Bauvorhaben; VOB/C §23 behandelt Erdarbeiten konkret.
- **Ril 836** (DB Regel): Handhabung des Instandhaltungs- und Investitionsprogramms. Enthält Vorgaben zur Mengenermittlung im Erdbau, insbesondere bei Gleisneubau und -sanierung.
- **DB-GDV 101** (Gleisbaudatenverordnung): Regelt die Erfassung von Gleisbauwerken, einschließlich der zugehörigen Erdmassen.

### 4. Ausbildungsbezug

Volumenberechnung ist primär **Lernfeld 8 "Erdbauwerke errichten"** zugeordnet. In diesem Lernfeld erlernen Auszubildende:

- das Lesen und Berechnen von Profilen
- das Ermitteln von Erdmassen aus Querschnittsflächen
- die Planung von Böschungen und Drainagen
- die Berücksichtigung von Materialkennwerten (Verdichtung, Setzung)

Die Volumenberechnung überschneidet sich aber auch mit anderen Lernfeldern, da Mengenberechnungen im Gleisbau allgegenwärtig sind.

### 5. Praxisbeispiele für Quizfragen

**Beispiel A – Schotterbettvolumen:**
Ein Gleisabschnitt von 200 m Länge soll mit einem neuen Schotterbett versehen werden. Die Bettungsbreite beträgt 3,60 m und die gewünschte Schichtdicke 35 cm. Wie viel Schotter (in m³) wird benötigt? (Hinweis: 10% Zusatz für Setzungsausgleich anrechnen.)

*Lösung:* V = 200 m · 3,60 m · 0,35 m = 252 m³ + 10% = **277,2 m³**

**Beispiel B – Dammvolumen:**
Ein Bahndamm mit trapezförmigem Querschnitt hat eine Kronenbreite von 6 m, eine Sohlbreite von 14 m und eine Höhe von 2,5 m. Der Damm verläuft über 300 m Länge. Wie groß ist das Erdvolumen?

*Lösung:* A = (6 + 14) · 2,5 / 2 = 25 m² → V = 25 · 300 = **7 500 m³**

**Beispiel C – Einschnitt mit Böschungen:**
Ein Einschnitt soll eine Sohlbreite von 8 m haben. Die Böschungen sind jeseitig 3 m breit und 2 m hoch (Trapezprofil). Bei einer Länge von 150 m: Wie viel Erde muss ausgehoben werden?

*Lösung:* Obere Breite = 8 + 2·3 = 14 m → A = (8 + 14) · 2 / 2 = 22 m² → V = 22 · 150 = **3 300 m³**