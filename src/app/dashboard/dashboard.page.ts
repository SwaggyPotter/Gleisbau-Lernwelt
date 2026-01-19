import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, UserProfile } from '../services/auth.service';
import { LearningDataService } from '../services/learning-data.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false,
})
export class DashboardPage implements OnDestroy {
  user: UserProfile | null = null;
  groupedTiles: Array<{ year: 1 | 2 | 3; fields: Array<{ id: string; title: string; description: string; tag: string; progress: number; mistakes: number }> }> = [];
  summary = { completed: 0, inProgress: 0, planned: 0 };
  private sub = new Subscription();

  constructor(
    private readonly authService: AuthService,
    private readonly learningData: LearningDataService,
    private readonly router: Router,
  ) {
    this.sub.add(
      this.authService.user$.subscribe(user => {
        this.user = user;
        this.refreshTiles();
      })
    );
    this.sub.add(
      this.learningData.usersStream$.subscribe(() => {
        this.refreshTiles();
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  handleLogout(): void {
    this.authService.logout();
    this.router.navigate(['/home']);
  }

  isAdmin(): boolean {
    return this.user?.role === 'admin';
  }

  goToAdmin(): void {
    this.router.navigate(['/admin']);
  }

  tileStatus(progress: number): { label: 'Abgeschlossen' | 'In Arbeit' | 'Geplant'; color: string } {
    if (progress >= 1) return { label: 'Abgeschlossen', color: 'success' };
    if (progress > 0) return { label: 'In Arbeit', color: 'warning' };
    return { label: 'Geplant', color: 'medium' };
  }

  private refreshTiles(): void {
    if (!this.user) {
      this.groupedTiles = [];
      this.summary = { completed: 0, inProgress: 0, planned: 0 };
      return;
    }
    const record = this.user.id ? this.learningData.getUserById(this.user.id) : null;
    const groupedAll = this.learningData.getTilesForUser(record);
    const scoped = this.user.role === 'admin' || !record?.year ? groupedAll : groupedAll.filter(g => g.year === record.year);
    this.groupedTiles = scoped;

    const allFields = scoped.reduce(
      (acc: Array<{ progress: number }>, group) => acc.concat(group.fields),
      [],
    );
    const completed = allFields.filter((f: { progress: number }) => f.progress >= 1).length;
    const inProgress = allFields.filter((f: { progress: number }) => f.progress > 0 && f.progress < 1).length;
    const planned = allFields.filter((f: { progress: number }) => f.progress === 0).length;
    this.summary = { completed, inProgress, planned };
  }
}
