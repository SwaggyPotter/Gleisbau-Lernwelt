import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ContentBlock } from '../models/prozentrechnung.models';

@Component({
  selector: 'app-prozentrechnung-nav',
  templateUrl: './prozentrechnung-nav.component.html',
  styleUrls: ['./prozentrechnung-nav.component.scss'],
  standalone: false,
})
export class ProzentrechnungNavComponent {
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
