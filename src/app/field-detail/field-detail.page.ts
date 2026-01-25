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
    'gb-01': {
      lehrjahr: '1. Lehrjahr',
      lernfeld: 'LF 1',
      titel: 'Arbeitsplätze im Gleisbau vorbereiten und sichern',
      geltung: 'bundesweit',
      schwerpunkt: 'Sicherheit, Organisation, Verhalten',
      niveau: 'Einstieg / Grundlagen',
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
