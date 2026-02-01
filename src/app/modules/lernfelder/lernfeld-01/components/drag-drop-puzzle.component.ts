import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { PuzzleItem, PuzzleLevel } from '../models/lf01.models';

@Component({
  selector: 'app-drag-drop-puzzle',
  templateUrl: './drag-drop-puzzle.component.html',
  styleUrls: ['./drag-drop-puzzle.component.scss'],
  standalone: false,
})
export class DragDropPuzzleComponent implements OnChanges {
  @Input() levels: PuzzleLevel[] = [];
  @Output() completed = new EventEmitter<void>();

  currentIndex = 0;
  placements: Record<string, string> = {};
  message = '';
  errorHints: string[] = [];

  get level(): PuzzleLevel | undefined {
    return this.levels[this.currentIndex];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['levels']) {
      this.resetLevel();
    }
  }

  allowDrop(event: DragEvent): void {
    event.preventDefault();
  }

  drag(item: PuzzleItem, event: DragEvent): void {
    event.dataTransfer?.setData('text/plain', item.id);
  }

  drop(slotId: string, event: DragEvent): void {
    event.preventDefault();
    const data = event.dataTransfer?.getData('text/plain');
    if (data) {
      this.placements = { ...this.placements, [slotId]: data };
    }
  }

  placedItem(slotId: string): PuzzleItem | undefined {
    const itemId = this.placements[slotId];
    return this.level?.items.find(i => i.id === itemId);
  }

  check(): void {
    if (!this.level) return;
    const unmatched = this.level.canvas.slots.filter(slot => {
      const id = this.placements[slot.slotId];
      return !id || !slot.accept.includes(id);
    });
    if (!unmatched.length) {
      this.message = this.level.successText;
      this.errorHints = [];
      this.completed.emit();
      if (this.currentIndex < this.levels.length - 1) {
        setTimeout(() => this.nextLevel(), 400);
      }
    } else {
      this.message = 'Noch nicht ganz. Prüfe die Hinweise.';
      this.errorHints = this.level.failHints;
    }
  }

  nextLevel(): void {
    if (this.currentIndex < this.levels.length - 1) {
      this.currentIndex += 1;
      this.resetLevel();
    }
  }

  resetLevel(): void {
    this.placements = {};
    this.message = '';
    this.errorHints = [];
  }
}
