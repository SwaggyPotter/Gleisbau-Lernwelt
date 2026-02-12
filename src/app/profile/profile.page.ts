import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false,
})
export class ProfilePage {
  constructor(public readonly auth: AuthService, private readonly router: Router) {}

  get user() {
    return this.auth.currentUser;
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  goToAdmin(): void {
    this.router.navigate(['/admin']);
  }
}
