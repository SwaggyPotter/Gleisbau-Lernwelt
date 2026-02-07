import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { IonContent } from '@ionic/angular';
import { combineLatest, Subscription } from 'rxjs';
import { BlockProgress, ContentBlock, QuizFile } from '../models/lf04.models';
import { Lf04DataService } from '../services/lf04-data.service';

@Component({
  selector: 'app-lernfeld-04',
  templateUrl: './lernfeld-04.page.html',
  styleUrls: ['./lernfeld-04.page.scss'],
  standalone: false,
})
export class Lernfeld04Page implements OnInit, OnDestroy {
  @ViewChild(IonContent) content?: IonContent;
  blocks: ContentBlock[] = [];
  quiz?: QuizFile;
  loading = true;
  error = '';
  selectedBlock?: ContentBlock;
  progress: BlockProgress = { completedBlocks: [], quizStats: {} };
  private sub = new Subscription();

  constructor(
    private readonly data: Lf04DataService,
    private readonly scroller: ViewportScroller,
  ) {}

  ngOnInit(): void {
    this.progress = this.data.loadProgress();
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
      const target = document.getElementById(blockId);
      if (target && this.content) {
        this.content.getScrollElement().then(el => {
          const y = target.offsetTop - 60;
          el.scrollTo({ top: y < 0 ? 0 : y, behavior: 'smooth' });
        });
      } else {
        this.scroller.scrollToAnchor(blockId);
      }
    }
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
    return `Gesamtquiz: ${this.quiz?.meta.title ?? 'Lernfeld 4'}`;
  }
}
