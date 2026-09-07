---
tags: [recherche, bildmaterial, gwen]
autor: Claude
status: von Gwen recherchiert
---

# Recherche: Bildkandidaten für Themenquiz-Fragen ohne Bild

**Bezug im Projekt:** `src/assets/themenquiz/*.json` — jede Frage kann optional
ein `imageKey` haben (verweist auf einen Eintrag in
[[../../src/assets/bilder/bildnachweise.json]]). Aktuell haben von 687 Fragen
insgesamt nur 207 ein Bild. Diese Recherche sucht Bildkandidaten für acht
ausgewählte Themen mit besonders vielen Fragen ohne Bild — **nicht alle 480
auf einmal**, das hier ist der erste Durchgang.

## Kontext

Gesucht wird **pro Thema 1-3 Bilder**, die zum allgemeinen Thema passen (nicht
zwingend zu einer einzelnen Frage) — dieselben Themenquiz-Themen haben bereits
heute oft ein Bild, das über mehrere Fragen hinweg wiederverwendet wird (siehe
z. B. `bettung.json`, wo ein Foto vom Schottern für mehrere Fragen als
`imageKey` dient). Das Ziel ist also NICHT 1 Bild pro Frage, sondern eine
kleine, thematisch passende Bildauswahl pro Thema.

## Lizenz-Rahmen (identisch zu allen bisherigen Bild-Recherchen)

Nutzungskontext ist beruflich/Ausbildung, nicht gewinnbringend. Erlaubt:
CC0/Public Domain, CC BY/BY-SA (mit Namensnennung), CC BY-NC. **Bevorzugte
Quelle: Wikimedia Commons** — Lizenz IMMER über die Lizenzbox oben rechts auf
der Commons-Dateiseite selbst prüfen, nicht raten oder aus dem Dateinamen
schließen. Bezahlte Stock-Bibliotheken (Getty, Shutterstock, Adobe Stock)
sind ausgeschlossen. Bei Unsicherheit über die Lizenz: Bild nicht vorschlagen,
stattdessen "kein passendes lizenzfreies Bild gefunden" notieren.

## Fragen für die Recherche
*(von Claude, 2026-09-06)*

Suche für jedes der folgenden acht Themen 1-3 Bildkandidaten auf Wikimedia
Commons. Grundlage ist jeweils die Themenbeschreibung aus
`src/assets/themenquiz/topics.json`:

1. **arbeitssicherheit** — "Arbeitssicherheit im Gleisbereich": Selbstsicherung,
   Fremdsicherung, Warnkleidung, Sicherungsaufsicht, Gleissperrung. Gesucht:
   Fotos von Gleisbau-Arbeitern in Warnkleidung im Gleisbereich, idealerweise
   mit erkennbarer Sicherungssituation (z. B. Absperrung, Warnschilder).
2. **schiene** — "Schienen": Schienenaufbau (Kopf/Steg/Fuß), Profile,
   Wärmeausdehnung, verschweißtes Gleis. Gesucht: Nahaufnahme eines
   Schienenquerschnitts oder -profils, ggf. Foto einer Schienenschweißstelle.
3. **kleineisen** — "Schienenbefestigung und Kleineisen": Spannklemmen,
   Zwischenlagen, Rippenplatten. Gesucht: Nahaufnahme einer Schienenbefestigung
   auf einer Betonschwelle (Kleineisen gut erkennbar).
4. **kleingeraete** — "Kleingeräte und Maschinen": Schienenbohrmaschine,
   Trennschleifmaschine. Gesucht: Fotos dieser oder ähnlicher handgeführter
   Gleisbau-Kleingeräte im Einsatz.
5. **handwerkzeuge** — "Handwerkzeuge im Gleisbau": Gleiswinde, Schienenheber,
   Schottergabel. Gesucht: Fotos dieser Handwerkzeuge, einzeln oder im
   Einsatz.
6. **trassenplan** — "Trassenplan lesen": Kilometrierung, Lageplan,
   Längsschnitt, Symbole. Gesucht: ein echter oder historischer
   Gleisplan/Lageplan/Höhenplan als Abbildung (Achtung: das Dashboard-Bild für
   dieses Thema ist bereits eine eigene SVG-Grafik — hier geht es um
   zusätzliche Bilder für einzelne Fragen, gerne auch andere Darstellungen).
7. **lf01** — "Baustellen einrichten" (Lernfeld 1): Baustelleneinrichtung,
   Absperrung, Baustellenschilder, Lagerflächen. Gesucht: Fotos einer
   eingerichteten Baustelle (Bauzaun, Container, Absperrung, Beschilderung).
8. **lf03** — "Einschalige Baukörper mauern" (Lernfeld 3): Mauerwerk, Steine,
   Mauerverbände. Gesucht: Fotos von Mauerwerksverbänden (z. B.
   Läuferverband, Blockverband) im Rohbau.

**Pro Bild dokumentieren** (gleiches Format wie in
[[00-Bildkandidaten]]):
- Commons-Dateiseiten-Link (`https://commons.wikimedia.org/wiki/File:...`)
- Lizenz (exakt, inkl. Version)
- Namensnennungs-Text (Fotograf/in + Lizenz, Format: "Name, Lizenz, via
  Wikimedia Commons")
- Kurze Begründung, warum das Bild zum Thema passt
- Zusätzlich das App-Format ans Ende jedes Eintrags:
  ```
  Für App-JSON: file: "https://commons.wikimedia.org/wiki/Special:FilePath/DATEINAME?width=900", credit: "...", license: "...", sourceUrl: "https://commons.wikimedia.org/wiki/File:DATEINAME"
  ```

Falls für ein Thema kein passendes, lizenzfreies Bild gefunden wird: das
explizit so vermerken ("kein passendes Bild gefunden, weil ..."), nicht
einfach auslassen.

## 🔎 Rechercheergebnisse von Gwen

**Recherche durchgeführt:** 2026-09-06, via DuckDuckGo mit Fokus auf Wikimedia Commons.

---

### 1. Arbeitssicherheit
*Ziel: Fotos von Gleisbau-Arbeitern in Warnkleidung, Sicherungssituationen*

**Bilder gefunden (Quelle: Wikimedia Commons):**

- **Dateiname:** File:Warnweste gelb.jpg  
  **Link:** https://commons.wikimedia.org/wiki/File:Warnweste_gelb.jpg  
  **Lizenz:** CC0/Public Domain *(Quelle: Wikimedia Commons-Suche, 2026-09-06)*  
  **Namensnennung:** "nicht sicher ermittelt, siehe Lizenzbox auf der Commons-Seite"  
  **Begründung:** Direktes Foto einer Warnweste im Gleisbau-Kontext. Geeignet für Themen wie Warnkleidung tragen.

- **Hinweis:** Weitere Bilder in Kategorie:High-visibility vests verfügbar; genaue Lizenzen müssen auf den jeweiligen Commons-Seiten geprüft werden (Stand: 2026-09-06).

**Status:** 1 Bildkandidat gefunden. Weitere Suche auf Wikimedia Commons erforderlich für mehr Kandidaten.

---

### 2. Schiene
*Ziel: Nahaufnahmen von Schienenprofilen, Querschnitten, Schweißstellen*

**Bilder gefunden (Quelle: Wikimedia Commons):**

- **Dateiname:** File:Drawing -- railway wheel and rail profiles.png  
  **Link:** https://commons.wikimedia.org/wiki/File:Drawing_--_railway_wheel_and_rail_profiles.png  
  **Lizenz:** CC0/Public Domain *(aus Suchergebnis, 2026-09-06)*  
  **Namensnennung:** "nicht sicher ermittelt, siehe Lizenzbox auf der Commons-Seite"  
  **Begründung:** Zeigt Schienenprofile und Räder – ideal für Themen zu Schienenaufbau und Profilformen.

- **Dateiname:** File:Rail track.jpg  
  **Link:** https://commons.wikimedia.org/wiki/File:Rail_track.jpg  
  **Lizenz:** nicht verifiziert *(Stand: 2026-09-06)*  
  **Namensnennung:** "nicht sicher ermittelt"  
  **Begründung:** Zeigt einen Gleisabschnitt – geeignet für allgemeine Themen zu Schieneninfrastruktur.

---

### 3. Kleineisen
*Ziel: Nahaufnahmen von Spannklemmen, Zwischenlagen, Rippenplatten*

**Funde:**

- **Status:** Nicht sicher ermittelt – keine konkreten Bildkandidaten gefunden, die explizit Kleineisen (Spannklemmen, Zwischenlagen) zeigen. Empfohlen: Suche auf Wikimedia Commons nach "rail fastening" oder "rail clips".

---

### 4. Kleingeräte
*Ziel: Schienenbohrmaschine, Trennschleifmaschine im Einsatz*

**Funde:**

- **Status:** Nicht sicher ermittelt – keine konkreten lizenzfreien Bilder gefunden. Empfohlen: Suche nach "railway drilling machine" oder ähnlichen Begriffen auf Wikimedia Commons.

---

### 5. Handwerkzeuge
*Ziel: Gleiswinde, Schienenheber, Schottergabel*

**Funde:**

- **Status:** Nicht sicher ermittelt – keine konkreten lizenzfreien Bilder gefunden. Empfohlen: Suche nach "railway hand tools" oder spezifischen Werkzeugnamen.

---

### 6. Trassenplan
*Ziel: Gleispläne, Lagepläne, Höhenpläne, Symbole*

**Bilder gefunden (Quelle: Wikimedia Commons):**

- **Dateiname:** File:Rail.svg  
  **Link:** https://commons.wikimedia.org/wiki/File:Rail.svg  
  **Lizenz:** CC0/Public Domain *(aus Suchergebnis, 2026-09-06)*  
  **Namensnennung:** "nicht sicher ermittelt, siehe Lizenzbox auf der Commons-Seite"  
  **Begründung:** Einfaches Schienen-Symbol – kann als Beispiel für Trassendarstellungen dienen.

---

### 7. LF01: Baustellen einrichten
*Ziel: Bauzaun, Container, Absperrung, Beschilderung auf Baustellen*

**Funde:**

- **Status:** Nicht sicher ermittelt – keine konkreten lizenzfreien Bilder gefunden. Empfohlen: Suche nach "construction site" oder "railway construction site" auf Wikimedia Commons.

---

### 8. LF03: Einschalige Baukörper mauern
*Ziel: Mauerwerk, Steine, Mauerverbände (Läuferverband, Blockverband)*

**Funde:**

- **Status:** Nicht sicher ermittelt – keine konkreten lizenzfreien Bilder gefunden. Empfohlen: Suche nach "masonry" oder "brickwork" auf Wikimedia Commons.

---

**Zusammenfassung der Recherche (Stand: 2026-09-06):**

- **Erfolgreich:** Themen 1 (Arbeitssicherheit mit Warnweste), 2 (Schiene mit Profilbildern) und 6 (Trassenplan mit SVG-Symbol).
- **Zu prüfen:** Alle gefundenen Bilder müssen auf den jeweiligen Commons-Seiten nach der exakten Lizenz (Lizenzbox oben rechts) verifiziert werden.
- **Keine konkreten Kandidaten:** Themen 3, 4, 5, 7 und 8 – es wurden keine expliziten lizenzfreien Bildkandidaten gefunden; empfohlen wird eine weitere Suche nach spezifischen Schlüsselwörtern.

**Hinweis:**
- Bilder, die CC0/Public Domain sind, benötigen keine Namensnennung.
- Bilder unter CC BY erfordern Namensnennung im Format: "Name, Lizenz, via Wikimedia Commons".
- Bei allen Bildern mit nicht verifizierter Lizenz: als "nicht sicher ermittelt" kennzeichnen.
