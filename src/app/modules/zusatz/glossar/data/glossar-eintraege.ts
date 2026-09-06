import { GlossarEintrag } from '../models/glossar.models';

export const GLOSSAR_EINTRAEGE: GlossarEintrag[] = [
  // ---------------- Oberbau ----------------
  { begriff: 'Oberbau', kategorie: 'oberbau', definition: 'Der Teil des Gleises oberhalb des Planums: Schotterbett, Schwellen, Schienen und Kleineisen. Nimmt die Radlasten auf und leitet sie in den Unterbau.' },
  { begriff: 'Schiene', kategorie: 'oberbau', definition: 'Stahlprofil, auf dem die Räder abrollen. Besteht aus Schienenkopf (Fahrfläche), Schienensteg und Schienenfuß (Auflage auf der Schwelle).' },
  { begriff: 'Schwelle', kategorie: 'oberbau', definition: 'Querträger unter den Schienen, hält die Spurweite und verteilt die Last auf das Schotterbett. Aus Holz, Beton oder Stahl.' },
  { begriff: 'Schotterbett (Bettung)', kategorie: 'oberbau', definition: 'Schicht aus grobem Gestein (meist Hartgestein wie Granit oder Basalt) unter den Schwellen. Verteilt die Last, entwässert und federt elastisch.' },
  { begriff: 'Spurweite', kategorie: 'oberbau', definition: 'Abstand zwischen den beiden Innenkanten der Schienenköpfe. Regelspur in Deutschland: 1435 mm.' },
  { begriff: 'Regelspur', kategorie: 'oberbau', definition: 'Spurweite von 1435 mm, die häufigste Spurweite weltweit und Standard im deutschen Streckennetz.' },
  { begriff: 'Schmalspur', kategorie: 'oberbau', definition: 'Spurweite kleiner als die Regelspur (unter 1435 mm), z. B. 1000 mm oder 750 mm — häufig bei Neben- und Museumsbahnen.' },
  { begriff: 'Spurkranz', kategorie: 'oberbau', definition: 'Der erhöhte Rand am Rad, der das Fahrzeug seitlich an der Schiene führt und ein Abrutschen verhindert.' },
  { begriff: 'Fahrkante', kategorie: 'oberbau', definition: 'Die innere Kante des Schienenkopfs, an der sich der Spurkranz des Rades führt — maßgeblich für die Spurweitenmessung.' },
  { begriff: 'Lückenloses Gleis (CWR)', kategorie: 'oberbau', definition: 'Durchgehend verschweißte Schienen ohne Stoßlücken (Continuous Welded Rail). Ruhigerer Lauf, weniger Verschleiß, dafür Spannungsausgleich bei der Verlegetemperatur nötig.' },
  { begriff: 'Schienenstoß', kategorie: 'oberbau', definition: 'Verbindungsstelle zweier Schienenenden, traditionell mit Laschen verschraubt. Bei modernem Gleis meist durch Schweißung ersetzt.' },
  { begriff: 'Riffel', kategorie: 'oberbau', definition: 'Wellenförmiger Verschleiß auf der Schienenfahrfläche, entsteht durch Rad-Schiene-Schwingungen. Wird durch Schienenschleifen beseitigt.' },

  // ---------------- Unterbau ----------------
  { begriff: 'Unterbau', kategorie: 'unterbau', definition: 'Der tragende Erdkörper unter dem Planum — Damm oder gewachsener Baugrund, der die Lasten des Oberbaus aufnimmt.' },
  { begriff: 'Planum', kategorie: 'unterbau', definition: 'Die obere, verdichtete und profilierte Fläche des Unterbaus, auf der das Schotterbett aufliegt.' },
  { begriff: 'Frostschutzschicht', kategorie: 'unterbau', definition: 'Kies- oder Schotterschicht im Unterbau, die verhindert, dass Frost bis zum frostempfindlichen Untergrund vordringt und diesen anhebt.' },
  { begriff: 'Tragschicht', kategorie: 'unterbau', definition: 'Schicht zwischen Planum und Schotterbett, die zusätzliche Lastverteilung und Entwässerung sicherstellt.' },
  { begriff: 'Böschung', kategorie: 'unterbau', definition: 'Geneigte Seitenfläche eines Bahndamms oder Einschnitts, meist als Verhältnis 1:n (z. B. 1:1,5) angegeben.' },
  { begriff: 'Seitengraben', kategorie: 'unterbau', definition: 'Entwässerungsgraben neben dem Gleiskörper, leitet Oberflächen- und Sickerwasser vom Planum ab.' },

  // ---------------- Trassierung ----------------
  { begriff: 'Trassierung', kategorie: 'trassierung', definition: 'Die geometrische Planung des Gleisverlaufs im Grundriss (Bögen) und Aufriss (Neigungen), unter Berücksichtigung von Geschwindigkeit und Fahrdynamik.' },
  { begriff: 'Neigungswechsel', kategorie: 'trassierung', definition: 'Übergang zwischen zwei unterschiedlichen Längsneigungen der Strecke, wird durch einen Ausrundungsbogen abgefedert statt als scharfer Knick ausgeführt.' },
  { begriff: 'Ausrundung', kategorie: 'trassierung', definition: 'Kreisbogen, mit dem ein Neigungswechsel im Längsschnitt sanft überführt wird, statt einen Knick zu bilden — verhindert ruckartige Vertikalbeschleunigung.' },
  { begriff: 'Überhöhung', kategorie: 'trassierung', definition: 'Höhenunterschied zwischen äußerer und innerer Schiene im Gleisbogen. Gleicht die Fliehkraft teilweise aus und macht die Kurvenfahrt komfortabler.' },
  { begriff: 'Übergangsbogen', kategorie: 'trassierung', definition: 'Kurve mit stetig veränderlichem Radius zwischen Gerade und Kreisbogen (z. B. Klothoide oder Blossbogen), damit sich Überhöhung und Seitenbeschleunigung sanft aufbauen.' },
  { begriff: 'Verwindung (Gleisverwindung)', kategorie: 'trassierung', definition: 'Änderung der Überhöhung je Längeneinheit, angegeben in ‰. Zu hohe Verwindung kann bei einzelnen Rädern zur Entlastung und im Extremfall zur Entgleisung führen.' },
  { begriff: 'Gleisbogen', kategorie: 'trassierung', definition: 'Gekrümmter Gleisabschnitt mit konstantem Radius, verbindet zwei Geraden unterschiedlicher Richtung.' },
  { begriff: 'Pfeilhöhe', kategorie: 'trassierung', definition: 'Abstand zwischen einer Sehne und dem Bogen an deren Mitte — dient zur überschlägigen Bestimmung oder Kontrolle eines Bogenradius.' },
  { begriff: 'Kilometrierung', kategorie: 'trassierung', definition: 'Fortlaufende Streckenkennzeichnung in Kilometern ab einem Bezugspunkt, dient der eindeutigen Ortsangabe entlang der Strecke.' },
  { begriff: 'Neigung (‰)', kategorie: 'trassierung', definition: 'Längsneigung der Strecke in Promille — Höhenunterschied in Metern je 1000 m Streckenlänge.' },

  // ---------------- Weichen ----------------
  { begriff: 'Weiche', kategorie: 'weichen', definition: 'Fahrwegelement, das es Fahrzeugen ermöglicht, von einem Gleis auf ein anderes zu wechseln, ohne anzuhalten.' },
  { begriff: 'Zunge (Weichenzunge)', kategorie: 'weichen', definition: 'Beweglicher, spitz zulaufender Teil der Weiche, der gegen die Backenschiene anliegt und die Fahrtrichtung festlegt.' },
  { begriff: 'Backenschiene', kategorie: 'weichen', definition: 'Feste Schiene der Weiche, an die sich die Zunge anlegt.' },
  { begriff: 'Herzstück', kategorie: 'weichen', definition: 'Kreuzungspunkt der Fahrkanten von Stamm- und Zweiggleis in der Weiche, an dem sich die Radlenker-Führung von einer Schiene zur anderen übergibt.' },
  { begriff: 'Radlenker', kategorie: 'weichen', definition: 'Führungsschiene gegenüber dem Herzstück, hält das Rad in der Spur und verhindert ein Auffahren auf die Herzstückspitze.' },
  { begriff: 'Neigung/Weichenwinkel', kategorie: 'weichen', definition: 'Verhältnis 1:n zwischen den Fahrkanten des Herzstücks; kleinere Neigungszahlen n bedeuten einen steileren, spitzeren Abzweigwinkel.' },
  { begriff: 'Bewegliches Herzstück', kategorie: 'weichen', definition: 'Herzstückbauform mit beweglicher Spitze statt fester Herzstücklücke — reduziert Stoßbelastung und Verschleiß bei hohen Geschwindigkeiten.' },
  { begriff: 'Weichenantrieb', kategorie: 'weichen', definition: 'Technische Einrichtung, die die Zungen einer Weiche umstellt und verriegelt, meist elektrisch oder elektrohydraulisch.' },

  // ---------------- Kleineisen ----------------
  { begriff: 'Kleineisen', kategorie: 'kleineisen', definition: 'Sammelbegriff für alle Bauteile, mit denen die Schiene auf der Schwelle befestigt wird: Platten, Klemmen, Zwischenlagen, Schrauben.' },
  { begriff: 'Spannklemme', kategorie: 'kleineisen', definition: 'Federnde Klemme, die den Schienenfuß elastisch auf die Unterlagsplatte oder Schwelle presst (z. B. Skl-Klemme bei Betonschwellen).' },
  { begriff: 'Zwischenlage', kategorie: 'kleineisen', definition: 'Elastische Kunststoff- oder Gummiplatte zwischen Schiene und Schwelle, dämpft Stöße und isoliert elektrisch.' },
  { begriff: 'Rippenplatte', kategorie: 'kleineisen', definition: 'Unterlagsplatte mit erhöhtem Rand (Rippe), die den Schienenfuß seitlich führt und die Last auf die Schwelle verteilt.' },
  { begriff: 'Hakenschraube (Schwellenschraube)', kategorie: 'kleineisen', definition: 'Schraube zur Befestigung von Rippenplatten auf Holzschwellen.' },
  { begriff: 'Federring', kategorie: 'kleineisen', definition: 'Elastisches Sicherungselement unter Schraubenköpfen oder -muttern, verhindert selbstständiges Lösen durch Vibration.' },

  // ---------------- Werkzeuge & Maschinen ----------------
  { begriff: 'Gleiswinde', kategorie: 'werkzeuge-maschinen', definition: 'Handwerkzeug zum Anheben und seitlichen Verschieben von Gleisen bei Stopf- und Richtarbeiten.' },
  { begriff: 'Schienenheber', kategorie: 'werkzeuge-maschinen', definition: 'Werkzeug zum kontrollierten Anheben einer Schiene, z. B. zum Auswechseln von Kleineisen oder Schwellen.' },
  { begriff: 'Schottergabel', kategorie: 'werkzeuge-maschinen', definition: 'Grobzinkige Gabel zum Verteilen, Aufnehmen und Nacharbeiten von Gleisschotter von Hand.' },
  { begriff: 'Stopfmaschine', kategorie: 'werkzeuge-maschinen', definition: 'Maschine, die den Schotter unter den Schwellen verdichtet (\'stopft\') und dabei die Gleislage in Höhe und Richtung korrigiert.' },
  { begriff: 'Schienenschleifzug', kategorie: 'werkzeuge-maschinen', definition: 'Fahrzeug mit rotierenden Schleifsteinen, das Riffel und andere Fahrflächenfehler von der Schiene abträgt.' },
  { begriff: 'Trennschleifmaschine', kategorie: 'werkzeuge-maschinen', definition: 'Handgeführte Maschine mit Trennscheibe zum Durchtrennen von Schienen, z. B. beim Schienenwechsel.' },
  { begriff: 'Schienenbohrmaschine', kategorie: 'werkzeuge-maschinen', definition: 'Handgeführte Maschine zum Bohren von Laschenlöchern in die Schiene, etwa für provisorische Stoßverbindungen.' },
  { begriff: 'Gleisbaukran', kategorie: 'werkzeuge-maschinen', definition: 'Schienengebundener Kran zum Heben und Versetzen schwerer Bauteile wie Schwellen, Schienenjoche oder Weichenteile.' },

  // ---------------- Regelwerke & Begriffe ----------------
  { begriff: 'EBO', kategorie: 'regelwerke', definition: 'Eisenbahn-Bau- und Betriebsordnung — deutsche Rechtsverordnung mit den grundlegenden bau- und betrieblichen Anforderungen an Eisenbahnen.' },
  { begriff: 'Richtlinie (Ril)', kategorie: 'regelwerke', definition: 'Internes technisches Regelwerk der DB InfraGO AG (früher DB Netz), konkretisiert die Vorgaben der EBO für Planung, Bau und Instandhaltung.' },
  { begriff: 'Regelwerk', kategorie: 'regelwerke', definition: 'Sammelbegriff für die technischen Vorschriften eines Infrastrukturbetreibers — Richtlinien, Normen und Arbeitsanweisungen.' },
  { begriff: 'DIN EN', kategorie: 'regelwerke', definition: 'Europäisch harmonisierte Norm, als Deutsche Industrie-Norm übernommen — regelt z. B. Anforderungen an Schienen, Schwellen oder Kleineisen.' },
  { begriff: 'Betriebsstelle', kategorie: 'regelwerke', definition: 'Ortsfeste Einrichtung des Bahnbetriebs wie Bahnhof, Abzweigstelle oder Blockstelle, mit eigener Bezeichnung im Betriebsstellenverzeichnis.' },

  // ---------------- Arbeitssicherheit ----------------
  { begriff: 'Sicherungsaufsicht', kategorie: 'sicherheit', definition: 'Person, die eine Arbeitsstelle im Gleisbereich technisch oder durch Beobachtung gegen den Zugverkehr sichert und die Beschäftigten warnt.' },
  { begriff: 'Selbstsicherung', kategorie: 'sicherheit', definition: 'Sicherungsart, bei der sich Beschäftigte einzeln oder in kleinen Gruppen selbst vor dem Zugverkehr beobachten und rechtzeitig den Gleisbereich räumen.' },
  { begriff: 'Fremdsicherung', kategorie: 'sicherheit', definition: 'Sicherungsart, bei der eine eigens dafür eingeteilte Person (Sicherungsaufsicht) die Arbeitsstelle beobachtet und die Beschäftigten warnt.' },
  { begriff: 'Räumzeit', kategorie: 'sicherheit', definition: 'Zeitspanne, die Beschäftigte benötigen, um den Gefahrenbereich vollständig zu verlassen — bestimmt den nötigen Vorwarnabstand zum Zug.' },
  { begriff: 'Gleissperrung', kategorie: 'sicherheit', definition: 'Betriebliche Maßnahme, die ein Gleis für den Zugverkehr sperrt, damit dort ohne Zugbetrieb gearbeitet werden kann.' },
  { begriff: 'Warnkleidung', kategorie: 'sicherheit', definition: 'Signalfarbene, hochsichtbare Schutzkleidung, die Beschäftigte im Gleisbereich für Triebfahrzeugführer frühzeitig erkennbar macht.' },
];
