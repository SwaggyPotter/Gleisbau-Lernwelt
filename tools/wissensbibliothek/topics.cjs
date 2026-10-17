// Themenliste der Gleisbau-Wissensbibliothek (Vault-Ordner 19). Reihenfolge = Prioritaet.
// Neue Wellen: Eintraege anhaengen, `node generate-topics.cjs` ausfuehren (ueberschreibt NIE vorhandene Dateien).
// Hinweis: Nummern in den Fragen sind KANDIDATEN aus Claudes Gedaechtnis (ungeprueft) - Gwen soll sie pruefen, nicht uebernehmen.
module.exports = [
 // ---- A: Regelwerke (Prioritaet laut Tim: alle offiziell zugaenglichen DB-Richtlinien) ----
 ['A01','Regelwerk-Zugang-DB-InfraGO','Wo und wie sind DB-Regelwerke (Richtlinien) offiziell zugaenglich?',[
  'Auf welchen offiziellen Seiten der DB InfraGO AG (frueher DB Netz AG) bzw. im DB-Fahrweg-Regelwerk sind Richtlinien (Ril) oeffentlich und kostenlos abrufbar? Nenne exakte URLs.',
  'Wie ist die Nummernsystematik der DB-Richtlinien aufgebaut (Reihe, Modul, z. B. 800.0110) und welche Reihen sind fuer den Gleisbau relevant?',
  'Welche Nutzungsbedingungen/Urheberrechtshinweise gelten fuer die online veroeffentlichten Regelwerke (darf man daraus zitieren, verlinken, kopieren)?',
  'Gibt es ein Verzeichnis/eine Uebersicht aller Richtlinien (Regelwerksverzeichnis, Ril-Liste) mit Ausgabestaenden? Link angeben.']],
 ['A02','Ril-800-Netzinfrastruktur-entwerfen','DB Ril 800 (Netzinfrastruktur technisch entwerfen): Linienfuehrung, Trassierung, Gleisgeometrie',[
  'Welche Module der Richtlinienreihe 800 (z. B. 800.0110 Linienfuehrung, 800.0120 Gleisgeometrie/Trassierung) gibt es, mit exaktem Titel und Ausgabestand?',
  'Welche Grenzwerte fuer Gleisbogenradien, Ueberhoehung, Ueberhoehungsfehlbetrag und Rampen nennt die Ril 800 (nur belegte Zahlen mit Quelle)?',
  'Wo ist die Ril 800 offiziell abrufbar (URL)? Welche Teile sind frei zugaenglich?',
  'Wie haengt die Ril 800 mit der EBO und der TSI Infrastruktur zusammen?']],
 ['A03','Ril-820-824-Oberbau-Fahrbahn','DB-Richtlinien zu Oberbau/Fahrbahn: Bauen, Instandhalten, Gleislage (Reihen 820, 821, 824 u. a.)',[
  'Welche DB-Richtlinien regeln Oberbau/Fahrbahn (Kandidaten: Reihen 820, 821, 824; bitte tatsaechlich pruefen, nichts raten) mit Titel, Nummer, Ausgabestand?',
  'Was regeln diese Richtlinien inhaltlich (Oberbauformen, Schienen, Schwellen, Schweissen, Gleislage, Instandhaltungsgrenzwerte)?',
  'Welche Toleranzen/Grenzwerte fuer die Gleislage (Spurweite, Ueberhoehung, Verwindung, Pfeilhoehe) nennen sie? Nur belegte Zahlen mit Fundstelle.',
  'Wo sind diese Richtlinien oeffentlich abrufbar (URL)?']],
 ['A04','Ril-836-Erdbauwerke-Bahnkoerper','DB Ril 836 Erdbauwerke und sonstige geotechnische Bauwerke: Planum, Schutzschicht, Bahnkoerper',[
  'Was regelt die Ril 836 (Titel, Module, Ausgabestand)? Ist sie offiziell abrufbar (URL)?',
  'Welche Anforderungen stellt sie an Planum, Frostschutzschicht, Schutzschicht und Verdichtung (belegte Zahlen, z. B. Ev2-Werte)?',
  'Wie ist der Bahnkoerper aufgebaut (Unterbau, Untergrund, Planumsschutzschicht, Bettung) laut Regelwerk?',
  'Welche Regeln gelten fuer Entwaesserung des Bahnkoerpers?']],
 ['A05','Bahnuebergaenge-Ril-815-862','Bahnuebergaenge: Regelwerk (EBO, EKrG, DB-Richtlinie 815 / 862) und Gleisbau am Bahnuebergang',[
  'Welche DB-Richtlinie regelt Bahnuebergaenge (Kandidaten: Ril 815 Bahnuebergangsanlagen; Ril 862; bitte pruefen) mit Titel und Ausgabestand?',
  'Welche Rechtsgrundlagen gelten (EBO-Paragraphen, Eisenbahnkreuzungsgesetz EKrG) fuer Bahnuebergaenge?',
  'Welche Bauarten von Bahnuebergangs-Belaegen gibt es im Gleisbau (Gummi, Beton, Platten, Holz) und was ist beim Einbau zu beachten?',
  'Welche Sicherungsarten gibt es (Lichtzeichen, Halbschranke, Vollschranke, Andreaskreuz)?']],
 ['A06','Ingenieurbauwerke-Bruecken-Tunnel','Ingenieurbauwerke an der Strecke: Bruecken, Tunnel, Durchlaesse (Ril 804, 805, 853 u. a.)',[
  'Welche DB-Richtlinien regeln Eisenbahnbruecken und Tunnel (Kandidaten: Ril 804, 805, 853; bitte pruefen) mit Titel und Ausgabestand?',
  'Welche Besonderheiten hat der Gleisbau auf Bruecken (Schienenauszugsvorrichtung, Brueckenoberbau, Schotter auf Bruecken)?',
  'Welche Besonderheiten hat der Gleisbau in Tunneln (Feste Fahrbahn, Rettungswege, Gleisabstand)?',
  'Wo sind die Richtlinien oeffentlich abrufbar?']],
 ['A07','Arbeitssicherheit-im-Gleisbereich','Sicherheit bei Arbeiten im Gleisbereich: Sicherungsmassnahmen, Sicherungsplan, Sicherungsposten',[
  'Welche DB-Richtlinie regelt Sicherungsmassnahmen bei Arbeiten im Gleisbereich (Kandidat: Ril 132 / Konzernrichtlinie 132.0118, 132.0123; bitte pruefen) mit Titel und Ausgabestand?',
  'Welche Sicherungsarten gibt es (Sicherungsposten, Rottenwarnanlage, Sperrung, Sicherungsfachkraft/Sipo, Bahnerdung) und welche Funktion haben sie? Mit Quelle.',
  'Wie lauten die Schutzziele/Regeln (Sicherheitsabstand, Warnzeit, Fluchtweg, Warnkleidung)? Nur belegte Angaben mit Fundstelle.',
  'Welche Qualifikationen/Ausbildungen sind fuer Sicherungspersonal vorgeschrieben (z. B. Sicherungsaufsicht, Sicherungsposten)?']],
 ['A08','Bahnstrom-Oberleitung-Bahnerdung','Elektrische Gefahren: Oberleitung (15 kV 16,7 Hz), Bahnerdung, Schutzabstaende',[
  'Welche Regelwerke gelten fuer Arbeiten in der Naehe der Oberleitung (Kandidaten: Ril 997, DIN VDE 0115, DGUV)? Titel/Nummer/Ausgabestand.',
  'Welche Schutzabstaende zu Oberleitungsbauteilen gelten fuer Gleisbauarbeiten (belegte Zahlen)?',
  'Wie funktioniert die Bahnerdung (wer, wann, wie), welche Regeln gelten?',
  'Welche Rolle haben Elektrofachkraft und Bahnstrom-Abschaltung bei Gleisbauarbeiten?']],
 ['A09','Signalbuch-Fahrdienstvorschrift','Signalbuch (Ril 301) und Fahrdienstvorschrift (Ril 408): fuer Gleisbau relevante Signale und Betriebsregeln',[
  'Welche Gleisbau-relevanten Signale und Zeichen gibt es (Sperrsignale, Haltezeichen, Langsamfahrsignale, Rottenwarnsignale, Achtungspfiff) laut Signalbuch?',
  'Was ist eine Sperrfahrt und wie laeuft sie im Gleisbau ab (Ril 408 / Betra)?',
  'Wie werden Langsamfahrstellen (La-Signale) gekennzeichnet und wer verfuegt sie?',
  'Wo sind Signalbuch/Fahrdienstvorschrift oeffentlich abrufbar?']],
 ['A10','Betra-Sperrpausen-Baubetrieb','Betriebs- und Bauanweisung (Betra), Sperrpausen, Baubetriebsplanung',[
  'Was ist eine Betra (Betriebs- und Bauanweisung), wer erstellt sie, was steht darin? Quelle.',
  'Wie funktionieren Sperrpausen, Gleissperrungen und Baufahrplaene (Begriffe, Ablauf)?',
  'Welche Rolle haben Bauueberwacher, Betriebsleiter, Sicherheitskoordinator auf Baustellen?',
  'Welche Richtlinie regelt Baubetrieb im Netz (Kandidat: Ril 406, 132.xxxx; bitte pruefen)?']],
 ['A11','Gesetze-EBO-ESBO-AEG','Rechtsrahmen: Eisenbahn-Bau- und Betriebsordnung (EBO), AEG, ESBO, BOA, EBA',[
  'Welche EBO-Paragraphen sind fuer Gleisbau/Oberbau/Gleisgeometrie einschlaegig (z. B. Spurweite, Ueberhoehung, Halbmesser, Bahnkoerper)? Paragraph + Kernaussage + Link auf gesetze-im-internet.de.',
  'Was sind AEG, ESBO, BOA und EBA (Zustaendigkeit, Kernaufgabe)? Mit offizieller Quelle.',
  'Wo liegen die Grenzen EBO (Vollbahn) vs. BOStrab (Strassenbahn) im Gleisbau?',
  'Welche Unfallverhuetungsvorschriften/Arbeitsschutzgesetze gelten fuer Gleisbaustellen?']],
 ['A12','Normen-DIN-EN-Gleisbau','DIN/EN-Normen und TSI fuer Gleisbau (Schienen, Schwellen, Befestigung, Schotter, Schweissen, Gleislage)',[
  'Welche Normen gelten fuer: Schienen (EN 13674), Schienenbefestigung (EN 13481, EN 13146), Betonschwellen (EN 13230), Gleisschotter (EN 13450), Schweissen (EN 14587), Gleislage (EN 13848)? Exakter Titel + Teilnummer + Ausgabejahr, Quelle (DIN-Media/Beuth/EU).',
  'Welche TSI (Technische Spezifikation fuer die Interoperabilitaet) betreffen Infrastruktur/Oberbau (TSI INF)? Link auf EUR-Lex.',
  'Welche Normen betreffen Weichen (EN 13232) und Gleisbau-Messungen?',
  'Welche UIC-Merkblaetter sind fuer Oberbau wichtig (UIC 700, 719, 864, 860)? Titel und Gegenstand.']],
 ['A13','DGUV-BG-BAU-Gleisbau','Arbeitsschutz: DGUV Vorschriften und Regeln, BG BAU Gleisbau-Regeln',[
  'Welche DGUV-Vorschriften/-Regeln gelten fuer Arbeiten im Gleisbereich (z. B. DGUV Vorschrift 78 Bauarbeiten im Gleisbereich bzw. Nachfolger, DGUV Regel 101-xxx)? Nummer, Titel, Ausgabestand, Link.',
  'Was regelt die Branchenregel/Handlungshilfe der BG BAU zum Gleisbau?',
  'Welche persoenliche Schutzausruestung (PSA) ist vorgeschrieben (Warnkleidung nach DIN EN ISO 20471, Gehoerschutz, Sicherheitsschuhe)?',
  'Welche Pflichten haben Unternehmer und Beschaeftigte laut diesen Vorschriften?']],
 ['A14','Lieferbedingungen-Oberbaumaterial-DBS','DB-Lieferbedingungen und Technische Lieferbedingungen (TL/DBS) fuer Oberbaumaterial',[
  'Welche technischen Lieferbedingungen (TL) und DB-Standards (DBS) gelten fuer Schienen, Schwellen, Kleineisen, Schotter, Weichen (z. B. DBS 918; nur belegte Nummern)?',
  'Wo sind Lieferbedingungen/Normen der DB zugaenglich (Beschaffungsportal, Veroeffentlichung)?',
  'Welche Schienenprofile und -guetegruppen sind in DB-Vorgaben zugelassen (S49, 60E1, R260, R350HT)?',
  'Welche Schwellenarten sind zugelassen (Holz, Beton B70/B90/B03, Stahl) laut DB-Vorgaben?']],
 // ---- B: Fachthemen ----
 ['B01','Gleisgeometrie-Trassierung','Gleisgeometrie: Gerade, Kreisbogen, Uebergangsbogen, Ueberhoehung, Rampe',[
  'Definition und Zweck von Ueberhoehung, Ueberhoehungsrampe, Uebergangsbogen, Ueberhoehungsfehlbetrag; typische Formeln mit Quelle.',
  'Welche Mindestradien und Hoechstwerte (Ueberhoehung max.) gelten auf Hauptbahnen in Deutschland (EBO/Ril 800, belegt)?',
  'Welche Bogenformen gibt es (Klothoide, Bloss-Kurve, S-Kurve) und wo werden sie eingesetzt?',
  'Wie wird die Gleislage im Bogen aufgenommen und abgesteckt (Pfeilhoehenverfahren, Koordinaten)?']],
 ['B02','Weichen-und-Kreuzungen','Weichen und Kreuzungen: Bauformen, Bauteile, Einbau',[
  'Welche Weichenbauformen gibt es in Deutschland (EW 60-300-1:9, EW 49-190-1:7,5, Kreuzungsweichen, Einfache Kreuzungsweiche) und was bedeuten die Kennzahlen?',
  'Welche Bauteile hat eine Weiche (Zunge, Backenschiene, Herzstueck, Radlenker, Stellvorrichtung, Weichenschwellen) mit Funktion?',
  'Wie wird eine Weiche eingebaut/ausgewechselt (Verfahren, Maschinen, Dauer)?',
  'Welche Pruef- und Instandhaltungsmassnahmen gibt es an Weichen?']],
 ['B03','Schienen-Profile-Guetegruppen','Schienenprofile und -guetegruppen',[
  'Welche Schienenprofile sind in Deutschland ueblich (S49, S54, 60E1/UIC60, 54E...), mit Masse pro Meter, Hoehe, Fussbreite?',
  'Welche Stahlsorten/Guetegruppen gibt es (R200, R260, R260Mn, R350HT, R350LHT, R400HT) und wofuer?',
  'Wie werden Schienen gekennzeichnet (Walzzeichen, Pruefzeichen)? Wie liest man ein Schienenkopfzeichen?',
  'Typische Schienenfehler und Verschleissformen (Riffeln, Head Checks, Squats, Abplatzungen) mit Erklaerung.']],
 ['B04','Schienenschweissen','Schienenschweissen: Verfahren, Ablauf, Abnahme',[
  'Welche Schweissverfahren werden im Gleis genutzt (aluminothermisches Schweissen / Thermit, Abbrennstumpfschweissen, Lichtbogenhandschweissen) mit Ablauf?',
  'Welche Vorschriften/Normen/Richtlinien gelten (EN 14730, DB-Richtlinien, Schweisserpruefung)? Nur belegte.',
  'Welche Qualitaetspruefungen gibt es (Sichtpruefung, Ultraschall, Richtlineal-Pruefung)?',
  'Welche Arbeitsschutzregeln gelten beim Thermitschweissen?']],
 ['B05','Lueckenlos-verschweisstes-Gleis','Lueckenlos verschweisstes Gleis (LWS): Spannungsfreitemperatur, Verspannen, Gleisverwerfung',[
  'Was ist ein lueckenlos verschweisstes Gleis, was ist die Spannungsfreitemperatur (Neutraltemperatur) und welche Werte gelten (belegt)?',
  'Wie wird verspannt (Schienenspannegeraet, Erwaermungsverfahren) und wie dokumentiert?',
  'Was ist eine Gleisverwerfung (Sonnenschlange), Ursachen und Gegenmassnahmen?',
  'Welche Regeln gelten fuer Arbeiten an LWS-Gleisen (Temperaturbereiche, Sperrfristen)?']],
 ['B06','Schwellen-Holz-Beton-Stahl','Schwellen: Holz, Beton, Stahl, Kunststoff',[
  'Welche Schwellenarten gibt es in Deutschland und ihre typischen Abmessungen/Gewichte (Beton B70, B90, B03, Holz Eiche/Buche, Stahl Y-Schwelle, Kunststoff)? Mit Quelle.',
  'Welche Vor- und Nachteile hat jede Schwellenart (Lebensdauer, Verlagerungswiderstand, Kosten)?',
  'Welcher Schwellenabstand ist ueblich (z. B. 60 cm, 65 cm)? Wieviele Schwellen pro km?',
  'Umweltaspekte: Entsorgung teeroelbehandelter Holzschwellen (Regeln).']],
 ['B07','Schotterbett-Bettung','Gleisschotter und Bettung: Aufbau, Koernung, Anforderungen',[
  'Welche Koernung hat Gleisschotter (31,5/63 mm), welche Gesteinsarten werden verwendet, Anforderungen nach EN 13450 (belegt)?',
  'Welche Bettungsstaerken gelten (unter Schwelle, Schulter, Gesamthoehe) laut Regelwerk?',
  'Aufgaben der Bettung (Lastverteilung, Entwaesserung, Lagestabilitaet, Schallabsorption).',
  'Bettungsreinigung und Schotterwechsel: Verfahren und Maschinen.']],
 ['B08','Planum-Schutzschicht-Entwaesserung','Unterbau: Planum, Frostschutz, Planumsschutzschicht, Entwaesserung',[
  'Aufbau des Bahnunterbaus von oben nach unten mit typischen Dicken (Quelle Regelwerk).',
  'Welche Anforderungen an Tragfaehigkeit (Ev2, Verdichtungsgrad) gelten?',
  'Entwaesserungseinrichtungen am Bahnkoerper (Graben, Draenage, Kabeltrog, Querneigung) und Regeln.',
  'Typische Schaeden (Schlammstellen, Frosthebung) und Sanierung.']],
 ['B09','Gleisbaumaschinen','Gleisbaumaschinen: Stopfmaschine, Planiermaschine, Stabilisator, Schotterreinigung, Umbauzug, Gleisbaukran, Zweiwegefahrzeuge',[
  'Welche Gleisbaumaschinen gibt es und was leisten sie (Universalstopfmaschine, Planiermaschine, Dynamischer Gleisstabilisator, Bettungsreinigungsmaschine, Schnellumbauzug, Zweiwegebagger, Gleisbaukran)? Hersteller wie Plasser & Theurer, Matisa, Harsco mit Quellen.',
  'Wie arbeitet eine Stopfmaschine (Prinzip, Stopfaggregate, Hebe-Richt-Einrichtung)?',
  'Welche Anforderungen/Zulassungen gelten fuer Maschinen im Netz der DB (Zulassung, Maschinenfuehrer)? Nur belegte.',
  'Welche Sicherheitsregeln gelten beim Einsatz (Arbeitsbereich, Einweiser)?']],
 ['B10','Handwerkzeuge-Kleingeraete','Gleisbau-Handwerkzeuge und Kleingeraete',[
  'Welche Handwerkzeuge/Kleingeraete gibt es (Schienenbohrmaschine, Trennschleifer, Handstopfer, Schwellenzange, Schienenzange, Schienenspanner, Schwellenschrauber)? Mit Hersteller-/Fachquelle.',
  'Wie werden sie sicher bedient (Sicherheitshinweise, PSA)?',
  'Welche Pruefpflichten gelten fuer Geraete (DGUV Vorschrift 3, Sachkundigenpruefung)?',
  'Welche Gleisbau-Messgeraete (Spurlehre, Richtlatte/Pfeilhoehenmesser, Gleiswaage, Gleismesswagen) gibt es?']],
 ['B11','Gleismessung-Gleislage','Gleismessung und Gleislagequalitaet',[
  'Welche Gleislagefehler werden unterschieden (Spurweite, Hoehenlage, Richtung, Verwindung, Ueberhoehung)? Definitionen und Grenzwerte (EN 13848, DB-Regelwerk, belegt).',
  'Welche Messverfahren gibt es (Gleismesswagen, handgefuehrte Messung, Tachymeter, GNSS)?',
  'Was sind Soll-Lage, Sofortmassnahmegrenze, Eingreifschwelle? Definitionen mit Quelle.',
  'Wie wird die Gleislage vor/nach Stopfen kontrolliert?']],
 ['B12','Feste-Fahrbahn','Feste Fahrbahn (Rheda 2000, Boegl, Zueblin, Stedef)',[
  'Welche Bauarten Fester Fahrbahn gibt es in Deutschland (Rheda 2000, Feste Fahrbahn Boegl, Zueblin, Stedef)? Aufbau und Unterschiede.',
  'Vor-/Nachteile gegenueber Schotteroberbau (Kosten, Lebensdauer, Instandhaltung).',
  'Regelwerk fuer Feste Fahrbahn (DB-Richtlinie, EBA-Zulassung; nur belegte).',
  'Typische Einsatzorte und Bauablauf.']],
 ['B13','Instandhaltung-Inspektion','Instandhaltung und Inspektion des Fahrwegs',[
  'Welche Inspektionsarten gibt es (Gleisbegehung, Streckenbegehung, Gleismessfahrt, Ultraschallpruefung der Schienen)? Intervalle laut Regelwerk.',
  'Welche Instandhaltungsmassnahmen gibt es (Stopfen, Schienenschleifen, Schotterreinigung, Schwellenwechsel, Schienentausch)?',
  'Wie wird die Zustandsbewertung dokumentiert?',
  'Kennwerte der Lebensdauer von Schiene/Schwelle/Schotter (belegt).']],
 ['B14','Strassenbahn-Gleisbau-BOStrab','Gleisbau bei Strassenbahn/Stadtbahn (BOStrab, VDV)',[
  'Welche Regelwerke gelten (BOStrab, VDV-Schriften, Spurweiten 1000/1435 mm)? Titel/Quelle.',
  'Besonderheiten Rillenschiene, Einbettung ins Strassenpflaster, Rasengleis, Laermschutz.',
  'Weichen und Kreuzungen bei Strassenbahnen.',
  'Unterschiede zum Vollbahn-Gleisbau.']],
 ['B15','Gleisbau-Bauverfahren','Bauverfahren im Gleisumbau: Gleisumbau, Schnellumbau, Umbau unter Betrieb',[
  'Welche Gleisumbauverfahren gibt es (Neubau, Erneuerung, Umbau mit Umbauzug/Schnellumbauzug, Gleisjoch-Verfahren, Einzelschwellenwechsel)? Ablauf.',
  'Wie ist eine typische Bauphase organisiert (Sperrpause, Rueckbau, Planum, Schotter, Schwellen, Schienen, Stopfen, Abnahme)?',
  'Welche Qualifikationen sind auf einer Gleisbaustelle gefragt (Gleisbauer, Rottenfuehrer, Bauueberwacher, Polier)?',
  'Welche typischen Maengel treten auf und wie wird abgenommen?']],
 ['B16','Ausbildung-Gleisbauer','Ausbildung zum Gleisbauer/zur Gleisbauerin',[
  'Offizielle Eckdaten: Ausbildungsordnung, Dauer, Lernorte, Verordnung (BGBl.), Berufsbild. Quelle BIBB/Gesetze.',
  'Ausbildungsrahmenplan Inhalte (Lernfelder), Pruefungsstruktur (Zwischen-/Abschlusspruefung).',
  'Weiterbildung (Vorarbeiter, Polier, Meister, Techniker Gleisbau) mit Quellen.',
  'Wo gibt es offizielle Lehr-/Lernmaterialien (BIBB, IHK, Fachbuecher)? Titel + Verlag.']],
 ['B17','Fachbegriffe-Glossar-Gleisbau','Gleisbau-Fachbegriffe (Glossar)',[
  'Erstelle ein Glossar von mindestens 25 zentralen Gleisbau-Fachbegriffen (z. B. Spurkranz, Spurweite, Herzstueck, Lasche, Schwelle, Schotterbett, Planum, Stopfen, Richten, Heben, Rottenfuehrer) mit kurzer Definition und Quelle.',
  'Wichtige Abkuerzungen im Gleisbau (Ril, EBO, LST, OLA, Sipo, Bue, SO, ...) mit Aufloesung.',
  'Begriffe rund um Gleis-Lagebezeichnung (Gleisachse, Schienenoberkante SO, Gleismitte, Streckenkilometer).',
  'Verwechslungsgefahren zwischen aehnlichen Begriffen.']],
 ['B18','Umweltschutz-Entsorgung','Umweltschutz im Gleisbau: Schotter, Holzschwellen, Boden, Laerm',[
  'Regeln zur Entsorgung/Wiederverwertung von Altschotter und teeroelhaltigen Holzschwellen (Abfallrecht, Quelle).',
  'Laermschutz auf Gleisbaustellen und beim Schienenschleifen.',
  'Bodenschutz und Gewaesserschutz bei Gleisbauarbeiten (Oelunfaelle, Vegetationskontrolle).',
  'Naturschutz auf Bahnanlagen: artenschutzrechtliche Fristen, Vegetationsrueckschnitt.']],
 ['B19','Geschichte-Gleisbau','Geschichte des Gleisbaus (kurz)',[
  'Wichtige Meilensteine: erste Eisenbahn, Normalspur 1435 mm (Ursprung), Schienenprofile, Stahlschwelle, Betonschwelle, LWS, Feste Fahrbahn, Hochgeschwindigkeit.',
  'Entwicklung der deutschen Eisenbahngesetzgebung (EBO 1967, Bahnreform 1994).',
  'Entwicklung der Gleisbaumaschinen (Mechanisierung ab 1950er).',
  'Quellen: DB Museum, Wikipedia, Fachliteratur.']],
];
