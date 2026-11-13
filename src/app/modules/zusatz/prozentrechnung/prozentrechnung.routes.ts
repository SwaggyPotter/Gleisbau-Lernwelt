import { Routes } from '@angular/router';
import { ProzentrechnungPage } from './pages/prozentrechnung.page';
import { ProzentRechnerPage } from './pages/prozent-rechner.page';

export const PROZENTRECHNUNG_ROUTES: Routes = [
  { path: '', component: ProzentRechnerPage },
  { path: 'quiz', component: ProzentrechnungPage },
];
