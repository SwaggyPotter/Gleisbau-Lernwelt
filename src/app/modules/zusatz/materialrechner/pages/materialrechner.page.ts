import { Component, OnInit } from '@angular/core';
import { Difficulty, GeneratedQuestion, MaterialrechnerProgress } from '../models/materialrechner.models';
import { AufgabenGeneratorService } from '../services/aufgaben-generator.service';
import { MaterialrechnerDataService } from '../services/materialrechner-data.service';
import { MATERIALIEN } from '../data/schuettdichten';

@Component({
  selector: 'app-materialrechner',
  templateUrl: './materialrechner.page.html',
  styleUrls: ['./materialrechner.page.scss'],
  standalone: false,
})
export class MaterialrechnerPage implements OnInit {
  readonly difficulties: { id: Difficulty; label: string }[] = [
    { id: 'leicht', label: 'Leicht' },
    { id: 'mittel', label: 'Mittel' },
    { id: 'schwer', label: 'Schwer' },
  ];
  readonly materialien = MATERIALIEN;

  difficulty: Difficulty = 'leicht';
  question!: GeneratedQuestion;
  selectedChoiceId: string | null = null;
  showTable = false;
  progress!: MaterialrechnerProgress;

  constructor(
    private readonly generator: AufgabenGeneratorService,
    private readonly data: MaterialrechnerDataService,
  ) {}

  ngOnInit(): void {
    this.progress = this.data.loadProgress();
    this.newQuestion();
  }

  setDifficulty(d: string | number | undefined | null): void {
    if (typeof d !== 'string' || this.difficulty === d) return;
    this.difficulty = d as Difficulty;
    this.newQuestion();
  }

  newQuestion(): void {
    this.question = this.generator.generate(this.difficulty);
    this.selectedChoiceId = null;
  }

  select(choiceId: string): void {
    if (this.selectedChoiceId) return;
    this.selectedChoiceId = choiceId;
    const correct = choiceId === this.question.correctChoiceId;
    this.progress = this.data.recordResult(this.difficulty, correct);
  }

  choiceClass(choiceId: string): string {
    if (!this.selectedChoiceId) return '';
    if (choiceId === this.question.correctChoiceId) return 'correct';
    if (choiceId === this.selectedChoiceId) return 'wrong';
    return 'muted';
  }

  get isAnswered(): boolean {
    return this.selectedChoiceId !== null;
  }

  get isCorrect(): boolean {
    return this.selectedChoiceId === this.question.correctChoiceId;
  }

  statsFor(d: Difficulty): { correct: number; wrong: number; total: number } {
    const s = this.progress.stats[d];
    return { ...s, total: s.correct + s.wrong };
  }
}
