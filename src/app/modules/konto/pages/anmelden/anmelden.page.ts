import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/services/auth.service';

@Component({
  selector: 'app-anmelden',
  templateUrl: './anmelden.page.html',
  styleUrls: ['./anmelden.page.scss'],
  standalone: false,
})
export class AnmeldenPage {
  email = '';
  password = '';
  busy = false;
  fehler: string | null = null;

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  submit(): void {
    if (!this.email.trim() || !this.password) return;
    this.busy = true;
    this.fehler = null;

    this.auth.login(this.email.trim(), this.password).subscribe({
      next: () => {
        this.busy = false;
        this.router.navigateByUrl('/konto/profil');
      },
      error: (err) => {
        this.busy = false;
        this.fehler = err?.error?.error ?? 'Anmeldung fehlgeschlagen.';
      },
    });
  }
}
