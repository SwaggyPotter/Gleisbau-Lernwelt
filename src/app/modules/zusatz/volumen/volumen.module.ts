import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { VOLUMEN_ROUTES } from './volumen.routes';
import { VolumenPage } from './pages/volumen.page';
import { VolumenNavComponent } from './components/volumen-nav.component';
import { VolumenLessonRendererComponent } from './components/lesson-renderer.component';
import { VolumenQuizEngineComponent } from './components/quiz-engine.component';

@NgModule({
  declarations: [
    VolumenPage,
    VolumenNavComponent,
    VolumenLessonRendererComponent,
    VolumenQuizEngineComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(VOLUMEN_ROUTES),
  ],
})
export class VolumenModule {}
