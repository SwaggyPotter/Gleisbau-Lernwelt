import { Maschine } from '../models/baumaschinen.models';

// Bilder lokal gehostet (2026-11-10, vorher Wikimedia-Hotlinks – luden oft langsam/gar nicht).
// Quelle je Bild: Wikimedia Commons, Lizenz siehe bildCredit (Namensnennung bleibt Pflicht).
function bild(id: string): string {
  return `assets/bilder/baumaschinen/${id}.jpg`;
}

export const MASCHINEN: Maschine[] = [
  {
    id: 'stopfmaschine',
    name: 'Gleisstopfmaschine',
    beschreibung: 'Verdichtet ("stopft") den Schotter unter den Schwellen und korrigiert dabei Höhe und Richtung des Gleises.',
    bildUrl: bild('stopfmaschine'),
    bildCredit: 'Falk2, CC BY-SA 3.0, via Wikimedia Commons',
  },
  {
    id: 'schienenschleifzug',
    name: 'Schienenschleifzug',
    beschreibung: 'Trägt mit rotierenden Schleifsteinen Riffel und andere Fahrflächenfehler von der Schienenoberfläche ab.',
    bildUrl: bild('schienenschleifzug'),
    bildCredit: 'Rolf Heinrich, Köln, CC BY 3.0, via Wikimedia Commons',
  },
  {
    id: 'gleisbaukran',
    name: 'Gleisbaukran',
    beschreibung: 'Schienengebundener Kran zum Heben und Versetzen schwerer Bauteile wie Schwellen, Weichenteile oder Brückenelemente.',
    bildUrl: bild('gleisbaukran'),
    bildCredit: 'Böhringer Friedrich, CC BY-SA 3.0 AT, via Wikimedia Commons',
  },
  {
    id: 'zweiwegebagger',
    name: 'Zweiwegebagger',
    beschreibung: 'Bagger, der sowohl auf der Straße als auch auf der Schiene fahren kann — vielseitig einsetzbar bei Erd- und Aushubarbeiten im Gleisbereich.',
    bildUrl: bild('zweiwegebagger'),
    bildCredit: 'Tobias Daubitzer, CC BY-SA 4.0, via Wikimedia Commons',
  },
  {
    id: 'schotterplaniermaschine',
    name: 'Schotterplaniermaschine',
    beschreibung: 'Verteilt und profiliert den Gleisschotter — formt das Schotterprofil vor dem Stopfen oder nach der Verdichtung nach.',
    bildUrl: bild('schotterplaniermaschine'),
    bildCredit: 'Falk2, CC BY-SA 4.0, via Wikimedia Commons',
  },
];
