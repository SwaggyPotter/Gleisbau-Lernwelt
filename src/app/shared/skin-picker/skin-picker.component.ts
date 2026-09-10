import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ThemeService, SKINS_AKTUELL } from '../../core/theme/theme.service';
import { SkinId, SkinInfo } from '../../core/theme/theme.models';
import { AuthService } from '../../core/auth/services/auth.service';
import { ProfilApiService } from '../../modules/konto/services/profil-api.service';

@Component({
  selector: 'app-skin-picker',
  standalone: false,
  templateUrl: './skin-picker.component.html',
  styleUrls: ['./skin-picker.component.scss'],
})
export class SkinPickerComponent implements OnInit {
  readonly skins: SkinInfo[] = SKINS_AKTUELL();
  freigeschaltet = new Set<string>();

  @Output() geaendert = new EventEmitter<SkinId>();

  constructor(
    private readonly theme: ThemeService,
    private readonly auth: AuthService,
    private readonly api: ProfilApiService,
  ) {}

  ngOnInit(): void {
    if (this.auth.isLoggedIn) {
      this.api.meineErrungenschaften().subscribe({
        next: res => { this.freigeschaltet = new Set(res.freigeschaltet.map(f => f.key)); },
        error: () => { /* Errungenschaften nicht ladbar -- gesperrte Skins bleiben gesperrt angezeigt */ },
      });
    }
  }

  get aktuell(): SkinId {
    return this.theme.aktuellerSkin;
  }

  istGesperrt(s: SkinInfo): boolean {
    return !!s.freischaltungAchievement && !this.freigeschaltet.has(s.freischaltungAchievement);
  }

  waehle(s: SkinInfo): void {
    if (this.istGesperrt(s)) return;
    this.theme.waehle(s.id);
    this.geaendert.emit(s.id);
  }
}
