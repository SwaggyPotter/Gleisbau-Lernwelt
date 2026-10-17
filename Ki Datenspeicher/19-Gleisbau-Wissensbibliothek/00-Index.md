---
tags: [wissensbibliothek, index, meta]
autor: Claude
---

# Gleisbau-Wissensbibliothek — Index

**Auftrag von Tim (2026-10-16):** Der Vault soll zusätzlich zur Projektdokumentation ein
**Gleisbau-Gedächtnis** werden: recherchiertes Fachwissen zu allem, was den Gleisbau betrifft,
inkl. möglichst aller **offiziell zugänglichen DB-Richtlinien**, jeweils mit Quellenangabe.
Schwache Quellen (Blog, Forum, Wikipedia) sind erlaubt, müssen aber mindestens mit Link
und Klassifizierung markiert sein. Spätere KI-Sessions (Claude und andere) sollen daraus
Material ziehen können.

## Aufbau

| Ordner/Datei | Inhalt |
|---|---|
| `Themen/` | Je Thema eine Datei (A = Regelwerke, B = Fachthemen). Fragen von Claude, Rohfunde von Gwen. |
| `URL-Check/` | Automatische Erreichbarkeitsprüfung aller von Gwen genannten URLs (je Thema). |
| `Fortschritt.md` | Laufende Statustabelle des Recherche-Laufs. |
| `Ist-Zustand.md` | Was der Vault und die App bisher an Gleisbau-Wissen enthalten, und wo die Lücken sind. |
| `Regelwerk-Verzeichnis.md` | Von Claude geprüftes Verzeichnis der Richtlinien/Normen (entsteht nach der Verifikation). |
| `Bericht.md` | Ausführlicher Abschlussbericht des Recherche-Laufs. |

## Quellenklassen

- **A** — amtlich/offiziell: DB InfraGO, EBA, Gesetze (gesetze-im-internet.de), DGUV, Normungsinstitute, EUR-Lex.
- **B** — Fach-/Herstellerquelle: Hersteller, Fachverbände, Fachbücher, Hochschulen.
- **C** — schwach: Wikipedia, Foren, Blogs. Nur mit Link, nie als alleiniger Beleg für Zahlen.

## Verifikationsstufen eines Eintrags

1. **Rohfund (Gwen)** — Zeile in `🔎 Rechercheergebnisse von Gwen`. Gwen hat nachweislich erfundene Domains,
   Normen und Dopplungen geliefert ([[00-Start-Hier]], „Gwen/Qwen“).
2. **URL erreichbar** — automatisch geprüft (`URL-Check/`). Erreichbar ≠ inhaltlich richtig.
3. **Von Claude gegengeprüft** — Stichprobe/Vollprüfung per eigener Websuche; Ergebnis im
   `Regelwerk-Verzeichnis` bzw. `Bericht`.

## Rechtlicher Hinweis

DB-Richtlinien sind urheberrechtlich geschützt, auch wenn sie online einsehbar sind. Der Vault speichert
deshalb **Metadaten, eigene Zusammenfassungen und Links** — keine Volltext-Kopien. Siehe auch
Thema [[Themen/A01-Regelwerk-Zugang-DB-InfraGO]].

## Verwandt

[[00-Start-Hier]] · [[08-Recherche-Gwen/00-Rechercheauftrag-für-Gwen]] · [[18-Bildbedarf-Gleisbau/00-Rechercheauftrag-Bildbedarf]]
