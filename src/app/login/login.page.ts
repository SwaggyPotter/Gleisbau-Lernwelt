import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {
  email = '';
  password = '';
  key = '';
  newPassword = '';
  newPasswordRepeat = '';
  error = '';
  success = '';

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  handleLogin(): void {
    this.error = '';
    this.success = '';
    const email = this.email.trim();
    const password = this.password;
    if (!email || !password) {
      this.error = 'Bitte E-Mail und Passwort eingeben.';
      return;
    }
    this.authService.login(email, password).pipe(
      catchError(() => {
        this.error = 'Login fehlgeschlagen. Bitte pruefe deine Eingaben.';
        return of(null);
      }),
    ).subscribe(res => {
      if (res) {
        this.router.navigate(['/home']);
      }
    });
  }

  handleLoginWithKey(): void {
    this.error = '';
    this.success = '';
    const email = this.email.trim();
    const key = this.key.trim();
    if (!email || !key) {
      this.error = 'Bitte E-Mail und Lern-Key eingeben.';
      return;
    }
    if (this.newPassword.length < 8 || this.newPassword !== this.newPasswordRepeat) {
      this.error = 'Neues Passwort mindestens 8 Zeichen und beide Eingaben muessen uebereinstimmen.';
      return;
    }
    this.authService.loginWithKey(email, key, this.newPassword).pipe(
      catchError(() => {
        this.error = 'Key-Login fehlgeschlagen. Bitte pruefe E-Mail, Key und neues Passwort.';
        return of(null);
      }),
    ).subscribe(res => {
      if (res) {
        this.success = 'Passwort gesetzt. Du bist eingeloggt.';
        this.router.navigate(['/home']);
      }
    });
  }
}
