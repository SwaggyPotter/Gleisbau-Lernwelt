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
  { path: '**', redirectTo: 'dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
