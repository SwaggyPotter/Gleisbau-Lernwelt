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
  private readonly userSubject = new BehaviorSubject<UserProfile | null>(null);
  readonly user$ = this.userSubject.asObservable();

  constructor(private readonly api: ApiService) {}

  login(email: string, password: string) {
    return this.api.login(email, password).pipe(
      tap(res => this.userSubject.next(this.toProfile(res.user))),
    );
  }

  loginWithKey(email: string, key: string, newPassword: string) {
    return this.api.loginWithKey(email, key, newPassword).pipe(
      tap(res => this.userSubject.next(this.toProfile(res.user))),
    );
  }

  register(email: string, key: string, password: string) {
    return this.api.register(email, key, password).pipe(
      tap(res => this.userSubject.next(this.toProfile(res.user))),
    );
  }

  logout(): void {
    this.userSubject.next(null);
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
}
