import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { SkinPickerComponent } from './skin-picker.component';

@NgModule({
  declarations: [SkinPickerComponent],
  imports: [CommonModule, IonicModule],
  exports: [SkinPickerComponent],
})
export class SkinPickerModule {}
