import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { LearningDataService, RegistrationKey, UserSnapshot } from '../services/learning-data.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
  standalone: false,
})
export class AdminPage implements OnDestroy {
  selectedYear: 1 | 2 | 3 = 1;
  lastKey?: RegistrationKey;
  snapshots: UserSnapshot[] = [];
  sub = new Subscription();
  keys$ = this.learningData.registrationKeys$;

  constructor(
    private readonly learningData: LearningDataService,
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {
    this.refresh();
    this.sub.add(
      this.learningData.usersStream$.subscribe(() => this.refresh())
    );
    this.sub.add(
      this.learningData.registrationKeys$.subscribe(() => {})
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  generateKey(): void {
    this.lastKey = this.learningData.generateKey(this.selectedYear, this.auth.currentUser?.name ?? 'Admin');
  }

  refresh(): void {
    this.snapshots = this.learningData.getAllSnapshots();
  }

  gotoDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
