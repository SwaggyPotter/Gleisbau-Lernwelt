import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ForumApiService, ForumThread } from '../../forum-api.service';

@Component({
  selector: 'app-forum-liste',
  templateUrl: './forum-liste.page.html',
  styleUrls: ['./forum-liste.page.scss'],
  standalone: false,
})
export class ForumListePage implements OnInit {
  themen: ForumThread[] = [];
  geladen = false;
  ladefehler = false;

  neu = false;
  titel = '';
  text = '';
  sendet = false;
  sendefehler = '';

  constructor(private readonly api: ForumApiService, private readonly router: Router) {}

  ngOnInit(): void {
    this.laden();
  }

  laden(): void {
    this.api.themen().subscribe({
      next: r => { this.themen = r.threads; this.geladen = true; },
      error: () => { this.ladefehler = true; this.geladen = true; },
    });
  }

  absenden(): void {
    if (this.sendet || this.titel.trim().length < 3 || !this.text.trim()) return;
    this.sendet = true;
    this.sendefehler = '';
    this.api.themaErstellen(this.titel, this.text).subscribe({
      next: r => this.router.navigate(['/forum', r.id]),
      error: () => { this.sendet = false; this.sendefehler = 'Konnte nicht gespeichert werden.'; },
    });
  }
}
