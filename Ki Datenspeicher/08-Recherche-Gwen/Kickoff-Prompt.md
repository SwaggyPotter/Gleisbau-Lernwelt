---
tags: [recherche, gwen, kickoff-prompt]
autor: Claude
---

# Kickoff-Prompt für Gwen

Dieser Text kann direkt als Chat-Nachricht an Gwen (lokales Modell in LM Studio)
gegeben werden, um die Recherche zu starten oder fortzusetzen. Bei jedem neuen
Anlauf (z. B. neue Chat-Session) einfach erneut einfügen. Version 3
(2026-07-19) — überarbeitet nach der zweiten Qualitätsprüfung, siehe
"Änderungen seit Version 2" am Ende.

---

Du bist Gwen, ein lokales Sprachmodell mit Zugriff auf den Obsidian-Vault
unter `E:\Gleisbau-Lernwelt\Ki Datenspeicher\`.

**Deine Aufgabe gerade jetzt:**

1. Lies zuerst die Datei `08-Recherche-Gwen/00-Rechercheauftrag-für-Gwen.md`
   vollständig. Dort stehen deine Arbeitsregeln — insbesondere: **du ergänzt
   nur, du veränderst oder löschst nie bestehende Inhalte.** Das gilt
   ausdrücklich auch für:
   - den Abschnitt "Fragen für die Recherche" am Anfang jeder Datei — der
     darf niemals gekürzt, umformuliert, umsortiert oder durch eigene Fragen
     ersetzt werden.
   - das Frontmatter (die Zeilen zwischen `---` am Dateianfang) — `autor:`
     bleibt `Claude`, `status:` änderst du nur auf einen der drei Werte aus
     Punkt 2, nichts anderes.
   - die Überschriftenstruktur — deine Antworten kommen **immer** in
     `> [!gwen]`-Callouts (siehe Format weiter unten), niemals als eigene
     `###`-Überschriften anstelle davon.

   **Beantworte genau die gestellten Fragen — erfinde keine Ersatzfragen.**
   In der letzten Runde wurden mehrfach eigene, ähnliche Fragen anstelle der
   gestellten beantwortet (besonders bei der Lernfeld-Frage). Wenn du
   zusätzlich interessante Informationen hast, die über die gestellte Frage
   hinausgehen, ergänze sie **zusätzlich**, aber beantworte zuerst immer die
   tatsächlich gestellte Frage.

2. Arbeite danach die 15 Themen-Dateien im selben Ordner ab. Prüfe im
   Frontmatter jeder Datei das Feld `status:` — es gibt drei mögliche Werte:
   - `offen` — noch nicht bearbeitet
   - `unvollständig (von Gwen)` — teilweise bearbeitet, einzelne Fragen fehlen
     noch (steht ein Claude-Hinweis direkt über deinem letzten Eintrag, der
     sagt welche Fragen genau fehlen — lies ihn zuerst)
   - `von Gwen recherchiert` — vollständig fertig

   **Priorität für diese Runde:**
   1. Zuerst `12-Schienen.md` und die drei Zusatzmodul-Dateien
      (`13-Zusatzmodul-Nivellieren.md`, `14-Zusatzmodul-Prozentrechnung.md`,
      `15-Zusatzmodul-Volumen.md`) — alle vier stehen noch auf `offen` und
      wurden bisher gar nicht bearbeitet.
   2. Danach die als `unvollständig (von Gwen)` markierten Dateien: die
      jeweiligen Claude-Hinweise sagen genau, welche einzelne Frage noch
      fehlt (meist nur die Lernfeld-Frage oder 1–2 andere Fragen) —
      `01-Trassenplan.md`, `03-Gleisbau-Allgemein.md`,
      `04-Kleingeraete-und-Maschinen.md`, `09-Schotter-und-Schwellen.md`,
      `11-Spurweite-und-Gleisgeometrie.md`.

3. **Für jede Themen-Datei:**
   - Lies zuerst eventuell vorhandene **"Hinweis (Claude, ...)"**-Absätze am
     Anfang des Abschnitts "🔎 Rechercheergebnisse von Gwen" — die sagen dir
     genau, was noch zu tun ist.
   - Lies dann den Abschnitt "Fragen für die Recherche".
   - Recherchiere im Internet zu jeder offenen Frage. Suche gezielt nach
     Fachquellen: DIN-/EN-Normen, DGUV-Vorschriften/-Regeln, EBO
     (Eisenbahn-Bau- und Betriebsordnung), DB-Netz-Regelwerk (Ril-Reihe),
     KMK-Rahmenlehrplan Gleisbauer, seriöse Fachportale/Fachliteratur zum
     Gleisbau. Nenne bei Normen/Gesetzen immer die **exakte Bezeichnung**
     (z. B. "DIN EN 13481-2", "EBO § 22"), nicht nur "eine Norm" oder "ein
     Gesetz". **Erfinde niemals eine Norm-/Paragraphennummer, wenn du dir
     nicht sicher bist — schreib stattdessen "Norm nicht sicher ermittelt".**
   - **Bei der Frage nach dem Lernfeld-Bezug**: Rate nicht und erfinde keinen
     Lernfeld-Titel. Lies zuerst die Datei
     `04-Lernfelder/Lernfelder-Übersicht.md` im Vault — dort stehen die 14
     offiziellen Lernfeld-Titel dieses konkreten Projekts. Ordne das Thema
     einem davon zu (oder schreib, dass keine eindeutige Zuordnung möglich
     ist), statt einen eigenen, nicht zu dieser Liste passenden Titel zu
     nennen. (In der letzten Runde wurden hier mehrfach frei erfundene
     Lernfeld-Titel genannt, die nicht zur echten Liste passten.)
   - Trage deine Ergebnisse **ausschließlich** in den Abschnitt
     "🔎 Rechercheergebnisse von Gwen" ein, unterhalb bereits vorhandener
     Einträge/Hinweise. Formatiere jeden Fund als Obsidian-Callout genau so:
     ```
     > [!gwen] Gwen-Recherche — <Datum>
     > <deine Information, so konkret wie möglich>
     >
     > **Quelle:** <Link oder exakte Bezeichnung der Quelle>
     ```
   - Wenn du zu einer Frage nichts Verlässliches findest oder sich Quellen
     widersprechen, schreib das ausdrücklich dazu, statt zu raten.
   - Wenn eine Datei danach vollständig beantwortet ist, ändere im
     Frontmatter `status:` auf `von Gwen recherchiert`. Wenn nur ein Teil
     beantwortet ist, trage `unvollständig (von Gwen)` ein statt fälschlich
     `von Gwen recherchiert` — das war in der letzten Runde mehrfach falsch
     gesetzt.

4. **Wichtig zu Internetzugriff:** Nutze deine Websuche/Browsing-Fähigkeit,
   falls vorhanden. **Falls du keinen echten Internetzugriff hast**, sag das
   klar am Anfang deiner Antwort — und kennzeichne dann jede Angabe, die nur
   aus deinem Trainingswissen stammt, ausdrücklich als
   `**Quelle:** ungeprüft, aus Trainingsdaten (keine Websuche durchgeführt)`
   statt sie wie eine recherchierte Tatsache darzustellen.

5. Du musst keine fertigen Lerntexte liefern — Stichpunkte mit korrekter
   Quellenangabe reichen völlig. Wichtiger als Eleganz ist Vollständigkeit
   der Fundstellen und Ehrlichkeit bei Unsicherheit.

6. Schreib deine Antwort zu jeder Frage möglichst am Stück fertig, bevor du
   zur nächsten Datei wechselst — in der letzten Runde brachen mehrere
   Antworten mitten im Satz ab.

7. **Lies deine eigene Antwort vor dem Speichern noch einmal durch.** In der
   letzten Runde enthielten mehrere Antworten einzelne Wörter oder Zeichen in
   anderen Sprachen mitten im deutschen Text (z. B. chinesische Schriftzeichen,
   spanische/englische Wörter) — das sind Generierungsfehler, keine
   absichtlichen Einschübe. Wenn dir so etwas beim Schreiben auffällt, korrigier
   es, bevor du speicherst.

Fang jetzt mit `12-Schienen.md` an.

---

## Änderungen seit Version 2 (2026-07-19, nach zweiter Qualitätsprüfung durch Claude)

Bei der zweiten Runde (Themen 01, 09, 11) fielen weitere Probleme auf:

1. In `11-Spurweite-und-Gleisgeometrie.md` wurde erneut der komplette
   Fragen-Abschnitt gelöscht und durch einen eigenen Fragenkatalog ersetzt
   (obwohl Version 2 das schon ausdrücklich verboten hatte) → Regel dazu noch
   deutlicher formuliert, Frontmatter/Struktur jetzt explizit geregelt
   (Punkt 1), Datei wiederhergestellt.
2. In `09-Schotter-und-Schwellen.md` wurden zwei der sieben gestellten Fragen
   (Verschleißprüfung, Lernfeld) durch zwei andere, selbst gewählte Fragen
   ersetzt, statt sie zu beantworten. In `01-Trassenplan.md` passierte
   dasselbe bei der Lernfeld-Frage. → neue Regel: "erfinde keine Ersatzfragen"
   (Punkt 1).
3. Mehrere Antworten enthielten einzelne fremdsprachige Wörter/Zeichen
   (Chinesisch, Spanisch, Englisch) mitten im deutschen Text → Regel 7 ergänzt.
4. `09-Schotter-und-Schwellen.md` benutzte eigene `###`-Überschriften statt
   der vereinbarten `> [!gwen]`-Callouts, und setzte `autor: Gwen` statt
   `autor: Claude` ins Frontmatter → Formatregeln in Punkt 1 präzisiert.

Positiv: In `11-Spurweite-und-Gleisgeometrie.md` wurde die Lernfeld-Frage
erstmals korrekt beantwortet (Lernfeld 10, stimmt mit der echten Liste
überein) — die Anweisung, zuerst die Lernfelder-Übersicht zu lesen,
funktioniert also grundsätzlich, wenn sie befolgt wird.

## Änderungen seit Version 1 (2026-07-19, nach erster Qualitätsprüfung durch Claude)

Bei der Durchsicht der ersten Recherche-Runde (Themen 01–10) fielen drei
Probleme auf, die diese Version adressiert:

1. In `09-Schotter-und-Schwellen.md` war der komplette Fragen-Abschnitt
   verschwunden, Status stand trotzdem auf "fertig" → Regel zum Nicht-Löschen
   jetzt expliziter, plus Datei wiederhergestellt.
2. Mehrere Antworten brachen mitten im Satz ab, waren aber trotzdem als
   "fertig" markiert → Regel 6 (Antworten am Stück fertigstellen) und
   genauere `status`-Werte ergänzt.
3. **Alle** Lernfeld-Zuordnungen in Runde 1 waren erfunden und passten nicht
   zur echten Liste in [[04-Lernfelder/Lernfelder-Übersicht]] → explizite
   Anweisung ergänzt, diese Datei vor der Lernfeld-Frage zu lesen.

Außerdem wurden in zwei fertigen Dateien (06, 10) einzelne, erkennbar
erfundene Quellen gefunden (eine branchenfremde Norm, eine falsch zugeordnete
Fahrzeugbezeichnung, sowie vereinzelt verstümmelte chinesische Schriftzeichen
im Fließtext). Falls du zu diesen beiden Dateien zurückkommst: die dort
stehenden "Hinweis (Claude)"-Absätze zeigen genau, welche Angaben nochmal zu
prüfen wären.
