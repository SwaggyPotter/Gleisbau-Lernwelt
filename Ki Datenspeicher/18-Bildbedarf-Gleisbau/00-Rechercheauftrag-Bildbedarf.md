---
tags: [recherche, bildbedarf, protokoll]
autor: Claude
status: laufend
---

# Rechercheauftrag: Bildbedarf Gleisbau (2026-10-02)

**Auftrag von Tim:** Mit Gwen recherchieren, was es im Gleisbau alles gibt und
was fürs Quiz relevant ist; daraus eine Liste, wofür wir Bilder brauchen
(Beispiele von Tim: Klemmplatte, Kpo 9, Kpo 6, Spannklemme, Skl 12, Skl 1,
Usk …) und wovon wir noch keine Bilder haben. Tim lieferte parallel eigene
Fotos (Gelände mit Schienenbefestigungsmitteln, Schwellen u. a.), die Claude
einkategorisiert; bei Unklarheit fragt Claude nach.

## Ablauf

1. Gwen recherchiert 4 Themenblöcke (Dateien 01–04), eine Datei pro Lauf.
2. Claude prüft die Ergebnisse (Gwen halluziniert gelegentlich Bezeichnungen) und
   verifiziert per Websuche.
3. Claude gleicht gegen vorhandene Bilder ab (`src/assets/bilder`,
   `12-Bildmaterial`, `17-Bilder-fuer-Fragen`) und Tims neue Fotos.
4. Ergebnis: [[10-Bildbedarf-Liste]] (fehlende Bilder, priorisiert) und
   [[20-Foto-Inventar-Tim]] (Tims Fotos, kategorisiert).

## Blöcke

- [[01-Oberbau-Befestigung]]
- [[02-Schwellen-Schienen-Weichen]]
- [[03-Bettung-Unterbau-Gleisgeometrie]]
- [[04-Maschinen-Werkzeuge-Messen-Sicherung]]

## Protokoll

- 2026-10-02: Aufträge angelegt, Gwen noch nicht gestartet.
- 2026-10-02: Gwen-Block 01 (Frage 1) lief nach 2 Jinja-Abstürzen im dritten Versuch durch; Ergebnis enthält Duplikate und Einträge "nicht sicher ermittelt" -> noch von Claude zu prüfen. Blöcke 02-04 noch nicht gestartet.
- 2026-10-02: Tim schickte 39 Fotos im Chat (F001-F039, siehe [[20-Foto-Inventar-Tim]]).
- 2026-10-02: Bilder-Verwaltung gebaut (Webseite /konto/bilder, nur Admin): Foto-Upload vom Handy, Behalten/Entfernen/Unsicher, Kategorie, Notiz, Löschen. Daten liegen im Backend (Tabellen `photos`, `image_reviews`), Claude liest sie über /api/image-reviews und /api/photos. **Deployment steht aus** (Auto-Mode blockiert): `tools/bilder-verwaltung/deploy-bilder-verwaltung.cmd` von Tim ausführen.
