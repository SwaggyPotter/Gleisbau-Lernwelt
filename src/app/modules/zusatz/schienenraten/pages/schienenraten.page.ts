import { Component } from '@angular/core';
import {
  KATEGORIEN,
  KategorieInfo,
  SchienenKategorie,
  PROFILE,
  SchienenProfil,
  schienenPfad,
  schienenViewBox,
  KATEGORIE_MUSTERMASSE,
  FORMEN_VIEWBOX,
} from '../../../../shared/schienenprofile';

type Modus = 'formen' | 'profil' | 'werte';

interface FormenKarte {
  kategorie: KategorieInfo;
  pfad: string;
  antwort: KategorieInfo | null;
}

interface FormenRunde {
  karten: FormenKarte[];
  optionen: KategorieInfo[];
  ausgewaehlteKarte: number | null;
}

interface ProfilRunde {
  profil: SchienenProfil;
  pfad: string;
  viewBox: string;
  optionen: SchienenProfil[];
}

interface WerteEingabe {
  hoehe: number | null;
  fussbreite: number | null;
  kopfbreite: number | null;
  steg: number | null;
}

interface WerteErgebnis {
  hoehe: boolean;
  fussbreite: boolean;
  kopfbreite: boolean;
  steg: boolean;
}

@Component({
  selector: 'app-schienenraten',
  templateUrl: './schienenraten.page.html',
  styleUrls: ['./schienenraten.page.scss'],
  standalone: false,
})
export class SchienenratenPage {
  readonly kategorien = KATEGORIEN;

  modus: Modus = 'formen';

  punkte: Record<Modus, { richtig: number; versuche: number }> = {
    formen: { richtig: 0, versuche: 0 },
    profil: { richtig: 0, versuche: 0 },
    werte: { richtig: 0, versuche: 0 },
  };

  readonly formenViewBox = FORMEN_VIEWBOX;
  formenRunde!: FormenRunde;

  profilRunde!: ProfilRunde;
  profilAntwort: SchienenProfil | null = null;

  werteProfil!: SchienenProfil;
  wertePfad = '';
  werteViewBox = '';
  werteEingabe: WerteEingabe = { hoehe: null, fussbreite: null, kopfbreite: null, steg: null };
  werteAusgewertet = false;
  werteErgebnis: WerteErgebnis = { hoehe: false, fussbreite: false, kopfbreite: false, steg: false };

  constructor() {
    this.neueFormenRunde();
    this.neueProfilRunde();
    this.neueWerteRunde();
  }

  setModus(modus: Modus): void {
    this.modus = modus;
  }

  // ---------------- Modus 1: Form erkennen ----------------

  neueFormenRunde(): void {
    const reihenfolge = this.mische(this.kategorien);
    this.formenRunde = {
      karten: reihenfolge.map((kategorie) => {
        const masse = KATEGORIE_MUSTERMASSE[kategorie.id];
        return {
          kategorie,
          pfad: schienenPfad(kategorie.id, masse.hoehe, masse.fussbreite, masse.kopfbreite, masse.steg),
          antwort: null,
        };
      }),
      optionen: this.mische(this.kategorien),
      ausgewaehlteKarte: null,
    };
  }

  waehleKarte(index: number): void {
    if (this.formenRunde.karten[index].antwort) return;
    this.formenRunde.ausgewaehlteKarte = index;
  }

  waehleFormOption(option: KategorieInfo): void {
    const index = this.formenRunde.ausgewaehlteKarte;
    if (index === null) return;
    const karte = this.formenRunde.karten[index];
    if (karte.antwort) return;
    karte.antwort = option;
    this.punkte.formen.versuche++;
    if (option.id === karte.kategorie.id) this.punkte.formen.richtig++;
    this.formenRunde.ausgewaehlteKarte = null;
  }

  get formenAlleFertig(): boolean {
    return this.formenRunde.karten.every((k) => k.antwort !== null);
  }

  // ---------------- Modus 2: Profil erraten ----------------

  neueProfilRunde(): void {
    const profil = PROFILE[Math.floor(Math.random() * PROFILE.length)];
    const optionen = this.mische([profil, ...this.waehleProfilDistraktoren(profil)]);
    this.profilRunde = {
      profil,
      pfad: schienenPfad(profil.kategorie, profil.hoeheMm, profil.fussbreiteMm, profil.kopfbreiteMm, profil.stegstaerkeMm),
      viewBox: schienenViewBox(profil.hoeheMm, profil.fussbreiteMm, profil.kopfbreiteMm),
      optionen,
    };
    this.profilAntwort = null;
  }

  waehleProfil(option: SchienenProfil): void {
    if (this.profilAntwort) return;
    this.profilAntwort = option;
    this.punkte.profil.versuche++;
    if (option.id === this.profilRunde.profil.id) this.punkte.profil.richtig++;
  }

  profilLabel(p: SchienenProfil): string {
    return p.nameNeu ? `${p.nameAlt} (${p.nameNeu})` : p.nameAlt;
  }

  private waehleProfilDistraktoren(korrekt: SchienenProfil): SchienenProfil[] {
    const gleicheKategorie = this.mische(PROFILE.filter((p) => p.kategorie === korrekt.kategorie && p.id !== korrekt.id));
    const gewaehlt = gleicheKategorie.slice(0, 3);
    if (gewaehlt.length < 3) {
      const idsBelegt = new Set([korrekt.id, ...gewaehlt.map((p) => p.id)]);
      const rest = this.mische(PROFILE.filter((p) => !idsBelegt.has(p.id)));
      gewaehlt.push(...rest.slice(0, 3 - gewaehlt.length));
    }
    return gewaehlt;
  }

  // ---------------- Modus 3: Werte eintragen ----------------

  neueWerteRunde(): void {
    this.werteProfil = PROFILE[Math.floor(Math.random() * PROFILE.length)];
    const p = this.werteProfil;
    this.wertePfad = schienenPfad(p.kategorie, p.hoeheMm, p.fussbreiteMm, p.kopfbreiteMm, p.stegstaerkeMm);
    this.werteViewBox = schienenViewBox(p.hoeheMm, p.fussbreiteMm, p.kopfbreiteMm);
    this.werteEingabe = { hoehe: null, fussbreite: null, kopfbreite: null, steg: null };
    this.werteAusgewertet = false;
  }

  pruefeWerte(): void {
    if (this.werteAusgewertet) return;
    const p = this.werteProfil;
    const passt = (eingabe: number | null, real: number): boolean => {
      if (eingabe === null || isNaN(eingabe)) return false;
      const toleranz = Math.max(2, real * 0.08);
      return Math.abs(eingabe - real) <= toleranz;
    };
    this.werteErgebnis = {
      hoehe: passt(this.werteEingabe.hoehe, p.hoeheMm),
      fussbreite: passt(this.werteEingabe.fussbreite, p.fussbreiteMm),
      kopfbreite: passt(this.werteEingabe.kopfbreite, p.kopfbreiteMm),
      steg: passt(this.werteEingabe.steg, p.stegstaerkeMm),
    };
    this.werteAusgewertet = true;
    this.punkte.werte.versuche++;
    if (this.werteAlleRichtig) this.punkte.werte.richtig++;
  }

  get werteAlleRichtig(): boolean {
    return this.werteErgebnis.hoehe && this.werteErgebnis.fussbreite && this.werteErgebnis.kopfbreite && this.werteErgebnis.steg;
  }

  onWerteInput(feld: keyof WerteEingabe, event: Event): void {
    const roh = (event.target as HTMLInputElement).value;
    const zahl = parseFloat(roh.replace(',', '.'));
    this.werteEingabe[feld] = isNaN(zahl) ? null : zahl;
  }

  kategorieName(id: SchienenKategorie): string {
    return this.kategorien.find((k) => k.id === id)?.name ?? id;
  }

  private mische<T>(arr: readonly T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}
