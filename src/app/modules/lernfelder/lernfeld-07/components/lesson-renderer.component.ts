import { Component, Input } from '@angular/core';
import { ContentBlock } from '../models/lf07.models';

@Component({
  selector: 'app-lf07-lesson-renderer',
  templateUrl: './lesson-renderer.component.html',
  styleUrls: ['./lesson-renderer.component.scss'],
  standalone: false,
})
export class LessonRendererComponent {
  @Input() block?: ContentBlock;

  isTopicHeading(value: string): boolean {
    const trimmed = (value ?? '').trim();
    if (!trimmed) {
      return false;
    }

    if (trimmed.endsWith('?') || /^\d+\)\s+/.test(trimmed) || /^\d+(?:\.\d+)+\s+/.test(trimmed)) {
      return true;
    }

    const hasTerminalPunctuation = /[.!?:]$/.test(trimmed);
    const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
    return !hasTerminalPunctuation && wordCount <= 8;
  }

  isPrimaryTopicHeading(value: string): boolean {
    const trimmed = (value ?? '').trim();
    const normalized = this.formatTopicHeading(trimmed);
    return /^\d+\)\s+/.test(trimmed) || normalized.endsWith('?') || normalized.includes(' - ');
  }

  formatTopicHeading(value: string): string {
    const trimmed = (value ?? '').trim();
    return trimmed.replace(/^\d+\)\s+/, '').replace(/^\d+(?:\.\d+)+\s+/, '');
  }
}




