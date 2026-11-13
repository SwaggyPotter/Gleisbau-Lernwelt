import { Injectable } from '@angular/core';
import { AppFortschritt, FortschrittSpeicher, fortschrittAnteil } from '../kern/fortschritt';
import { richtigeAntworten, sterneFuer } from '../../../../shared/sterne';
import { QuizTile } from '../../../../shared/katalog';
import { AufgabenModus } from '../kern/typen';
import { ProfilSyncService } from '../../../../core/auth/services/profil-sync.service';

/** Angular-Hülle um den Fortschritt-Speicher (localStorage). */
@Injectable({ providedIn: 'root' })
export class FormelFortschrittService {
  private readonly speicher = new FortschrittSpeicher();

  constructor(private readonly profilSync: ProfilSyncService) {}

  /** Jede Antwort zählt zusätzlich in die zentrale Statistik (Sterne auf der Startseite, Lernfortschritt). */
  melde(schluessel: string, richtig: boolean): void {
    // Der Schienenausdehnungs-Rechner nutzt dieselben Bausteine, zählt aber selbst unter „zusatz:schienendehnung“
    if (schluessel === 'schienendehnung') return;
    this.profilSync.melde('formelsammlung:' + schluessel, richtig);
  }

  app(id: string): AppFortschritt {
    return this.speicher.app(id);
  }

  /** 5 Sterne wie auf der Startseite: ab 1 / 10 / 50 / 150 / 250 richtigen Antworten (seit 2026-11-11). */
  sterne(id: string): number {
    return sterneFuer(richtigeAntworten({ id: 'formelsammlung-' + id, link: '' } as QuizTile) ?? 0);
  }

  anteil(id: string): number {
    return fortschrittAnteil(this.speicher.app(id));
  }

  ergebnis(appId: string, modus: AufgabenModus, richtig: boolean): AppFortschritt {
    this.melde(appId, richtig);
    return this.speicher.ergebnis(appId, modus, richtig);
  }

  pruefung(appId: string, prozent: number): void {
    this.speicher.pruefung(appId, prozent);
  }

  get finder() {
    return this.speicher.finder;
  }

  finderErgebnis(richtig: boolean): void {
    this.melde('finder', richtig);
    this.speicher.finderErgebnis(richtig);
  }

  get gemischtBest(): number {
    return this.speicher.gemischtBest;
  }

  gemischt(prozent: number): void {
    this.speicher.gemischt(prozent);
  }
}
