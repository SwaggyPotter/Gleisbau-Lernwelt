/**
 * Gleisbau Tycoon -- Minispiel "Gleis vermessen": Spurweiten- und Ueberhoehungsmessung mit einem (gezeichneten)
 * Gleismessgeraet im Gleisquerschnitt. Spurweite: Geraet setzt auf, Messkopf faehrt an die Fahrkante (14 mm unter
 * Schienenoberkante), Wert im Ablesefenster ablesen. Ueberhoehung: Drehknopf stellen, bis die Libelle einspielt,
 * dann ablesen. Alles selbst gezeichnet.
 */

import { spiele } from './tycoon-ton';

export interface VermessungErgebnis { richtig: number; gesamt: number }
type Art = 'spur' | 'ueb';
interface Runde { art: Art; wert: number; mitte: number }

const NENN = 1435;
/** Toleranz beim Ablesen (mm). */
const TOL: Record<Art, number> = { spur: 1, ueb: 2 };
/** Ueberhoehung im Bild uebertrieben, damit die Schraeglage zu sehen ist. */
const UEB_BILD = 3;

const ease = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t));

export function starteVermessung(el: HTMLElement, o: { runden: number; onEnde: (e: VermessungErgebnis) => void }): () => void {
  const runden: Runde[] = Array.from({ length: o.runden }, (_, i) => {
    // Mindestens eine Ueberhoehung je Spiel; Spurweite meist etwas zu weit (Verschleiss), selten zu eng.
    const art: Art = i === o.runden - 1 || Math.random() < 0.35 ? 'ueb' : 'spur';
    const wert = art === 'spur' ? NENN + (Math.random() < 0.15 ? -Math.ceil(Math.random() * 3) : Math.round(Math.random() * 24)) : Math.round(10 + Math.random() * 150);
    return { art, wert, mitte: wert + Math.round((Math.random() * 2 - 1) * 6) };
  });
  el.innerHTML = '<canvas class="vm-cv"></canvas><div class="vm-text"></div><div class="vm-steuer"></div><div class="vm-lesen"></div><div class="vm-fb"></div>';
  const cv = el.querySelector('.vm-cv') as HTMLCanvasElement, txt = el.querySelector('.vm-text') as HTMLElement;
  const steuer = el.querySelector('.vm-steuer') as HTMLElement, lesen = el.querySelector('.vm-lesen') as HTMLElement, fb = el.querySelector('.vm-fb') as HTMLElement;
  const W = cv.clientWidth || el.clientWidth || 400, H = 250, dpr = window.devicePixelRatio || 1;
  cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + 'px';
  const g = cv.getContext('2d')!;
  let ri = 0, richtig = 0, phase = 'senken', t0 = performance.now(), stell = 0, aktiv = true, raf = 0;
  const r = () => runden[ri];

  const neueRunde = () => {
    phase = 'senken'; t0 = performance.now(); stell = 0;
    fb.innerHTML = ''; lesen.innerHTML = ''; steuer.innerHTML = '';
    txt.innerHTML = '<b>Messung ' + (ri + 1) + ' / ' + runden.length + ': ' + (r().art === 'spur' ? 'Spurweite' : 'Überhöhung') + '</b> · ' +
      (r().art === 'spur' ? 'Das Messgerät wird aufgesetzt, der Messkopf fährt an die Fahrkante.' : 'Gleis im Bogen: die äußere Schiene liegt höher.');
  };
  const zeigeLesen = () => {
    phase = 'lupe'; t0 = performance.now();
    steuer.innerHTML = '';
    txt.innerHTML = '<b>Ablesen:</b> ' + (r().art === 'spur' ? 'Welche Spurweite zeigt das Ablesefenster (in mm, z. B. 1437)?' : 'Welche Überhöhung zeigt das Ablesefenster (in mm)?');
    lesen.innerHTML = '<div class="readrow"><input class="vm-ein" type="text" inputmode="numeric" autocomplete="off" placeholder="mm"><button type="button" class="vm-ok">Ablesen</button></div>';
    (lesen.querySelector('.vm-ein') as HTMLInputElement).focus();
  };
  const pruefe = () => {
    const ein = lesen.querySelector('.vm-ein') as HTMLInputElement | null;
    if (!ein || phase !== 'ablesen' && phase !== 'lupe') return;
    const v = parseInt(ein.value.replace(/\D/g, ''), 10);
    if (isNaN(v)) return;
    const R = r(), ab = Math.abs(v - R.wert), gut = ab <= TOL[R.art];
    if (gut) richtig++;
    spiele(gut ? 'erfolg' : 'fehler');
    phase = 'fertig';
    lesen.innerHTML = '';
    const erkl = R.art === 'spur'
      ? 'Spurweite ' + R.wert + ' mm = Nennmaß 1435 mm ' + (R.wert >= NENN ? '+ ' : '− ') + Math.abs(R.wert - NENN) + ' mm' + (R.wert > NENN + 10 ? ' (deutliche Spurerweiterung)' : R.wert < NENN ? ' (Spurverengung)' : '') +
        '. Gemessen wird zwischen den Fahrkanten, 14 mm unter Schienenoberkante.'
      : 'Überhöhung ' + R.wert + ' mm: so viel liegt die bogenäußere Schiene höher als die innere. Die Libelle zeigt, wann das Messgerät waagerecht ausgeglichen ist.';
    fb.innerHTML = '<div class="fb ' + (gut ? 'good' : 'bad') + '"><b>' + (gut ? 'Richtig abgelesen!' : 'Daneben – richtig war ' + R.wert + ' mm.') + '</b><br>' + erkl + '</div>' +
      '<div class="opts"><button type="button" class="vm-weiter">' + (ri < runden.length - 1 ? 'Nächste Messung' : 'Fertig') + '</button></div>';
  };
  const weiter = () => {
    if (ri < runden.length - 1) { ri++; neueRunde(); return; }
    aktiv = false;
    o.onEnde({ richtig, gesamt: runden.length });
  };
  const klick = (e: Event) => {
    const b = (e.target as HTMLElement).closest('button') as HTMLButtonElement | null;
    if (!b) return;
    if (b.classList.contains('vm-ok')) pruefe();
    else if (b.classList.contains('vm-weiter')) weiter();
    else if (b.dataset['d'] && phase === 'libelle') {
      stell = Math.max(0, Math.min(200, stell + +b.dataset['d']));
      spiele('klick');
      if (stell === r().wert) { spiele('signal'); phase = 'eingespielt'; t0 = performance.now(); steuer.innerHTML = ''; txt.innerHTML = '<b>Libelle spielt ein!</b> Das Gerät steht waagerecht – gleich ablesen.'; }
    }
  };
  const taste = (e: KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); if (phase === 'fertig') weiter(); else pruefe(); } };
  el.addEventListener('click', klick);
  el.addEventListener('keydown', taste);

  /* ---- Zeichnen ---- */
  const schiene = (x: number, y: number, links: boolean) => {
    // Profil: Kopf, Steg, Fuss; x = Fahrkante (innen), y = Schienenoberkante.
    const kx = links ? x - 16 : x;
    g.fillStyle = '#5b6066';
    g.fillRect(kx, y, 16, 9);
    g.fillRect(kx + 5.5, y + 9, 5, 14);
    g.fillRect(kx - 5, y + 23, 26, 5);
    g.fillStyle = '#c9ced3'; g.fillRect(kx, y, 16, 2.5);
  };
  const zeichne = (now: number) => {
    const R = r(), dt = (now - t0) / 1000;
    if (phase === 'senken' && dt > 1.1) { phase = R.art === 'spur' ? 'messen' : 'libelle'; t0 = now; if (R.art === 'ueb') zeigeSteuer(); }
    else if (phase === 'messen' && dt > 0.8) zeigeLesen();
    else if (phase === 'eingespielt' && dt > 0.7) zeigeLesen();
    else if (phase === 'lupe' && dt > 0.45) phase = 'ablesen';
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Himmel, Boden
    const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#dfeaf2'); sky.addColorStop(1, '#f4f1ea');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    const cx = W * 0.4, gp = Math.min(W * 0.52, 300), basis = H * 0.62;
    const ueb = R.art === 'ueb' ? R.wert : 0, ang = -Math.atan(ueb * UEB_BILD / 1500);
    g.save();
    g.translate(cx - gp / 2, basis); g.rotate(ang); g.translate(-(cx - gp / 2), -basis);
    // Schotter und Schwelle
    g.fillStyle = '#9a958c';
    g.beginPath(); g.moveTo(cx - gp / 2 - 110, basis + 70); g.lineTo(cx - gp / 2 - 60, basis + 24); g.lineTo(cx + gp / 2 + 60, basis + 24); g.lineTo(cx + gp / 2 + 110, basis + 70); g.closePath(); g.fill();
    g.fillStyle = '#b8b2a6'; g.fillRect(cx - gp / 2 - 55, basis + 10, gp + 110, 16);
    g.strokeStyle = '#8a857b'; g.strokeRect(cx - gp / 2 - 55, basis + 10, gp + 110, 16);
    const yo = basis - 18;
    schiene(cx - gp / 2, yo, true); schiene(cx + gp / 2, yo, false);
    // Messgeraet: senkt sich ab, sitzt dann auf den Schienenkoepfen.
    const ab = phase === 'senken' ? (1 - ease(dt / 1.1)) * 90 : 0, by = yo - 10 - ab;
    g.fillStyle = '#f2b705'; g.strokeStyle = '#7a5c00'; g.lineWidth = 1.2;
    g.fillRect(cx - gp / 2 - 22, by - 6, gp + 44, 10); g.strokeRect(cx - gp / 2 - 22, by - 6, gp + 44, 10);
    // Griffe
    g.fillStyle = '#23262b'; g.fillRect(cx - gp / 2 + 10, by - 18, 30, 8); g.fillRect(cx + gp / 2 - 40, by - 18, 30, 8);
    // Fester Anschlag links an der Fahrkante, beweglicher Messkopf rechts.
    g.fillStyle = '#3a3f45';
    g.fillRect(cx - gp / 2 - 2, by + 4, 5, 15);
    const kopf = R.art === 'spur' ? (phase === 'senken' ? -14 : phase === 'messen' ? -14 + 14 * ease(dt / 0.8) : 0) : 0;
    g.fillRect(cx + gp / 2 - 3 + kopf, by + 4, 5, 15);
    // Mittelgehaeuse mit Libelle
    const mx = cx - 34;
    // Libellenarm dreht sich mit dem Drehknopf; spielt die Libelle ein, steht er waagerecht.
    g.save();
    if (R.art === 'ueb') { g.translate(cx, by - 5); g.rotate(Math.atan(stell * UEB_BILD / 1500)); g.translate(-cx, -(by - 5)); }
    g.fillStyle = '#e8e4da'; g.fillRect(mx, by - 16, 68, 22); g.strokeStyle = '#5b5b5b'; g.strokeRect(mx, by - 16, 68, 22);
    g.fillStyle = '#d9f0c9'; g.fillRect(mx + 8, by - 11, 52, 11); g.strokeStyle = '#5b7a46'; g.strokeRect(mx + 8, by - 11, 52, 11);
    g.strokeStyle = '#2f3b26'; g.beginPath(); g.moveTo(mx + 28, by - 11); g.lineTo(mx + 28, by); g.moveTo(mx + 40, by - 11); g.lineTo(mx + 40, by); g.stroke();
    const aus = R.art === 'ueb' && phase !== 'senken' ? Math.max(-20, Math.min(20, (R.wert - stell) * 0.5)) : R.art === 'ueb' ? 20 : 0;
    g.fillStyle = Math.abs(aus) < 0.6 ? 'rgba(46,160,67,.9)' : 'rgba(255,255,255,.95)';
    g.beginPath(); g.ellipse(mx + 34 + aus, by - 5.5, 6, 3.6, 0, 0, 7); g.fill(); g.strokeStyle = '#4b5d3f'; g.stroke();
    g.restore();
    g.restore();
    // Bemassung Spurweite (14 mm unter SO)
    if (R.art === 'spur' && phase !== 'senken') {
      const y = yo + 6;
      g.strokeStyle = 'rgba(192,57,43,.8)'; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(cx - gp / 2, y); g.lineTo(cx + gp / 2, y); g.stroke(); g.setLineDash([]);
      g.fillStyle = '#c0392b'; g.font = '600 11px system-ui'; g.textAlign = 'center'; g.fillText('Spurweite (14 mm unter SO)', cx, y + 34);
    }
    if (R.art === 'ueb' && phase !== 'senken') {
      // Hoehenunterschied rechts markieren
      g.fillStyle = '#1f5f8b'; g.font = '600 11px system-ui'; g.textAlign = 'left';
      g.fillText('äußere Schiene höher', cx + gp / 2 + 24, basis - 60 - ueb * 0.3);
    }
    // Ablesefenster (Lupe)
    if (phase === 'lupe' || phase === 'ablesen' || phase === 'fertig') {
      const a = phase === 'lupe' ? ease(dt / 0.45) : 1, lw = Math.min(230, W * 0.5), lh = 70, lx = W - lw - 10, ly = 10;
      g.globalAlpha = a;
      g.fillStyle = '#fffdf6'; g.strokeStyle = '#23262b'; g.lineWidth = 2;
      g.beginPath(); g.roundRect(lx, ly, lw, lh, 10); g.fill(); g.stroke();
      const proMm = (lw - 20) / 24, mitte = R.mitte, x0 = lx + lw / 2;
      g.save(); g.beginPath(); g.rect(lx + 4, ly + 4, lw - 8, lh - 8); g.clip();
      g.strokeStyle = '#23262b'; g.fillStyle = '#23262b'; g.lineWidth = 1; g.font = '600 11px system-ui'; g.textAlign = 'center';
      for (let v = mitte - 14; v <= mitte + 14; v++) {
        const x = x0 + (v - mitte) * proMm, lang = v % 10 === 0 ? 20 : v % 5 === 0 ? 13 : 7;
        g.beginPath(); g.moveTo(x, ly + lh - 8); g.lineTo(x, ly + lh - 8 - lang); g.stroke();
        if (v % 10 === 0 && x - 15 > lx + 4 && x + 15 < lx + lw - 4) g.fillText(String(v), x, ly + 16);
      }
      const px = x0 + (R.wert - mitte) * proMm;
      g.strokeStyle = '#e8281e'; g.lineWidth = 2; g.beginPath(); g.moveTo(px, ly + 22); g.lineTo(px, ly + lh - 6); g.stroke();
      g.fillStyle = '#e8281e'; g.beginPath(); g.moveTo(px - 5, ly + 20); g.lineTo(px + 5, ly + 20); g.lineTo(px, ly + 27); g.fill();
      g.restore();
      g.fillStyle = '#5a5f66'; g.font = '10px system-ui'; g.textAlign = 'left'; g.fillText(R.art === 'spur' ? 'Spurweite mm' : 'Überhöhung mm', lx + 8, ly + lh + 12);
      g.globalAlpha = 1;
    }
    if (aktiv) raf = requestAnimationFrame(zeichne);
  };
  const zeigeSteuer = () => {
    txt.innerHTML = '<b>Drehknopf stellen,</b> bis die Blase der Libelle genau zwischen den Strichen steht (grün).';
    steuer.innerHTML = '<div class="btns">' + [-10, -1, 1, 10].map((d) => '<button type="button" class="sm" data-d="' + d + '">' + (d < 0 ? '◀ ' : '▶ ') + (d > 0 ? '+' : '−') + Math.abs(d) + ' mm</button>').join('') + '</div>';
  };
  neueRunde();
  raf = requestAnimationFrame(zeichne);
  return () => { aktiv = false; cancelAnimationFrame(raf); el.removeEventListener('click', klick); el.removeEventListener('keydown', taste); };
}
