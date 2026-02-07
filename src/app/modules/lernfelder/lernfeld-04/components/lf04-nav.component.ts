import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ContentBlock } from '../models/lf04.models';

@Component({
  selector: 'app-lf04-nav',
  templateUrl: './lf04-nav.component.html',
  styleUrls: ['./lf04-nav.component.scss'],
  standalone: false,
})
export class Lf04NavComponent {
  @Input() blocks: ContentBlock[] = [];
  @Input() completed: string[] = [];
  @Input() activeId?: string;
  @Output() selectBlock = new EventEmitter<string>();

  isCompleted(id: string): boolean {
    return this.completed?.includes(id);
  }

  trackById(_index: number, block: ContentBlock): string {
    return block.id;
  }
}
