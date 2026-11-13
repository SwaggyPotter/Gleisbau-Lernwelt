import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import katex from 'katex';

const cache = new Map<string, string>();

/** Rendert LaTeX mit lokal gebündeltem KaTeX (kein CDN). */
@Component({
  selector: 'fs-formel',
  template: '<span class="fs-formel" [class.block]="block" [innerHTML]="html"></span>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class FormelComponent implements OnChanges {
  @Input() tex = '';
  @Input() block = false;
  html: SafeHtml = '';

  constructor(private readonly sanitizer: DomSanitizer) {}

  ngOnChanges(): void {
    const key = (this.block ? 'B:' : 'I:') + this.tex;
    let out = cache.get(key);
    if (out === undefined) {
      try {
        out = katex.renderToString(this.tex ?? '', { displayMode: this.block, throwOnError: false, strict: 'ignore', output: 'html' });
      } catch {
        out = this.tex;
      }
      cache.set(key, out);
    }
    // KaTeX erzeugt nur eigenes Markup (trust: false) – sicher für innerHTML.
    this.html = this.sanitizer.bypassSecurityTrustHtml(out);
  }
}
