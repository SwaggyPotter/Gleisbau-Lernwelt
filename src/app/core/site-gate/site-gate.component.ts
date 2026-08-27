import { Component, EventEmitter, Output } from '@angular/core';

const STORAGE_KEY = 'glw-site-auth';
const SITE_USER = 'gleisbau';
// SHA-256 des Seiten-Passworts (nicht das Klartext-Passwort selbst), damit es
// nicht 1:1 im Bundle steht. Reines Soft-Gate (siehe Ki Datenspeicher) --
// verhindert nur den zufaelligen Aufruf, keine belastbare Zugriffskontrolle.
const SITE_PASSWORD_SHA256 = '4ebd8ac94619f5345420e60da151ed9412c292bd90c13819c40e3924bb2bf0e3';

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

  async submit(): Promise<void> {
    this.error = null;
    this.busy = true;
    const digest = await sha256Hex(this.password);
    this.busy = false;

    if (this.user.trim() !== SITE_USER || digest !== SITE_PASSWORD_SHA256) {
      this.error = 'Nutzername oder Passwort falsch.';
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: this.user.trim(), password: this.password }));
    } catch {
      // localStorage nicht verfuegbar (z.B. privater Modus) -- Gate bleibt
      // dann bei jedem Aufruf erneut sichtbar, aber der Login selbst klappt.
    }
    this.unlocked.emit();
  }
}
