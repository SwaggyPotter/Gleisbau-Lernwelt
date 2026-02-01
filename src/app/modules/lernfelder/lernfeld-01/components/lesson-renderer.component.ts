import { Component, Input } from '@angular/core';
import { ContentBlock, ContentEntry } from '../models/lf01.models';

@Component({
  selector: 'app-lesson-renderer',
  templateUrl: './lesson-renderer.component.html',
  styleUrls: ['./lesson-renderer.component.scss'],
  standalone: false,
})
export class LessonRendererComponent {
  @Input() block?: ContentBlock;

  isChecklist(entry: ContentEntry): entry is { type: 'checklist'; items: Array<{ label: string; hint?: string }> } {
    return entry.type === 'checklist';
  }
}
