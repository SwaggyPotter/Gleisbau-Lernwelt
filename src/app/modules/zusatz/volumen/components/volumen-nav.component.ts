import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ContentBlock } from '../models/volumen.models';

@Component({
  selector: 'app-volumen-nav',
  templateUrl: './volumen-nav.component.html',
  styleUrls: ['./volumen-nav.component.scss'],
  standalone: false,
})
export class VolumenNavComponent {
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
