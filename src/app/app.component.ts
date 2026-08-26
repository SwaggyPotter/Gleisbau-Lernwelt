import { Component } from '@angular/core';
import { hasStoredSiteAuth } from './core/site-gate/site-gate.component';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Gleisbau Lernwelt';
  unlocked = hasStoredSiteAuth();
}