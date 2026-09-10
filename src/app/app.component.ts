import { Component, OnDestroy, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { hasStoredSiteAuth } from './core/site-gate/site-gate.component';
import { NeueErrungenschaft } from './core/auth/services/profil-sync.service';
import { ThemeService } from './core/theme/theme.service';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Gleisbau Lernwelt';
  unlocked = hasStoredSiteAuth();

  private readonly onErrungenschaft = (event: Event) => {
    const neu = (event as CustomEvent<NeueErrungenschaft[]>).detail ?? [];
    for (const a of neu) this.zeigeToast(a);
  };

  constructor(
    private readonly toastCtrl: ToastController,
    private readonly theme: ThemeService,
  ) {}

  ngOnInit(): void {
    this.theme.init();
    window.addEventListener('glw-errungenschaft-freigeschaltet', this.onErrungenschaft);
  }

  ngOnDestroy(): void {
    window.removeEventListener('glw-errungenschaft-freigeschaltet', this.onErrungenschaft);
  }

  private async zeigeToast(a: NeueErrungenschaft): Promise<void> {
    const toast = await this.toastCtrl.create({
      header: 'Errungenschaft freigeschaltet!',
      message: a.title,
      duration: 4000,
      position: 'top',
      color: 'success',
      icon: a.icon,
      buttons: [{ text: 'OK', role: 'cancel' }],
    });
    await toast.present();
  }
}
