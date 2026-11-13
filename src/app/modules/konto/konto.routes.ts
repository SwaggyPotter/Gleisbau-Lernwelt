import { Routes } from '@angular/router';
import { AnmeldenPage } from './pages/anmelden/anmelden.page';
import { RegistrierenPage } from './pages/registrieren/registrieren.page';
import { ProfilPage } from './pages/profil/profil.page';
import { SchluesselPage } from './pages/schluessel/schluessel.page';
import { AktivitaetPage } from './pages/aktivitaet/aktivitaet.page';
import { BilderVerwaltungPage } from './pages/bilder-verwaltung/bilder-verwaltung.page';
import { FragenUebersichtPage } from './pages/fragen-uebersicht/fragen-uebersicht.page';
import { FragenBearbeitenPage } from './pages/fragen-bearbeiten/fragen-bearbeiten.page';
import { authGuard } from '../../core/auth/guards/auth.guard';
import { adminGuard } from '../../core/auth/guards/admin.guard';

export const KONTO_ROUTES: Routes = [
  { path: 'anmelden', component: AnmeldenPage },
  { path: 'registrieren', component: RegistrierenPage },
  { path: 'profil', component: ProfilPage, canActivate: [authGuard] },
  { path: 'schluessel', component: SchluesselPage, canActivate: [authGuard, adminGuard] },
  { path: 'aktivitaet', component: AktivitaetPage, canActivate: [authGuard, adminGuard] },
  { path: 'benennen', redirectTo: 'bilder', pathMatch: 'full' }, // „Benennen“ war doppelt zu „Bilder“ (Tim 2026-11-12)
  { path: 'bilder', component: BilderVerwaltungPage, canActivate: [authGuard, adminGuard] },
  { path: 'fragen', component: FragenUebersichtPage, canActivate: [authGuard, adminGuard] },
  { path: 'fragen-bearbeiten/:topicId', component: FragenBearbeitenPage, canActivate: [authGuard, adminGuard] },
  { path: 'fragen-bearbeiten', redirectTo: 'fragen-bearbeiten/grundlagen', pathMatch: 'full' },
  { path: 'gaeste', redirectTo: 'schluessel', pathMatch: 'full' },
];
