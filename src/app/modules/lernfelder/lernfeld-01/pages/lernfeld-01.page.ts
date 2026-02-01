import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { combineLatest, Subscription } from 'rxjs';
import { ViewportScroller } from '@angular/common';
import { IonContent } from '@ionic/angular';
import { ContentBlock, PuzzleFile, QuizFile, ScenarioFile, BlockProgress } from '../models/lf01.models';
import { Lf01DataService } from '../services/lf01-data.service';

@Component({
  selector: 'app-lernfeld-01',
  templateUrl: './lernfeld-01.page.html',
  styleUrls: ['./lernfeld-01.page.scss'],
  standalone: false,
})
export class Lernfeld01Page implements OnInit, OnDestroy {
  @ViewChild(IonContent) content?: IonContent;
  blocks: ContentBlock[] = [];
  quiz?: QuizFile;
  scenarios?: ScenarioFile;
  puzzle?: PuzzleFile;
  loading = true;
  error = '';
  selectedBlock?: ContentBlock;
  progress: BlockProgress = { completedBlocks: [], quizStats: {}, scenarioScore: 0, quickTests: [] };
  private sub = new Subscription();

  constructor(
    private readonly data: Lf01DataService,
    private readonly scroller: ViewportScroller,
  ) {}

  ngOnInit(): void {
    this.progress = this.data.loadProgress();
    this.sub.add(
      combineLatest([
        this.data.getContent(),
        this.data.getQuiz(),
        this.data.getScenarios(),
        this.data.getPuzzle(),
      ]).subscribe({
        next: ([blocks, quiz, scenarios, puzzle]) => {
          this.blocks = blocks;
          this.quiz = quiz;
          this.scenarios = scenarios;
          this.puzzle = puzzle;
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

  scenarioProgress(delta: number): void {
    this.progress = this.data.recordScenarioScore(delta);
  }

  quicktestDone(result: { correct: number; total: number }): void {
    this.progress = this.data.recordQuickTest(result.correct, result.total);
  }
}
