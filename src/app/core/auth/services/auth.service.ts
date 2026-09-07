import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, shareReplay, tap } from 'rxjs';
import { API_BASE_URL } from '../../api-config';
import { AppUser, AuthResponse } from '../models/auth.models';

const TOKEN_KEY = 'glw-auth-token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userSubject = new BehaviorSubject<AppUser | null>(null);
  readonly currentUser$ = this.userSubject.asObservable();

  private restoring: Observable<AppUser | null> | null = null;

  constructor(private readonly http: HttpClient) {}

  get token(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  get snapshotUser(): AppUser | null {
    return this.userSubject.value;
  }

  get isLoggedIn(): boolean {
    return !!this.userSubject.value;
  }

  get isAdmin(): boolean {
    return this.userSubject.value?.role === 'admin';
  }

  /** Beim App-Start einmal aufrufen: prueft einen gespeicherten Token gegen das Backend. */
  restoreSession(): Observable<AppUser | null> {
    if (!this.token) {
      this.userSubject.next(null);
      return of(null);
    }
    if (!this.restoring) {
      this.restoring = this.http.get<{ user: AppUser }>(`${API_BASE_URL}/auth/me`).pipe(
        map(res => res.user),
        tap(user => this.userSubject.next(user)),
        catchError(() => {
          this.clearToken();
          this.userSubject.next(null);
          return of(null);
        }),
        shareReplay(1),
      );
    }
    return this.restoring;
  }

  login(email: string, password: string): Observable<AppUser> {
    return this.http.post<AuthResponse>(`${API_BASE_URL}/auth/login`, { email, password }).pipe(
      tap(res => this.applySession(res)),
      map(res => res.user),
    );
  }

  register(email: string, key: string, password: string): Observable<AppUser> {
    return this.http.post<AuthResponse>(`${API_BASE_URL}/register`, { email, key, password }).pipe(
      tap(res => this.applySession(res)),
      map(res => res.user),
    );
  }

  updateName(fullName: string): Observable<AppUser> {
    return this.updateAccount({ fullName });
  }

  /** Aendert E-Mail und/oder Passwort des eingeloggten Kontos. Beide Felder optional. */
  updateAccount(payload: { fullName?: string; email?: string; newPassword?: string }): Observable<AppUser> {
    return this.http.patch<{ user: AppUser }>(`${API_BASE_URL}/auth/me`, payload).pipe(
      map(res => res.user),
      tap(user => this.userSubject.next(user)),
    );
  }

  logout(): void {
    this.http.post(`${API_BASE_URL}/auth/logout`, {}).pipe(catchError(() => of(null))).subscribe();
    this.clearToken();
    this.userSubject.next(null);
  }

  private applySession(res: AuthResponse): void {
    this.userSubject.next(res.user);
    this.restoring = null; // naechster restoreSession()-Aufruf soll den NEUEN Token pruefen, nicht die alte Antwort wiederholen
    try {
      localStorage.setItem(TOKEN_KEY, res.token);
    } catch {
      // localStorage nicht verfuegbar -- Session haelt dann nur fuer diese Seitenladung
    }
  }

  private clearToken(): void {
    this.restoring = null;
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignorieren
    }
  }
}
