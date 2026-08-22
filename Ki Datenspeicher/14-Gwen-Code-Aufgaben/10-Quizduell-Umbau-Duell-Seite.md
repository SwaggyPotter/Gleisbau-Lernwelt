---
tags: [gwen-code-auftrag, quizduell, gwen-fehlschlag]
autor: Claude
---

# Runde 10 — Quiz-Duell: Umbau auf echtes Prinzip, Duell-Seite (Gwen gescheitert, von Claude direkt behoben)

Tim hat nach Ansicht des echten "Quizduell" (MAG Interactive, Play-Store-
Eintrag `se.maginteractive.quizduel2`) bestätigt: **genau nach diesem
Prinzip** umbauen (6 Runden à 3 Fragen, Kategorie pro Runde abwechselnd aus
3 Optionen wählen, 20 Sekunden pro Frage, Rating/Statistik, Errungenschaften
mit Emojis) — ohne Werbung/VIP, architektonisch backend-fertig. Das
komplett neue Datenmodell (`QuizduellMatch`/`QuizduellRunde`) und der
Service (`QuizduellDataService` mit Elo-Rating, Runden-/Zug-Logik) wurden
von Claude direkt geschrieben, ebenso `duell.page.ts` (State-Machine:
setup → kategorie → fragen → uebergabe-spieler/-runde → abgeschlossen).
Details zur Architektur-Entscheidung (Match-Datenform bereits "server-
fertig", aber v1 zwingend Pass-and-Play ohne echtes Backend) siehe
Kommentar in `duell.page.ts` und [[../07-Offene-Punkte/Offene-Punkte]].

## Auftrag

`tools/cline-cli/_auftrag-quizduell-duell.txt` — komplett neues, deutlich
größeres HTML (5 Zustände: Setup, Kategoriewahl, Fragen, zwei
Übergabe-Screens, Ergebnis) + SCSS.

```
node tools/cline-cli/run-gwen-code-task.cjs --files "src/app/modules/zusatz/quizduell/pages/duell/duell.page.html,src/app/modules/zusatz/quizduell/pages/duell/duell.page.scss" --prompt-file "tools/cline-cli/_auftrag-quizduell-duell.txt" --timeout 600 --retries 2
```

## Gwen-Protokoll — drittes, neues Fehlerbild

`BUILD_FAILED` nach nur 72s (verdächtig schnell fuer eine ~120-Zeilen-
Datei — vorherige erfolgreiche Runden mit ähnlich großen Dateien brauchten
180–250s). Angular-Compiler brach mit `NG5002: Unexpected closing tag`
mehrfach ab. Ursache beim Vergleich der geschriebenen Datei gegen die
Vorgabe: **an mehreren wiederkehrenden Stellen (jeweils am Ende eines
Attributs kurz vor dem schliessenden `>`, v.a. bei `(click)="...">Label
</button>` und einem mehrzeiligen Component-Binding) hat Gwen den
restlichen Inhalt durch ein woertliches `<br>` ersetzt**, statt ihn zu
transkribieren. Die SCSS-Datei (zweite Datei im selben Auftrag) kam davon
unberuehrt korrekt an.

**Interpretation:** Vermutlich eine Degenerations-/Abkuerzungs-Neigung des
kleinen lokalen Modells bei grossen, sich stark wiederholenden Vorlagen
(mehrere fast identische `(click)="fn()">Label</button>`-Zeilen
hintereinander) — das Modell "lernt" offenbar aus den eigenen bereits
generierten Zeilen ein Abkuerzungsmuster und ersetzt Wiederholungen durch
einen Platzhalter, statt treu zu kopieren. Bisher nur bei dieser
ungewoehnlich grossen/repetitiven Datei beobachtet.

**Kein Retry versucht** (auch automatische Retries haetten das gleiche
Musterrisiko erneut getroffen, ohne Erfolgsgarantie) — Claude hat die HTML-
Datei direkt geschrieben, byteidentisch zur Vorgabe im Auftrag.

## Verifikation (Claude)

1. `duell.page.html` von Claude direkt geschrieben (Inhalt identisch zur
   Vorgabe).
2. `duell.page.scss` (von Gwen geschrieben) gegen Vorgabe verglichen —
   identisch, keine Korrektur noetig.
3. `ng build --configuration production` — erfolgreich, `quizduell`-Chunk
   gewachsen (Beweis fuer echten neuen Inhalt).
4. End-to-End-Spieltest siehe [[12-Quizduell-Umbau-Frage-Komponente]]
   (letzte Runde dieser Serie, dort gebündelt dokumentiert).

## Lehre — dritter Fallstrick, bitte in 00-Start-Hier.md ergänzen

Bei **grossen, stark repetitiven** HTML-Vorlagen (viele fast identische
`(click)="...">Label</button>`-Bloecke) besteht ein zusaetzliches Risiko:
Gwen kann Wiederholungen durch einen kurzen Platzhalter (hier `<br>`)
ersetzen, statt treu zu transkribieren — anders als die bisher
dokumentierten Fehlerbilder (unvollstaendige Datei, BOM-Zerstoerung) ist
das hier ein **stilles Verkuerzen mitten in einer sonst vollstaendigen
Datei**, das nur durch Diff-Vergleich (nicht nur Dateigroesse) auffaellt.
Empfehlung: bei ungewoehnlich schneller Verifikationszeit (deutlich unter
dem, was vergleichbar grosse erfolgreiche Runden brauchten) den Inhalt
IMMER gegen die Vorgabe diffen, nicht nur den Build-Erfolg werten.
