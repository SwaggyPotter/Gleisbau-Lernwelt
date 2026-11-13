/**
 * Eigene Show-Klänge, komplett im Browser erzeugt (Web Audio) – keine fremde Musik.
 * Eröffnung, Metronom-Ticken beim Vorlesen, Spannungs-Wirbel, Klacken beim Umlauf, Erfolgsakkord.
 */
export class ShowTon {
  private ctx?: AudioContext;
  private master?: GainNode;
  private tickTimer?: ReturnType<typeof setInterval>;
  private tickNr = 0;
  private spannungQuellen: AudioScheduledSourceNode[] = [];
  an = true;

  /** Muss aus einem Klick heraus aufgerufen werden (Autoplay-Regel der Browser). */
  freischalten(): void {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.8;
      const komp = this.ctx.createDynamicsCompressor();
      this.master.connect(komp).connect(this.ctx.destination);
    }
    void this.ctx.resume();
  }

  get bereit(): boolean {
    return !!this.ctx && this.ctx.state === 'running' && this.an;
  }

  // ---------- Bausteine ----------

  private ton(freq: number, start: number, dauer: number, opt: { typ?: OscillatorType; laut?: number; attack?: number; zu?: number; filter?: number } = {}): void {
    const c = this.ctx!;
    const o = c.createOscillator();
    o.type = opt.typ ?? 'sine';
    o.frequency.setValueAtTime(freq, start);
    if (opt.zu) o.frequency.exponentialRampToValueAtTime(opt.zu, start + dauer);
    const g = c.createGain();
    const laut = opt.laut ?? 0.3;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(laut, start + (opt.attack ?? 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, start + dauer);
    let kette: AudioNode = o;
    if (opt.filter) {
      const f = c.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = opt.filter;
      o.connect(f);
      kette = f;
    }
    kette.connect(g).connect(this.master!);
    o.start(start);
    o.stop(start + dauer + 0.05);
  }

  private rauschen(start: number, dauer: number, opt: { laut?: number; band?: number; q?: number; bandZu?: number; attack?: number } = {}): AudioBufferSourceNode {
    const c = this.ctx!;
    const len = Math.max(1, Math.floor(c.sampleRate * dauer));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const q = c.createBufferSource();
    q.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(opt.band ?? 1000, start);
    if (opt.bandZu) f.frequency.exponentialRampToValueAtTime(opt.bandZu, start + dauer);
    f.Q.value = opt.q ?? 1;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(opt.laut ?? 0.3, start + (opt.attack ?? 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, start + dauer);
    q.connect(f).connect(g).connect(this.master!);
    q.start(start);
    return q;
  }

  private pauke(start: number, laut = 0.6): void {
    this.ton(110, start, 0.6, { laut, zu: 45 });
    this.rauschen(start, 0.15, { laut: laut * 0.3, band: 300 });
  }

  // ---------- Klänge ----------

  /** Eröffnung vor jeder Frage: tiefer Schlag, aufsteigende Moll-Figur, Schimmer. */
  eroeffnung(final = false): void {
    if (!this.bereit) return;
    this.tickStop();
    const t = this.ctx!.currentTime + 0.05;
    this.pauke(t, 0.7);
    const grund = final ? 146.83 : 130.81; // D3 bzw. C3
    const stufen = [1, 1.189, 1.498, 2, 2.378, 2.997];
    stufen.forEach((s, i) => this.ton(grund * 2 * s, t + 0.12 + i * 0.11, 1.4 - i * 0.12, { typ: 'sawtooth', laut: 0.09, filter: 2200, attack: 0.03 }));
    [1, 1.498, 2].forEach(s => this.ton(grund * s, t + 0.8, 2.2, { typ: 'triangle', laut: 0.16, attack: 0.25 }));
    this.rauschen(t + 0.8, 1.6, { laut: 0.05, band: 7000, q: 0.7, attack: 0.4 });
    this.pauke(t + 0.8, 0.5);
  }

  /** Metronom beim Vorlesen: abwechselnd hell/dunkel klacken, dazu ein leiser tiefer Puls. */
  tickStart(): void {
    if (!this.bereit || this.tickTimer) return;
    this.tickNr = 0;
    const takt = () => {
      if (!this.bereit) return;
      const t = this.ctx!.currentTime + 0.02;
      const hell = this.tickNr % 2 === 0;
      this.ton(hell ? 1760 : 1320, t, 0.05, { typ: 'square', laut: 0.05, filter: 4000, attack: 0.002 });
      this.rauschen(t, 0.03, { laut: 0.06, band: hell ? 3500 : 2500, q: 4, attack: 0.001 });
      if (this.tickNr % 4 === 0) this.ton(55, t, 1.1, { laut: 0.18, attack: 0.05 });
      if (this.tickNr % 8 === 4) this.ton(65.4, t, 1.1, { laut: 0.14, attack: 0.05 });
      this.tickNr++;
    };
    takt();
    this.tickTimer = setInterval(takt, 560);
  }

  tickStop(): void {
    if (this.tickTimer) clearInterval(this.tickTimer);
    this.tickTimer = undefined;
  }

  get tickt(): boolean {
    return !!this.tickTimer;
  }

  /** Antwort eingeblendet: kurzer heller Akzent. */
  einblenden(): void {
    if (!this.bereit) return;
    const t = this.ctx!.currentTime + 0.01;
    this.ton(880, t, 0.25, { typ: 'triangle', laut: 0.12 });
    this.ton(1318.5, t + 0.04, 0.3, { typ: 'sine', laut: 0.08 });
  }

  /** „Und die richtige Antwort ist …“: Wirbel, der anschwillt, mit steigendem Ton. */
  spannung(): void {
    if (!this.bereit) return;
    this.tickStop();
    this.spannungStop();
    const t = this.ctx!.currentTime + 0.05;
    const dauer = 3.2;
    this.spannungQuellen.push(this.rauschen(t, dauer, { laut: 0.22, band: 250, bandZu: 2400, q: 1.2, attack: dauer * 0.9 }));
    for (let i = 0; i < 40; i++) {
      const zeit = t + (i / 40) * dauer;
      this.rauschen(zeit, 0.06, { laut: 0.04 + (i / 40) * 0.14, band: 180, q: 0.8 });
    }
    this.ton(98, t, dauer, { typ: 'sawtooth', laut: 0.08, zu: 196, filter: 900, attack: dauer * 0.8 });
    this.ton(146.8, t, dauer, { typ: 'sawtooth', laut: 0.05, zu: 293.7, filter: 900, attack: dauer * 0.8 });
  }

  spannungStop(): void {
    this.spannungQuellen.forEach(q => { try { q.stop(); } catch { /* schon zu Ende */ } });
    this.spannungQuellen = [];
  }

  /** Klack beim Umlauf um die Antworten. */
  klack(hoch = false): void {
    if (!this.bereit) return;
    const t = this.ctx!.currentTime + 0.005;
    this.ton(hoch ? 1500 : 1100, t, 0.06, { typ: 'square', laut: 0.06, filter: 3000, attack: 0.002 });
    this.rauschen(t, 0.04, { laut: 0.1, band: 2000, q: 3, attack: 0.001 });
  }

  /** Richtige Antwort: Schlag + heller Dur-Akkord + Glitzer. */
  richtig(): void {
    if (!this.bereit) return;
    this.spannungStop();
    const t = this.ctx!.currentTime + 0.02;
    this.pauke(t, 0.7);
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.ton(f, t + i * 0.03, 2.2, { typ: 'triangle', laut: 0.14, attack: 0.02 }));
    [261.63, 392].forEach(f => this.ton(f, t, 2.4, { typ: 'sawtooth', laut: 0.06, filter: 1800, attack: 0.02 }));
    for (let i = 0; i < 8; i++) this.ton(2093 * (1 + (i % 3) * 0.25), t + 0.2 + i * 0.07, 0.25, { laut: 0.04 });
  }

  /** Schluss bzw. Finalrunde-Ansage. */
  fanfare(): void {
    if (!this.bereit) return;
    this.tickStop();
    const t = this.ctx!.currentTime + 0.05;
    const folge = [392, 523.25, 659.25, 783.99];
    folge.forEach((f, i) => this.ton(f, t + i * 0.16, 0.5, { typ: 'sawtooth', laut: 0.1, filter: 2600 }));
    [523.25, 659.25, 783.99, 1046.5].forEach(f => this.ton(f, t + 0.7, 2, { typ: 'triangle', laut: 0.12, attack: 0.05 }));
    this.pauke(t + 0.7, 0.7);
  }

  // ---------- Hintergrund-Atmosphäre (Tim, 2026-11-12) ----------
  private ambiente?: { quellen: AudioScheduledSourceNode[]; gain: GainNode; timer: ReturnType<typeof setInterval> };

  /** Leiser dunkler Klangteppich mit sanftem „Ding“-Puls – läuft, solange kein Fragen-Sound spielt. */
  ambienteStart(): void {
    if (!this.bereit || this.ambiente) return;
    const c = this.ctx!;
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.0001, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.5, c.currentTime + 2.5); // weich einblenden
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 520;
    filter.connect(gain).connect(this.master!);
    const quellen: AudioScheduledSourceNode[] = [];
    // Teppich: tiefe, leicht verstimmte Töne (A-Moll-Farbe), langsam atmend
    [[55, 'sawtooth', 0.05], [55.4, 'sawtooth', 0.05], [82.4, 'triangle', 0.06], [130.8, 'sine', 0.035]].forEach(([f, typ, laut]) => {
      const o = c.createOscillator();
      o.type = typ as OscillatorType;
      o.frequency.value = f as number;
      const g = c.createGain();
      g.gain.value = laut as number;
      o.connect(g).connect(filter);
      o.start();
      quellen.push(o);
    });
    const lfo = c.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoTiefe = c.createGain();
    lfoTiefe.gain.value = 180;
    lfo.connect(lfoTiefe).connect(filter.frequency);
    lfo.start();
    quellen.push(lfo);
    // Puls: leises, glockiges „Ding“ (wie ein ruhiges Metronom)
    let nr = 0;
    const ding = () => {
      if (!this.bereit) return;
      const t = c.currentTime + 0.02;
      const f = nr % 4 === 3 ? 659.25 : 880;
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.05, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
      o.connect(g).connect(gain);
      o.start(t);
      o.stop(t + 1.5);
      nr++;
    };
    const timer = setInterval(ding, 1500);
    this.ambiente = { quellen, gain, timer };
  }

  ambienteStopp(): void {
    const a = this.ambiente;
    if (!a || !this.ctx) { this.ambiente = undefined; return; }
    this.ambiente = undefined;
    clearInterval(a.timer);
    const t = this.ctx.currentTime;
    a.gain.gain.cancelScheduledValues(t);
    a.gain.gain.setValueAtTime(Math.max(0.0001, a.gain.gain.value), t);
    a.gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6); // kurz ausblenden
    a.quellen.forEach(q => { try { q.stop(t + 0.7); } catch { /* egal */ } });
  }

  get ambienteLaeuft(): boolean {
    return !!this.ambiente;
  }

  // ---------- Countdown ----------
  countdownTick(rest: number): void {
    if (!this.bereit) return;
    const t = this.ctx!.currentTime + 0.01;
    const f = rest <= 3 ? 1046.5 : 784;
    this.ton(f, t, 0.18, { typ: 'square', laut: 0.07, filter: 3000, attack: 0.003 });
  }

  zeitAus(): void {
    if (!this.bereit) return;
    const t = this.ctx!.currentTime + 0.01;
    this.pauke(t, 0.6);
    [196, 233.08, 293.66].forEach(f => this.ton(f, t, 1.6, { typ: 'sawtooth', laut: 0.09, filter: 1400, attack: 0.01 }));
  }

  alleStopp(): void {
    this.tickStop();
    this.spannungStop();
    this.ambienteStopp();
  }
}
