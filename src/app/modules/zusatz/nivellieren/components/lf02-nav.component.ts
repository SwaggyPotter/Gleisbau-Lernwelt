import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ContentBlock } from '../models/lf02.models';

@Component({
  selector: 'app-lf02-nav',
  templateUrl: './lf02-nav.component.html',
  styleUrls: ['./lf02-nav.component.scss'],
  standalone: false,
})
export class Lf02NavComponent {
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
