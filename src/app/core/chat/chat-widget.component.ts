import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { API_BASE_URL } from '../api-config';
import { AuthService } from '../auth/services/auth.service';
import { AppUser } from '../auth/models/auth.models';

interface ChatMessage {
  id: number;
  authorName: string;
  body: string;
  createdAt: string;
  mine: boolean;
}

const POLL_OPEN_MS = 4000;
const POLL_CLOSED_MS = 30000;

/**
 * Chat-Symbol unten rechts, oeffnet den globalen Chat (nur fuer angemeldete Konten).
 * Einfaches Polling: offen alle 4 s, geschlossen alle 30 s (fuer die Ungelesen-Zahl).
 */
@Component({
  selector: 'app-chat-widget',
  templateUrl: './chat-widget.component.html',
  styleUrls: ['./chat-widget.component.scss'],
  standalone: false,
})
export class ChatWidgetComponent implements OnInit, OnDestroy {
  @ViewChild('liste') liste?: ElementRef<HTMLElement>;

  user: AppUser | null = null;
  offen = false;
  nachrichten: ChatMessage[] = [];
  text = '';
  ungelesen = 0;
  fehler = '';

  private timer?: ReturnType<typeof setTimeout>;
  private sub?: Subscription;
  private letzteId = 0;
  private geladen = false;

  constructor(private readonly http: HttpClient, private readonly auth: AuthService) {}

  ngOnInit(): void {
    this.sub = this.auth.currentUser$.subscribe(u => {
      this.user = u;
      if (u) this.planeAbruf(0);
      else this.stoppe();
    });
    this.auth.restoreSession().subscribe();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.stoppe();
  }

  umschalten(): void {
    this.offen = !this.offen;
    if (this.offen) {
      this.ungelesen = 0;
      this.planeAbruf(0);
      setTimeout(() => this.nachUntenScrollen(), 50);
    }
  }

  senden(): void {
    const body = this.text.trim();
    if (!body) return;
    this.fehler = '';
    this.text = '';
    this.http.post<{ message: ChatMessage }>(`${API_BASE_URL}/chat`, { body }).subscribe({
      next: r => {
        this.anhaengen([r.message]);
        setTimeout(() => this.nachUntenScrollen(), 0);
      },
      error: e => {
        this.text = body;
        this.fehler = e?.status === 429 ? 'Etwas langsamer bitte.' : 'Senden fehlgeschlagen.';
      },
    });
  }

  loeschen(m: ChatMessage): void {
    this.http.delete(`${API_BASE_URL}/chat/${m.id}`).subscribe({
      next: () => (this.nachrichten = this.nachrichten.filter(x => x.id !== m.id)),
    });
  }

  private stoppe(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    this.nachrichten = [];
    this.letzteId = 0;
    this.geladen = false;
    this.ungelesen = 0;
  }

  private planeAbruf(verzoegerung: number): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.abrufen(), verzoegerung);
  }

  private abrufen(): void {
    if (!this.user) return;
    const url = this.letzteId ? `${API_BASE_URL}/chat?after=${this.letzteId}` : `${API_BASE_URL}/chat`;
    this.http.get<{ messages: ChatMessage[] }>(url).subscribe({
      next: r => {
        const neu = r.messages;
        const zuvorGeladen = this.geladen;
        this.geladen = true;
        if (neu.length) {
          const stand = this.liste ? this.liste.nativeElement.scrollHeight - this.liste.nativeElement.scrollTop - this.liste.nativeElement.clientHeight < 60 : true;
          this.anhaengen(neu);
          if (!this.offen && zuvorGeladen) this.ungelesen += neu.filter(m => !m.mine).length;
          if (this.offen && stand) setTimeout(() => this.nachUntenScrollen(), 0);
        }
        this.planeAbruf(this.offen ? POLL_OPEN_MS : POLL_CLOSED_MS);
      },
      error: () => this.planeAbruf(POLL_CLOSED_MS),
    });
  }

  private anhaengen(neu: ChatMessage[]): void {
    const vorhanden = new Set(this.nachrichten.map(m => m.id));
    const dazu = neu.filter(m => !vorhanden.has(m.id));
    if (!dazu.length) return;
    this.nachrichten = [...this.nachrichten, ...dazu];
    this.letzteId = Math.max(this.letzteId, ...dazu.map(m => m.id));
  }

  private nachUntenScrollen(): void {
    const el = this.liste?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }
}
