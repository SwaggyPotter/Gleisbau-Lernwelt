import { Component, OnInit } from '@angular/core';
import { ProfilSyncService } from '../../../../core/auth/services/profil-sync.service';
import { ZUORDNUNGS_GRUPPEN, ZUORDNUNGS_PAARE, ZuordnungsGruppe, ZuordnungsPaar } from '../data/zuordnung';

const PRO_RUNDE = 5;

/**
 * Drag & Drop: Begriffe auf die passende Bedeutung ziehen.
 * Desktop: echtes Ziehen (HTML5 Drag & Drop). Touch: Begriff antippen, dann Feld antippen.
 */
@Component({
  selector: 'app-trassenplan-zuordnen',
  templateUrl: './zuordnen.component.html',
  styleUrls: ['./zuordnen.component.scss'],
  standalone: false,
})
export class TrassenplanZuordnenComponent implements OnInit {
  readonly gruppen = ZUORDNUNGS_GRUPPEN;
  gruppe: ZuordnungsGruppe | 'mix' = 'mix';

  ziele: ZuordnungsPaar[] = [];
  /** Begriffe, die noch nicht abgelegt sind. */
  ablage: ZuordnungsPaar[] = [];
  /** Ziel-ID → abgelegter Begriff */
  belegung: Record<string, ZuordnungsPaar | undefined> = {};
  gewaehlt: ZuordnungsPaar | null = null;
  geprueft = false;
  richtigGesamt = 0;
  rundenGesamt = 0;
  private gezogen: ZuordnungsPaar | null = null;

  constructor(private readonly profilSync: ProfilSyncService) {}

  ngOnInit(): void { this.neueRunde(); }

  neueRunde(): void {
    const pool = ZUORDNUNGS_PAARE.filter(p => this.gruppe === 'mix' || p.gruppe === this.gruppe);
    this.ziele = this.mischen(pool).slice(0, PRO_RUNDE);
    this.ablage = this.mischen([...this.ziele]);
    this.belegung = {};
    this.gewaehlt = null;
    this.geprueft = false;
  }

  get alleBelegt(): boolean { return this.ziele.every(z => this.belegung[z.id]); }
  get richtig(): number { return this.ziele.filter(z => this.belegung[z.id]?.id === z.id).length; }

  /* ---------- Antippen ---------- */
  waehlen(p: ZuordnungsPaar): void {
    if (this.geprueft) return;
    this.gewaehlt = this.gewaehlt?.id === p.id ? null : p;
  }

  zielKlick(ziel: ZuordnungsPaar): void {
    if (this.geprueft) return;
    if (this.gewaehlt) { this.ablegen(this.gewaehlt, ziel); this.gewaehlt = null; return; }
    // belegtes Feld antippen = Begriff zurücklegen
    const b = this.belegung[ziel.id];
    if (b) { this.belegung[ziel.id] = undefined; this.ablage.push(b); }
  }

  /* ---------- Ziehen ---------- */
  dragStart(ev: DragEvent, p: ZuordnungsPaar): void {
    if (this.geprueft) { ev.preventDefault(); return; }
    this.gezogen = p;
    ev.dataTransfer?.setData('text/plain', p.id);
    if (ev.dataTransfer) ev.dataTransfer.effectAllowed = 'move';
  }
  dragOver(ev: DragEvent): void { if (this.gezogen) ev.preventDefault(); }
  drop(ev: DragEvent, ziel: ZuordnungsPaar | null): void {
    ev.preventDefault();
    const p = this.gezogen; this.gezogen = null;
    if (!p || this.geprueft) return;
    if (ziel) this.ablegen(p, ziel);
    else this.zurueck(p);
  }
  dragEnd(): void { this.gezogen = null; }

  private ablegen(p: ZuordnungsPaar, ziel: ZuordnungsPaar): void {
    // aus Ablage oder anderem Ziel entfernen
    this.ablage = this.ablage.filter(a => a.id !== p.id);
    for (const k of Object.keys(this.belegung)) if (this.belegung[k]?.id === p.id) this.belegung[k] = undefined;
    const vorher = this.belegung[ziel.id];
    if (vorher) this.ablage.push(vorher);
    this.belegung[ziel.id] = p;
  }

  private zurueck(p: ZuordnungsPaar): void {
    for (const k of Object.keys(this.belegung)) if (this.belegung[k]?.id === p.id) this.belegung[k] = undefined;
    if (!this.ablage.some(a => a.id === p.id)) this.ablage.push(p);
  }

  pruefen(): void {
    if (!this.alleBelegt || this.geprueft) return;
    this.geprueft = true;
    this.rundenGesamt += this.ziele.length;
    this.richtigGesamt += this.richtig;
    this.ziele.forEach(z => this.profilSync.melde('zusatz:trassenplan', this.belegung[z.id]?.id === z.id));
  }

  zielKlasse(z: ZuordnungsPaar): string {
    if (!this.geprueft) return this.belegung[z.id] ? 'belegt' : '';
    return this.belegung[z.id]?.id === z.id ? 'ok' : 'falsch';
  }

  trackId(_i: number, p: ZuordnungsPaar): string { return p.id; }

  private mischen<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
}
