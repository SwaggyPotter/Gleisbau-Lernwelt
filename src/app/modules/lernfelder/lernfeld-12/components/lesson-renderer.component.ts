import { Component, Input } from '@angular/core';
import { ContentBlock } from '../models/lf12.models';

@Component({
  selector: 'app-lf12-lesson-renderer',
  templateUrl: './lesson-renderer.component.html',
  styleUrls: ['./lesson-renderer.component.scss'],
  standalone: false,
})
export class LessonRendererComponent {
  @Input() block?: ContentBlock;
}






