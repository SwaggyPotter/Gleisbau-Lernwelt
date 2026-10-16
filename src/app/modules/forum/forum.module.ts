import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { ForumListePage } from './pages/forum-liste/forum-liste.page';
import { ForumThemaPage } from './pages/forum-thema/forum-thema.page';

const routes: Routes = [
  { path: '', component: ForumListePage },
  { path: ':id', component: ForumThemaPage },
];

@NgModule({
  declarations: [ForumListePage, ForumThemaPage],
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
})
export class ForumModule {}
