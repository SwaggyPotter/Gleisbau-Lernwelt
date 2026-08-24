---
tags: [themenquiz, quellenpruefung, gwen, anweisung]
autor: Claude
---

# Themenquiz-Quellenprüfung — Anweisung für Gwen

## Worum es geht

Alle 24 Themenquiz-/Lernfeld-Quizze der App (10 Wissenstests + 14 Lernfelder,
zusammen **645 Fragen**, `src/assets/themenquiz/*.json`) haben aktuell keine
einzige mit einer Quelle belegte Antwort. Tim möchte (2026-08-24): Gwen prüft
jede Frage per Websuche fachlich UND findet für jede als richtig markierte
Antwort eine echte, verlässliche Quelle mit direktem Link. Claude übernimmt
danach die Ergebnisse per Skript in die App-Daten und liest nur noch
Fragestellung + Quelle gegen (kein volles Re-Check der fachlichen Prüfung —
Tim vertraut Gwens Urteil, spart aber trotzdem nichts an den Grundregeln:
niemals erfundene Quellen).

## Aufbau dieses Ordners

- **`Batch-<topic>-<NN>.md`** — je bis zu 15 Fragen EINES Themas (z. B.
  `Batch-lf01-01.md` bis `Batch-lf01-05.md` für Lernfeld 1 mit 72 Fragen).
  Jede Frage steht mit allen Antwortoptionen, der laut App richtigen Antwort
  und der App-Erklärung direkt in der Datei — Gwen muss **keine andere Datei
  öffnen**, um die Fragen zu sehen (spart Kontext).
- **`Fortschritt.md`** — Abhak-Liste pro Batch, gruppiert nach Thema. Wird
  vom Anwende-Skript automatisch abgehakt. **Gwen bearbeitet diese Datei
  nicht.**
- Diese Datei — ausführliche Referenz, muss Gwen nicht zwingend lesen (die
  Kurzanweisung am Kopf jeder Batch-Datei reicht für die eigentliche Arbeit).

## Arbeitsweise: pro Dispatch genau EIN Batch

Claude dispatcht Batches headless über
`node tools/cline-cli/run-gwen-task.cjs "15-Themenquiz-Quellenpruefung/Batch-<topic>-<NN>.md" --retries 2`.
Pro Batch (bis zu 15 Fragen):

1. Gwen öffnet **nur** diese eine Batch-Datei und arbeitet die Fragen **in
   Reihenfolge** ab, jede Frage komplett, bevor die nächste beginnt.
2. Pro Frage: Websuche → die vier `___`-Platzhalter unter "Prüfung (Gwen)"
   ausfüllen (Urteil, Begründung, Quelle-Bezeichnung, Quelle-URL).
3. Am Ende `status:` im Frontmatter setzen (siehe unten), dann aufhören.

## Bedeutung der vier Felder

- **Urteil:**
  - `RICHTIG` — die markierte Antwort stimmt fachlich, eine gefundene Quelle
    stützt das. **Nur dann werden Quelle-Bezeichnung/-URL später in die App
    übernommen.**
  - `FALSCH` — die markierte Antwort ist fachlich falsch. In der Begründung
    angeben, was stattdessen richtig wäre. Wird NICHT automatisch in die App
    übernommen (Claude/Tim entscheiden separat über eine Korrektur).
  - `UNSICHER` — keine verlässliche Quelle gefunden oder Quellen
    widersprechen sich. Völlig legitimes Ergebnis, besser als raten.
- **Begründung:** 1–2 Sätze reichen.
- **Quelle-Bezeichnung:** kurzer Anzeigename, der in der App als Link-Text
  erscheint (z. B. "DIN EN 13481-2", "EBO § 22", "BAuA – Baustellensicherung").
- **Quelle-URL:** voller Link (https://...) zur genau dieser Quelle — keine
  Startseite einer Website, wenn eine tiefere, spezifischere Seite existiert.
  Bei UNSICHER: `keine gefunden`.

## Status-Werte im Frontmatter der Batch-Datei

- `offen` — noch nicht bearbeitet
- `geprüft (von Gwen)` — alle Fragen des Batches haben alle vier Felder
  ausgefüllt (auch bei UNSICHER: Begründung + `keine gefunden` bei der URL)
- `unvollständig (von Gwen)` — nur ein Teil geschafft (sauber abgebrochen);
  im Chat/Log steht, bei welcher Frage Schluss war

## Feste Regeln

1. **Nur die `___`-Platzhalter ausfüllen.** Fragen, Antwortoptionen,
   Erklärungen, Überschriften, die Kurzanweisung am Dateianfang — nichts
   davon löschen, kürzen, umformulieren oder umsortieren. Auch offensichtliche
   Tippfehler im Fragentext stehen lassen (die App-Daten nutzen bewusst
   ae/oe/ue statt Umlauten in manchen Dateien — kein Fehler).
2. **Niemals Quellen, Normen, Paragraphen oder URLs erfinden.** Eine Quelle
   zählt nur, wenn sie in der Websuche dieser Session tatsächlich gefunden
   wurde — nicht aus dem Gedächtnis, nicht aus einer früheren eigenen
   Antwort.
3. **Im Frontmatter nur `status:` ändern.** Alle anderen Felder bleiben
   unangetastet; keine eigenen Felder hinzufügen.
4. **Jede Frage komplett abschließen**, bevor die nächste beginnt. Wenn der
   Kontext knapp wird: nach der zuletzt fertigen Frage sauber aufhören,
   `status: unvollständig (von Gwen)` setzen.

## Was danach passiert (Zuständigkeit Claude)

- `node tools/themenquiz-quellenpruefung/apply-results.cjs` liest alle
  Batches mit `status: geprüft (von Gwen)`, übernimmt bei jeder
  RICHTIG-Frage mit echter Quelle-URL die Felder `source`/`sourceUrl` in
  `src/assets/themenquiz/<topic>.json`, hakt den Batch in `Fortschritt.md`
  ab und listet FALSCH/UNSICHER-Fälle sowie verdächtige URLs gesondert auf.
- Claude prüft danach stichprobenartig (nicht bei jeder einzelnen Frage):
  öffnet einen Teil der neu eingetragenen Quelle-URLs wirklich, um
  fabrizierte/kaputte Links zu erkennen, und liest die Fragestellung gegen
  die eingetragene Quelle (passt die Quelle inhaltlich zur Frage?).
- FALSCH/UNSICHER-Fälle werden gesammelt dokumentiert, aber nicht
  automatisch in der App geändert — das ist eine separate Entscheidung.
