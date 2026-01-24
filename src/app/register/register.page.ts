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
  fullName = '';
  email = '';
  key = '';
  password = '';
  error = '';

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  handleRegister(): void {
    const name = this.fullName.trim() || 'Admin';
    const email = this.email.trim();
    if (!this.key.trim()) {
      this.error = 'Bitte fuege deinen Lern-Key ein.';
      return;
    }
    if (!name.includes(' ')) {
      this.error = 'Bitte Vor- und Nachname angeben.';
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
    this.error = '';
    this.authService.register(name, email, this.password, this.key.trim()).subscribe({
      next: () => this.router.navigate(['/home']),
      error: () => this.error = 'Registrierung fehlgeschlagen. Bitte Key und Daten pruefen.',
    });
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
