import { Routes } from '@angular/router';
import { AnmeldenPage } from './pages/anmelden/anmelden.page';
import { RegistrierenPage } from './pages/registrieren/registrieren.page';
import { ProfilPage } from './pages/profil/profil.page';
import { SchluesselPage } from './pages/schluessel/schluessel.page';
import { authGuard } from '../../core/auth/guards/auth.guard';
import { adminGuard } from '../../core/auth/guards/admin.guard';

export const KONTO_ROUTES: Routes = [
  { path: 'anmelden', component: AnmeldenPage },
  { path: 'registrieren', component: RegistrierenPage },
  { path: 'profil', component: ProfilPage, canActivate: [authGuard] },
  { path: 'schluessel', component: SchluesselPage, canActivate: [authGuard, adminGuard] },
];
