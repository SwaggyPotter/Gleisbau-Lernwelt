---
tags: [gesamtquiz, pruefung, gwen, anweisung]
autor: Claude
---

# Gesamtquiz-Prüfung — Anweisung für Gwen

## Worum es geht

Das Gesamtquiz der App enthält **427 Fragen** (Quelle:
`src/assets/zusatz/gesamtquiz/gesamtquiz-alle-module.json`). Sie stammen aus
den alten Lernfeld-Inhalten und wurden **nie systematisch fachlich geprüft**.
Tim hat am 2026-07-23 entschieden: Gwen prüft alle Fragen per Websuche und
belegt jedes Urteil mit einer Quelle. Claude wertet die Ergebnisse danach aus
und korrigiert bestätigte Fehler in den App-Daten.

## Aufbau dieses Ordners

- **`Batch-01.md` … `Batch-43.md`** — je 10 Fragen (der letzte Batch 7),
  in der Reihenfolge der App-Datei (LF01 → LF14). Jede Frage steht mit allen
  Antwortoptionen, der laut App richtigen Antwort und der App-Erklärung in
  der Datei — Gwen muss **keine andere Datei öffnen**.
- **`Chat-Prompt.md`** — der Text, den Tim zu Beginn jeder Session in den
  Chat einfügt (mit eingesetzter Batch-Nummer).
- **`Fortschritt.md`** — Abhak-Liste für Tim/Claude. **Gwen bearbeitet diese
  Datei nicht.**
- Diese Datei — ausführliche Referenz. Der Chat-Prompt enthält alle Regeln
  in Kurzform; diese Datei muss Gwen nicht zwingend lesen (spart Kontext).

## Arbeitsweise: pro Chat-Session genau EIN Batch

**Update 2026-07-26:** Gwen läuft jetzt auf `qwen/qwen3.5-9b` mit
**65.536 Token Kontext** (vorher `qwen3.6-27b` mit nur ~17k — daher stammte
das alte Limit). Die Ein-Batch-Regel bleibt trotzdem vorerst bestehen:
kleine Arbeitspakete begrenzen den Schaden, falls etwas schiefgeht. Nach
einigen sauber abgeschlossenen Batches kann auf 2–3 Batches pro Session
erhöht werden.

Ursprüngliche Begründung: Gwens Kontextlimit lag bei ca. 16.000–17.000
Token. In früheren Recherche-Runden sind Antworten mehrfach ohne Warnung
mitten im Wort abgebrochen und haben Dateien beschädigt. Deshalb:

1. Tim startet eine neue Chat-Session und fügt den Text aus
   [[Chat-Prompt]] ein, mit der Nummer des nächsten offenen Batches.
2. Gwen öffnet **nur** diese eine Batch-Datei und arbeitet die Fragen
   **in Reihenfolge** ab, jede Frage komplett, bevor die nächste beginnt.
3. Pro Frage: Websuche → die drei `___`-Platzhalter unter "Prüfung (Gwen)"
   ausfüllen (Urteil, Begründung, Quelle).
4. Am Ende `status:` im Frontmatter setzen (siehe unten), dann **aufhören**
   — kein zweiter Batch in derselben Session, auch wenn noch "Luft" scheint.

## Bedeutung der drei Felder

- **Urteil:**
  - `RICHTIG` — die markierte Antwort stimmt fachlich, eine gefundene Quelle
    stützt das.
  - `FALSCH` — die markierte Antwort ist fachlich falsch oder eine andere
    Option wäre die richtige. In der Begründung angeben, was stattdessen
    richtig ist — mit Quelle.
  - `UNSICHER` — keine verlässliche Quelle gefunden oder Quellen
    widersprechen sich. Das ist ein völlig legitimes Ergebnis und besser
    als raten.
- **Begründung:** 1–2 Sätze reichen. Auch Fehler in der App-*Erklärung*
  (nicht nur der Antwort) hier vermerken.
- **Quelle:** URL oder exakte Norm-/Regelwerksbezeichnung (z. B.
  "DIN EN 13481-2", "EBO § 6", "DGUV Regel 101-024"). Wenn nichts gefunden:
  wörtlich `keine gefunden` eintragen.

## Status-Werte im Frontmatter der Batch-Datei

- `offen` — noch nicht bearbeitet
- `geprüft (von Gwen)` — alle Fragen des Batches haben ein Urteil + Quelle
- `unvollständig (von Gwen)` — nur ein Teil geschafft (sauber abgebrochen);
  im Chat steht, bei welcher Frage Schluss war

## Feste Regeln (aus den Erfahrungen der Recherche-Runden)

1. **Nur die `___`-Platzhalter ausfüllen.** Fragen, Antwortoptionen,
   Erklärungen, Überschriften, die Kurzanweisung am Dateianfang — nichts
   davon löschen, kürzen, umformulieren oder umsortieren. Auch offensichtliche
   Tippfehler im Fragentext stehen lassen (die App-Daten nutzen bewusst
   ae/oe/ue statt Umlauten — das ist kein Fehler).
2. **Niemals Quellen, Normen oder Paragraphen erfinden.** In früheren Runden
   wurden nicht existierende Regelwerke genannt (z. B. "RBT 9000",
   "DIN EN 14629" statt korrekt DIN EN 14730). Eine Quelle zählt nur, wenn
   sie in der Websuche dieser Session tatsächlich gefunden wurde — nicht aus
   dem Gedächtnis, nicht aus einer früheren eigenen Antwort.
3. **Im Frontmatter nur `status:` ändern.** `autor: Claude` und alle anderen
   Felder bleiben unangetastet; keine eigenen Felder hinzufügen.
4. **Jede Frage komplett abschließen**, bevor die nächste beginnt. Wenn der
   Kontext knapp wird: nach der zuletzt fertigen Frage sauber aufhören,
   `status: unvollständig (von Gwen)` setzen, im Chat die letzte geprüfte
   Frage nennen. Ein sauberer Teil-Stand ist besser als ein Abbruch mitten
   im Satz.
5. **Vor dem Speichern die eigenen Einträge einmal durchlesen** — in
   früheren Runden landeten vereinzelt fremdsprachige Wörter/Schriftzeichen
   mitten im deutschen Text.

## Was danach passiert (Zuständigkeit Claude/Tim)

- Claude liest die Urteile per Skript aus allen Batch-Dateien aus
  (token-günstig, kein manuelles Durchlesen nötig).
- Alle `FALSCH`- und `UNSICHER`-Fälle prüft Claude selbst per Websuche nach.
- Bestätigte Fehler werden in
  `src/assets/zusatz/gesamtquiz/gesamtquiz-alle-module.json` korrigiert und
  im [[05-Update-Log/Update-Log]] vermerkt.
- [[Fortschritt]] wird von Tim/Claude abgehakt, sobald ein Batch geprüft
  **und** gegengelesen ist.
