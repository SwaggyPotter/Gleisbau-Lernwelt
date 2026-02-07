import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ContentBlock } from '../models/lf06.models';

@Component({
  selector: 'app-lf06-nav',
  templateUrl: './lf06-nav.component.html',
  styleUrls: ['./lf06-nav.component.scss'],
  standalone: false,
})
export class Lf06NavComponent {
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
