---
tags: [gwen-code-auftrag, quizduell, gwen-fehlschlag]
autor: Claude
---

# Runde 08 — Quiz-Duell: Statistik-Seite (Gwen gescheitert, von Claude direkt behoben)

Siehe [[06-Quizduell-Login]] für den Gesamtkontext. Anders als bei den
Runden 06/07: **dieser Auftrag ist zweimal gescheitert und wurde am Ende von
Claude direkt geschrieben**, nicht von Gwen. Neues Fehlerbild, bisher nicht
in [[00-Start-Hier]] dokumentiert — dort ergänzen.

## Auftrag

`tools/cline-cli/_auftrag-quizduell-statistik.txt`, identisches Muster wie
Runden 06/07.

```
node tools/cline-cli/run-gwen-code-task.cjs --files "src/app/modules/zusatz/quizduell/pages/statistik/statistik.page.html,src/app/modules/zusatz/quizduell/pages/statistik/statistik.page.scss" --prompt-file "tools/cline-cli/_auftrag-quizduell-statistik.txt" --timeout 600 --retries 2
```

## Gwen-Protokoll — neues Fehlerbild

**Versuch 1**: `TIMEOUT` nach 600s. Log zeigt eine lange Kette gescheiterter
Schreibversuche:
- `editor`-Tool (diff-basiertes Edit, braucht exaktes `old_text`) scheiterte
  wiederholt an einem **BOM (Byte Order Mark)** am Dateianfang und an
  Tab-vs-Leerzeichen-Verwirrung — Gwen "sah" beim Lesen einen anderen Text
  als beim Editieren erwartet wurde.
- Gwen wich auf `run_commands` (PowerShell) aus, scheiterte dort wiederholt
  an PowerShell-Here-String-Syntax mit HTML-Sonderzeichen (`<`, `"`) und an
  falscher `[byte[]]`/BOM-Konstruktion.
- Am Ende der 600s war `statistik.page.html` auf einen einzelnen
  abgeschnittenen Satz reduziert, `statistik.page.scss` faktisch leer (nur
  BOM). Zusaetzlich blieb eine Datei `statistik.page.html.new` mit
  einzeiligem, verklebtem Inhalt zurueck (Gwen hat offenbar versucht, in
  eine Alternativdatei auszuweichen).

**Versuch 2** (automatischer Retry): `BUILD_FAILED` nach 401s. `ng build`
brach mit `Module not found ... statistik.page.scss?ngResource` ab — die
SCSS-Datei war zu diesem Zeitpunkt komplett verschwunden (nicht nur leer).
`statistik.page.html` war 0 Byte.

**Kein dritter Versuch.** Zwei Fehlschläge mit fortschreitender
Datei-Zerstörung (leer → komplett gelöscht) sprachen dagegen, weiter Zeit zu
investieren — stattdessen hat Claude aufgeräumt (`statistik.page.html.new`
gelöscht) und beide Dateien direkt mit dem identischen, bereits geplanten
Inhalt geschrieben.

## Verifikation (Claude)

1. `statistik.page.html`/`.scss` von Claude direkt geschrieben (Inhalt
   identisch zur ursprünglichen Spezifikation in
   `_auftrag-quizduell-statistik.txt`).
2. `statistik.page.ts` nie angefasst.
3. `ng build --configuration production` — erfolgreich, kein Fehler mehr.

## Lehre — neu, bitte in 00-Start-Hier.md ergänzen

Der bisher dokumentierte Fallstrick war "neues Modul wird nicht kompiliert,
Build luegt". Hier ein **anderes** Fehlerbild: Wenn Gwens `editor`-Tool beim
diff-basierten Edit wiederholt am exakten Alt-Text scheitert (z. B. wegen
BOM), kann Gwen in einen Fallback-Modus (PowerShell-Here-Strings) wechseln,
der die Zieldatei **fortschreitend zerstoert** statt sie unveraendert zu
lassen — am Ende leer oder ganz geloescht, nicht nur "nicht geaendert". Das
ist gefaehrlicher als NO_CHANGE, weil es echten vorherigen Inhalt vernichtet.
Empfehlung fuer kuenftige Runden: nach jedem Gwen-Codeauftrag nicht nur
`ng build`, sondern auch **Dateigroesse plausibel (nicht 0 Byte, nicht
verschwunden)** pruefen, bevor man den naechsten Auftrag startet — genau das
hat hier den Schaden frueh sichtbar gemacht.
