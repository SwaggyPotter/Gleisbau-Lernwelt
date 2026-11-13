import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from '../../../core/auth/guards/auth.guard';
import { adminGuard } from '../../../core/auth/guards/admin.guard';
import { BuehnePage } from './pages/buehne.page';
import { FernbedienungPage } from './pages/fernbedienung.page';
import { EditorPage } from './pages/editor.page';
import { AutoHoeheDirective } from './auto-hoehe.directive';

/** Quiz-Show für Vorträge (Tim, 2026-11-11): Bühne am Beamer, Fernbedienung + Editor am Tablet (Admin). */
const ROUTES: Routes = [
  { path: '', component: BuehnePage },
  { path: 'fernbedienung', component: FernbedienungPage, canActivate: [authGuard, adminGuard] },
  { path: 'editor', component: EditorPage, canActivate: [authGuard, adminGuard] },
];

@NgModule({
  declarations: [BuehnePage, FernbedienungPage, EditorPage, AutoHoeheDirective],
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(ROUTES)],
})
export class QuizshowModule {}
