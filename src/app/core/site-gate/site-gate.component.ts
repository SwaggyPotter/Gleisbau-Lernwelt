import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../auth/services/auth.service';
import { SiteGateStateService } from './site-gate-state.service';

const STORAGE_KEY = 'glw-site-auth';
const SITE_USER = 'gleisbau';
// SHA-256 des Seiten-Passworts (nicht das Klartext-Passwort selbst), damit es
// nicht 1:1 im Bundle steht. Reines Soft-Gate (siehe Ki Datenspeicher) --
// verhindert nur den zufaelligen Aufruf, keine belastbare Zugriffskontrolle.
const SITE_PASSWORD_SHA256 = '4f98efa857fd05c24205fd6efae29a93ed6e2c2f57fbc7939815be8cde26527d';

// Cookie, das Caddy auf dem Server prueft (deploy/Caddyfile, Matcher "daten"): Der Wert ist
// SHA-256(Passwort + COOKIE_SALT) -- ohne das Passwort nicht aus dem Bundle ableitbar (im Bundle
// steht nur SHA-256(Passwort)). Es schuetzt /assets/ (Fragenkataloge, Bilder) serverseitig,
// sodass diese Dateien erst nach dem Login in der App abrufbar sind. Bei Passwortaenderung
// muss der Hash in der Caddyfile mitgezogen werden.
const COOKIE_NAME = 'glw_gate';
const COOKIE_SALT = ':glw-gate-cookie-v1';

async function setGateCookie(password: string): Promise<void> {
  const value = await sha256Hex(password + COOKIE_SALT);
  document.cookie = `${COOKIE_NAME}=${value}; Path=/; Max-Age=31536000; Secure; SameSite=Lax`;
}

/** Bei bereits gespeichertem Login das Cookie erneuern (z. B. nach Cookie-Loeschung). */
export async function syncGateCookie(): Promise<void> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const { password } = JSON.parse(raw) as { password?: string };
    if (password) await setGateCookie(password);
  } catch {
    // ohne localStorage/Cookies bleibt der Login pro Aufruf noetig
  }
}

export function hasStoredSiteAuth(): boolean {
  try {
    return !!localStorage.getItem(STORAGE_KEY);
  } catch {
    return false;
  }
}

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const buffer = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

@Component({
  selector: 'app-site-gate',
  standalone: false,
  templateUrl: './site-gate.component.html',
  styleUrls: ['./site-gate.component.scss'],
})
export class SiteGateComponent {
  user = '';
  password = '';
  error: string | null = null;
  busy = false;

  @Output() unlocked = new EventEmitter<void>();

  constructor(
    private readonly router: Router,
    private readonly siteGateState: SiteGateStateService,
    private readonly auth: AuthService,
  ) {}

  zeigeOeffentlicheInhalte(): void {
    this.siteGateState.enablePublicMode();
    this.router.navigateByUrl('/oeffentlich');
  }

  async submit(): Promise<void> {
    this.error = null;
    this.busy = true;
    const digest = await sha256Hex(this.password);
    this.busy = false;

    if (this.user.trim() !== SITE_USER || digest !== SITE_PASSWORD_SHA256) {
      this.error = 'Nutzername oder Passwort falsch.';
      return;
    }

    await setGateCookie(this.password);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: this.user.trim(), password: this.password }));
    } catch {
      // localStorage nicht verfuegbar (z.B. privater Modus) -- Gate bleibt
      // dann bei jedem Aufruf erneut sichtbar, aber der Login selbst klappt.
    }
    // Gleiche Zugangsdaten auch fuer das Admin-Konto versuchen: klappt es, ist man sofort als
    // Admin angemeldet (Token bleibt im Browser). Klappt es nicht (z. B. Admin-Passwort weicht
    // ab), bleibt es still beim normalen Gate-Login.
    try {
      await firstValueFrom(this.auth.login(this.user.trim(), this.password));
    } catch {
      // kein Admin-Konto mit diesen Daten -- unkritisch
    }
    this.unlocked.emit();
    // Der Router loest bei einem frischen Seitenaufruf (noch ohne Login)
    // bereits vor der Anmeldung still auf '/oeffentlich' auf (siteGateGuard
    // greift, bevor das Router-Outlet ueberhaupt existiert -- das Outlet
    // steckt in <ion-app>, das erst nach *ngIf="unlocked" gerendert wird).
    // Ohne diese explizite Navigation wuerde das Outlet beim ersten Rendern
    // genau diesen stehengebliebenen Redirect uebernehmen statt das
    // Dashboard zu zeigen.
    this.router.navigateByUrl('/dashboard');
  }
}
