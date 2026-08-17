import { Component } from '@angular/core';

/**
 * Kennwerte der drei Schienenprofile.
 *
 * ACHTUNG — Datenlage: Gesichert und allgemein bekannt sind die
 * Gesamthoehen (49E5 = 149 mm, 54E4 = 161 mm, 60E2 = 172 mm) sowie die
 * Messtiefe von 14 mm unter Schienenoberkante fuer den Seitenverschleiss.
 * Die uebrigen Werte (Fuss-/Kopfbreite, Stegdicke, Fuss-/Kopfhoehe) dienen
 * hier NUR dem massstaeblichen Zeichnen des Querschnitts und sind
 * vereinfacht. Bevor sie als Lehrinhalt ausgegeben werden, gegen
 * EN 13674-1 bzw. die DB-Regelwerke pruefen.
 */
interface Profil {
  id: ProfilId;
  hoehe: number;
  fussBreite: number;
  kopfBreite: number;
  stegDicke: number;
  fussHoehe: number;
  kopfHoehe: number;
}

type ProfilId = '49E5' | '54E4' | '60E2';

const PROFILE: Profil[] = [
  { id: '49E5', hoehe: 149, fussBreite: 125, kopfBreite: 67, stegDicke: 14, fussHoehe: 25, kopfHoehe: 40 },
  { id: '54E4', hoehe: 161, fussBreite: 125, kopfBreite: 67, stegDicke: 16, fussHoehe: 26, kopfHoehe: 42 },
  { id: '60E2', hoehe: 172, fussBreite: 150, kopfBreite: 72, stegDicke: 16.5, fussHoehe: 32, kopfHoehe: 45 },
];

/** Seitenverschleiss wird 14 mm unter Schienenoberkante gemessen. */
const MESSTIEFE_MM = 14;

/** Toleranz, ab der der Messfuehler als "auf Kontakt" gilt. */
const KONTAKT_TOLERANZ_MM = 0.3;

@Component({
  selector: 'app-schienenmesser',
  templateUrl: './schienenmesser.page.html',
  styleUrls: ['./schienenmesser.page.scss'],
  standalone: false,
})
export class SchienenmesserPage {
  readonly profile = PROFILE;
  readonly profilIds: ProfilId[] = ['49E5', '54E4', '60E2'];
  readonly messtiefe = MESSTIEFE_MM;
  readonly maxFuehlerweg = 20;

  /** Das Profil der Schiene, die gerade vermessen wird. */
  schienenProfil: ProfilId = '60E2';

  /** Einstellungen am Geraet — muessen zum Schienenprofil passen. */
  lehreEinstellung: ProfilId = '60E2';
  latteEinstellung: ProfilId = '60E2';

  /** Tatsaechlicher Verschleiss der aktuellen Schiene (mm). */
  hoehenverschleiss = 0;
  seitenverschleiss = 0;

  /** Zustellung der beiden Messfuehler (mm), vom Nutzer eingestellt. */
  fuehlerHoehe = 0;
  fuehlerSeite = 0;

  aufgeloest = false;

  constructor() {
    this.neueSchiene();
  }

  get profil(): Profil {
    return PROFILE.find((p) => p.id === this.schienenProfil) ?? PROFILE[2];
  }

  /** Das Geraet misst nur richtig, wenn beide Einstellungen zum Profil passen. */
  get geraetPasst(): boolean {
    return this.lehreEinstellung === this.schienenProfil && this.latteEinstellung === this.schienenProfil;
  }

  get kontaktHoehe(): boolean {
    return Math.abs(this.fuehlerHoehe - this.hoehenverschleiss) <= KONTAKT_TOLERANZ_MM;
  }

  get kontaktSeite(): boolean {
    return Math.abs(this.fuehlerSeite - this.seitenverschleiss) <= KONTAKT_TOLERANZ_MM;
  }

  /**
   * Solange der Fuehler noch nicht anliegt, zeigt das Geraet nichts an —
   * genau wie in echt, wo man erst bis zum Anschlag zustellt und dann abliest.
   */
  get ablesungHoehe(): number | null {
    return this.kontaktHoehe ? this.fuehlerHoehe : null;
  }

  get ablesungSeite(): number | null {
    return this.kontaktSeite ? this.fuehlerSeite : null;
  }

  /** Restkopfhoehe = Nennhoehe minus abgefahrener Hoehenverschleiss. */
  get restHoehe(): number {
    return this.profil.hoehe - this.hoehenverschleiss;
  }

  neueSchiene(): void {
    this.schienenProfil = this.profilIds[Math.floor(Math.random() * this.profilIds.length)];
    this.hoehenverschleiss = Math.round(Math.random() * 120) / 10;
    this.seitenverschleiss = Math.round(Math.random() * 140) / 10;
    this.fuehlerHoehe = 0;
    this.fuehlerSeite = 0;
    this.aufgeloest = false;
  }

  aufloesen(): void {
    this.aufgeloest = true;
  }

  onLehre(id: ProfilId): void {
    this.lehreEinstellung = id;
  }

  onLatte(id: ProfilId): void {
    this.latteEinstellung = id;
  }

  onFuehlerHoehe(event: Event): void {
    this.fuehlerHoehe = this.leseRange(event);
  }

  onFuehlerSeite(event: Event): void {
    this.fuehlerSeite = this.leseRange(event);
  }

  // ---------------------------------------------------------------------
  // Zeichnung. Alle Werte in mm, das SVG nutzt dieselben Einheiten
  // (viewBox), damit die Geometrie direkt aus den Profildaten faellt.
  // ---------------------------------------------------------------------

  /** Umriss des unverschlissenen Profils (Nennmass). */
  get pfadNenn(): string {
    return this.baueUmriss(0, 0);
  }

  /** Umriss der abgefahrenen Schiene. */
  get pfadVerschlissen(): string {
    return this.baueUmriss(this.hoehenverschleiss, this.seitenverschleiss);
  }

  /** y-Position der Schienenoberkante im SVG (y zeigt nach unten). */
  get svgOberkante(): number {
    return 0;
  }

  get svgHoehe(): number {
    return this.profil.hoehe;
  }

  get svgBreite(): number {
    return this.profil.fussBreite;
  }

  /** Spitze des Hoehen-Messfuehlers: faehrt von oben auf den Kopf zu. */
  get fuehlerHoeheY(): number {
    return this.fuehlerHoehe;
  }

  /** Spitze des Seiten-Messfuehlers: faehrt von rechts auf die Fahrkante zu. */
  get fuehlerSeiteX(): number {
    return this.profil.kopfBreite / 2 - this.fuehlerSeite;
  }

  get messtiefeY(): number {
    return MESSTIEFE_MM;
  }

  /**
   * Ausschnitt fuer die Kopf-Detailansicht. Der Verschleiss liegt im
   * Millimeterbereich und waere in der Gesamtansicht kaum zu sehen.
   */
  get detailViewBox(): string {
    const p = this.profil;
    const halbe = p.kopfBreite / 2;
    const x = -halbe - 14;
    const breite = p.kopfBreite + 46;
    const hoehe = p.kopfHoehe + 16;
    return `${x} -10 ${breite} ${hoehe}`;
  }

  private leseRange(event: Event): number {
    const wert = Number((event.target as HTMLInputElement).value);
    return Math.round(wert * 10) / 10;
  }

  /**
   * Baut den Schienenquerschnitt als Pfad. `hv` senkt die Fahrflaeche ab,
   * `sv` nimmt die Fahrkante (rechte Kopfseite) zurueck — so entsteht aus
   * demselben Code das Nenn- und das Verschleissprofil.
   */
  private baueUmriss(hv: number, sv: number): string {
    const p = this.profil;
    const halbFuss = p.fussBreite / 2;
    const halbSteg = p.stegDicke / 2;
    const halbKopfLinks = p.kopfBreite / 2;
    const halbKopfRechts = p.kopfBreite / 2 - sv;

    // y = 0 ist die Nenn-Oberkante, y waechst nach unten bis zur Fussunterkante.
    const yOben = hv;
    const yKopfUnten = p.kopfHoehe;
    const yStegOben = p.kopfHoehe + 6;
    const yStegUnten = p.hoehe - p.fussHoehe;
    const yFussKante = p.hoehe - p.fussHoehe * 0.35;
    const yUnten = p.hoehe;

    return [
      `M ${-halbKopfLinks + 6} ${yOben}`,
      `L ${halbKopfRechts - 6} ${yOben}`,
      `L ${halbKopfRechts} ${yOben + 6}`,
      `L ${halbKopfRechts} ${yKopfUnten}`,
      `L ${halbSteg} ${yStegOben}`,
      `L ${halbSteg} ${yStegUnten}`,
      `L ${halbFuss} ${yFussKante}`,
      `L ${halbFuss} ${yUnten}`,
      `L ${-halbFuss} ${yUnten}`,
      `L ${-halbFuss} ${yFussKante}`,
      `L ${-halbSteg} ${yStegUnten}`,
      `L ${-halbSteg} ${yStegOben}`,
      `L ${-halbKopfLinks} ${yKopfUnten}`,
      `L ${-halbKopfLinks} ${yOben + 6}`,
      'Z',
    ].join(' ');
  }
}
