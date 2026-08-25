import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { QuellenverzeichnisPageRoutingModule } from './quellenverzeichnis-routing.module';
import { QuellenverzeichnisPage } from './quellenverzeichnis.page';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, QuellenverzeichnisPageRoutingModule],
  declarations: [QuellenverzeichnisPage],
})
export class QuellenverzeichnisPageModule {}
