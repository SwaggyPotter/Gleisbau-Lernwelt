import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { OFFLINE_ROUTES } from './offline.routes';
import { OfflinePage } from './pages/offline.page';

@NgModule({
  declarations: [OfflinePage],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(OFFLINE_ROUTES),
  ],
})
export class OfflineModule {}
