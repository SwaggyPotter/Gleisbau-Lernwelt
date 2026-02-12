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
  created_at?: string;
  deletion_scheduled_at?: string | null;
  deletion_due_at?: string | null;
}

export interface RegistrationKeyDto {
  key: string;
  year: number;
  full_name: string;
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

export interface QuizQuestion {
  id: string;
  prompt: string;
  choices: string[];
}

export interface QuizSession {
  id: string;
  fieldId: string;
  currentIndex: number;
  isComplete: boolean;
  questions: QuizQuestion[];
  answers: Record<string, number>;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly base = environment.apiBaseUrl + '/api';

  constructor(private readonly http: HttpClient) {}

  login(email: string, password: string) {
    return this.http.post<{ user: ApiUser }>(`${this.base}/auth/login`, { email, password });
  }

  loginWithKey(email: string, key: string, newPassword: string) {
    return this.http.post<{ user: ApiUser }>(`${this.base}/auth/login-key`, { email, key, newPassword });
  }

  register(email: string, key: string, password: string) {
    return this.http.post<{ user: ApiUser }>(`${this.base}/register`, { email, key, password });
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

  createKey(year: number | string, fullName: string) {
    return this.http.post<{ key: RegistrationKeyDto }>(`${this.base}/keys`, { year: Number(year), fullName });
  }

  deleteKey(key: string) {
    return this.http.delete<void>(`${this.base}/keys/${encodeURIComponent(key)}`);
  }

  getUsers() {
    return this.http.get<{ users: ApiUser[] }>(`${this.base}/users`);
  }

  deleteUser(userId: string, mode: 'grace' | 'immediate' = 'grace') {
    return this.http.delete<void>(`${this.base}/users/${encodeURIComponent(userId)}`, {
      params: { mode },
    });
  }

  startQuiz(fieldId: string, userId?: string, forceNew?: boolean) {
    return this.http.post<{ session: QuizSession }>(`${this.base}/quizzes/start`, { fieldId, userId, forceNew });
  }

  submitQuizAnswer(sessionId: string, questionId: string, choiceIndex: number) {
    return this.http.post<{ progress: { answered: number; total: number; currentIndex: number } }>(
      `${this.base}/quizzes/${sessionId}/answer`,
      { questionId, choiceIndex },
    );
  }

  completeQuiz(sessionId: string) {
    return this.http.post<void>(`${this.base}/quizzes/${sessionId}/complete`, {});
  }

  getQuizResults(sessionId: string) {
    return this.http.get<{ results: { total: number; correct: number; questions: Array<QuizQuestion & { correctIndex: number; selectedIndex: number | null; isCorrect: boolean }> } }>(
      `${this.base}/quizzes/${sessionId}/results`,
    );
  }
}
