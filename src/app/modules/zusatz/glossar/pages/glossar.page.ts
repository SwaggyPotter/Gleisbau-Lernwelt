import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { GLOSSAR_EINTRAEGE, GLOSSAR_QUELLEN_STAND } from '../data/glossar-eintraege';
import { GlossarEintrag, Kategorie, KATEGORIE_LABELS, glossarId, glossarPruefsumme } from '../models/glossar.models';
import { GlossarFreigabe, GlossarFreigabenService } from '../services/glossar-freigaben.service';
import { AuthService } from '../../../../core/auth/services/auth.service';

const ALLE = 'alle';

type PruefStatus = 'geprueft' | 'geaendert' | 'offen';
type PruefFilter = 'alle' | 'offen' | 'geprueft';

interface Zeile {
  e: GlossarEintrag;
  id: string;
  summe: string;
}

@Component({
  selector: 'app-glossar',
  templateUrl: './glossar.page.html',
  styleUrls: ['./glossar.page.scss'],
  standalone: false,
})
export class GlossarPage implements OnDestroy {
  readonly alleId = ALLE;
  readonly quellenStand = GLOSSAR_QUELLEN_STAND;
  readonly kategorieLabels = KATEGORIE_LABELS;
  readonly kategorien = Object.keys(KATEGORIE_LABELS) as Kategorie[];
  private readonly alleZeilen: Zeile[] = [...GLOSSAR_EINTRAEGE]
    .sort((a, b) => a.begriff.localeCompare(b.begriff, 'de'))
    .map(e => ({ e, id: glossarId(e), summe: glossarPruefsumme(e) }));

  suchbegriff = '';
  ausgewaehlteKategorie: string = ALLE;
  pruefFilter: PruefFilter = 'alle';
  freigaben: Record<string, GlossarFreigabe> = {};
  /** IDs, deren Speichern gerade läuft */
  speichert = new Set<string>();
  fehlerId: string | null = null;
  private readonly sub: Subscription;

  constructor(private readonly freigabenService: GlossarFreigabenService, private readonly auth: AuthService) {
    this.sub = freigabenService.freigaben$.subscribe(f => (this.freigaben = f));
    freigabenService.neuLaden();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  get istAdmin(): boolean {
    return this.auth.isAdmin;
  }

  onSucheChange(value: string | number | null | undefined): void {
    this.suchbegriff = typeof value === 'string' ? value : '';
  }

  waehleKategorie(kategorie: string): void {
    this.ausgewaehlteKategorie = kategorie;
  }

  status(z: Zeile): PruefStatus {
    const f = this.freigaben[z.id];
    if (!f) return 'offen';
    return f.pruefsumme === z.summe ? 'geprueft' : 'geaendert';
  }

  freigabe(z: Zeile): GlossarFreigabe | undefined {
    return this.freigaben[z.id];
  }

  get gefilterteZeilen(): Zeile[] {
    const query = this.normalisieren(this.suchbegriff);
    return this.alleZeilen.filter(z => {
      const e = z.e;
      if (this.ausgewaehlteKategorie !== ALLE && e.kategorie !== this.ausgewaehlteKategorie) return false;
      if (this.pruefFilter === 'geprueft' && this.status(z) !== 'geprueft') return false;
      if (this.pruefFilter === 'offen' && this.status(z) === 'geprueft') return false;
      if (!query) return true;
      return this.normalisieren(`${e.begriff} ${e.definition}`).includes(query);
    });
  }

  get anzahlProKategorie(): Record<string, number> {
    const counts: Record<string, number> = { [ALLE]: this.alleZeilen.length };
    for (const k of this.kategorien) counts[k] = this.alleZeilen.filter(z => z.e.kategorie === k).length;
    return counts;
  }

  get anzahlGeprueft(): number {
    return this.alleZeilen.filter(z => this.status(z) === 'geprueft').length;
  }

  get anzahlGesamt(): number {
    return this.alleZeilen.length;
  }

  freigeben(z: Zeile): void {
    this.speichern(z, this.freigabenService.freigeben(z.id, z.summe, this.auth.snapshotUser?.fullName ?? null));
  }

  zuruecknehmen(z: Zeile): void {
    this.speichern(z, this.freigabenService.zuruecknehmen(z.id));
  }

  datum(iso: string): string {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('de-DE');
  }

  trackZeile(_i: number, z: Zeile): string {
    return z.id;
  }

  private speichern(z: Zeile, aktion: ReturnType<GlossarFreigabenService['zuruecknehmen']>): void {
    this.speichert.add(z.id);
    this.fehlerId = null;
    aktion.subscribe({
      next: () => this.speichert.delete(z.id),
      error: () => { this.speichert.delete(z.id); this.fehlerId = z.id; },
    });
  }

  private normalisieren(value: string): string {
    return value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');
  }
}
