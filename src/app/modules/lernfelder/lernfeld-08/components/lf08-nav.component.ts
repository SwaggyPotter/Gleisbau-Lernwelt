import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ContentBlock } from '../models/lf08.models';

@Component({
  selector: 'app-lf08-nav',
  templateUrl: './lf08-nav.component.html',
  styleUrls: ['./lf08-nav.component.scss'],
  standalone: false,
})
export class Lf08NavComponent {
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


