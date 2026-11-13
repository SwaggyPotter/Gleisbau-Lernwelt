import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';
import { Empfaenger, Nachricht, NeueNachricht, PostfachService } from '../../../core/postfach/postfach.service';

/** Vorlagen für den Admin (Knopf füllt das Formular, gesendet wird erst mit „Senden“) */
const VORLAGEN: { name: string; empfaengerSuche?: RegExp; n: Omit<NeueNachricht, 'an'> }[] = [
  {
    name: 'Mustafas Rechner-Idee',
    // genau das Konto, von dem Meldung #7 kam (es gibt zusätzlich „Mustafa Tarakci (Gast)“)
    empfaengerSuche: /^mustafa \(gast\)$/i,
    n: {
      betreff: 'Deine Idee für den Schotterrechner ist eingebaut',
      text: `Hallo Mustafa,

danke für deine Meldung zum Schotterrechner! Ich habe deine Ideen zum Ausprobieren eingebaut – im Schotterrechner gibt es jetzt den Knopf „💡 Mustafas Rechner-Idee“:

• Im Text-Werkzeug mit Einheiten rechnen: 1t + 2t = 3t, 3m² + 1m² = 4m², und bei 3t/m³ × 1,5m³ kürzen sich die m³ weg (Ergebnis 4,5t – 3 × 1,5 sind übrigens 4,5 und nicht 6 😉)
• m2 und m3 werden beim Tippen automatisch zu m² und m³
• Schriftfarbe: Text-Werkzeug wählen, dann eine Farbe antippen – der Text bekommt die Farbe
• Bei Schwer und Experte steht die Schwellenteilung nicht mehr in der Aufgabe, du rechnest sie aus dem Aufmaß selbst aus

Probier es aus und sag mir über „Passt das so? Rückmeldung geben“, ob es so in Ordnung ist oder was noch fehlt.

Tim`,
      link: '/zusatz/schotterbett?idee=mustafa',
      linkText: 'Zum Schotterrechner (mit deiner Idee)',
    },
  },
];

@Component({
  selector: 'app-postfach',
  templateUrl: './postfach.page.html',
  styleUrls: ['./postfach.page.scss'],
  standalone: false,
})
export class PostfachPage {
  nachrichten: Nachricht[] = [];
  laedt = true;
  fehler: string | null = null;
  offen: number | null = null;

  // Admin: schreiben
  readonly vorlagen = VORLAGEN;
  empfaenger: Empfaenger[] = [];
  schreibenOffen = false;
  entwurf: NeueNachricht = { an: '', betreff: '', text: '', link: '', linkText: '' };
  sendet = false;
  sendeStatus: string | null = null;

  constructor(
    private readonly postfach: PostfachService,
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  get istAdmin(): boolean { return this.auth.isAdmin; }
  get angemeldet(): boolean { return this.auth.isLoggedIn; }
  get ungelesen(): number { return this.nachrichten.filter(n => !n.gelesen).length; }

  ionViewWillEnter(): void {
    this.laden();
    if (this.istAdmin && !this.empfaenger.length) {
      this.postfach.empfaenger().subscribe({ next: r => { this.empfaenger = r.empfaenger; }, error: () => undefined });
    }
  }

  laden(): void {
    if (!this.angemeldet) { this.laedt = false; return; }
    this.laedt = true; this.fehler = null;
    this.postfach.liste().subscribe({
      next: r => { this.nachrichten = r.nachrichten; this.laedt = false; },
      error: () => { this.laedt = false; this.fehler = 'Postfach konnte nicht geladen werden.'; },
    });
  }

  umschalten(n: Nachricht): void {
    this.offen = this.offen === n.id ? null : n.id;
    if (this.offen === n.id && !n.gelesen) {
      n.gelesen = true;
      this.postfach.gelesen(n.id).subscribe({ error: () => { n.gelesen = false; } });
    }
  }

  oeffneLink(n: Nachricht, ev: Event): void {
    ev.stopPropagation();
    if (n.link) void this.router.navigateByUrl(n.link);
  }

  loeschen(n: Nachricht, ev: Event): void {
    ev.stopPropagation();
    if (!confirm(`Nachricht „${n.betreff}“ löschen?`)) return;
    this.postfach.loeschen(n.id).subscribe({
      next: () => { this.nachrichten = this.nachrichten.filter(x => x.id !== n.id); },
      error: () => { this.fehler = 'Löschen fehlgeschlagen.'; },
    });
  }

  /* ---------- Admin ---------- */
  vorlageNehmen(v: typeof VORLAGEN[number]): void {
    this.schreibenOffen = true;
    this.entwurf = { an: this.entwurf.an, ...v.n };
    if (v.empfaengerSuche) {
      const treffer = this.empfaenger.filter(e => v.empfaengerSuche!.test(e.name));
      if (treffer.length === 1) this.entwurf.an = treffer[0].id;
    }
    this.sendeStatus = null;
  }

  empfaengerName(e: Empfaenger): string {
    if (e.gast) return /\(gast\)\s*$/i.test(e.name) ? e.name : e.name + ' (Gast)';
    return e.name + (e.rolle === 'admin' ? ' (Admin)' : '');
  }

  get sendenMoeglich(): boolean {
    return !!this.entwurf.an && !!this.entwurf.betreff.trim() && !!this.entwurf.text.trim() && !this.sendet;
  }

  senden(): void {
    if (!this.sendenMoeglich) return;
    const an = this.entwurf.an === 'alle' ? 'an alle Konten' : `an ${this.empfaenger.find(e => e.id === this.entwurf.an)?.name ?? 'das Konto'}`;
    if (!confirm(`Nachricht „${this.entwurf.betreff}“ ${an} senden?`)) return;
    this.sendet = true; this.sendeStatus = null;
    this.postfach.senden(this.entwurf).subscribe({
      next: r => {
        this.sendet = false;
        this.sendeStatus = `✓ Gesendet (${r.gesendet} ${r.gesendet === 1 ? 'Empfänger' : 'Empfänger'}).`;
        this.entwurf = { an: '', betreff: '', text: '', link: '', linkText: '' };
        this.laden();
      },
      error: e => {
        this.sendet = false;
        this.sendeStatus = e?.error?.error ?? 'Senden fehlgeschlagen.';
      },
    });
  }
}
