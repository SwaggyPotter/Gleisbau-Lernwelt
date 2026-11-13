import { Routes } from '@angular/router';
import { VolumenPage } from './pages/volumen.page';
import { VolumenRechnerPage } from './pages/volumen-rechner.page';

export const VOLUMEN_ROUTES: Routes = [
  { path: '', component: VolumenRechnerPage },
  { path: 'quiz', component: VolumenPage },
];
