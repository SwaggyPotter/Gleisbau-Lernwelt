/** Menschenlesbare Bezeichnungen fuer die module_key-Werte aus dem Backend (siehe MODUL-SCHLUESSEL unten). */
export const MODUL_LABELS: Record<string, string> = {
  'themenquiz:grundlagen': 'Gleisbau-Grundlagen',
  'themenquiz:spurweite': 'Spurweite und Gleisgeometrie',
  'themenquiz:schiene': 'Schienen',
  'themenquiz:schwellen': 'Schwellen',
  'themenquiz:bettung': 'Bettung und Schotter',
  'themenquiz:kleineisen': 'Schienenbefestigung und Kleineisen',
  'themenquiz:handwerkzeuge': 'Handwerkzeuge im Gleisbau',
  'themenquiz:kleingeraete': 'Kleingeräte und Maschinen',
  'themenquiz:messmittel': 'Messmittel und Vermessung',
  'themenquiz:trassenplan': 'Trassenplan lesen',
  'themenquiz:arbeitssicherheit': 'Arbeitssicherheit im Gleisbereich',
  'themenquiz:lf01': 'LF01 Baustellen einrichten',
  'themenquiz:lf10': 'LF10 Gleisanlagen neu bauen',
  'themenquiz:lf11': 'LF11 Gleisbögen herstellen und einmessen',
  'themenquiz:lf12': 'LF12 Weichen montieren und einmessen',
  'themenquiz:lf13': 'LF13 Weichen bauen und instand halten',
  'themenquiz:lf14': 'LF14 Sonderbauformen',
  'zusatz:materialrechner': 'Materialrechner',
  'zusatz:trassierung': 'Trassierungsrechner',
  'zusatz:weichenrechner': 'Weichengeometrie-Rechner',
  'zusatz:schienendehnung': 'Schienenausdehnungs-Rechner',
  'zusatz:schotterbett': 'Schotterbett-Rechner',
  'zusatz:volumen': 'Volumen berechnen',
  'zusatz:prozentrechnung': 'Prozentrechnung',
  'zusatz:nivellieren': 'Nivellieren im Gleisbau',
  'zusatz:gesamtquiz': 'Gesamtquiz alle Module',
  'zusatz:nivellierlatte': 'Nivellierlatte ablesen',
  'zusatz:baumaschinen': 'Baumaschinen erkennen',
  'zusatz:pruefungssimulation': 'Prüfungssimulation',
};

export function modulLabel(key: string): string {
  return MODUL_LABELS[key] ?? key;
}
