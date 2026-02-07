import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
  },
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then(m => m.LoginPageModule)
  },
  {
    path: 'register',
    loadChildren: () => import('./register/register.module').then(m => m.RegisterPageModule)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardPageModule)
  },
  {
    path: 'field/:id',
    loadChildren: () => import('./field-detail/field-detail.module').then(m => m.FieldDetailPageModule)
  },
  {
    path: 'field/:id/quiz',
    loadChildren: () => import('./field-quiz/field-quiz.module').then(m => m.FieldQuizPageModule)
  },
  {
    path: 'profile',
    loadChildren: () => import('./profile/profile.module').then(m => m.ProfilePageModule)
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminPageModule)
  },
  {
    path: 'lernfelder/1',
    loadChildren: () => import('./modules/lernfelder/lernfeld-01/lernfeld-01.module').then(m => m.Lernfeld01Module),
  },
  {
    path: 'lernfelder/2',
    loadChildren: () => import('./modules/lernfelder/lernfeld-02/lernfeld-02.module').then(m => m.Lernfeld02Module),
  },
  {
    path: 'lernfelder/3',
    loadChildren: () => import('./modules/lernfelder/lernfeld-03/lernfeld-03.module').then(m => m.Lernfeld03Module),
  },
  {
    path: 'lernfelder/4',
    loadChildren: () => import('./modules/lernfelder/lernfeld-04/lernfeld-04.module').then(m => m.Lernfeld04Module),
  },
  {
    path: 'lernfelder/5',
    loadChildren: () => import('./modules/lernfelder/lernfeld-05/lernfeld-05.module').then(m => m.Lernfeld05Module),
  },
  {
    path: 'lernfelder/6',
    loadChildren: () => import('./modules/lernfelder/lernfeld-06/lernfeld-06.module').then(m => m.Lernfeld06Module),
  },
  {
    path: 'lernfelder/7',
    loadChildren: () => import('./modules/lernfelder/lernfeld-07/lernfeld-07.module').then(m => m.Lernfeld07Module),
  },
  {
    path: 'lernfelder/8',
    loadChildren: () => import('./modules/lernfelder/lernfeld-08/lernfeld-08.module').then(m => m.Lernfeld08Module),
  },
  {
    path: 'lernfelder/9',
    loadChildren: () => import('./modules/lernfelder/lernfeld-09/lernfeld-09.module').then(m => m.Lernfeld09Module),
  },
  {
    path: 'lernfelder/10',
    loadChildren: () => import('./modules/lernfelder/lernfeld-10/lernfeld-10.module').then(m => m.Lernfeld10Module),
  },
  {
    path: 'lernfelder/11',
    loadChildren: () => import('./modules/lernfelder/lernfeld-11/lernfeld-11.module').then(m => m.Lernfeld11Module),
  },
  {
    path: 'lernfelder/12',
    loadChildren: () => import('./modules/lernfelder/lernfeld-12/lernfeld-12.module').then(m => m.Lernfeld12Module),
  },
  {
    path: 'lernfelder/13',
    loadChildren: () => import('./modules/lernfelder/lernfeld-13/lernfeld-13.module').then(m => m.Lernfeld13Module),
  },
  {
    path: 'zusatz/nivellieren',
    loadChildren: () => import('./modules/zusatz/nivellieren/lernfeld-02.module').then(m => m.NivellierenModule),
  },
  {
    path: 'lernfeld/01',
    redirectTo: 'lernfelder/1',
    pathMatch: 'full',
  },
  {
    path: 'lernfeld/02',
    redirectTo: 'lernfelder/2',
    pathMatch: 'full',
  },
  {
    path: 'lernfeld/03',
    redirectTo: 'lernfelder/3',
    pathMatch: 'full',
  },
  {
    path: 'lernfeld/04',
    redirectTo: 'lernfelder/4',
    pathMatch: 'full',
  },
  {
    path: 'lernfeld/05',
    redirectTo: 'lernfelder/5',
    pathMatch: 'full',
  },
  {
    path: 'lernfeld/06',
    redirectTo: 'lernfelder/6',
    pathMatch: 'full',
  },
  {
    path: 'lernfeld/07',
    redirectTo: 'lernfelder/7',
    pathMatch: 'full',
  },
  {
    path: 'lernfeld/08',
    redirectTo: 'lernfelder/8',
    pathMatch: 'full',
  },
  {
    path: 'lernfeld/09',
    redirectTo: 'lernfelder/9',
    pathMatch: 'full',
  },
  {
    path: 'lernfeld/10',
    redirectTo: 'lernfelder/10',
    pathMatch: 'full',
  },
  {
    path: 'lernfeld/11',
    redirectTo: 'lernfelder/11',
    pathMatch: 'full',
  },
  {
    path: 'lernfeld/12',
    redirectTo: 'lernfelder/12',
    pathMatch: 'full',
  },
  {
    path: 'lernfeld/13',
    redirectTo: 'lernfelder/13',
    pathMatch: 'full',
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
