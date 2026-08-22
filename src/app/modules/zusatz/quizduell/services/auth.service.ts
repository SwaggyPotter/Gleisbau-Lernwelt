import { Injectable } from '@angular/core';
import { AuthUser } from '../models/quizduell.models';

const USERS_KEY = 'quizduell-users';
const SESSION_KEY = 'quizduell-session';

interface AuthResult {
  ok: boolean;
  error?: string;
}

/**
 * Rein lokale, geraetegebundene Anmeldung -- kein Backend angebunden (siehe
 * Ki Datenspeicher/07-Offene-Punkte/Offene-Punkte.md). Ein Konto existiert
 * daher nur in diesem einen Browser, kein Sync zwischen Geraeten. Login/
 * Register sind bewusst async (crypto.subtle), damit spaeter ein echter
 * HTTP-Aufruf ans Backend (backend/src/routes/auth.ts) eingesetzt werden
 * kann, ohne die aufrufenden Komponenten anzufassen.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private users: AuthUser[] = this.loadUsers();
  private session: AuthUser | null = this.loadSession();

  async register(email: string, password: string, displayName: string): Promise<AuthResult> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password || !displayName.trim()) {
      return { ok: false, error: 'Bitte alle Felder ausfuellen.' };
    }
    if (password.length < 8) {
      return { ok: false, error: 'Passwort muss mindestens 8 Zeichen haben.' };
    }
    if (this.users.some((u) => u.email === normalizedEmail)) {
      return { ok: false, error: 'Fuer diese E-Mail existiert bereits ein Konto.' };
    }

    const user: AuthUser = {
      id: crypto.randomUUID(),
      email: normalizedEmail,
      displayName: displayName.trim(),
      passwordDigest: await this.digest(password),
      registeredVia: 'direct',
      role: 'user',
      createdAt: new Date().toISOString(),
    };
    this.users.push(user);
    this.saveUsers();
    this.setSession(user);
    return { ok: true };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = this.users.find((u) => u.email === normalizedEmail);
    if (!user) {
      return { ok: false, error: 'Kein Konto mit dieser E-Mail gefunden.' };
    }
    const digest = await this.digest(password);
    if (digest !== user.passwordDigest) {
      return { ok: false, error: 'Passwort stimmt nicht.' };
    }
    this.setSession(user);
    return { ok: true };
  }

  logout(): void {
    this.session = null;
    localStorage.removeItem(SESSION_KEY);
  }

  currentUser(): AuthUser | null {
    return this.session;
  }

  isLoggedIn(): boolean {
    return this.session !== null;
  }

  private setSession(user: AuthUser): void {
    this.session = user;
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }

  private loadUsers(): AuthUser[] {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as AuthUser[];
    } catch {
      return [];
    }
  }

  private saveUsers(): void {
    localStorage.setItem(USERS_KEY, JSON.stringify(this.users));
  }

  private loadSession(): AuthUser | null {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  private async digest(password: string): Promise<string> {
    const bytes = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
