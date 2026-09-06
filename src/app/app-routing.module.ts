import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadChildren: () => import('./dashboard/dashboard.module')
      .then(m => m.DashboardPageModule)
  },
  {
    path: 'themenquiz/:topicId',
    loadChildren: () => import('./modules/themenquiz/themenquiz.module')
      .then(m => m.ThemenquizModule)
  },
  {
    path: 'zusatz/nivellieren',
    loadChildren: () => import('./modules/zusatz/nivellieren/lernfeld-02.module')
      .then(m => m.NivellierenModule)
  },
  {
    path: 'zusatz/volumen',
    loadChildren: () => import('./modules/zusatz/volumen/volumen.module')
      .then(m => m.VolumenModule)
  },
  {
    path: 'zusatz/prozentrechnung',
    loadChildren: () => import('./modules/zusatz/prozentrechnung/prozentrechnung.module')
      .then(m => m.ProzentrechnungModule)
  },
  {
    path: 'zusatz/gesamtquiz',
    loadChildren: () => import('./modules/zusatz/gesamtquiz/gesamtquiz.module')
      .then(m => m.GesamtquizModule)
  },
  {
    path: 'zusatz/materialrechner',
    loadChildren: () => import('./modules/zusatz/materialrechner/materialrechner.module')
      .then(m => m.MaterialrechnerModule)
  },
  {
    path: 'zusatz/nivellierlatte',
    loadChildren: () => import('./modules/zusatz/nivellierlatte/nivellierlatte.module')
      .then(m => m.NivellierlatteModule)
  },
  {
    path: 'zusatz/schienenmesser',
    loadChildren: () => import('./modules/zusatz/schienenmesser/schienenmesser.module')
      .then(m => m.SchienenmesserModule)
  },
  {
    path: 'zusatz/schienenraten',
    loadChildren: () => import('./modules/zusatz/schienenraten/schienenraten.module')
      .then(m => m.SchienenratenModule)
  },
  {
    path: 'zusatz/quizduell',
    loadChildren: () => import('./modules/zusatz/quizduell/quizduell.module')
      .then(m => m.QuizduellModule)
  },
  {
    path: 'zusatz/trassierung',
    loadChildren: () => import('./modules/zusatz/trassierung/trassierung.module')
      .then(m => m.TrassierungModule)
  },
  {
    path: 'zusatz/weichenrechner',
    loadChildren: () => import('./modules/zusatz/weichenrechner/weichenrechner.module')
      .then(m => m.WeichenrechnerModule)
  },
  {
    path: 'zusatz/schienendehnung',
    loadChildren: () => import('./modules/zusatz/schienendehnung/schienendehnung.module')
      .then(m => m.SchienendehnungModule)
  },
  {
    path: 'zusatz/pruefungssimulation',
    loadChildren: () => import('./modules/zusatz/pruefungssimulation/pruefungssimulation.module')
      .then(m => m.PruefungssimulationModule)
  },
  {
    path: 'zusatz/lernfortschritt',
    loadChildren: () => import('./modules/zusatz/lernfortschritt/lernfortschritt.module')
      .then(m => m.LernfortschrittModule)
  },
  {
    path: 'zusatz/glossar',
    loadChildren: () => import('./modules/zusatz/glossar/glossar.module')
      .then(m => m.GlossarModule)
  },
  {
    path: 'zusatz/baumaschinen',
    loadChildren: () => import('./modules/zusatz/baumaschinen/baumaschinen.module')
      .then(m => m.BaumaschinenModule)
  },
  {
    path: 'konto',
    loadChildren: () => import('./modules/konto/konto.module')
      .then(m => m.KontoModule)
  },
  {
    path: 'kategorie/:id',
    loadChildren: () => import('./modules/kategorie/kategorie.module')
      .then(m => m.KategorieModule)
  },
  {
    path: 'bildnachweise',
    loadChildren: () => import('./bildnachweise/bildnachweise.module')
      .then(m => m.BildnachweisePageModule)
  },
  {
    path: 'quellenverzeichnis',
    loadChildren: () => import('./quellenverzeichnis/quellenverzeichnis.module')
      .then(m => m.QuellenverzeichnisPageModule)
  },
  {
    path: 'rechte',
    loadChildren: () => import('./rechte/rechte.module')
      .then(m => m.RechtePageModule)
  },
  { path: '**', redirectTo: 'dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
