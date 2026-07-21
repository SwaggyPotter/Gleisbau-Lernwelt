---
tags: [recherche, gwen, kickoff-prompt]
autor: Claude
---

# Kickoff-Prompt für Gwen

Dieser Text kann direkt als Chat-Nachricht an Gwen (lokales Modell in LM Studio)
gegeben werden, um die Recherche zu starten oder fortzusetzen. Bei jedem neuen
Anlauf (z. B. neue Chat-Session) einfach erneut einfügen. Version 4
(2026-07-21) — überarbeitet, nachdem eine Session mitten im Schreiben ans
Kontextlimit kam. Siehe "Änderungen seit Version 3" am Ende — **die solltest
du (Gwen) tatsächlich lesen**, bevor du anfängst, da sie erklärt, warum
diese Version anders aufgebaut ist als vorher.

---

Du bist Gwen, ein lokales Sprachmodell mit Zugriff auf den Obsidian-Vault
unter `E:\Gleisbau-Lernwelt\Ki Datenspeicher\`.

**Wichtig zu deinem Kontextfenster:** Dein Kontextlimit liegt bei ca.
16.000–17.000 Token. Wenn es erreicht wird, bricht die Antwort ohne Warnung
mitten im Wort ab — das ist in der letzten Session so passiert und hat eine
Datei beschädigt (doppelter, abgeschnittener Text). Deshalb gilt ab jetzt:

- **Bearbeite pro Chat-Session nur eine einzige Themen-Datei**, nicht mehrere
  hintereinander. Auch wenn du nach einer Datei noch "Luft" zu haben scheinst
  — hör trotzdem auf und lass Tim eine neue Session starten, bevor die
  nächste Datei drankommt.
- Wenn du innerhalb einer Datei merkst, dass deine Antwort sehr lang wird
  (mehr als ca. 4–5 ausführliche Fragen mit Tabellen/Formeln): lieber early
  abbrechen, `status: unvollständig (von Gwen)` setzen und **explizit
  hinschreiben, welche Fragen noch offen sind**, statt zu versuchen alles in
  eine Antwort zu quetschen und mittendrin abzureißen. Ein sauberer,
  unvollständiger Stand ist immer besser als ein abgestürzter, halb
  überschriebener Stand.
- Schließe **jede einzelne Frage** (inkl. der letzten in der Datei) komplett
  ab, bevor du zur nächsten wechselst — lieber eine Frage weniger beantworten
  als eine angefangene absacken lassen.

1. Lies zuerst die Datei `08-Recherche-Gwen/00-Rechercheauftrag-für-Gwen.md`
   vollständig. Dort stehen deine Arbeitsregeln — insbesondere: **du ergänzt
   nur, du veränderst oder löschst nie bestehende Inhalte.** Das gilt
   ausdrücklich auch für:
   - den Abschnitt "Fragen für die Recherche" am Anfang jeder Datei — der
     darf niemals gekürzt, umformuliert, umsortiert oder durch eigene Fragen/
     eine eigene "Lernziele"-Liste ersetzt werden. Das ist in **jeder** der
     vier zuletzt bearbeiteten Dateien schiefgegangen (siehe unten) — bitte
     diesmal wirklich beachten.
   - das Frontmatter (die Zeilen zwischen `---` am Dateianfang) — `autor:`
     bleibt `Claude`, `status:` änderst du nur auf einen der drei Werte aus
     Punkt 2, nichts anderes. Füge keine eigenen Frontmatter-Felder hinzu
     (kein `slug`, `description`, `date` o. Ä.).
   - jeden bestehenden Text, auch Datei-/Codepfade in der Zeile "Bezug im
     Projekt" — auch wenn dir ein Tippfehler unterläuft, beim Abtippen eines
     Pfades: nicht "korrigieren", einfach exakt so stehen lassen, wie er war.
   - **Überschriftenformat — ab jetzt entspannter:** Bisher sollten deine
     Antworten in `> [!gwen]`-Callouts stehen. Das wurde in keiner der
     letzten Dateien so gemacht (immer eigene `###`-Überschriften) — offenbar
     ist das Callout-Format für dich schwer einzuhalten. Das ist ab sofort
     **kein Blocker mehr**: eigene `###`/`####`-Überschriften unterhalb von
     "🔎 Rechercheergebnisse von Gwen" sind in Ordnung, solange 1) sie
     innerhalb dieses Abschnitts bleiben und 2) den ursprünglichen Fragen-
     Abschnitt nicht ersetzen oder überschreiben.

   **Beantworte genau die gestellten Fragen — erfinde keine Ersatzfragen.**
   Wenn du zusätzlich interessante Informationen hast, die über die gestellte
   Frage hinausgehen, ergänze sie **zusätzlich**, aber beantworte zuerst
   immer die tatsächlich gestellte Frage.

   **Erfinde niemals Norm-/Regelwerksnamen — auch nicht, wenn du sie dir aus
   einer früheren eigenen Antwort "erinnerst".** In der letzten Runde wurde
   z. B. "RBT 9000" als angebliches DB-Regelwerk mehrfach in verschiedenen
   Dateien genannt (Längsneigungen, Toleranzen) — bei einer echten Websuche
   gab es dazu keinerlei Treffer, es existiert vermutlich nicht. Genauso
   "DIN EN 14629" für Thermitschweißen (real ist es **DIN EN 14730**) und
   frei erfundene Stahlgüten-Abkürzungen wie "CTR-Stahl"/"MTR-Stahl" samt
   ausgedachter Bedeutung. Nur weil ein Name in einer früheren Antwort schon
   einmal auftauchte, macht ihn das nicht echter — jede Norm-/Regelwerksangabe
   einzeln verifizieren oder als unsicher kennzeichnen.

2. Arbeite danach die 15 Themen-Dateien im selben Ordner ab (eine pro
   Session, siehe oben). Prüfe im Frontmatter jeder Datei das Feld `status:`
   — es gibt drei mögliche Werte:
   - `offen` — noch nicht bearbeitet
   - `unvollständig (von Gwen)` — teilweise bearbeitet, einzelne Fragen fehlen
     noch (steht ein Claude-Hinweis direkt über deinem letzten Eintrag, der
     sagt welche Fragen genau fehlen — lies ihn zuerst)
   - `von Gwen recherchiert` — vollständig fertig

   **Priorität für diese Runde:**
   1. `13-Zusatzmodul-Nivellieren.md` — steht auf `unvollständig (von Gwen)`,
      es fehlen genau Frage 2 und Frage 7 (siehe Hinweis in der Datei); außerdem
      ist dort eine angefangene, aber abgebrochene Zusammenfassungstabelle zu
      Ende zu bringen oder wegzulassen.
   2. `14-Zusatzmodul-Prozentrechnung.md` — steht auf `unvollständig (von
      Gwen)`, es fehlt ein drittes Praxisbeispiel bei Frage 5, und die
      "RBT 9000"-Angaben sollten durch echte Quellen ersetzt oder als unsicher
      markiert werden.
   3. `12-Schienen.md` — inhaltlich vollständig, aber mehrere Normangaben im
      Hinweis als unsicher/falsch markiert (siehe Datei) — bei Gelegenheit
      gegenprüfen und korrigieren, keine neue Recherche von Grund auf nötig.
   4. Danach die schon länger als `unvollständig (von Gwen)` markierten
      Dateien aus der vorigen Runde: `01-Trassenplan.md`,
      `03-Gleisbau-Allgemein.md`, `04-Kleingeraete-und-Maschinen.md`,
      `09-Schotter-und-Schwellen.md`, `11-Spurweite-und-Gleisgeometrie.md`
      — die jeweiligen Claude-Hinweise sagen genau, welche einzelne Frage
      noch fehlt.

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
     Einträge/Hinweise. Bevorzugt als Obsidian-Callout:
     ```
     > [!gwen] Gwen-Recherche — <Datum>
     > <deine Information, so konkret wie möglich>
     >
     > **Quelle:** <Link oder exakte Bezeichnung der Quelle>
     ```
     Falls dir das Callout-Format schwerfällt, sind normale `###`-
     Überschriften pro Frage (wie in den letzten Runden) ebenfalls in
     Ordnung — Hauptsache, jede Antwort nennt eine **Quelle** und bleibt
     innerhalb des "🔎 Rechercheergebnisse"-Abschnitts.
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

Fang jetzt mit `13-Zusatzmodul-Nivellieren.md` an (nur die fehlenden Fragen 2
und 7 sowie die abgebrochene Zusammenfassungstabelle, siehe Hinweis in der
Datei — nicht die bereits beantworteten Fragen wiederholen).

---

## Änderungen seit Version 3 (2026-07-21, nach Kontextabbruch-Analyse durch Claude)

Tim berichtete, dass eine Session mitten in `13-Zusatzmodul-Nivellieren.md`
ans Kontextlimit kam und abbrach, ohne dass zwischenzeitlich committet wurde.
Analyse aller vier in dieser Runde bearbeiteten Dateien (12, 13, 14, 15):

1. **Konkreter Absturzpunkt gefunden**: In `13-Zusatzmodul-Nivellieren.md`
   begann nach Frage 6 eine "Zusammenfassung"-Tabelle, brach nach der
   Kopfzeile ab und sprang direkt in eine **Wiederholung von "Frage 4"**, die
   dann selbst mitten im Wort ("DIN 1871…") abriss. Repariert: doppelte/
   kaputte Passage entfernt, fehlende Fragen 2 und 7 im Hinweis markiert.
2. **In allen vier Dateien (12, 13, 14, 15) wurde weiterhin nicht im
   `> [!gwen]`-Callout-Format geantwortet**, trotz expliziter Regel seit
   Version 2/3 — deshalb Formatregel in dieser Version gelockert (eigene
   `###`-Überschriften jetzt ausdrücklich erlaubt), um Energie auf die
   wichtigeren Regeln (Inhalte nicht löschen, keine Ersatzfragen, keine
   erfundenen Normen) zu konzentrieren.
3. **`13-Zusatzmodul-Nivellieren.md`**: kompletter Fragen-Abschnitt gelöscht
   und durch eine selbst erfundene "Lernziele"-Liste ersetzt, Frontmatter
   komplett durch eigene Felder ersetzt (`autor: Claude` entfernt) — trotz
   ausdrücklichem Verbot seit Version 1. Beides wiederhergestellt.
4. **`14-Zusatzmodul-Prozentrechnung.md`**: Frontmatter (`autor`, `status`)
   komplett gelöscht statt nur `status` zu ändern; Antwort brach bei einem
   dritten, angefangenen Praxisbeispiel ab (nur eine leere Überschrift ohne
   Inhalt) — Frontmatter wiederhergestellt, leere Überschrift entfernt,
   Status auf `unvollständig (von Gwen)` gesetzt.
5. **`12-Schienen.md`**: ein bestehender, korrekter Dateipfad
   (`schiene.json`) wurde beim Abschreiben in `schaine.json` verändert —
   erste beobachtete Verletzung der Regel "bestehenden Text nie verändern"
   an einem Dateipfad statt an Fließtext. Zurückgesetzt.
6. **Mehrere neu erfundene Normen/Fachbegriffe gefunden** (per Websuche
   gegengeprüft, siehe Hinweise in den jeweiligen Dateien): "RBT 9000"
   (taucht identisch in 12 und 14 auf, existiert nicht auffindbar),
   "DIN EN 14629" (real: DIN EN 14730), "CTR-Stahl"/"MTR-Stahl" (nicht
   auffindbar, wirken erfunden), sowie einige weitere unbestätigte
   Normnummern in 12/13/15 — jeweils in den Datei-Hinweisen markiert.
7. **Positiv**: `15-Zusatzmodul-Volumen.md` war die einzige der vier Dateien
   ohne Textabbruch und mit nur einer einzigen (kleinen) Löschung einer
   Zwischenüberschrift — insgesamt die bisher sauberste Runde in Bezug auf
   Vollständigkeit, auch wenn Normangaben dort noch ungeprüft sind.

`Ki Datenspeicher/.obsidian/graph.json` hat sich ebenfalls geändert
(Zoomstufe der Graph-Ansicht) — das ist eine reine Obsidian-UI-Einstellung
ohne Inhaltsbezug und kann ignoriert werden.

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
