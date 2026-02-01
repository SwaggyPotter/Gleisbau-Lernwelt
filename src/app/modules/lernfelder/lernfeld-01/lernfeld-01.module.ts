import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { LERNFELD01_ROUTES } from './lernfeld-01.routes';
import { Lernfeld01Page } from './pages/lernfeld-01.page';
import { Lf01NavComponent } from './components/lf01-nav.component';
import { LessonRendererComponent } from './components/lesson-renderer.component';
import { QuizEngineComponent } from './components/quiz-engine.component';
import { ScenarioRunnerComponent } from './components/scenario-runner.component';
import { DragDropPuzzleComponent } from './components/drag-drop-puzzle.component';
import { Lf01ChecklistenComponent } from './components/lf01-checklisten.component';
import { Lf01SignPuzzleComponent } from './components/lf01-sign-puzzle.component';
import { Lf01QuicktestComponent } from './components/lf01-quicktest.component';

@NgModule({
  declarations: [
    Lernfeld01Page,
    Lf01NavComponent,
    LessonRendererComponent,
    QuizEngineComponent,
    ScenarioRunnerComponent,
    DragDropPuzzleComponent,
    Lf01ChecklistenComponent,
    Lf01SignPuzzleComponent,
    Lf01QuicktestComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(LERNFELD01_ROUTES),
  ],
})
export class Lernfeld01Module {}

