import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SkizzenTyp } from '../kern/typen';

/**
 * Eigene, neu gezeichnete Skizzen (SVG) zu den Formelsammlung-Apps.
 * Farben kommen aus dem Theme (--fs-*), damit alle Designs funktionieren.
 */
@Component({
  selector: 'fs-skizze',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
  template: `
<div class="fs-skizze" [ngSwitch]="typ">
  <svg class="fs-svg" viewBox="0 0 400 210" role="img" [attr.aria-label]="titel">
    <defs>
      <marker id="fs-pfeil" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" class="fs-d-pfeilkopf"/>
      </marker>
    </defs>

    <!-- APP 1: Pfeilhöhe -->
    <g *ngSwitchCase="'pfeilhoehe'">
      <path d="M40,150 A260.2,260.2 0 0 1 360,150" class="fs-d-curve"/>
      <line x1="40" y1="150" x2="360" y2="150" class="fs-d-base"/>
      <circle cx="40" cy="150" r="3.5" class="fs-d-punkt"/><circle cx="360" cy="150" r="3.5" class="fs-d-punkt"/>
      <ng-container *ngIf="variante !== 'ab'">
        <line x1="200" y1="150" x2="200" y2="95" class="fs-d-mass" marker-start="url(#fs-pfeil)" marker-end="url(#fs-pfeil)"/>
        <text x="208" y="128" class="fs-d-label accent">h<tspan baseline-shift="sub" font-size="10">f</tspan></text>
        <line x1="40" y1="176" x2="360" y2="176" class="fs-d-mass" marker-start="url(#fs-pfeil)" marker-end="url(#fs-pfeil)"/>
        <text x="200" y="196" text-anchor="middle" class="fs-d-label">l<tspan baseline-shift="sub" font-size="10">s</tspan> (Sehne)</text>
        <text x="120" y="168" text-anchor="middle" class="fs-d-klein">l<tspan baseline-shift="sub" font-size="8">s</tspan>/2</text>
        <text x="280" y="168" text-anchor="middle" class="fs-d-klein">l<tspan baseline-shift="sub" font-size="8">s</tspan>/2</text>
      </ng-container>
      <ng-container *ngIf="variante === 'ab'">
        <line x1="130" y1="150" x2="130" y2="104.4" class="fs-d-mass" marker-start="url(#fs-pfeil)" marker-end="url(#fs-pfeil)"/>
        <text x="138" y="133" class="fs-d-label accent">h<tspan baseline-shift="sub" font-size="10">f</tspan></text>
        <line x1="40" y1="176" x2="130" y2="176" class="fs-d-mass" marker-start="url(#fs-pfeil)" marker-end="url(#fs-pfeil)"/>
        <line x1="130" y1="176" x2="360" y2="176" class="fs-d-mass" marker-start="url(#fs-pfeil)" marker-end="url(#fs-pfeil)"/>
        <text x="85" y="196" text-anchor="middle" class="fs-d-label">a</text>
        <text x="245" y="196" text-anchor="middle" class="fs-d-label">b</text>
        <circle cx="130" cy="150" r="3.5" class="fs-d-punkt2"/>
      </ng-container>
      <line x1="200" y1="95" x2="200" y2="20" class="fs-d-hilfe"/>
      <text x="206" y="34" class="fs-d-klein">zum Kreismittelpunkt (r)</text>
      <text x="300" y="104" class="fs-d-label">Gleisachse</text>
    </g>

    <!-- APP 2: Kreisbogen von der x-Achse -->
    <g *ngSwitchCase="'kreisbogen'">
      <line x1="30" y1="40" x2="385" y2="40" class="fs-d-base"/>
      <text x="385" y="30" text-anchor="end" class="fs-d-klein">x-Achse = Tangente</text>
      <path d="M40,40 A300,300 0 0 1 300,190.3" class="fs-d-curve"/>
      <circle cx="40" cy="40" r="4" class="fs-d-punkt"/>
      <text x="40" y="60" text-anchor="middle" class="fs-d-label">BA</text>
      <line x1="40" y1="20" x2="200" y2="20" class="fs-d-mass" marker-start="url(#fs-pfeil)" marker-end="url(#fs-pfeil)"/>
      <text x="120" y="15" text-anchor="middle" class="fs-d-label">x</text>
      <line x1="200" y1="40" x2="200" y2="86.2" class="fs-d-mass" marker-start="url(#fs-pfeil)" marker-end="url(#fs-pfeil)"/>
      <text x="207" y="68" class="fs-d-label accent">y</text>
      <circle cx="200" cy="86.2" r="3.5" class="fs-d-punkt2"/>
      <line x1="200" y1="86.2" x2="146.7" y2="170.8" class="fs-d-hilfe"/>
      <text x="160" y="140" class="fs-d-label">r</text>
      <text x="300" y="175" text-anchor="end" class="fs-d-klein">Gleisbogen</text>
      <text x="30" y="200" class="fs-d-klein">Näherung nur bis x = r/10</text>
    </g>

    <!-- APP 4: Ausrundung (Kuppe oder Wanne) -->
    <g *ngSwitchCase="'ausrundung'">
      <line x1="20" [attr.y1]="Y(150)" x2="200" [attr.y2]="Y(60)" class="fs-d-tangente"/>
      <line x1="200" [attr.y1]="Y(60)" x2="380" [attr.y2]="Y(130)" class="fs-d-tangente"/>
      <path [attr.d]="'M110,' + Y(105) + ' Q200,' + Y(60) + ' 290,' + Y(95)" class="fs-d-curve"/>
      <line x1="20" [attr.y1]="Y(150)" x2="110" [attr.y2]="Y(105)" class="fs-d-base"/>
      <line x1="290" [attr.y1]="Y(95)" x2="380" [attr.y2]="Y(130)" class="fs-d-base"/>
      <circle cx="200" [attr.cy]="Y(60)" r="4" class="fs-d-punkt"/>
      <circle cx="110" [attr.cy]="Y(105)" r="3.5" class="fs-d-punkt2"/>
      <circle cx="290" [attr.cy]="Y(95)" r="3.5" class="fs-d-punkt2"/>
      <text x="200" [attr.y]="Y(60) + (wanne ? 20 : -10)" text-anchor="middle" class="fs-d-label">TS</text>
      <text x="104" [attr.y]="Y(105) + (wanne ? -10 : 20)" text-anchor="middle" class="fs-d-label">AA</text>
      <text x="296" [attr.y]="Y(95) + (wanne ? -10 : 20)" text-anchor="middle" class="fs-d-label">AE</text>
      <line x1="200" [attr.y1]="Y(60)" x2="200" [attr.y2]="Y(80)" class="fs-d-mass"/>
      <text x="206" [attr.y]="Y(72) + 4" class="fs-d-klein accent">y<tspan baseline-shift="sub" font-size="8">max</tspan></text>
      <text x="148" [attr.y]="Y(78) + (wanne ? 16 : -6)" text-anchor="middle" class="fs-d-klein">l<tspan baseline-shift="sub" font-size="8">ta</tspan></text>
      <text x="248" [attr.y]="Y(78) + (wanne ? 16 : -6)" text-anchor="middle" class="fs-d-klein">l<tspan baseline-shift="sub" font-size="8">ta</tspan></text>
      <text x="50" [attr.y]="Y(128) + (wanne ? 18 : -8)" class="fs-d-label">s<tspan baseline-shift="sub" font-size="10">1</tspan></text>
      <text x="345" [attr.y]="Y(117) + (wanne ? 18 : -8)" class="fs-d-label">s<tspan baseline-shift="sub" font-size="10">2</tspan></text>
      <line x1="110" [attr.y1]="Y(185)" x2="290" [attr.y2]="Y(185)" class="fs-d-mass" marker-start="url(#fs-pfeil)" marker-end="url(#fs-pfeil)"/>
      <text x="200" [attr.y]="Y(185) + (wanne ? -6 : 16)" text-anchor="middle" class="fs-d-klein">l<tspan baseline-shift="sub" font-size="8">a</tspan> ≈ 2 · l<tspan baseline-shift="sub" font-size="8">ta</tspan></text>
      <text x="380" [attr.y]="wanne ? 200 : 20" text-anchor="end" class="fs-d-label accent">{{ wanne ? 'Wanne' : 'Kuppe' }}</text>
      <text x="20" [attr.y]="wanne ? 200 : 20" class="fs-d-klein">Fahrtrichtung →</text>
    </g>

    <!-- APP 11: Überhöhung im Querschnitt -->
    <g *ngSwitchCase="'ueberhoehung'">
      <path d="M20,200 L70,160 L340,125 L390,180 L390,200 Z" class="fs-d-flaeche"/>
      <g transform="rotate(-7.6 200 150)">
        <rect x="-170" y="-6" width="340" height="12" transform="translate(200 150)" class="fs-d-schwelle"/>
        <rect x="-158" y="-20" width="16" height="14" transform="translate(200 150)" class="fs-d-schiene"/>
        <rect x="142" y="-20" width="16" height="14" transform="translate(200 150)" class="fs-d-schiene"/>
        <rect x="-115" y="-118" width="230" height="86" rx="10" transform="translate(200 150)" class="fs-d-fahrzeug"/>
        <circle cx="0" cy="-65" r="5" transform="translate(200 150)" class="fs-d-punkt"/>
      </g>
      <line x1="191.4" y1="85.6" x2="191.4" y2="140" class="fs-d-kraft" marker-end="url(#fs-pfeil)"/>
      <text x="178" y="132" text-anchor="end" class="fs-d-label">G</text>
      <line x1="191.4" y1="85.6" x2="262" y2="85.6" class="fs-d-kraft" marker-end="url(#fs-pfeil)"/>
      <text x="268" y="90" class="fs-d-label">F (Fliehkraft)</text>
      <line x1="40" y1="156" x2="385" y2="156" class="fs-d-hilfe"/>
      <line x1="378" y1="156" x2="378" y2="116.3" class="fs-d-mass" marker-start="url(#fs-pfeil)" marker-end="url(#fs-pfeil)"/>
      <text x="372" y="140" text-anchor="end" class="fs-d-label accent">u</text>
      <text x="22" y="150" class="fs-d-klein">Bogeninnen</text>
      <text x="390" y="104" text-anchor="end" class="fs-d-klein">Bogenaußen</text>
      <text x="200" y="198" text-anchor="middle" class="fs-d-klein">Stützweite ≈ 1500 mm</text>
    </g>

    <!-- ===== Ausbau 2026-11-09: Skizzen der restlichen Apps ===== -->

    <!-- APP 3: Übergangsbogen (kubische Parabel: Bézier mit gleichverteilten Stützpunkten = exakt y ~ x³) -->
    <g *ngSwitchCase="'uebergangsbogen'">
      <line x1="20" y1="50" x2="390" y2="50" class="fs-d-base"/>
      <text x="390" y="66" text-anchor="end" class="fs-d-klein">Tangente = x-Achse</text>
      <path d="M40,50 C126.7,50 213.3,50 300,150" class="fs-d-curve"/>
      <path d="M300,150 Q325,180 335,205" class="fs-d-tangente"/>
      <circle cx="40" cy="50" r="4" class="fs-d-punkt"/><text x="40" y="70" text-anchor="middle" class="fs-d-label">UA</text>
      <circle cx="300" cy="150" r="4" class="fs-d-punkt"/><text x="290" y="170" text-anchor="end" class="fs-d-label">UE</text>
      <text x="345" y="196" class="fs-d-klein">Kreisbogen r</text>
      <line x1="40" y1="34" x2="200" y2="34" class="fs-d-mass" marker-start="url(#fs-pfeil)" marker-end="url(#fs-pfeil)"/>
      <text x="120" y="29" text-anchor="middle" class="fs-d-label">x</text>
      <line x1="40" y1="14" x2="300" y2="14" class="fs-d-mass" marker-start="url(#fs-pfeil)" marker-end="url(#fs-pfeil)"/>
      <text x="250" y="10" text-anchor="middle" class="fs-d-klein">l<tspan baseline-shift="sub" font-size="8">ü</tspan></text>
      <line x1="200" y1="50" x2="200" y2="73.3" class="fs-d-mass" marker-start="url(#fs-pfeil)" marker-end="url(#fs-pfeil)"/>
      <circle cx="200" cy="73.3" r="3.5" class="fs-d-punkt2"/>
      <text x="207" y="68" class="fs-d-label accent">y</text>
      <text x="40" y="196" class="fs-d-klein">Krümmung wächst gleichmäßig von 0 auf 1/r</text>
    </g>

    <!-- APP 5: Gleisverziehung (S-Verziehung ohne Zwischengerade) -->
    <g *ngSwitchCase="'gleisverziehung'">
      <line x1="100" y1="70" x2="390" y2="70" class="fs-d-tangente"/>
      <text x="385" y="62" text-anchor="end" class="fs-d-klein">alte Gleisachse</text>
      <path d="M20,70 L100,70 C200,70 200,140 300,140 L390,140" class="fs-d-curve"/>
      <circle cx="100" cy="70" r="3.5" class="fs-d-punkt2"/><circle cx="200" cy="105" r="3.5" class="fs-d-punkt2"/><circle cx="300" cy="140" r="3.5" class="fs-d-punkt2"/>
      <text x="140" y="66" class="fs-d-klein">Bogen r</text>
      <text x="215" y="150" class="fs-d-klein">Gegenbogen r</text>
      <line x1="360" y1="70" x2="360" y2="140" class="fs-d-mass" marker-start="url(#fs-pfeil)" marker-end="url(#fs-pfeil)"/>
      <text x="366" y="110" class="fs-d-label accent">Δe</text>
      <line x1="100" y1="178" x2="300" y2="178" class="fs-d-mass" marker-start="url(#fs-pfeil)" marker-end="url(#fs-pfeil)"/>
      <text x="200" y="196" text-anchor="middle" class="fs-d-label">l<tspan baseline-shift="sub" font-size="10">vz</tspan></text>
      <text x="20" y="30" class="fs-d-klein">Jeder Bogen schafft Δe/2</text>
    </g>

    <!-- APP 6: Temperatur – freie Schiene dehnt sich, verschweißte Schiene bekommt Kraft -->
    <g *ngSwitchCase="'temperatur'">
      <text x="20" y="28" class="fs-d-klein">lose Schiene: dehnt sich frei</text>
      <rect x="40" y="42" width="260" height="18" class="fs-d-schiene"/>
      <rect x="300" y="42" width="34" height="18" class="fs-d-fahrzeug"/>
      <line x1="40" y1="76" x2="300" y2="76" class="fs-d-mass" marker-start="url(#fs-pfeil)" marker-end="url(#fs-pfeil)"/>
      <text x="170" y="92" text-anchor="middle" class="fs-d-label">l</text>
      <line x1="300" y1="76" x2="334" y2="76" class="fs-d-mass" marker-end="url(#fs-pfeil)"/>
      <text x="340" y="80" class="fs-d-label accent">Δl</text>
      <text x="20" y="124" class="fs-d-klein">verschweißte Schiene: darf nicht → Spannung σ, Kraft F</text>
      <rect x="30" y="134" width="10" height="44" class="fs-d-schwelle"/><rect x="340" y="134" width="10" height="44" class="fs-d-schwelle"/>
      <rect x="40" y="147" width="300" height="18" class="fs-d-schiene"/>
      <line x1="110" y1="184" x2="60" y2="184" class="fs-d-kraft" marker-end="url(#fs-pfeil)"/>
      <line x1="270" y1="184" x2="320" y2="184" class="fs-d-kraft" marker-end="url(#fs-pfeil)"/>
      <text x="190" y="203" text-anchor="middle" class="fs-d-klein">F = σ · A (Druck bei Erwärmung)</text>
      <text x="380" y="60" text-anchor="end" class="fs-d-klein accent">+ΔT</text>
    </g>

    <!-- Zusatz: Schienenausdehnungs-Rechner – Längenänderung einer frei liegenden Schiene -->
    <g *ngSwitchCase="'schienendehnung'">
      <ng-container *ngIf="variante !== 'luecke'">
        <line x1="36" y1="22" x2="36" y2="140" class="fs-d-base"/>
        <line *ngFor="let y of [30, 46, 62, 78, 94, 110, 126]" x1="36" [attr.y1]="y" x2="28" [attr.y2]="y + 8" class="fs-d-hilfe"/>
        <text x="44" y="22" class="fs-d-klein">vorher: Temperatur T₁</text>
        <rect x="40" y="30" width="260" height="16" class="fs-d-fahrzeug"/>
        <line x1="40" y1="62" x2="300" y2="62" class="fs-d-mass" marker-start="url(#fs-pfeil)" marker-end="url(#fs-pfeil)"/>
        <text x="170" y="80" text-anchor="middle" class="fs-d-label">l <tspan class="fs-d-klein">Ausgangslänge</tspan></text>
        <text x="44" y="106" class="fs-d-klein accent">nachher: um ΔT wärmer (T₂ = T₁ + ΔT)</text>
        <rect x="40" y="114" width="260" height="16" class="fs-d-schiene"/>
        <rect x="300" y="114" width="40" height="16" class="fs-d-schiene" opacity="0.5"/>
        <line x1="300" y1="26" x2="300" y2="70" class="fs-d-hilfe"/><line x1="300" y1="110" x2="300" y2="160" class="fs-d-hilfe"/>
        <line x1="340" y1="110" x2="340" y2="160" class="fs-d-hilfe"/>
        <line x1="300" y1="150" x2="340" y2="150" class="fs-d-mass" marker-start="url(#fs-pfeil)" marker-end="url(#fs-pfeil)"/>
        <text x="346" y="146" class="fs-d-label accent">Δl</text>
        <text x="346" y="162" class="fs-d-klein">Längen-</text>
        <text x="346" y="174" class="fs-d-klein">änderung</text>
        <text x="20" y="196" class="fs-d-klein">α = 11,5 · 10⁻⁶ 1/K (Stahl) · l in mm einsetzen → Δl in mm</text>
      </ng-container>

      <!-- Lückenschluss am Schienenstoß -->
      <ng-container *ngIf="variante === 'luecke'">
        <text x="20" y="20" class="fs-d-klein">beim Einbau: Temperatur T₁, Stoßlücke s₁</text>
        <rect x="20" y="28" width="170" height="16" class="fs-d-fahrzeug"/>
        <rect x="210" y="28" width="170" height="16" class="fs-d-fahrzeug"/>
        <line x1="20" y1="60" x2="188" y2="60" class="fs-d-mass" marker-start="url(#fs-pfeil)" marker-end="url(#fs-pfeil)"/>
        <text x="104" y="76" text-anchor="middle" class="fs-d-label">l <tspan class="fs-d-klein">Schienenlänge</tspan></text>
        <line x1="190" y1="60" x2="210" y2="60" class="fs-d-mass" marker-start="url(#fs-pfeil)" marker-end="url(#fs-pfeil)"/>
        <text x="200" y="76" text-anchor="middle" class="fs-d-label accent">s₁</text>
        <line x1="190" y1="24" x2="190" y2="66" class="fs-d-hilfe"/><line x1="190" y1="108" x2="190" y2="148" class="fs-d-hilfe"/>
        <line x1="210" y1="24" x2="210" y2="66" class="fs-d-hilfe"/><line x1="210" y1="108" x2="210" y2="148" class="fs-d-hilfe"/>
        <text x="20" y="104" class="fs-d-klein accent">wärmer (T₂ = T₁ + ΔT): Schienen dehnen sich</text>
        <rect x="20" y="112" width="178" height="16" class="fs-d-schiene"/>
        <rect x="202" y="112" width="178" height="16" class="fs-d-schiene"/>
        <line x1="190" y1="142" x2="198" y2="142" class="fs-d-mass" marker-end="url(#fs-pfeil)"/>
        <line x1="210" y1="142" x2="202" y2="142" class="fs-d-mass" marker-end="url(#fs-pfeil)"/>
        <text x="170" y="146" text-anchor="end" class="fs-d-klein">je Δl/2</text>
        <text x="200" y="166" text-anchor="middle" class="fs-d-label accent">s₂ = s₁ − Δl</text>
        <text x="230" y="146" class="fs-d-klein">Lücke wird kleiner</text>
        <text x="20" y="196" class="fs-d-klein">Lückenschluss Δl = l · α · ΔT mit ΔT = T₂ − T₁ · Abkühlung: Lücke wird größer</text>
      </ng-container>
    </g>

    <!-- APP 7: Atmendes Gleisende -->
    <g *ngSwitchCase="'atmend'">
      <rect x="20" y="96" width="100" height="28" class="fs-d-fahrzeug"/>
      <line x1="20" y1="110" x2="390" y2="110" class="fs-d-curve"/>
      <line *ngFor="let xs of schwellen" [attr.x1]="xs" y1="100" [attr.x2]="xs" y2="120" class="fs-d-base"/>
      <text x="70" y="88" text-anchor="middle" class="fs-d-label accent">atmend</text>
      <text x="255" y="88" text-anchor="middle" class="fs-d-label">fester Bereich (unbeweglich)</text>
      <line x1="20" y1="146" x2="120" y2="146" class="fs-d-mass" marker-start="url(#fs-pfeil)" marker-end="url(#fs-pfeil)"/>
      <text x="70" y="164" text-anchor="middle" class="fs-d-label">l<tspan baseline-shift="sub" font-size="10">atm</tspan></text>
      <line x1="40" y1="60" x2="10" y2="60" class="fs-d-kraft" marker-end="url(#fs-pfeil)"/>
      <text x="44" y="64" class="fs-d-klein">Gleisende bewegt sich</text>
      <line x1="45" y1="134" x2="75" y2="134" class="fs-d-mass" marker-end="url(#fs-pfeil)"/>
      <line x1="80" y1="134" x2="110" y2="134" class="fs-d-mass" marker-end="url(#fs-pfeil)"/>
      <text x="130" y="138" class="fs-d-klein">p = Widerstand des Schotters (N/cm)</text>
      <line x1="200" y1="190" x2="340" y2="190" class="fs-d-kraft" marker-start="url(#fs-pfeil)" marker-end="url(#fs-pfeil)"/>
      <text x="270" y="183" text-anchor="middle" class="fs-d-klein">volle Längskraft F</text>
    </g>

    <!-- APP 8: Kräfte am Fahrzeug auf der Neigung -->
    <g *ngSwitchCase="'fahrzeugkraefte'">
      <path d="M30,190 L370,90 L370,200 L30,200 Z" class="fs-d-flaeche"/>
      <line x1="30" y1="190" x2="370" y2="90" class="fs-d-base"/>
      <line x1="30" y1="190" x2="130" y2="190" class="fs-d-hilfe"/>
      <path d="M80,190 A50,50 0 0 0 77.97,175.89" class="fs-d-mass"/>
      <text x="88" y="186" class="fs-d-label">α</text>
      <g transform="rotate(-16.39 200 140)">
        <rect x="150" y="104" width="100" height="30" rx="5" class="fs-d-fahrzeug"/>
        <circle cx="170" cy="134" r="6" class="fs-d-schwelle"/><circle cx="230" cy="134" r="6" class="fs-d-schwelle"/>
      </g>
      <circle cx="192.1" cy="113.1" r="4" class="fs-d-punkt"/>
      <line x1="192.1" y1="113.1" x2="192.1" y2="193.1" class="fs-d-kraft" marker-end="url(#fs-pfeil)"/>
      <text x="198" y="200" class="fs-d-label">G</text>
      <line x1="192.1" y1="113.1" x2="148.7" y2="125.9" class="fs-d-mass" marker-end="url(#fs-pfeil)"/>
      <text x="120" y="122" class="fs-d-label accent">H</text>
      <line x1="192.1" y1="113.1" x2="213.7" y2="186.7" class="fs-d-mass" marker-end="url(#fs-pfeil)"/>
      <text x="220" y="184" class="fs-d-label accent">V</text>
      <text x="20" y="28" class="fs-d-klein">H = G · sin α (hangabwärts) · V = G · cos α (auf die Schiene)</text>
      <text x="20" y="46" class="fs-d-klein">Im Bogen zusätzlich: Fliehkraft F = m · v² / r nach außen</text>
    </g>

    <!-- APP 9: Querbeschleunigung im Querschnitt -->
    <g *ngSwitchCase="'querbeschleunigung'">
      <path d="M20,200 L70,160 L340,125 L390,180 L390,200 Z" class="fs-d-flaeche"/>
      <g transform="rotate(-7.6 200 150)">
        <rect x="30" y="144" width="340" height="12" class="fs-d-schwelle"/>
        <rect x="42" y="130" width="16" height="14" class="fs-d-schiene"/>
        <rect x="342" y="130" width="16" height="14" class="fs-d-schiene"/>
        <rect x="85" y="32" width="230" height="86" rx="10" class="fs-d-fahrzeug"/>
        <circle cx="200" cy="85" r="5" class="fs-d-punkt"/>
      </g>
      <line x1="193" y1="72" x2="290" y2="59.1" class="fs-d-kraft" marker-end="url(#fs-pfeil)"/>
      <text x="290" y="46" text-anchor="end" class="fs-d-label">v² / (12,96·r)</text>
      <line x1="193" y1="90" x2="128" y2="98.6" class="fs-d-mass" marker-end="url(#fs-pfeil)"/>
      <text x="104" y="120" class="fs-d-klein accent">u / 153</text>
      <text x="200" y="198" text-anchor="middle" class="fs-d-klein">a<tspan baseline-shift="sub" font-size="8">q</tspan> = Rest, der nicht ausgeglichen wird</text>
      <text x="22" y="150" class="fs-d-klein">innen</text>
      <text x="390" y="110" text-anchor="end" class="fs-d-klein">außen</text>
    </g>

    <!-- APP 10: Weichen / Gleisverbindung -->
    <g *ngSwitchCase="'weichen'">
      <line x1="20" y1="70" x2="390" y2="70" class="fs-d-base"/>
      <line x1="20" y1="160" x2="390" y2="160" class="fs-d-base"/>
      <path d="M100,70 Q140,70 170,90 L230,140 Q260,160 300,160" class="fs-d-curve"/>
      <circle cx="100" cy="70" r="4" class="fs-d-punkt"/><circle cx="300" cy="160" r="4" class="fs-d-punkt"/>
      <text x="100" y="88" text-anchor="middle" class="fs-d-klein">Weiche 1</text>
      <text x="300" y="178" text-anchor="middle" class="fs-d-klein">Weiche 2</text>
      <line x1="100" y1="40" x2="170" y2="40" class="fs-d-mass" marker-start="url(#fs-pfeil)" marker-end="url(#fs-pfeil)"/>
      <text x="135" y="35" text-anchor="middle" class="fs-d-label">l<tspan baseline-shift="sub" font-size="10">t</tspan></text>
      <line x1="170" y1="40" x2="230" y2="40" class="fs-d-mass" marker-start="url(#fs-pfeil)" marker-end="url(#fs-pfeil)"/>
      <text x="200" y="35" text-anchor="middle" class="fs-d-label accent">l<tspan baseline-shift="sub" font-size="10">g</tspan></text>
      <line x1="230" y1="40" x2="300" y2="40" class="fs-d-mass" marker-start="url(#fs-pfeil)" marker-end="url(#fs-pfeil)"/>
      <text x="265" y="35" text-anchor="middle" class="fs-d-label">l<tspan baseline-shift="sub" font-size="10">t</tspan></text>
      <line x1="100" y1="16" x2="300" y2="16" class="fs-d-mass" marker-start="url(#fs-pfeil)" marker-end="url(#fs-pfeil)"/>
      <text x="200" y="12" text-anchor="middle" class="fs-d-klein">c</text>
      <line x1="170" y1="40" x2="170" y2="90" class="fs-d-hilfe"/><line x1="230" y1="40" x2="230" y2="140" class="fs-d-hilfe"/>
      <text x="150" y="122" class="fs-d-klein">Zweiggleis r → v = 2,91 · √r</text>
      <text x="20" y="200" class="fs-d-klein">Zwischengerade l<tspan baseline-shift="sub" font-size="8">g</tspan> = c − 2 · l<tspan baseline-shift="sub" font-size="8">t</tspan></text>
    </g>

    <!-- APP 12: Überhöhungsrampe im Längsschnitt (überhöht gezeichnet) -->
    <g *ngSwitchCase="'rampen'">
      <line x1="30" y1="170" x2="385" y2="170" class="fs-d-base"/>
      <text x="385" y="186" text-anchor="end" class="fs-d-klein">innere Schiene</text>
      <path d="M30,170 L100,170 L300,90 L385,90" class="fs-d-curve"/>
      <text x="385" y="82" text-anchor="end" class="fs-d-klein">äußere Schiene</text>
      <circle cx="100" cy="170" r="3.5" class="fs-d-punkt2"/><circle cx="300" cy="90" r="3.5" class="fs-d-punkt2"/>
      <text x="100" y="158" text-anchor="middle" class="fs-d-klein">RA</text>
      <text x="300" y="80" text-anchor="middle" class="fs-d-klein">RE</text>
      <line x1="100" y1="195" x2="300" y2="195" class="fs-d-mass" marker-start="url(#fs-pfeil)" marker-end="url(#fs-pfeil)"/>
      <text x="200" y="190" text-anchor="middle" class="fs-d-label">l<tspan baseline-shift="sub" font-size="10">R</tspan></text>
      <line x1="330" y1="170" x2="330" y2="90" class="fs-d-mass" marker-start="url(#fs-pfeil)" marker-end="url(#fs-pfeil)"/>
      <text x="336" y="134" class="fs-d-label accent">Δu</text>
      <text x="190" y="118" text-anchor="middle" class="fs-d-label accent" transform="rotate(-21.8 190 118)">1 : m</text>
      <text x="30" y="28" class="fs-d-klein">Gerade (u = 0) → Rampe → Bogen (volle Überhöhung)</text>
      <text x="30" y="46" class="fs-d-klein">Höhen stark überhöht gezeichnet</text>
    </g>

    <!-- APP 13: Überhöhung entlang der Rampe (gerade und S-förmig) -->
    <g *ngSwitchCase="'rampenverlauf'">
      <line x1="40" y1="180" x2="385" y2="180" class="fs-d-base" marker-end="url(#fs-pfeil)"/>
      <line x1="40" y1="180" x2="40" y2="20" class="fs-d-base" marker-end="url(#fs-pfeil)"/>
      <text x="385" y="198" text-anchor="end" class="fs-d-klein">x</text>
      <text x="46" y="28" class="fs-d-klein">u</text>
      <line x1="60" y1="180" x2="340" y2="40" class="fs-d-tangente"/>
      <path d="M60,180 Q130,180 200,110 Q270,40 340,40" class="fs-d-curve"/>
      <line x1="40" y1="40" x2="340" y2="40" class="fs-d-hilfe"/>
      <text x="34" y="44" text-anchor="end" class="fs-d-label">u<tspan baseline-shift="sub" font-size="10">E</tspan></text>
      <line x1="130" y1="180" x2="130" y2="145" class="fs-d-mass" marker-start="url(#fs-pfeil)" marker-end="url(#fs-pfeil)"/>
      <circle cx="130" cy="145" r="3.5" class="fs-d-punkt2"/>
      <text x="136" y="168" class="fs-d-label accent">u<tspan baseline-shift="sub" font-size="10">x</tspan></text>
      <line x1="200" y1="180" x2="200" y2="110" class="fs-d-hilfe"/>
      <text x="200" y="196" text-anchor="middle" class="fs-d-klein">l/2</text>
      <text x="60" y="196" text-anchor="middle" class="fs-d-klein">0</text>
      <text x="340" y="196" text-anchor="middle" class="fs-d-klein">l</text>
      <text x="250" y="140" class="fs-d-klein">gerade (gestrichelt)</text>
      <text x="215" y="72" class="fs-d-klein accent">S-förmig</text>
    </g>

    <!-- APP 14: Krümmungsband -->
    <g *ngSwitchCase="'kruemmung'">
      <line x1="20" y1="160" x2="390" y2="160" class="fs-d-base"/>
      <text x="390" y="176" text-anchor="end" class="fs-d-klein">k = 0 (Gerade)</text>
      <path d="M20,160 L120,160 L120,70 L250,70 L250,110 L390,110" class="fs-d-curve"/>
      <path d="M90,160 L150,70" class="fs-d-tangente"/>
      <text x="64" y="118" class="fs-d-klein">mit ÜB</text>
      <line x1="135" y1="160" x2="135" y2="70" class="fs-d-mass" marker-start="url(#fs-pfeil)" marker-end="url(#fs-pfeil)"/>
      <text x="141" y="120" class="fs-d-label accent">Δk = 1000/r₁</text>
      <line x1="265" y1="70" x2="265" y2="110" class="fs-d-mass" marker-start="url(#fs-pfeil)" marker-end="url(#fs-pfeil)"/>
      <text x="271" y="94" class="fs-d-label accent">Δk</text>
      <text x="185" y="62" text-anchor="middle" class="fs-d-klein">Bogen r₁ (klein)</text>
      <text x="330" y="128" text-anchor="middle" class="fs-d-klein">Bogen r₂ (gleichsinnig)</text>
      <text x="20" y="28" class="fs-d-klein">Übergangsbogen nötig, wenn Δk &gt; 9000 / v²</text>
      <text x="20" y="46" class="fs-d-klein">Gegenbögen: k₁ + k₂ &gt; 10</text>
    </g>

    <!-- APP 15: Übergangsbogenformen im Vergleich -->
    <g *ngSwitchCase="'uebergangslaenge'">
      <line x1="40" y1="170" x2="385" y2="170" class="fs-d-base" marker-end="url(#fs-pfeil)"/>
      <line x1="40" y1="170" x2="40" y2="30" class="fs-d-base" marker-end="url(#fs-pfeil)"/>
      <text x="46" y="38" class="fs-d-klein">u bzw. k</text>
      <line x1="60" y1="60" x2="385" y2="60" class="fs-d-hilfe"/>
      <path d="M60,170 L220,60" class="fs-d-mass"/>
      <path d="M60,170 C120,170 180,60 240,60" class="fs-d-tangente"/>
      <path d="M60,170 Q120,170 180,115 Q240,60 300,60" class="fs-d-curve"/>
      <text x="150" y="90" text-anchor="end" class="fs-d-klein accent">Klothoide · 4</text>
      <text x="236" y="112" class="fs-d-klein">Bloss · 4,5</text>
      <text x="250" y="140" class="fs-d-klein accent">Schramm · 6</text>
      <line x1="60" y1="192" x2="300" y2="192" class="fs-d-mass" marker-start="url(#fs-pfeil)" marker-end="url(#fs-pfeil)"/>
      <text x="180" y="188" text-anchor="middle" class="fs-d-klein">längste Form: Schramm</text>
      <text x="40" y="22" class="fs-d-klein">min l<tspan baseline-shift="sub" font-size="8">u</tspan> = Faktor · v · Δu / 1000</text>
    </g>

    <!-- APP 16: Innenbogenweiche -->
    <g *ngSwitchCase="'zweiggleis'">
      <path d="M20,60 Q200,140 380,60" class="fs-d-base"/>
      <path d="M110,90 Q217,114 320,175" class="fs-d-curve"/>
      <circle cx="110" cy="90" r="4" class="fs-d-punkt"/>
      <text x="104" y="80" text-anchor="end" class="fs-d-label">WA</text>
      <text x="300" y="80" class="fs-d-label">r<tspan baseline-shift="sub" font-size="10">St</tspan> (Stammgleis)</text>
      <text x="326" y="168" class="fs-d-label accent">r<tspan baseline-shift="sub" font-size="10">z</tspan></text><text x="250" y="168" text-anchor="end" class="fs-d-klein accent">Zweiggleis</text>
      <line x1="110" y1="90" x2="217" y2="114" class="fs-d-tangente"/>
      <text x="160" y="96" class="fs-d-klein">t</text>
      <text x="20" y="196" class="fs-d-klein">Beide krümmen sich zur selben Seite → r<tspan baseline-shift="sub" font-size="8">z</tspan> &lt; r<tspan baseline-shift="sub" font-size="8">G</tspan></text>
      <text x="20" y="28" class="fs-d-klein">Innenbogenweiche (Grundform r<tspan baseline-shift="sub" font-size="8">G</tspan> im Bogen r<tspan baseline-shift="sub" font-size="8">St</tspan>)</text>
    </g>

    <!-- APP 17: Rampe gegen lotrechte Wand (Schrägbild) -->
    <g *ngSwitchCase="'rampenvolumen'">
      <path d="M80,175 L190,120 L190,30 L80,85 Z" class="fs-d-flaeche"/>
      <text x="96" y="70" class="fs-d-klein" transform="rotate(-26.6 96 70)">Wand</text>
      <path d="M110,80 L160,55 L360,135 L310,160 Z" class="fs-d-flaeche"/>
      <path d="M110,80 L80,175 L310,160 Z" class="fs-d-flaeche"/>
      <path d="M110,80 L160,55 L360,135 L310,160 Z M110,80 L80,175 L310,160 M160,55 L190,120 L360,135" class="fs-d-curve" fill="none"/>
      <line x1="80" y1="175" x2="190" y2="120" class="fs-d-tangente"/>
      <line x1="110" y1="80" x2="110" y2="160" class="fs-d-hilfe"/>
      <text x="114" y="128" class="fs-d-label accent">h</text>
      <line x1="110" y1="160" x2="310" y2="160" class="fs-d-hilfe"/>
      <text x="210" y="176" text-anchor="middle" class="fs-d-label">h<tspan baseline-shift="sub" font-size="10">K</tspan></text>
      <text x="128" y="58" class="fs-d-label">l<tspan baseline-shift="sub" font-size="10">2</tspan></text>
      <text x="138" y="160" class="fs-d-label">l<tspan baseline-shift="sub" font-size="10">1</tspan></text>
      <text x="342" y="158" class="fs-d-label">l<tspan baseline-shift="sub" font-size="10">3</tspan></text>
      <text x="20" y="200" class="fs-d-klein">l₁, l₂, l₃ = Kanten parallel zur Wand (Deutung, bitte prüfen)</text>
    </g>
  </svg>
</div>`,
})
export class SkizzeComponent {
  @Input() typ: SkizzenTyp = 'pfeilhoehe';
  /** Pfeilhöhe: 'mitte' | 'ab'. Ausrundung: 'kuppe' | 'wanne'. */
  @Input() variante = '';
  @Input() titel = 'Skizze';

  /** Schwellen-Striche für die Skizze „atmendes Gleisende“. */
  readonly schwellen = Array.from({ length: 19 }, (_, i) => 25 + i * 20);

  get wanne(): boolean {
    return this.variante === 'wanne';
  }

  /** Ausrundungs-Skizze für die Wanne an der Waagerechten spiegeln. */
  Y(y: number): number {
    return this.wanne ? 210 - y : y;
  }
}
