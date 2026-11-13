/* eslint-disable */
/**
 * Schmierblatt (Whiteboard) zum Mitrechnen – wiederverwendbar (Tim, 2026-11-06, zuerst für die Volumenberechnung).
 * Funktionen wie auf der Schotterberechnung: Stift, Radierer, Farben, Strichstärke, Text tippen und mit „=“ rechnen,
 * Zoom (Strg+Rad, zwei Finger), Verschieben, Zurück, Alles löschen, Vollbild, „Nur Stift“, Karten auf dem Blatt.
 *
 * Aufbau im Template (alles innerhalb von `flaeche`, die Aufgabe liegt fest oben):
 *   <div class="smb-flaeche"> <div class="aufgabe-blatt">…</div> </div>
 * Werkzeuge werden in `werkzeuge` eingesetzt. Styles: src/app/shared/schmierblatt/_schmierblatt.scss
 * Läuft direkt am DOM; der Aufrufer startet es außerhalb von Angulars Zone.
 */

export interface SchmierblattOptionen {
  /** Malfläche (enthält die feste Aufgabe) */
  flaeche: HTMLElement;
  /** Platz für die Werkzeugknöpfe */
  werkzeuge: HTMLElement;
  /** Element, das im Vollbild den ganzen Bildschirm einnimmt (z. B. linke Spalte) */
  vollbildEl: HTMLElement;
  /** Seiten-Element, an dem im Vollbild die App-Kopfleiste ausgeblendet wird */
  seite?: HTMLElement | null;
  /** Element, aus dem die Stiftfarbe „--ink“ gelesen wird */
  farbquelle?: HTMLElement;
}

export interface Schmierblatt {
  /** Striche, Notizen und Karten entfernen (ohne Nachfrage) */
  leeren(): void;
  /**
   * Karte mit Titel und HTML-Inhalt auf das Blatt legen – ohne Position unter die Aufgabe,
   * mit `clientX/clientY` (Bildschirmkoordinaten, z. B. Ablegepunkt beim Ziehen) genau dorthin.
   * `klasse` = zusätzliche CSS-Klasse der Karte (z. B. schmale Formelkarte).
   */
  karte(titel: string, html: string, opt?: KartenOptionen): void;
  /** Liegt der Bildschirmpunkt über der Malfläche? (fürs Reinziehen von außen) */
  ueberFlaeche(clientX: number, clientY: number): boolean;
  vollbild(an: boolean): void;
  zerstoeren(): void;
}

export interface KartenOptionen {
  clientX?: number;
  clientY?: number;
  klasse?: string;
}

const FARBEN = ['--ink', '#3b82f6', '#ef4444', '#22a55a', '#f59e0b'];

export function starteSchmierblatt(o: SchmierblattOptionen): Schmierblatt {
  const wrap = o.flaeche, farbquelle = o.farbquelle ?? wrap;
  const weg: (() => void)[] = [];
  const an = <K extends keyof DocumentEventMap>(ziel: Document | HTMLElement | Window, typ: K | string, fn: any, opt?: any) => {
    ziel.addEventListener(typ, fn, opt); weg.push(() => ziel.removeEventListener(typ, fn, opt));
  };

  /* ---------- Werkzeuge ---------- */
  o.werkzeuge.innerHTML = `
    <button class="btn small tool active" data-tool="pen" title="Stift" type="button">✏️ Stift</button>
    <button class="btn small tool" data-tool="eraser" title="Radierer" type="button">🧽 Radierer</button>
    <button class="btn small tool" data-tool="text" title="Mit der Tastatur schreiben und rechnen (Zeile mit = abschließen)" type="button">⌨️ Text</button>
    <span class="sep"></span>
    <span class="swatches"></span>
    <span class="sep"></span>
    <input type="range" class="smb-groesse" min="1" max="14" value="3" aria-label="Strichstärke">
    <span class="sep"></span>
    <button class="btn small smb-undo" type="button">↶ Zurück</button>
    <button class="btn small smb-clear" type="button">Alles löschen</button>
    <span class="sep"></span>
    <button class="btn small smb-zoom" type="button" title="Zoom zurücksetzen">🔍 <span class="smb-zoomwert">100 %</span></button>
    <button class="btn small smb-vollbild-knopf" type="button">Vollbild</button>
    <label class="chk"><input type="checkbox" class="smb-nurstift"> Nur Stift</label>`;
  const w$ = (s: string) => o.werkzeuge.querySelector(s) as any;
  const tools = Array.from(o.werkzeuge.querySelectorAll('.tool')) as HTMLElement[];

  /* ---------- Ebenen der Malfläche ---------- */
  wrap.classList.add('smb-flaeche');
  const welt = document.createElement('div'); welt.className = 'welt';
  const kartenlage = document.createElement('div'); kartenlage.className = 'kartenlage';
  const cv = document.createElement('canvas'); cv.className = 'smb-canvas';
  const textlage = document.createElement('div'); textlage.className = 'textlage';
  wrap.prepend(kartenlage); wrap.prepend(welt);
  wrap.appendChild(cv); wrap.appendChild(textlage);
  const ctx = cv.getContext('2d')!;

  const farbCache = new Map<string, string>();
  const farbe = (c: string) => {
    if (!c.startsWith('--')) return c;
    if (!farbCache.has(c)) farbCache.set(c, getComputedStyle(farbquelle).getPropertyValue(c).trim() || '#888');
    return farbCache.get(c)!;
  };
  let tool = 'pen', color = FARBEN[0], strokes: any[] = [], cur: any = null;

  const swatches = w$('.swatches') as HTMLElement;
  FARBEN.forEach((c, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch' + (i === 0 ? ' active' : ''); b.style.background = c.startsWith('--') ? `var(${c})` : c;
    b.dataset['c'] = c; b.setAttribute('aria-label', 'Farbe ' + (i + 1));
    swatches.appendChild(b);
  });
  swatches.onclick = (e: any) => {
    const s = e.target.closest('.swatch'); if (!s) return;
    color = s.dataset.c; swatches.querySelectorAll('.swatch').forEach(x => x.classList.toggle('active', x === s));
    setTool('pen');
  };
  function setTool(t: string) { tool = t; tools.forEach(b => b.classList.toggle('active', b.dataset['tool'] === t)); wrap.classList.toggle('textmodus', t === 'text'); }
  tools.forEach(b => b.onclick = () => setTool(b.dataset['tool']!));

  /* ---------- Ansicht: bild = blatt · s + t ---------- */
  const view = { s: 1, tx: 0, ty: 0 };
  const S_MIN = 0.4, S_MAX = 5;
  function wendeAnsichtAn() {
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr * view.s, 0, 0, dpr * view.s, dpr * view.tx, dpr * view.ty);
    welt.style.transform = `translate(${view.tx}px,${view.ty}px) scale(${view.s})`;
    textlage.style.transform = welt.style.transform;
    karten.forEach(setzeKarte);
    wrap.style.backgroundSize = `${28 * view.s}px ${28 * view.s}px`;
    wrap.style.backgroundPosition = `${view.tx}px ${view.ty}px`;
    w$('.smb-zoomwert').textContent = Math.round(view.s * 100) + ' %';
    redraw();
  }
  function zoomeUm(bx: number, by: number, sNeu: number) {
    sNeu = Math.min(S_MAX, Math.max(S_MIN, sNeu));
    const wx = (bx - view.tx) / view.s, wy = (by - view.ty) / view.s;
    view.s = sNeu; view.tx = bx - wx * sNeu; view.ty = by - wy * sNeu;
    wendeAnsichtAn();
  }
  w$('.smb-zoom').onclick = () => { view.s = 1; view.tx = 0; view.ty = 0; wendeAnsichtAn(); };

  function sizeCanvas() {
    const r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    cv.width = Math.max(1, Math.round(r.width * dpr)); cv.height = Math.max(1, Math.round(r.height * dpr));
    wendeAnsichtAn();
  }
  function drawStroke(s: any) {
    ctx.save();
    ctx.globalCompositeOperation = s.tool === 'eraser' ? 'destination-out' : 'source-over';
    const c = farbe(s.color);
    ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const p = s.pts;
    if (p.length === 1) { ctx.beginPath(); ctx.arc(p[0].x, p[0].y, p[0].w / 2, 0, Math.PI * 2); ctx.fill(); }
    for (let i = 1; i < p.length; i++) {
      ctx.lineWidth = (p[i].w + p[i - 1].w) / 2; ctx.beginPath(); ctx.moveTo(p[i - 1].x, p[i - 1].y); ctx.lineTo(p[i].x, p[i].y); ctx.stroke();
    }
    ctx.restore();
  }
  function redraw() {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.restore();
    strokes.forEach(drawStroke);
  }
  const ro = new ResizeObserver(sizeCanvas); ro.observe(cv);
  const mo = new MutationObserver(() => { farbCache.clear(); redraw(); });
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class', 'data-theme', 'data-skin'] });

  function bildPunkt(e: PointerEvent | WheelEvent) { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  function pt(e: PointerEvent) {
    const b = bildPunkt(e); const base = +w$('.smb-groesse').value * (tool === 'eraser' ? 5 : 1);
    let w = base; if (tool === 'pen' && e.pointerType === 'pen' && e.pressure > 0) w = base * (0.5 + e.pressure);
    return { x: (b.x - view.tx) / view.s, y: (b.y - view.ty) / view.s, w: w / view.s };
  }

  /* ---------- Karten (behalten beim Zoomen ihre Größe, nur der Platz wandert mit) ---------- */
  interface Karte { el: HTMLElement; x: number; y: number; }
  let karten: Karte[] = [];
  function setzeKarte(k: Karte) { k.el.style.left = (k.x * view.s + view.tx) + 'px'; k.el.style.top = (k.y * view.s + view.ty) + 'px'; }
  function neueKarte(titel: string, html: string, opt: KartenOptionen = {}) {
    const el = document.createElement('div'); el.className = 'karte' + (opt.klasse ? ' ' + opt.klasse : '');
    el.innerHTML = `<div class="karte-kopf"><span class="karte-griff">⠿ ${titel}</span><span class="karte-x" title="Entfernen">✕</span></div><div class="karte-inhalt">${html}</div>`;
    kartenlage.appendChild(el);
    const r = cv.getBoundingClientRect();
    let bx: number, by: number;
    if (opt.clientX !== undefined && opt.clientY !== undefined) {
      // Tim, 2026-11-09: aus der Formel-Leiste gezogen → Karte dort ablegen, wo losgelassen wurde (Griff unter dem Finger)
      const breite = el.offsetWidth || 300;
      bx = Math.min(Math.max(4, opt.clientX - r.left - 30), Math.max(4, r.width - breite - 4));
      by = Math.max(4, opt.clientY - r.top - 16);
    } else {
      const kopf = (wrap.querySelector('.aufgabe-blatt') as HTMLElement | null)?.getBoundingClientRect();
      const versatz = karten.length * 24;
      bx = Math.max(16, (r.width - Math.min(el.offsetWidth || 420, r.width - 24)) / 2) + versatz;
      by = (kopf ? kopf.bottom - r.top : 0) + 16 + versatz;
    }
    const k = { el, x: (bx - view.tx) / view.s, y: (by - view.ty) / view.s }; karten.push(k); setzeKarte(k);
  }
  function entferneKarten() { karten.forEach(k => k.el.remove()); karten = []; }
  function karteUnter(cx: number, cy: number): { k: Karte; teil: 'griff' | 'x' } | null {
    for (let i = karten.length - 1; i >= 0; i--) {
      const k = karten[i];
      for (const teil of ['x', 'griff'] as const) {
        const r = (k.el.querySelector(teil === 'x' ? '.karte-x' : '.karte-kopf') as HTMLElement).getBoundingClientRect();
        if (cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom) return { k, teil };
      }
    }
    return null;
  }

  /* ---------- Zeiger ---------- */
  const finger = new Map<number, { x: number; y: number }>();
  let pinch: { d0: number; s0: number; wx: number; wy: number } | null = null;
  let kartenZug: { k: Karte; id: number; ox: number; oy: number } | null = null;
  let schieben: { id: number; x: number; y: number } | null = null;
  function pinchStart() {
    const [a, b] = [...finger.values()];
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, s0: view.s, wx: (mx - view.tx) / view.s, wy: (my - view.ty) / view.s };
  }
  an(cv, 'pointerdown', (e: PointerEvent) => {
    if (tool === 'text' && finger.size === 0) { e.preventDefault(); const p = pt(e); neueNotiz(p.x, p.y - 12); return; }
    const treffer = karteUnter(e.clientX, e.clientY);
    if (treffer) {
      if (treffer.teil === 'x') { treffer.k.el.remove(); karten = karten.filter(k => k !== treffer.k); return; }
      const p = pt(e); kartenZug = { k: treffer.k, id: e.pointerId, ox: p.x - treffer.k.x, oy: p.y - treffer.k.y };
      treffer.k.el.classList.add('zieht'); cv.setPointerCapture(e.pointerId); return;
    }
    if (e.pointerType === 'touch') {
      finger.set(e.pointerId, bildPunkt(e));
      if (finger.size === 2) {
        if (cur && cur.touch) { strokes.splice(strokes.indexOf(cur), 1); cur = null; redraw(); }
        schieben = null; pinchStart(); cv.setPointerCapture(e.pointerId); return;
      }
      if (finger.size > 2) return;
      if (w$('.smb-nurstift').checked) { schieben = { id: e.pointerId, ...bildPunkt(e) }; cv.setPointerCapture(e.pointerId); return; }
    }
    cv.setPointerCapture(e.pointerId);
    cur = { tool, color, pts: [pt(e)], id: e.pointerId, touch: e.pointerType === 'touch' }; strokes.push(cur); drawStroke(cur);
  });
  an(cv, 'pointermove', (e: PointerEvent) => {
    if (e.pointerType !== 'touch') { const b = bildPunkt(e); letzterBlattPunkt = { x: (b.x - view.tx) / view.s, y: (b.y - view.ty) / view.s }; }
    if (kartenZug && e.pointerId === kartenZug.id) {
      const p = pt(e); kartenZug.k.x = p.x - kartenZug.ox; kartenZug.k.y = p.y - kartenZug.oy; setzeKarte(kartenZug.k); return;
    }
    if (finger.has(e.pointerId)) {
      finger.set(e.pointerId, bildPunkt(e));
      if (pinch && finger.size >= 2) {
        const [a, b] = [...finger.values()];
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        view.s = Math.min(S_MAX, Math.max(S_MIN, pinch.s0 * d / pinch.d0));
        view.tx = mx - pinch.wx * view.s; view.ty = my - pinch.wy * view.s;
        wendeAnsichtAn(); return;
      }
      if (schieben && schieben.id === e.pointerId) {
        const b = bildPunkt(e); view.tx += b.x - schieben.x; view.ty += b.y - schieben.y; schieben.x = b.x; schieben.y = b.y;
        wendeAnsichtAn(); return;
      }
    }
    if (!cur || e.pointerId !== cur.id) return;
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    const start = cur.pts.length - 1;
    (evs.length ? evs : [e]).forEach(ev => cur.pts.push(pt(ev)));
    drawStroke({ ...cur, pts: cur.pts.slice(Math.max(0, start)) });
  });
  const zeigerEnde = (e: PointerEvent) => {
    if (kartenZug && e.pointerId === kartenZug.id) { kartenZug.k.el.classList.remove('zieht'); kartenZug = null; }
    if (finger.delete(e.pointerId)) {
      if (finger.size < 2) pinch = null;
      if (schieben && schieben.id === e.pointerId) schieben = null;
    }
    if (cur && e.pointerId === cur.id) cur = null;
  };
  an(cv, 'pointerup', zeigerEnde); an(cv, 'pointercancel', zeigerEnde);
  an(cv, 'wheel', (e: WheelEvent) => {
    e.preventDefault();
    const b = bildPunkt(e);
    if (e.ctrlKey || e.metaKey) zoomeUm(b.x, b.y, view.s * Math.exp(-e.deltaY * 0.0025));
    else { view.tx -= e.deltaX; view.ty -= e.deltaY; wendeAnsichtAn(); }
  }, { passive: false });
  w$('.smb-undo').onclick = () => { strokes.pop(); redraw(); };
  w$('.smb-clear').onclick = () => { if ((!strokes.length && !karten.length && !notizen.length) || confirm('Schmierblatt komplett löschen?')) leeren(); };

  /* ---------- Vollbild ---------- */
  function vollbild(ein: boolean) {
    o.vollbildEl.classList.toggle('smb-vollbild', ein);
    o.seite?.classList.toggle('smb-vollbild-seite', ein);
    w$('.smb-vollbild-knopf').textContent = ein ? 'Vollbild beenden' : 'Vollbild';
    w$('.smb-vollbild-knopf').classList.toggle('tool-an', ein);
  }
  w$('.smb-vollbild-knopf').onclick = () => vollbild(!o.vollbildEl.classList.contains('smb-vollbild'));
  an(document, 'keydown', (e: KeyboardEvent) => { if (e.key === 'Escape' && o.vollbildEl.classList.contains('smb-vollbild')) vollbild(false); });

  /* ---------- Tippen und Rechnen ---------- */
  interface Notiz { el: HTMLTextAreaElement; x: number; y: number; }
  let notizen: Notiz[] = [];
  let letzterBlattPunkt: { x: number; y: number } | null = null;

  function passeNotizAn(n: Notiz) {
    const zeilen = n.el.value.split('\n');
    n.el.style.width = Math.max(4, ...zeilen.map(z => z.length + 2)) + 'ch';
    n.el.rows = Math.max(1, zeilen.length);
  }
  function entferneNotiz(n: Notiz) { n.el.remove(); notizen = notizen.filter(x => x !== n); }
  function entferneNotizen() { notizen.forEach(n => n.el.remove()); notizen = []; }

  function neueNotiz(x: number, y: number, start = '') {
    const el = document.createElement('textarea');
    el.className = 'notiz'; el.spellcheck = false; el.rows = 1; el.value = start;
    el.setAttribute('aria-label', 'Notiz auf dem Schmierblatt');
    el.style.color = color.startsWith('--') ? `var(${color})` : color;
    textlage.appendChild(el);
    const n: Notiz = { el, x, y }; notizen.push(n);
    el.style.left = x + 'px'; el.style.top = y + 'px';
    passeNotizAn(n);
    el.addEventListener('input', () => passeNotizAn(n));
    el.addEventListener('keydown', (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === 'Escape') { el.blur(); return; }
      if (e.key === 'Backspace' && !el.value) { e.preventDefault(); entferneNotiz(n); return; }
      if (e.key === '=' || (e.key === 'Enter' && /=\s*$/.test(el.value.slice(0, el.selectionStart)))) {
        const vorne = el.value.slice(0, el.selectionStart), zeile = vorne.slice(vorne.lastIndexOf('\n') + 1);
        const ohneGleich = e.key === '=' ? zeile : zeile.replace(/=\s*$/, '');
        const teil = ohneGleich.slice(ohneGleich.lastIndexOf('=') + 1).replace(/^.*[A-Za-zÄÖÜäöüß][^:]*:\s*/, '');
        const m = /[\d.,+\-−–×xX·*/÷:()%²³π\s]+$/.exec(teil);
        const v = m ? rechne(m[0]) : null;
        if (v === null) return;
        e.preventDefault();
        const ergebnis = v.toLocaleString('de-DE', { maximumFractionDigits: 4 });
        const einfuegen = (e.key === '=' ? (/\s$/.test(zeile) ? '' : ' ') + '= ' : ' ') + ergebnis + (e.key === 'Enter' ? '\n' : '');
        el.setRangeText(einfuegen, el.selectionStart, el.selectionEnd, 'end');
        passeNotizAn(n);
      }
    });
    el.addEventListener('blur', () => { if (!el.value.trim()) entferneNotiz(n); });
    el.addEventListener('pointerdown', (e: PointerEvent) => e.stopPropagation());
    const fokus = () => { if (document.activeElement !== el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } };
    fokus(); setTimeout(fokus);
    return n;
  }

  // Einfach lostippen: druckbare Taste, kein Eingabefeld aktiv → Textfeld an der letzten Mausposition
  an(document, 'keydown', (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1 || e.key === ' ') return;
    const aktiv = document.activeElement as HTMLElement | null;
    if (aktiv && (aktiv.tagName === 'INPUT' || aktiv.tagName === 'TEXTAREA' || aktiv.tagName === 'SELECT' || aktiv.isContentEditable)) return;
    if (!wrap.isConnected || (!wrap.offsetParent && !o.vollbildEl.classList.contains('smb-vollbild'))) return;
    if (wrap.closest('.ion-page-hidden')) return;
    const r = wrap.getBoundingClientRect(); if (!r.width) return;
    e.preventDefault();
    setTool('text');
    const p = letzterBlattPunkt ?? { x: (24 - view.tx) / view.s, y: (r.height * 0.45 - view.ty) / view.s };
    neueNotiz(p.x, p.y, e.key);
    letzterBlattPunkt = { x: p.x, y: p.y + 34 };
  });

  function leeren() { strokes = []; cur = null; entferneKarten(); entferneNotizen(); redraw(); }

  return {
    leeren,
    karte: neueKarte,
    ueberFlaeche(cx: number, cy: number) {
      const r = wrap.getBoundingClientRect();
      return cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom;
    },
    vollbild,
    zerstoeren() { ro.disconnect(); mo.disconnect(); weg.forEach(f => f()); },
  };
}

/** Rechnet einen Ausdruck wie „(3,4 + 5,2) / 2 × 0,5“ (Komma = Dezimal, Punkt = Tausender; π, ², ³ erlaubt). */
export function rechne(ausdruck: string): number | null {
  let s = ausdruck
    .replace(/[×xX·*]/g, '*').replace(/[÷:]/g, '/').replace(/[−–]/g, '-')
    .replace(/(\d)\.(?=\d{3}(?!\d))/g, '$1')
    .replace(/,/g, '.').replace(/\s+/g, '')
    .replace(/π/g, '(' + Math.PI + ')').replace(/²/g, '^2').replace(/³/g, '^3');
  if (!s || !/\d/.test(s) || !/^[\d.+\-*/()%^]+$/.test(s)) return null;
  let i = 0;
  const zahl = (): number => {
    if (s[i] === '(') { i++; const v = summe(); if (s[i] !== ')') throw 0; i++; return nach(v); }
    if (s[i] === '-') { i++; return -zahl(); }
    if (s[i] === '+') { i++; return zahl(); }
    const m = /^\d+(\.\d+)?|^\.\d+/.exec(s.slice(i)); if (!m) throw 0;
    i += m[0].length; return nach(parseFloat(m[0]));
  };
  const nach = (v: number) => {
    for (;;) {
      if (s[i] === '%') { i++; v /= 100; continue; }
      if (s[i] === '^') { i++; const m = /^\d+/.exec(s.slice(i)); if (!m) throw 0; i += m[0].length; v = Math.pow(v, +m[0]); continue; }
      return v;
    }
  };
  const produkt = (): number => {
    let v = zahl();
    for (;;) {
      if (s[i] === '*' || s[i] === '/') { const op = s[i++]; const w = zahl(); v = op === '*' ? v * w : v / w; continue; }
      if (s[i] === '(') { v *= zahl(); continue; }              // 2(3+4) bzw. 2π
      return v;
    }
  };
  const summe = (): number => { let v = produkt(); while (s[i] === '+' || s[i] === '-') { const op = s[i++]; const w = produkt(); v = op === '+' ? v + w : v - w; } return v; };
  try { const v = summe(); return i === s.length && isFinite(v) ? v : null; } catch { return null; }
}
