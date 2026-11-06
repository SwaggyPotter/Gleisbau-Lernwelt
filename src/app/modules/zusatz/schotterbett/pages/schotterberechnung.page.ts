import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
import { starteSchotterberechnung } from './schotterberechnung.logik';

/**
 * Schotterberechnung (Prototyp von Tim, 2026-11-05) als Seite der Lernwelt:
 * links Textaufgabe, Whiteboard und Ergebnisfelder, rechts blätterbare Lehrtabellen.
 * Die Logik steckt unverändert in schotterberechnung.logik.ts und arbeitet direkt am DOM.
 */
@Component({
  selector: 'app-schotterberechnung',
  templateUrl: './schotterberechnung.page.html',
  styleUrls: ['./schotterberechnung.page.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: false,
})
export class SchotterberechnungPage implements AfterViewInit, OnDestroy {
  @ViewChild('root', { static: true }) root!: ElementRef<HTMLElement>;
  private stopp?: () => void;

  ngAfterViewInit(): void {
    this.stopp = starteSchotterberechnung(this.root.nativeElement);
  }

  ngOnDestroy(): void {
    this.stopp?.();
  }
}
