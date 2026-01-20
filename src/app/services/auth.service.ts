import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UserRecord } from './learning-data.service';

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

  loginAsAdmin(name: string = 'Admin'): void {
    this.userSubject.next({ id: 'demo-admin', name, role: 'admin' });
  }

  loginWithRecord(record: UserRecord): void {
    this.userSubject.next({
      id: record.userId,
      name: record.fullName,
      email: record.email,
      role: record.role,
      year: record.year,
      keyUsed: record.keyUsed,
    });
  }

  logout(): void {
    this.userSubject.next(null);
  }

  get currentUser(): UserProfile | null {
    return this.userSubject.value;
  }
}
