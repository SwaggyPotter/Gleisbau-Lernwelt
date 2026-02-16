import { Component } from '@angular/core';

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
export class AppComponent {
  consentAccepted = false;
  consentDeclined = false;

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

  acceptConsent(): void {
    this.consentAccepted = true;
    this.consentDeclined = false;
  }

  declineConsent(): void {
    this.consentAccepted = false;
    this.consentDeclined = true;
  }
}
