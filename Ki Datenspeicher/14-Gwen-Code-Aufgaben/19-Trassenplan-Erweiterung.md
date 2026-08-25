---
tags: [trassenplan, schwierigkeitsgrade, gwen-code-auftrag]
autor: Claude
status: laufend (Session von Tim unterbrochen, wird autonom fortgesetzt)
---

# Runde 19 — Trassenplan-Thema ausgeweitet: Beispielplan-Recherche, Schwierigkeitsgrade, neue Fragen, eigenes Bild

Tim wollte (2026-08-25) das Thema "Trassenplan lesen" deutlich ausbauen:
1. Groß angelegte Recherche nach echten Gleisbau-Trassenplänen/Lageplänen
   mit Erklärungen — Cline/Gwen sollte den Großteil der Suche übernehmen
   und nur Kandidaten-Links bereitlegen, Claude sollte sie öffnen und
   bewerten.
2. Während einer laufenden Abwesenheit (Tim unterwegs) zusätzlich:
   Fragen nach Schwierigkeitsgrad (einfach/mittel/schwer/profi)
   einteilen, den Fragenpool erweitern, wenn möglich Bilder für Fragen
   finden (mit Rechteprüfung, kommerziell nutzbar) oder selbst erstellen,
   und dabei weiterhin so viel wie möglich an Cline delegieren.

## Teil 1 — Beispielplan-Recherche (Cline/Gwen)

Neuer Ordner `16-Trassenplan-Ausbau/` mit 5 Batch-Dateien à 5
Suchrichtungen (25 insgesamt), analog zum bewährten
`08-Recherche-Gwen`-Muster, aber für offene Link-Sammlung statt
Fakten-Verifikation:
- Batch 1: amtliche Planungsunterlagen (Planfeststellungsverfahren,
  Erläuterungsberichte, Bauwerksverzeichnisse, Großprojekte, DB InfraGO).
- Batch 2: Lehrmaterial/Hochschulen.
- Batch 3: Software-Dokumentation & Legenden.
- Batch 4: konkrete Bahn-Großprojekte (Stuttgart 21, Rastatt,
  Karlsruhe-Basel, Fehmarnbeltquerung, S-Bahn-Ausbau).
- Batch 5: ergänzende Quellen (Foren, Vereine, Abschlussarbeiten,
  Bürgerinformationen).

**Verschärfte Anti-Fabrikations-Regeln** gegenüber Runde 15 (siehe
achter Fallstrick in [[../00-Start-Hier]]): Pflicht-Selbsttest vor jeder
Antwort (Testsuche zuerst posten), explizites "keine gefunden" statt
Raten, expliziter Hinweis dass jeder Link per DNS/HTTP geprüft wird.
**Ergebnis: nur 5 von 77 gefundenen Links waren tot (404)** — eine der
saubersten Gwen-Recherchequoten bisher in diesem Projekt.

**Technische Fallstricke dieser Runde:**
- Wiederholte `Error rendering prompt with jinja template` Abstürze
  (LM-Studio-seitig, nicht Gwens Schuld) — Modell-Reload zwischendurch
  behoben.
- Batches wurden oft nur teilweise abgearbeitet (z. B. nur 1 von 5
  Suchrichtungen), erforderten gezielte Folge-Dispatches mit
  `--extra "Suchrichtung X ist erledigt, mach nur noch Y-Z"`.
- Ergebnisse wurden mehrfach doppelt/unsauber ins Dokument geschrieben
  (Platzhaltertext blieb stehen, Abschnitt wurde zweimal angehängt) —
  nicht bekämpft, sondern akzeptiert (wie in Runde 15: das GANZE
  Dokument nach URLs durchsucht statt auf sauberes Format zu vertrauen).
- `status:`-Frontmatter-Feld wurde trotz Anweisung nicht zuverlässig
  editiert (Gwen schrieb "status: von Gwen recherchiert" teils als
  Fließtext statt als Frontmatter-Änderung) — für diese Runde irrelevant,
  da alle 5 Batches ohnehin manuell nacheinander abgearbeitet wurden statt
  über Status-Tracking.

**Alle 77 gefundenen Kandidaten-URLs per HTTP-Statuscheck geprüft**
(Node-Skript, GET mit User-Agent, 15s Timeout) — nur 5 echte 404s. Die
vielversprechendsten Kandidaten zusätzlich per `pdftotext` inhaltlich
gegengeprüft (kein PDF-Rendering verfügbar in dieser Umgebung —
`pdftoppm`/Poppler fehlt, nur `pdftotext` vorhanden — visuelle
Layout-Prüfung der Pläne selbst war daher nicht möglich, nur der
Textinhalt). Volle Auswertung: [[../16-Trassenplan-Ausbau/01-Verifizierte-Quellen]].

**Wichtigster Fund**: das offizielle **Muster-Legendenheft des
Eisenbahn-Bundesamts** (Anhang III der Planfeststellungs-Antragsunterlagen)
— dokumentiert alle 19 Planarten in Bahn-Planfeststellungsverfahren mit
exakten Farbcodes/Linienarten. Zweitwichtigster Fund: eine TU-Dresden-
Übungsunterlage "Strecken- und Bahnhofsentwurf" mit echten Formeln und
Grenzwerten. Details siehe verlinkte Datei oben.

## Teil 2 — Schwierigkeitsgrade eingeführt

Neues optionales Feld `difficulty: 'einfach' | 'mittel' | 'schwer' |
'profi'` in `ThemenquizQuestion` (`themenquiz.models.ts`). Sichtbar als
farbiges Badge oben rechts in der Frage-Karte
(`quiz-engine.component.html/scss`, Farbe je nach Stufe an die
bestehenden `--sp-*`-Tokens angelehnt: Grün/Blau/Orange/Rot). Alle 23
bestehenden Trassenplan-Fragen wurden nach eigenem fachlichem Urteil
eingestuft (kein Gwen-Auftrag — Schwierigkeitseinschätzung ist eine
Bewertungsaufgabe, kein mechanischer Suchauftrag, deshalb direkt von
Claude vorgenommen). Bewusst **keine** volle "Schwierigkeit wählen"-
Filterfunktion gebaut — das wäre eine groessere UX-Entscheidung
(neuer Auswahl-Screen/Navigationsfluss), die Tim in diesem Projekt
bisher immer über konkrete Optionen mitentschieden hat (siehe
Streckenplan-Design-Wahl in [[../../projekt_grosses_ziel_2026-08-11]]);
das Badge allein ist eine sichere, jederzeit erweiterbare Zwischenlösung.

## Teil 3 — Fragenpool erweitert: 23 → 45 Fragen

22 neue Fragen (`trassenplan-n1` bis `n22`), alle mit echter Quelle
(Link + eigene Kurzformulierung, kein Wortlaut-Zitat — konsistent mit
[[18-Rechte-an-Quellen-und-Bildern]]), gespeist aus den drei
Top-Funden aus Teil 1: EBA-Legendenheft (8 Fragen), TU-Dresden-
Übungsunterlage (7 Fragen), Leitfaden Trassierung (3 Fragen). Jede
Zahl/jeder Fachbegriff wurde von Claude selbst per `pdftotext` aus dem
Original-PDF gelesen, nicht von Gwen übernommen — bei mehrspaltigen
Tabellen (z. B. Farbzuordnung einzelner Symbole im Lageplan) wurde
bewusst nur verwendet, was beim Text-Extrahieren eindeutig blieb
(z. B. die dreifach wiederholte Bestand/Neubau/Rückbau-Farbfolge), um
keine falsch zugeordneten Tabellenspalten in Fragen zu übernehmen.

Vier weitere Fragen (`n19`–`n22`) kamen aus zwei zusätzlich ausgewerteten
Quellen aus der "noch nicht verwendet"-Liste: der Fehmarnbelt-
Schienenanbindung-Präsentation (Farbcodierung "Lila" für nicht
realisierte Planung, Definition Bauwerksverzeichnis) und einer TU-Graz-
Diplomarbeit 2024 zur Trassierung (Bahnachse-Definition, statische vs.
dynamische Trassierungsvariablen).

Neue Schwierigkeitsverteilung nach Erweiterung: einfach 10, mittel 17,
schwer 11, profi 7 (vorher: einfach 9, mittel 9, schwer 5, profi 0 —
die Profi-Stufe existierte vorher gar nicht in befüllter Form).

`topics.json`: `questionCount` für `trassenplan` von 23 auf 45 aktualisiert.

## Teil 4 — Bild statt Fremdlizenz: eigene SVG-Grafik

Keine der gefundenen echten Trassenpläne hat eine eindeutig freie,
auch-kommerziell-nutzbare Lizenz (siehe Bildrechte-Einschätzung in
[[../16-Trassenplan-Ausbau/01-Verifizierte-Quellen]]) — eine
Bildübernahme wäre anders als das bloße Verlinken eine echte
Vervielfältigung. Deshalb: neue, komplett selbst gezeichnete SVG-Grafik
`src/assets/bilder/trassenplan-legende-bnr.svg` (Bestand/Neubau-
Änderung/Rückbau-Farblegende mit RGB-Werten, im bestehenden
Streckenplan-Stil, gleiche Fonts/Palette wie `trassenplan-diagramm.svg`
aus einer früheren Runde). Neues optionales Feld `image?: string` in
`ThemenquizQuestion`, gerendert in `quiz-engine.component.html` oberhalb
der Antwortoptionen. Verknüpft mit den drei Fragen, die die
Bestand/Neubau/Rückbau-Farbcodierung behandeln (`trassenplan-n1`, `n2`,
`n17`).

## Verifikation (Stand: mitten in der Runde, wird fortgesetzt)

- `ng build --configuration production`: grün nach Schema-Änderung,
  grün nach den 18 neuen Fragen, grün nach dem Bild-Feature.
- Playwright/Browser-Automation: `/themenquiz/trassenplan` zeigt 41
  Fragen, Schwierigkeits-Badges rendern korrekt (Stichprobe über 15
  Fragen: alle vier Stufen aufgetreten), Quellen-Links weiterhin
  vorhanden, neue SVG-Grafik lädt (naturalWidth 500, kein Broken-Image)
  bei den drei verknüpften Fragen, keine Konsolenfehler.
- Alle 77 recherchierten URLs per HTTP-Check geprüft (72 leben, 5 tot).

## Bewusste Abgrenzung von Gwen/Claude-Anteilen in dieser Runde

Wie von Tim gewünscht ("so viel wie möglich CLINE geben") hat Gwen die
komplette, zeitaufwendige Suche (25 Suchrichtungen über 5 Batches)
übernommen. Die Auswahl/Verifikation der 18 neuen Fragen (Faktenprüfung
per PDF-Volltext, Schwierigkeitseinschätzung, Formulierung) hat Claude
bewusst selbst gemacht statt an Gwen zu delegieren: bei nur 18 präzise
zu formulierenden Fragen mit Zahlenwerten aus mehrspaltigen PDF-Tabellen
wäre ein Gwen-Dispatch (mit Verifikationsaufwand hinterher) nicht
schneller gewesen als die direkte Bearbeitung, und das Risiko von
Zahlendrehern/Tabellen-Fehlzuordnungen (siehe dokumentierte
Gwen-Fehlerbilder) ist bei technischen Grenzwerten besonders kritisch.

## Offen / nächste Schritte

- Weitere der in Teil 1 identifizierten, noch nicht ausgewerteten
  Kandidaten (HS-Karlsruhe-Abschlussarbeit, Basel-Stadt-Lageplan mit
  Bohrpunkt-Legende, EBA-Planfeststellungsbeschlüsse Rastatt/Schliengen)
  könnten eine weitere Erweiterungsrunde liefern. Fehmarnbelt-
  Präsentation und TU-Graz-Diplomarbeit wurden bereits ausgewertet
  (siehe Teil 3).
- Volle "Schwierigkeit wählen"-Filterfunktion in der UI ist eine
  offene Design-Entscheidung für Tim (siehe Teil 2).
- Denkbare weitere Bild-Erweiterungen (z. B. eigene SVG zur
  Weichenbezeichnung "EW 60-300-1:9" oder zum Höhenplan-
  Neigungsbrechpunkt) sind vorbereitet (Quellenmaterial vorhanden),
  aber aus Zeitgründen in dieser Runde nicht mehr umgesetzt.
