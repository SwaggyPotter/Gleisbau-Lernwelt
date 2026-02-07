import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ContentBlock } from '../models/lf09.models';

@Component({
  selector: 'app-lf09-nav',
  templateUrl: './lf09-nav.component.html',
  styleUrls: ['./lf09-nav.component.scss'],
  standalone: false,
})
export class Lf09NavComponent {
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



