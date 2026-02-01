import { Component, Input } from '@angular/core';
import { PuzzleFile } from '../models/lf01.models';

@Component({
  selector: 'app-lf01-sign-puzzle',
  templateUrl: './lf01-sign-puzzle.component.html',
  styleUrls: ['./lf01-sign-puzzle.component.scss'],
  standalone: false,
})
export class Lf01SignPuzzleComponent {
  @Input() puzzle?: PuzzleFile;
}
