import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProfilSyncService } from '../../../../core/auth/services/profil-sync.service';
import { AppStatusService } from '../../../../core/app-status/app-status.service';
import { alleAppTiles } from '../../../../shared/katalog';
import { ThemenquizFile, ThemenquizProgress } from '../../../themenquiz/models/themenquiz.models';
import { ThemenquizDataService } from '../../../themenquiz/services/themenquiz-data.service';
import { createTrassenplan, TrassenplanApi } from '../generator/trassenplan-generator';
import {
  Analyse, Aufgabe, AufgabenFeld, Bewertung, bewerten, Kategorie, KATEGORIEN, zufallsAufgabe, zufallsPlan, alleAufgaben,
} from '../services/trassenplan-aufgaben';

export type Modus = 'plan' | 'rechnen' | 'quiz' | 'zuordnen';
const MODI: Modus[] = ['plan', 'rechnen', 'quiz', 'zuordnen'];
const KACHEL_ID = 'themenquiz-trassenplan';

/**
 * Trassenplan (2026-11-10, ersetzt die Kachel „Trassenplan lesen“):
 *  - Plan:     Gleisvermarkungsplan-Generator (Editor, Prüfung, Export)
 *  - Rechnen:  Aufgabe aus dem aktuellen Plan, Ergebnis wird direkt im Plan eingetragen
 *  - Quiz:     die bisherigen Trassenplan-Wissenstestfragen
 *  - Zuordnen: Drag & Drop (Abkürzungen, Formeln, Bänder)
 */
@Component({
  selector: 'app-trassenplan',
  templateUrl: './trassenplan.page.html',
  styleUrls: ['./trassenplan.page.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: false,
})
export class TrassenplanPage implements AfterViewInit, OnDestroy {
  @ViewChild('planHost', { static: true }) planHost!: ElementRef<HTMLDivElement>;

  modus: Modus = 'plan';
  readonly kategorien = KATEGORIEN;
  kategorie: Kategorie = 'mix';
  werteVorgeben = true;
  aufgabe: Aufgabe | null = null;
  keineAufgabe = false;
  bewertung: Record<string, Bewertung> = {};
  formelZeigen = false;
  loesungZeigen = false;
  geloest = 0;
  versuche = 0;
  private gewertet = false;

  quiz?: ThemenquizFile;
  quizFehler = '';
  private quizProgress: ThemenquizProgress = { quizStats: {} };

  private api?: TrassenplanApi;

  /** Hinweis „noch nicht geprüft“ (Tim, 2026-11-11) – verschwindet, sobald die Kachel auf „geprüft“ steht */
  ungeprueft = false;
  hinweisZu = false;
  private statusAbo?: { unsubscribe(): void };

  constructor(
    private readonly zone: NgZone,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly quizData: ThemenquizDataService,
    private readonly profilSync: ProfilSyncService,
    private readonly appStatus: AppStatusService,
  ) {
    const kachel = alleAppTiles().find(t => t.id === KACHEL_ID);
    if (kachel) {
      this.ungeprueft = this.appStatus.einstellung(kachel).status !== 'geprueft';
      this.statusAbo = this.appStatus.einstellungen$.subscribe(() => { this.ungeprueft = this.appStatus.einstellung(kachel).status !== 'geprueft'; });
      this.appStatus.laden();
    }
    const m = this.route.snapshot.queryParamMap.get('modus') as Modus | null;
    if (m && MODI.includes(m)) this.modus = m;
  }

  ngAfterViewInit(): void {
    // Engine außerhalb von Angular laufen lassen (viele DOM-Events, eigenes Rendering)
    this.zone.runOutsideAngular(() => {
      this.api = createTrassenplan(this.planHost.nativeElement, {
        onChange: () => this.zone.run(() => this.planGeaendert()),
        onPruefen: () => this.zone.run(() => this.pruefen()),
      });
    });
    if (this.modus === 'rechnen') setTimeout(() => this.neueAufgabe());
    if (this.modus === 'quiz') this.quizLaden();
  }

  ngOnDestroy(): void { this.api?.destroy(); this.statusAbo?.unsubscribe(); }

  get zeigtPlan(): boolean { return this.modus === 'plan' || this.modus === 'rechnen'; }

  wechseln(m: Modus): void {
    if (m === this.modus) return;
    this.modus = m;
    this.router.navigate([], { relativeTo: this.route, queryParams: { modus: m === 'plan' ? null : m }, replaceUrl: true });
    if (m === 'rechnen') { if (this.aufgabe) this.uebungSetzen(); else this.neueAufgabe(); }
    else this.api?.setUebung(null);
    if (m === 'quiz') this.quizLaden();
  }

  /* ---------------- Rechnen ---------------- */
  neueAufgabe(): void {
    if (!this.api) return;
    const an = this.api.analyse() as Analyse;
    this.aufgabe = zufallsAufgabe(an, this.kategorie, this.aufgabe?.id);
    this.keineAufgabe = !this.aufgabe;
    this.bewertung = {};
    this.formelZeigen = false;
    this.loesungZeigen = false;
    this.gewertet = false;
    this.uebungSetzen();
  }

  private uebungSetzen(): void {
    if (!this.api) return;
    this.api.setUebung(this.aufgabe ? this.aufgabe.felder : null);
    if (this.aufgabe) setTimeout(() => this.zumFeld(), 50);
  }

  zumFeld(f?: AufgabenFeld): void {
    const ziel = f ?? this.aufgabe?.felder.find(x => this.bewertung[x.id] !== 'ok') ?? this.aufgabe?.felder[0];
    if (ziel) this.api?.zeigeFeld(ziel.id);
  }

  pruefen(): void {
    if (!this.aufgabe || !this.api) return;
    const w = this.api.werte();
    const b: Record<string, Bewertung> = {};
    this.aufgabe.felder.forEach(f => { const r = bewerten(f, w[f.id]); if (r) b[f.id] = r; });
    this.bewertung = b;
    this.api.setStatus(b);
    const alleOk = this.aufgabe.felder.every(f => b[f.id] === 'ok');
    const alleAusgefuellt = this.aufgabe.felder.every(f => b[f.id]);
    if (alleAusgefuellt && !this.gewertet) {
      this.gewertet = true;
      this.versuche += 1;
      if (alleOk) this.geloest += 1;
      this.profilSync.melde('zusatz:trassenplan', alleOk);
    }
    if (!alleAusgefuellt) this.zumFeld();
  }

  get stand(): string {
    if (!this.aufgabe) return '';
    const ok = this.aufgabe.felder.filter(f => this.bewertung[f.id] === 'ok').length;
    return `${ok}/${this.aufgabe.felder.length}`;
  }

  get alleRichtig(): boolean { return !!this.aufgabe && this.aufgabe.felder.every(f => this.bewertung[f.id] === 'ok'); }

  bewertungText(f: AufgabenFeld): string {
    switch (this.bewertung[f.id]) {
      case 'ok': return 'richtig';
      case 'nah': return 'knapp daneben';
      case 'falsch': return 'falsch';
      default: return 'offen';
    }
  }

  sollText(f: AufgabenFeld): string {
    return f.soll.toFixed(Math.max(1, f.nachkomma)).replace('.', ',') + ' ' + f.einheit;
  }

  wuerfeln(): void {
    if (!this.api) return;
    if (!confirm('Den aktuellen Plan durch eine zufällige Übungsstrecke ersetzen?\n(Eigene Daten vorher über „JSON speichern“ sichern.)')) return;
    this.api.setPlan(zufallsPlan());
    this.neueAufgabe();
  }

  /** Plan im Editor geändert: laufende Aufgabe neu berechnen, falls es sie noch gibt. */
  private planGeaendert(): void {
    if (this.modus !== 'rechnen' || !this.aufgabe || !this.api) return;
    const neu = alleAufgaben(this.api.analyse() as Analyse).find(a => a.id === this.aufgabe!.id);
    if (neu) { this.aufgabe = neu; this.bewertung = {}; this.api.setStatus({}); }
    else this.neueAufgabe();
  }

  /* ---------------- Quiz ---------------- */
  private quizLaden(): void {
    if (this.quiz) return;
    this.quizProgress = this.quizData.loadProgress('trassenplan');
    this.quizData.getQuiz('trassenplan').subscribe({
      next: q => (this.quiz = q),
      error: () => (this.quizFehler = 'Die Quizfragen konnten nicht geladen werden.'),
    });
  }

  quizAnswered(p: { id: string; correct: boolean }): void {
    this.quizProgress = this.quizData.recordResult('trassenplan', p.id, p.correct);
  }
}
