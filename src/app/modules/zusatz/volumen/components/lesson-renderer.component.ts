import { Component, Input } from '@angular/core';
import { ContentBlock } from '../models/volumen.models';

@Component({
  selector: 'app-volumen-lesson-renderer',
  templateUrl: './lesson-renderer.component.html',
  styleUrls: ['./lesson-renderer.component.scss'],
  standalone: false,
})
export class VolumenLessonRendererComponent {
  @Input() block?: ContentBlock;
}
