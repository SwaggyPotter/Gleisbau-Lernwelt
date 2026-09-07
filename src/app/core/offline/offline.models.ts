export interface OfflineFortschritt {
  gesamt: number;
  fertig: number;
  fehler: number;
  laeuftGerade: boolean;
  aktuelleDatei: string | null;
}

export interface OfflineStatus {
  zuletztAktualisiert: string | null;
  anzahlDateien: number;
}
