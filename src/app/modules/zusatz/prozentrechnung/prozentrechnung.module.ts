import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { PROZENTRECHNUNG_ROUTES } from './prozentrechnung.routes';
import { ProzentrechnungPage } from './pages/prozentrechnung.page';
import { ProzentrechnungNavComponent } from './components/prozentrechnung-nav.component';
import { ProzentrechnungLessonRendererComponent } from './components/lesson-renderer.component';
import { ProzentrechnungQuizEngineComponent } from './components/quiz-engine.component';

@NgModule({
  declarations: [
    ProzentrechnungPage,
    ProzentrechnungNavComponent,
    ProzentrechnungLessonRendererComponent,
    ProzentrechnungQuizEngineComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(PROZENTRECHNUNG_ROUTES),
  ],
})
export class ProzentrechnungModule {}
