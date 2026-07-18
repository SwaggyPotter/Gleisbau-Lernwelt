---
tags: [modul, zusatz, gesamtquiz]
autor: Claude
---

# Modul: Zusatz – Gesamtquiz

Route: `zusatz/gesamtquiz`
Pfad: `src/app/modules/zusatz/gesamtquiz/`

Ein aggregiertes "großes Quiz", das Fragen aus allen drei anderen Zusatz-Modulen
(Nivellieren, Prozentrechnung, Volumen) kombiniert.

## Datenquelle

Eine einzelne Datei: `src/assets/zusatz/gesamtquiz/gesamtquiz-alle-module.json`
(im Gegensatz zu den anderen Modulen, die content.json + quiz.json getrennt haben).

Hinweis: Dies ist die einzige Stelle im aktuellen `src/app`-Code, in der das
Wort "Lernfeld" noch in einer HTML-Datei auftaucht (`gesamtquiz.page.html`).
