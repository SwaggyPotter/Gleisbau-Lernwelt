import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AlertController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { ApiService, ApiUser, RegistrationKeyDto, SnapshotDto } from '../services/api.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
  standalone: false,
})
export class AdminPage implements OnDestroy {
  selectedYear: '1' | '2' | '3' = '1';
  lastKey?: RegistrationKeyDto;
  snapshots: SnapshotDto[] = [];
  sub = new Subscription();
  keys: RegistrationKeyDto[] = [];
  users: ApiUser[] = [];
  firstName = '';
  lastName = '';

  constructor(
    private readonly api: ApiService,
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly alertController: AlertController,
  ) {
    this.refresh();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  generateKey(): void {
    // ion-segment returns the value as a string; convert to number for the API
    const year = parseInt(this.selectedYear, 10);
    const fullName = `${this.firstName.trim()} ${this.lastName.trim()}`.trim();
    if (fullName.trim().length < 3 || !this.firstName.trim() || !this.lastName.trim()) {
      return;
    }

    this.api.createKey(year, fullName).subscribe({
      next: res => {
        this.lastKey = res.key;
        this.firstName = '';
        this.lastName = '';
        this.loadKeys();
      },
    });
  }

  refresh(): void {
    this.loadKeys();
    this.loadUsers();
    this.refreshSnapshots();
  }

  gotoDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  private loadKeys(): void {
    this.api.getKeys().subscribe(res => {
      this.keys = res.keys;
    });
  }

  deleteKey(key: string): void {
    this.api.deleteKey(key).subscribe({
      next: () => this.loadKeys(),
    });
  }

  private loadUsers(): void {
    this.api.getUsers().subscribe(res => {
      this.users = res.users;
    });
  }

  async confirmDeleteUser(user: ApiUser): Promise<void> {
    const dueDateHint = user.deletion_due_at
      ? `\nAktuell vorgemerkt bis ${this.formatDate(user.deletion_due_at)}.`
      : '';

    const alert = await this.alertController.create({
      header: 'Account loeschen',
      message: `Was soll mit ${user.full_name} passieren?${dueDateHint}`,
      buttons: [
        {
          text: 'Abbrechen',
          role: 'cancel',
        },
        {
          text: 'Nach 30 Tagen loeschen',
          handler: () => this.deleteUser(user.id, 'grace'),
        },
        {
          text: 'Sofort loeschen',
          role: 'destructive',
          handler: () => this.deleteUser(user.id, 'immediate'),
        },
      ],
    });

    await alert.present();
  }

  private deleteUser(userId: string, mode: 'grace' | 'immediate'): void {
    this.api.deleteUser(userId, mode).subscribe({
      next: () => {
        this.loadUsers();
        this.refreshSnapshots();
      },
    });
  }

  private refreshSnapshots(): void {
    this.api.getSnapshots().subscribe(res => {
      this.snapshots = res.snapshots;
    });
  }

  formatDate(value?: string | null): string {
    if (!value) return '-';

    return new Date(value).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
}
