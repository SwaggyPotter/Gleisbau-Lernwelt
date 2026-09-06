import { Component, OnInit } from '@angular/core';
import { ProfilApiService } from '../../services/profil-api.service';
import { RegistrierungsKey } from '../../models/profil.models';

@Component({
  selector: 'app-schluessel',
  templateUrl: './schluessel.page.html',
  styleUrls: ['./schluessel.page.scss'],
  standalone: false,
})
export class SchluesselPage implements OnInit {
  keys: RegistrierungsKey[] = [];
  ladefehler = false;

  neuerName = '';
  neuesJahr = 1;
  erstellenBusy = false;
  letzterNeuerKey: string | null = null;

  constructor(private readonly api: ProfilApiService) {}

  ngOnInit(): void {
    this.laden();
  }

  laden(): void {
    this.api.schluesselListe().subscribe({
      next: res => { this.keys = res.keys; },
      error: () => { this.ladefehler = true; },
    });
  }

  erstellen(): void {
    if (!this.neuerName.trim()) return;
    this.erstellenBusy = true;
    this.letzterNeuerKey = null;
    this.api.schluesselErstellen(this.neuesJahr, this.neuerName.trim()).subscribe({
      next: res => {
        this.erstellenBusy = false;
        this.letzterNeuerKey = res.key.key;
        this.neuerName = '';
        this.laden();
      },
      error: () => { this.erstellenBusy = false; },
    });
  }

  loeschen(key: string): void {
    this.api.schluesselLoeschen(key).subscribe(() => this.laden());
  }

  offeneUses(k: RegistrierungsKey): number {
    return k.maxUses - k.uses;
  }
}
