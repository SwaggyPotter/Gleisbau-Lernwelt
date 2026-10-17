---
tags: [wissensbibliothek, ist-zustand]
autor: Claude
---

# Ist-Zustand: Was an Gleisbau-Wissen schon da ist (Stand 2026-10-16)

Bestandsaufnahme vor dem großen Recherche-Lauf, damit die Bibliothek gezielt Lücken füllt
und nichts doppelt recherchiert wird. Zahlen aus dem Repo gezählt (`src/assets/themenquiz`),
Rest aus den Vault-Dateien gelesen.

## 1. Wissen in der App (Quelle der Wahrheit für Lerninhalte)

- **Themenquiz/Lernfeld-Fragen (`src/assets/themenquiz/*.json`):** 471 Fragen in 17 Dateien
  (u. a. Bettung 41, Trassenplan 45, Arbeitssicherheit 20, Schiene 19, Kleineisen 25; Lernfelder
  LF10–LF14 je ~24, LF01 72). LF02–LF09 sind im Working Tree aktuell gelöscht (siehe `git status`).
- **Gesamtquiz** (`src/assets/zusatz/gesamtquiz/gesamtquiz-alle-module.json`): Fragenpool über alle Module;
  427 Fragen waren 2026-07 Gegenstand der Gwen-Prüfung ([[10-Gesamtquiz-Pruefung/00-Anweisung-für-Gwen]]).
- **Quellen:** Themenquiz-/Lernfeld-Fragen tragen `source`/`sourceUrl` (Stand 2026-08-25: 645/645);
  Rechte-Recherche zu Domains und Bildlizenzen abgeschlossen ([[14-Gwen-Code-Aufgaben/18-Rechte-an-Quellen-und-Bildern]]).
- **Bilder:** zentrales Register `src/assets/bilder/bildnachweise.json`; Bildbedarf-Recherche läuft
  ([[18-Bildbedarf-Gleisbau/00-Rechercheauftrag-Bildbedarf]]).
- **Rechentrainer/Spiele:** Nivellieren, Volumen, Prozentrechnung, Schienenprofile (~50 Profile in
  `src/app/shared/schienenprofile.ts`), Nivellierlatte, Verschleißmesser, Quiz-Duell.

## 2. Wissen im Vault (vor diesem Auftrag)

| Bereich | Inhalt | Verlässlichkeit |
|---|---|---|
| `01`–`07` | Projekt, Architektur, Module, Lernfelder, Update-Log, Offene Punkte | Claude, teils veraltet (siehe [[00-Start-Hier]]) |
| `08-Recherche-Gwen` | 15 Fachthemen als Fragenkatalog + Gwen-Ergebnisse | **Gwen, nachweislich fehlerhaft** (erfundene Normen wie „RBT 9000“, abgebrochene Sätze) |
| `09-Fachwissen-Fragenkatalog` | aufbereitete Fragen/Antworten aus Gwens Funden | Claude, aus unsicherer Basis |
| `10`/`11`/`15` | Gesamtquiz-Prüfung, Fragen-Generierung, Quellenprüfung (144 Dateien) | Gwen + Claude-Nachprüfung, gut belegt |
| `16-Trassenplan-Ausbau` | 77 Kandidaten-Links, kuratiert und verifiziert (EBA-Muster-Legendenheft u. a.) | **verifiziert** — beste Quellenbasis im Vault |
| `12`/`17`/`18` | Bildkandidaten, Bilder für Fragen, Bildbedarf | Bildlizenzen verifiziert |

## 3. Erkennbare Lücken (Ziel dieser Bibliothek)

1. **Regelwerke fehlen fast vollständig:** keine systematische Übersicht der DB-Richtlinien
   (Ril 800/820/824/836/…), ihrer Nummern, Ausgabestände und Zugangswege. Genannte Normen im Vault
   sind verstreut (DIN EN 13450, 13481, DGUV 78 …).
2. **Zahlenwerte** (Gleisgeometrie-Grenzwerte, Schotter-/Planumsanforderungen, Gleislage-Toleranzen)
   sind in der App meist ohne Primärquelle.
3. **Betriebliche Sicherheit** (Sicherungsmaßnahmen, Betra, Sperrpausen, Signale) kaum abgedeckt.
4. **Maschinen, Schweißen, LWS, Weichen, Feste Fahrbahn** nur oberflächlich.
5. **Glossar/Abkürzungen** nicht zentral vorhanden.

Die Themen A01–A14 (Regelwerke) und B01–B19 (Fachthemen) in `Themen/` adressieren genau diese Punkte.
Fortschritt: [[Fortschritt]].
