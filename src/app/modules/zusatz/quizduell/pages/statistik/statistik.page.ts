import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { QuizduellDataService } from '../../services/quizduell-data.service';
import { ACHIEVEMENTS, AchievementDef, QuizduellStats } from '../../models/quizduell.models';

@Component({
  selector: 'app-quizduell-statistik',
  standalone: false,
  templateUrl: './statistik.page.html',
  styleUrls: ['./statistik.page.scss'],
})
export class StatistikPage {
  stats: QuizduellStats | null = null;

  constructor(
    private readonly auth: AuthService,
    private readonly quizduellData: QuizduellDataService,
  ) {}

  ionViewWillEnter(): void {
    const user = this.auth.currentUser();
    this.stats = user ? this.quizduellData.loadStats(user.id) : null;
  }

  get istEingeloggt(): boolean {
    return this.auth.isLoggedIn();
  }

  get displayName(): string | null {
    return this.auth.currentUser()?.displayName ?? null;
  }

  get trefferquote(): number | null {
    if (!this.stats || this.stats.questionsTotal === 0) return null;
    return Math.round((100 * this.stats.questionsCorrect) / this.stats.questionsTotal);
  }

  get freigeschaltet(): AchievementDef[] {
    if (!this.stats) return [];
    const ids = new Set(this.stats.achievements);
    return ACHIEVEMENTS.filter((a) => ids.has(a.id));
  }

  get gesperrt(): AchievementDef[] {
    if (!this.stats) return ACHIEVEMENTS;
    const ids = new Set(this.stats.achievements);
    return ACHIEVEMENTS.filter((a) => !ids.has(a.id));
  }
}
