import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface Bildnachweis {
  key: string;
  file: string;
  credit: string;
  license: string;
  sourceUrl: string;
}

@Component({
  selector: 'app-bildnachweise',
  templateUrl: './bildnachweise.page.html',
  styleUrls: ['./bildnachweise.page.scss'],
  standalone: false,
})
export class BildnachweisePage {
  bilder: Bildnachweis[] = [];

  constructor(private http: HttpClient) {
    this.http.get<Bildnachweis[]>('assets/bilder/bildnachweise.json').subscribe({
      next: (data) => (this.bilder = data),
      error: () => (this.bilder = []),
    });
  }
}
