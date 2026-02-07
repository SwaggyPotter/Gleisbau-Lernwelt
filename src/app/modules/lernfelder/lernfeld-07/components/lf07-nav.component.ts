import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ContentBlock } from '../models/lf07.models';

@Component({
  selector: 'app-lf07-nav',
  templateUrl: './lf07-nav.component.html',
  styleUrls: ['./lf07-nav.component.scss'],
  standalone: false,
})
export class Lf07NavComponent {
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

