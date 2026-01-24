import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface ApiUser {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'user';
  year?: number;
  key_used?: string;
}

export interface RegistrationKeyDto {
  key: string;
  year: number;
  created_at: string;
  uses: number;
  max_uses: number;
  issued_by?: string;
}

export interface FieldDto {
  id: string;
  title: string;
  description: string;
  year: number;
  tag: string | null;
  progress?: number;
  mistakes?: number;
}

export interface SnapshotDto {
  userId: string;
  fullName: string;
  year?: number;
  completionRate: number;
  completed: number;
  inProgress: number;
  planned: number;
  mistakesTotal: number;
  mistakesByField: Array<{ fieldId: string; fieldTitle: string; mistakes: number }>;
  fields?: Array<FieldDto>;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly base = environment.apiBaseUrl + '/api';

  constructor(private readonly http: HttpClient) {}

  login(email: string, password: string) {
    return this.http.post<{ user: ApiUser }>(`${this.base}/auth/login`, { email, password });
  }

  register(fullName: string, email: string, password: string, key: string) {
    return this.http.post<{ user: ApiUser }>(`${this.base}/register`, { fullName, email, password, key });
  }

  getFields() {
    return this.http.get<{ fields: FieldDto[] }>(`${this.base}/fields`);
  }

  getSnapshot(userId: string) {
    return this.http.get<{ snapshot: SnapshotDto }>(`${this.base}/users/${userId}/snapshot`);
  }

  getSnapshots() {
    return this.http.get<{ snapshots: SnapshotDto[] }>(`${this.base}/users/snapshots`);
  }

  getKeys() {
    return this.http.get<{ keys: RegistrationKeyDto[] }>(`${this.base}/keys`);
  }

  createKey(year: number) {
    return this.http.post<{ key: RegistrationKeyDto }>(`${this.base}/keys`, { year });
  }
}
