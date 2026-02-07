import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ContentBlock } from '../models/lf13.models';

@Component({
  selector: 'app-lf13-nav',
  templateUrl: './lf13-nav.component.html',
  styleUrls: ['./lf13-nav.component.scss'],
  standalone: false,
})
export class Lf13NavComponent {
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







