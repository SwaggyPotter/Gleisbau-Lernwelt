---
tags: [fragen-generierung, gwen, anweisung]
autor: Claude
---

# Fragen-Generierung — Anweisung für Gwen

## Worum es geht

Tim will die 10 Gleisbau-Wissenstests der App ausbauen (aktuell nur 5–10
Fragen pro Thema). Gwen recherchiert pro Thema per Websuche und erstellt
**15–25 neue Quizfragen mit Quellenbeleg**. Claude prüft Stichproben und
arbeitet die Fragen per Skript in die App ein.

## Aufbau dieses Ordners

- **`Auftrag-<thema>.md`** — je Thema eine Auftrags-Datei mit: bestehenden
  Fragen (Duplikat-Sperre), Format-Vorlage und dem Abschnitt "Neue Fragen
  von Gwen", in den Gwen ausschließlich schreibt.
- **`Chat-Prompt.md`** — Text für den Session-Start (Tim setzt den
  Auftrags-Dateinamen ein).
- Ein Auftrag (= ein Thema) pro Chat-Session.

## Regeln (Kurzfassung — Details stehen im Chat-Prompt)

1. **Jede Frage braucht eine echte Quelle**, die in DERSELBEN Session per
   Websuche gefunden wurde (URL oder exakte Norm-/Regelwerksbezeichnung).
   Keine Quelle → Frage weglassen. Niemals Normen erfinden.
2. **Nur unter "Neue Fragen von Gwen" anfügen** — nichts anderes in der
   Datei ändern (außer `status:` im Frontmatter am Ende).
3. **Exakt das Block-Format einhalten** (`### Neue Frage N`, dann
   `- Frage:` / `- A:` … `- Quelle:`) — das Einarbeitungs-Skript liest die
   Blöcke maschinell; Abweichungen = Frage wird verworfen.
4. **Keine Duplikate** der gelisteten vorhandenen Fragen; 4 Optionen,
   genau eine richtig, Falschantworten plausibel, aber eindeutig falsch.
5. Normales Deutsch mit Umlauten (die Themenquiz-Dateien nutzen Umlaute).
6. Fragen einzeln komplett fertigstellen; bei knappem Kontext sauber
   aufhören und `status: unvollständig (von Gwen)` setzen.

## Ablauf danach (Claude/Tim)

- `node tools/fragen-generierung/einarbeiten.cjs` — Prüfbericht (validiert
  Format, Duplikate, Pflichtfelder; schreibt nichts).
- Claude prüft Quellen-Stichproben wie bei der Gesamtquiz-Prüfung.
- `... --merge` arbeitet gültige Fragen in `src/assets/themenquiz/*.json`
  ein (IDs `<thema>-gN`), aktualisiert `topics.json`; die `questionCount`-
  Werte in `dashboard.page.ts` zieht Claude nach.
- Status-Werte im Frontmatter: `offen` → `fertig (von Gwen)` →
  (nach Merge, setzt Claude) `eingearbeitet`.

Verwandt: [[10-Gesamtquiz-Pruefung/00-Anweisung-für-Gwen]] — die parallel
laufende Prüfung der 427 Lernfeld-Fragen (Batches 04–43 noch offen).
