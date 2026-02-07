import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ContentBlock } from '../models/lf11.models';

@Component({
  selector: 'app-lf11-nav',
  templateUrl: './lf11-nav.component.html',
  styleUrls: ['./lf11-nav.component.scss'],
  standalone: false,
})
export class Lf11NavComponent {
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





