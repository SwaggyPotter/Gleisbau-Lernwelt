import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ContentBlock } from '../models/lf01.models';

@Component({
  selector: 'app-lf01-nav',
  templateUrl: './lf01-nav.component.html',
  styleUrls: ['./lf01-nav.component.scss'],
  standalone: false,
})
export class Lf01NavComponent {
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
