---
tags: [bahnspiel-3d, uebergabe, meta]
autor: Claude
datum: 2026-10-19
---

# Übergabe für den nächsten Chat (Stand 2026-10-19)

## Startprompt (in den neuen Chat kopieren)

> Projekt: E:\Gleisbau-Lernwelt (Ionic/Angular-Lern-App für Gleisbau-Azubis). Lies zuerst
> "Ki Datenspeicher/00-Start-Hier.md" (Kurzfassung ganz oben), dann
> "Ki Datenspeicher/20-Bahnspiel-3D-Assets/Uebergabe-naechster-Chat.md" und den Update-Log-Eintrag 2026-10-19.
> Server-Zugang: `ssh swaggypotter@192.168.0.102` (Key eingerichtet), Deploy-Befehle stehen in der Memory-Datei
> server_deployment_michiserver. Git: Tim pusht selbst per GitHub Desktop; es ist noch NICHTS committet (siehe Liste unten).
> Arbeitsweise: nach jedem Frontend-Deploy per Headless-Browser (Skill browser-automation, Login gleisbau / Gate-Passwort aus
> der Memory-Datei) prüfen, dass die Seite nach dem Login lädt. Gwen läuft nicht mit — vor Gwen-Aufträgen Modell laden
> (tools/gwen-modell-laden.cmd). Nächste Aufgaben: siehe „Offen“.

## Zustand der App (live auf app.gleisbau-digital.org)

- **Startseite `/dashboard`** = Handy-Homescreen (Icons in farbigen Ordnern, Suche, Ordner „Mehr“ mit Forum/Offline/3D-Modelle). Header nur noch Online-Anzeige, Design, Konto, Abmelden, Admin-Links. Code: `src/app/dashboard/*` (`gruppen`-Getter ist **gecacht** — nie wieder neue Objekte pro Change-Detection liefern, das ließ den Tab abstürzen).
- **3D:** Babylon.js v7. Hülle `src/app/shared/engine3d/engine3d.ts`, Modellliste `modell-katalog.ts`, Seite `src/app/modelle/` (Route `/modelle`). GLB in `src/assets/modelle/{kenney,oga}/`. Zwingend: `engine.disableUniformBuffers = true`. Seite räumt in `ionViewWillLeave`/`ngOnDestroy` auf, `ionViewWillEnter` startet neu.
- **Asset-Review:** `/bahnspiel-assets` (Daten `src/assets/bahnspiel-assets/assets.json`, Vorschaubilder `img/`). Tims Auswahl: [[Entscheidungen-Tim]]. Auswahl liegt nur in dessen localStorage (nicht auf dem Server).
- **Quiz:** Thema „Schienen“ 24 Fragen, neue Bildfragen `schiene-f1..f5`. Bildregister `src/assets/bilder/bildnachweise.json`.
- **Tycoon:** `src/app/modules/zusatz/tycoon/tycoon-engine.ts`, Lok-Typen in `TRAINS`. 2D-Canvas, nutzt die 3D-Modelle noch nicht.
- **Gate:** Caddy gibt `/assets/*` nur mit Cookie `glw_gate` aus; `syncGateCookie()` verwirft veraltete gespeicherte Passwörter. Seite bleibt komplett privat bis ein Impressum existiert (Memory: projekt_privatsphaere_bis_impressum).

## Uncommittete Änderungen (Tim muss committen/pushen)
Geändert: `package.json`/`package-lock.json` (Babylon), `app-routing.module.ts`, `site-gate.component.ts`, Dashboard (html/scss/ts), `tycoon-engine.ts`, `bildnachweise.json`, `themenquiz/schiene.json`, `topics.json`.
Neu: `src/app/{bahnspiel-assets,modelle,shared/engine3d}/`, `src/assets/{bahnspiel-assets,modelle}/`, `src/assets/bilder/schienenfehler-*`, `tools/bahnspiel-assets/`, `Ki Datenspeicher/20-Bahnspiel-3D-Assets/`, `tools/wissensbibliothek/{state.json,lauf2.err,lauf3.err}`.
(Repo ist öffentlich: nur CC0/PD-Assets liegen drin, außer dem Riffel-Foto CC BY-SA 4.0 — Credit steht im Bildnachweis, in einer App-Credits-Seite noch nicht.)

## Offen / Ideen (Priorität grob absteigend)
1. Alles committen lassen; Credits für CC0-/CC-BY-SA-Material auf `/bildnachweise` bzw. `/rechte` ergänzen (3D-Modelle fehlen dort noch).
2. 3D-Modelle ins **Tycoon** einbauen (Loks je Typ, Gleisansicht) — Spielidee Tims: alte Dampfloks billig, weniger Mietertrag; Quizaufgabe „Schwellenabstand einstellen“ (Regelabstand vorher belegen, Thema B06).
3. Diorama-Optik (Kamera, Boden, evtl. Kurven/Weichen aus dem Kenney Kit; Kit hat 103 GLB, davon 28 eingebunden).
4. Fachbelege für die neuen Schienenfehler-Fragen (aktuell nur Commons-Dateiseiten als Quelle); Begriffe Squat/Head Checks/Riffeln/Flachstelle sauber abgrenzen.
5. Gwen-Recherche zu Ordner 20 neu starten (`node tools/bahnspiel-assets/run-recherche.cjs --minutes 90` per PowerShell Start-Process; Modell vorher laden) — oder weglassen, da Claude den Katalog selbst geprüft hat.
6. Blender-Addon-Lizenzen (Auto Rails, 3DT, Ryan King) prüfen, bevor etwas daraus ins Repo kommt.
7. Persistente (serverseitige) Speicherung von Tims Asset-Auswahl, falls gewünscht (Backend-Deploy nötig).
8. Backend-Redeploy für Zod/Postgres-Enum (Themes 2026-09-23) steht weiter aus.

## Fallstricke dieser Session
- Kenney-Download: nur mit Referer `https://kenney.nl/assets/train-kit` (ohne → 403). Gwen-Fetch hat dieselben Probleme wie bei Commons.
- Vor jedem Deploy `ng build` prüfen: ein fehlgeschlagener Build + `rm -rf frontend-dist/*` = leere Seite (404). Reihenfolge: bauen, `www/index.html` prüfen, erst dann löschen/hochladen.
- Headless-Test: `page.evaluate` läuft in patchright in einer isolierten Welt (kein `window.__x` der App sichtbar) — Debug-Daten per `addScriptTag` ins DOM schreiben. WebGL dort = Software-GL.
- „X online“ zählt Browser-IDs der letzten 5 Minuten; eigene Testläufe erhöhen die Zahl.
- Bash-Heredocs mit vielen Sonderzeichen scheiterten mehrfach (`unexpected EOF`) → Dateien mit dem Write-Tool schreiben.
- Tims Fachbegriffe prüfen: Squat ≠ Flachstelle, Head Checks ≠ Riffeln (siehe Entscheidungen-Tim).
