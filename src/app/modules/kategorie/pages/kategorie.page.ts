import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  QuizTile,
  WISSENSTEST_TILES,
  GLEISBAU_LERNFELD_TILES,
  BAUBERUFE_TILES,
  RECHENTRAINER_TILES,
  SPIELE_TILES,
} from '../../../shared/katalog';

/**
 * Ein Abschnitt innerhalb einer Kategorie. Die meisten Kategorien haben nur
 * einen (ohne Titel), "Lernfelder" hat zwei — Gleisbau zuerst, danach die
 * allgemeinen Bauberufe.
 */
interface KategorieGruppe {
  title?: string;
  note?: string;
  tiles: QuizTile[];
}

interface Kategorie {
  id: string;
  eyebrow: string;
  title: string;
  note: string;
  gruppen: KategorieGruppe[];
}

/** Sortiert Lernfeld-Kacheln zuverlaessig nach ihrer Nummer (LF01 … LF14). */
function nachLernfeldnummer(tiles: QuizTile[]): QuizTile[] {
  const nummer = (tile: QuizTile): number => {
    const treffer = /lf(\d+)/i.exec(tile.topicId ?? tile.id);
    return treffer ? Number(treffer[1]) : Number.MAX_SAFE_INTEGER;
  };
  return [...tiles].sort((a, b) => nummer(a) - nummer(b));
}

const KATEGORIEN: Kategorie[] = [
  {
    id: 'wissenstests',
    eyebrow: 'Themen',
    title: 'Wissenstests',
    note: 'Die zehn Gleisbau-Themen, sortiert von den Grundlagen bis zum Trassenplan.',
    gruppen: [{ tiles: WISSENSTEST_TILES }],
  },
  {
    id: 'lernfelder',
    eyebrow: 'Nach Lernfeldern',
    title: 'Lernfelder',
    note: 'Quiz nach der Lernfeld-Gliederung der Ausbildung.',
    gruppen: [
      {
        title: 'Gleisbau-Lernfelder',
        note: 'Lernfeld 10 bis 14 — der Schwerpunkt der Ausbildung im Gleisbau.',
        tiles: nachLernfeldnummer(GLEISBAU_LERNFELD_TILES),
      },
      {
        title: 'Allgemeine Bauberufe',
        note: 'Lernfeld 1 bis 9 — Grundlagen, die alle Bauberufe gemeinsam haben.',
        tiles: nachLernfeldnummer(BAUBERUFE_TILES),
      },
    ],
  },
  {
    id: 'rechentrainer',
    eyebrow: 'Rechnen üben',
    title: 'Rechentrainer',
    note: 'Nivellieren, Volumen und Prozentrechnung als Quiz, dazu Gesamtquiz und Materialrechner.',
    gruppen: [{ tiles: RECHENTRAINER_TILES }],
  },
  {
    id: 'spiele',
    eyebrow: 'Ausprobieren',
    title: 'Spiele',
    note: 'Lernspiele statt Frage-Antwort — dieselben Themen, andere Form.',
    gruppen: [{ tiles: SPIELE_TILES }],
  },
];

@Component({
  selector: 'app-kategorie',
  templateUrl: './kategorie.page.html',
  styleUrls: ['./kategorie.page.scss'],
  standalone: false,
})
export class KategoriePage implements OnInit {
  kategorie: Kategorie = KATEGORIEN[0];

  constructor(private readonly route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      this.kategorie = KATEGORIEN.find((k) => k.id === id) ?? KATEGORIEN[0];
    });
  }

  trackByTileId(_index: number, tile: QuizTile): string {
    return tile.id;
  }

  trackByGruppe(index: number, gruppe: KategorieGruppe): string {
    return gruppe.title ?? String(index);
  }

  tileImageStyle(tile: QuizTile): string | null {
    return tile.image ? `url('${tile.image}')` : null;
  }
}
