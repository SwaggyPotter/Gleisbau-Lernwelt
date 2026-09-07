import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { lokaleKachelBilder } from '../../shared/katalog';
import { OfflineFortschritt, OfflineStatus } from './offline.models';

const URLS_KEY = 'glw-offline-cache-urls';
const ZEIT_KEY = 'glw-offline-cache-zeit';

interface TopicMeta { topicId: string }
interface BildEintrag { file: string }

@Injectable({ providedIn: 'root' })
export class OfflineService {
  private readonly fortschrittSubject = new BehaviorSubject<OfflineFortschritt>({
    gesamt: 0, fertig: 0, fehler: 0, laeuftGerade: false, aktuelleDatei: null,
  });
  readonly fortschritt$ = this.fortschrittSubject.asObservable();

  private abbrechenAngefordert = false;

  get status(): OfflineStatus {
    return {
      zuletztAktualisiert: localStorage.getItem(ZEIT_KEY),
      anzahlDateien: this.geladeneUrls().size,
    };
  }

  /** Best-effort-Hinweis ueber die Netzwerkart. `null` = kein Hinweis noetig/moeglich. */
  get netzwerkHinweis(): string | null {
    const conn = (navigator as unknown as { connection?: { type?: string; saveData?: boolean; effectiveType?: string } }).connection;
    if (!conn) return null;
    if (conn.saveData) return 'Datensparmodus ist aktiv. Der Download laedt trotzdem mehrere MB an Bildern und Fragen.';
    if (conn.type && conn.type !== 'wifi' && conn.type !== 'ethernet') {
      return 'Du bist vermutlich NICHT im WLAN. Der Download kann mehrere MB an mobilen Daten verbrauchen.';
    }
    return null;
  }

  abbrechen(): void {
    this.abbrechenAngefordert = true;
  }

  async starten(): Promise<void> {
    this.abbrechenAngefordert = false;
    const bereits = this.geladeneUrls();

    const urls = await this.sammleAlleUrls();
    const offen = urls.filter(u => !bereits.has(u));

    this.fortschrittSubject.next({
      gesamt: urls.length, fertig: urls.length - offen.length, fehler: 0, laeuftGerade: true, aktuelleDatei: null,
    });

    let fehler = 0;
    for (const url of offen) {
      if (this.abbrechenAngefordert) break;

      this.fortschrittSubject.next({ ...this.fortschrittSubject.value, aktuelleDatei: this.kurzname(url) });
      try {
        await fetch(url, { mode: url.startsWith('http') ? 'no-cors' : 'same-origin', cache: 'reload' });
        bereits.add(url);
        this.speichereGeladeneUrls(bereits);
      } catch {
        fehler++;
      }

      this.fortschrittSubject.next({
        gesamt: urls.length, fertig: bereits.size, fehler, laeuftGerade: true, aktuelleDatei: this.kurzname(url),
      });
    }

    if (!this.abbrechenAngefordert) {
      localStorage.setItem(ZEIT_KEY, new Date().toISOString());
    }
    this.fortschrittSubject.next({ ...this.fortschrittSubject.value, laeuftGerade: false, aktuelleDatei: null });
  }

  zuruecksetzen(): void {
    localStorage.removeItem(URLS_KEY);
    localStorage.removeItem(ZEIT_KEY);
    this.fortschrittSubject.next({ gesamt: 0, fertig: 0, fehler: 0, laeuftGerade: false, aktuelleDatei: null });
  }

  private async sammleAlleUrls(): Promise<string[]> {
    const urls = new Set<string>();
    urls.add('assets/themenquiz/topics.json');

    try {
      const topics = (await fetch('assets/themenquiz/topics.json').then(r => r.json())) as TopicMeta[];
      for (const t of topics) urls.add(`assets/themenquiz/${t.topicId}.json`);
    } catch {
      // Themenquiz-Liste konnte nicht geladen werden -- Rest trotzdem versuchen
    }

    urls.add('assets/zusatz/gesamtquiz/gesamtquiz-alle-module.json');
    urls.add('assets/zusatz/volumen/quiz.json');
    urls.add('assets/zusatz/prozentrechnung/quiz.json');
    urls.add('assets/zusatz/nivellieren/quiz.json');

    for (const bild of lokaleKachelBilder()) urls.add(bild);

    try {
      const eintraege = (await fetch('assets/bilder/bildnachweise.json').then(r => r.json())) as BildEintrag[];
      for (const e of eintraege) if (e.file?.startsWith('http')) urls.add(e.file);
    } catch {
      // Bildnachweise nicht ladbar -- Wikimedia-Bilder werden dann nicht vorab gecacht
    }

    return [...urls];
  }

  private geladeneUrls(): Set<string> {
    try {
      const raw = localStorage.getItem(URLS_KEY);
      return new Set(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      return new Set();
    }
  }

  private speichereGeladeneUrls(urls: Set<string>): void {
    try {
      localStorage.setItem(URLS_KEY, JSON.stringify([...urls]));
    } catch {
      // localStorage voll oder nicht verfuegbar -- Fortschritt wird dann bei erneutem Start nicht erkannt
    }
  }

  private kurzname(url: string): string {
    const teile = url.split('/');
    return decodeURIComponent(teile[teile.length - 1] ?? url);
  }
}
