import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { TycoonPage } from './pages/tycoon.page';

const routes: Routes = [
  { path: '', component: TycoonPage },
  { path: ':userId', component: TycoonPage },
];

@NgModule({
  declarations: [TycoonPage],
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
})
export class TycoonModule {}
