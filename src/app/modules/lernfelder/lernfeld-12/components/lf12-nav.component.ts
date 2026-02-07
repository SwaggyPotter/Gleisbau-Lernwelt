import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ContentBlock } from '../models/lf12.models';

@Component({
  selector: 'app-lf12-nav',
  templateUrl: './lf12-nav.component.html',
  styleUrls: ['./lf12-nav.component.scss'],
  standalone: false,
})
export class Lf12NavComponent {
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






