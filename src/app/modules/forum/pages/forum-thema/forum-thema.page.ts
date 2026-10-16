import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ForumApiService, ForumPost, ForumThread } from '../../forum-api.service';

@Component({
  selector: 'app-forum-thema',
  templateUrl: './forum-thema.page.html',
  styleUrls: ['./forum-thema.page.scss'],
  standalone: false,
})
export class ForumThemaPage implements OnInit {
  id = 0;
  thread: ForumThread | null = null;
  posts: ForumPost[] = [];
  ladefehler = false;
  antwort = '';
  sendet = false;
  fehler = '';
  loeschBestaetigung: string | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly api: ForumApiService,
  ) {}

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.laden();
  }

  laden(): void {
    this.api.thema(this.id).subscribe({
      next: r => { this.thread = r.thread; this.posts = r.posts; },
      error: () => (this.ladefehler = true),
    });
  }

  senden(): void {
    if (this.sendet || !this.antwort.trim()) return;
    this.sendet = true;
    this.fehler = '';
    this.api.antworten(this.id, this.antwort).subscribe({
      next: () => { this.antwort = ''; this.sendet = false; this.laden(); },
      error: () => { this.sendet = false; this.fehler = 'Konnte nicht gesendet werden.'; },
    });
  }

  beitragLoeschen(p: ForumPost): void {
    const key = `p${p.id}`;
    if (this.loeschBestaetigung !== key) { this.loeschBestaetigung = key; return; }
    this.api.beitragLoeschen(p.id).subscribe({
      next: () => { this.loeschBestaetigung = null; this.laden(); },
      error: () => (this.fehler = 'Löschen nicht möglich.'),
    });
  }

  themaLoeschen(): void {
    if (this.loeschBestaetigung !== 'thread') { this.loeschBestaetigung = 'thread'; return; }
    this.api.themaLoeschen(this.id).subscribe({
      next: () => this.router.navigate(['/forum']),
      error: () => (this.fehler = 'Löschen nicht möglich.'),
    });
  }
}
