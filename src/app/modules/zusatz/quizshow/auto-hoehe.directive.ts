import { AfterViewInit, Directive, ElementRef, HostListener } from '@angular/core';

/** Textfeld wächst mit seinem Inhalt (kein seitliches Scrollen, keine abgeschnittenen Notizen). */
@Directive({ selector: 'textarea[qsAutoHoehe]', standalone: false })
export class AutoHoeheDirective implements AfterViewInit {
  constructor(private readonly el: ElementRef<HTMLTextAreaElement>) {}

  ngAfterViewInit(): void {
    // ngModel setzt den Wert erst nach dem ersten Durchlauf
    setTimeout(() => this.anpassen());
    setTimeout(() => this.anpassen(), 300);
  }

  @HostListener('input')
  @HostListener('focus')
  anpassen(): void {
    const t = this.el.nativeElement;
    t.style.height = 'auto';
    t.style.height = t.scrollHeight + 2 + 'px';
  }
}
