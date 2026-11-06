/**
 * Gleisbau Tycoon -- freiwillige Werbung ("Sponsor-Video"): Wer ein kurzes Video ansieht, laesst eine Stoerung gratis von
 * der Fremdfirma beheben. Bis ein Werbepartner angebunden ist, zeigt zeigeWerbung() nur einen Platzhalter mit Countdown.
 *
 * Vor echter Werbung noetig: Impressum, Datenschutzerklaerung und Einwilligung (Cookie-Banner) fuer den Werbeanbieter.
 * Dann hier den Anbieter einbinden (z. B. ein Rewarded-Video-SDK) und den Platzhalter ersetzen.
 */

export const WERBUNG = {
  /** Knopf ueberhaupt anzeigen. */
  aktiv: true,
  /** Laenge des Platzhalters (s). */
  sekunden: 15,
  /** Hoechstens so oft je Stunde (echte Zeit). */
  proStunde: 3,
};

/** Zeitstempel (ms) der Videos in der letzten Stunde -> darf noch eines? */
export const werbungFrei = (zeiten: number[] | undefined, jetzt = Date.now()) => (zeiten || []).filter((t) => jetzt - t < 3600_000).length < WERBUNG.proStunde;

/**
 * Zeigt die Werbung im Element el; ruft fertig(true), wenn sie ganz angesehen wurde. Liefert eine Abbruch-Funktion.
 * Platzhalter: Flaeche mit Countdown.
 */
export function zeigeWerbung(el: HTMLElement, fertig: (ok: boolean) => void): () => void {
  let rest = WERBUNG.sekunden;
  el.innerHTML = '<div class="werbung"><div class="werbung-flaeche"><b>Werbefläche</b><span>Hier läuft später ein kurzes Video eines Werbepartners.</span></div>' +
    '<div class="werbung-zeit">Noch <b id="wzeit">' + rest + '</b> s</div><div class="bar"><i id="wbar" style="width:0%;background:#2e86ab"></i></div></div>';
  const t = setInterval(() => {
    rest--;
    const z = el.querySelector('#wzeit'), b = el.querySelector('#wbar') as HTMLElement | null;
    if (z) z.textContent = String(rest);
    if (b) b.style.width = Math.round((1 - rest / WERBUNG.sekunden) * 100) + '%';
    if (rest <= 0) { clearInterval(t); fertig(true); }
  }, 1000);
  return () => clearInterval(t);
}
