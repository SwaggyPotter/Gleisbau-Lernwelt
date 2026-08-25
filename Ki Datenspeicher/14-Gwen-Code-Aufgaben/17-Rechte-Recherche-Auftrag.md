---
tags: [rechte, lizenzen, quellen, bilder, auftrag]
autor: Claude
status: abgeschlossen (2026-08-25), siehe [[18-Rechte-an-Quellen-und-Bildern]]
---

# Runde 17 — Auftrag: Rechte-Recherche zu Quellen-Links und Bildern

Dieser Auftrag ist für eine **neue Chat-Session** vorbereitet (die
Session, die ihn geschrieben hat, ging dem Kontextlimit entgegen). Der
Text unten im Block ist der Prompt, den Tim in die neue Session einfügt.

## Ausgangslage (Kontext für die neue Session, nicht Teil des Prompts)

- Runde 15/16 haben 645/645 Themenquiz-Fragen mit `source`/`sourceUrl`
  belegt und eine neue Seite `/quellenverzeichnis` gebaut (siehe
  [[15-Themenquiz-Quellenpruefung]], [[16-Quellenverzeichnis-Seite]]).
- Tim möchte jetzt wissen: darf er per Link + kurzer eigener Begründung
  auf diese 258 externen Domains verweisen, ohne rechtliche Probleme
  (Urheberrecht, Nutzungsbedingungen der Zielseiten)? Und: stimmen die
  bereits dokumentierten Wikimedia-Commons-Bildlizenzen wirklich noch?
- Tim hat zwei Scope-Fragen per AskUserQuestion beantwortet:
  1. Nur die NEUEN Quellen-Links prüfen, NICHT die ursprünglichen
     Fragetexte/Erklärungen (deren Herkunft vor der Quellenprüfung liegt
     und explizit außerhalb des Scopes bleibt).
  2. Bildrechte: **komplette Neu-Verifikation** aller bereits in
     `src/assets/bilder/bildnachweise.json` dokumentierten Lizenzen
     (nicht nur übernehmen).

---

## Prompt für die neue Session

```
Ich möchte prüfen (lassen), ob ich die 645 externen Quellen-Links, die
in den Themenquiz-/Lernfeld-Fragen der App als Beleg für Antworten
verlinkt sind, rechtlich unbedenklich nutzen kann — reine Hyperlinks
plus ein kurzer, selbst geschriebener Bezeichnungstext (kein Volltext-
Zitat). Zusätzlich sollen alle bereits dokumentierten Wikimedia-Commons-
Bildlizenzen in src/assets/bilder/bildnachweise.json komplett neu
verifiziert werden (nicht nur übernommen). Das Ergebnis soll in einer
neuen Seite "Rechte an Quellen und Bildern" landen (analog zu den
bestehenden Seiten /bildnachweise und /quellenverzeichnis — gleiches
Streckenplan-Design, gleiches Modul-Muster unter src/app/<name>/).

Kontext, den du zuerst lesen solltest:
- Ki Datenspeicher/00-Start-Hier.md (Projektüberblick, alle bisherigen
  Gwen-Fallstricke — wichtig, du wirst wahrscheinlich wieder Gwen/Cline
  einsetzen)
- Ki Datenspeicher/14-Gwen-Code-Aufgaben/15-Themenquiz-Quellenpruefung.md
  und 16-Quellenverzeichnis-Seite.md (wie die 645 Quellen entstanden sind,
  inkl. eines Vorfalls, bei dem Gwen erfundene Domains als Quelle angab —
  wichtig für die Einordnung, wie vertrauenswürdig diese Quellen sind)
- src/assets/bilder/bildnachweise.json (bestehende Bildlizenzen)
- src/assets/themenquiz/*.json (24 Dateien, Felder source/sourceUrl je Frage)

Umfang bewusst abgegrenzt: NUR die neu hinzugefügten Quellen-Links
prüfen, NICHT die ursprünglichen Fragetexte/Erklärungen (deren Herkunft
liegt vor der Quellenprüfung und ist nicht Teil dieses Auftrags).

Schritt 1 — Domain-Liste holen (258 einzigartige Domains, sehr
unterschiedlich oft verwendet, von Wikipedia mit 117 Verwendungen bis zu
über 150 Domains mit nur 1 Verwendung). Regenerieren mit:

  node -e "
  const fs = require('fs');
  const dir = './src/assets/themenquiz';
  const c = {};
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.json') || f === 'topics.json') continue;
    const d = JSON.parse(fs.readFileSync(dir+'/'+f,'utf8'));
    d.questions.forEach(q => { if (q.sourceUrl) { const h = new URL(q.sourceUrl).hostname.replace(/^www\./,''); c[h]=(c[h]||0)+1; } });
  }
  Object.entries(c).sort((a,b)=>b[1]-a[1]).forEach(([d,n])=>console.log(n+'x  '+d));
  "

Die zehn häufigsten Domains (deckt einen Großteil aller 645 Zitate ab,
verdienen Einzelprüfung): de.wikipedia.org (117), trackopedia.com (53),
baunetzwissen.de (24), dguv.de (22), gesetze-im-internet.de (10),
darda.de (10), bgbau.de (9), uv-bund-bahn.de (8), publikationen.dguv.de
(8), technology.plassertheurer.com (7).

Schritt 2 — Recherche-Methodik (bei 258 Domains ist Einzelprüfung jeder
einzelnen nicht praktikabel — kategorisiere sinnvoll):
a) Deutsche Gesetze/amtliche Werke (gesetze-im-internet.de,
   gesetze-bayern.de, dejure.org, buzer.de u.ä.): amtliche Werke sind
   nach §5 UrhG gemeinfrei — kurz begründen, warum das hier passt.
b) Öffentliche Stellen/Berufsgenossenschaften (dguv.de, baua.de,
   bgbau.de, bast.de, eba.bund.de, dbinfrago.com, uv-bund-bahn.de u.ä.):
   i.d.R. unproblematisch fuer Verlinkung + Kurzzitat, aber prüfen ob
   irgendwo explizite Nutzungsbedingungen dagegensprechen.
c) Wikipedia: CC BY-SA — was bedeutet das konkret für einen Hyperlink
   plus eigene Kurzformulierung (nicht Wikipedia-Text kopiert)?
d) Kommerzielle Fachseiten/Lexika (trackopedia.com, voestalpine.com,
   plassertheurer.com, railone.de u.v.a.): grundsätzliche Einordnung,
   ob reines Verlinken + eigene Paraphrase rechtlich unproblematisch ist
   (EuGH-Rechtsprechung zu Hyperlinks, z.B. Svensson-Urteil — reines
   Verlinken auf frei zugängliche Inhalte gilt idR nicht als eigene
   öffentliche Wiedergabe), und ob Fakten an sich (im Gegensatz zur
   konkreten Formulierung) urheberrechtlich überhaupt geschützt sind.
e) Lange Liste an kleinen/individuellen Domains (1-3 Verwendungen,
   >150 Stück): nicht einzeln durchgehen — allgemeine Einordnung nach
   Kategorie (Herstellerseite, Fachforum, Handwerksblog, Hochschule
   usw.), Einzelprüfung nur bei auffälligen Fällen (z.B. wenn eine Seite
   explizit "kein Zitieren ohne Genehmigung" o.ä. auf der Startseite
   verlangt).

Für jede Frage, bei der die Prüfung ein echtes Risiko sieht (nicht nur
theoretisch, sondern konkret): den `source`-Text in der jeweiligen
themenquiz/<topic>.json so umschreiben, dass er eindeutig eine eigene,
unabhängige Kurzformulierung ist (nicht am Wortlaut der Quelle klebend),
der Link selbst bleibt bestehen. Nutze Gwen/Cline für das mechanische
Umschreiben vieler ähnlicher Fälle, wie in Runde 15 etabliert — aber
prüfe wieder jedes Ergebnis (siehe die dort dokumentierten Gwen-
Fehlerbilder, u.a. erfundene Quellen, Anhängen statt Ersetzen, BOM-
Korruption).

Schritt 3 — Bildrechte komplett neu verifizieren: für jeden Eintrag in
src/assets/bilder/bildnachweise.json die echte Wikimedia-Commons-
Dateiseite (sourceUrl) neu öffnen, Lizenzbox, Autor und Attribution-Text
gegen die gespeicherten Werte prüfen (nicht der alten Recherche
vertrauen — Commons-Metadaten können sich ändern). Bei Rechenchecks
Wikimedia-Rate-Limit beachten (HTTP 429 bei zu vielen parallelen
Anfragen — sequenziell mit kurzen Pausen prüfen, siehe Erfahrung aus
früheren Bild-Recherche-Runden in Ki Datenspeicher/14-Gwen-Code-
Aufgaben/14-Rechentrainer-Umbau.md).

Schritt 4 — Neue Seite "Rechte an Quellen und Bildern" bauen (neues
Modul src/app/rechte/ oder ähnlich, Route ergänzen, Link im Dashboard-
Footer neben Bildnachweise/Quellenverzeichnis), die zusammenfasst:
- Pro Domain-Kategorie: rechtliche Einordnung in 1-2 Sätzen.
- Bei den zehn häufigsten Domains: jeweils eigener Absatz.
- Bildrechte: Ergebnis der Neu-Verifikation (bestätigt / geändert /
  auffällig), mit Verweis auf die Original-Commons-Seite je Bild.
- Ein klar sichtbarer Hinweis: Diese Einschätzung ist eine KI-gestützte
  Recherche, keine Rechtsberatung — bei Unsicherheit einen Anwalt
  konsultieren, bevor die App kommerziell/öffentlich genutzt wird.

Bitte sehr sorgfältig arbeiten (das war Tims explizite Vorgabe), aber
nicht übertreiben — Tim kontrolliert die Ergebnisse später selbst noch
einmal. Alles wie gewohnt im Obsidian-Vault dokumentieren (neue
nummerierte Datei in Ki Datenspeicher/14-Gwen-Code-Aufgaben/, Update-Log,
Offene-Punkte).
```
