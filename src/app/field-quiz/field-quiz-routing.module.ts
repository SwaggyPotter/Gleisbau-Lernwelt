import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FieldQuizPage } from './field-quiz.page';

const routes: Routes = [
  {
    path: '',
    component: FieldQuizPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FieldQuizPageRoutingModule {}
