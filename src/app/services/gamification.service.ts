import { Injectable } from '@angular/core';

type QuizStat = { correct?: number; wrong?: number };
type StoredProgress = { quizStats?: Record<string, QuizStat> };

type StoredProfile = {
  username: string;
  avatarDataUrl: string | null;
  learningDays: string[];
};

type FieldDefinition = {
  id: string;
  title: string;
  storageKey: string;
};

export interface FieldAchievement {
  fieldId: string;
  title: string;
  unlocked: boolean;
  correctAnswers: number;
}

export interface QuizMilestone {
  id: string;
  title: string;
  threshold: number;
  unlocked: boolean;
  progress: number;
}

export interface GamificationSummary {
  fieldAchievements: FieldAchievement[];
  quizMilestones: QuizMilestone[];
  totalCorrectAnswers: number;
  streakDays: number;
}

@Injectable({ providedIn: 'root' })
export class GamificationService {
  private readonly profilePrefix = 'profile-custom-v1';

  private readonly fieldDefinitions: FieldDefinition[] = [
    { id: 'lf-01', title: 'Lernfeld 1', storageKey: 'lf01-progress' },
    { id: 'lf-02', title: 'Lernfeld 2', storageKey: 'lf02-progress' },
    { id: 'lf-03', title: 'Lernfeld 3', storageKey: 'lf03-progress' },
    { id: 'lf-04', title: 'Lernfeld 4', storageKey: 'lf04-progress' },
    { id: 'lf-05', title: 'Lernfeld 5', storageKey: 'lf05-progress' },
    { id: 'lf-06', title: 'Lernfeld 6', storageKey: 'lf06-progress' },
    { id: 'lf-07', title: 'Lernfeld 7', storageKey: 'lf07-progress' },
    { id: 'lf-08', title: 'Lernfeld 8', storageKey: 'lf08-progress' },
    { id: 'lf-09', title: 'Lernfeld 9', storageKey: 'lf09-progress' },
    { id: 'lf-10', title: 'Lernfeld 10', storageKey: 'lf10-progress' },
    { id: 'lf-11', title: 'Lernfeld 11', storageKey: 'lf11-progress' },
    { id: 'lf-12', title: 'Lernfeld 12', storageKey: 'lf12-progress' },
    { id: 'lf-13', title: 'Lernfeld 13', storageKey: 'lf13-progress' },
    { id: 'lf-14', title: 'Lernfeld 14', storageKey: 'lf14-progress' },
  ];

  private readonly quizMilestones = [10, 25, 50, 100, 200];

  getDisplayName(user: { id: string; role: 'admin' | 'user'; name?: string } | null): string {
    if (!user) {
      return 'Gast';
    }
    if (user.role === 'admin') {
      return 'Admin';
    }
    return this.getIdentity(user.id).username;
  }

  getIdentity(userId: string): { username: string; avatarDataUrl: string | null } {
    const profile = this.getOrCreateProfile(userId);
    return {
      username: profile.username,
      avatarDataUrl: profile.avatarDataUrl,
    };
  }

  updateIdentity(userId: string, username: string, avatarDataUrl: string | null): { username: string; avatarDataUrl: string | null } {
    const current = this.getOrCreateProfile(userId);
    const nextUsername = this.normalizeUsername(username, userId);
    const nextAvatar = this.normalizeAvatar(avatarDataUrl);
    const next: StoredProfile = {
      ...current,
      username: nextUsername,
      avatarDataUrl: nextAvatar,
    };
    this.writeProfile(userId, next);
    return { username: next.username, avatarDataUrl: next.avatarDataUrl };
  }

  recordLearningDay(userId: string): void {
    const profile = this.getOrCreateProfile(userId);
    const today = this.toIsoDate(new Date());
    if (!profile.learningDays.includes(today)) {
      const nextDays = [...profile.learningDays, today].sort();
      const trimmed = nextDays.slice(-400);
      this.writeProfile(userId, { ...profile, learningDays: trimmed });
    }
  }

  getSummary(userId: string): GamificationSummary {
    const profile = this.getOrCreateProfile(userId);

    const fieldAchievements = this.fieldDefinitions.map((field) => {
      const correctAnswers = this.countUniqueCorrectAnswers(field.storageKey);
      return {
        fieldId: field.id,
        title: field.title,
        unlocked: correctAnswers > 0,
        correctAnswers,
      };
    });

    const totalCorrectAnswers = fieldAchievements.reduce((sum, field) => sum + field.correctAnswers, 0);
    const quizMilestones = this.quizMilestones.map((threshold) => ({
      id: `quiz-${threshold}`,
      title: `${threshold} richtige Quizfragen`,
      threshold,
      unlocked: totalCorrectAnswers >= threshold,
      progress: Math.min(totalCorrectAnswers, threshold),
    }));

    return {
      fieldAchievements,
      quizMilestones,
      totalCorrectAnswers,
      streakDays: this.calculateStreak(profile.learningDays),
    };
  }

  private getOrCreateProfile(userId: string): StoredProfile {
    const raw = localStorage.getItem(this.storageKey(userId));
    if (!raw) {
      const created = this.createDefaultProfile(userId);
      this.writeProfile(userId, created);
      return created;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<StoredProfile>;
      const normalized: StoredProfile = {
        username: this.normalizeUsername(parsed.username ?? '', userId),
        avatarDataUrl: this.normalizeAvatar(parsed.avatarDataUrl ?? null),
        learningDays: this.normalizeDays(parsed.learningDays ?? []),
      };
      this.writeProfile(userId, normalized);
      return normalized;
    } catch {
      const created = this.createDefaultProfile(userId);
      this.writeProfile(userId, created);
      return created;
    }
  }

  private createDefaultProfile(userId: string): StoredProfile {
    return {
      username: this.generateUsername(userId),
      avatarDataUrl: null,
      learningDays: [],
    };
  }

  private writeProfile(userId: string, profile: StoredProfile): void {
    localStorage.setItem(this.storageKey(userId), JSON.stringify(profile));
  }

  private storageKey(userId: string): string {
    return `${this.profilePrefix}:${userId}`;
  }

  private normalizeUsername(value: string, userId: string): string {
    const cleaned = (value ?? '')
      .trim()
      .replace(/\s+/g, '')
      .replace(/[^A-Za-z0-9_-]/g, '')
      .slice(0, 18);

    if (cleaned.length >= 3) {
      return cleaned;
    }

    return this.generateUsername(userId);
  }

  private generateUsername(seed: string): string {
    const prefixes = ['Gleis', 'Signal', 'Schotter', 'Trasse', 'Bahn', 'Weiche'];
    const suffixes = ['Pilot', 'Crew', 'Fuchs', 'Profi', 'Scout', 'Builder'];
    const hash = this.hash(seed);
    const prefix = prefixes[Math.abs(hash) % prefixes.length];
    const suffix = suffixes[Math.abs(hash >> 3) % suffixes.length];
    const number = (Math.abs(hash) % 90) + 10;
    return `${prefix}${suffix}${number}`.slice(0, 18);
  }

  private normalizeAvatar(value: string | null): string | null {
    if (!value) {
      return null;
    }

    const trimmed = value.trim();
    if (!trimmed.startsWith('data:image/')) {
      return null;
    }

    if (trimmed.length > 550000) {
      return null;
    }

    return trimmed;
  }

  private normalizeDays(days: string[]): string[] {
    const valid = days.filter((day) => /^\d{4}-\d{2}-\d{2}$/.test(day));
    return Array.from(new Set(valid)).sort();
  }

  private calculateStreak(days: string[]): number {
    if (!days.length) {
      return 0;
    }

    const daySet = new Set(days);
    let cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    const today = this.toIsoDate(cursor);
    if (!daySet.has(today)) {
      const yesterday = new Date(cursor);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayIso = this.toIsoDate(yesterday);
      if (!daySet.has(yesterdayIso)) {
        return 0;
      }
      cursor = yesterday;
    }

    let streak = 0;
    while (daySet.has(this.toIsoDate(cursor))) {
      streak += 1;
      cursor = new Date(cursor);
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  private countUniqueCorrectAnswers(storageKey: string): number {
    const progress = this.readProgress(storageKey);
    const entries = Object.values(progress.quizStats ?? {});
    return entries.filter(entry => (entry?.correct ?? 0) > 0).length;
  }

  private readProgress(storageKey: string): StoredProgress {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return {};
    }

    try {
      return JSON.parse(raw) as StoredProgress;
    } catch {
      return {};
    }
  }

  private toIsoDate(value: Date): string {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private hash(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i += 1) {
      hash = ((hash << 5) - hash) + input.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }
}
