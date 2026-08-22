import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

type Mode = 'login' | 'register';

@Component({
  selector: 'app-quizduell-login',
  standalone: false,
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  mode: Mode = 'login';
  email = '';
  password = '';
  displayName = '';
  error: string | null = null;
  busy = false;

  private readonly returnUrl: string;

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/zusatz/quizduell/duell';
  }

  get isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  get currentDisplayName(): string | null {
    return this.auth.currentUser()?.displayName ?? null;
  }

  setMode(mode: Mode): void {
    this.mode = mode;
    this.error = null;
  }

  async submit(): Promise<void> {
    this.error = null;
    this.busy = true;
    const result =
      this.mode === 'login'
        ? await this.auth.login(this.email, this.password)
        : await this.auth.register(this.email, this.password, this.displayName);
    this.busy = false;

    if (!result.ok) {
      this.error = result.error ?? 'Unbekannter Fehler.';
      return;
    }
    this.router.navigateByUrl(this.returnUrl);
  }

  logout(): void {
    this.auth.logout();
  }
}
