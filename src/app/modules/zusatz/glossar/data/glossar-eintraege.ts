import { GlossarEintrag, GlossarQuelle } from '../models/glossar.models';

/**
 * Fachbegriffe-Glossar. Seit 2026-11-07 hat jede Beschreibung mindestens eine Quelle
 * (Wunsch Tim). Alle Beschreibungen wurden an diesem Tag gegen die angegebenen Quellen
 * abgeglichen und dabei teils korrigiert. Der Admin bestätigt Einträge auf der Seite
 * („Stimmt so“); ändert sich Text oder Quelle, verfällt die Bestätigung automatisch.
 */
export const GLOSSAR_QUELLEN_STAND = '07.11.2026';

// ---------- Quellen (einmal definiert, mehrfach verwendet) ----------
const wiki = (titel: string, stelle?: string): GlossarQuelle => ({
  titel: `Wikipedia: ${titel}`,
  url: 'https://de.wikipedia.org/wiki/' + encodeURI(titel.replace(/ /g, '_')),
  ...(stelle ? { stelle } : {}),
});
const tp = (titel: string, pfad: string, stelle?: string): GlossarQuelle => ({
  titel: `Trackopedia: ${titel}`,
  url: 'https://www.trackopedia.com/lexikon/' + pfad,
  ...(stelle ? { stelle } : {}),
});
const ebo = (paragraf: number, titel: string): GlossarQuelle => ({
  titel: `EBO § ${paragraf} ${titel} (gesetze-im-internet.de)`,
  url: `https://www.gesetze-im-internet.de/ebo/__${paragraf}.html`,
});
const dguv201021 = (kapitel: number, titel: string): GlossarQuelle => ({
  titel: `DGUV Information 201-021 „Sicherheitshinweise für Arbeiten im Gleisbereich von Eisenbahnen“, Kap. ${kapitel} ${titel} (BG BAU)`,
  url: `https://www.bgbau-medien.de/handlungshilfen_gb/daten/dguv/201_021/${kapitel}.htm`,
});
const TU_DRESDEN_BELEG: GlossarQuelle = {
  titel: 'TU Dresden, Professur für Gestaltung von Bahnanlagen: Beleg „Strecken- und Bahnhofsentwurf“',
  url: 'https://tu-dresden.de/bu/verkehr/ibv/schienenfahrwege/ressourcen/dateien/download_gvb/belege/beleg-strecken--und-bahnhofsentwurf_ap.pdf?lang=de',
};
const TP_KLEINEISEN = tp('Kleineisen', 'infrastruktur/oberbau/befestigungsmittel/kleineisen');
const TP_HEBEWERKZEUGE = tp('Hebewerkzeuge', 'gleisbau-und-instandhaltung/werkzeuge-und-kleinmaschinen/hebewerkzeuge');
const TP_SICHERUNGSPOSTEN = tp('Sicherungsposten', 'gleisbau-und-instandhaltung/arbeitssicherheit/sicherungsposten');
const DB_INFRAGO_RICHTLINIEN: GlossarQuelle = {
  titel: 'DB InfraGO AG: Zugang zu technischen Richtlinien für Planung und Bau',
  url: 'https://www.dbinfrago.com/web/schienennetz/dienstleistende/Zugang-zu-technischen-Richtlinien-fuer-Planung-und-Bau-13587368',
};

export const GLOSSAR_EINTRAEGE: GlossarEintrag[] = [
  // ---------------- Oberbau ----------------
  {
    begriff: 'Oberbau', kategorie: 'oberbau',
    definition: 'Der Gleiskörper oberhalb des Unterbaus: die Bettung (meist Schotter) und das darauf liegende Gleis aus Schienen, Schwellen und Kleineisen. Nimmt die Kräfte der Fahrzeuge auf und leitet sie verteilt in den Unterbau.',
    quellen: [wiki('Oberbau (Eisenbahn)')],
  },
  {
    begriff: 'Schiene', kategorie: 'oberbau',
    definition: 'Gewalztes Stahlprofil, auf dem die Räder abrollen und geführt werden. Die Breitfußschiene besteht aus Schienenkopf (Lauf- und Führungsfläche), Schienensteg und Schienenfuß.',
    quellen: [wiki('Schiene (Bahn)', 'Abschnitt Schienenprofil')],
  },
  {
    begriff: 'Schwelle', kategorie: 'oberbau',
    definition: 'Schienenunterstützung quer zum Gleis: trägt die Schienen, hält sie in ihrer Lage – und damit die Spurweite – und verteilt die Lasten auf die Bettung. Aus Holz, Beton, Stahl oder Kunststoff.',
    quellen: [wiki('Schwelle (Bahn)')],
  },
  {
    begriff: 'Schotterbett (Bettung)', kategorie: 'oberbau',
    definition: 'Unterlage des Gleises aus Schotter. Verteilt die Kräfte elastisch auf den Unterbau und nimmt Schwingungen auf. Am besten eignen sich scharfkantig gebrochene Hartgesteine wie Basalt, Diabas oder Granit.',
    quellen: [wiki('Oberbau (Eisenbahn)', 'Abschnitt Gleisbettung'), tp('Schotter', 'infrastruktur/oberbau/schotter')],
  },
  {
    begriff: 'Spurweite', kategorie: 'oberbau',
    definition: 'Kleinster Abstand der Innenflächen der beiden Schienenköpfe, gemessen 0 bis 14 mm unter Schienenoberkante (SO). Das Grundmaß in Deutschland beträgt 1435 mm.',
    quellen: [ebo(5, 'Spurweite')],
  },
  {
    begriff: 'Regelspur', kategorie: 'oberbau',
    definition: 'Spurweite von 1435 mm, auch Normalspur genannt. Grundmaß nach EBO und Standardspurweite unter anderem in Europa, Nordamerika und China.',
    quellen: [wiki('Normalspur'), ebo(5, 'Spurweite')],
  },
  {
    begriff: 'Schmalspur', kategorie: 'oberbau',
    definition: 'Spurweite kleiner als die Normalspur von 1435 mm. Weit verbreitet sind z. B. die Meterspur (1000 mm) und 750 mm.',
    quellen: [wiki('Schmalspurbahn')],
  },
  {
    begriff: 'Spurkranz', kategorie: 'oberbau',
    definition: 'Etwa 3 cm hoher Wulst an der zur Gleismitte gerichteten Seite des Rades. Sichert die Spurführung, wenn die kegelige Form der Räder allein nicht ausreicht – vor allem in engen Bögen.',
    quellen: [wiki('Spurkranz')],
  },
  {
    begriff: 'Fahrkante', kategorie: 'oberbau',
    definition: 'Die zum Spurkranz des Rades gerichtete Führungsfläche an der Innenseite des Schienenkopfs. Zwischen den Innenflächen der Schienenköpfe wird die Spurweite gemessen.',
    quellen: [wiki('Schiene (Bahn)', 'Abschnitt Schienenprofil'), ebo(5, 'Spurweite')],
  },
  {
    begriff: 'Lückenloses Gleis (CWR)', kategorie: 'oberbau',
    definition: 'Gleis, dessen Schienen ohne Verlegelücke durchgehend verschweißt sind (auch durchgehend geschweißtes Gleis, englisch Continuous Welded Rail). Damit die Temperaturspannungen beherrschbar bleiben, verschweißt die DB die Schienen bei 20 bis 26 °C.',
    quellen: [wiki('Schienenstoß', 'Abschnitt Allgemeines')],
  },
  {
    begriff: 'Schienenstoß', kategorie: 'oberbau',
    definition: 'Stelle, an der zwei Schienenenden aufeinandertreffen. Sie werden lösbar verbunden (verlascht) oder unlösbar verschweißt – beim lückenlosen Gleis wird geschweißt.',
    quellen: [wiki('Schienenstoß')],
  },
  {
    begriff: 'Riffel', kategorie: 'oberbau',
    definition: 'Regelmäßige, kurzwellige Unebenheiten auf der Fahrfläche der Schiene (etwa 3 bis 10 cm lang, bis 0,4 mm tief). Werden durch Schienenschleifen beseitigt.',
    quellen: [wiki('Schleifwagen', 'Abschnitt Riffeln')],
  },

  // ---------------- Unterbau ----------------
  {
    begriff: 'Unterbau', kategorie: 'unterbau',
    definition: 'Alles, was die Kräfte aus dem Oberbau aufnimmt: der Erdkörper (Damm, Einschnitt, Anschnitt) sowie Kunstbauten wie Stützmauern, Brücken und Durchlässe.',
    quellen: [wiki('Unterbau (Eisenbahn)')],
  },
  {
    begriff: 'Planum', kategorie: 'unterbau',
    definition: 'Die obere Fläche des Erdkörpers, auf die der Oberbau aufgebracht wird. Damit Oberflächenwasser abläuft, ist es dach- oder pultförmig geneigt (1:20).',
    quellen: [wiki('Unterbau (Eisenbahn)')],
  },
  {
    begriff: 'Frostschutzschicht', kategorie: 'unterbau',
    definition: 'Schutzschicht aus einem Sand-Kies-Gemisch im Unterbau. Verhindert, dass Frost in den Untergrund eindringt; wird oft zusammen mit einer Planumsschutzschicht eingebaut.',
    quellen: [tp('Sand-Kies-Gemisch', 'infrastruktur/unterbau/sand-kies-gemisch')],
  },
  {
    begriff: 'Tragschicht (Planumsschutzschicht, PSS)', kategorie: 'unterbau',
    definition: 'Tragschicht zwischen Erdplanum (bzw. Frostschutzschicht) und Schotterbett. Verteilt die Last, leitet Oberflächenwasser seitlich ab und verhindert, dass sich Schotter und Boden vermischen.',
    quellen: [wiki('Planumsschutzschicht')],
  },
  {
    begriff: 'Böschung', kategorie: 'unterbau',
    definition: 'Geneigte Seitenfläche eines Damms oder Einschnitts. Die Neigung wird meist als Verhältnis angegeben: 1:2 heißt 2 m waagerecht auf 1 m Höhe.',
    quellen: [wiki('Böschung', 'Abschnitt Geometrie')],
  },
  {
    begriff: 'Bahngraben (Seitengraben)', kategorie: 'unterbau',
    definition: 'Offener Entwässerungsgraben neben dem Gleis. Nimmt das Oberflächenwasser auf, das vom geneigten Planum seitlich abfließt.',
    quellen: [wiki('Bahnkörper', 'Abschnitt Entwässerung')],
  },

  // ---------------- Trassierung ----------------
  {
    begriff: 'Trassierung', kategorie: 'trassierung',
    definition: 'Festlegen des Verlaufs eines Verkehrswegs als Folge von Trassierungselementen – waagerecht (Lageplan) und senkrecht (Höhenplan) – nach bautechnischen, topografischen, fahrdynamischen und wirtschaftlichen Gesichtspunkten.',
    quellen: [wiki('Trasse (Verkehrsweg)'), wiki('Höhenplan')],
  },
  {
    begriff: 'Neigungswechsel', kategorie: 'trassierung',
    definition: 'Stelle, an der sich die Längsneigung des Gleises ändert. Neigungswechsel in Hauptgleisen sind nach EBO auszurunden.',
    quellen: [ebo(7, 'Gleisneigung')],
  },
  {
    begriff: 'Ausrundung', kategorie: 'trassierung',
    definition: 'Bogen im Höhenplan, mit dem ein Neigungswechsel ausgerundet wird – als Kuppe oder Wanne. Bei der Eisenbahn ein Ausrundungsbogen mit dem Halbmesser ra, Mindestwert 2000 m.',
    quellen: [{ ...TU_DRESDEN_BELEG, stelle: 'Abschnitt 2.2 Längsneigung und Neigungswechsel' }, wiki('Gradiente')],
  },
  {
    begriff: 'Überhöhung', kategorie: 'trassierung',
    definition: 'Im Gleisbogen liegt die äußere Schiene höher als die innere. So können Bögen schneller befahren werden, ohne dass Fahrgäste oder Ladung zu stark zur Seite gedrückt werden. Nach EBO höchstens 180 mm.',
    quellen: [ebo(6, 'Gleisbogen'), wiki('Überhöhung', 'Abschnitt Schienenbahnen')],
  },
  {
    begriff: 'Übergangsbogen', kategorie: 'trassierung',
    definition: 'Trassierungselement zwischen Gerade und Kreisbogen (oder zwischen zwei Bögen), dessen Krümmung sich stetig ändert – der Bogen wird nicht schlagartig enger. Häufige Formen: Klothoide und Blossbogen.',
    quellen: [wiki('Übergangsbogen')],
  },
  {
    begriff: 'Verwindung (Gleisverwindung)', kategorie: 'trassierung',
    definition: 'Das Gleis ist in sich verdreht, weil sich die Überhöhung entlang des Gleises ändert. Planmäßig geschieht das in der Überhöhungsrampe; deren Neigung darf nach EBO höchstens 1:400 betragen (Verwindungskriterium in der Planung: 1:600).',
    quellen: [ebo(6, 'Gleisbogen'), { ...TU_DRESDEN_BELEG, stelle: 'Abschnitt 1.2 Überhöhungsrampe und Übergangsbogen, Verwindungskriterium' }],
  },
  {
    begriff: 'Gleisbogen', kategorie: 'trassierung',
    definition: 'Gekrümmter Gleisabschnitt mit dem Bogenradius r. In durchgehenden Hauptgleisen soll der Radius bei Neubauten nach EBO mindestens 300 m betragen.',
    quellen: [ebo(6, 'Gleisbogen')],
  },
  {
    begriff: 'Pfeilhöhe', kategorie: 'trassierung',
    definition: 'Lotrechter Abstand zwischen einer Sehne und dem Gleis, meist in der Mitte einer 16 oder 20 m langen Sehne gemessen. Daraus bestimmt man den Radius des Gleises.',
    quellen: [tp('Pfeilhöhenmessung', 'gleisbau-und-instandhaltung/gleisvermessung/pfeilhoehenmessung')],
  },
  {
    begriff: 'Kilometrierung', kategorie: 'trassierung',
    definition: 'Die Eisenbahnstrecken sind durchgehend in der Länge vermessen und mit Kilometerangaben beschildert (Streckenkilometer). So lässt sich jeder Ort an der Strecke eindeutig angeben.',
    quellen: [wiki('Streckenkilometrierung', 'Abschnitt Deutschland')],
  },
  {
    begriff: 'Neigung (‰)', kategorie: 'trassierung',
    definition: 'Längsneigung des Gleises in Promille: Höhenunterschied in Metern je 1000 m Länge. Auf freier Strecke soll sie bei Neubauten von Hauptbahnen 12,5 ‰, von Nebenbahnen 40 ‰ nicht überschreiten.',
    quellen: [ebo(7, 'Gleisneigung'), { ...TU_DRESDEN_BELEG, stelle: 'Abschnitt 2.1 Grundlagen der Trassierung im Längsprofil' }],
  },

  // ---------------- Weichen ----------------
  {
    begriff: 'Weiche', kategorie: 'weichen',
    definition: 'Anlage des Oberbaus, mit der Schienenfahrzeuge ohne Fahrtunterbrechung von einem Gleis auf ein anderes wechseln können.',
    quellen: [wiki('Weiche (Schienenverkehr)')],
  },
  {
    begriff: 'Zunge (Weichenzunge)', kategorie: 'weichen',
    definition: 'Beweglicher, spitz zulaufender Schienenteil der Weiche. Die beiden Zungen werden gemeinsam umgestellt; die an der Backenschiene anliegende Zunge bestimmt, in welches Gleis gefahren wird.',
    quellen: [wiki('Weiche (Schienenverkehr)', 'Abschnitt Funktionsweise, Zungenweiche')],
  },
  {
    begriff: 'Backenschiene', kategorie: 'weichen',
    definition: 'Feste Schiene am Weichenanfang, an die sich die Zunge anlegt.',
    quellen: [wiki('Weiche (Schienenverkehr)', 'Abschnitt Funktionsweise, Zungenweiche')],
  },
  {
    begriff: 'Herzstück', kategorie: 'weichen',
    definition: 'Teil der Weiche, in dem sich die inneren Schienen von Stamm- und Zweiggleis kreuzen. Eine Lücke in der Fahrkante (zwischen Flügelschienen und Herzstückspitze) lässt die Spurkränze durch.',
    quellen: [wiki('Weiche (Schienenverkehr)', 'Abschnitte Funktionsweise und Herzstück')],
  },
  {
    begriff: 'Radlenker', kategorie: 'weichen',
    definition: 'Führungsschiene an der dem Herzstück gegenüberliegenden Schiene. Sie führt den Radsatz über die Rückfläche des Rades, während das andere Rad über die Herzstücklücke rollt.',
    quellen: [wiki('Weiche (Schienenverkehr)', 'Abschnitt Radlenker')],
  },
  {
    begriff: 'Weichenneigung (Weichenwinkel)', kategorie: 'weichen',
    definition: 'Winkel zwischen Stamm- und Zweiggleis, angegeben als Tangens in einfacher Bruchform 1:n (z. B. 1:9). Je kleiner n, desto größer der Abzweigwinkel.',
    quellen: [tp('Begriffe der Weiche', 'infrastruktur/weiche/begriffe-der-weiche', 'Abschnitt Weichenneigung')],
  },
  {
    begriff: 'Bewegliches Herzstück', kategorie: 'weichen',
    definition: 'Herzstück, bei dem die Spitze oder die Flügelschienen beweglich sind und die Herzstücklücke schließen. Das Rad rollt ohne Lücke durch – nötig z. B. bei Schnellfahrweichen mit sehr langen Herzstücken.',
    quellen: [wiki('Weiche (Schienenverkehr)', 'Abschnitt Herzstück')],
  },
  {
    begriff: 'Weichenantrieb', kategorie: 'weichen',
    definition: 'Antrieb, der die Weichenzungen (und ggf. ein bewegliches Herzstück) umstellt. Heute meist elektrisch ferngestellt; die Lage der Zungen wird überwacht und durch einen Verschluss gesichert.',
    quellen: [wiki('Weiche (Schienenverkehr)', 'Abschnitt Weichenstellvorrichtung'), tp('Stell- und Verschlusssysteme', 'infrastruktur/weiche/stell-und-verschlusssysteme')],
  },

  // ---------------- Kleineisen ----------------
  {
    begriff: 'Kleineisen', kategorie: 'kleineisen',
    definition: 'Sammelbegriff für die Teile, mit denen die Schienen auf den Schwellen befestigt werden – z. B. Schrauben, Muttern, Federringe und Klemmplatten.',
    quellen: [TP_KLEINEISEN, wiki('Schiene (Bahn)')],
  },
  {
    begriff: 'Spannklemme', kategorie: 'kleineisen',
    definition: 'Federnde Stahlklemme (Skl), die den Schienenfuß elastisch niederhält. Ersetzt beim Oberbau Ks Klemmplatte und Federring; beim Oberbau W auf Betonschwellen wird z. B. die Skl 14 verwendet.',
    quellen: [wiki('Oberbau K', 'Abschnitt Oberbau Ks'), wiki('Schienenbefestigung')],
  },
  {
    begriff: 'Zwischenlage', kategorie: 'kleineisen',
    definition: 'Elastische Platte (heute meist Kunststoff, früher Pappelholz) zwischen Schienenfuß und Rippenplatte – beim Oberbau W direkt zwischen Schiene und Betonschwelle. Macht den Oberbau elastischer, verteilt die Last und schont das Gleis.',
    quellen: [wiki('Zwischenlage', 'Abschnitt Zwischenlage (Eisenbahn)')],
  },
  {
    begriff: 'Rippenplatte', kategorie: 'kleineisen',
    definition: 'Stählerne Unterlagsplatte mit zwei Leisten (Rippen), zwischen denen der Schienenfuß seitlich gehalten wird. Beim Oberbau K wird sie mit Schwellenschrauben auf der Schwelle befestigt.',
    quellen: [wiki('Rippenplatte'), wiki('Oberbau K')],
  },
  {
    begriff: 'Hakenschraube', kategorie: 'kleineisen',
    definition: 'Schraube mit hakenförmigem Kopf, der in die Nut der Rippenplatte greift. Spannt beim Oberbau K über Klemmplatte und Federring (beim Oberbau Ks über die Spannklemme) die Schiene auf die Rippenplatte. Nicht zu verwechseln mit der Schwellenschraube, die die Rippenplatte auf der Schwelle hält.',
    quellen: [{ ...TP_KLEINEISEN, stelle: 'Abschnitt Hakenschrauben' }, wiki('Oberbau K')],
  },
  {
    begriff: 'Federring', kategorie: 'kleineisen',
    definition: 'Hochspannender Ring aus Federstahl, z. B. der Fe 6 unter der Mutter der Hakenschraube beim Oberbau K. Hält die Schienenbefestigung elastisch verspannt – gut verspannt ist sie, wenn zwischen den Wölbungen noch etwa 1 mm Spiel bleibt.',
    quellen: [{ ...TP_KLEINEISEN, stelle: 'Abschnitte Federringe und Hakenschrauben' }],
  },

  // ---------------- Werkzeuge & Maschinen ----------------
  {
    begriff: 'Gleiswinde', kategorie: 'werkzeuge-maschinen',
    definition: 'Hebegerät mit Winde – mit Kurbel oder hydraulisch –, mit dem das Gleis z. B. für Handstopfungen angehoben wird. Solange es steht, ist das Gleis nicht profilfrei.',
    quellen: [TP_HEBEWERKZEUGE],
  },
  {
    begriff: 'Schienenheber', kategorie: 'werkzeuge-maschinen',
    definition: 'Kleines Hebewerkzeug, um Schienen oder Gleis kleinräumig anzuheben, z. B. beim Tausch von Zwischenlagen. Bleibt profilfrei, sodass kleine Stopfgeräte darüber fahren können.',
    quellen: [TP_HEBEWERKZEUGE],
  },
  {
    begriff: 'Schottergabel', kategorie: 'werkzeuge-maschinen',
    definition: 'Handwerkzeug zum Aufnehmen und Verteilen von Gleisschotter.',
    quellen: [tp('Handwerkzeuge', 'gleisbau-und-instandhaltung/werkzeuge-und-kleinmaschinen/handwerkzeuge', 'Bild „Schottergabel – Gleisschotter-Manipulationsgerät“')],
  },
  {
    begriff: 'Stopfmaschine', kategorie: 'werkzeuge-maschinen',
    definition: 'Gleisbaumaschine, die mit vibrierenden Stopfpickeln den Schotter unter den Schwellen verdichtet (stopft); das Gleis wird dabei leicht angehoben. Seit den 1970er-Jahren gebaute Maschinen richten das Gleis zugleich.',
    quellen: [wiki('Gleisstopfmaschine')],
  },
  {
    begriff: 'Schienenschleifzug', kategorie: 'werkzeuge-maschinen',
    definition: 'Schienenfahrzeug, das Oberflächenfehler wie Riffel von den Schienenköpfen abschleift. Mit eigenem Antrieb heißt es Schleifzug oder Schleiftriebwagen.',
    quellen: [wiki('Schleifwagen')],
  },
  {
    begriff: 'Trennschleifmaschine', kategorie: 'werkzeuge-maschinen',
    definition: 'Schienen-Trennschleifgerät mit Benzin- oder Elektromotor zum Trennen von Schienen. Anders als der früher genutzte Schweißbrenner schädigt es das Gefüge an den Schnittkanten nicht.',
    quellen: [tp('Trennmaschinen', 'gleisbau-und-instandhaltung/werkzeuge-und-kleinmaschinen/trennmaschinen')],
  },
  {
    begriff: 'Schienenbohrmaschine', kategorie: 'werkzeuge-maschinen',
    definition: 'Maschine zum Bohren der Laschenlöcher (bis 38 mm) im verlegten Gleis, z. B. in Weichen und Stoßgleisen. Bohrlehren sorgen für die genauen Lochabstände.',
    quellen: [tp('Schienenbohrmaschinen', 'gleisbau-und-instandhaltung/werkzeuge-und-kleinmaschinen/schienenbohrmaschinen')],
  },
  {
    begriff: 'Gleisbaukran', kategorie: 'werkzeuge-maschinen',
    definition: 'Kran, der drehbar auf einem Schienenfahrzeug sitzt (Schienendrehkran). Wird bei Bauarbeiten z. B. zur Montage von Gleisen, Weichen und Brücken eingesetzt – und zum Bergen entgleister Fahrzeuge.',
    quellen: [wiki('Schienendrehkran')],
  },

  // ---------------- Regelwerke & Begriffe ----------------
  {
    begriff: 'EBO', kategorie: 'regelwerke',
    definition: 'Eisenbahn-Bau- und Betriebsordnung – Verordnung für den Bau und Betrieb regelspuriger Eisenbahnen in Deutschland. Regelt u. a. Spurweite (§ 5), Gleisbogen und Überhöhung (§ 6) und Gleisneigung (§ 7).',
    quellen: [wiki('Eisenbahn-Bau- und Betriebsordnung'), { titel: 'EBO (gesetze-im-internet.de)', url: 'https://www.gesetze-im-internet.de/ebo/' }],
  },
  {
    begriff: 'Richtlinie (Ril)', kategorie: 'regelwerke',
    definition: 'Technische Richtlinie der DB InfraGO AG (bis Ende 2023 DB Netz AG), verbindlich für Planung und Bau. Gegliedert in Ril-Familien, z. B. 836 Erdbauwerke oder 853 Eisenbahntunnel.',
    quellen: [DB_INFRAGO_RICHTLINIEN, wiki('DB InfraGO')],
  },
  {
    begriff: 'Regelwerk', kategorie: 'regelwerke',
    definition: 'Gesamtheit der Vorschriften eines Infrastrukturbetreibers. Bei der DB InfraGO gehören dazu z. B. das netzzugangsrelevante und das betrieblich-technische Regelwerk sowie die Richtlinien für Planung und Bau.',
    quellen: [DB_INFRAGO_RICHTLINIEN],
  },
  {
    begriff: 'DIN EN', kategorie: 'regelwerke',
    definition: 'Europäische Norm (EN), die vom DIN übernommen wurde und damit als DIN-Norm gilt – im Gleisbau z. B. DIN EN 13232 für Weichen.',
    quellen: [wiki('DIN-Norm'), tp('Begriffe der Weiche', 'infrastruktur/weiche/begriffe-der-weiche', 'Hinweis auf EN 13232')],
  },
  {
    begriff: 'Betriebsstelle', kategorie: 'regelwerke',
    definition: 'Bahnanlage, die der unmittelbaren Regelung und Sicherung der Zugfahrten und des Rangierens dient – z. B. Bahnhöfe, Haltepunkte, Blockstellen und Abzweigstellen; auch Stellwerke gelten als Betriebsstelle.',
    quellen: [wiki('Betriebsstelle')],
  },

  // ---------------- Arbeitssicherheit ----------------
  {
    begriff: 'Sicherungsaufsicht', kategorie: 'sicherheit',
    definition: 'Verantwortliche Fachkraft (Sakra) für die Sicherungsmaßnahmen an einer Arbeitsstelle im Gleis. Sie setzt die Sicherungsposten ein, legt deren Standorte und die Warnung fest und trägt die Verantwortung, Gefahren aus dem Bahnbetrieb abzuwenden.',
    quellen: [tp('Sicherungsaufsicht', 'gleisbau-und-instandhaltung/arbeitssicherheit/sicherungsaufsicht'), TP_SICHERUNGSPOSTEN],
  },
  {
    begriff: 'Selbstsicherung', kategorie: 'sicherheit',
    definition: 'Kleine Arbeitsgruppen (bis zu drei Beschäftigte) sichern sich unter bestimmten Voraussetzungen selbst: Sie erkennen eine herannahende Fahrt sicher und rechtzeitig und räumen den Gleisbereich. Ob das erlaubt ist, ergibt sich aus einer Gefährdungsbeurteilung.',
    quellen: [dguv201021(5, 'Arbeiten in Kleingruppen und unter Selbstsicherung')],
  },
  {
    begriff: 'Fremdsicherung', kategorie: 'sicherheit',
    definition: 'Die Arbeitsstelle wird nicht von den Arbeitenden selbst gesichert, sondern durch eigenes Sicherungspersonal – Sicherungsposten (Sipo), eingesetzt von der Sicherungsaufsicht – oder durch automatische Warnsysteme.',
    quellen: [{ ...TP_SICHERUNGSPOSTEN, stelle: 'Aufgaben des Sicherungspostens' }],
  },
  {
    begriff: 'Räumzeit', kategorie: 'sicherheit',
    definition: 'Zeit, die die Beschäftigten brauchen, um den Gefahrenbereich des Gleises zu verlassen. Aus ihr, einem Sicherheitszuschlag und der Geschwindigkeit wird ermittelt, wie früh gewarnt werden muss (Annäherungsstrecke).',
    quellen: [dguv201021(3, 'Planung der Sicherungsmaßnahmen')],
  },
  {
    begriff: 'Gleissperrung', kategorie: 'sicherheit',
    definition: 'Das Arbeitsgleis wird für Fahrten gesperrt – damit wird die Gefahr beseitigt, statt nur vor ihr zu warnen. Nach der Rangfolge des Arbeitsschutzgesetzes hat die Sperrung Vorrang vor den anderen Sicherungsmaßnahmen.',
    quellen: [dguv201021(2, 'Rangfolge und Festlegung der Sicherungsverfahren, Abschnitt 2.1 Sperrung des Arbeitsgleises')],
  },
  {
    begriff: 'Warnkleidung', kategorie: 'sicherheit',
    definition: 'Fluoreszierende Warnkleidung mit Reflexstreifen nach DIN EN ISO 20471, Pflicht im Gleisbereich. Bei der DB tragen Beschäftigte im Gleis Orange-Rot, Sicherungsposten zur Unterscheidung Gelb; für kniende Arbeiten und nachts ist Klasse 3 (Jacke und Hose) vorgesehen.',
    quellen: [{ titel: 'DGUV Fachbereich PSA: „Warnkleidung kann Leben retten!“ (sicher ist sicher 9/2014)', url: 'https://www.dguv.de/medien/fb-psa/de/publikationen/2015/fdp_warnkleidung.pdf' }],
  },
];
