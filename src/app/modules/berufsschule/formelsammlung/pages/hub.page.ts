import { Component, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MINI_APPS, miniApp, skizzenVarianten } from '../apps';
import { AppMeta, FORMELSAMMLUNG, Formel, formel, kapitelTitel } from '../kern/daten';
import { MiniAppDef, ZahlAufgabe } from '../kern/typen';
import { fmt, randChoice } from '../kern/zahlen';
import { FormelFortschrittService } from '../komponenten/fortschritt.service';
import { AppStatusService } from '../../../../core/app-status/app-status.service';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { gastZugangBis } from '../../../../core/site-gate/site-gate.component';
import { alleAppTiles } from '../../../../shared/katalog';

type Ansicht = 'start' | 'finder' | 'pruefung' | 'nachschlagen';

/** Eine Seite der „Formelsammlung zum Blättern“ im Formelquiz: immer gleich aufgebaut, feste Reihenfolge. */
interface QuizSeite { meta: AppMeta; app: MiniAppDef; skizzen: string[]; formeln: Formel[] }
const SEITE_SPEICHER = 'glw-formelquiz-seite';

/** Formeln, die mathematisch dasselbe sind – nie als „falsche“ Option im Formelfinder. */
const GLEICHWERTIG: string[][] = [
  ['hf-sehne', 'hf-halbsehne', 'hf-ab'],
  ['y-kreis-naeherung', 'y-kreis-genau'],
  ['ra-regel', 'ra-ermessen', 'ra-genehmigung'],
  ['v-rampe', 'v-rampe-variante'],
];

function normal(t: string): string {
  return t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\\[a-z]+/g, ' ');
}

@Component({
  selector: 'app-fs-hub',
  templateUrl: './hub.page.html',
  styleUrls: ['../formelsammlung.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: false,
})
export class HubPage {
  ansicht: Ansicht = 'start';
  readonly apps = FORMELSAMMLUNG.apps;
  readonly gebaut = MINI_APPS;
  readonly kapitel = FORMELSAMMLUNG.kapitel;
  readonly stand = FORMELSAMMLUNG.stand;

  // Nachschlagen
  suche = '';
  kapitelFilter = '';

  // Formelquiz (früher Formelfinder): durch die Formelsammlung blättern und die passende Formel antippen
  finderAufgabe: ZahlAufgabe | null = null;
  finderGewaehltId: string | null = null;
  readonly seiten: QuizSeite[] = FORMELSAMMLUNG.apps
    .slice().sort((a, b) => a.nr - b.nr)
    .map(meta => ({ meta, app: miniApp(meta.id) }))
    .filter((x): x is { meta: AppMeta; app: MiniAppDef } => !!x.app)
    .map(({ meta, app }) => ({ meta, app, skizzen: skizzenVarianten(app).map(v => v.variante), formeln: FORMELSAMMLUNG.formeln.filter(f => f.app === meta.id && f.status !== 'unklar') }));
  seite = 0;
  inhaltOffen = false;
  private wischX: number | null = null;

  istAdmin = false;

  constructor(route: ActivatedRoute, readonly fs: FormelFortschrittService, private readonly appStatus: AppStatusService, auth: AuthService) {
    try { this.seite = Math.min(this.seiten.length - 1, Math.max(0, Number(localStorage.getItem(SEITE_SPEICHER)) || 0)); } catch { /* egal */ }
    auth.currentUser$.subscribe(u => { this.istAdmin = u?.role === 'admin'; });
    this.appStatus.laden();
    route.data.subscribe(d => {
      this.ansicht = (d['ansicht'] as Ansicht) ?? 'start';
      if (this.ansicht === 'finder' && !this.finderAufgabe) this.neueFinderAufgabe();
    });
  }

  istGebaut(id: string): boolean {
    return !!miniApp(id);
  }

  /** Freigabe je Themen-App kommt von ihrer Kachel auf der Startseite (formelsammlung-<id>, seit 2026-11-11). */
  private einstellung(id: string) {
    const kachel = alleAppTiles().find(t => t.id === 'formelsammlung-' + id);
    return kachel ? this.appStatus.einstellung(kachel) : null;
  }

  /** Versteckte Apps sehen nur Admins. */
  sichtbar(id: string): boolean {
    return this.istAdmin || this.einstellung(id)?.sichtbarkeit !== 'versteckt';
  }

  /** Gäste dürfen nur für Gäste freigegebene Apps öffnen. */
  gesperrt(id: string): boolean {
    return !this.istAdmin && !!gastZugangBis() && this.einstellung(id)?.sichtbarkeit !== 'gaeste';
  }

  ungeprueft(id: string): boolean {
    return this.einstellung(id)?.status !== 'geprueft';
  }

  testphase(id: string): boolean {
    return this.einstellung(id)?.status === 'testphase';
  }

  sterne(id: string): number {
    return this.fs.sterne(id);
  }

  anteil(id: string): number {
    return Math.round(this.fs.anteil(id) * 100);
  }

  kapitelName(id: string): string {
    return kapitelTitel(id);
  }

  appTitel(id: string): string {
    return this.apps.find(a => a.id === id)?.titel ?? id;
  }

  trackApp(_i: number, a: AppMeta): string {
    return a.id;
  }

  // ---------- Nachschlagen ----------

  get gefilterteFormeln(): Formel[] {
    const q = normal(this.suche.trim());
    const terms = q.split(/\s+/).filter(Boolean);
    return FORMELSAMMLUNG.formeln.filter(f => {
      if (this.kapitelFilter && f.kapitel !== this.kapitelFilter) return false;
      if (!terms.length) return true;
      const hay = normal([f.titel, f.latex, f.hinweis, this.appTitel(f.app), ...f.variablen.map(v => `${v.symbol} ${v.name} ${v.einheit}`)].join(' '));
      return terms.every(t => hay.includes(t));
    });
  }

  // ---------- Formelfinder ----------

  neueFinderAufgabe(): void {
    let a: ZahlAufgabe | null = null;
    while (!a) {
      const kandidat = randChoice(MINI_APPS).generiere('ueben', 2);
      // nur Aufgaben, deren Formel auch in der Blätter-Sammlung steht
      if (kandidat.art === 'zahl' && kandidat.text && this.seiten.some(sx => sx.formeln.some(f => f.id === kandidat.formelId))) a = kandidat;
    }
    this.finderAufgabe = a;
    this.finderGewaehltId = null;
  }

  /** Richtig, wenn genau die Formel oder eine mathematisch gleichwertige gewählt wurde. */
  finderIstRichtig(id: string | null): boolean {
    const soll = this.finderAufgabe?.formelId;
    if (!id || !soll) return false;
    return id === soll || !!GLEICHWERTIG.find(g => g.includes(soll))?.includes(id);
  }

  finderWaehlen(f: Formel): void {
    if (this.finderGewaehltId !== null || !this.finderAufgabe) return;
    this.finderGewaehltId = f.id;
    this.fs.finderErgebnis(this.finderIstRichtig(f.id));
  }

  get finderRichtigeFormel(): Formel | undefined {
    return this.finderAufgabe ? formel(this.finderAufgabe.formelId) : undefined;
  }

  get richtigeSeite(): number {
    const id = this.finderRichtigeFormel?.app;
    return this.seiten.findIndex(sx => sx.meta.id === id);
  }

  blaettern(delta: number): void {
    this.zuSeite(this.seite + delta);
  }

  zuSeite(i: number): void {
    this.seite = (i + this.seiten.length) % this.seiten.length;
    this.inhaltOffen = false;
    try { localStorage.setItem(SEITE_SPEICHER, String(this.seite)); } catch { /* egal */ }
  }

  wischStart(e: TouchEvent): void {
    this.wischX = e.touches[0]?.clientX ?? null;
  }

  wischEnde(e: TouchEvent): void {
    if (this.wischX === null) return;
    const dx = (e.changedTouches[0]?.clientX ?? this.wischX) - this.wischX;
    this.wischX = null;
    if (Math.abs(dx) > 60) this.blaettern(dx < 0 ? 1 : -1);
  }

  wert(w: number, nk: number): string {
    return fmt(w, nk);
  }

  // ---------- Gemischte Prüfung ----------

  get gebautTitel(): string {
    return this.gebaut.map(a => this.appTitel(a.id)).join(', ');
  }

  gemischtFertig(prozent: number): void {
    this.fs.gemischt(prozent);
  }
}
