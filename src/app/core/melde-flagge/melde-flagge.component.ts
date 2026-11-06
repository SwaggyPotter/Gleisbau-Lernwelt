import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { alleAppTiles } from '../../shared/katalog';
import { QuestionReportService } from '../../services/question-report.service';

/**
 * Melde-Flagge in jeder App (Tim, 2026-11-06): kleiner Knopf rechts über dem Chat, öffnet ein kurzes
 * Formular. Die Meldung landet wie alle anderen in question_reports (Admin-Seite „Fragen“),
 * mit App-Name, Adresse und dem, was gerade zu sehen war (Überschrift/markierter Text).
 * Auf Startseite und Konto-Seiten ausgeblendet.
 */
@Component({
  selector: 'app-melde-flagge',
  templateUrl: './melde-flagge.component.html',
  styleUrls: ['./melde-flagge.component.scss'],
  standalone: false,
})
export class MeldeFlaggeComponent {
  readonly gruende = ['Inhalt ist falsch', 'Bild passt nicht', 'Rechnung/Lösung stimmt nicht', 'Etwas funktioniert nicht', 'Darstellung/Rechtschreibung', 'Sonstiges'];

  sichtbar = false;
  offen = false;
  grund = this.gruende[0];
  kommentar = '';
  status = '';
  gesendet = false;
  private url = '/';
  private kontext = '';

  constructor(private readonly router: Router, private readonly meldungen: QuestionReportService) {
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe(e => {
      this.url = e.urlAfterRedirects.split('?')[0].split('#')[0];
      this.sichtbar = !/^\/($|dashboard|konto\/|oeffentlich$)/.test(this.url);
      this.offen = false;
    });
  }

  /** Name der App zur aktuellen Adresse (längster passender Kachel-Link). */
  get appName(): string {
    const treffer = alleAppTiles()
      .filter(t => t.link && (this.url === t.link || this.url.startsWith(t.link + '/')))
      .sort((a, b) => b.link.length - a.link.length)[0];
    return treffer?.title ?? (document.title || this.url);
  }

  oeffnen(): void {
    // Was gerade zu sehen ist, für Tim mitschicken: markierter Text oder Überschrift/Frage der Seite
    const markiert = (window.getSelection()?.toString() ?? '').trim();
    const seite = document.querySelector('ion-router-outlet > .ion-page:not(.ion-page-hidden)') ?? document.body;
    const ueberschrift = (seite.querySelector('ion-card-title, h1, h2') as HTMLElement | null)?.innerText?.trim() ?? '';
    this.kontext = (markiert || ueberschrift).replace(/\s+/g, ' ').slice(0, 600);
    this.grund = this.gruende[0];
    this.kommentar = '';
    this.status = '';
    this.gesendet = false;
    this.offen = true;
  }

  senden(): void {
    const kommentar = this.kommentar.trim();
    if (!kommentar) { this.status = 'Bitte kurz beschreiben, was nicht stimmt.'; return; }
    const app = this.appName;
    this.meldungen.submitReport({
      questionId: 'app:' + this.url,
      topic: app,
      question: `App: ${app}\nAdresse: ${this.url}` + (this.kontext ? `\nZu sehen: ${this.kontext}` : ''),
      reason: this.grund,
      comment: kommentar.slice(0, 2000),
    });
    this.gesendet = true;
    this.status = 'Danke! Die Meldung ist angekommen.';
    setTimeout(() => { if (this.gesendet) this.offen = false; }, 1500);
  }
}
