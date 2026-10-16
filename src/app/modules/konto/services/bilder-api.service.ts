import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/api-config';

export type BildEntscheidung = 'keep' | 'remove' | 'unsure';

export interface BildReview {
  imageId: string;
  source: string;
  decision: BildEntscheidung | null;
  category: string | null;
  note: string | null;
  name: string | null;
  updatedBy: string | null;
  updatedAt: string;
}

export interface HochgeladenesFoto {
  id: number;
  name: string;
  sizeBytes: number;
  uploadedBy: string | null;
  createdAt: string;
  thumb: string;
}

@Injectable({ providedIn: 'root' })
export class BilderApiService {
  constructor(private readonly http: HttpClient) {}

  alle(): Observable<{ reviews: BildReview[] }> {
    return this.http.get<{ reviews: BildReview[] }>(`${API_BASE_URL}/image-reviews`);
  }

  speichern(
    imageId: string,
    daten: { decision: BildEntscheidung | null; category: string | null; note: string | null; name?: string },
  ): Observable<{ review: BildReview }> {
    return this.http.put<{ review: BildReview }>(`${API_BASE_URL}/image-reviews/${encodeURIComponent(imageId)}`, daten);
  }

  fotos(): Observable<{ photos: HochgeladenesFoto[] }> {
    return this.http.get<{ photos: HochgeladenesFoto[] }>(`${API_BASE_URL}/photos`);
  }

  fotoHochladen(name: string, full: string, thumb: string): Observable<{ photo: HochgeladenesFoto }> {
    return this.http.post<{ photo: HochgeladenesFoto }>(`${API_BASE_URL}/photos`, { name, full, thumb });
  }

  fotoLoeschen(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/photos/${id}`);
  }

  fotoVoll(id: number): Observable<Blob> {
    return this.http.get(`${API_BASE_URL}/photos/${id}/full`, { responseType: 'blob' });
  }
}
