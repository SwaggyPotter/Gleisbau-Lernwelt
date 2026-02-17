import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from './services/auth.service';
import { GamificationService } from './services/gamification.service';

type ConsentSection = {
  title: string;
  items: string[];
};

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly consentStorageKey = 'gleisbau-privacy-consent';
  private readonly sub = new Subscription();

  consentAccepted = false;
  consentDeclined = false;
  showPrivacyDialog = true;

  readonly consentSections: ConsentSection[] = [
    {
      title: 'Browserdaten auf deinem Geraet',
      items: [
        'Lernfortschritte und Quizstaende werden pro Modul im localStorage gespeichert.',
        'Gespeichert werden z. B. bearbeitete Inhalte, richtige/falsche Antworten und Zeitstempel fuer Quizversuche.',
      ],
    },
    {
      title: 'Account- und Lerndaten auf dem Server',
      items: [
        'Bei Registrierung/Login: E-Mail, Lern-Key und Passwort (nur als Passwort-Hash).',
        'Zum Account gehoeren ausserdem Name, Rolle, Lehrjahr und verwendeter Lern-Key.',
        'Beim Lernen mit Account: Fortschritt je Lernfeld, Fehlerzaehler, Quiz-Session, Antworten und Ergebnisdaten.',
      ],
    },
    {
      title: 'Technische Verbindungsdaten',
      items: [
        'Der Server verarbeitet technische Request-Daten wie IP-Adresse, Zeitpunkt, URL, HTTP-Status und User-Agent.',
        'Diese Daten werden fuer Betrieb, Sicherheit, Fehleranalyse und Missbrauchsschutz (Rate-Limit) verwendet.',
      ],
    },
    {
      title: 'Cookies und Tracking',
      items: [
        'Es werden aktuell keine Marketing- oder Analyse-Tracker von Drittanbietern geladen.',
        'Es werden aktuell keine zustimmungspflichtigen Tracking-Cookies fuer Werbung gesetzt.',
      ],
    },
  ];

  constructor(
    private readonly router: Router,
    private readonly auth: AuthService,
    private readonly gamification: GamificationService,
  ) {}

  ngOnInit(): void {
    this.consentAccepted = this.loadConsentFromStorage();
    this.showPrivacyDialog = !this.consentAccepted;

    this.sub.add(
      this.router.events.subscribe(event => {
        if (!(event instanceof NavigationEnd)) {
          return;
        }
        this.trackLearningRoute(event.urlAfterRedirects);
      }),
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  acceptConsent(): void {
    this.consentAccepted = true;
    this.consentDeclined = false;
    this.showPrivacyDialog = false;
    this.persistConsent();
  }

  declineConsent(): void {
    this.consentAccepted = false;
    this.consentDeclined = true;
    this.showPrivacyDialog = true;
  }

  openPrivacyDialog(): void {
    this.showPrivacyDialog = true;
    this.consentDeclined = false;
  }

  closePrivacyDialog(): void {
    if (!this.consentAccepted) {
      return;
    }

    this.showPrivacyDialog = false;
  }

  private loadConsentFromStorage(): boolean {
    try {
      return localStorage.getItem(this.consentStorageKey) === 'accepted';
    } catch {
      return false;
    }
  }

  private persistConsent(): void {
    try {
      localStorage.setItem(this.consentStorageKey, 'accepted');
    } catch {
      // ignore storage errors and keep current in-memory state
    }
  }

  private trackLearningRoute(url: string): void {
    const user = this.auth.currentUser;
    if (!user) {
      return;
    }

    const isLearningRoute = /^\/(lernfelder\/\d+|zusatz\/[^/?#]+|field\/[^/]+\/quiz)(\/|$)/.test(url);
    if (isLearningRoute) {
      this.gamification.recordLearningDay(user.id);
    }
  }
}
