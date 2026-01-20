import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LearningDataService } from '../services/learning-data.service';

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
  error = '';

  constructor(
    private readonly authService: AuthService,
    private readonly learningData: LearningDataService,
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
    const record = this.learningData.registerUser(name, email, this.key.trim());
    if (!record) {
      this.error = 'Key ist ungueltig oder nicht hinterlegt.';
      return;
    }
    this.error = '';
    this.authService.loginWithRecord(record);
    this.router.navigate(['/home']);
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
