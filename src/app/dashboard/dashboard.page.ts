import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, switchMap, of } from 'rxjs';
import { AuthService, UserProfile } from '../services/auth.service';
import { ApiService, SnapshotDto } from '../services/api.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false,
})
export class DashboardPage implements OnDestroy {
  user: UserProfile | null = null;
  groupedTiles: Array<{ year: 1 | 2 | 3; fields: SnapshotDto['fields'] }> = [];
  summary = { completed: 0, inProgress: 0, planned: 0 };
  private sub = new Subscription();

  constructor(
    private readonly authService: AuthService,
    private readonly api: ApiService,
    private readonly router: Router,
  ) {
    this.sub.add(
      this.authService.user$.pipe(
        switchMap(user => {
          this.user = user;
          if (!user) {
            this.groupedTiles = [];
            this.summary = { completed: 0, inProgress: 0, planned: 0 };
            return of(null);
          }
          return this.api.getSnapshot(user.id);
        }),
      ).subscribe(res => {
        if (res?.snapshot) {
          this.applySnapshot(res.snapshot as SnapshotDto);
        }
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

  tileStatus(progress?: number): { label: 'Abgeschlossen' | 'In Arbeit' | 'Geplant'; color: string } {
    const value = progress ?? 0;
    if (value >= 1) return { label: 'Abgeschlossen', color: 'success' };
    if (value > 0) return { label: 'In Arbeit', color: 'warning' };
    return { label: 'Geplant', color: 'medium' };
  }

  private refreshTiles(): void {
    // handled in subscription
  }

  private applySnapshot(snapshot: SnapshotDto): void {
    const fields = snapshot.fields ?? [];
    const grouped: Record<number, typeof fields> = {};
    fields.forEach(field => {
      const yr = field.year;
      if (!grouped[yr]) grouped[yr] = [];
      grouped[yr].push(field);
    });
    this.groupedTiles = Object.keys(grouped).map(y => ({
      year: Number(y) as 1 | 2 | 3,
      fields: grouped[Number(y)],
    })).sort((a, b) => a.year - b.year);

    const completed = fields.filter(f => (f.progress ?? 0) >= 1).length;
    const inProgress = fields.filter(f => (f.progress ?? 0) > 0 && (f.progress ?? 0) < 1).length;
    const planned = fields.filter(f => (f.progress ?? 0) === 0).length;
    this.summary = { completed, inProgress, planned };
  }
}
