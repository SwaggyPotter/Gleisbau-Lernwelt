import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/services/auth.service';

@Component({
  selector: 'app-registrieren',
  templateUrl: './registrieren.page.html',
  styleUrls: ['./registrieren.page.scss'],
  standalone: false,
})
export class RegistrierenPage {
  email = '';
  key = '';
  password = '';
  passwordWiederholen = '';
  busy = false;
  fehler: string | null = null;

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  submit(): void {
    this.fehler = null;
    if (!this.email.trim() || !this.key.trim() || !this.password) return;
    if (this.password.length < 8) {
      this.fehler = 'Das Passwort muss mindestens 8 Zeichen haben.';
      return;
    }
    if (this.password !== this.passwordWiederholen) {
      this.fehler = 'Die Passwörter stimmen nicht überein.';
      return;
    }

    this.busy = true;
    this.auth.register(this.email.trim(), this.key.trim().toUpperCase(), this.password).subscribe({
      next: () => {
        this.busy = false;
        this.router.navigateByUrl('/konto/profil');
      },
      error: (err) => {
        this.busy = false;
        this.fehler = err?.error?.error ?? 'Registrierung fehlgeschlagen.';
      },
    });
  }
}
