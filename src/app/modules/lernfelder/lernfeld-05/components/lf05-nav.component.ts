import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ContentBlock } from '../models/lf05.models';

@Component({
  selector: 'app-lf05-nav',
  templateUrl: './lf05-nav.component.html',
  styleUrls: ['./lf05-nav.component.scss'],
  standalone: false,
})
export class Lf05NavComponent {
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
