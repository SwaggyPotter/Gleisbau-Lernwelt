import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ContentBlock } from '../models/lf01.models';

@Component({
  selector: 'app-lf01-checklisten',
  templateUrl: './lf01-checklisten.component.html',
  styleUrls: ['./lf01-checklisten.component.scss'],
  standalone: false,
})
export class Lf01ChecklistenComponent implements OnChanges {
  @Input() blocks: ContentBlock[] = [];

  grouped: Array<{ id: string; title: string; items: Array<{ label: string; hint?: string }> }> = [];
  state: Record<string, boolean> = {};

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['blocks']) {
      this.build();
    }
  }

  toggle(key: string): void {
    this.state[key] = !this.state[key];
  }

  private build(): void {
    const list: Array<{ id: string; title: string; items: Array<{ label: string; hint?: string }> }> = [];
    this.blocks.forEach(block => {
      const checklistEntries = block.content.filter(c => c.type === 'checklist') as Array<{ type: 'checklist'; items: Array<{ label: string; hint?: string }> }>;
      checklistEntries.forEach((entry, idx) => {
        list.push({
          id: `${block.id}-${idx}`,
          title: `${block.title}`,
          items: entry.items,
        });
      });
    });
    this.grouped = list;
  }
}
