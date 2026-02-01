import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { ContentBlock, QuizFile } from '../models/lf01.models';

@Component({
  selector: 'app-lf01-quicktest',
  templateUrl: './lf01-quicktest.component.html',
  styleUrls: ['./lf01-quicktest.component.scss'],
  standalone: false,
})
export class Lf01QuicktestComponent implements OnChanges {
  @Input() quiz?: QuizFile;
  @Input() blocks?: ContentBlock[];
  @Output() done = new EventEmitter<{ correct: number; total: number }>();

  questionIds: string[] = [];
  result?: { correct: number; total: number; recommendation?: string };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['quiz']) {
      this.build();
    }
  }

  onCompleted(payload: { correct: number; total: number; wrongIds: string[]; questionIds: string[] }): void {
    this.result = {
      correct: payload.correct,
      total: payload.total,
      recommendation: this.buildRecommendation(payload.wrongIds),
    };
    this.done.emit({ correct: payload.correct, total: payload.total });
  }

  retry(): void {
    this.result = undefined;
    this.build();
  }

  private build(): void {
    if (!this.quiz?.questions?.length) {
      this.questionIds = [];
      return;
    }
    const pool = this.shuffle(this.quiz.questions.map(q => q.id));
    this.questionIds = pool.slice(0, 10);
  }

  private shuffle<T>(arr: T[]): T[] {
    return arr
      .map(item => ({ item, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(entry => entry.item);
  }

  private buildRecommendation(wrongIds: string[]): string | undefined {
    if (!wrongIds.length || !this.quiz?.questions?.length) {
      return undefined;
    }
    const wrongBlocks = wrongIds
      .map(id => this.quiz!.questions.find(q => q.id === id)?.block)
      .filter((b): b is string => !!b);
    if (!wrongBlocks.length) return undefined;
    const counts: Record<string, number> = {};
    wrongBlocks.forEach(b => counts[b] = (counts[b] || 0) + 1);
    const target = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    const title = this.blocks?.find(b => b.id === target)?.title;
    return title ? `${target.toUpperCase()} – ${title}` : target.toUpperCase();
  }
}
