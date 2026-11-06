/* eslint-disable */
import { API_BASE_URL } from '../../../../core/api-config';
import { meldungZwischenspeichern } from '../../../../services/question-report.service';
/**
 * PROTOTYP – Schotterberechnung für die Gleisbau-Lernwelt (Tablet, Querformat)
 * Übernommen aus Tims schotterberechnung.html (2026-11-05). Inhaltlich unverändert,
 * nur auf das Seiten-Element `root` begrenzt (statt document) und mit Aufräumfunktion.
 *
 * Aufbau
 * - Links:  Textaufgabe, Whiteboard (Stift/Radierer/Farben), Ergebnisfelder
 * - Rechts: Lehrtabellen (aus Schwellenmaßen berechnet), blätterbar (Pfeile, Punkte, Wischen)
 *
 * Tabellen werden zur Laufzeit aus SCHWELLEN (Maße) + ANNAHMEN berechnet.
 * -> weitere Teilung/Gleisanzahl: Eintrag in ANNAHMEN.tabellen ergänzen, z. B. {teilung:65, gleise:1}
 * -> weitere Schwellenart: Objekt in SCHWELLEN ergänzen (L, e, V, s, Masken m30/m35)
 * Aufgabengenerator, Blättern und Lösungsweg greifen automatisch auf alle Tabellen zu.
 * Die Werte sind eigene Näherungen (Regelwerte: v>160 → 0,50 m vor Kopf, v>230 → 0,35 m Bettung).
 *
 * PARAMETER – Lehrtabellen werden aus Schwellenmaßen BERECHNET
 * Modell (Querschnitt je km, Schotterbett bis Schwellenoberkante):
 *   H      = Bettungsdicke d + e          (e = Höhe der Schwelle im Schotter, geschätzt)
 *   Wt     = Schwellenlänge L + 2 · Einschotterung b
 *   Wb     = Wt + 2 · Böschungsanlauf s · H   (s = 1,5 → Böschung 1 : 1,5)
 *   Brutto = (Wt + Wb) / 2 · H · 1000                 [m³/km]
 *   Netto  = Brutto − V · n,  n = 1000 / Schwellenteilung [Schwellen/km]  (V = Schwellenvolumen)
 *   2-gleisig: Brutto + Gleisabstand · H · 1000 und − 2 · V · n
 *   Überhöhung u = 160: Zuschlag UZUSCHLAG je Gleis; Ergebnis auf 5 m³/km aufgerundet.
 * Maske je Zeile: x = Zahl, - = „---“ (nicht vorgesehen), _ = Zelle leer (wie in der Vorlage)
 * Spalten: [0,30 u=0 | 0,30 u=160 | 0,40 u=0 | 0,40 u=160 | 0,50 u=0 | 0,50 u=160]
 */

interface SchwelleDef { name: string; label: string; L: number; e: number; V: number; s: number; m30: string; m35: string; }

const SCHWELLEN: SchwelleDef[] = [
  { name:'Holz Gr. 1', label:'Holz Gr. 1', L:2.60, e:0.205, V:0.115, s:1.5, m30:'--xxxx', m35:'------' },
  { name:'Holz Gr. 2', label:'Holz Gr. 2', L:2.60, e:0.200, V:0.125, s:1.5, m30:'--xxxx', m35:'-----_' },
  { name:'Holz Gr. 4', label:'Holz Gr. 4', L:2.60, e:0.195, V:0.125, s:1.5, m30:'--xxxx', m35:'-----_' },
  { name:'Holz Gr. 5', label:'Holz Gr. 5', L:2.60, e:0.185, V:0.120, s:1.5, m30:'--xxxx', m35:'----_-' },
  { name:'Beton B 58', label:'Beton B 58', L:2.50, e:0.235, V:0.135, s:1.5, m30:'--xxxx', m35:'------' },
  { name:'Beton B 70 2,40 m', label:'Beton B 70<br>2,40 m', L:2.40, e:0.260, V:0.115, s:1.5, m30:'--xxxx', m35:'--__xx' },
  { name:'Beton B 70 2,60 m', label:'Beton B 70<br>2,60 m', L:2.60, e:0.265, V:0.140, s:1.5, m30:'--xxxx', m35:'----xx' },
  { name:'Beton B 75', label:'Beton B 75', L:2.60, e:0.305, V:0.180, s:1.5, m30:'--xxxx', m35:'----xx' },
  { name:'Beton B 90', label:'Beton B 90', L:2.60, e:0.265, V:0.160, s:1.5, m30:'--xxxx', m35:'----xx' },
  { name:'Beton B 93', label:'Beton B 93', L:2.60, e:0.240, V:0.160, s:1.5, m30:'__xxxx', m35:'__--xx' },
  { name:'Stahl-Trogschwellen', label:'Stahl-Trogschwellen', L:2.60, e:0.055, V:0.040, s:1.5, m30:'--xxxx', m35:'------' },
  { name:'Stahl-Y-Schwellen (Auflagerabstand 0,60 m)', label:'Stahl-Y-Schwellen<br>Auflagerabstand = 0,60 m', L:2.60, e:0.140, V:0.105, s:0.84, m30:'xxxxxx', m35:'----xx' },
  { name:'Stahl-Y-Schwellen (Auflagerabstand 0,65 m)', label:'Stahl-Y-Schwellen<br>Auflagerabstand = 0,65 m', L:2.60, e:0.140, V:0.100, s:0.82, m30:'xxxxxx', m35:'----xx' },
];

/* Gewicht je Schwelle in kg (für die Schwellenwagen). Beton/Y-Stahl nach BSI-Schwellenbroschüre
   bzw. DB-Zeichnungsverzeichnis (Recherche 2026-11-04); Holz und Stahltrog sind Übungswerte (geschätzt). */
const GEWICHT_KG: Record<string, number> = {
  'Holz Gr. 1': 100, 'Holz Gr. 2': 95, 'Holz Gr. 4': 90, 'Holz Gr. 5': 85,
  'Beton B 58': 249, 'Beton B 70 2,40 m': 284, 'Beton B 70 2,60 m': 304, 'Beton B 75': 450,
  'Beton B 90': 355, 'Beton B 93': 378, 'Stahl-Trogschwellen': 75,
  'Stahl-Y-Schwellen (Auflagerabstand 0,60 m)': 135, 'Stahl-Y-Schwellen (Auflagerabstand 0,65 m)': 135,
};

/* Annahmen – hier zentral ändern */
const ANNAHMEN = {
  gleisabstand: 4.00,      // m, Gleismittenabstand bei 2-gleisigen Tabellen
  uZuschlag: 5,            // m³/km je Gleis bei u = 160 mm (geschätzt)
  nutzlastWagen: [40, 50, 55, 60],      // t je Schotterwagen (Vorgabe in der Aufgabe)
  schwellenwagenNutzlast: [40, 45, 50, 55, 60],   // t je Schwellenwagen (Vorgabe in der Aufgabe)
  // Schüttdichte, mit der laut Aufgabe gerechnet wird (mal unverdichtet, mal verdichtet)
  dichten: [ {wert:1.5, art:'unverdichtet'}, {wert:1.7, art:'verdichtet'} ],
  // Altschwellen, die beim Umbau ausgebaut werden (ältere Bauarten)
  altschwellen: ['Holz Gr. 1','Holz Gr. 2','Holz Gr. 4','Holz Gr. 5','Beton B 58','Beton B 70 2,40 m','Stahl-Trogschwellen'],
  verschmutzung: [35, 40, 45, 50, 55, 60, 65, 70],   // % Verschmutzungsgrad
  tabellen: [ {teilung:60,gleise:1}, {teilung:63,gleise:1}, {teilung:67,gleise:1},
              {teilung:60,gleise:2}, {teilung:63,gleise:2}, {teilung:67,gleise:2} ],
};
/* Regelwerte, die die Azubis anwenden sollen */
function regel(v: number) { return { breite: v>160 ? 0.50 : 0.40, dicke: v>230 ? 0.35 : 0.30 }; }

const fmt = (n: number, d = 2) => n.toLocaleString('de-DE', { maximumFractionDigits: d });
const rnd = <T,>(a: T[]): T => a[Math.floor(Math.random()*a.length)];
const ORTE = ['Rheinfeld','Bergstadt','Marktdorf','Neuwiese','Hohenau','Elbtal','Waldkirchen','Steinfurt','Auenheim','Seebrück'];

function schotterbedarf(sw: SchwelleDef, d: number, b: number, uIdx: number, teilung: number, gleise: number) {
  const H=d+sw.e, Wt=sw.L+2*b, Wb=Wt+2*sw.s*H, n=1000/(teilung/100);
  const brutto=(Wt+Wb)/2*H*1000 + (gleise===2 ? ANNAHMEN.gleisabstand*H*1000 : 0);
  const x = brutto - sw.V*n*gleise + (uIdx ? ANNAHMEN.uZuschlag*gleise : 0);
  return Math.ceil(x/5-1e-9)*5;
}
function baueTabelle(cfg: { teilung: number; gleise: number }) {
  const breiten=[0.30,0.40,0.50];
  const gruppen = SCHWELLEN.map(sw=>({
    name:sw.name, label:sw.label,
    zeilen:([[0.30,sw.m30],[0.35,sw.m35]] as [number,string][]).map(([d,mask])=>({
      dicke:d,
      w:[...mask].map((ch,ci)=> ch==='x' ? schotterbedarf(sw,d,breiten[ci>>1],ci&1,cfg.teilung,cfg.gleise) : (ch==='-' ? '---' : null)) as (number|string|null)[],
    })),
  }));
  return {
    id:`lehr-${cfg.gleise}gl-${cfg.teilung}`,
    seitenTitel:'Schottertabellen (Lehrtabelle)',
    titel:`Schotterbedarf bei ${cfg.gleise}-gleisigem Querschnitt mit einer Schwellenteilung von ${cfg.teilung} cm`,
    gleise:cfg.gleise, teilung:cfg.teilung, breiten, uWerte:[0,160], gruppen,
    fussnoten:[
      'Zwischen u = 0 mm und u = 160 mm darf geradlinig interpoliert werden.',
      'Mit welcher Schüttdichte gerechnet wird (unverdichtet oder verdichtet), steht in der Aufgabe.',
      ...(cfg.gleise===2 ? [`Werte gelten für beide Gleise zusammen (Gleismittenabstand ${fmt(ANNAHMEN.gleisabstand)} m).`] : []),
    ],
  };
}
type Tabelle = ReturnType<typeof baueTabelle>;
const SCHOTTER_TABELLEN: Tabelle[] = ANNAHMEN.tabellen.map(baueTabelle);

/** Startet die Seite im Element `root`; gibt eine Aufräumfunktion zurück. */
export function starteSchotterberechnung(root: HTMLElement): () => void {
  const $ = (s: string) => root.querySelector(s) as any;
  const $$ = (s: string) => Array.from(root.querySelectorAll(s)) as any[];
  const blaetter: HTMLElement[] = [];

  /* ===================== TABELLE rendern + blättern ===================== */
  let page = 0, busy = false;
  function tableHTML(t: Tabelle){
    let h = `<table class="schotter"><colgroup><col class="c-name"><col class="c-dicke"><col><col><col><col><col><col></colgroup><thead>`;
    h += `<tr><th rowspan="4">Schwellenart</th><th rowspan="4">Dicke<br>der<br>Bettung</th><th colspan="6">Breite der Einschotterung vor dem Schwellenkopf</th></tr>`;
    h += `<tr>${t.breiten.map(b=>`<th colspan="2">${fmt(b)} m</th>`).join('')}</tr>`;
    h += `<tr>${t.breiten.map(()=>t.uWerte.map(u=>`<th>u = ${u}</th>`).join('')).join('')}</tr>`;
    h += `<tr><th colspan="6">Schotterbedarf in m³ / km</th></tr></thead><tbody>`;
    t.gruppen.forEach((g,gi)=>{
      g.zeilen.forEach((z,zi)=>{
        h += `<tr data-g="${gi}">`;
        if(zi===0) h += `<td class="name" rowspan="${g.zeilen.length}">${g.label}</td>`;
        h += `<td class="dicke"><b>${fmt(z.dicke)} m</b></td>`;
        z.w.forEach((v,ci)=>{
          const isNum = typeof v === 'number';
          h += `<td class="${isNum?'num':''}" data-g="${gi}" data-z="${zi}" data-c="${ci}">${v===null?'':v}</td>`;
        });
        h += '</tr>';
      });
    });
    h += `</tbody></table>`;
    h += `<div class="footnote">${t.fussnoten.map(f=>`<div>${f}</div>`).join('')}</div>`;
    return h;
  }
  function setChrome(i: number){                      // Titel, Pfeile, Punkte
    const t = SCHOTTER_TABELLEN[i];
    $('#tableTitle').innerHTML = `<div>${t.seitenTitel}</div><div style="font-weight:600;font-size:.85em">${t.titel}</div>`;
    $('#prev').disabled = i===0;
    $('#next').disabled = i===SCHOTTER_TABELLEN.length-1;
    $('#dots').innerHTML = SCHOTTER_TABELLEN.map((_,k)=>`<button class="dot ${k===i?'active':''}" data-i="${k}" aria-label="Tabelle ${k+1}"></button>`).join('');
  }
  function renderTable(){
    $('#tableHost').innerHTML = tableHTML(SCHOTTER_TABELLEN[page]);
    setChrome(page);
    $('#tableScroll').scrollTop = 0;
  }

  /* ---------- Umblättern: Seite klappt um die linke Kante, beim Wischen folgt sie dem Finger ---------- */
  const ZU = -105;                                           // Winkel, bei dem das Blatt ganz umgeschlagen ist
  const T = (deg: number) => `perspective(1800px) rotateY(${deg}deg)`;
  const keineAnimation = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  let raf = 0;
  interface Zug { dir: 1|-1; ziel: number; vorher: number; scroll: number; leaf: HTMLElement; deg: number; }

  function makeLeaf(html: string, scrollTop: number){
    const el=$('#tableScroll'), r=el.getBoundingClientRect(), leaf=document.createElement('div');
    leaf.className='sbx blatt';                              // Tabellen-Styles + Design-Farben auch im Blatt
    leaf.style.cssText=`left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;`;
    leaf.innerHTML=`<div class="seite" style="margin-top:${-scrollTop}px;width:${el.clientWidth}px">${html}</div>`+
      `<div class="shade"></div><div class="glanz"></div>`;
    document.body.appendChild(leaf);
    blaetter.push(leaf);
    return leaf;
  }
  function setLeaf(z: Zug, deg: number){
    z.deg = deg;
    const p = deg/ZU;                                        // 0 = flach, 1 = umgeschlagen
    z.leaf.style.transform = T(deg);
    (z.leaf.querySelector('.shade') as HTMLElement).style.opacity = String(p);
    (z.leaf.querySelector('.glanz') as HTMLElement).style.opacity = String(Math.sin(p*Math.PI));
  }
  function beginne(ziel: number): Zug|null {
    if(busy||ziel===page||ziel<0||ziel>=SCHOTTER_TABELLEN.length) return null;
    busy=true;
    const el=$('#tableScroll'), dir: 1|-1 = ziel>page ? 1 : -1;
    const z: Zug = { dir, ziel, vorher: page, scroll: el.scrollTop, leaf: null as any, deg: 0 };
    if(dir===1){                               // vor: alte Seite liegt oben und klappt weg, neue liegt darunter
      z.leaf=makeLeaf($('#tableHost').innerHTML, el.scrollTop);
      page=ziel; renderTable(); setLeaf(z, 0);
    } else {                                   // zurück: vorherige Seite klappt von links wieder auf die aktuelle
      z.leaf=makeLeaf(tableHTML(SCHOTTER_TABELLEN[ziel]), 0);
      setChrome(ziel); setLeaf(z, ZU);
    }
    return z;
  }
  function beende(z: Zug, durch: boolean){
    const nach = z.dir===1 ? (durch ? ZU : 0) : (durch ? 0 : ZU);
    const von = z.deg, dauer = 140 + 560*Math.abs(nach-von)/Math.abs(ZU), t0 = performance.now();
    const fertig = ()=>{
      if(z.dir===1 && !durch){ page=z.vorher; renderTable(); $('#tableScroll').scrollTop=z.scroll; }
      if(z.dir===-1){ if(durch){ page=z.ziel; renderTable(); } else setChrome(page); }
      z.leaf.remove(); busy=false;
    };
    const schritt = (now: number)=>{
      const k=Math.min(1,(now-t0)/dauer), e=1-Math.pow(1-k,3);
      setLeaf(z, von+(nach-von)*e);
      if(k<1) raf=requestAnimationFrame(schritt); else fertig();
    };
    raf=requestAnimationFrame(schritt);
  }
  function goTo(i: number){
    if(busy||i===page||i<0||i>=SCHOTTER_TABELLEN.length) return;
    if(keineAnimation()){ page=i; renderTable(); return; }
    const z=beginne(i); if(z) beende(z, true);
  }
  $('#prev').onclick = ()=>goTo(page-1);
  $('#next').onclick = ()=>goTo(page+1);
  $('#dots').onclick = (e: any)=>{ const d=e.target.closest('.dot'); if(d) goTo(+d.dataset.i); };
  let gezogenAm = 0;                                 // Zeitpunkt des letzten Zeilen-Ziehens (Klick danach ignorieren)
  $('#tableHost').onclick = (e: any)=>{            // Zelle zum Mitlesen markieren
    if(performance.now()-gezogenAm < 400) return;
    const td = e.target.closest('td.num'); if(!td) return;
    const was = td.classList.contains('sel');
    $$('td.sel').forEach(x=>x.classList.remove('sel'));
    if(!was) td.classList.add('sel');
  };
  let ziehtZeile = false;                            // Zeile wird gerade per Gedrückthalten gezogen
  (function wischen(){                       // Wischen mit Finger/Stift: Blatt folgt der Bewegung
    const el = $('#tableScroll') as HTMLElement;
    let id: number|null=null, sx=0, sy=0, lx=0, lt=0, v=0, entschieden=false, z: Zug|null=null;
    const ende = (abbruch: boolean)=>{
      if(z){
        const w=el.getBoundingClientRect().width, dx=lx-sx;
        const p = z.dir===1 ? Math.max(0,-dx)/w : Math.max(0,dx)/w;
        const schnell = z.dir===1 ? v<-0.45 : v>0.45;
        beende(z, !abbruch && (p>0.33 || schnell));
      }
      id=null; z=null; entschieden=false;
    };
    el.addEventListener('pointerdown',(e: PointerEvent)=>{
      if(e.pointerType==='mouse'||id!==null||busy) return;
      id=e.pointerId; sx=lx=e.clientX; sy=e.clientY; lt=e.timeStamp; v=0; entschieden=false; z=null;
    });
    el.addEventListener('pointermove',(e: PointerEvent)=>{
      if(e.pointerId!==id) return;
      if(ziehtZeile && !z){ id=null; return; }
      const dx=e.clientX-sx, dy=e.clientY-sy;
      if(!entschieden){
        if(Math.abs(dy)>14 && Math.abs(dy)>Math.abs(dx)){ id=null; return; }      // senkrecht: Tabelle scrollt
        if(Math.abs(dx)<12) return;
        entschieden=true;
        if(keineAnimation()){ id=null; goTo(page+(dx<0?1:-1)); return; }
        z=beginne(page+(dx<0?1:-1));
        if(!z){ id=null; return; }
        try{ el.setPointerCapture(e.pointerId); }catch{}
      }
      if(!z) return;
      const dt=Math.max(1,e.timeStamp-lt); v=0.7*v+0.3*((e.clientX-lx)/dt); lx=e.clientX; lt=e.timeStamp;
      const w=el.getBoundingClientRect().width;
      if(z.dir===1) setLeaf(z, ZU*Math.min(1,Math.max(0,-dx)/w));
      else setLeaf(z, ZU*(1-Math.min(1,Math.max(0,dx)/w)));
    });
    el.addEventListener('pointerup',(e: PointerEvent)=>{ if(e.pointerId===id){ lx=e.clientX; ende(false); } });
    el.addEventListener('pointercancel',(e: PointerEvent)=>{ if(e.pointerId===id) ende(true); });
  })();

  /* ============================ WHITEBOARD ============================ */
  // Stiftfarben: erste Farbe = Textfarbe des Designs (hell auf dunklen, dunkel auf hellen Skins),
  // dazu vier mittlere Töne, die auf beiden Hintergründen gut lesbar sind. Variablen werden
  // beim Zeichnen aufgelöst, so färben sich vorhandene Striche bei einem Designwechsel mit um.
  const FARBEN = ['--ink','#3b82f6','#ef4444','#22a55a','#f59e0b'];
  const farbCache = new Map<string,string>();
  const farbe = (c: string) => {
    if(!c.startsWith('--')) return c;
    if(!farbCache.has(c)) farbCache.set(c, getComputedStyle(root).getPropertyValue(c).trim() || '#888');
    return farbCache.get(c)!;
  };
  let tool='pen', color=FARBEN[0], strokes: any[]=[], cur: any=null;
  const cv = $('#board') as HTMLCanvasElement, ctx = cv.getContext('2d')!;
  const wrap = $('#canvasWrap') as HTMLElement, welt = $('#welt') as HTMLElement;
  // Textfelder liegen über der Malfläche (gleiche Ansicht wie #welt), damit man in sie tippen kann
  const textlage = document.createElement('div'); textlage.className='textlage'; wrap.appendChild(textlage);

  FARBEN.forEach((c,i)=>{
    const b=document.createElement('button');
    b.type='button';
    b.className='swatch'+(i===0?' active':''); b.style.background=c.startsWith('--') ? `var(${c})` : c; b.dataset['c']=c; b.setAttribute('aria-label','Farbe '+(i+1));
    $('#swatches').appendChild(b);
  });
  $('#swatches').onclick = (e: any)=>{
    const s=e.target.closest('.swatch'); if(!s) return;
    color=s.dataset.c; $$('.swatch').forEach(x=>x.classList.toggle('active',x===s));
    setTool('pen');
  };
  function setTool(t: string){ tool=t; $$('.tool').forEach(b=>b.classList.toggle('active',b.dataset.tool===t)); wrap.classList.toggle('textmodus', t==='text'); }
  $$('.tool').forEach(b=>b.onclick=()=>setTool(b.dataset.tool));

  /* ---------- Ansicht: Zoom + Verschieben (zwei Finger, Strg+Mausrad) ----------
     Striche und Karten liegen in „Blatt“-Koordinaten, die Ansicht ist  bild = blatt · s + t.
     Die Aufgabe liegt außerhalb dieser Ansicht und bleibt deshalb immer oben stehen. */
  const view = { s: 1, tx: 0, ty: 0 };
  const S_MIN = 0.4, S_MAX = 5;
  let kartenAnsicht: () => void = () => {};                 // wird unten gesetzt (Karten folgen der Ansicht)
  function wendeAnsichtAn(){
    const dpr=window.devicePixelRatio||1;
    ctx.setTransform(dpr*view.s,0,0,dpr*view.s,dpr*view.tx,dpr*view.ty);
    welt.style.transform = `translate(${view.tx}px,${view.ty}px) scale(${view.s})`;
    textlage.style.transform = welt.style.transform;
    kartenAnsicht();
    wrap.style.backgroundSize = `${28*view.s}px ${28*view.s}px`;
    wrap.style.backgroundPosition = `${view.tx}px ${view.ty}px`;
    $('#zoomWert').textContent = Math.round(view.s*100)+' %';
    redraw();
  }
  function zoomeUm(bx: number, by: number, sNeu: number){       // bx/by: Bildpunkt, der fest bleibt
    sNeu = Math.min(S_MAX, Math.max(S_MIN, sNeu));
    const wx=(bx-view.tx)/view.s, wy=(by-view.ty)/view.s;
    view.s=sNeu; view.tx=bx-wx*sNeu; view.ty=by-wy*sNeu;
    wendeAnsichtAn();
  }
  $('#zoomReset').onclick = ()=>{ view.s=1; view.tx=0; view.ty=0; wendeAnsichtAn(); };

  function sizeCanvas(){
    const r=cv.getBoundingClientRect(), dpr=window.devicePixelRatio||1;
    cv.width=Math.max(1,Math.round(r.width*dpr)); cv.height=Math.max(1,Math.round(r.height*dpr));
    wendeAnsichtAn();
  }
  function drawStroke(s: any){
    ctx.save();
    ctx.globalCompositeOperation = s.tool==='eraser' ? 'destination-out' : 'source-over';
    const c = farbe(s.color);
    ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineCap='round'; ctx.lineJoin='round';
    const p=s.pts;
    if(p.length===1){ ctx.beginPath(); ctx.arc(p[0].x,p[0].y,p[0].w/2,0,Math.PI*2); ctx.fill(); }
    for(let i=1;i<p.length;i++){
      ctx.lineWidth=(p[i].w+p[i-1].w)/2; ctx.beginPath(); ctx.moveTo(p[i-1].x,p[i-1].y); ctx.lineTo(p[i].x,p[i].y); ctx.stroke();
    }
    ctx.restore();
  }
  function redraw(){
    ctx.save(); ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,cv.width,cv.height); ctx.restore();
    strokes.forEach(drawStroke);
  }
  const ro = new ResizeObserver(sizeCanvas); ro.observe(cv);
  // Designwechsel (ThemeService setzt Variablen/Attribute auf <html>): Farben neu auflösen
  const mo = new MutationObserver(()=>{ farbCache.clear(); redraw(); });
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['style','class','data-theme','data-skin'] });

  function bildPunkt(e: PointerEvent|WheelEvent){ const r=cv.getBoundingClientRect(); return { x:e.clientX-r.left, y:e.clientY-r.top }; }
  function pt(e: PointerEvent){
    const b=bildPunkt(e); const base=+$('#size').value*(tool==='eraser'?5:1);
    let w=base; if(tool==='pen' && e.pointerType==='pen' && e.pressure>0) w=base*(0.5+e.pressure);
    return { x:(b.x-view.tx)/view.s, y:(b.y-view.ty)/view.s, w: w/view.s };   // Strichstärke bleibt am Bildschirm gleich
  }

  /* ---------- Karten: aus der Tabelle gezogene Schwellen-Zeilen auf dem Blatt ---------- */
  interface Karte { el: HTMLElement; x: number; y: number; }
  let karten: Karte[] = [];
  // Tim, 2026-11-06: Karten behalten beim Zoomen ihre Größe (wie die Aufgabe), nur ihr Platz auf dem Blatt wandert mit.
  const kartenlage = document.createElement('div'); kartenlage.className='kartenlage';
  wrap.insertBefore(kartenlage, welt.nextSibling);
  function setzeKarte(k: Karte){ k.el.style.left=(k.x*view.s+view.tx)+'px'; k.el.style.top=(k.y*view.s+view.ty)+'px'; }
  kartenAnsicht = ()=>karten.forEach(setzeKarte);
  function karteHTML(t: Tabelle, gi: number){
    const g=t.gruppen[gi];
    let h=`<div class="karte-kopf"><span class="karte-griff">⠿ ${g.name}</span><span class="karte-x" title="Entfernen">✕</span></div>`;
    h+=`<div class="karte-info">${t.gleise}-gleisig · Schwellenteilung ${t.teilung} cm · m³/km</div>`;
    h+=`<table class="schotter mini"><colgroup><col style="width:19%"><col><col><col><col><col><col></colgroup><thead><tr><th rowspan="2">Bettung</th>${t.breiten.map(b=>`<th colspan="2">${fmt(b)} m</th>`).join('')}</tr>`;
    h+=`<tr>${t.breiten.map(()=>t.uWerte.map(u=>`<th>u=${u}</th>`).join('')).join('')}</tr></thead><tbody>`;
    g.zeilen.forEach(z=>{ h+=`<tr><td><b>${fmt(z.dicke)} m</b></td>${z.w.map(v=>`<td class="${typeof v==='number'?'num':''}">${v===null?'':v}</td>`).join('')}</tr>`; });
    return h+`</tbody></table>`;
  }
  function neueKarte(t: Tabelle, gi: number, x: number, y: number){
    const el=document.createElement('div'); el.className='karte'; el.innerHTML=karteHTML(t,gi);
    kartenlage.appendChild(el);
    const k={el,x,y}; karten.push(k); setzeKarte(k); return k;
  }
  function entferneKarten(){ karten.forEach(k=>k.el.remove()); karten=[]; }
  // Die Malfläche liegt über den Karten (man kann auf ihnen schreiben); Griff und ✕ werden per Trefferprüfung bedient.
  function karteUnter(cx: number, cy: number): { k: Karte; teil: 'griff'|'x' }|null {
    for(let i=karten.length-1;i>=0;i--){
      const k=karten[i];
      for(const teil of ['x','griff'] as const){
        const r=(k.el.querySelector(teil==='x'?'.karte-x':'.karte-kopf') as HTMLElement).getBoundingClientRect();
        if(cx>=r.left&&cx<=r.right&&cy>=r.top&&cy<=r.bottom) return {k,teil};
      }
    }
    return null;
  }

  /* ---------- Zeiger auf der Malfläche: Stift/Finger schreibt, zwei Finger zoomen, Griff zieht Karte ---------- */
  const finger = new Map<number,{x:number;y:number}>();
  let pinch: { d0:number; s0:number; mx:number; my:number; wx:number; wy:number }|null = null;
  let kartenZug: { k: Karte; id: number; ox: number; oy: number }|null = null;
  let schieben: { id:number; x:number; y:number }|null = null;      // „Nur Stift“: ein Finger verschiebt
  function pinchStart(){
    const [a,b]=[...finger.values()];
    const mx=(a.x+b.x)/2, my=(a.y+b.y)/2;
    pinch={ d0: Math.hypot(a.x-b.x,a.y-b.y)||1, s0: view.s, mx, my, wx:(mx-view.tx)/view.s, wy:(my-view.ty)/view.s };
  }
  cv.addEventListener('pointerdown',e=>{
    if(tool==='text' && finger.size===0){ e.preventDefault(); const p=pt(e); neueNotiz(p.x, p.y-12); return; }
    const treffer = karteUnter(e.clientX, e.clientY);
    if(treffer){
      if(treffer.teil==='x'){ treffer.k.el.remove(); karten=karten.filter(k=>k!==treffer.k); return; }
      const p=pt(e); kartenZug={ k:treffer.k, id:e.pointerId, ox:p.x-treffer.k.x, oy:p.y-treffer.k.y };
      treffer.k.el.classList.add('zieht'); cv.setPointerCapture(e.pointerId); return;
    }
    if(e.pointerType==='touch'){
      finger.set(e.pointerId, bildPunkt(e));
      if(finger.size===2){
        // zweiter Finger: Zoom/Verschieben – angefangenen Strich des ersten Fingers verwerfen
        if(cur && cur.touch){ strokes.splice(strokes.indexOf(cur),1); cur=null; redraw(); }
        schieben=null; pinchStart(); cv.setPointerCapture(e.pointerId); return;
      }
      if(finger.size>2) return;
      if($('#penOnly').checked){ schieben={ id:e.pointerId, ...bildPunkt(e) }; cv.setPointerCapture(e.pointerId); return; }
    }
    cv.setPointerCapture(e.pointerId);
    cur={tool,color,pts:[pt(e)],id:e.pointerId,touch:e.pointerType==='touch'}; strokes.push(cur); drawStroke(cur);
  });
  cv.addEventListener('pointermove',e=>{
    if(kartenZug && e.pointerId===kartenZug.id){
      const p=pt(e); kartenZug.k.x=p.x-kartenZug.ox; kartenZug.k.y=p.y-kartenZug.oy; setzeKarte(kartenZug.k); return;
    }
    if(finger.has(e.pointerId)){
      finger.set(e.pointerId, bildPunkt(e));
      if(pinch && finger.size>=2){
        const [a,b]=[...finger.values()];
        const mx=(a.x+b.x)/2, my=(a.y+b.y)/2, d=Math.hypot(a.x-b.x,a.y-b.y)||1;
        view.s=Math.min(S_MAX,Math.max(S_MIN,pinch.s0*d/pinch.d0));
        view.tx=mx-pinch.wx*view.s; view.ty=my-pinch.wy*view.s;     // Punkt unter den Fingern bleibt unter den Fingern
        wendeAnsichtAn(); return;
      }
      if(schieben && schieben.id===e.pointerId){
        const b=bildPunkt(e); view.tx+=b.x-schieben.x; view.ty+=b.y-schieben.y; schieben.x=b.x; schieben.y=b.y;
        wendeAnsichtAn(); return;
      }
    }
    if(!cur||e.pointerId!==cur.id) return;
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    const start=cur.pts.length-1;
    (evs.length?evs:[e]).forEach(ev=>cur.pts.push(pt(ev)));
    const part={...cur,pts:cur.pts.slice(Math.max(0,start))}; drawStroke(part);
  });
  const zeigerEnde=(e: PointerEvent)=>{
    if(kartenZug && e.pointerId===kartenZug.id){ kartenZug.k.el.classList.remove('zieht'); kartenZug=null; }
    if(finger.delete(e.pointerId)){
      if(finger.size<2) pinch=null;
      if(schieben && schieben.id===e.pointerId) schieben=null;
    }
    if(cur&&e.pointerId===cur.id) cur=null;
  };
  ['pointerup','pointercancel'].forEach(n=>cv.addEventListener(n,(e: any)=>zeigerEnde(e)));
  cv.addEventListener('wheel',(e: WheelEvent)=>{                     // Desktop: Strg+Rad zoomt, Rad verschiebt
    e.preventDefault();
    const b=bildPunkt(e);
    if(e.ctrlKey||e.metaKey) zoomeUm(b.x,b.y,view.s*Math.exp(-e.deltaY*0.0025));
    else { view.tx-=e.deltaX; view.ty-=e.deltaY; wendeAnsichtAn(); }
  },{ passive:false });
  $('#undo').onclick=()=>{ strokes.pop(); redraw(); };
  $('#clear').onclick=()=>{ if((!strokes.length&&!karten.length&&!notizen.length)||confirm('Whiteboard komplett löschen?')){ strokes=[]; entferneKarten(); entferneNotizen(); redraw(); } };

  /* ---------- Vollbild der Malfläche ---------- */
  function vollbild(an: boolean){
    root.classList.toggle('vollbild', an);
    root.closest('app-schotterberechnung')?.classList.toggle('vollbild', an);   // App-Kopfleiste ausblenden
    $('#vollbild').textContent = an ? 'Vollbild beenden' : 'Vollbild';
    $('#vollbild').classList.toggle('tool-an', an);
  }
  $('#vollbild').onclick = ()=>vollbild(!root.classList.contains('vollbild'));
  const taste=(e: KeyboardEvent)=>{ if(e.key==='Escape' && root.classList.contains('vollbild')) vollbild(false); };
  document.addEventListener('keydown', taste);

  /* ---------- Tippen auf der Schmierseite (Tim, 2026-11-06) ----------
     Werkzeug „Text“: Klick aufs Blatt setzt ein Textfeld, dort mit der Tastatur schreiben.
     Am Rechner kann man auch einfach lostippen: das Feld erscheint dort, wo die Maus zuletzt war.
     Rechnen: eine Zeile mit „=“ abschließen, z. B. „1667 × 3,4 =“ → „1667 × 3,4 = 5.667,8“.
     Erlaubt: + − × · * / ÷ : ( ) % sowie Komma als Dezimalzeichen und Punkt als Tausenderpunkt. */
  interface Notiz { el: HTMLTextAreaElement; x: number; y: number; }
  let notizen: Notiz[] = [];
  let letzterBlattPunkt: { x: number; y: number } | null = null;

  function rechne(ausdruck: string): number|null {
    let s = ausdruck
      .replace(/[×xX·*]/g,'*').replace(/[÷:]/g,'/').replace(/[−–]/g,'-')
      .replace(/(\d)\.(?=\d{3}(?!\d))/g,'$1')        // 1.667 → 1667 (Tausenderpunkt)
      .replace(/,/g,'.').replace(/\s+/g,'');
    if(!s || !/\d/.test(s) || !/^[\d.+\-*/()%]+$/.test(s)) return null;
    let i=0;
    const zahl=(): number => {
      if(s[i]==='('){ i++; const v=summe(); if(s[i]!==')') throw 0; i++; return prozent(v); }
      if(s[i]==='-'){ i++; return -zahl(); }
      if(s[i]==='+'){ i++; return zahl(); }
      const m=/^\d+(\.\d+)?|^\.\d+/.exec(s.slice(i)); if(!m) throw 0;
      i+=m[0].length; return prozent(parseFloat(m[0]));
    };
    const prozent=(v: number)=>{ while(s[i]==='%'){ i++; v/=100; } return v; };
    const produkt=(): number => { let v=zahl(); while(s[i]==='*'||s[i]==='/'){ const op=s[i++]; const w=zahl(); v = op==='*' ? v*w : v/w; } return v; };
    const summe=(): number => { let v=produkt(); while(s[i]==='+'||s[i]==='-'){ const op=s[i++]; const w=produkt(); v = op==='+' ? v+w : v-w; } return v; };
    try{ const v=summe(); return i===s.length && isFinite(v) ? v : null; }catch{ return null; }
  }

  function passeNotizAn(n: Notiz){
    const zeilen=n.el.value.split('\n');
    n.el.style.width = Math.max(4, ...zeilen.map(z=>z.length+2))+'ch';
    n.el.rows = Math.max(1, zeilen.length);
  }
  function entferneNotiz(n: Notiz){ n.el.remove(); notizen=notizen.filter(x=>x!==n); }
  function entferneNotizen(){ notizen.forEach(n=>n.el.remove()); notizen=[]; }

  function neueNotiz(x: number, y: number, start=''){
    const el=document.createElement('textarea');
    el.className='notiz'; el.spellcheck=false; el.rows=1; el.value=start;
    el.setAttribute('aria-label','Notiz auf der Malfläche');
    el.style.color = color.startsWith('--') ? `var(${color})` : color;
    textlage.appendChild(el);
    const n: Notiz={ el, x, y }; notizen.push(n);
    el.style.left=x+'px'; el.style.top=y+'px';
    passeNotizAn(n);
    el.addEventListener('input',()=>passeNotizAn(n));
    el.addEventListener('keydown',(e: KeyboardEvent)=>{
      e.stopPropagation();
      if(e.key==='Escape'){ el.blur(); return; }
      if(e.key==='Backspace' && !el.value){ e.preventDefault(); entferneNotiz(n); return; }
      if(e.key==='=' || (e.key==='Enter' && /=\s*$/.test(el.value.slice(0, el.selectionStart)))){
        // Text links vom Cursor in der aktuellen Zeile, nach dem letzten „=“
        const vorne=el.value.slice(0, el.selectionStart), zeile=vorne.slice(vorne.lastIndexOf('\n')+1);
        const ohneGleich = e.key==='=' ? zeile : zeile.replace(/=\s*$/,'');
        // nach dem letzten „=“; eine Beschriftung wie „Abschnitt 1:“ davor gehört nicht zur Rechnung
        const teil = ohneGleich.slice(ohneGleich.lastIndexOf('=')+1).replace(/^.*[A-Za-zÄÖÜäöüß][^:]*:\s*/,'');
        const m=/[\d.,+\-−–×xX·*/÷:()%\s]+$/.exec(teil);
        const v = m ? rechne(m[0]) : null;
        if(v===null) return;                                    // kein Rechenausdruck: normal weiterschreiben
        e.preventDefault();
        const ergebnis = v.toLocaleString('de-DE',{ maximumFractionDigits: 4 });
        const einfuegen = (e.key==='=' ? (/\s$/.test(zeile)?'':' ')+'= ' : ' ') + ergebnis + (e.key==='Enter' ? '\n' : '');
        el.setRangeText(einfuegen, el.selectionStart, el.selectionEnd, 'end');
        passeNotizAn(n);
      }
    });
    el.addEventListener('blur',()=>{ if(!el.value.trim()) entferneNotiz(n); });
    el.addEventListener('pointerdown',(e: PointerEvent)=>e.stopPropagation());
    // sofort fokussieren (sonst landen schnell getippte Zeichen noch nicht im Feld), danach zur Sicherheit noch einmal
    const fokus=()=>{ if(document.activeElement!==el){ el.focus(); el.setSelectionRange(el.value.length, el.value.length); } };
    fokus(); setTimeout(fokus);
    return n;
  }

  // Merken, wo die Maus/der Stift zuletzt auf dem Blatt war (für „einfach lostippen“)
  cv.addEventListener('pointermove',(e: PointerEvent)=>{ if(e.pointerType!=='touch'){ const b=bildPunkt(e); letzterBlattPunkt={ x:(b.x-view.tx)/view.s, y:(b.y-view.ty)/view.s }; } });

  // Einfach lostippen: druckbare Taste, kein Eingabefeld aktiv → Textfeld an der letzten Mausposition
  const tippen=(e: KeyboardEvent)=>{
    if(e.ctrlKey||e.metaKey||e.altKey||e.key.length!==1||e.key===' ') return;
    const aktiv=document.activeElement as HTMLElement|null;
    if(aktiv && (aktiv.tagName==='INPUT'||aktiv.tagName==='TEXTAREA'||aktiv.tagName==='SELECT'||aktiv.isContentEditable)) return;
    if(!root.isConnected || !root.offsetParent && !root.classList.contains('vollbild')) return;
    const r=wrap.getBoundingClientRect(); if(!r.width) return;
    e.preventDefault();
    setTool('text');
    const p = letzterBlattPunkt ?? { x:(24-view.tx)/view.s, y:(r.height*0.45-view.ty)/view.s };
    neueNotiz(p.x, p.y, e.key);
    letzterBlattPunkt = { x:p.x, y:p.y+34 };                   // nächstes Feld etwas darunter
  };
  document.addEventListener('keydown', tippen);

  /* ---------- Schwellen-Zeile gedrückt halten → Tabelle grau → auf die Malfläche ziehen ---------- */
  (function zeileZiehen(){
    const el=$('#tableScroll') as HTMLElement;
    let timer: any=null, id: number|null=null, sx=0, sy=0, gi=-1, geist: HTMLElement|null=null;
    const aufraeumen=()=>{
      clearTimeout(timer); timer=null; id=null; ziehtZeile=false;
      $('#tableHost').classList.remove('ausgegraut'); $$('#tableHost tr.gewaehlt').forEach(x=>x.classList.remove('gewaehlt'));
      wrap.classList.remove('ziel'); geist?.remove(); geist=null;
    };
    const ueberWrap=(x: number,y: number)=>{ const r=wrap.getBoundingClientRect(); return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom; };
    el.addEventListener('pointerdown',(e: PointerEvent)=>{
      const tr=(e.target as HTMLElement).closest('#tableHost tbody tr') as HTMLElement|null;
      if(!tr||busy||id!==null) return;
      id=e.pointerId; sx=e.clientX; sy=e.clientY; gi=+tr.dataset['g']!;
      timer=setTimeout(()=>{
        timer=null; ziehtZeile=true;
        $('#tableHost').classList.add('ausgegraut');
        $$(`#tableHost tr[data-g="${gi}"]`).forEach(x=>x.classList.add('gewaehlt'));
        geist=document.createElement('div'); geist.className='sbx geist';
        geist.innerHTML=`<div class="karte">${karteHTML(SCHOTTER_TABELLEN[page],gi)}</div>`;
        geist.style.left=sx+'px'; geist.style.top=sy+'px';
        document.body.appendChild(geist); blaetter.push(geist);
        try{ el.setPointerCapture(e.pointerId); }catch{}
        if(navigator.vibrate) try{ navigator.vibrate(15); }catch{}
      }, 450);
    });
    el.addEventListener('pointermove',(e: PointerEvent)=>{
      if(e.pointerId!==id) return;
      if(timer && Math.hypot(e.clientX-sx,e.clientY-sy)>10){ clearTimeout(timer); timer=null; id=null; return; }  // bewegt: scrollen/blättern
      if(!ziehtZeile||!geist) return;
      geist.style.left=e.clientX+'px'; geist.style.top=e.clientY+'px';
      wrap.classList.toggle('ziel', ueberWrap(e.clientX,e.clientY));
    });
    el.addEventListener('pointerup',(e: PointerEvent)=>{
      if(e.pointerId!==id) return;
      if(ziehtZeile){
        gezogenAm=performance.now();
        if(ueberWrap(e.clientX,e.clientY)){
          const t=SCHOTTER_TABELLEN[page], g=gi;
          aufraeumen();
          vollbild(true);
          requestAnimationFrame(()=>{                       // nach dem Umschalten aufs Vollbild unter die Aufgabe legen
            const r=cv.getBoundingClientRect(), kopf=($('.aufgabe-blatt') as HTMLElement).getBoundingClientRect();
            const bx=Math.max(16,(r.width-460)/2), by=kopf.bottom-r.top+16;
            neueKarte(t,g,(bx-view.tx)/view.s,(by-view.ty)/view.s);
          });
          return;
        }
      }
      aufraeumen();
    });
    el.addEventListener('pointercancel',(e: PointerEvent)=>{ if(e.pointerId===id) aufraeumen(); });
    // Während des Ziehens darf die Tabelle nicht scrollen; Kontextmenü beim langen Drücken unterdrücken
    el.addEventListener('touchmove',(e: TouchEvent)=>{ if(ziehtZeile) e.preventDefault(); },{ passive:false });
    el.addEventListener('contextmenu',(e: Event)=>{ if(ziehtZeile||timer) e.preventDefault(); });
  })();

  /* =====================================================================
     AUFGABEN-GENERATOR + BERECHNUNG
     Die Azubis müssen selbst: Einschotterung/Bettung aus der Geschwindigkeit ableiten,
     die richtige Tabelle (Gleise, Teilung) aufschlagen, den Wert ablesen/interpolieren.
     ===================================================================== */
  let task: any=null;
  const FELDER: { key: string; label: string; unit: string; tol?: number; exact?: boolean; abs?: number }[] = [
    {key:'bedarf', label:'Schotterbedarf gesamt',            unit:'m³',    tol:0.01},
    {key:'neu',    label:'Neuschotter (nach Abzug Altschotter)', unit:'m³', tol:0.01},
    {key:'alt',    label:'Altschotter (Abtransport)',        unit:'m³',    tol:0.01},
    {key:'wNeu',   label:'Schotterwagen Neuanlieferung',     unit:'Wagen', exact:true},
    {key:'wAb',    label:'Schotterwagen Abtransport',        unit:'Wagen', exact:true},
    {key:'schwellen', label:'Schwellen (Anzahl)',            unit:'Stück', exact:true},
    {key:'wSchwNeu', label:'Schwellenwagen neue Schwellen',  unit:'Wagen', exact:true},
    {key:'wSchwAlt', label:'Schwellenwagen Altschwellen',    unit:'Wagen', exact:true},
  ];

  function wertAus(t: Tabelle,g: number,z: number,breiteIdx: number,u: number){
    const row=t.gruppen[g].zeilen[z].w;
    const a=row[breiteIdx*2], b=row[breiteIdx*2+1];
    if(typeof a!=='number'||typeof b!=='number') return null;
    return a + (b-a)*u/160;               // lineare Interpolation u = 0 … 160 mm
  }

  /* Schwierigkeitsgrade (Tim, 2026-11-06)
     leicht:  gerade Strecke (u = 0), 100 % Verschmutzung, Länge in km
     mittel:  Verschmutzung wechselnd, Überhöhung 0 oder 160 mm, Länge in km
     schwer:  ein Bauabschnitt mit Kilometrierung (z. B. km 12,4 + 34,2), u auch dazwischen (interpolieren)
     experte: 2–3 Bauabschnitte mit Kilometrierung, je Abschnitt eigene Überhöhung und Verschmutzung
     Schwellenanzahl immer über „Schwellen je 1000 m“ (aufgerundet, 60 cm → 1667), dann × Länge in km. */
  type Stufe = 'leicht'|'mittel'|'schwer'|'experte';
  const STUFEN: { id: Stufe; name: string }[] = [
    { id:'leicht', name:'Leicht' }, { id:'mittel', name:'Mittel' }, { id:'schwer', name:'Schwer' }, { id:'experte', name:'Experte' },
  ];
  const STUFE_KEY = 'glw-schotter-stufe';
  let stufe: Stufe = 'mittel';
  try{ const s=localStorage.getItem(STUFE_KEY) as Stufe|null; if(s && STUFEN.some(x=>x.id===s)) stufe=s; }catch{}

  /** Kilometrierung: Position in Dezimetern → „12,4 + 34,2“ (Hektometer + Meter) */
  function kmText(dm: number){
    const hekto=Math.floor(dm/1000), rest=(dm-hekto*1000)/10;
    return `${(hekto/10).toLocaleString('de-DE',{minimumFractionDigits:1,maximumFractionDigits:1})} + ${rest.toLocaleString('de-DE',{minimumFractionDigits:1,maximumFractionDigits:1})}`;
  }
  const zufall = (a: number, b: number) => a + Math.floor(Math.random()*(b-a+1));

  function neueAufgabe(){
    const A=ANNAHMEN;
    const t=rnd(SCHOTTER_TABELLEN);
    const v=rnd([100,120,140,160,180,200,220,250,280]);
    const r=regel(v), bi=t.breiten.indexOf(r.breite), z=t.gruppen[0].zeilen.findIndex(x=>Math.abs(x.dicke-r.dicke)<1e-9);
    let g=0;
    for(let i=0;i<500;i++){                                   // Schwellenart mit belegten Zellen (u = 0 und 160) suchen
      g=Math.floor(Math.random()*t.gruppen.length);
      if(wertAus(t,g,z,bi,0)!==null && wertAus(t,g,z,bi,160)!==null) break;
    }
    const grp=t.gruppen[g], zeile=grp.zeilen[z];
    const strecke = t.gleise===2 ? 2 : rnd([1,2]);            // 1-gleisige Tabelle: eingleisig oder 1 Gleis einer zweigleisigen Strecke
    const erneuert = t.gleise;
    const nutz = rnd(A.nutzlastWagen), swNutz = rnd(A.schwellenwagenNutzlast);
    const von=rnd(ORTE); let nach=rnd(ORTE); while(nach===von) nach=rnd(ORTE);
    const dichte = rnd(A.dichten);
    let altName = rnd(A.altschwellen); while(altName===grp.name) altName = rnd(A.altschwellen);   // Altschwelle ≠ neue Schwelle
    const kgNeu = GEWICHT_KG[grp.name], kgAlt = GEWICHT_KG[altName];

    // Bauabschnitte je nach Stufe (Längen in Dezimetern, damit die Kilometrierung exakt bleibt)
    type Abschnitt = { start: number|null; ende: number|null; laengeM: number; u: number; verschm: number; wert: number; bedarf: number; neu: number };
    const roh: { start: number|null; ende: number|null; laengeM: number; u: number; verschm: number }[] = [];
    const uAlle=[0,40,80,120,160];
    if(stufe==='leicht' || stufe==='mittel'){
      const km=zufall(10,59)/10;
      roh.push({ start:null, ende:null, laengeM:km*1000, u: stufe==='leicht' ? 0 : rnd([0,160]), verschm: stufe==='leicht' ? 100 : rnd(A.verschmutzung) });
    } else {
      const anzahl = stufe==='schwer' ? 1 : zufall(2,3);
      let pos = zufall(5000,75000)*10 + zufall(0,999);         // dm: km 0,5 … 7,5 + Meter mit einer Nachkommastelle
      let letztesU=-1;
      for(let i=0;i<anzahl;i++){
        const len = zufall(6000,32000) + zufall(0,9);           // dm: 600,0 … 3.200,9 m
        let u=rnd(uAlle); if(anzahl>1) while(u===letztesU) u=rnd(uAlle);
        letztesU=u;
        roh.push({ start:pos, ende:pos+len, laengeM:len/10, u, verschm:rnd(A.verschmutzung) });
        pos += len;
      }
    }
    const abschnitte: Abschnitt[] = roh.map(a=>{
      const wert = wertAus(t,g,z,bi,a.u) as number;
      const bedarf = wert*a.laengeM/1000;
      return { ...a, wert, bedarf, neu: bedarf*a.verschm/100 };
    });
    const laengeM = abschnitte.reduce((s,a)=>s+a.laengeM,0), km = laengeM/1000;
    const bedarf = abschnitte.reduce((s,a)=>s+a.bedarf,0);
    const neu = abschnitte.reduce((s,a)=>s+a.neu,0);
    const tNeu = neu*dichte.wert, tAb = neu*dichte.wert;
    const proKm = Math.ceil(1000/(t.teilung/100)-1e-9);       // Schwellen je 1000 m, aufgerundet (60 cm → 1667)
    const proGleis = Math.ceil(proKm*km-1e-9);
    const schwellen = proGleis*erneuert;
    const tSchwNeu = schwellen*kgNeu/1000, tSchwAlt = schwellen*kgAlt/1000;
    const sol = { breite:r.breite, dicke:r.dicke, bedarf, neu, alt:neu, wNeu:Math.ceil(tNeu/nutz-1e-9), wAb:Math.ceil(tAb/nutz-1e-9),
      schwellen, wSchwNeu:Math.ceil(tSchwNeu/swNutz-1e-9), wSchwAlt:Math.ceil(tSchwAlt/swNutz-1e-9), tNeu, tAb, proKm, proGleis, tSchwNeu, tSchwAlt };
    const ein = abschnitte[0];
    task={t,g,z,bi,v,km,laengeM,strecke,erneuert,nutz,swNutz,dichte,altName,kgNeu,kgAlt,von,nach,sol,grp,zeile,r,abschnitte,stufe,
          u:ein.u, wert:ein.wert, verschm:ein.verschm};

    const gl = strecke===1 ? 'eingleisigen Strecke' : 'zweigleisigen Strecke';
    const was = strecke===1 ? 'wird das Gleis' : (erneuert===2 ? 'werden beide Gleise' : 'wird ein Gleis');
    const lage = (u: number) => u===0 ? 'gerade Strecke, keine Überhöhung' : `Bogen, Überhöhung <b>u = ${u} mm</b>`;
    let ortText: string, abschnittText: string, werteAbschnitte: string;
    if(ein.start===null){
      ortText = `(Länge <b>${fmt(km,1)} km</b>, Streckengeschwindigkeit <b>${v} km/h</b>)`;
      abschnittText = `<p>Lage: ${stufe==='leicht' ? 'gerade Strecke, keine Überhöhung (u = 0 mm)' : lage(ein.u)}.
         Verschmutzungsgrad des Altschotters: <b>${ein.verschm} %</b>${ein.verschm===100 ? ' – der gesamte Altschotter wird ausgetauscht' : ` – das heißt, <b>${100-ein.verschm} %</b> bleiben im Gleis`}.</p>`;
      werteAbschnitte = `<span class="w"><i>Länge</i>${fmt(km,1)} km</span><span class="w"><i>Überhöhung</i>u = ${ein.u} mm</span><span class="w"><i>Verschmutzung</i>${ein.verschm} %</span>`;
    } else if(abschnitte.length===1){
      ortText = `zwischen <b>km ${kmText(ein.start)}</b> und <b>km ${kmText(ein.ende!)}</b> (Streckengeschwindigkeit <b>${v} km/h</b>)`;
      abschnittText = `<p>Lage: ${lage(ein.u)}. Verschmutzungsgrad des Altschotters: <b>${ein.verschm} %</b> – das heißt, <b>${100-ein.verschm} %</b> bleiben im Gleis.</p>`;
      werteAbschnitte = `<span class="w"><i>Bauabschnitt</i>km ${kmText(ein.start)} – km ${kmText(ein.ende!)}</span><span class="w"><i>Überhöhung</i>u = ${ein.u} mm</span><span class="w"><i>Verschmutzung</i>${ein.verschm} %</span>`;
    } else {
      ortText = `in <b>${abschnitte.length} Bauabschnitten</b> (Streckengeschwindigkeit <b>${v} km/h</b>)`;
      abschnittText = `<ul class="abschnitte">${abschnitte.map((a,i)=>`<li><b>Abschnitt ${i+1}:</b> km ${kmText(a.start!)} bis km ${kmText(a.ende!)} · ${lage(a.u)} · Verschmutzung <b>${a.verschm} %</b></li>`).join('')}</ul>`;
      werteAbschnitte = abschnitte.map((a,i)=>`<span class="w w-breit"><i>Abschnitt ${i+1}</i>km ${kmText(a.start!)} – ${kmText(a.ende!)} · u = ${a.u} mm · ${a.verschm} %</span>`).join('');
    }
    $('#taskText').innerHTML = `
      <div class="nur-text">
      <p>Auf der ${gl} <b>${von} – ${nach}</b> ${ortText} ${was} erneuert.</p>
      <p>Neue Schwellen: <b>${grp.name}</b> (je <b>${fmt(kgNeu,0)} kg</b>), Schwellenteilung <b>${t.teilung} cm</b>.
         Ausgebaut werden Altschwellen <b>${altName}</b> (je <b>${fmt(kgAlt,0)} kg</b>).</p>
      ${abschnittText}
      <p>Schotterwagen: <b>${nutz} t</b> Nutzlast. Schwellenwagen: <b>${swNutz} t</b> Nutzlast.
         Gerechnet wird mit <b>${fmt(dichte.wert)} t/m³</b> (${dichte.art}).</p>
      <p class="gesucht"><b>Gesucht:</b> Schotterbedarf gesamt, Neuschotter und Altschotter in m³, die Anzahl der Schwellen sowie die Anzahl der Schotterwagen (neu / Abtransport) und der Schwellenwagen (neue Schwellen / Altschwellen). Schwellen über „Schwellen je 1000 m“ rechnen.</p>
      </div>
      <div class="nur-werte">
        <span class="w"><i>Stufe</i>${STUFEN.find(s=>s.id===stufe)!.name}</span>
        <span class="w"><i>Strecke</i>${strecke===1?'eingleisig':'zweigleisig'}, ${strecke===1?'1 Gleis':(erneuert===2?'beide Gleise':'1 Gleis')} erneuert</span>
        <span class="w"><i>Geschwindigkeit</i>${v} km/h</span>
        ${werteAbschnitte}
        <span class="w"><i>Schüttdichte</i>${fmt(dichte.wert)} t/m³</span>
        <span class="w"><i>Schwelle neu</i>${grp.name} · ${fmt(kgNeu,0)} kg</span>
        <span class="w"><i>Schwelle alt</i>${altName} · ${fmt(kgAlt,0)} kg</span>
        <span class="w"><i>Teilung</i>${t.teilung} cm</span>
        <span class="w"><i>Schotterwagen</i>${nutz} t</span>
        <span class="w"><i>Schwellenwagen</i>${swNutz} t</span>
      </div>`;
    $('#hintText').style.display='none';
    $('#taskNo').textContent = '#'+Math.floor(Math.random()*900+100) + ' · ' + STUFEN.find(s=>s.id===stufe)!.name;
    strokes=[]; entferneKarten(); entferneNotizen(); redraw();
    buildFields(); $('#solution').className='solution'; $('#solution').innerHTML='';
    $('#answersStand').textContent=''; ergebnisseOffen(false);
  }

  // Auswahl des Schwierigkeitsgrads (bleibt gespeichert)
  const stufeSel = $('#stufe') as HTMLSelectElement;
  stufeSel.innerHTML = STUFEN.map(s=>`<option value="${s.id}">${s.name}</option>`).join('');
  stufeSel.value = stufe;
  stufeSel.onchange = ()=>{ stufe = stufeSel.value as Stufe; try{ localStorage.setItem(STUFE_KEY, stufe); }catch{} neueAufgabe(); };

  // „Nur Werte“: Aufgabentext gegen kompakte Werteliste tauschen (Wahl bleibt gespeichert)
  const NUR_WERTE_KEY = 'glw-schotter-nur-werte';
  function nurWerte(an: boolean){
    $('#canvasWrap').classList.toggle('kompakt', an);
    const b=$('#nurWerte'); b.classList.toggle('tool-an', an); b.setAttribute('aria-pressed', String(an));
    b.textContent = an ? 'Ganzer Text' : 'Nur Werte';
    try{ localStorage.setItem(NUR_WERTE_KEY, an ? '1' : '0'); }catch{}
  }
  $('#nurWerte').onclick = ()=>nurWerte(!$('#canvasWrap').classList.contains('kompakt'));
  try{ nurWerte(localStorage.getItem(NUR_WERTE_KEY)==='1'); }catch{ nurWerte(false); }

  // Regelwerte-Hinweis (steht mit auf der Malfläche)
  $('#hint').onclick = ()=>{ const h=$('#hintText'); h.style.display = h.style.display==='none'?'block':'none'; };

  // Ergebnisse: ausklappbar, klappt über die Malfläche auf und spart sonst Platz
  function ergebnisseOffen(offen: boolean){
    $('#answers').classList.toggle('offen', offen);
    $('#answersToggle').setAttribute('aria-expanded', String(offen));
  }
  $('#answersToggle').onclick = ()=>ergebnisseOffen(!$('#answers').classList.contains('offen'));
  $('#answersZu').onclick = ()=>ergebnisseOffen(false);

  function buildFields(){
    $('#fields').innerHTML = FELDER.map(f=>`
      <div class="field" data-k="${f.key}"><span>${f.label}</span>
        <div class="in"><input inputmode="decimal" autocomplete="off" placeholder="…"><span class="unit">${f.unit}</span></div></div>`).join('');
  }
  const num = (s: string) => parseFloat(String(s).replace(/\./g,'').replace(',','.'));   // 1.234,5 → 1234.5 (0,40 → 0.4)

  $('#check').onclick = ()=>{
    let richtig=0;
    FELDER.forEach(f=>{
      const box=$(`.field[data-k="${f.key}"]`), raw=box.querySelector('input').value.trim();
      box.classList.remove('ok','warn','bad'); if(!raw) return;
      const v=num(raw), s=task.sol[f.key]; if(isNaN(v)){ box.classList.add('bad'); return; }
      let cls;
      if(f.exact) cls = v===s ? 'ok' : (Math.abs(v-s)===1 ? 'warn' : 'bad');
      else if(f.abs) cls = Math.abs(v-s)<=f.abs ? 'ok' : 'bad';
      else { const rel=Math.abs(v-s)/s; cls = rel<=f.tol! ? 'ok' : (rel<=0.05 ? 'warn' : 'bad'); }
      box.classList.add(cls);
      if(cls==='ok') richtig++;
    });
    $('#answersStand').textContent = `· ${richtig} von ${FELDER.length} richtig`;
  };
  $('#showSol').onclick = ()=>{
    const s=task.sol, t=task.t, T=task;
    const abs = T.abschnitte as { start: number|null; ende: number|null; laengeM: number; u: number; verschm: number; wert: number; bedarf: number; neu: number }[];
    const interp = (u: number) => u>0&&u<160 ? ' (interpoliert zwischen u = 0 und u = 160)' : '';
    const mehrere = abs.length>1;
    const laenge = (a: typeof abs[0]) => a.start===null ? `${fmt(a.laengeM/1000,1)} km`
      : `km ${kmText(a.ende!)} − km ${kmText(a.start)} = ${fmt(a.laengeM,1)} m = ${fmt(a.laengeM/1000,4)} km`;
    const schritte = mehrere
      ? `<li>Je Abschnitt Tabellenwert ablesen (${t.gleise}-gleisig, Teilung ${t.teilung} cm, ${T.grp.name}, ${fmt(s.dicke)} m, ${fmt(s.breite)} m vor Kopf) und mit der Länge malnehmen:<ul>
          ${abs.map((a,i)=>`<li>Abschnitt ${i+1}: ${laenge(a)}; u = ${a.u} mm → ${fmt(a.wert,1)} m³/km${interp(a.u)};
            ${fmt(a.wert,1)} × ${fmt(a.laengeM/1000,4)} = <b>${fmt(a.bedarf)} m³</b>; Neuschotter ${fmt(a.bedarf)} × ${a.verschm} % = ${fmt(a.neu)} m³</li>`).join('')}
          </ul></li>
         <li>Schotterbedarf gesamt = ${abs.map(a=>fmt(a.bedarf)).join(' + ')} = <b>${fmt(s.bedarf)} m³</b></li>
         <li>Neuschotter gesamt = ${abs.map(a=>fmt(a.neu)).join(' + ')} = <b>${fmt(s.neu)} m³</b></li>`
      : `<li>Länge: ${laenge(abs[0])}</li>
         <li>Tabelle: ${t.gleise}-gleisig, Schwellenteilung ${t.teilung} cm → ${T.grp.name}, ${fmt(s.dicke)} m, ${fmt(s.breite)} m vor Kopf:
          ${fmt(abs[0].wert,1)} m³/km bei u = ${abs[0].u} mm${interp(abs[0].u)}</li>
         <li>Schotterbedarf gesamt = ${fmt(abs[0].wert,1)} m³/km × ${fmt(T.km,4)} km = <b>${fmt(s.bedarf)} m³</b></li>
         <li>Neuschotter = Bedarf × Verschmutzungsgrad = ${fmt(s.bedarf)} × ${abs[0].verschm} % = <b>${fmt(s.neu)} m³</b>${abs[0].verschm===100?' (alles wird getauscht)':''}</li>`;
    $('#solution').innerHTML = `<b>Lösungsweg</b><ol>
      <li>Regelwerte bei ${T.v} km/h: Einschotterung vor Kopf <b>${fmt(s.breite)} m</b>, Bettungsdicke <b>${fmt(s.dicke)} m</b></li>
      ${schritte}
      <li>Neuschotter: ${fmt(s.neu)} m³ × ${fmt(T.dichte.wert)} t/m³ = ${fmt(s.tNeu)} t → ÷ ${T.nutz} t = <b>${s.wNeu} Wagen</b> (aufgerundet)</li>
      <li>Altschotter (Abtransport) = verschmutzter Anteil = <b>${fmt(s.alt)} m³</b>; ${fmt(s.alt)} m³ × ${fmt(T.dichte.wert)} t/m³ = ${fmt(s.tAb)} t → ÷ ${T.nutz} t = <b>${s.wAb} Wagen</b> (aufgerundet)</li>
      <li>Schwellen je 1000 m: 1000 m ÷ ${fmt(t.teilung/100)} m = ${fmt(1000/(t.teilung/100))} → <b>${fmt(s.proKm)} Schwellen/km</b> (aufgerundet)</li>
      <li>Schwellen: ${fmt(s.proKm)} × ${fmt(T.km,4)} km = ${fmt(s.proGleis)} je Gleis (aufgerundet)${T.erneuert>1?` × ${T.erneuert} Gleise`:''}
          = <b>${fmt(s.schwellen)} Stück</b> (neu und alt gleich viele)</li>
      <li>Neue Schwellen: ${fmt(s.schwellen)} × ${fmt(T.kgNeu,0)} kg = ${fmt(s.tSchwNeu)} t → ÷ ${T.swNutz} t = <b>${s.wSchwNeu} Wagen</b> (aufgerundet)</li>
      <li>Altschwellen: ${fmt(s.schwellen)} × ${fmt(T.kgAlt,0)} kg = ${fmt(s.tSchwAlt)} t → ÷ ${T.swNutz} t = <b>${s.wSchwAlt} Wagen</b> (aufgerundet)</li></ol>`;
    $('#solution').classList.add('show');
  };
  $('#newTask').onclick = neueAufgabe;

  /* ---------- Aufgabe melden (Tim, 2026-11-06) ----------
     Schickt die komplette Aufgabe (Text, Werte, Musterlösung) an Tims Meldungen (Admin-Seite „Fragen“).
     Mit Konto/Gast namentlich, mit reinem Seiten-Login anonym. */
  const meldeDialog = $('#meldeDialog') as HTMLElement;
  function meldenOeffnen(an: boolean){
    meldeDialog.hidden = !an;
    if(an){
      ($('#meldeKommentar') as HTMLTextAreaElement).value='';
      $('#meldeStatus').textContent=''; ($('#meldeSenden') as HTMLButtonElement).disabled=false;
      setTimeout(()=>($('#meldeKommentar') as HTMLTextAreaElement).focus());
    }
  }
  $('#melden').onclick = ()=>meldenOeffnen(true);
  $('#meldeAbbrechen').onclick = ()=>meldenOeffnen(false);
  meldeDialog.addEventListener('keydown',(e: KeyboardEvent)=>{ e.stopPropagation(); if(e.key==='Escape') meldenOeffnen(false); });
  $('#meldeSenden').onclick = async ()=>{
    if(!task) return;
    const T=task, s=T.sol;
    const grund = ($('#meldeGrund') as HTMLSelectElement).value;
    const kommentar = ($('#meldeKommentar') as HTMLTextAreaElement).value.trim();
    const text = ($('#taskText .nur-text') as HTMLElement).innerText.replace(/\n{2,}/g,'\n').trim();
    const werte = `Stufe ${T.stufe} · Tabelle ${T.t.gleise}-gleisig/${T.t.teilung} cm · ${T.grp.name} · v=${T.v} km/h · `
      + T.abschnitte.map((a: any,i: number)=>`A${i+1}: ${fmt(a.laengeM,1)} m, u=${a.u}, ${a.verschm} %, Tab=${fmt(a.wert,1)}`).join(' | ')
      + ` · Lösung: Bedarf ${fmt(s.bedarf)} m³, Neu ${fmt(s.neu)} m³, Schwellen ${s.schwellen}, Wagen ${s.wNeu}/${s.wAb}, Schwellenwagen ${s.wSchwNeu}/${s.wSchwAlt}`;
    const knopf = $('#meldeSenden') as HTMLButtonElement; knopf.disabled=true;
    $('#meldeStatus').textContent='Wird gesendet …';
    const meldung = {
      questionId: `schotter-${T.stufe}-${($('#taskNo').textContent||'').split(' ')[0].replace('#','')}`,
      topic: 'Schotterberechnung',
      question: (text + '\n\n' + werte).slice(0, 4000),
      reason: grund,
      comment: kommentar || undefined,
    };
    const clientId = (()=>{ try{ return crypto.randomUUID(); }catch{ return Date.now().toString(36)+Math.random().toString(36).slice(2,12); } })();
    try{
      const headers: Record<string,string> = { 'Content-Type':'application/json' };
      try{ const tok=localStorage.getItem('glw-auth-token'); if(tok) headers['Authorization']='Bearer '+tok; }catch{}
      const res = await fetch(`${API_BASE_URL}/meldungen`, { method:'POST', headers, body: JSON.stringify({ ...meldung, clientId }) });
      if(!res.ok && res.status!==400) throw new Error(String(res.status));
      if(!res.ok) throw Object.assign(new Error('abgelehnt'), { endgueltig: true });
      $('#meldeStatus').textContent='Danke! Die Meldung ist angekommen.';
      setTimeout(()=>meldenOeffnen(false), 1400);
    }catch(e: any){
      if(e?.endgueltig){
        knopf.disabled=false;
        $('#meldeStatus').textContent='Die Meldung wurde abgelehnt – bitte Kommentar kürzen und noch einmal senden.';
      } else {
        // Kein Netz/Server weg: im Postausgang merken, wird automatisch nachgeschickt
        meldungZwischenspeichern({ ...meldung, clientId });
        $('#meldeStatus').textContent='Gerade keine Verbindung – die Meldung ist gespeichert und wird automatisch nachgeschickt.';
        setTimeout(()=>meldenOeffnen(false), 2200);
      }
    }
  };

  /* Start */
  renderTable(); neueAufgabe();

  return () => { ro.disconnect(); mo.disconnect(); document.removeEventListener('keydown', taste); document.removeEventListener('keydown', tippen); cancelAnimationFrame(raf); blaetter.forEach(l=>l.remove()); };
}
