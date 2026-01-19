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

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  handleRegister(): void {
    const name = this.fullName.trim() || 'Admin';
    this.authService.loginAsAdmin(name);
    this.router.navigate(['/dashboard']);
  }
}
