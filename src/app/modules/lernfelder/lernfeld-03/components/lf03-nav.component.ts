import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ContentBlock } from '../models/lf03.models';

@Component({
  selector: 'app-lf03-nav',
  templateUrl: './lf03-nav.component.html',
  styleUrls: ['./lf03-nav.component.scss'],
  standalone: false,
})
export class Lf03NavComponent {
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
