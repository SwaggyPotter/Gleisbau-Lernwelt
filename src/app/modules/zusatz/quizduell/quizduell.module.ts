import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { QUIZDUELL_ROUTES } from './quizduell.routes';
import { LoginPage } from './pages/login/login.page';
import { DuellPage } from './pages/duell/duell.page';
import { StatistikPage } from './pages/statistik/statistik.page';
import { DuellFrageComponent } from './components/duell-frage/duell-frage.component';

@NgModule({
  declarations: [LoginPage, DuellPage, StatistikPage, DuellFrageComponent],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(QUIZDUELL_ROUTES),
  ],
})
export class QuizduellModule {}
