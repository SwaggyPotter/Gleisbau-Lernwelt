import { Component, OnDestroy, OnInit } from '@angular/core';
import { QuizshowApiService, ShowAktion, ShowAktionExtra, ShowQuizKurz, SteuerStand } from '../quizshow-api.service';

const CODE_SPEICHER = 'glw-quizshow-fern-code';

/** Fernbedienung (Tablet, nur Admin): Code der Bühne eingeben, dann Schritt für Schritt durch die Show. */
@Component({
  selector: 'app-quizshow-fernbedienung',
  templateUrl: './fernbedienung.page.html',
  styleUrls: ['./fernbedienung.page.scss'],
  standalone: false,
})
export class FernbedienungPage implements OnInit, OnDestroy {
  code = '';
  stand?: SteuerStand;
  quizze: ShowQuizKurz[] = [];
  fehler = '';
  sendet = false;
  zeigeListe = false;
  readonly buchstaben = ['A', 'B', 'C', 'D'];
  private timer?: ReturnType<typeof setInterval>;

  constructor(private readonly api: QuizshowApiService) {}

  ngOnInit(): void {
    try { this.code = localStorage.getItem(CODE_SPEICHER) ?? ''; } catch { /* egal */ }
    this.api.quizze().subscribe({ next: r => (this.quizze = r.quizze), error: () => undefined });
    if (this.code) this.verbinden();
    // Stand ab und zu nachladen (falls am Laptop neu geladen wurde)
    this.timer = setInterval(() => { if (this.stand && !this.sendet) this.laden(true); }, 3000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  verbinden(): void {
    this.code = this.code.replace(/\D/g, '').slice(0, 4);
    if (this.code.length !== 4) { this.fehler = 'Der Code hat 4 Ziffern – er steht unten rechts auf der Bühne.'; return; }
    try { localStorage.setItem(CODE_SPEICHER, this.code); } catch { /* egal */ }
    this.laden(false);
  }

  trennen(): void {
    this.stand = undefined;
    this.code = '';
    try { localStorage.removeItem(CODE_SPEICHER); } catch { /* egal */ }
  }

  private laden(still: boolean): void {
    this.api.steuerung(this.code).subscribe({
      next: s => { this.stand = s; this.fehler = ''; },
      error: e => {
        if (still) return;
        this.stand = undefined;
        this.fehler = e?.status === 404 ? 'Code unbekannt – bitte den Code von der Bühne eingeben.'
          : e?.status === 401 || e?.status === 403 ? 'Nur mit Admin-Konto möglich – bitte anmelden.' : 'Keine Verbindung zum Server.';
      },
    });
  }

  /** Gruppennamen beim Bearbeiten (erst mit „Übernehmen“ an die Bühne) */
  namen: string[] = [];
  namenOffen = false;

  namenBearbeiten(): void {
    this.namen = (this.stand?.gruppen ?? []).map(g => g.name);
    this.namenOffen = true;
  }

  namenSpeichern(): void {
    const namen = this.namen.map((n, i) => n.trim() || `Gruppe ${i + 1}`);
    this.senden('gruppen', { namen });
    this.namenOffen = false;
  }

  gruppeDazu(): void { if (this.namen.length < 8) this.namen.push(`Gruppe ${this.namen.length + 1}`); }
  gruppeWeg(): void { if (this.namen.length > 1) this.namen.pop(); }

  punkteNull(): void {
    if (confirm('Alle Punkte auf 0 setzen?')) this.senden('punkteNull');
  }

  trackIndex(i: number): number { return i; }

  siegerZeigen(): void {
    if (confirm('Quiz beenden und Gewinner anzeigen?')) this.senden('sieger');
  }

  senden(aktion: ShowAktion, extra: ShowAktionExtra = {}): void {
    if (!this.stand || this.sendet) return;
    this.sendet = true;
    this.api.aktion(this.code, aktion, extra).subscribe({
      next: s => { this.stand = s; this.sendet = false; this.fehler = ''; },
      error: () => { this.sendet = false; this.fehler = 'Befehl kam nicht an – nochmal tippen.'; },
    });
  }

  quizWaehlen(id: number): void {
    this.senden('quiz', { quizId: +id });
  }

  get frage() {
    const s = this.stand;
    return s && s.phase === 'frage' ? s.liste[s.index] : undefined;
  }

  get quizTitel(): string {
    return this.quizze.find(q => q.id === this.stand?.quizId)?.titel ?? this.stand?.titel ?? '';
  }

  /** Was „Weiter“ als Nächstes macht */
  get weiterText(): string {
    const s = this.stand;
    if (!s) return 'Weiter';
    if (s.phase === 'warten' || s.phase === 'runde') return s.anzahl ? 'Erste Frage' : 'Keine Fragen';
    if (s.phase === 'ende') return 'Ende';
    const texte = ['Frage zeigen', 'Antwort A', 'Antwort B', 'Antwort C', 'Antwort D', 'Spannung …', 'Auflösen!'];
    if (s.schritt < 7) return texte[s.schritt];
    return s.index + 1 < s.anzahl ? 'Nächste Frage' : 'Abschluss';
  }

  get schrittText(): string {
    const s = this.stand;
    if (!s) return '';
    if (s.phase === 'warten') return 'Startbild';
    if (s.phase === 'runde') return 'Ansage Zusatzrunde';
    if (s.phase === 'ende') return 'Schlussbild';
    const texte = ['Frage-Nummer', 'Frage sichtbar', 'A sichtbar', 'A–B sichtbar', 'A–C sichtbar', 'A–D sichtbar', 'Spannung läuft', 'Aufgelöst'];
    return texte[s.schritt] ?? '';
  }

  bild(id: string): string {
    return this.api.bildUrl(id);
  }
}
