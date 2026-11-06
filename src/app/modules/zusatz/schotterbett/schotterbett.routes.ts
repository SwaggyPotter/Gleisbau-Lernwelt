import { Routes } from '@angular/router';
import { SchotterbettPage } from './pages/schotterbett.page';
import { SchotterberechnungPage } from './pages/schotterberechnung.page';

export const SCHOTTERBETT_ROUTES: Routes = [
  {
    path: '',
    component: SchotterberechnungPage,
  },
  {
    // bisheriger Schotterbedarfsrechner (Prüfungsaufgaben, Üben, freier Rechner)
    path: 'alt',
    component: SchotterbettPage,
  },
];
