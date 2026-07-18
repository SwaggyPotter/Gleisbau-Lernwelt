---
tags: [recherche, auftrag, gwen, meta]
autor: Claude
---

# Rechercheauftrag für Gwen

Hallo Gwen. Wenn du das liest, wurdest du (ein lokal über LM Studio laufendes
Modell, z. B. Qwen) gebeten, an diesem Vault mitzuarbeiten. Diese Datei ist
dein Einstiegspunkt und deine Arbeitsanweisung. Bitte lies sie vollständig,
bevor du anfängst.

## Kontext: was ist dieses Projekt?

Dieser Vault dokumentiert **Gleisbau Lernwelt**, eine Lern-App für Auszubildende
im Gleisbau. Lies zuerst [[00-Start-Hier]] im Vault-Wurzelverzeichnis für den
Gesamtüberblick, danach [[03-Module/Übersicht]] für die Lernmodule. Die App hat
u. a. 10 "Themenquiz" (Multiple-Choice zu Gleisbau-Grundlagenthemen) und drei
"Zusatzmodule" mit echtem Lektionsinhalt (Nivellieren, Prozentrechnung, Volumen).

**Deine Aufgabe**: Zu den unten gelisteten Themen sollst du im Internet
recherchieren und die Fragen beantworten, die Claude (eine andere KI, die
diesen Vault bisher aufgebaut hat) für dich vorbereitet hat. Die Ergebnisse
sollen später genutzt werden, um die Lerninhalte der App fachlich zu vertiefen
und rechtlich/normativ abzusichern.

## Die wichtigste Regel: Nur hinzufügen, nichts verändern

**Du darfst bestehende Inhalte im Vault nicht verändern oder löschen.** Du
darfst nur:

1. Neue Informationen in den dafür vorgesehenen Abschnitt **"🔎
   Rechercheergebnisse von Gwen"** am Ende jeder Themen-Datei einfügen
   (Abschnitt existiert bereits in jeder Datei in diesem Ordner).
2. Bei Bedarf komplett neue Dateien anlegen, wenn ein Thema mehr Platz
   braucht — auch dann bitte mit der Kennzeichnung unten versehen.

Ändere niemals Texte, die bereits im Vault stehen (auch nicht scheinbare
Tippfehler oder veraltete Infos) — melde das stattdessen als neuen Punkt in
deinem Rechercheabschnitt, damit ein Mensch oder Claude das prüfen kann.

## Kennzeichnungspflicht: So markierst du deine Beiträge

Damit man im Vault immer erkennt, welche Information von dir (Gwen) stammt und
welche von Claude, gilt folgende Konvention:

- Jede neue **Datei**, die du komplett selbst anlegst, bekommt im Frontmatter
  `autor: Gwen` (analog zu `autor: Claude` in den bestehenden Dateien).
- Jeder **Beitrag innerhalb einer bestehenden Datei** (im Abschnitt
  "🔎 Rechercheergebnisse von Gwen") wird als Obsidian-Callout markiert, so:

```markdown
> [!gwen] Gwen-Recherche — 2026-07-19
> Deine recherchierte Information hier. Bitte so konkret wie möglich,
> mit Nennung von Normen/Paragraphen wo relevant.
>
> **Quelle:** URL oder Bezeichnung der Quelle (z. B. "DIN EN 13481-1:2012",
> "EBO §X", "DGUV Vorschrift 1", Website-Name + Link)
```

- Trage bei jedem Eintrag das **Datum** und wenn möglich eine **Quellenangabe**
  ein (Link oder exakte Bezeichnung von Norm/Gesetz/Website). Ohne Quelle ist
  eine Information für Tim schwer zu verifizieren.
- Wenn du dir bei etwas unsicher bist oder widersprüchliche Quellen findest,
  schreib das explizit dazu (z. B. "Quelle A sagt X, Quelle B sagt Y — nicht
  eindeutig geklärt"), statt dich für eine Version zu entscheiden.

## Was mit deinen Ergebnissen passiert

Tim sichtet deine Recherche-Ergebnisse und gibt sie anschließend an Claude
weiter, damit daraus ein sauberer Frage-Antwort-Katalog für die App entsteht.
Du musst also **keine perfekt formatierten Endtexte** liefern — Stichpunkte
mit Quellenangabe reichen völlig. Wichtiger ist Vollständigkeit und
Korrektheit der Fundstellen (insbesondere bei Gesetzen/Normen: exakte
Bezeichnung und wenn möglich Paragraph/Abschnitt).

## Recherche-Schwerpunkte (für alle Themen relevant)

Bei jedem Thema unten sind die Fragen grob in vier Kategorien sortiert:

1. **Fachliche Grundlagen** — Definitionen, Aufbau, Funktion, Fachbegriffe
2. **Rechtliche Grundlagen & Normen** — einschlägige Gesetze, DIN-/EN-Normen,
   DGUV-Vorschriften, Regelwerke (z. B. Ril der DB Netz, EBO). Wenn du eine
   Norm/einen Paragraphen nennst: bitte die **exakte Bezeichnung** (z. B.
   "DIN EN 13481-2" statt nur "eine DIN-Norm") und nach Möglichkeit den
   Titel/Inhalt des Paragraphen kurz zusammenfassen.
3. **Praxis & Sicherheit** — Anwendung auf der Baustelle, typische Gefahren,
   Arbeitsschutz
4. **Ausbildungsbezug** — Bezug zum Ausbildungsrahmenplan Gleisbauer
   (Lernfeld-Zuordnung, siehe [[04-Lernfelder/Lernfelder-Übersicht]]),
   Prüfungsrelevanz

## Themenliste (12 Hauptthemen + 3 Zusatzmodule)

| # | Datei | Thema | Bezug im Code |
|---|---|---|---|
| 1 | [[01-Trassenplan]] | Trassenplan | `src/assets/themenquiz/trassenplan.json` |
| 2 | [[02-Lesen-und-Werkzeuge]] | Lesen (techn. Unterlagen) und Werkzeuge | `src/assets/themenquiz/handwerkzeuge.json` |
| 3 | [[03-Gleisbau-Allgemein]] | Gleisbau (Überblick/Berufsbild) | übergreifend |
| 4 | [[04-Kleingeraete-und-Maschinen]] | Kleingeräte und Maschinen | `src/assets/themenquiz/kleingeraete.json` |
| 5 | [[05-Messmittel]] | Messmittel | `src/assets/themenquiz/messmittel.json` |
| 6 | [[06-Vermessung]] | Vermessung | Bezug zu Zusatzmodul Nivellieren |
| 7 | [[07-Schienenbefestigung]] | Schienenbefestigung | `src/assets/themenquiz/kleineisen.json` |
| 8 | [[08-Kleineisen-und-Bettung]] | Kleineisen & Bettung | `kleineisen.json` + `bettung.json` |
| 9 | [[09-Schotter-und-Schwellen]] | Schotter & Schwellen | `schwellen.json` + `bettung.json` |
| 10 | [[10-Gleisbau-Grundlagen]] | Gleisbau-Grundlagen | `src/assets/themenquiz/grundlagen.json` |
| 11 | [[11-Spurweite-und-Gleisgeometrie]] | Spurweite & Gleisgeometrie | `src/assets/themenquiz/spurweite.json` |
| 12 | [[12-Schienen]] | Schienen | `src/assets/themenquiz/schiene.json` |
| 13 | [[13-Zusatzmodul-Nivellieren]] | Zusatzmodul: Nivellieren | [[03-Module/Zusatz-Nivellieren]] |
| 14 | [[14-Zusatzmodul-Prozentrechnung]] | Zusatzmodul: Prozentrechnung | [[03-Module/Zusatz-Prozentrechnung]] |
| 15 | [[15-Zusatzmodul-Volumen]] | Zusatzmodul: Volumen | [[03-Module/Zusatz-Volumen]] |

**Hinweis zu Überschneidungen**: Die Themen 3/10 (Gleisbau allgemein vs.
Gleisbau-Grundlagen) und 7/8/9 (Schienenbefestigung / Kleineisen & Bettung /
Schotter & Schwellen) liegen inhaltlich nah beieinander — das ist so von Tim
vorgegeben. Bitte nicht einfach zusammenlegen, sondern in der jeweiligen Datei
den spezifischen Fokus recherchieren; wo du Dopplungen bemerkst, kurz
vermerken statt selbst zu konsolidieren.

Das Gesamtquiz-Modul braucht keine eigene Recherche-Datei, da es nur Fragen
aus den drei Zusatzmodulen kombiniert (siehe [[03-Module/Zusatz-Gesamtquiz]]).

## Kickoff-Prompt

Falls Tim dir diesen Auftrag per Chat-Nachricht gegeben hat: der exakte
Starttext dafür liegt in [[Kickoff-Prompt]] und kann bei jeder neuen Session
wiederverwendet werden.

## Wenn du fertig bist

Trag bitte den Status oben in jeder bearbeiteten Datei von `offen` auf
`in Bearbeitung von Gwen` oder `von Gwen recherchiert` um (im Frontmatter-Feld
`status`), damit Tim und Claude auf einen Blick sehen, was schon bearbeitet
wurde.
