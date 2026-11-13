import { Component, OnInit } from '@angular/core';
import { QuizshowApiService, ShowFrage, ShowQuiz, ShowQuizKurz, bildVerkleinern } from '../quizshow-api.service';

/** Fragen-Editor (nur Admin): Quizze anlegen, Fragen + Antworten + Bilder vom Tablet. */
@Component({
  selector: 'app-quizshow-editor',
  templateUrl: './editor.page.html',
  styleUrls: ['./editor.page.scss'],
  standalone: false,
})
export class EditorPage implements OnInit {
  quizze: ShowQuizKurz[] = [];
  quiz?: ShowQuiz;
  geaendert = false;
  speichert = false;
  meldung = '';
  fehler = '';
  laedtBild: string | null = null;
  readonly buchstaben = ['A', 'B', 'C', 'D'];

  constructor(private readonly api: QuizshowApiService) {}

  ngOnInit(): void {
    this.liste(true);
  }

  private liste(erstesOeffnen = false): void {
    this.api.quizze().subscribe({
      next: r => {
        this.quizze = r.quizze;
        if (erstesOeffnen && r.quizze[0]) this.oeffnen(r.quizze[0].id);
      },
      error: e => (this.fehler = e?.status === 401 || e?.status === 403 ? 'Nur mit Admin-Konto.' : 'Keine Verbindung zum Server.'),
    });
  }

  oeffnen(id: number): void {
    if (this.geaendert && !confirm('Ungespeicherte Änderungen verwerfen?')) return;
    this.api.quiz(+id).subscribe({
      next: r => { this.quiz = r.quiz; this.gruppieren(); this.geaendert = false; this.meldung = ''; },
      error: () => (this.fehler = 'Quiz konnte nicht geladen werden.'),
    });
  }

  neuesQuiz(): void {
    const titel = prompt('Name des neuen Quiz:', 'Neues Quiz');
    if (!titel?.trim()) return;
    this.api.quizNeu(titel.trim()).subscribe({ next: r => { this.geaendert = false; this.liste(); this.oeffnen(r.id); } });
  }

  quizLoeschen(): void {
    if (!this.quiz || !confirm(`Quiz „${this.quiz.titel}“ wirklich löschen?`)) return;
    this.api.quizLoeschen(this.quiz.id).subscribe({ next: () => { this.quiz = undefined; this.gruppieren(); this.geaendert = false; this.liste(true); } });
  }

  /** Feste Gruppen-Objekte – nur nach echten Änderungen neu berechnet (sonst baut ngFor die Liste endlos neu auf). */
  readonly gruppen: { name: string; final: boolean; liste: ShowFrage[] }[] = [
    { name: 'Hauptrunde', final: false, liste: [] },
    { name: 'Zusatzfragen (Finalrunde bei Gleichstand)', final: true, liste: [] },
  ];

  gruppieren(): void {
    const alle = this.quiz?.fragen ?? [];
    for (const g of this.gruppen) g.liste = alle.filter(f => !!f.final === g.final);
  }

  finalUmschalten(): void {
    this.gruppieren();
    this.aenderung();
  }

  frageNeu(final: boolean): void {
    if (!this.quiz) return;
    this.quiz.fragen.push({ id: 'f' + Date.now().toString(36), text: '', bild: null, antworten: ['', '', '', ''], richtig: 0, final, notiz: '' });
    this.gruppieren();
    this.aenderung();
  }

  verschieben(f: ShowFrage, richtung: -1 | 1): void {
    const alle = this.quiz!.fragen;
    const gruppe = alle.filter(x => x.final === f.final);
    const pos = gruppe.indexOf(f);
    const nachbar = gruppe[pos + richtung];
    if (!nachbar) return;
    const a = alle.indexOf(f);
    const b = alle.indexOf(nachbar);
    [alle[a], alle[b]] = [alle[b], alle[a]];
    this.gruppieren();
    this.aenderung();
  }

  loeschen(f: ShowFrage): void {
    if (!confirm('Frage löschen?')) return;
    this.quiz!.fragen = this.quiz!.fragen.filter(x => x !== f);
    this.gruppieren();
    this.aenderung();
  }

  async bildWaehlen(f: ShowFrage, ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const datei = input.files?.[0];
    input.value = '';
    if (!datei) return;
    this.laedtBild = f.id;
    try {
      const data = await bildVerkleinern(datei);
      this.api.bildHochladen(data).subscribe({
        next: r => { f.bild = r.id; this.laedtBild = null; this.aenderung(); },
        error: () => { this.laedtBild = null; this.fehler = 'Bild-Upload fehlgeschlagen.'; },
      });
    } catch {
      this.laedtBild = null;
      this.fehler = 'Bild konnte nicht gelesen werden.';
    }
  }

  bildWeg(f: ShowFrage): void {
    f.bild = null;
    this.aenderung();
  }

  bild(id: string): string {
    return this.api.bildUrl(id);
  }

  aenderung(): void {
    this.geaendert = true;
    this.meldung = '';
  }

  speichern(): void {
    if (!this.quiz || this.speichert) return;
    const leer = this.quiz.fragen.findIndex(f => !f.text.trim() || f.antworten.some(a => !a.trim()));
    if (leer >= 0 && !confirm('Mindestens eine Frage hat leere Felder. Trotzdem speichern?')) return;
    this.speichert = true;
    this.api.quizSpeichern(this.quiz).subscribe({
      next: () => { this.speichert = false; this.geaendert = false; this.meldung = '✓ Gespeichert'; this.fehler = ''; this.liste(); },
      error: () => { this.speichert = false; this.fehler = 'Speichern fehlgeschlagen.'; },
    });
  }

  trackId(_i: number, f: ShowFrage): string { return f.id; }
  trackIndex(i: number): number { return i; }
}
