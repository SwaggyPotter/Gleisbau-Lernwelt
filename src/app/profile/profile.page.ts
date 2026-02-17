import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { GamificationService, GamificationSummary } from '../services/gamification.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false,
})
export class ProfilePage implements OnInit {
  usernameInput = '';
  avatarPreview: string | null = null;
  summary?: GamificationSummary;
  saveMessage = '';
  errorMessage = '';

  constructor(
    public readonly auth: AuthService,
    private readonly router: Router,
    private readonly gamification: GamificationService,
  ) {}

  ngOnInit(): void {
    this.loadProfileData();
  }

  ionViewWillEnter(): void {
    this.loadProfileData();
  }

  get user() {
    return this.auth.currentUser;
  }

  get displayName(): string {
    return this.gamification.getDisplayName(this.user);
  }

  get isAdmin(): boolean {
    return this.user?.role === 'admin';
  }

  get unlockedFieldCount(): number {
    return this.summary?.fieldAchievements.filter(item => item.unlocked).length ?? 0;
  }

  get unlockedQuizMilestones(): number {
    return this.summary?.quizMilestones.filter(item => item.unlocked).length ?? 0;
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  goToAdmin(): void {
    this.router.navigate(['/admin']);
  }

  onUsernameInput(event: Event): void {
    const custom = event as CustomEvent<{ value?: string | null }>;
    this.usernameInput = (custom.detail?.value ?? '').toString();
  }

  onAvatarSelected(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    const file = target?.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > 400 * 1024) {
      this.errorMessage = 'Bild ist zu gross (max. 400 KB).';
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Bitte eine gueltige Bilddatei auswaehlen.';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const value = typeof reader.result === 'string' ? reader.result : null;
      this.avatarPreview = value;
      this.errorMessage = '';
      this.saveMessage = '';
    };
    reader.onerror = () => {
      this.errorMessage = 'Bild konnte nicht gelesen werden.';
    };
    reader.readAsDataURL(file);
  }

  removeAvatar(): void {
    this.avatarPreview = null;
    this.saveMessage = '';
    this.errorMessage = '';
  }

  saveProfileSettings(): void {
    if (!this.user) {
      return;
    }

    const saved = this.gamification.updateIdentity(this.user.id, this.usernameInput, this.avatarPreview);
    this.usernameInput = saved.username;
    this.avatarPreview = saved.avatarDataUrl;
    this.summary = this.gamification.getSummary(this.user.id);
    this.errorMessage = '';
    this.saveMessage = 'Profil gespeichert.';
  }

  private loadProfileData(): void {
    this.saveMessage = '';
    this.errorMessage = '';

    if (!this.user) {
      this.summary = undefined;
      return;
    }

    const identity = this.gamification.getIdentity(this.user.id);
    this.usernameInput = identity.username;
    this.avatarPreview = identity.avatarDataUrl;
    this.summary = this.gamification.getSummary(this.user.id);
  }
}
