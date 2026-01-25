import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { FieldQuizPageRoutingModule } from './field-quiz-routing.module';
import { FieldQuizPage } from './field-quiz.page';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, FieldQuizPageRoutingModule],
  declarations: [FieldQuizPage],
})
export class FieldQuizPageModule {}
