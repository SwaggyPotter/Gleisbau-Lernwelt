/**
 * Gleisbau Tycoon -- Lernen im Spiel: taegliche Aufgabe (3 Fachfragen je Kalendertag, Serie), Fehlerbilder-Memory
 * und Zwischenpruefung. Die Fragen kommen aus dem Themenquiz der Lernwelt (assets/themenquiz), die Engine
 * (tycoon-engine.ts) stellt sie mit ihrem Quiz-Fenster. Minispiele Vermessen/Stellwerk: tycoon-vermessung.ts, tycoon-stellwerk.ts.
 */

import { spiele } from './tycoon-ton';

/** Kalendertag in deutscher Zeit als "JJJJ-MM-TT" (die taegliche Aufgabe wechselt um Mitternacht). */
export const tagHeute = (d = new Date()): string => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(d);
/** Tage zwischen zwei Kalendertagen (b - a). */
export const tageZwischen = (a: string, b: string): number => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);

/** Themen der taeglichen Aufgabe (Id im Themenquiz, Anzeigename); welches dran ist, haengt vom Datum ab. */
export const TAGES_THEMEN: [string, string][] = [
  ['schiene', 'Schiene'], ['schwellen', 'Schwellen'], ['bettung', 'Bettung'], ['spurweite', 'Spurweite'], ['kleineisen', 'Kleineisen'],
  ['messmittel', 'Messmittel'], ['handwerkzeuge', 'Handwerkzeuge'], ['kleingeraete', 'Kleingeräte'], ['arbeitssicherheit', 'Arbeitssicherheit'],
  ['grundlagen', 'Grundlagen'], ['lf13', 'Weichen'], ['lf10', 'Gleisbau'], ['trassenplan', 'Trassenplan'],
];
export const tagesThema = (tag: string): [string, string] => {
  let h = 7;
  for (const c of tag) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TAGES_THEMEN[h % TAGES_THEMEN.length];
};
export const TAGES_FRAGEN = 3, TAGES_NEED = 2;
/** Belohnung fuer Tag n der Serie: steigt bis Tag 10; jeder 7. Tag am Stueck gibt zusaetzlich einen Pokal. */
export const tagesLohn = (serie: number) => ({ geld: 300 + 150 * Math.min(serie, 10), xp: 10 + 2 * Math.min(serie, 10), pokal: serie > 0 && serie % 7 === 0 ? 1 : 0 });

/** Zwischenpruefung: Fragen quer durch die Themen. */
export const PRUEFUNG = { fragen: 10, need: 7, lohn: 5000, xp: 80, pause: 600 };
export const PRUEFUNG_THEMEN = ['schiene', 'schwellen', 'bettung', 'spurweite', 'kleineisen', 'messmittel', 'arbeitssicherheit', 'grundlagen', 'lf13', 'lf10'];

/* ---------- Fehlerbilder-Memory ---------- */

export interface MemoryBild { name: string; bild: string; credit?: string; quelle?: string }
export interface MemoryErgebnis { zuege: number; paare: number }

/**
 * Memory im Element el: zu jedem Bild die Karte mit dem passenden Namen finden. Karten drehen sich per CSS
 * (Klassen .mem-karte/.offen/.weg in tycoon.page.scss). Liefert eine Stopp-Funktion.
 */
export function starteMemory(el: HTMLElement, bilder: MemoryBild[], onEnde: (e: MemoryErgebnis) => void): () => void {
  const karten = bilder.flatMap((b, i) => [{ paar: i, bild: true, b }, { paar: i, bild: false, b }]);
  for (let i = karten.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [karten[i], karten[j]] = [karten[j], karten[i]]; }
  el.innerHTML = '<div class="mem-kopf"><span id="memZuege">0 Züge</span><span id="memPaare">0 / ' + bilder.length + ' Paare</span></div><div class="mem-feld">' +
    karten.map((k, i) => '<button type="button" class="mem-karte" data-i="' + i + '"><span class="mem-innen"><span class="mem-rueck">?</span><span class="mem-vorn">' +
      (k.bild ? '<img src="' + k.b.bild + '" alt="">' : '<b>' + k.b.name + '</b>') + '</span></span></button>').join('') + '</div>';
  const knopf = (i: number) => el.querySelector('.mem-karte[data-i="' + i + '"]') as HTMLElement;
  let offen: number[] = [], zuege = 0, paare = 0, sperre = false, aktiv = true;
  let t: any = 0;
  const klick = (e: Event) => {
    const b = (e.target as HTMLElement).closest('.mem-karte') as HTMLElement | null;
    if (!b || !aktiv || sperre) return;
    const i = +b.dataset['i']!;
    if (offen.includes(i) || b.classList.contains('weg')) return;
    b.classList.add('offen'); offen.push(i);
    if (offen.length < 2) return;
    zuege++;
    const [a, c] = offen;
    (el.querySelector('#memZuege') as HTMLElement).textContent = zuege + ' Züge';
    if (karten[a].paar === karten[c].paar) {
      paare++; offen = []; spiele('erfolg');
      t = setTimeout(() => { knopf(a).classList.add('weg'); knopf(c).classList.add('weg'); }, 350);
      (el.querySelector('#memPaare') as HTMLElement).textContent = paare + ' / ' + bilder.length + ' Paare';
      if (paare === bilder.length) { aktiv = false; t = setTimeout(() => onEnde({ zuege, paare }), 900); }
    } else {
      sperre = true;
      t = setTimeout(() => { knopf(a).classList.remove('offen'); knopf(c).classList.remove('offen'); offen = []; sperre = false; }, 950);
    }
  };
  el.addEventListener('click', klick);
  return () => { aktiv = false; clearTimeout(t); el.removeEventListener('click', klick); };
}
/** Lohn fuers Memory: voll bei hoechstens 1,5 Zuegen je Paar, dann weniger (mind. ein Viertel). */
export const memoryLohn = (e: MemoryErgebnis, paare: number) => Math.max(0.25, Math.min(1, (paare * 2.5 - e.zuege) / (paare * 1)));
export const MEMORY = { paare: 6, lohnJePaar: 250, pause: 120 };
