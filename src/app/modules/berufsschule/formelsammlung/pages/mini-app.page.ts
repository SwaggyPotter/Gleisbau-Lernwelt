import { Component, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { miniApp, skizzenVarianten } from '../apps';
import { AppMeta, Formel, appMeta, formel, kapitelTitel } from '../kern/daten';
import { AufgabenModus, MiniAppDef, Modus } from '../kern/typen';
import { FormelFortschrittService } from '../komponenten/fortschritt.service';
import { AppStatusService } from '../../../../core/app-status/app-status.service';
import { alleAppTiles } from '../../../../shared/katalog';

/** Üben (Rechenfläche + Ergebnis-Leiste) ist der Start-Modus jeder Themen-App (Tim, 2026-11-11). */
const START_MODUS: Modus = 'ueben';

const MODI: { id: Modus; label: string; icon: string }[] = [
  { id: 'ueben', label: 'Üben', icon: 'create-outline' },
  { id: 'erklaeren', label: 'Erklären', icon: 'book-outline' },
  { id: 'rechner', label: 'Rechner', icon: 'calculator-outline' },
  { id: 'umstellen', label: 'Umstellen', icon: 'swap-vertical-outline' },
  { id: 'einheiten', label: 'Einheiten-Falle', icon: 'warning-outline' },
  { id: 'pruefung', label: 'Prüfung', icon: 'timer-outline' },
];

@Component({
  selector: 'app-fs-mini-app',
  templateUrl: './mini-app.page.html',
  styleUrls: ['../formelsammlung.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: false,
})
export class MiniAppPage {
  readonly modi = MODI;

  /** Name des aktiven Modus neben den Symbolen */
  get modusName(): string {
    return MODI.find(m => m.id === this.modus)?.label ?? '';
  }
  app?: MiniAppDef;
  meta?: AppMeta;
  formeln: Formel[] = [];
  modus: Modus = START_MODUS;

  /** Hinweis „noch nicht geprüft“ weggeklickt (gilt bis zum nächsten Öffnen) */
  hinweisZu = false;

  constructor(route: ActivatedRoute, private readonly router: Router, readonly fs: FormelFortschrittService, private readonly appStatus: AppStatusService) {
    this.appStatus.laden();
    route.paramMap.subscribe(p => {
      const id = p.get('appId') ?? '';
      this.app = miniApp(id);
      this.meta = appMeta(id);
      this.formeln = this.app ? this.app.formelIds.map(formel) : [];
    });
    route.queryParamMap.subscribe(q => {
      const m = q.get('modus') as Modus | null;
      this.modus = m && MODI.some(x => x.id === m) ? m : START_MODUS;
    });
  }

  get kapitel(): string {
    return this.meta ? `Kap. ${this.meta.kapitel} – ${kapitelTitel(this.meta.kapitel)}` : '';
  }

  get aufgabenModus(): AufgabenModus | null {
    return this.modus === 'ueben' || this.modus === 'umstellen' || this.modus === 'einheiten' ? this.modus : null;
  }

  get sterne(): number {
    return this.app ? this.fs.sterne(this.app.id) : 0;
  }

  modusSetzen(m: Modus): void {
    this.router.navigate([], { queryParams: { modus: m === START_MODUS ? null : m }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  pruefungFertig(prozent: number): void {
    if (this.app) this.fs.pruefung(this.app.id, prozent);
  }

  /** Skizzen im Erklären-Modus (Pfeilhöhe zeigt beide Varianten, Ausrundung Kuppe und Wanne). */
  get erklaerSkizzen(): string[] {
    return this.app ? skizzenVarianten(this.app).map(v => v.variante) : [];
  }

  /** Üben/Umstellen/Einheiten/Prüfung: breitere Seite, damit Schmierblatt und Rechner nebeneinander passen. */
  get breit(): boolean {
    return !!this.aufgabenModus || this.modus === 'pruefung';
  }

  /** Status kommt von der Kachel „formelsammlung-<id>“ auf der Startseite (Admin-Menü). */
  get testphase(): boolean {
    const kachel = this.app ? alleAppTiles().find(t => t.id === 'formelsammlung-' + this.app!.id) : undefined;
    return !!kachel && this.appStatus.einstellung(kachel).status === 'testphase';
  }

  get ungeprueft(): boolean {
    const kachel = this.app ? alleAppTiles().find(t => t.id === 'formelsammlung-' + this.app!.id) : undefined;
    return !!kachel && this.appStatus.einstellung(kachel).status !== 'geprueft';
  }
}
