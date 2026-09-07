import { Component } from '@angular/core';
import { OfflineService } from '../../../core/offline/offline.service';
import { OfflineFortschritt } from '../../../core/offline/offline.models';

@Component({
  selector: 'app-offline',
  templateUrl: './offline.page.html',
  styleUrls: ['./offline.page.scss'],
  standalone: false,
})
export class OfflinePage {
  readonly fortschritt$ = this.offline.fortschritt$;

  constructor(private readonly offline: OfflineService) {}

  get status() {
    return this.offline.status;
  }

  get netzwerkHinweis(): string | null {
    return this.offline.netzwerkHinweis;
  }

  prozent(f: OfflineFortschritt): number {
    return f.gesamt === 0 ? 0 : Math.round((f.fertig / f.gesamt) * 100);
  }

  starten(): void {
    this.offline.starten();
  }

  abbrechen(): void {
    this.offline.abbrechen();
  }

  zuruecksetzen(): void {
    this.offline.zuruecksetzen();
  }
}
