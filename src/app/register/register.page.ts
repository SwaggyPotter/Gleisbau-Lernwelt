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
  key = '';
  error = '';

  constructor(
    private readonly authService: AuthService,
    private readonly learningData: LearningDataService,
    private readonly router: Router,
  ) {}

  handleRegister(): void {
    const name = this.fullName.trim() || 'Admin';
    if (!this.key.trim()) {
      this.error = 'Bitte fuege deinen Lern-Key ein.';
      return;
    }
    if (!name.includes(' ')) {
      this.error = 'Bitte Vor- und Nachname angeben.';
      return;
    }
    const record = this.learningData.registerUser(name, this.key.trim());
    if (!record) {
      this.error = 'Key ist ungueltig oder nicht hinterlegt.';
      return;
    }
    this.error = '';
    this.authService.loginWithRecord(record);
    this.router.navigate(['/dashboard']);
  }
}
