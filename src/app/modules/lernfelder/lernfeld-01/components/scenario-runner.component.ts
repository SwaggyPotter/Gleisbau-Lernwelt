import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Scenario } from '../models/lf01.models';

@Component({
  selector: 'app-scenario-runner',
  templateUrl: './scenario-runner.component.html',
  styleUrls: ['./scenario-runner.component.scss'],
  standalone: false,
})
export class ScenarioRunnerComponent implements OnChanges {
  @Input() scenarios: Scenario[] = [];
  @Output() progress = new EventEmitter<number>();

  current?: Scenario;
  score = 0;
  showFeedback = false;
  selectedChoice?: string;

  get currentFeedback(): string | undefined {
    if (!this.current || !this.selectedChoice) return undefined;
    return this.current.choices.find(c => c.id === this.selectedChoice)?.feedback;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['scenarios']) {
      this.pickNext();
    }
  }

  pickNext(): void {
    if (!this.scenarios?.length) return;
    const pool = this.shuffle(this.scenarios);
    this.current = pool[0];
    this.selectedChoice = undefined;
    this.showFeedback = false;
  }

  choose(choiceId: string): void {
    if (!this.current) return;
    this.selectedChoice = choiceId;
    const choice = this.current.choices.find(c => c.id === choiceId);
    if (choice) {
      this.score += choice.impact.score;
      this.progress.emit(choice.impact.score);
      this.showFeedback = true;
    }
  }

  next(): void {
    this.pickNext();
  }

  private shuffle<T>(arr: T[]): T[] {
    return arr
      .map(item => ({ item, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(e => e.item);
  }
}
