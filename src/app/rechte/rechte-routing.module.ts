import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RechtePage } from './rechte.page';

const routes: Routes = [
  {
    path: '',
    component: RechtePage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RechtePageRoutingModule {}
