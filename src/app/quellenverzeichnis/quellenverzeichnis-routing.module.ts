import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { QuellenverzeichnisPage } from './quellenverzeichnis.page';

const routes: Routes = [
  {
    path: '',
    component: QuellenverzeichnisPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class QuellenverzeichnisPageRoutingModule {}
