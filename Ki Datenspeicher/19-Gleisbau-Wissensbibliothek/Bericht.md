---
tags: [wissensbibliothek, bericht]
autor: Claude
datum: 2026-10-17
---

# Bericht: Recherche-Lauf Gleisbau-Wissensbibliothek (2026-10-16)

Auftrag: Vault zu einem Gleisbau-Gedächtnis ausbauen, mit Quellen, möglichst alle offiziell zugänglichen DB-Richtlinien;
Gwen soll ca. 2 Stunden im Netz recherchieren, Claude prüft. Aufbau: [[00-Index]], Bestand: [[Ist-Zustand]].

## Ergebnis in Zahlen

- **33 Themen** angelegt (A01–A14 Regelwerke, B01–B19 Fachthemen), davon **16 mit Gwen-Inhalt**, 17 noch leer
  (A06, A08, A10, A13, B03–B06, B08, B12–B19).
- Gwen-Rohfunde: ca. **220 Zeilen** mit ca. **107 verschiedenen URLs**; davon laut automatischem Check **ca. 46 (43 %) nicht
  erreichbar** (404/Abbruch) — Gwen bildet URLs nach dem Muster echter Seiten. Tote Links sind im Text mit
  „⚠️[URL nicht erreichbar]“ markiert, Details in `URL-Check/`.
- Der Lauf dauerte effektiv ca. 2 × 1 h (Lauf 2 und 3); Lauf 1 war wertlos (Modell mit 4096 Kontext, siehe unten).
  Im zweiten Durchgang kamen nur noch die A-Themen dran, B ab B03 wurde nie erfolgreich bearbeitet.

## Wichtigste verifizierte Erkenntnisse (Claude, mit Quellen)

Siehe [[Regelwerk-Zugang-verifiziert]] und [[Regelwerk-Verzeichnis]].

1. **Technische DB-Richtlinien (Ril 800 ff., 804, 805, 809, 819, 836, 853, 892, 997) sind nicht frei downloadbar**, sondern über das Portal
   **Regelwerk@DB** bestellbar (seit 01.04.2025). Frei abrufbar sind nur betrieblich-technische / netzzugangsrelevante Richtlinien (INB).
   → „Alle Richtlinien im Vault“ ist weder rechtlich noch praktisch erreichbar; der Vault führt Metadaten + Zugangsweg.
2. **DGUV Vorschrift 77 (BG BAU) vs. 78 (Bund und Bahn / DB-Infrastruktur)** — App-Fragen, die 78 nennen, sind für BG-BAU-Betriebe zu präzisieren.
3. **EBO §§ 5–10** liefern die belegten Grundwerte (Spurweite 1435 mm, Überhöhung max. 180 mm, Gleisabstand etc.).
4. **Ril 800.0120 heißt „Weichen und Kreuzungen“**, nicht „Gleisgeometrie“ (Fehler im Themenentwurf, korrigiert).
5. Oberbau-Reihe 820/821/823/824: Titel nur aus Sekundärquellen, kein DB-Beleg gefunden.

## Qualität von Gwen (Stichproben)

- Brauchbar als **Suchhilfe** (Fundstellen wie ED-Münster-Archiv, EBA/EiTB-Seiten, Hersteller), nicht als Beleg.
- Fehlerbilder: erfundene DB-URLs (404), Klassifizierungsfehler (Wikipedia als „A“), vage Quellen („Springer Fachbuch“), Dopplungen
  (Wiederholungsläufe haben Einträge angehängt), kaputte Zeichen („f黵“), falsche Zuordnung („FIS“ als DB-Portal).
- **Technik:** (a) Modell fällt mitten im Lauf auf n_ctx 4096 zurück → Fix: `run-recherche.cjs` prüft vor **jedem** Versuch Identifier+Kontext;
  (b) Jinja-Template-Absturz beim `editor`-Tool-Aufruf (`Cannot apply filter "string" to type: NullValue`) – häufigster Ausfallgrund, nur durch Wiederholung umgehbar;
  (c) Schnellfehlschlag-Schutz ergänzt. Ausbeute ca. 40–50 % der Versuche.

## Empfehlungen / Nächste Schritte

1. Rohfunde nicht ungeprüft in die App übernehmen; Kandidaten: A12 (28 Einträge Normen) und A11 (EBO) gezielt gegenprüfen.
2. Restliche 17 Themen in einem weiteren Lauf (`node tools/wissensbibliothek/run-recherche.cjs --minutes 90`; `state.json` für Fehlschläge `tries` auf 0).
3. Kosten/Voraussetzungen Regelwerk@DB beim Kundenservice klären (dzd-bestellservice@deutschebahn.com).
4. Quiz-Fragen mit DGUV 78 prüfen (siehe oben).
5. Für Gwen-Qualität: Jinja-Bug evtl. durch neuere LM-Studio-Version/anderes Chat-Template (lmstudio-community-Build) beheben.
