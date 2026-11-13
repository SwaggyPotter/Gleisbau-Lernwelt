// Zuordnungs-Paare (Drag & Drop) zum Trassenplan, 2026-11-10.
// Inhalte orientieren sich an den Bändern/Abkürzungen des Gleisvermarkungsplans und den
// Formeln, die auch der Generator verwendet (siehe generator/trassenplan-generator.ts).

export type ZuordnungsGruppe = 'abk' | 'formel' | 'band';

export interface ZuordnungsPaar {
  id: string;
  gruppe: ZuordnungsGruppe;
  begriff: string;
  bedeutung: string;
}

export const ZUORDNUNGS_GRUPPEN: { id: ZuordnungsGruppe | 'mix'; name: string }[] = [
  { id: 'mix', name: 'Gemischt' },
  { id: 'abk', name: 'Abkürzungen' },
  { id: 'formel', name: 'Formeln' },
  { id: 'band', name: 'Bänder im Plan' },
];

export const ZUORDNUNGS_PAARE: ZuordnungsPaar[] = [
  // Abkürzungen
  { id: 'ba', gruppe: 'abk', begriff: 'BA', bedeutung: 'Bogenanfang' },
  { id: 'be', gruppe: 'abk', begriff: 'BE', bedeutung: 'Bogenende' },
  { id: 'ua', gruppe: 'abk', begriff: 'ÜA', bedeutung: 'Übergangsbogenanfang' },
  { id: 'ue', gruppe: 'abk', begriff: 'ÜE', bedeutung: 'Übergangsbogenende' },
  { id: 'bw', gruppe: 'abk', begriff: 'BW', bedeutung: 'Bogenwechsel (Kreisbogen geht direkt in Kreisbogen über)' },
  { id: 'nw', gruppe: 'abk', begriff: 'NW', bedeutung: 'Neigungswechsel' },
  { id: 'ra', gruppe: 'abk', begriff: 'rₐ', bedeutung: 'Ausrundungshalbmesser am Neigungswechsel' },
  { id: 't', gruppe: 'abk', begriff: 'T', bedeutung: 'Tangentenlänge der Ausrundung' },
  { id: 'u', gruppe: 'abk', begriff: 'u', bedeutung: 'Überhöhung (Höhenunterschied der Schienen im Bogen)' },
  { id: 'u0', gruppe: 'abk', begriff: 'u₀', bedeutung: 'Ausgleichsüberhöhung (Fliehkraft voll ausgeglichen)' },
  { id: 'uf', gruppe: 'abk', begriff: 'uf', bedeutung: 'Überhöhungsfehlbetrag' },
  { id: 'wa', gruppe: 'abk', begriff: 'WA', bedeutung: 'Weichenanfang' },
  { id: 'ew', gruppe: 'abk', begriff: 'EW', bedeutung: 'Einfache Weiche' },
  { id: 'ibw', gruppe: 'abk', begriff: 'IBW', bedeutung: 'Innenbogenweiche (beide Stränge krümmen sich in dieselbe Richtung)' },
  { id: 'abw', gruppe: 'abk', begriff: 'ABW', bedeutung: 'Außenbogenweiche (Stränge krümmen sich in entgegengesetzte Richtungen)' },
  { id: 'dkw', gruppe: 'abk', begriff: 'DKW', bedeutung: 'Doppelte Kreuzungsweiche' },
  { id: 'r', gruppe: 'abk', begriff: 'r', bedeutung: 'Bogenhalbmesser (Radius) des Kreisbogens' },
  { id: 'v', gruppe: 'abk', begriff: 'V', bedeutung: 'Geschwindigkeit, für die der Bogen ausgelegt ist [km/h]' },
  { id: 'promille', gruppe: 'abk', begriff: '‰', bedeutung: 'Längsneigung: Meter Höhenunterschied auf 1000 m' },
  // Formeln
  { id: 'f-f20', gruppe: 'formel', begriff: 'f = 50 000 / r', bedeutung: '20 m-Pfeilhöhe im Kreisbogen [mm]' },
  { id: 'f-u0', gruppe: 'formel', begriff: 'u₀ = 11,8 · V² / r', bedeutung: 'Ausgleichsüberhöhung [mm]' },
  { id: 'f-uf', gruppe: 'formel', begriff: 'uf = u₀ − u', bedeutung: 'Überhöhungsfehlbetrag' },
  { id: 'f-m', gruppe: 'formel', begriff: 'm = l · 1000 / Δu', bedeutung: 'Rampenneigung 1 : m der Überhöhungsrampe' },
  { id: 'f-t', gruppe: 'formel', begriff: 'T = rₐ · |Δi| / 2', bedeutung: 'Tangentenlänge der Ausrundung (Δi als Dezimalzahl)' },
  { id: 'f-f', gruppe: 'formel', begriff: 'f = T² / (2 · rₐ)', bedeutung: 'Pfeil (Scheitelabstand) der Ausrundung' },
  { id: 'f-y', gruppe: 'formel', begriff: 'y = x² / (2 · rₐ)', bedeutung: 'Tangentenabsetzmaß im Abstand x vom Tangentenpunkt' },
  { id: 'f-gr', gruppe: 'formel', begriff: 'f = a · b / (2 · r)', bedeutung: 'Grundriß-Pfeilhöhe an beliebiger Stelle einer Sehne im Kreisbogen' },
  { id: 'f-s8r', gruppe: 'formel', begriff: 'f = s² / (8 · r)', bedeutung: 'Pfeilhöhe in Sehnenmitte (allgemein)' },
  { id: 'f-ramp', gruppe: 'formel', begriff: 'm ≥ 10 · V', bedeutung: 'Regelwert für die Rampenneigung' },
  // Bänder
  { id: 'b-kr', gruppe: 'band', begriff: 'Krümmungslinie', bedeutung: 'Zeigt 1/r: Gerade = Nulllinie, Kreisbogen = waagerechte Linie, Übergangsbogen = schräge Linie' },
  { id: 'b-ueb', gruppe: 'band', begriff: 'Überhöhungsband', bedeutung: 'Zeigt u über der Station, die Rampe als schräge Linie' },
  { id: 'b-neig', gruppe: 'band', begriff: 'Neigungsband', bedeutung: 'Neigungen in ‰, Neigungswechsel mit Höhe und Ausrundung' },
  { id: 'b-km', gruppe: 'band', begriff: 'Kilometerlinie', bedeutung: 'Stationierung mit Hektometer-Teilung' },
  { id: 'b-lage', gruppe: 'band', begriff: 'Lageskizze', bedeutung: 'Draufsicht der Gleise mit Festpunkten, Weichen und Gleisabstand' },
  { id: 'b-gpf', gruppe: 'band', begriff: 'Grundriß-Pfeilhöhen', bedeutung: 'Sollabstand der Gleisachse zur Sehne zwischen zwei Festpunkten' },
  { id: 'b-pf20', gruppe: 'band', begriff: '20 m-Pfeilhöhen', bedeutung: 'Pfeilhöhen alle 5 m, gemessen an einer 20 m langen Sehne' },
  { id: 'b-mast', gruppe: 'band', begriff: 'Oberleitungsmast / Punkt Nr.', bedeutung: 'Nummer und Station der Festpunkte (Bolzen am Mast)' },
  { id: 'b-bau', gruppe: 'band', begriff: 'Bauwerke', bedeutung: 'Brücken, Durchlässe, Tunnel und Bahnübergänge mit Station' },
];
