import { Component } from '@angular/core';
import { GLOSSAR_EINTRAEGE } from '../data/glossar-eintraege';
import { GlossarEintrag, Kategorie, KATEGORIE_LABELS } from '../models/glossar.models';

const ALLE = 'alle';

@Component({
  selector: 'app-glossar',
  templateUrl: './glossar.page.html',
  styleUrls: ['./glossar.page.scss'],
  standalone: false,
})
export class GlossarPage {
  readonly alleId = ALLE;
  readonly kategorieLabels = KATEGORIE_LABELS;
  readonly kategorien = Object.keys(KATEGORIE_LABELS) as Kategorie[];
  private readonly alleEintraege = [...GLOSSAR_EINTRAEGE].sort((a, b) => a.begriff.localeCompare(b.begriff, 'de'));

  suchbegriff = '';
  ausgewaehlteKategorie: string = ALLE;

  onSucheChange(value: string | number | null | undefined): void {
    this.suchbegriff = typeof value === 'string' ? value : '';
  }

  waehleKategorie(kategorie: string): void {
    this.ausgewaehlteKategorie = kategorie;
  }

  get gefilterteEintraege(): GlossarEintrag[] {
    const query = this.normalisieren(this.suchbegriff);
    return this.alleEintraege.filter(e => {
      if (this.ausgewaehlteKategorie !== ALLE && e.kategorie !== this.ausgewaehlteKategorie) return false;
      if (!query) return true;
      const haystack = this.normalisieren(`${e.begriff} ${e.definition}`);
      return haystack.includes(query);
    });
  }

  get anzahlProKategorie(): Record<string, number> {
    const counts: Record<string, number> = { [ALLE]: this.alleEintraege.length };
    for (const k of this.kategorien) counts[k] = this.alleEintraege.filter(e => e.kategorie === k).length;
    return counts;
  }

  private normalisieren(value: string): string {
    return value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');
  }
}
