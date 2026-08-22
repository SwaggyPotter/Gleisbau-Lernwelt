import { Routes } from '@angular/router';
import { LoginPage } from './pages/login/login.page';
import { DuellPage } from './pages/duell/duell.page';
import { StatistikPage } from './pages/statistik/statistik.page';

export const QUIZDUELL_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'duell' },
  { path: 'login', component: LoginPage },
  { path: 'duell', component: DuellPage },
  { path: 'statistik', component: StatistikPage },
];
