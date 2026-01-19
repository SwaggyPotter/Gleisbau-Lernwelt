import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  handleLogin(): void {
    this.authService.loginAsAdmin();
    this.router.navigate(['/home']);
  }
}
