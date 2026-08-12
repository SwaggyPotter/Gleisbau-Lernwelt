import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { combineLatest, Subscription } from 'rxjs';
import { BlockProgress, ContentBlock, QuizFile } from '../models/prozentrechnung.models';
import { ProzentrechnungDataService } from '../services/prozentrechnung-data.service';

@Component({
  selector: 'app-prozentrechnung',
  templateUrl: './prozentrechnung.page.html',
  styleUrls: ['./prozentrechnung.page.scss'],
  standalone: false,
})
export class ProzentrechnungPage implements OnInit, OnDestroy {
  @ViewChild(IonContent) content?: IonContent;
  blocks: ContentBlock[] = [];
  quiz?: QuizFile;
  loading = true;
  error = '';
  selectedBlock?: ContentBlock;
  progress: BlockProgress = { completedBlocks: [], quizStats: {} };
  private sub = new Subscription();

  constructor(
    private readonly data: ProzentrechnungDataService,
    private readonly scroller: ViewportScroller,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.progress = this.data.loadProgress();
    const jumpToQuiz = this.route.snapshot.queryParamMap.get('view') === 'quiz';
    this.sub.add(
      combineLatest([
        this.data.getContent(),
        this.data.getQuiz(),
      ]).subscribe({
        next: ([blocks, quiz]) => {
          this.blocks = blocks;
          this.quiz = quiz;
          this.selectedBlock = this.blocks[0];
          this.loading = false;
          if (jumpToQuiz) {
            setTimeout(() => this.scrollToId('gesamtquiz-anchor'), 150);
          }
        },
        error: () => {
          this.error = 'Daten konnten nicht geladen werden.';
          this.loading = false;
        },
      }),
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  selectBlock(blockId: string): void {
    const found = this.blocks.find(b => b.id === blockId);
    if (found) {
      this.selectedBlock = found;
      if (!this.scrollToId(blockId)) {
        this.scroller.scrollToAnchor(blockId);
      }
    }
  }

  /** Scrollt innerhalb des ion-content-eigenen Scroll-Containers zu einem Element-Id. */
  private scrollToId(id: string): boolean {
    const target = document.getElementById(id);
    if (!target || !this.content) return false;
    this.content.getScrollElement().then(el => {
      const y = target.offsetTop - 60;
      el.scrollTo({ top: y < 0 ? 0 : y, behavior: 'smooth' });
    });
    return true;
  }

  toggleCompleted(block: ContentBlock): void {
    this.progress = this.data.toggleBlockCompleted(block.id);
  }

  quizAnswered(payload: { id: string; correct: boolean }): void {
    this.progress = this.data.recordQuizResult(payload.id, payload.correct);
  }

  totalAnswered(): number {
    return Object.values(this.progress.quizStats).reduce((sum, entry) => sum + entry.correct + entry.wrong, 0);
  }

  get quizTitle(): string {
    return this.quiz?.meta.title ?? 'Quiz';
  }

  get overallQuizTitle(): string {
    return `Gesamtquiz: ${this.quiz?.meta.title ?? 'Prozentrechnung'}`;
  }
}
