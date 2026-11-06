import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { ThemenquizDifficulty, ThemenquizQuestion } from '../models/themenquiz.models';
import { QuestionReportService } from '../../../services/question-report.service';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';
import { QuizBild, QuizBilderService } from '../../../core/quiz-aenderungen/quiz-aenderungen.service';

type ShuffledChoice = { text: string; originalIndex: number };

@Component({
  selector: 'app-themenquiz-engine',
  templateUrl: './quiz-engine.component.html',
  styleUrls: ['./quiz-engine.component.scss'],
  standalone: false,
})
export class ThemenquizEngineComponent implements OnChanges, OnInit {
  @Input() questions: ThemenquizQuestion[] = [];
  @Input() topicId = '';
  @Output() answered = new EventEmitter<{ id: string; correct: boolean }>();

  constructor(
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private reportSvc: QuestionReportService,
    private bilder: QuizBilderService,
    private auth: AuthService,
    private router: Router,
  ) {}

  private bilderBereit = false;
  private bildCache: { key?: string; bild: QuizBild | null } = { bild: null };

  ngOnInit(): void {
    this.bilder.quellen$.subscribe(() => { this.bilderBereit = true; this.bildCache = { bild: null }; });
  }

  /** Nur Admins: Stift-Knopf an jeder Frage, führt in den Fragen-Editor. */
  get istAdmin(): boolean {
    return this.auth.isAdmin;
  }

  bearbeiten(): void {
    const q = this.current;
    if (!q) return;
    this.router.navigate(['/konto/fragen-bearbeiten', this.topicId], { queryParams: { frage: q.id } });
  }

  currentImage(): QuizBild | null {
    const key = this.current?.imageKey;
    if (!key || !this.bilderBereit) return null;
    if (this.bildCache.key !== key) this.bildCache = { key, bild: this.bilder.aufloesen(key) };
    return this.bildCache.bild;
  }

  order: ThemenquizQuestion[] = [];
  currentIndex = 0;
  shuffledChoices: ShuffledChoice[] = [];
  selectedIndex: number | null = null;
  isCorrect: boolean | null = null;
  correctCount = 0;
  answeredCount = 0;
  finished = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['questions']) {
      this.start();
    }
  }

  start(): void {
    this.order = this.shuffle(this.questions);
    this.currentIndex = 0;
    this.correctCount = 0;
    this.answeredCount = 0;
    this.finished = false;
    this.prepareCurrentChoices();
  }

  get current(): ThemenquizQuestion | undefined {
    return this.order[this.currentIndex];
  }

  get progressLabel(): string {
    return `Frage ${Math.min(this.currentIndex + 1, this.order.length)} von ${this.order.length}`;
  }

  select(choice: ShuffledChoice): void {
    const q = this.current;
    if (!q || this.selectedIndex !== null) return;

    this.selectedIndex = choice.originalIndex;
    this.isCorrect = choice.originalIndex === q.correctIndex;
    this.answeredCount += 1;
    if (this.isCorrect) this.correctCount += 1;
    this.answered.emit({ id: q.id, correct: this.isCorrect });

    if (this.answeredCount === this.order.length) {
      this.finished = true;
    }
  }

  next(): void {
    if (this.currentIndex < this.order.length - 1) {
      this.currentIndex += 1;
      this.prepareCurrentChoices();
    }
  }

  restart(): void {
    this.start();
  }

  async reportQuestion(): Promise<void> {
    const q = this.current;
    if (!q) return;

    const alert = await this.alertCtrl.create({
      header: 'Frage melden',
      subHeader: 'Was ist an dieser Frage falsch oder unklar?',
      inputs: [
        { name: 'comment', type: 'textarea', placeholder: 'z. B. falsche Loesung, veraltete Norm, unklare Formulierung...' },
      ],
      buttons: [
        { text: 'Abbrechen', role: 'cancel' },
        {
          text: 'Melden',
          handler: async (data: { comment?: string }) => {
            this.reportSvc.submitReport({
              questionId: q.id,
              topic: this.topicId,
              question: q.question,
              reason: 'Nutzer-Meldung',
              comment: data.comment,
            });
            const toast = await this.toastCtrl.create({ message: 'Danke, die Meldung wurde gespeichert.', duration: 2000, color: 'success' });
            await toast.present();
          },
        },
      ],
    });
    await alert.present();
  }

  choiceClass(choice: ShuffledChoice): string {
    const q = this.current;
    if (!q || this.selectedIndex === null) return '';
    if (choice.originalIndex === q.correctIndex) return 'correct';
    if (choice.originalIndex === this.selectedIndex) return 'wrong';
    return 'muted';
  }

  trackByChoice(_index: number, choice: ShuffledChoice): number {
    return choice.originalIndex;
  }

  difficultyLabel(d: ThemenquizDifficulty): string {
    const labels: Record<ThemenquizDifficulty, string> = {
      einfach: 'Einfach',
      mittel: 'Mittel',
      schwer: 'Schwer',
      profi: 'Profi',
    };
    return labels[d];
  }

  private prepareCurrentChoices(): void {
    this.selectedIndex = null;
    this.isCorrect = null;
    const q = this.current;
    if (!q) {
      this.shuffledChoices = [];
      return;
    }
    const withIndex: ShuffledChoice[] = q.choices.map((text, originalIndex) => ({ text, originalIndex }));
    this.shuffledChoices = this.shuffle(withIndex);
  }

  private shuffle<T>(arr: T[]): T[] {
    return arr
      .map(item => ({ item, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(entry => entry.item);
  }
}
