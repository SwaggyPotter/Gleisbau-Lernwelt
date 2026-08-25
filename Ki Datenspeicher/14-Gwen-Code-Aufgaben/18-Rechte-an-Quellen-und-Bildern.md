---
tags: [rechte, lizenzen, quellen, bilder, urheberrecht]
autor: Claude
status: abgeschlossen (2026-08-25)
---

# Runde 18 — Rechte an Quellen und Bildern

Umsetzung des in [[17-Rechte-Recherche-Auftrag]] vorbereiteten Auftrags, in
derselben Session direkt bearbeitet (kein Sessionwechsel nötig). Tim wollte
wissen: darf er die 645 externen Quellen-Links (Link + eigener Kurztext) der
Themenquiz-Fragen rechtlich unbedenklich nutzen, und stimmen die
dokumentierten Wikimedia-Commons-Bildlizenzen noch? Explizit **kein**
Anwaltsersatz — nur eine sorgfältige, aber begrenzte KI-Einschätzung, die
Tim selbst noch prüft.

Scope bewusst eng gehalten (Tims Vorgabe): nur die 645 neuen Quellen-Links
prüfen, nicht die ursprünglichen Fragetexte/Erklärungen (liegen zeitlich vor
der Quellenprüfung aus Runde 15/16 und sind eine andere Baustelle).

## Schritt 1 — Domain-Liste

Regeneriert mit dem in Runde 17 vorgegebenen Node-Einzeiler: **258 einzigartige
Domains über alle 645 Quellen** (unverändert gegenüber Runde 17 — kein Fragen-
Update dazwischen). Top 10: de.wikipedia.org (117), trackopedia.com (53),
baunetzwissen.de (24), dguv.de (22), gesetze-im-internet.de (10), darda.de
(10), bgbau.de (9), uv-bund-bahn.de (8), publikationen.dguv.de (8),
technology.plassertheurer.com (7).

## Schritt 2 — Rechtliche Einordnung

### Grundprinzip

Die App verlinkt ausschließlich + schreibt einen eigenen Kurztext — nie ein
wörtliches Volltext-Zitat. Das ist die rechtlich sicherste Kombination:

- **Reines Verlinken ist keine "öffentliche Wiedergabe"**, wenn die Zielseite
  den Inhalt frei und mit Zustimmung des Rechteinhabers zugänglich macht
  (EuGH "Svensson", C-466/12). Nur bei Links auf erkennbar rechtswidrig
  veröffentlichte Inhalte kann das anders liegen (EuGH "GS Media", C-160/15)
  — dafür gab es bei keiner der 645 Quellen einen Anhaltspunkt.
- **Fakten selbst sind nicht urheberrechtlich geschützt** (§ 2 UrhG schützt
  nur die konkrete sprachliche/gestalterische Ausdrucksform). Eine
  Tatsachenbehauptung in eigenen Worten wiederzugeben, übernimmt keine
  geschützte Formulierung.
- **Titel-/Begriffsnennungen als Quellenangabe** (z. B. "Wikipedia, Artikel
  Stopfen (Gleisbau)") sind reiner Herkunftsnachweis, keine Textübernahme.
- **Amtliche Werke** (Gesetze, Verordnungen wie die EBO) sind nach § 5 Abs. 1
  UrhG gemeinfrei — unabhängig davon, ob sie auf einem offiziellen Portal
  oder einer privaten Gesetzesdatenbank stehen.

### Domain-Kategorien (alle 258 Domains kategorisiert)

| Kategorie | Domains | Verwendungen | Einordnung |
|---|---|---|---|
| Wikipedia | 1 | 117 | CC BY-SA 4.0; da nie wörtlich übernommen, keine Lizenzpflicht relevant |
| Amtliche Gesetzestexte/Rechtsdatenbanken | 10 | 29 | § 5 UrhG, gemeinfrei (auch bei privaten Datenbanken wie buzer.de/dejure.org) |
| Öffentliche Stellen, BGs, Hochschulen | 36 | 104 | Körperschaften öffentl. Rechts; Genehmigungspflicht ihrer ToS betrifft Content-Übernahme, nicht Verlinken |
| Bahnnahe Unternehmen (DB-Konzern) | 3 | 7 | privat, aber öffentlicher Informationsauftrag; wie kommerzielle Fachseiten behandelt |
| Kommerzielle Fachlexika/Wissensportale | 14 | 99 | Standard-ToS (kein Kopieren ohne Genehmigung), keine Linkverbote gefunden |
| Herstellerseiten (Bahntechnik/Bau) | 58 | 124 | Produktseiten, Markenschutz-Hinweise, keine Linkverbote gefunden |
| Kleine Fachseiten/Foren/Ratgeber/Einzelbetriebe | 136 | 165 | größte Gruppe (>150 Domains mit 1–3 Verwendungen), keine Einzelprüfung praktikabel |

Details, Beispiel-Domains je Kategorie und die zehn Top-Domains einzeln
begründet: siehe die neue Seite `/rechte` (Inhalte liegen als Konstanten in
`src/app/rechte/rechte.page.ts`, nicht als separate JSON — reiner
Report-Charakter, keine wiederverwendeten Rohdaten).

### Stichproben-Recherche (Impressum/Nutzungsbedingungen)

Per WebFetch geprüft: trackopedia.com, baunetzwissen.de, dguv.de, darda.de,
bgbau.de, technology.plassertheurer.com, voestalpine.com,
gesetze-im-internet.de, uv-bund-bahn.de (alle Top-10-Domains bis auf
publikationen.dguv.de, das die gleiche Einordnung wie dguv.de erhält) sowie
stichprobenartig lok-report.de, haufe.de und die drei Dokumenten-Plattformen
readkong.com/silo.tips/wikiteka.com. Kein einziger Fall mit explizitem
Link-/Zitierverbot gefunden. BG BAU verlangt für "Veröffentlichungen in
jeder Form" eine schriftliche Genehmigung — betrifft aber Content-Übernahme,
nicht das bloße Verlinken mit eigenem Begleittext (keine Vervielfältigung
ihrer Inhalte).

**Einzige auffällige Untergruppe**: drei Dokumenten-Upload-Plattformen
(de.readkong.com, silo.tips, de.wikiteka.com — je 1 Verwendung) hosten
nutzergenerierte PDF-Uploads unklarer Herkunft. Rechtliches Risiko für uns
als nicht-kommerzieller, reiner Verlinker ohne Kenntnis einer Rechtswidrigkeit
ist nach GS-Media-Maßstab sehr gering — aber die einzigen drei Links mit
einer gewissen Restunschärfe. Nicht geändert (kein konkretes Risiko, nur
generische Kategorie-Vorsicht), aber in der neuen Seite als Hinweis vermerkt.

## Schritt 2b — 35 riskante `source`-Texte umgeschrieben

Bei der Prüfung aller 645 `source`-Felder auf Anführungszeichen (Indikator
für Wortlaut-Übernahme statt eigener Formulierung) fanden sich 53 Treffer.
Nach Einzelprüfung: **18 waren bereits unproblematisch** (reine Titel-/
Begriffsnennungen wie `Wikipedia "Streckenklasse"` oder Zitate aus der EBO
selbst, § 5 UrhG gemeinfrei) und blieben unverändert. **35 enthielten
echten Wortlaut** — konkrete Produktspezifikationen, Definitionssätze oder
Marketingformulierungen, wörtlich aus der Zielseite übernommen (mehrere
davon zusätzlich sichtbar mitten im Satz abgeschnitten, ein Überbleibsel
der 90-Zeichen-Kürzung aus Runde 15). Betroffen v. a.: `voestalpine.com` (6),
`trackopedia.com` (6), `baunetzwissen.de` (5), `geodigital.de`/PDF-Quellen
(je 2), sowie neun weitere Einzelfälle.

Diese 35 wurden **direkt von Claude** umgeschrieben (nicht per Gwen-Dispatch
— bei nur 35 Fällen war Direktbearbeitung schneller und ohne
Fabrikationsrisiko möglich, siehe die in [[15-Themenquiz-Quellenpruefung]]
dokumentierten Gwen-Fehlerbilder). Muster: `<Quelle>, <Art des Inhalts>
(eigene Zusammenfassung[, Datum])` — z. B. `voestalpine Railway Systems,
Produktseite elastische Schienenbefestigung SKL (eigene Zusammenfassung)`
statt des vorherigen `voestalpine: "Federkraft ca. 12kN/Klemme`. Die
referenzierte Tatsache und der Link blieben unverändert, nur die Formulierung
wurde ersetzt. Per Skript umgesetzt (nicht einzeln per Edit-Tool, um
Übertragungsfehler bei Sonderzeichen auszuschließen), inkl. Vorher-Prüfung
je Frage-ID und `git diff --stat`-Kontrolle danach: exakt 35 Zeilen
geändert über 10 Dateien, keine Kollateralschäden.

## Schritt 3 — Bildrechte komplett neu verifiziert

Alle **25** Einträge in `src/assets/bilder/bildnachweise.json` (nicht 24 wie
in einer älteren Vault-Notiz beiläufig erwähnt — korrekt gezählt: 25) einzeln
per WebFetch auf der echten Wikimedia-Commons-Dateiseite neu geprüft (Autor,
Lizenzbox, Sondervermerke), sequenziell nacheinander (kein Rate-Limit-Problem
aufgetreten).

**Ergebnis: 24 von 25 vollständig bestätigt**, Lizenz und Urheber stimmen
exakt mit den gespeicherten Werten überein. Bemerkenswert: bei `lf05`
(Fachwerk_Abbund.jpg, Georg Hefter) verlangt der Urheber laut Commons-Seite
bei Internetnutzung eine Verlinkung seiner Homepage (georghefter.de) — das
war im bestehenden Credit-Text bereits korrekt berücksichtigt.

**1 Korrektur** (`handwerkzeuge`,
SOUTHERN_RAILWAY_RIGHT-OF-WAY_WORK_CREW…NARA_556898.jpg): bisheriger
Credit-Text nannte pauschal "US-Bundesbehörde (NARA)" als Urheber. Laut
Commons-Metadaten ist NARA (National Archives) nur die Archiv-Institution,
die das Bild verwahrt — tatsächlicher Fotograf ist Jim Pickerell, im
Auftrag der US-Umweltbehörde EPA aufgenommen. Der gemeinfreie Status
(US-Bundesbehördenwerk) ist davon unberührt und bestätigt, nur die
Namensnennung wurde präzisiert zu "Jim Pickerell für die US-Umweltbehörde
EPA (Bestand: National Archives, NARA), gemeinfrei".

## Schritt 4 — Neue Seite `/rechte`

Neues Top-Level-Modul `src/app/rechte/` (gleiche Ebene wie `bildnachweise/`
und `quellenverzeichnis/`, gleiches Streckenplan-Design/Modul-Muster):

- `rechte.module.ts`, `rechte-routing.module.ts`, `rechte.page.ts`,
  `rechte.page.html`, `rechte.page.scss`.
- Route `rechte` in `app-routing.module.ts`, Footer-Link "Rechte an Quellen
  und Bildern" in `dashboard.page.html` (dritter Link neben Bildnachweise/
  Quellenverzeichnis — Footer-Flexbox dafür auf `flex-wrap: wrap` umgestellt,
  damit drei Links auf schmalen Bildschirmen sauber umbrechen).
- Inhalt: Grundprinzip-Erklärung (Svensson/GS-Media, § 5 UrhG, Schöpfungshöhe),
  die 7 Domain-Kategorien mit je 1-2 Sätzen Einordnung, die 10 häufigsten
  Domains einzeln, die Bildrechte-Neuverifikation (25 Einträge, Status-Chip
  bestätigt/korrigiert je Bild, Korrektur-Notiz beim einen auffälligen Fall),
  und ein gut sichtbarer Disclaimer-Kasten ("Keine Rechtsberatung").
  Domain-Kategorien/Top-10-Texte sind als TS-Konstanten im Component
  hinterlegt (reiner redaktioneller Report, kein wiederverwendbares
  Datenformat wie bei `topics.json`), die Bildliste lädt weiterhin live aus
  `bildnachweise.json` plus einer kleinen Verifikations-Notiz-Map im Component.

Alles von Claude direkt geschrieben (kein Gwen-Auftrag, architektursensitive
UI-Arbeit — passt zur etablierten Projekt-Regel).

## Verifikation

- `ng build --configuration production`: grün, eigener Chunk
  `rechte-rechte-module` im Build-Output bestätigt (23.05 kB).
- Playwright/Browser-Automation: `/rechte` lädt ohne Konsolenfehler, zeigt
  alle 7 Kategorien, alle 10 Top-Domains, alle 25 Bildeinträge (24× "bestätigt",
  1× "korrigiert", per DOM-Query gezählt). Footer-Link auf `/dashboard`
  vorhanden, Klick navigiert korrekt zu `/rechte`.
- `git diff --stat` nach den 35 Quellen-Umschreibungen: exakt 35 Zeilen in
  10 Dateien geändert (1 Zeile pro Frage), keine unbeabsichtigten
  Nebenwirkungen.
- Ein kleiner eigener Tippfehler beim ersten Rendern gefunden und behoben:
  "Original-\nseite" (Zeilenumbruch im HTML-Quelltext, wurde als
  "Original- seite" mit sichtbarem Leerzeichen gerendert) → "Originalseite".

## Nebenfund (bewusst nicht behoben, siehe Offene-Punkte)

Einige `source`-Felder (auch außerhalb der 35 umgeschriebenen) enden sichtbar
mitten im Wort/Satz mit "…" — ein Überbleibsel der 90-Zeichen-Kürzung aus
Runde 15, die gelegentlich nicht an einer Wortgrenze schneidet. Kein
Rechtsrisiko, außerhalb des Scopes dieser Runde (Scope war explizit auf
Rechtsprüfung begrenzt), aber in [[../07-Offene-Punkte/Offene-Punkte]]
vermerkt.
