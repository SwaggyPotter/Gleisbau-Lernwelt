import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BildnachweisePage } from './bildnachweise.page';

const routes: Routes = [
  {
    path: '',
    component: BildnachweisePage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BildnachweisePageRoutingModule {}
