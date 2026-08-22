---
tags: [gwen-code-auftrag, quizduell, gwen-fehlschlag]
autor: Claude
---

# Runde 13 — Quiz-Duell: kompletter Umbau nach Tims Referenz-Prototyp (Steel/Signal-Design, Bot-Gegner)

Tim hat einen von ihm bei einer anderen Claude-Instanz in Auftrag gegebenen,
eigenstaendigen HTML/CSS/JS-Prototyp (`gleisbau-quizduell.html`) geliefert
und gesagt: "genau eins zu eins nachbauen". Zwei bewusste Abweichungen
(transparent kommuniziert, nicht stillschweigend):

1. **Fragen-Inhalt**: der Prototyp hat einen eigenen, unbelegten Demo-
   Fragenpool (6 Themen, 18 Fragen). Übernommen wurde NUR das Prinzip/UI,
   nicht dieser Fragenpool — Quelle bleibt der echte, bereits gepruefte
   Themenquiz-Fragenbestand (`ThemenquizDataService`), passend zur
   Projekt-Regel "keine unbelegten Fakten uebernehmen".
2. **Schriften**: Prototyp laedt Inter/IBM Plex Mono per Google-Fonts-CDN.
   Stattdessen die bereits selbst gehosteten Fonts mit identischer Rolle
   verwendet (Oswald bleibt Oswald, Barlow statt Inter, JetBrains Mono statt
   IBM Plex Mono) — passt zur bestehenden Projekt-Konvention
   "Fonts selbst gehostet, kein Google-Fonts-CDN".

Alles andere (Farbpalette Steel/Signal-Orange, Layout, Ablauf, Bot-Namen,
Timing) 1:1 uebernommen.

## Grösste inhaltliche Änderung: Bot-Gegner statt Pass-and-Play

Der Prototyp loest das "kein Backend = kein echter Mitspieler"-Problem
eleganter als meine vorherige Pass-and-Play-Version: ein simuliertes
Matchmaking "sucht" kurz und faellt danach zuverlaessig auf einen
Trainings-Bot zurueck (Namen: Schwellen-Klaus, Weichen-Steller-Bot,
Gleisbau-Trainer, Prellbock-Peter, Signal-Susi). Der Bot beantwortet nie
sichtbar echte Fragen, sondern bekommt nur eine gewuerfelte Trefferzahl pro
Runde (feste Trefferquote 65 %, siehe `GEGNER_TREFFERQUOTE` in
`quizduell.models.ts`) — dadurch ist das Duell auch allein spielbar, kein
Geraet-Weiterreichen mehr noetig. Komplettes Datenmodell
(`QuizduellMatch`/`QuizduellRunde`) und Service dafuer neu geschrieben.

## Was Claude direkt geschrieben hat (Architektur/Logik, wie immer vor jedem Gwen-Auftrag)

- `models/quizduell.models.ts`, `services/quizduell-data.service.ts`
  (Bot-Simulation, Kategorie-Wiederholungssperre pro Match, Elo weiterhin
  vereinfacht wie in Runde 10-12).
- `pages/duell/duell.page.ts` (State-Machine: setup → lobby → vs →
  kategorie → fragen → gegner-antwortet → rundenwechsel → abgeschlossen).
- `pages/duell/duell.page.html` + `.scss` (das groesste, repetitivste
  Template — **bewusst direkt geschrieben, kein Gwen-Versuch**, aus Lehre
  von Runde 10: bei aehnlich grossen/repetitiven Vorlagen ist die
  `<br>`-Degeneration wahrscheinlich genug, dass ein Versuch absehbar Zeit
  gekostet haette ohne Erfolgsgarantie).
- `components/duell-frage/duell-frage.component.ts` (Vertrag vereinfacht:
  `spielerName`/`fragenNummer`/`fragenGesamt` entfernt, stehen jetzt in der
  Runden-Kopfzeile der Elternseite).

## Gwen-Aufträge (3 Runden fuer die restlichen Dateien)

```
node tools/cline-cli/run-gwen-code-task.cjs --files "…/login.page.html,…/login.page.scss" --prompt-file "tools/cline-cli/_auftrag-quizduell-login.txt" --timeout 600 --retries 2
node tools/cline-cli/run-gwen-code-task.cjs --files "…/statistik.page.html,…/statistik.page.scss" --prompt-file "tools/cline-cli/_auftrag-quizduell-statistik.txt" --timeout 600 --retries 2
node tools/cline-cli/run-gwen-code-task.cjs --files "…/duell-frage.component.html,…/duell-frage.component.scss" --prompt-file "tools/cline-cli/_auftrag-quizduell-frage.txt" --timeout 600 --retries 2
```

### Login-Reskin — viertes Gwen-Fehlerbild (neu, klein, leicht zu fixen)

`SUCCESS_BUILD_OK`, ABER Build schlug beim direkten `ng build`-Gegencheck
fehl: NG5002-Fehler wie in Runde 10. Diesmal keine `<br>`-Degeneration,
sondern **drei fehlende oeffnende Anfuehrungszeichen** an isolierten
Stellen (`[translucent]=true">` statt `="true">`, `[fullscreen]=true"`
ebenso, `#f=ngForm"` statt `#f="ngForm"`) — jeweils bei Attributwerten ohne
Leerzeichen direkt vor dem schliessenden `>`. Deutlich kleinerer Schaden als
Runde 10, gezielt mit drei Edits repariert statt neu geschrieben. SCSS kam
unbeschaedigt an.

**Vierter Fallstrick fuer 00-Start-Hier.md**: Gwen kann bei
Attributwerten, die syntaktisch nah am schliessenden `>` stehen (kein
Leerraum dazwischen, z. B. `="true">` oder `="ngForm">`), das erste
Anfuehrungszeichen verlieren. Kleiner, lokal begrenzter Fehler — anders als
die grossflaechige `<br>`-Degeneration, aber genauso nur durch Diff/Build
sichtbar, nicht durch Dateigroesse allein.

### Statistik-Reskin

`SUCCESS_BUILD_OK`, Inhalt per Diff exakt wie vorgegeben — keine Korrektur
noetig.

### Frage-Komponente-Reskin — fuenfter Fallstrick (unvollstaendiger Mehrdatei-Auftrag trotz Erfolgsmeldung)

`SUCCESS_BUILD_OK`, aber das Skript meldete "Veraenderte Dateien" nur fuer
die `.html`, **nicht** fuer die `.scss` — Gwen hat die zweite Datei im
Auftrag schlicht ausgelassen, obwohl der Auftragstext beide vollstaendig
enthielt. Der Build war trotzdem gruen, weil die ALTE (Streckenplan-
Farben) SCSS syntaktisch weiterhin gueltig war, nur mit falschen
`var(--sp-*)`-Tokens statt der neuen `--steel-*`/`--signal-*`-Variablen.
Claude hat die SCSS direkt nachgetragen.

**Lehre, ergaenzt bereits bekannten Fallstrick "unvollstaendiger
Mehrdatei-Auftrag"**: Das Skript meldet nur Dateien als "veraendert", die
tatsaechlich vom Vorher-Snapshot abweichen — bei einem 2-Datei-Auftrag
immer explizit pruefen, dass BEIDE im Log als veraendert auftauchen, nicht
nur den Gesamtstatus `SUCCESS_BUILD_OK` werten.

## Verifikation (Claude)

1. Alle Gwen-Ergebnisse per Diff gegen die Vorgabe geprueft (nicht nur
   Build-Status).
2. `ng build --configuration production` final gruen, `quizduell`-Chunk
   49,64 kB.
3. Playwright-End-to-End (`browser-automation`-Skill): Setup-Screen,
   Matchmaking→Bot-Zuweisung, VS-Screen, Kategoriewahl (inkl. Bot waehlt
   automatisch bei eigenem Zug), Timer-Frage, "Gegner antwortet"-Screen,
   Rundenwechsel ueber alle 6 Runden, Ergebnis-Screen — als Gast (Sieg
   11:7 gegen "Weichen-Steller-Bot") und eingeloggt (Statistik/Rating/
   Errungenschaften aktualisiert, 3 Errungenschaften freigeschaltet) je
   einmal komplett durchgespielt. Zwei Screenshots (Ergebnis-Screen,
   Statistik-Seite) bestaetigen visuell: Steel/Signal-Design entspricht
   sehr genau der Referenz-HTML (dunkler Rahmen, gestrichelte Orange-
   Schienen-Leiste oben, Karten-Layout, Emoji-Errungenschaften mit
   Schloss-Symbol fuer gesperrte). Keine Konsolenfehler.

## Bilanz

3 Gwen-Runden dispatcht: 1 mit kleinem, gezielt reparierbarem Fehler
(Login), 1 sauber (Statistik), 1 mit ausgelassener Zweitdatei trotz
Erfolgsmeldung (Frage-Komponente, SCSS von Claude nachgetragen). Die
groesste/komplexeste Datei (Duell-Seite) wurde aus Vorsicht direkt von
Claude geschrieben. Damit sind jetzt **fuenf** verschiedene Gwen-
Fehlerbilder dokumentiert (unverlinktes Modul, BOM-Zerstoerung,
`<br>`-Degeneration, fehlendes Anfuehrungszeichen, ausgelassene
Zweitdatei) — alle in [[00-Start-Hier]] nachgetragen.
