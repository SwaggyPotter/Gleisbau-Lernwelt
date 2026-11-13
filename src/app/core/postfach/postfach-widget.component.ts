import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { Subscription, filter } from 'rxjs';
import { AuthService } from '../auth/services/auth.service';
import { AppUser } from '../auth/models/auth.models';
import { PostfachService } from './postfach.service';

const ABRUF_MS = 60 * 1000;
const GEMELDET_KEY = 'glw-postfach-gemeldet';

/**
 * Briefsymbol rechts unten (über der Melde-Flagge) mit Zahl ungelesener Nachrichten.
 * Kommt eine neue Nachricht, schiebt sich unten ein Hinweis „Du hast eine neue Nachricht“
 * hoch (wie „Neue Version verfügbar“); Antippen öffnet das Postfach.
 */
@Component({
  selector: 'app-postfach-widget',
  template: `
    <button *ngIf="user && !aufPostfach" type="button" class="brief" (click)="oeffnen()"
            [attr.aria-label]="anzahl ? anzahl + ' ungelesene Nachrichten – Postfach öffnen' : 'Postfach öffnen'"
            [title]="anzahl ? anzahl + ' ungelesene Nachricht' + (anzahl === 1 ? '' : 'en') : 'Postfach'">
      <ion-icon [name]="anzahl ? 'mail-unread-outline' : 'mail-outline'"></ion-icon>
      <span class="zahl" *ngIf="anzahl">{{ anzahl > 9 ? '9+' : anzahl }}</span>
    </button>
  `,
  styles: [`
    :host { display: contents; }
    .brief {
      position: fixed; right: 22px; bottom: calc(132px + env(safe-area-inset-bottom)); z-index: 9999;
      width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 1.25rem; line-height: 1;
      display: flex; align-items: center; justify-content: center;
      color: var(--sp-text, #eaf2f5); background: var(--sp-surface, #16242f);
      border: 1px solid var(--sp-border-strong, #3a4a57); box-shadow: 0 4px 14px rgba(0, 0, 0, .3); opacity: .9;
    }
    .brief:hover { opacity: 1; }
    .zahl {
      position: absolute; top: -5px; right: -5px; min-width: 19px; height: 19px; padding: 0 5px; border-radius: 999px;
      background: var(--sp-danger, #d64545); color: #fff; font: 700 11px/19px system-ui, sans-serif; text-align: center;
    }
  `],
  standalone: false,
})
export class PostfachWidgetComponent implements OnInit, OnDestroy {
  user: AppUser | null = null;
  anzahl = 0;
  aufPostfach = false;

  private timer?: ReturnType<typeof setInterval>;
  private subs: Subscription[] = [];
  private hinweis?: HTMLIonToastElement;

  constructor(
    private readonly auth: AuthService,
    private readonly postfach: PostfachService,
    private readonly router: Router,
    private readonly toastCtrl: ToastController,
  ) {}

  ngOnInit(): void {
    this.subs.push(this.auth.currentUser$.subscribe(u => {
      this.user = u;
      clearInterval(this.timer);
      if (u) {
        this.postfach.aktualisieren();
        this.timer = setInterval(() => this.postfach.aktualisieren(), ABRUF_MS);
      } else {
        this.postfach.zuruecksetzen();
      }
    }));
    this.subs.push(this.postfach.stand$.subscribe(s => {
      this.anzahl = s.anzahl;
      if (s.neueste && this.user) void this.vielleichtHinweisen(s.neueste);
    }));
    this.subs.push(this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe(e => {
      this.aufPostfach = e.urlAfterRedirects.split(/[?#]/)[0] === '/postfach';
      if (this.aufPostfach) void this.hinweis?.dismiss();
    }));
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
    this.subs.forEach(s => s.unsubscribe());
  }

  oeffnen(): void {
    void this.router.navigateByUrl('/postfach');
  }

  /** Hinweis nur einmal je neuer Nachricht (pro Konto gemerkt) */
  private async vielleichtHinweisen(neueste: { id: number; betreff: string }): Promise<void> {
    if (this.aufPostfach) return;
    const key = `${GEMELDET_KEY}-${this.user!.id}`;
    let gemeldet = 0;
    try { gemeldet = Number(localStorage.getItem(key) ?? 0); } catch { /* ohne Speicher: jedes Mal */ }
    if (neueste.id <= gemeldet) return;
    try { localStorage.setItem(key, String(neueste.id)); } catch { /* egal */ }
    await this.hinweis?.dismiss();
    this.hinweis = await this.toastCtrl.create({
      header: this.anzahl > 1 ? `Du hast ${this.anzahl} neue Nachrichten` : 'Du hast eine neue Nachricht',
      message: neueste.betreff,
      position: 'bottom',
      icon: 'mail-unread-outline',
      buttons: [
        { text: 'Öffnen', handler: () => { this.oeffnen(); } },
        { text: 'Später', role: 'cancel' },
      ],
    });
    await this.hinweis.present();
  }
}
