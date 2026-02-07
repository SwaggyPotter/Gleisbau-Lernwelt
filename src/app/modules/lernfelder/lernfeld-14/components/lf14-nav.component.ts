import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ContentBlock } from '../models/lf14.models';

@Component({
  selector: 'app-lf14-nav',
  templateUrl: './lf14-nav.component.html',
  styleUrls: ['./lf14-nav.component.scss'],
  standalone: false,
})
export class Lf14NavComponent {
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








