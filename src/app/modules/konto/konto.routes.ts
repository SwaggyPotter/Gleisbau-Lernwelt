import { Routes } from '@angular/router';
import { AnmeldenPage } from './pages/anmelden/anmelden.page';
import { RegistrierenPage } from './pages/registrieren/registrieren.page';
import { ProfilPage } from './pages/profil/profil.page';
import { SchluesselPage } from './pages/schluessel/schluessel.page';
import { BilderBenennenPage } from './pages/bilder-benennen/bilder-benennen.page';
import { BilderVerwaltungPage } from './pages/bilder-verwaltung/bilder-verwaltung.page';
import { FragenUebersichtPage } from './pages/fragen-uebersicht/fragen-uebersicht.page';
import { authGuard } from '../../core/auth/guards/auth.guard';
import { adminGuard } from '../../core/auth/guards/admin.guard';

export const KONTO_ROUTES: Routes = [
  { path: 'anmelden', component: AnmeldenPage },
  { path: 'registrieren', component: RegistrierenPage },
  { path: 'profil', component: ProfilPage, canActivate: [authGuard] },
  { path: 'schluessel', component: SchluesselPage, canActivate: [authGuard, adminGuard] },
  { path: 'benennen', component: BilderBenennenPage, canActivate: [authGuard, adminGuard] },
  { path: 'bilder', component: BilderVerwaltungPage, canActivate: [authGuard, adminGuard] },
  { path: 'fragen', component: FragenUebersichtPage, canActivate: [authGuard, adminGuard] },
];
