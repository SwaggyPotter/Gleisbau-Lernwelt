import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../auth/services/auth.service';
import { SiteGateStateService } from './site-gate-state.service';
import { API_BASE_URL } from '../api-config';

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

/* ---------- Gastzugang (2026-11-05) ----------
   Gäste melden sich mit einem Gast-Passwort von Tim + ihrem Namen an und bekommen ein
   Kurzzeitkonto. Gespeichert wird nur { gast: true, name, bis } (kein Passwort); der
   Sitzungstoken liegt wie bei normalen Konten unter glw-auth-token und wird zusätzlich als
   Cookie glw_gast gesetzt -- damit lässt Caddy (forward_auth) die /assets-Dateien durch. */
const GAST_COOKIE = 'glw_gast';
const AUTH_TOKEN_KEY = 'glw-auth-token';
interface GespeicherterZugang { user?: string; password?: string; gast?: boolean; name?: string; bis?: string; }

function leseZugang(): GespeicherterZugang | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GespeicherterZugang) : null;
  } catch {
    return null;
  }
}

function setzeGastCookie(token: string, bis: string): void {
  // Dauerhafte Gastzugänge laufen bis 2099; Browser kappen Cookies bei ~400 Tagen, beim App-Start wird erneuert
  const sekunden = Math.min(400 * 86400, Math.max(0, Math.floor((new Date(bis).getTime() - Date.now()) / 1000)));
  document.cookie = `${GAST_COOKIE}=${token}; Path=/; Max-Age=${sekunden}; Secure; SameSite=Lax`;
}

/** Gastzugang beenden (abgelaufen oder von Tim gesperrt): alles Gespeicherte entfernen. */
function gastZugangEntfernen(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // ignorieren
  }
  document.cookie = `${GAST_COOKIE}=; Path=/; Max-Age=0; Secure; SameSite=Lax`;
}

/** Gastzugang: Ablaufzeitpunkt (ISO) oder null, wenn kein Gast angemeldet ist. */
export function gastZugangBis(): string | null {
  const z = leseZugang();
  return z?.gast && z.bis ? z.bis : null;
}

/** Bei bereits gespeichertem Login das Cookie erneuern (z. B. nach Cookie-Loeschung). */
export async function syncGateCookie(): Promise<void> {
  try {
    const zugang = leseZugang();
    if (!zugang) return;
    if (zugang.gast) {
      await gastZugangPruefen(zugang);
      return;
    }
    const { password } = zugang;
    if (!password) return;
    // Veraltetes gespeichertes Passwort (nach einer Passwortaenderung): Cookie waere falsch und
    // jede /assets/-Datei bekaeme 401 -- Login verwerfen, damit die Login-Maske wieder erscheint.
    if ((await sha256Hex(password)) !== SITE_PASSWORD_SHA256) {
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
      return;
    }
    await setGateCookie(password);
  } catch {
    // ohne localStorage/Cookies bleibt der Login pro Aufruf noetig
  }
}

/**
 * Gastzugang beim Start prüfen: abgelaufen → entfernen; sonst Cookie erneuern und beim Backend
 * nachfragen, ob Tim den Zugang inzwischen beendet hat (401 → entfernen und neu laden).
 */
async function gastZugangPruefen(zugang: GespeicherterZugang): Promise<void> {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token || !zugang.bis || new Date(zugang.bis).getTime() <= Date.now()) {
    gastZugangEntfernen();
    location.reload();
    return;
  }
  setzeGastCookie(token, zugang.bis);
  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401) {
      gastZugangEntfernen();
      location.reload();
      return;
    }
    if (res.ok) {
      // Tim kann den Zugang verlängern -- neues Ablaufdatum übernehmen
      const { user } = (await res.json()) as { user?: { gastBis?: string | null } };
      if (user?.gastBis && user.gastBis !== zugang.bis) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...zugang, bis: user.gastBis }));
        setzeGastCookie(token, user.gastBis);
      }
    }
  } catch {
    // offline: Zugang bis zum gespeicherten Ablauf weiter gelten lassen
  }
}

export function hasStoredSiteAuth(): boolean {
  try {
    const zugang = leseZugang();
    if (!zugang) return false;
    if (zugang.gast && (!zugang.bis || new Date(zugang.bis).getTime() <= Date.now())) {
      gastZugangEntfernen();
      return false;
    }
    return true;
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

  /** Reiter oben: normales Login oder Gastzugang */
  modus: 'konto' | 'gast' = 'konto';

  // Gastzugang
  gastName = '';
  gastCode = '';
  gastFehler: string | null = null;
  gastBusy = false;

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

  /** Mit Gast-Passwort (von Tim) + Namen anmelden: legt ein Kurzzeitkonto an. */
  async gastSubmit(): Promise<void> {
    this.gastFehler = null;
    this.gastBusy = true;
    try {
      const res = await firstValueFrom(this.auth.gastAnmelden(this.gastCode.trim(), this.gastName.trim()));
      const bis = res.user.gastBis ?? new Date(Date.now() + 7 * 864e5).toISOString();
      setzeGastCookie(res.token, bis);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ gast: true, name: this.gastName.trim(), bis }));
      } catch {
        // ohne localStorage gilt der Zugang nur fuer diese Seitenladung
      }
      this.unlocked.emit();
      this.router.navigateByUrl('/dashboard');
    } catch (err) {
      const e = err as { status?: number; error?: { error?: string; message?: string } };
      this.gastFehler = e.error?.error ?? e.error?.message
        ?? (e.status === 0 ? 'Keine Verbindung zum Server.' : 'Gast-Passwort ungültig.');
    } finally {
      this.gastBusy = false;
    }
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
