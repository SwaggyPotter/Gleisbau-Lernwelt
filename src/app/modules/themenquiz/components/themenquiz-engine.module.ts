import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ThemenquizEngineComponent } from './quiz-engine.component';

/** Quiz-Engine der Wissenstests – eigenes Modul, damit andere Seiten (z. B. Trassenplan) sie einbinden können. */
@NgModule({
  declarations: [ThemenquizEngineComponent],
  imports: [CommonModule, IonicModule],
  exports: [ThemenquizEngineComponent],
})
export class ThemenquizEngineModule {}
