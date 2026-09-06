import { Maschine } from '../models/baumaschinen.models';

function commonsUrl(dateiname: string): string {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(dateiname)}?width=900`;
}

export const MASCHINEN: Maschine[] = [
  {
    id: 'stopfmaschine',
    name: 'Gleisstopfmaschine',
    beschreibung: 'Verdichtet ("stopft") den Schotter unter den Schwellen und korrigiert dabei Höhe und Richtung des Gleises.',
    bildUrl: commonsUrl('01 582 SIG-Stopfmaschine.jpg'),
    bildCredit: 'Falk2, CC BY-SA 3.0, via Wikimedia Commons',
  },
  {
    id: 'schienenschleifzug',
    name: 'Schienenschleifzug',
    beschreibung: 'Trägt mit rotierenden Schleifsteinen Riffel und andere Fahrflächenfehler von der Schienenoberfläche ab.',
    bildUrl: commonsUrl('Vossloh Rail Services HSG.JPG'),
    bildCredit: 'Rolf Heinrich, Köln, CC BY 3.0, via Wikimedia Commons',
  },
  {
    id: 'gleisbaukran',
    name: 'Gleisbaukran',
    beschreibung: 'Schienengebundener Kran zum Heben und Versetzen schwerer Bauteile wie Schwellen, Weichenteile oder Brückenelemente.',
    bildUrl: commonsUrl('Multi Tasker 1200 type rail crane by Kirow (KRC) .JPG'),
    bildCredit: 'Böhringer Friedrich, CC BY-SA 3.0 AT, via Wikimedia Commons',
  },
  {
    id: 'zweiwegebagger',
    name: 'Zweiwegebagger',
    beschreibung: 'Bagger, der sowohl auf der Straße als auch auf der Schiene fahren kann — vielseitig einsetzbar bei Erd- und Aushubarbeiten im Gleisbereich.',
    bildUrl: commonsUrl('Zweiwegebagger Liebherr.jpg'),
    bildCredit: 'Tobias Daubitzer, CC BY-SA 4.0, via Wikimedia Commons',
  },
  {
    id: 'schotterplaniermaschine',
    name: 'Schotterplaniermaschine',
    beschreibung: 'Verteilt und profiliert den Gleisschotter — formt das Schotterprofil vor dem Stopfen oder nach der Verdichtung nach.',
    bildUrl: commonsUrl('L04 839 Innotrans 2024, Schotterplaniermaschine HSP 4.0.jpg'),
    bildCredit: 'Falk2, CC BY-SA 4.0, via Wikimedia Commons',
  },
];
