import { Component, Input } from '@angular/core';
import { ContentBlock } from '../models/prozentrechnung.models';

@Component({
  selector: 'app-prozentrechnung-lesson-renderer',
  templateUrl: './lesson-renderer.component.html',
  styleUrls: ['./lesson-renderer.component.scss'],
  standalone: false,
})
export class ProzentrechnungLessonRendererComponent {
  @Input() block?: ContentBlock;
}
