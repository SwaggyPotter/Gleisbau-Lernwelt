---
tags: [recherche, auftrag, gwen, kickoff-prompt]
autor: Claude
---

# Erweiterter Auftrag für Gwen (ab 2026-08-11)

Ergänzt [[00-Rechercheauftrag-für-Gwen]] und [[Kickoff-Prompt]] (Version 4) —
**alle dortigen Regeln gelten unverändert weiter** (nur ergänzen, keine
erfundenen Normen, ein Thema pro Session, Quellenpflicht). Dieser Auftrag
kommt aus Tims Gesamtvision für die App: eine große Wissens-Quiz-App mit
belegten Quellen, Bildern und Ausbildungsjahr-Struktur. Zwei Dinge davon
sind bereits erledigt und brauchen **keine** neue Recherche:

- Die **Lehrjahr-Zuordnung** (1./2./3. Ausbildungsjahr) existiert bereits
  für alle 14 Lernfelder, siehe [[../04-Lernfelder/Lernfelder-Übersicht]] —
  nicht neu recherchieren.
- Die **Zufalls-Quiz-Funktion** existiert bereits in der App (Fragen- und
  Antwortreihenfolge werden gemischt) — kein Auftrag hierzu.

## Neuer Auftragsteil 1: Quellen-Feld für die App (nicht nur den Vault)

Die App hat jetzt ein optionales `source`/`sourceUrl`-Feld pro Frage, das
direkt in der App angezeigt wird (nicht nur im Vault-Callout). Wenn du ab
jetzt eine Frage recherchierst, gib am Ende deines Eintrags **zusätzlich**
eine Zeile in diesem Format an, damit Claude sie leicht ins JSON übernehmen
kann:

```
Für App-JSON: source: "DIN EN 13481-2", sourceUrl: "https://..."
```

Wenn keine belastbare Quell-URL existiert (z. B. nur Buchtitel), reicht
`source` allein — `sourceUrl` weglassen, nicht erfinden.

## Neuer Auftragsteil 2: Bild-Recherche (gleicher Lizenz-Rahmen wie bisher)

Für die 10 Themenquiz-Themen + Dashboard-Header + Materialrechner ist die
Bild-Recherche bereits fertig (siehe [[../12-Bildmaterial/00-Bildkandidaten]],
inzwischen in die App eingebaut). **Noch offen:** passende Bilder für die
14 Lernfelder (`lf01`…`lf14`, siehe [[../04-Lernfelder/Lernfelder-Übersicht]]
für die Themen) und die drei Zusatzmodule (Nivellieren, Volumen,
Prozentrechnung).

**Lizenz-Rahmen (identisch zur letzten Bild-Recherche):** Nutzungskontext ist
beruflich/Ausbildung, nicht gewinnbringend. Erlaubt: CC0/Public Domain,
CC BY/BY-SA (mit Namensnennung), CC BY-NC. Bevorzugte Quelle: **Wikimedia
Commons** — Lizenz immer über die strukturierten Metadaten der Dateiseite
prüfen (Lizenzbox oben rechts auf der Commons-Dateiseite), nicht raten.
Bezahlte Stock-Bibliotheken (Getty, Shutterstock, Adobe Stock) sind
ausgeschlossen.

**Pro Bild dokumentieren** (gleiches Format wie in
[[../12-Bildmaterial/00-Bildkandidaten]]):
- Commons-Dateiseiten-Link
- Lizenz (exakt, inkl. Version)
- Namensnennungs-Text (Fotograf/in + Lizenz)
- Kurze Begründung, warum das Bild zum Thema passt

Trag neue Bildkandidaten in eine neue Datei
`12-Bildmaterial/01-Bildkandidaten-Lernfelder.md` ein (gleiches
Tabellenformat wie die bestehende Datei) — nicht die bestehende Datei
verändern, nur ergänzen bzw. eine neue anlegen.

## Wie dieser Auftrag jetzt ausgeführt wird

Seit 2026-08-11 kann Claude dich zusätzlich **headless per Kommandozeile**
ansteuern (nicht nur über den VS-Code-Chat), über
`tools/cline-cli/run-gwen-task.cjs` — das räumt automatisch auf und prüft
danach automatisch, ob dein Ergebnis strukturell in Ordnung ist (nichts
gelöscht, kein Absturz, kein offensichtlicher Satzabbruch). Für dich ändert
sich inhaltlich nichts an diesem Auftrag — nur dass Claude ihn dir
möglicherweise nicht mehr per Chat-Nachricht gibt, sondern automatisiert
anstößt. Die Regeln (nur ergänzen, Quellenpflicht, kein Raten) gelten
identisch.
