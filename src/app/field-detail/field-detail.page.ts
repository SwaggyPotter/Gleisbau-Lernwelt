import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService, FieldDto } from '../services/api.service';

type FieldMeta = {
  lehrjahr: string;
  lernfeld: string;
  titel: string;
  geltung: string;
  schwerpunkt: string;
  niveau: string;
};

@Component({
  selector: 'app-field-detail',
  templateUrl: './field-detail.page.html',
  styleUrls: ['./field-detail.page.scss'],
  standalone: false,
})
export class FieldDetailPage implements OnInit, OnDestroy {
  field?: FieldDto;
  meta?: FieldMeta;
  error = '';
  private sub = new Subscription();

  // Minimal metadata store; extend as more Lernfelder kommen
  private readonly metaById: Record<string, FieldMeta> = {
    'lf-01': {
      lehrjahr: '1. Lehrjahr',
      lernfeld: 'LF 1',
      titel: 'Baustellen einrichten',
      geltung: 'bundesweit',
      schwerpunkt: 'Sicherheit, Organisation, Baustelleneinrichtung',
      niveau: 'Einstieg / Grundlagen',
    },
    'lf-02': {
      lehrjahr: '1. Lehrjahr',
      lernfeld: 'LF 2',
      titel: 'Bauwerke erschließen und gründen',
      geltung: 'bundesweit',
      schwerpunkt: 'Grundlagen Erschließung, Fundamente, Baugrund',
      niveau: 'Einstieg / Grundlagen',
    },
    'lf-03': {
      lehrjahr: '1. Lehrjahr',
      lernfeld: 'LF 3',
      titel: 'Einschalige Baukörper mauern',
      geltung: 'bundesweit',
      schwerpunkt: 'Mauerwerk, Steine, Verbände (Grundlagen Hoch-/Tiefbau)',
      niveau: 'Einstieg / Grundlagen',
    },
    'lf-04': {
      lehrjahr: '1. Lehrjahr',
      lernfeld: 'LF 4',
      titel: 'Stahlbetonbauteile herstellen',
      geltung: 'bundesweit',
      schwerpunkt: 'Schalung, Bewehrung, Beton',
      niveau: 'Einstieg / Grundlagen',
    },
    'lf-05': {
      lehrjahr: '1. Lehrjahr',
      lernfeld: 'LF 5',
      titel: 'Holzkonstruktionen herstellen',
      geltung: 'bundesweit',
      schwerpunkt: 'Holzbauteile, Verbindungen, Montage',
      niveau: 'Einstieg / Grundlagen',
    },
    'lf-06': {
      lehrjahr: '1. Lehrjahr',
      lernfeld: 'LF 6',
      titel: 'Bauteile beschichten und bekleiden',
      geltung: 'bundesweit',
      schwerpunkt: 'Schutz, Abdichtung, Oberflächen',
      niveau: 'Einstieg / Grundlagen',
    },
    'lf-07': {
      lehrjahr: '2. Lehrjahr',
      lernfeld: 'LF 7',
      titel: 'Baugruben und Graeben herstellen und sichern',
      geltung: 'bundesweit',
      schwerpunkt: 'Boeschung, Verbau, Wasserhaltung, Arbeitssicherheit',
      niveau: 'Aufbau',
    },
    'lf-08': {
      lehrjahr: '2. Lehrjahr',
      lernfeld: 'LF 8',
      titel: 'Verkehrsflaechen herstellen',
      geltung: 'bundesweit',
      schwerpunkt: 'Planum, Schichtenaufbau, Pflaster, Asphalt, Entwaesserung',
      niveau: 'Aufbau',
    },
    'lf-09': {
      lehrjahr: '2. Lehrjahr',
      lernfeld: 'LF 9',
      titel: 'Verkehrsflächen aus Pflaster- und Plattenbelägen herstellen',
      geltung: 'bundesweit',
      schwerpunkt: 'Wege, Flächen, Unterbau',
      niveau: 'Aufbau',
    },
    'lf-10': {
      lehrjahr: '2. Lehrjahr',
      lernfeld: 'LF 10',
      titel: 'Gleisanlagen neu bauen',
      geltung: 'bundesweit',
      schwerpunkt: 'Gleisaufbau, Schotter, Schwellen, Schienen',
      niveau: 'Aufbau / Einstieg Gleisbau',
    },
    'lf-11': {
      lehrjahr: '3. Lehrjahr',
      lernfeld: 'LF 11',
      titel: 'Gleisbögen herstellen und einmessen',
      geltung: 'bundesweit',
      schwerpunkt: 'Vermessung, Gleislage, Radien',
      niveau: 'Fortgeschritten',
    },
    'lf-12': {
      lehrjahr: '3. Lehrjahr',
      lernfeld: 'LF 12',
      titel: 'Weichen montieren und einmessen',
      geltung: 'bundesweit',
      schwerpunkt: 'Weichenarten, Einbau, Kontrolle',
      niveau: 'Fortgeschritten',
    },
    'lf-13': {
      lehrjahr: '3. Lehrjahr',
      lernfeld: 'LF 13',
      titel: 'Verkehrsflächen befestigen',
      geltung: 'bundesweit',
      schwerpunkt: 'Bahnübergänge, angrenzende Verkehrsflächen',
      niveau: 'Fortgeschritten',
    },
    'lf-14': {
      lehrjahr: '3. Lehrjahr',
      lernfeld: 'LF 14',
      titel: 'Gleisanlagen instand halten',
      geltung: 'bundesweit',
      schwerpunkt: 'Wartung, Reparatur, Qualitätssicherung',
      niveau: 'Fortgeschritten',
    },
  };

  constructor(
    private readonly route: ActivatedRoute,
    private readonly api: ApiService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.sub.add(
      this.route.paramMap.subscribe(params => {
        const id = params.get('id');
        if (!id) {
          this.error = 'Lernfeld-ID fehlt';
          return;
        }
        this.loadField(id);
      }),
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  private loadField(id: string): void {
    this.api.getFields().subscribe({
      next: res => {
        const found = res.fields.find(f => f.id === id);
        if (!found) {
          this.error = 'Lernfeld nicht gefunden';
          return;
        }
        this.field = found;
        this.meta = this.metaById[id];
      },
      error: () => this.error = 'Lernfeld konnte nicht geladen werden',
    });
  }
}


