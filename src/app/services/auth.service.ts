import { Injectable } from '@angular/core';
import { BehaviorSubject, tap } from 'rxjs';
import { ApiService, ApiUser } from './api.service';

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  role: 'admin' | 'user';
  year?: 1 | 2 | 3;
  keyUsed?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly userStorageKey = 'gleisbau-auth-user';
  private readonly userSubject = new BehaviorSubject<UserProfile | null>(null);
  readonly user$ = this.userSubject.asObservable();

  constructor(private readonly api: ApiService) {
    this.userSubject.next(this.loadUserFromStorage());
  }

  login(email: string, password: string) {
    return this.api.login(email, password).pipe(
      tap(res => this.setUser(this.toProfile(res.user))),
    );
  }

  loginWithKey(email: string, key: string, newPassword: string) {
    return this.api.loginWithKey(email, key, newPassword).pipe(
      tap(res => this.setUser(this.toProfile(res.user))),
    );
  }

  register(email: string, key: string, password: string) {
    return this.api.register(email, key, password).pipe(
      tap(res => this.setUser(this.toProfile(res.user))),
    );
  }

  logout(): void {
    this.setUser(null);
  }

  get currentUser(): UserProfile | null {
    return this.userSubject.value;
  }

  private toProfile(user: ApiUser): UserProfile {
    return {
      id: user.id,
      name: user.full_name,
      email: user.email,
      role: user.role,
      year: user.year as 1 | 2 | 3 | undefined,
      keyUsed: user.key_used,
    };
  }

  private setUser(user: UserProfile | null): void {
    this.userSubject.next(user);

    try {
      if (!user) {
        localStorage.removeItem(this.userStorageKey);
        return;
      }

      localStorage.setItem(this.userStorageKey, JSON.stringify(user));
    } catch {
      // ignore storage errors and keep in-memory session
    }
  }

  private loadUserFromStorage(): UserProfile | null {
    try {
      const raw = localStorage.getItem(this.userStorageKey);
      if (!raw) {
        return null;
      }

      const parsed: unknown = JSON.parse(raw);
      if (!this.isUserProfile(parsed)) {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }

  private isUserProfile(value: unknown): value is UserProfile {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const candidate = value as Partial<UserProfile>;
    if (typeof candidate.id !== 'string' || !candidate.id) {
      return false;
    }

    if (typeof candidate.name !== 'string' || !candidate.name) {
      return false;
    }

    if (candidate.role !== 'admin' && candidate.role !== 'user') {
      return false;
    }

    if (candidate.year !== undefined && candidate.year !== 1 && candidate.year !== 2 && candidate.year !== 3) {
      return false;
    }

    if (candidate.email !== undefined && typeof candidate.email !== 'string') {
      return false;
    }

    if (candidate.keyUsed !== undefined && typeof candidate.keyUsed !== 'string') {
      return false;
    }

    return true;
  }
}
