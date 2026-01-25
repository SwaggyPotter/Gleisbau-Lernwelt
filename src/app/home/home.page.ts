import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, switchMap, of } from 'rxjs';
import { AuthService, UserProfile } from '../services/auth.service';
import { ApiService, FieldDto, SnapshotDto } from '../services/api.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit, OnDestroy {
  user: UserProfile | null = null;
  groupedTiles: Array<{ year: 1 | 2 | 3; fields: Array<FieldDto> }> = [];
  summary = { completed: 0, inProgress: 0, planned: 0 };
  private sub = new Subscription();
  darkMode = true;

  constructor(
    private readonly authService: AuthService,
    private readonly api: ApiService,
    private readonly router: Router,
  ) {
    this.sub.add(
      this.authService.user$
        .pipe(
          switchMap(user => {
            this.user = user;
            if (!user) {
              this.groupedTiles = [];
              this.summary = { completed: 0, inProgress: 0, planned: 0 };
              return of(null);
            }
            return this.api.getSnapshot(user.id);
          }),
        )
        .subscribe((snapshotResponse: any) => {
          if (!snapshotResponse || !snapshotResponse.snapshot || !this.user) return;
          this.applySnapshot(snapshotResponse.snapshot as SnapshotDto);
        })
    );
  }

  ngOnInit(): void {
    document.body.classList.add('ion-palette-dark');
    this.darkMode = true;
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  tileStatus(progress?: number): { label: 'Abgeschlossen' | 'In Arbeit' | 'Offen'; color: string } {
    const value = progress ?? 0;
    if (value >= 1) return { label: 'Abgeschlossen', color: 'success' };
    if (value > 0) return { label: 'In Arbeit', color: 'warning' };
    return { label: 'Offen', color: 'medium' };
  }

  goToAdmin(): void {
    this.router.navigate(['/admin']);
  }

  isAdmin(): boolean {
    return this.user?.role === 'admin';
  }

  handleLogout(): void {
    this.authService.logout();
    this.refreshTiles();
  }

  scrollToLearning(): void {
    const target = document.getElementById('learning-section');
    target?.scrollIntoView({ behavior: 'smooth' });
  }

  toggleTheme(): void {
    const enabled = document.body.classList.toggle('ion-palette-dark');
    this.darkMode = enabled;
  }

  private refreshTiles(): void {
    // no-op: snapshot subscription updates data
  }

  private applySnapshot(snapshot: SnapshotDto): void {
    const fields = snapshot.fields ?? [];
    const grouped: Record<number, FieldDto[]> = {};
    fields.forEach(field => {
      const yr = field.year;
      if (!grouped[yr]) grouped[yr] = [];
      grouped[yr].push(field);
    });
    const scoped = Object.keys(grouped)
      .map(y => ({ year: Number(y) as 1 | 2 | 3, fields: grouped[Number(y)] }))
      .sort((a, b) => a.year - b.year);
    this.groupedTiles = scoped;

    const allFields = fields;
    const completed = allFields.filter(f => (f.progress ?? 0) >= 1).length;
    const inProgress = allFields.filter(f => (f.progress ?? 0) > 0 && (f.progress ?? 0) < 1).length;
    const planned = allFields.filter(f => (f.progress ?? 0) === 0).length;
    this.summary = { completed, inProgress, planned };
  }
}
