import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface UserProfile {
  name: string;
  role?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly userSubject = new BehaviorSubject<UserProfile | null>(null);
  readonly user$ = this.userSubject.asObservable();

  loginAsAdmin(name: string = 'Admin'): void {
    this.userSubject.next({ name, role: 'admin' });
  }

  logout(): void {
    this.userSubject.next(null);
  }

  get currentUser(): UserProfile | null {
    return this.userSubject.value;
  }
}
