---
tags: [modul, dashboard]
autor: Claude
---

# Modul: Dashboard

Pfad: `src/app/dashboard/` (`dashboard.page.ts/.html/.scss`, `dashboard.module.ts`,
`dashboard-routing.module.ts`)

Die einzige Landingpage der App (Route `''` leitet direkt hierhin um).

- Zeigt eine Kachel-Übersicht aller Lerninhalte: zwei hartcodierte Arrays in
  `dashboard.page.ts` — `quizTopics` (10 Themenquiz-Einträge mit `topicId`/
  `questionCount`) und `extraTiles` (4 Zusatzmodul-Einträge).
- Client-seitige Suche über die Kacheln.
- Berechnet Fortschrittsstatistiken direkt aus `localStorage`
  (Keys wie `themenquiz-progress-<topicId>`), ohne Backend-Aufruf.
- Hat **keine** Kindrouten mehr (kein Lernfeld-Bereich mehr, siehe
  [[04-Lernfelder/Lernfelder-Übersicht]]).

Wenn neue Themenquiz oder Zusatzmodule hinzugefügt werden, müssen sie manuell in
diese beiden Arrays in `dashboard.page.ts` eingetragen werden.
