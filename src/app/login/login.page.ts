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
  error = '';
  success = '';

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  handleLogin(): void {
    this.error = '';
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
        this.router.navigate(['/dashboard']);
      }
    });
  }
}
