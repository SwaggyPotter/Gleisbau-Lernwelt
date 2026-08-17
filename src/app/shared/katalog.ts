export type QuizTile = {
  id: string;
  title: string;
  description: string;
  tag: string;
  icon: string;
  link: string;
  topicId?: string;
  questionCount?: number;
  queryParams?: Record<string, string>;
  /**
   * Optionales Foto. Aktuell als Hotlink auf Wikimedia Commons (nicht lokal
   * gehostet) — siehe assets/bilder/bildnachweise.json fuer Lizenz/Quelle.
   * Grund: Bulk-Download loeste Wikimedias Rate-Limit aus (HTTP 429), das
   * Hotlinken einzelner Bilder pro Nutzer-Browser ist der normale, von
   * Wikimedia dafuer vorgesehene Weg. Spaeter ggf. lokal herunterladen mit
   * tools/cline-cli/download-bildkandidaten.cjs (resume-faehig).
   */
  image?: string;
  imageCredit?: string;
};

/**
 * Lesestoff zum Selbststudium. AKTUELL BEWUSST NICHT VERLINKT (Tim,
 * 2026-08-17: "die Seite so umgebaut wird das man nur noch Quiz hat, nichts
 * zum selbst lernen — das machen wir spaeter"). Die Daten bleiben hier
 * stehen, damit der Bereich spaeter ohne Neuaufbau wieder eingehaengt werden
 * kann; die Zielseiten (/zusatz/...) existieren unveraendert weiter.
 */
export const SELBSTSTUDIUM_TILES: QuizTile[] = [
  {
    id: 'selbststudium-nivellieren',
    title: 'Nivellieren im Gleisbau',
    description: 'Leitfaden inkl. Checklisten aus dem Nivellement-PDF, Schritt fuer Schritt zum Selbststudium.',
    tag: 'Lesen',
    icon: 'trending-up-outline',
    link: '/zusatz/nivellieren',
  },
  {
    id: 'selbststudium-volumen',
    title: 'Volumen berechnen',
    description: 'Grundlagen zur Volumenberechnung im Gleisbau, inkl. Trapezprofilen und Aussparungen.',
    tag: 'Lesen',
    icon: 'cube-outline',
    link: '/zusatz/volumen',
    image: 'assets/bilder/volumen-trapezprofil.svg',
    imageCredit: 'Eigene Grafik',
  },
  {
    id: 'selbststudium-prozentrechnung',
    title: 'Prozentrechnung',
    description: 'Prozentwert, Rabatt, Erhoehung, Rueckrechnung und Toleranzen mit praxisnahen Erklaerungen.',
    tag: 'Lesen',
    icon: 'calculator-outline',
    link: '/zusatz/prozentrechnung',
    image: 'assets/bilder/prozentrechnung-diagramm.svg',
    imageCredit: 'Eigene Grafik',
  },
];

export const RECHENTRAINER_TILES: QuizTile[] = [
  {
    id: 'quiz-nivellieren',
    title: 'Nivellieren im Gleisbau',
    description: 'Wissen zum Nivellieren abfragen (springt direkt zum Gesamtquiz des Moduls).',
    tag: 'Quiz',
    icon: 'trending-up-outline',
    link: '/zusatz/nivellieren',
    queryParams: { view: 'quiz' },
  },
  {
    id: 'quiz-volumen',
    title: 'Volumen berechnen',
    description: '10 Quizaufgaben zu Volumenberechnung im Gleisbau.',
    tag: 'Quiz',
    icon: 'cube-outline',
    link: '/zusatz/volumen',
    queryParams: { view: 'quiz' },
    image: 'assets/bilder/volumen-trapezprofil.svg',
    imageCredit: 'Eigene Grafik',
  },
  {
    id: 'quiz-prozentrechnung',
    title: 'Prozentrechnung',
    description: 'Prozentwert, Rabatt, Erhoehung, Rueckrechnung und Toleranzen als Quiz.',
    tag: 'Quiz',
    icon: 'calculator-outline',
    link: '/zusatz/prozentrechnung',
    queryParams: { view: 'quiz' },
    image: 'assets/bilder/prozentrechnung-diagramm.svg',
    imageCredit: 'Eigene Grafik',
  },
  {
    id: 'quiz-gesamtquiz',
    title: 'Gesamtquiz alle Module',
    description: 'Ein grosses Quiz mit allen Fragen aus den Zusatzmodulen.',
    icon: 'trophy-outline',
    tag: 'Quiz',
    link: '/zusatz/gesamtquiz',
  },
  {
    id: 'quiz-materialrechner',
    title: 'Materialrechner',
    description: 'Unbegrenzt neue Rechenaufgaben zu Volumen, Materialgewicht und Schotterbedarf, in 3 Schwierigkeitsgraden.',
    icon: 'scale-outline',
    tag: 'Quiz',
    link: '/zusatz/materialrechner',
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Loading_bay_at_Hakkila_rail_yard_in_Vantaa%2C_Finland%2C_2021.jpg?width=900',
    imageCredit: 'Coen, CC BY-SA 4.0, via Wikimedia Commons',
  },
];

export const SPIELE_TILES: QuizTile[] = [
  {
    id: 'spiel-nivellierlatte',
    title: 'Nivellierlatte ablesen',
    description: 'Wert an der Latte ablesen und eintragen — richtig, wenn nah genug am echten Wert.',
    tag: 'Spiel',
    icon: 'analytics-outline',
    link: '/zusatz/nivellierlatte',
  },
  {
    id: 'spiel-schienenmesser',
    title: 'Schienenkopf-Verschleissmesser',
    description: 'Geraet auf das Profil einstellen, Messfuehler zustellen und Hoehen- sowie Seitenverschleiss ablesen.',
    tag: 'Spiel',
    icon: 'git-compare-outline',
    link: '/zusatz/schienenmesser',
  },
];

/** Wissenstests — die zehn Themenquizze, didaktisch von Grundlagen zu Spezialthemen sortiert. */
export const WISSENSTEST_TILES: QuizTile[] = [
    {
      id: 'themenquiz-grundlagen',
      title: 'Gleisbau-Grundlagen',
      description: 'Aufbau Eisenbahngleis, Oberbau, Unterbau und Aufgaben des Gleisbauers.',
      tag: 'Grundlagen',
      icon: 'school-outline',
      link: '/themenquiz/grundlagen',
      topicId: 'grundlagen',
      questionCount: 26,
      image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Gleisbau_in_Schoenberg_(1).jpg?width=900',
      imageCredit: 'Siegbert Brey (Snoopy1964), CC BY-SA 4.0, via Wikimedia Commons',
    },
    {
      id: 'themenquiz-spurweite',
      title: 'Spurweite und Gleisgeometrie',
      description: 'EBO Spurweite, Regelspur 1435 mm, Gleisbogen, Ueberhoehung.',
      tag: 'Geometrie',
      icon: 'resize-outline',
      link: '/themenquiz/spurweite',
      topicId: 'spurweite',
      questionCount: 20,
      image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Track_gauges_01.jpg?width=900',
      imageCredit: 'Unnerving duck, CC BY-SA 4.0, via Wikimedia Commons',
    },
    {
      id: 'themenquiz-schiene',
      title: 'Schienen',
      description: 'Schienenaufbau, Profil, Waermeausdehnung, verschweisstes Gleis.',
      tag: 'Schiene',
      icon: 'remove-outline',
      link: '/themenquiz/schiene',
      topicId: 'schiene',
      questionCount: 19,
      image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Thermite_rail_welding_33.jpg?width=900',
      imageCredit: 'Cjp24, CC BY-SA 4.0, via Wikimedia Commons',
    },
    {
      id: 'themenquiz-schwellen',
      title: 'Schwellen',
      description: 'Aufgabe, Arten, Lastverteilung und Spurhaltung.',
      tag: 'Schwellen',
      icon: 'reorder-four-outline',
      link: '/themenquiz/schwellen',
      topicId: 'schwellen',
      questionCount: 22,
      image: 'https://commons.wikimedia.org/wiki/Special:FilePath/R%C3%A1kosrendez%C5%91_train_station%2C_sleepers%2C_2020_Zugl%C3%B3.jpg?width=900',
      imageCredit: 'Globetrotter19, CC BY-SA 3.0, via Wikimedia Commons',
    },
    {
      id: 'themenquiz-bettung',
      title: 'Bettung und Schotter',
      description: 'Gleisschotter, Lastverteilung, Entwaesserung, Bettungsquerschnitt.',
      tag: 'Bettung',
      icon: 'layers-outline',
      link: '/themenquiz/bettung',
      topicId: 'bettung',
      questionCount: 30,
      image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Workers_manually_levelling_gravel_(Ballast)_in_the_railway_track%2C_Tamil_Nadu_01.jpg?width=900',
      imageCredit: 'PJeganathan, CC BY-SA 4.0, via Wikimedia Commons',
    },
    {
      id: 'themenquiz-kleineisen',
      title: 'Schienenbefestigung und Kleineisen',
      description: 'Spannklemme, Zwischenlage, Rippenplatte und weitere Kleineisen.',
      tag: 'Kleineisen',
      icon: 'construct-outline',
      link: '/themenquiz/kleineisen',
      topicId: 'kleineisen',
      questionCount: 25,
      image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Clamp_4401.jpg?width=900',
      imageCredit: 'Chris Light, CC BY-SA 4.0, via Wikimedia Commons',
    },
    {
      id: 'themenquiz-handwerkzeuge',
      title: 'Handwerkzeuge im Gleisbau',
      description: 'Gleiswinde, Schienenheber, Schottergabel und Sicherheit.',
      tag: 'Werkzeuge',
      icon: 'hammer-outline',
      link: '/themenquiz/handwerkzeuge',
      topicId: 'handwerkzeuge',
      questionCount: 22,
      image: 'https://commons.wikimedia.org/wiki/Special:FilePath/SOUTHERN_RAILWAY_RIGHT-OF-WAY_WORK_CREW_JACK_UP_A_RAIL_THEY_ARE_REMOVING_OLD_TIES_AND_REPLACING_THEM_WITH_NEW_ONES..._-_NARA_-_556898.jpg?width=900',
      imageCredit: 'US-Bundesbehoerde (NARA), gemeinfrei',
    },
    {
      id: 'themenquiz-kleingeraete',
      title: 'Kleingeraete und Maschinen',
      description: 'Schienenbohrmaschine, Trennschleifmaschine und Sicherheit.',
      tag: 'Geraete',
      icon: 'cog-outline',
      link: '/themenquiz/kleingeraete',
      topicId: 'kleingeraete',
      questionCount: 20,
      image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Work_on_the_railway_line_-_fitting_a_fishplate_-_geograph.org.uk_-_1754311.jpg?width=900',
      imageCredit: 'Evelyn Simak, CC BY-SA 2.0, via Wikimedia Commons/Geograph',
    },
    {
      id: 'themenquiz-messmittel',
      title: 'Messmittel und Vermessung',
      description: 'Spurweitenmessgeraet, Nivelliergeraet, Pfeilhoehe und Temperatur.',
      tag: 'Messen',
      icon: 'speedometer-outline',
      link: '/themenquiz/messmittel',
      topicId: 'messmittel',
      questionCount: 21,
      image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Measurement_Trolley_832.jpg?width=900',
      imageCredit: 'Chen Melling, CC BY-SA 4.0, via Wikimedia Commons',
    },
    {
      id: 'themenquiz-trassenplan',
      title: 'Trassenplan lesen',
      description: 'Kilometrierung, Lageplan, Laengsschnitt und Symbole.',
      tag: 'Planung',
      icon: 'map-outline',
      link: '/themenquiz/trassenplan',
      topicId: 'trassenplan',
      questionCount: 23,
      image: 'assets/bilder/trassenplan-diagramm.svg',
      imageCredit: 'Eigene Grafik',
    },
];

/** Gleisbau-spezifische Lernfelder (LF10-14) — der Fokus der App. */
export const GLEISBAU_LERNFELD_TILES: QuizTile[] = [
    {
      id: 'lernfeld-lf10',
      title: 'Gleisanlagen neu bauen',
      description: 'Lernfeld 10, Jahr 2: Gleisaufbau, Schotter, Schwellen, Schienen.',
      tag: 'Jahr 2',
      icon: 'train-outline',
      link: '/themenquiz/lf10',
      topicId: 'lf10',
      questionCount: 24,
    },
    {
      id: 'lernfeld-lf11',
      title: 'Gleisboegen herstellen und einmessen',
      description: 'Lernfeld 11, Jahr 3: Vermessung, Gleislage, Radien.',
      tag: 'Jahr 3',
      icon: 'analytics-outline',
      link: '/themenquiz/lf11',
      topicId: 'lf11',
      questionCount: 23,
    },
    {
      id: 'lernfeld-lf12',
      title: 'Weichen montieren und einmessen',
      description: 'Lernfeld 12, Jahr 3: Weichenarten, Einbau, Kontrolle.',
      tag: 'Jahr 3',
      icon: 'git-branch-outline',
      link: '/themenquiz/lf12',
      topicId: 'lf12',
      questionCount: 23,
    },
    {
      id: 'lernfeld-lf13',
      title: 'Weichen bauen und instand halten',
      description: 'Lernfeld 13, Jahr 3: Weichenaufbau, Instandhaltung, sichere Weichenarbeit.',
      tag: 'Jahr 3',
      icon: 'git-network-outline',
      link: '/themenquiz/lf13',
      topicId: 'lf13',
      questionCount: 24,
    },
    {
      id: 'lernfeld-lf14',
      title: 'Sonderbauformen und besondere Gleisanlagen',
      description: 'Lernfeld 14, Jahr 3: Sonderbauformen, Bahnuebergaenge, feste Fahrbahn.',
      tag: 'Jahr 3',
      icon: 'extension-puzzle-outline',
      link: '/themenquiz/lf14',
      topicId: 'lf14',
      questionCount: 24,
    },
];

/** Allgemeine Bauberufe-Lernfelder (LF01-09), nicht Gleisbau-spezifisch. */
export const BAUBERUFE_TILES: QuizTile[] = [
    {
      id: 'lernfeld-lf01',
      title: 'Baustellen einrichten',
      description: 'Lernfeld 1, Jahr 1: Sicherheit, Organisation, Baustelleneinrichtung.',
      tag: 'Jahr 1',
      icon: 'shield-checkmark-outline',
      link: '/themenquiz/lf01',
      topicId: 'lf01',
      questionCount: 72,
    },
    {
      id: 'lernfeld-lf02',
      title: 'Bauwerke erschliessen und gruenden',
      description: 'Lernfeld 2, Jahr 1: Erschliessung, Fundamente, Baugrund.',
      tag: 'Jahr 1',
      icon: 'business-outline',
      link: '/themenquiz/lf02',
      topicId: 'lf02',
      questionCount: 30,
    },
    {
      id: 'lernfeld-lf03',
      title: 'Einschalige Baukoerper mauern',
      description: 'Lernfeld 3, Jahr 1: Mauerwerk, Steine, Verbaende.',
      tag: 'Jahr 1',
      icon: 'grid-outline',
      link: '/themenquiz/lf03',
      topicId: 'lf03',
      questionCount: 34,
    },
    {
      id: 'lernfeld-lf04',
      title: 'Stahlbetonbauteile herstellen',
      description: 'Lernfeld 4, Jahr 1: Schalung, Bewehrung, Beton.',
      tag: 'Jahr 1',
      icon: 'cube-outline',
      link: '/themenquiz/lf04',
      topicId: 'lf04',
      questionCount: 31,
    },
    {
      id: 'lernfeld-lf05',
      title: 'Holzkonstruktionen herstellen',
      description: 'Lernfeld 5, Jahr 1: Holzbauteile, Verbindungen, Montage.',
      tag: 'Jahr 1',
      icon: 'leaf-outline',
      link: '/themenquiz/lf05',
      topicId: 'lf05',
      questionCount: 31,
    },
    {
      id: 'lernfeld-lf06',
      title: 'Bauteile beschichten und bekleiden',
      description: 'Lernfeld 6, Jahr 1: Schutz, Abdichtung, Oberflaechen.',
      tag: 'Jahr 1',
      icon: 'brush-outline',
      link: '/themenquiz/lf06',
      topicId: 'lf06',
      questionCount: 30,
    },
    {
      id: 'lernfeld-lf07',
      title: 'Baugruende erkunden',
      description: 'Lernfeld 7, Jahr 2: Bodenarten, Tragfaehigkeit, Baugrunduntersuchung.',
      tag: 'Jahr 2',
      icon: 'search-outline',
      link: '/themenquiz/lf07',
      topicId: 'lf07',
      questionCount: 25,
    },
    {
      id: 'lernfeld-lf08',
      title: 'Erdbauwerke errichten',
      description: 'Lernfeld 8, Jahr 2: Aushub, Verbau, Planum, Verdichtung.',
      tag: 'Jahr 2',
      icon: 'earth-outline',
      link: '/themenquiz/lf08',
      topicId: 'lf08',
      questionCount: 23,
    },
    {
      id: 'lernfeld-lf09',
      title: 'Verkehrsflaechen aus Pflaster- und Plattenbelaegen herstellen',
      description: 'Lernfeld 9, Jahr 2: Wege, Flaechen, Unterbau.',
      tag: 'Jahr 2',
      icon: 'apps-outline',
      link: '/themenquiz/lf09',
      topicId: 'lf09',
      questionCount: 23,
    },
];
