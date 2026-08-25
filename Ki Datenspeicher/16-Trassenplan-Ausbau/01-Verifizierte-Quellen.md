---
tags: [trassenplan, beispielplaene, quellen, verifiziert]
autor: Claude
status: laufend
---

# Verifizierte Quellen für die Trassenplan-Erweiterung

Kuratierte Auswertung der 77 Kandidaten-Links aus den fünf Gwen-Recherche-
Batches in diesem Ordner (`Batch-01` bis `Batch-05`). Alle 77 URLs wurden
per HTTP-Statuscheck geprüft (nur 5 echte 404 von 77 — ungewöhnlich hohe
Trefferquote dank verschärfter Anti-Fabrikations-Anweisung + Pflicht-
Selbsttest, siehe [[../00-Start-Hier]]). Die folgenden Quellen wurden
zusätzlich inhaltlich per Volltext-Extraktion (`pdftotext`) gegengeprüft —
nicht nur der Titel/die Gwen-Beschreibung wurde übernommen.

## Top-Fund: EBA Muster-Legendenheft

**https://www.eba.bund.de/SharedDocs/Downloads/DE/PF/LFAntragsunterlagen/Anhang_III/51_III_Muster-Legendenheft.pdf**

Offizielles Dokument des Eisenbahn-Bundesamts (Referat 51, Stand März 2023).
Enthält für **19 verschiedene Planarten** (Übersichtskarte, Übersichtslageplan,
Lageplan, Grunderwerbsplan, Bauwerksplan, Höhenplan, Querschnitt,
Baustelleneinrichtungs- und Erschließungsplan, Kreuzungsplan,
Markierungs- und Beschilderungsplan, Schleppkurvenplan, Kreuzungsplan
Straßenplanung, Kabel- und Leitungslageplan, Spurplanskizze,
Trassierungslageplan, Bestands- und Konfliktplan, Maßnahmenplan,
Übersichtslageplan/Lageplan Zuwegungskonzept) jeweils die exakten
Farbcodes (RGB), Linienarten und Strichstärken. Durchgängiges Farbschema:
**Bestand = Grau (137/137/137), Neubau/Änderung = Rot (255/0/0), Rückbau =
Gelb/Orange (255/191/0)**. Im Höhenplan werden Neigungsbrechpunkte mit
km, hTS (Höhe Tangentenschnittpunkt), H (Ausrundungshalbmesser), T
(Tangentenlänge) und f (Stichhöhe) beschriftet; Übergänge heißen
"Ausrundungsbeginn Wanne" / "Ausrundungsende Kuppe". Verweist für
zusätzliche Symbole auf Richtlinie 885.01 "Vorhaltung technischer
raumbezogener Bestandsdaten". **Als amtliches Werk (§ 5 UrhG) gemeinfrei
— unbedenklich als Quelle.** → 8 neue Fragen (trassenplan-n1 bis n6, n17,
n18) plus eine eigene SVG-Legendengrafik.

## Zweiter Top-Fund: TU Dresden, Beleg "Strecken- und Bahnhofsentwurf"

**https://tu-dresden.de/bu/verkehr/ibv/schienenfahrwege/ressourcen/dateien/download_gvb/belege/beleg-strecken--und-bahnhofsentwurf_ap.pdf?lang=de**

Übungsunterlage der Professur für Gestaltung von Bahnanlagen (Fakultät
Verkehrswissenschaften "Friedrich List"). Enthält konkrete Formeln
(Mindestelementlänge, Mindestradius, Regelüberhöhung) mit echten
Grenzwerten: r ≥ 150 m (freizügig befahrbare Gleise), r ≥ 180 m
(Nebenbahn-Hauptgleise Neubau), r ≥ 300 m (Hauptbahn-Hauptgleise Neubau),
r ≥ 500 m (Bahnsteige an Bogeninnenseite). Erklärt den Unterschied
zwischen "Topologischem" (ohne Maßstab) und "Topografischem" (1:1.000)
Bahnhofslageplan, die Konvention "Kilometrierung steigt von links nach
rechts", die Kennzeichnung stillgelegter Gleise (Schraffur), und liefert
ein echtes Weichenbezeichnungs-Beispiel ("EW 60 – 300 – 1:9"). → 7 neue
Fragen (trassenplan-n7 bis n13).

## Dritter Fund: Leitfaden Trassierung (open-layout-tool.org)

**https://open-layout-tool.org/Leitfaden_Trassierung.pdf**

Frei verfügbarer Leitfaden von Jonathan Wolf, "in Anlehnung an DB-Ril
800.0110 und TSI Infrastruktur". Enthält Tabellen zu Mindestelementlängen
nach Geschwindigkeit (rechnerisch konsistent: l = 0,15 · v bei
70–100 km/h, z. B. 15 m bei 100 km/h), Sonderfall 40 km/h (4 m bei
gleichgerichteten Bögen), Verweis auf TSI Infrastruktur Anlage I Tabelle
43. → 3 neue Fragen (trassenplan-n14 bis n16).

## Vierter und fünfter Fund (zweite Auswertungsrunde)

- **Fehmarnbelt-Schienenanbindung, Präsentation zur Offenlage**
  (`www.anbindung-fbq.de/.../250612_Praesentation_Offenlage_FSQ.pdf`):
  bestätigt unabhängig das Farbschema aus dem EBA-Legendenheft (Rot =
  Neubau, Gelb = Rückbau) und ergänzt eine weitere Kategorie: **Lila =
  nicht realisierte Planung aus einem früheren Verfahrensabschnitt**
  (PFA 5.2/PFA 6). Liefert außerdem eine klare Definition des
  Bauwerksverzeichnisses. → 2 neue Fragen (trassenplan-n19, n20).
- **TU Graz, Diplomarbeit "Trassierung in der Straßenbahn- und
  Eisenbahnplanung"** (Dario Bilic, 2024, Institut für Eisenbahnwesen
  und Verkehrswirtschaft, `repository.tugraz.at/.../75083.pdf`):
  definiert die Bahnachse (Trassenmittellinie) sowie die Unterscheidung
  zwischen statischen (geschwindigkeitsunabhängigen) und dynamischen
  (geschwindigkeitsabhängigen) Trassierungsvariablen. → 2 neue Fragen
  (trassenplan-n21, n22).

## Weitere geprüfte, aber (noch) nicht verwendete Funde

Echte, live Dokumente mit Bahnbezug — inhaltlich noch nicht per
Volltext-Extraktion ausgewertet, für eine mögliche weitere
Erweiterungsrunde vorgemerkt:

- `map.geo.bs.ch/.../situation_6139.pdf` — echter Lageplan Verkehrsanlagen
  ABS/NBS Karlsruhe-Basel PfA 9.3 mit Legende (Erkundungsprogramm/
  Aufschlüsse), Maßstab 1:1.000, Kanton Basel-Stadt Geoportal. Eng
  thematisch (nur Bohrpunkte), aber echtes offizielles Beispiel.
- `www.h-ka.de/.../GUN_2109_Claus-Thesis.pdf` — HS Karlsruhe Abschlussarbeit
  zur Trassenplanung mit ProVI-Software.
- `www.eba.bund.de/SharedDocs/Downloads/DE/PF/Beschluesse/...` (zwei
  echte Planfeststellungsbeschlüsse, Rastatt-Tunnel und Schliengen
  Karlsruhe-Basel) — primär Verwaltungstext, evtl. mit Plan-Anlagen.
- `www.plaene-bahnprojekt-stuttgart-ulm.de/...` — Portal mit vollständigen
  Planfeststellungsunterlagen zu Stuttgart 21 (Ordnerstruktur, nicht
  einzeln durchsucht).

## Verworfene Kategorien

- **Reine Netz-/Fahrplankarten** (bahn.de Streckennetz, kompf.de
  Eisenbahnkarte, dbinfrago Streckennummernkarte, VBB/S-Bahn-Liniennetze):
  schematische Übersichtskarten, keine Bau-/Trassenpläne im engeren Sinn
  — nicht verwendet.
- **Modelleisenbahn-Foren** (stummiforum.de, h0-modellbahnforum.de,
  forum-modellbahn.com, 1zu160.net, community.3d-modellbahn.de): live,
  aber Nutzerinhalte mit unklarer fachlicher Verlässlichkeit — nicht als
  Quelle für Fakten verwendet, allenfalls für spätere allgemeinverständliche
  Erklärtexte interessant.
- **Allgemeine Bau-Lagepläne ohne Bahnbezug** (vermessung-kms.de
  Musterlageplan/BDVI, bdvi.de) — echte, gute Dokumente, aber zur
  Bauvorlagenverordnung (allgemeines Baurecht), nicht spezifisch
  Gleisbau/Eisenbahn — nicht verwendet.
- **Kostenpflichtige/nicht öffentlich einsehbare Angebote**
  (deutschebahn.com Lageplan-Bestellservice, onlineportal.extranet.
  deutschebahn.com) — nicht verwendet.

## Bildrechte-Einschätzung

Keiner der gefundenen echten Pläne (EBA-Beschlüsse, DB-Planfeststellungs-
unterlagen, Universitäts-PDFs) hat eine explizite freie Lizenz, die eine
Bildübernahme in die App zweifelsfrei "auch kommerziell nutzbar" erlauben
würde — anders als bloßes Verlinken (siehe
[[../14-Gwen-Code-Aufgaben/18-Rechte-an-Quellen-und-Bildern]]) wäre die
Übernahme eines Plan-Ausschnitts als Bild eine echte Vervielfältigung.
Amtliche Werke wie der Beschlusstext selbst sind zwar gemeinfrei, die
darin enthaltenen technischen Zeichnungen der Vorhabenträger (DB) aber
nicht zweifelsfrei. **Deshalb: keine Bildübernahme aus diesen PDFs.**
Stattdessen wurde eine eigene, faktenbasierte SVG-Grafik erstellt
(`src/assets/bilder/trassenplan-legende-bnr.svg`) — vollständig
selbst gezeichnet, keine Lizenzfrage, beliebig (auch kommerziell)
nutzbar. Details siehe Runden-Protokoll.
