import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api-config';

export interface ForumThread {
  id: number;
  title: string;
  authorName: string;
  createdAt: string;
  lastPostAt: string;
  postCount: number;
  canDelete: boolean;
}

export interface ForumPost {
  id: number;
  authorName: string;
  body: string;
  createdAt: string;
  canDelete: boolean;
}

@Injectable({ providedIn: 'root' })
export class ForumApiService {
  constructor(private readonly http: HttpClient) {}

  themen(): Observable<{ threads: ForumThread[] }> {
    return this.http.get<{ threads: ForumThread[] }>(`${API_BASE_URL}/forum/threads`);
  }

  themaErstellen(title: string, body: string): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${API_BASE_URL}/forum/threads`, { title, body });
  }

  thema(id: number): Observable<{ thread: ForumThread; posts: ForumPost[] }> {
    return this.http.get<{ thread: ForumThread; posts: ForumPost[] }>(`${API_BASE_URL}/forum/threads/${id}`);
  }

  antworten(id: number, body: string): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${API_BASE_URL}/forum/threads/${id}/posts`, { body });
  }

  beitragLoeschen(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/forum/posts/${id}`);
  }

  themaLoeschen(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/forum/threads/${id}`);
  }
}
