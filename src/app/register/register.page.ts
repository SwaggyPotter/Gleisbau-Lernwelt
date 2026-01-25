import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false,
})
export class RegisterPage {
  email = '';
  key = '';
  password = '';
  passwordRepeat = '';
  error = '';
  success = '';

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  handleRegister(): void {
    const email = this.email.trim();
    if (!this.key.trim()) {
      this.error = 'Bitte fuege deinen Lern-Key ein.';
      return;
    }
    if (!email) {
      this.error = 'Bitte E-Mail angeben.';
      return;
    }
    if (!this.isValidEmail(email)) {
      this.error = 'Bitte gueltige E-Mail angeben.';
      return;
    }
    if (this.password.length < 8) {
      this.error = 'Passwort muss mindestens 8 Zeichen haben.';
      return;
    }
    if (this.password !== this.passwordRepeat) {
      this.error = 'Passwoerter stimmen nicht ueberein.';
      return;
    }
    this.error = '';
    this.authService.register(email, this.key.trim(), this.password).subscribe({
      next: () => {
        this.success = 'Registrierung erfolgreich. Bitte setze dein Passwort im Login-Bereich mit deinem Lern-Key.';
        this.router.navigate(['/login'], { queryParams: { email } });
      },
      error: () => this.error = 'Registrierung fehlgeschlagen. Bitte Key und Daten pruefen.',
    });
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
