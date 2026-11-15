import { Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../../../core/api-config';
import { alleAppTiles } from '../../../../shared/katalog';
import { GLOSSAR_EINTRAEGE } from '../../../zusatz/glossar/data/glossar-eintraege';
import { FORMELSAMMLUNG } from '../../../berufsschule/formelsammlung/kern/daten';

interface Status {
  ki: boolean; modell: string; notizen: number;
  jetzt: { text: string; app: string | null; seit: string } | null;
  log: { id: number; zeit: string; text: string; app: string | null }[];
  auftraege: { id: number; text: string; status: string; ergebnis: string | null; erstellt_am: string; fertig_am: string | null }[];
  seite: { am: string | null; n: number };
  chat: { text: string; seit: string } | null;
  kiLage: { rechnet: boolean; vorrang: boolean; wartend: number };
}

interface Treffer { titel: string; link?: string; text?: string }
interface Nachricht { id: number; rolle: 'tim' | 'guru'; text: string; daten: { treffer?: Treffer[] } | null; zeit: string }
interface NotizKurz { id: number; pfad: string; quelle: string; laenge: number; geaendert_am: string }
interface Notiz { id: number; pfad: string; inhalt: string; quelle: string; geaendert_am: string }

const STOPP = new Set(['der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'und', 'oder', 'ist', 'sind', 'wie', 'was', 'wo', 'wer', 'wann', 'warum',
  'welche', 'welcher', 'welches', 'mit', 'von', 'für', 'auf', 'zum', 'zur', 'ich', 'du', 'mir', 'mich', 'mal', 'bitte', 'kannst', 'such', 'suche', 'finde',
  'gibt', 'noch', 'auch', 'nicht', 'kein', 'keine', 'habe', 'hat', 'haben', 'wir', 'uns', 'etwas', 'zeig', 'zeige', 'dazu', 'über']);

/**
 * Gleisbau-Guru (Admin, Tim 2026-11-13): Chat mit dem regelbasierten Bot, Spracheingabe, und sein „Gehirn“ –
 * Markdown-Notizen, die Tim lesen, ändern, löschen und herunterladen kann. Die Seiten-Suche (Apps, Glossar,
 * Quizfragen) läuft hier im Browser; der Server ergänzt Notizen, Meldungen und Forum (backend/src/routes/guru.ts).
 */
@Component({
  selector: 'app-guru',
  templateUrl: './guru.page.html',
  styleUrls: ['./guru.page.scss'],
  standalone: false,
})
export class GuruPage implements OnInit, OnDestroy {
  @ViewChild('verlauf') verlauf?: ElementRef<HTMLElement>;

  status: Status | null = null;
  einlesen = '';
  private statusTimer: any = null;
  private letzteGuruId = 0;

  ansicht: 'chat' | 'gehirn' = 'chat';
  nachrichten: Nachricht[] = [];
  eingabe = '';
  sendet = false;
  fehler = '';

  // Spracheingabe (Web Speech API, Chrome/Edge/Android)
  readonly spracheMoeglich = typeof window !== 'undefined' && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  hoert = false;
  private erkennung: any = null;
  private textVorSprache = '';

  // Gehirn
  notizen: NotizKurz[] = [];
  offen: Notiz | null = null;
  bearbeiten = false;
  entwurfPfad = '';
  entwurfInhalt = '';
  filter = '';

  private quizFragen: { thema: string; titel: string; frage: string; antwort: string }[] | null = null;

  constructor(private readonly http: HttpClient, private readonly zone: NgZone) {}

  ngOnInit(): void {
    this.ladeChat();
    this.ladeNotizen();
    this.ladeStatus();
    this.statusTimer = setInterval(() => this.ladeStatus(), 4000);
    this.websiteEinlesen(false);
  }

  ngOnDestroy(): void {
    this.erkennung?.abort?.();
    clearInterval(this.statusTimer);
    clearInterval(this.denkTimer);
  }

  /* ---------------- Live-Status: woran arbeitet der Guru? ---------------- */

  ladeStatus(): void {
    this.http.get<Status>(`${API_BASE_URL}/guru/status`).subscribe({
      next: (s) => {
        // Neue Nachricht vom Guru (z. B. Auftrag fertig) → Chat neu laden
        const fertig = s.auftraege.filter((a) => a.status === 'fertig').map((a) => a.id);
        const neu = Math.max(0, ...fertig);
        if (this.letzteGuruId && neu > this.letzteGuruId) { this.ladeChat(); this.ladeNotizen(); }
        this.letzteGuruId = neu;
        this.status = s;
      },
      error: () => {},
    });
  }

  get offeneAuftraege() {
    return (this.status?.auftraege ?? []).filter((a) => a.status === 'offen' || a.status === 'laeuft');
  }
  get fertigeAuftraege() {
    return (this.status?.auftraege ?? []).filter((a) => a.status === 'fertig' || a.status === 'fehler').slice(0, 6);
  }

  /** Website einlesen: Apps, Formeln, Glossar, Quizfragen als Snapshot an den Guru (nur wenn sich etwas geändert hat). */
  async websiteEinlesen(erzwingen: boolean): Promise<void> {
    try {
      const apps = alleAppTiles().map((t) => ({ id: t.id, titel: t.title, link: t.link, beschreibung: t.description || '', bereich: t.tag || '' }));
      const appLink = (id: string) => apps.find((a) => a.id === 'formelsammlung-' + id)?.link ?? '/berufsschule/formelsammlung/' + id;
      const formeln = FORMELSAMMLUNG.formeln.filter((f: any) => f.status !== 'unklar').map((f: any) => ({
        id: f.id, app: f.app, appTitel: FORMELSAMMLUNG.apps.find((a: any) => a.id === f.app)?.titel ?? f.app, appLink: appLink(f.app),
        titel: f.titel, latex: f.latex, hinweis: f.hinweis || undefined, grenzen: f.grenzen || undefined,
        variablen: (f.variablen || []).map((v: any) => ({ symbol: v.symbol, name: v.name, einheit: v.einheit || '' })),
      }));
      const glossar = GLOSSAR_EINTRAEGE.map((g) => ({ begriff: g.begriff, definition: g.definition }));
      const themen: { topicId: string; title: string }[] = await (await fetch('assets/themenquiz/topics.json')).json();
      const quiz = await Promise.all(themen.map(async (t) => {
        try {
          const j = await (await fetch('assets/themenquiz/' + t.topicId + '.json')).json();
          return { thema: t.topicId, titel: t.title, link: '/themenquiz/' + t.topicId,
            fragen: (j.questions || []).map((q: any) => ({ frage: String(q.question).slice(0, 1000), antwort: String(q.choices?.[q.correctIndex] ?? '').slice(0, 600), erklaerung: q.explanation ? String(q.explanation).slice(0, 1500) : undefined })) };
        } catch { return { thema: t.topicId, titel: t.title, link: '/themenquiz/' + t.topicId, fragen: [] }; }
      }));
      const daten = { apps, formeln, glossar, quiz };
      const json = JSON.stringify(daten);
      let h = 0;
      for (let i = 0; i < json.length; i++) h = (h * 31 + json.charCodeAt(i)) | 0;
      const hash = (h >>> 0).toString(16) + '-' + json.length;
      if (!erzwingen) {
        const r = await this.http.get<{ hash: string | null }>(`${API_BASE_URL}/guru/wissen`).toPromise();
        if (r?.hash === hash) return;
      }
      this.einlesen = 'liest ein …';
      await this.http.post(`${API_BASE_URL}/guru/wissen`, { hash, ...daten }).toPromise();
      this.einlesen = `✓ ${apps.length} Apps, ${formeln.length} Formeln, ${glossar.length} Begriffe eingelesen`;
      this.ladeNotizen();
    } catch {
      this.einlesen = 'Einlesen hat nicht geklappt.';
    }
  }

  /* ---------------- Chat ---------------- */

  ladeChat(): void {
    this.http.get<{ nachrichten: Nachricht[] }>(`${API_BASE_URL}/guru/chat`).subscribe({
      next: (r) => {
        this.nachrichten = r.nachrichten;
        if (!this.nachrichten.length) this.nachrichten = [{ id: 0, rolle: 'guru', text: 'Moin Tim! Ich bin der Gleisbau-Guru 🤖 – noch ganz am Anfang. Schreib „Hilfe“, dann zeige ich dir, was ich schon kann.', daten: null, zeit: new Date().toISOString() }];
        this.nachUnten();
      },
      error: () => (this.fehler = 'Chat konnte nicht geladen werden (Server erreichbar? Nur für Admins).'),
    });
  }

  tasteGedrueckt(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.senden(); }
  }

  /** Guru denkt (Antwort entsteht im Hintergrund): Startzeit fuer die Sekundenanzeige; null = nicht. */
  denktSeit: number | null = null;
  denktText = '';
  sekunden = 0;
  private denkTimer: any = null;

  async senden(): Promise<void> {
    const text = this.eingabe.trim();
    if (!text) return;
    this.stoppeSprache();
    this.fehler = '';
    // Sofort zeigen: eigene Nachricht in den Verlauf, Feld leeren, Denkblase an
    const vorlaeufig: Nachricht = { id: -Date.now(), rolle: 'tim', text, daten: null, zeit: new Date().toISOString() };
    this.nachrichten = [...this.nachrichten.filter((n) => n.id !== 0), vorlaeufig];
    this.eingabe = '';
    this.starteDenken('Sucht auf der Website …');
    this.nachUnten();
    let seitenTreffer: Treffer[] = [];
    try { seitenTreffer = await this.seiteDurchsuchen(text); } catch { /* Suche ist nur Zugabe */ }
    this.denktText = 'Denkt nach …';
    this.http.post<{ nachrichten: Nachricht[] }>(`${API_BASE_URL}/guru/chat`, { text, seitenTreffer }).subscribe({
      next: (r) => {
        this.nachrichten = this.nachrichten.map((n) => (n.id === vorlaeufig.id ? r.nachrichten[0] : n));
        this.warteAufAntwort(r.nachrichten[0]?.id ?? 0);
      },
      error: () => {
        this.nachrichten = this.nachrichten.filter((n) => n.id !== vorlaeufig.id);
        this.eingabe = text;
        this.stoppeDenken();
        this.fehler = 'Senden hat nicht geklappt – dein Text steht wieder im Feld.';
      },
    });
  }

  private starteDenken(text: string): void {
    this.denktText = text;
    if (this.denktSeit === null) this.denktSeit = Date.now();
    this.sekunden = 0;
    clearInterval(this.denkTimer);
    this.denkTimer = setInterval(() => (this.sekunden = Math.round((Date.now() - (this.denktSeit ?? Date.now())) / 1000)), 1000);
  }

  private stoppeDenken(): void {
    this.denktSeit = null;
    clearInterval(this.denkTimer);
  }

  /** Alle 1,5 s nachfragen, bis die Antwort des Guru da ist (max. 6 Minuten). */
  private warteAufAntwort(nachId: number): void {
    const start = Date.now();
    const frage = () => {
      this.http.get<{ nachrichten: Nachricht[]; denkt: unknown; ki: { rechnet: boolean; vorrang: boolean; wartend: number } }>(`${API_BASE_URL}/guru/chat`, { params: { nach: String(nachId) } }).subscribe({
        next: (r) => {
          const neu = r.nachrichten.filter((n) => !this.nachrichten.some((m) => m.id === n.id));
          if (neu.length) this.nachrichten = [...this.nachrichten, ...neu];
          if (r.nachrichten.some((n) => n.rolle === 'guru')) { this.stoppeDenken(); this.nachUnten(); this.ladeNotizen(); return; }
          this.denktText = r.ki.rechnet && !r.ki.vorrang ? 'Wartet kurz – die KI rechnet noch an einem Auftrag, du bist als Nächster dran …'
            : r.ki.rechnet ? 'KI rechnet an deiner Antwort …' : 'Denkt nach …';
          if (Date.now() - start < 360000) setTimeout(frage, 1500); else { this.stoppeDenken(); this.fehler = 'Der Guru braucht ungewöhnlich lange – schau gleich nochmal rein.'; }
        },
        error: () => setTimeout(frage, 3000),
      });
    };
    setTimeout(frage, 800);
  }

  schnell(text: string): void {
    this.eingabe = text;
    this.senden();
  }

  private nachUnten(): void {
    setTimeout(() => { const el = this.verlauf?.nativeElement; if (el) el.scrollTop = el.scrollHeight; }, 30);
  }

  /** Einfaches Markdown für Bot-Antworten: **fett**, *kursiv*, Zeilenumbrüche (Text wird vorher maskiert). */
  formatiere(t: string): string {
    const sicher = t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return sicher.replace(/\[\[([^\]]+)\]\]/g, (_m, n) => `<a class="guru-wl" title="${n.replace(/"/g, '&quot;')}">${n.replace(/^(Seite|Lernen|Wissen)\//, '')}</a>`)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/\n/g, '<br>');
  }

  /** Klick auf einen [[Link]] (im Chat oder in einer Notiz): Notiz im Gehirn öffnen. */
  linkKlick(e: Event): void {
    const a = (e.target as HTMLElement).closest('a.guru-wl') as HTMLElement | null;
    if (!a) return;
    e.preventDefault();
    this.oeffneName(a.getAttribute('title') || '');
  }

  oeffneName(name: string): void {
    const n = name.trim().replace(/\.md$/i, '').toLowerCase();
    const t = this.notizen.find((x) => x.pfad.replace(/\.md$/i, '').toLowerCase() === n)
      ?? this.notizen.find((x) => this.dateiname(x.pfad).toLowerCase() === n.slice(n.lastIndexOf('/') + 1));
    this.ansicht = 'gehirn';
    if (t) this.oeffne(t); else this.fehler = `Notiz „${name}“ gibt es (noch) nicht.`;
  }

  /** Markdown einer Notiz anzeigen: Überschriften, Listen, Tabellen grob, fett/kursiv, [[Links]], #tags. */
  notizHtml(md: string): string {
    const zeilen = md.split('\n');
    let html = '', liste = false, code = false;
    for (const z of zeilen) {
      if (z.startsWith('```')) { html += code ? '</pre>' : '<pre class="guru-code">'; code = !code; continue; }
      if (code) { html += z.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '\n'; continue; }
      const istListe = /^\s*[-*] /.test(z);
      if (istListe && !liste) { html += '<ul>'; liste = true; }
      if (!istListe && liste) { html += '</ul>'; liste = false; }
      let inhalt = this.formatiere(z.replace(/^\s*[-*] /, '').replace(/^#{1,6} /, '')).replace(/(^|\s)#([\p{L}\p{N}_-]+)/gu, '$1<span class="guru-tag">#$2</span>');
      inhalt = inhalt.replace(/\[ \]/g, '☐').replace(/\[x\]/g, '☑');
      const h = /^(#{1,6}) /.exec(z);
      if (h) html += `<h${Math.min(6, h[1].length + 2)}>${inhalt}</h${Math.min(6, h[1].length + 2)}>`;
      else if (istListe) html += `<li>${inhalt}</li>`;
      else if (/^\|/.test(z)) { if (!/^\|[-| ]+\|$/.test(z)) html += `<div class="guru-zeile">${inhalt.replace(/^\||\|$/g, '').split('|').map((c) => `<span>${c.trim()}</span>`).join('')}</div>`; }
      else if (z.trim()) html += `<p>${inhalt}</p>`;
    }
    return html + (liste ? '</ul>' : '') + (code ? '</pre>' : '');
  }

  /** Rückverweise wie in Obsidian: welche Notizen verlinken auf die offene? (Server-Suche über den Namen) */
  rueckverweise: { id: number; pfad: string }[] = [];
  private ladeRueckverweise(pfad: string): void {
    this.rueckverweise = [];
    const name = pfad.replace(/\.md$/i, '');
    this.http.get<{ notizen: { id: number; pfad: string }[] }>(`${API_BASE_URL}/guru/rueckverweise`, { params: { name } })
      .subscribe({ next: (r) => (this.rueckverweise = r.notizen), error: () => {} });
  }

  /* ---------------- Seiten-Suche im Browser ---------------- */

  private woerter(text: string): string[] {
    return [...new Set(text.toLowerCase().replace(/[^\p{L}\p{N} -]/gu, ' ').split(/\s+/).filter((w) => w.length >= 3 && !STOPP.has(w)))].slice(0, 6);
  }

  /** Nur bei Fragen/Suchwünschen – Befehle wie „Merke: …“ oder „Bericht“ brauchen keine Seitensuche. */
  private istSuche(text: string): boolean {
    const l = text.trim().toLowerCase();
    if (/^(merk|notiere|wissen|für claude|fuer claude|an claude|notiz für|bericht|report|zusammenfassung|meldungen|hilfe|hallo|moin)/.test(l)) return false;
    return /\?/.test(l) || /^(wo|wie|was|wer|welche|such|finde|zeig)/.test(l);
  }

  private async seiteDurchsuchen(text: string): Promise<Treffer[]> {
    if (!this.istSuche(text)) return [];
    const w = this.woerter(text);
    if (!w.length) return [];
    const punkte = (s: string) => { const l = s.toLowerCase(); return w.reduce((a, x) => a + (l.includes(x) ? 1 : 0), 0); };
    const treffer: { t: Treffer; p: number }[] = [];
    for (const k of alleAppTiles()) {
      const p = punkte(k.title) * 2 + punkte(k.description || '');
      if (p) treffer.push({ t: { titel: '📱 App: ' + k.title, link: k.link, text: k.description }, p: p + 1 });
    }
    for (const g of GLOSSAR_EINTRAEGE) {
      const p = punkte(g.begriff) * 3 + punkte(g.definition);
      if (p) treffer.push({ t: { titel: '📖 Glossar: ' + g.begriff, link: '/zusatz/glossar', text: this.kurz(g.definition) }, p });
    }
    for (const q of await this.ladeQuizFragen()) {
      const p = punkte(q.frage) * 2 + punkte(q.antwort);
      if (p >= Math.min(2, w.length)) treffer.push({ t: { titel: '❓ Quiz ' + q.titel + ': ' + this.kurz(q.frage, 90), link: '/themenquiz/' + q.thema, text: 'Antwort: ' + this.kurz(q.antwort, 120) }, p });
    }
    return treffer.sort((a, b) => b.p - a.p).slice(0, 8).map((x) => x.t);
  }

  private async ladeQuizFragen() {
    if (this.quizFragen) return this.quizFragen;
    const liste: { thema: string; titel: string; frage: string; antwort: string }[] = [];
    try {
      const themen: { topicId: string; title: string }[] = await (await fetch('assets/themenquiz/topics.json')).json();
      await Promise.all(themen.map(async (t) => {
        try {
          const j = await (await fetch('assets/themenquiz/' + t.topicId + '.json')).json();
          for (const q of j.questions || []) liste.push({ thema: t.topicId, titel: t.title, frage: q.question, antwort: q.choices?.[q.correctIndex] ?? '' });
        } catch { /* Thema fehlt */ }
      }));
    } catch { /* ohne Quizfragen */ }
    return (this.quizFragen = liste);
  }

  private kurz(t: string, n = 140): string {
    return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t;
  }

  /* ---------------- Spracheingabe ---------------- */

  sprache(): void {
    if (this.hoert) { this.stoppeSprache(); return; }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.lang = 'de-DE';
    r.continuous = true;
    r.interimResults = true;
    this.textVorSprache = this.eingabe ? this.eingabe.replace(/\s*$/, ' ') : '';
    r.onresult = (e: any) => this.zone.run(() => {
      let t = '';
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      this.eingabe = this.textVorSprache + t.trim();
    });
    r.onend = () => this.zone.run(() => { this.hoert = false; this.erkennung = null; });
    r.onerror = (e: any) => this.zone.run(() => { this.hoert = false; if (e?.error === 'not-allowed') this.fehler = 'Mikrofon ist nicht erlaubt – bitte im Browser freigeben.'; });
    this.erkennung = r;
    this.hoert = true;
    r.start();
  }

  private stoppeSprache(): void {
    if (this.erkennung) { try { this.erkennung.stop(); } catch { /* egal */ } }
    this.hoert = false;
  }

  /* ---------------- Gehirn (Notizen) ---------------- */

  ladeNotizen(): void {
    this.http.get<{ notizen: NotizKurz[] }>(`${API_BASE_URL}/guru/notizen`).subscribe({ next: (r) => (this.notizen = r.notizen), error: () => {} });
  }

  get ordner(): { name: string; notizen: NotizKurz[] }[] {
    const f = this.filter.trim().toLowerCase();
    const m = new Map<string, NotizKurz[]>();
    for (const n of this.notizen) {
      if (f && !n.pfad.toLowerCase().includes(f)) continue;
      const i = n.pfad.lastIndexOf('/');
      const o = i > 0 ? n.pfad.slice(0, i) : '';
      m.set(o, [...(m.get(o) ?? []), n]);
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([name, notizen]) => ({ name, notizen }));
  }

  dateiname(p: string): string {
    return p.slice(p.lastIndexOf('/') + 1).replace(/\.md$/i, '');
  }

  oeffne(n: NotizKurz): void {
    this.http.get<{ notiz: Notiz }>(`${API_BASE_URL}/guru/notizen/${n.id}`).subscribe((r) => { this.offen = r.notiz; this.bearbeiten = false; this.ladeRueckverweise(r.notiz.pfad); });
  }

  neu(): void {
    this.offen = { id: 0, pfad: 'Wissen/Neue Notiz.md', inhalt: '# Neue Notiz\n\n', quelle: 'tim', geaendert_am: '' };
    this.starteBearbeiten();
  }

  starteBearbeiten(): void {
    if (!this.offen) return;
    this.entwurfPfad = this.offen.pfad;
    this.entwurfInhalt = this.offen.inhalt;
    this.bearbeiten = true;
  }

  speichern(): void {
    if (!this.offen) return;
    const daten = { pfad: this.entwurfPfad, inhalt: this.entwurfInhalt };
    const fertig = () => { this.bearbeiten = false; this.ladeNotizen(); };
    const fehler = (e: any) => alert(e?.error?.error ?? 'Speichern hat nicht geklappt.');
    if (!this.offen.id) {
      this.http.post<{ id: number }>(`${API_BASE_URL}/guru/notizen`, daten).subscribe({
        next: (r) => { this.offen = { ...this.offen!, id: r.id, ...daten }; fertig(); this.oeffne({ id: r.id } as NotizKurz); }, error: fehler,
      });
    } else {
      const id = this.offen.id;
      this.http.put(`${API_BASE_URL}/guru/notizen/${id}`, daten).subscribe({ next: () => { fertig(); this.oeffne({ id } as NotizKurz); }, error: fehler });
    }
  }

  loeschen(): void {
    if (!this.offen?.id || !confirm(`„${this.offen.pfad}“ wirklich löschen?`)) return;
    this.http.delete(`${API_BASE_URL}/guru/notizen/${this.offen.id}`).subscribe(() => { this.offen = null; this.ladeNotizen(); });
  }

  herunterladen(): void {
    if (!this.offen) return;
    this.speichereDatei(this.dateiname(this.offen.pfad) + '.md', this.offen.inhalt);
  }

  /** Alle Notizen als eine Markdown-Datei (Ordner/Name als Überschrift). */
  allesHerunterladen(): void {
    const ids = this.notizen.map((n) => n.id);
    Promise.all(ids.map((id) => this.http.get<{ notiz: Notiz }>(`${API_BASE_URL}/guru/notizen/${id}`).toPromise())).then((liste) => {
      const text = liste.filter((x): x is { notiz: Notiz } => !!x).map((x) => `<!-- ${x.notiz.pfad} -->\n${x.notiz.inhalt}`).join('\n\n---\n\n');
      this.speichereDatei('gleisbau-guru-gehirn-' + new Date().toISOString().slice(0, 10) + '.md', text);
    });
  }

  private speichereDatei(name: string, inhalt: string): void {
    const url = URL.createObjectURL(new Blob([inhalt], { type: 'text/markdown;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
