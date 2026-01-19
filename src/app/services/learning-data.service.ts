import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface LearningField {
  id: string;
  title: string;
  description: string;
  year: 1 | 2 | 3;
  tag: string;
}

export interface RegistrationKey {
  key: string;
  year: 1 | 2 | 3;
  createdAt: number;
  uses: number;
  issuedBy: string;
}

export interface FieldProgress {
  progress: number; // 0 - 1
  mistakes: number;
}

export interface UserRecord {
  userId: string;
  fullName: string;
  role: 'user' | 'admin';
  year?: 1 | 2 | 3;
  keyUsed?: string;
  progress: Record<string, FieldProgress>;
}

export interface UserSnapshot {
  userId: string;
  fullName: string;
  year?: 1 | 2 | 3;
  completionRate: number;
  completed: number;
  inProgress: number;
  planned: number;
  mistakesTotal: number;
  mistakesByField: Array<{ fieldId: string; fieldTitle: string; mistakes: number }>;
}

@Injectable({
  providedIn: 'root',
})
export class LearningDataService {
  private readonly fields: LearningField[] = [
    { id: 'gf-01', title: 'Gleisbau Grundlagen', description: 'Streckenteile, Spurweite, Lagerung. Pflichteinweisung fuer alle.', year: 1, tag: 'Pflichtmodul' },
    { id: 'gf-02', title: 'Sicherheit & PSA', description: 'Sicherheitsbriefing, PSA-Checkliste und Notfallablaeufe.', year: 1, tag: 'Sicherheit' },
    { id: 'gf-03', title: 'Werkzeuge & Material', description: 'Werkzeugkunde, Sichtpruefung und Lagerung.', year: 1, tag: 'Werkzeuge' },
    { id: 'vert-01', title: 'Weichen & Kreuzungen', description: 'Weichenmontage, Justage, Sichtpruefung unter Last.', year: 2, tag: 'Vertiefung' },
    { id: 'vert-02', title: 'Schotter & Unterbau', description: 'Bettung, Stopfqualitaet, Verdichtung nach Vorgabe.', year: 2, tag: 'Praxis' },
    { id: 'vert-03', title: 'Qualitaetsnachweise', description: 'Fotodoku, Messpunkte und digitale Uebergabe.', year: 2, tag: 'Dokumentation' },
    { id: 'pro-01', title: 'Maschinenkunde', description: 'Stopfmaschine, Schweissanlage, Sicherheitszonen.', year: 3, tag: 'Maschinen' },
    { id: 'pro-02', title: 'Arbeiten unter Betrieb', description: 'Kommunikation, Sperrpausen, Gefahrenraum.', year: 3, tag: 'Betrieb' },
    { id: 'pro-03', title: 'Abnahme & Audit', description: 'Pruefprotokolle, Abnahmegespraech, Audit-Checkliste.', year: 3, tag: 'Audit' },
  ];

  private readonly keys$ = new BehaviorSubject<RegistrationKey[]>([
    { key: 'J1-DEMO-001', year: 1, createdAt: Date.now() - 86400000 * 4, uses: 2, issuedBy: 'Admin' },
    { key: 'J2-DEMO-002', year: 2, createdAt: Date.now() - 86400000 * 2, uses: 1, issuedBy: 'Admin' },
    { key: 'J3-DEMO-003', year: 3, createdAt: Date.now() - 86400000, uses: 0, issuedBy: 'Admin' },
  ]);

  private readonly users$ = new BehaviorSubject<UserRecord[]>([
    {
      userId: 'demo-admin',
      fullName: 'Admin',
      role: 'admin',
      progress: {},
    },
    {
      userId: 'user-anna',
      fullName: 'Anna Bauer',
      role: 'user',
      year: 1,
      keyUsed: 'J1-DEMO-001',
      progress: this.seedProgress({ 'gf-01': 1, 'gf-02': 0.82, 'gf-03': 0.35 }),
    },
    {
      userId: 'user-lukas',
      fullName: 'Lukas Meier',
      role: 'user',
      year: 2,
      keyUsed: 'J2-DEMO-002',
      progress: this.seedProgress({ 'gf-01': 1, 'gf-02': 1, 'gf-03': 0.8, 'vert-01': 0.65, 'vert-02': 0.1 }),
    },
    {
      userId: 'user-samira',
      fullName: 'Samira Roth',
      role: 'user',
      year: 3,
      keyUsed: 'J3-DEMO-003',
      progress: this.seedProgress({ 'gf-01': 1, 'gf-02': 1, 'gf-03': 1, 'vert-01': 1, 'vert-02': 1, 'vert-03': 0.6, 'pro-01': 0.25 }),
    },
  ]);

  get registrationKeys$() {
    return this.keys$.asObservable();
  }

  get usersStream$() {
    return this.users$.asObservable();
  }

  getUserById(userId: string): UserRecord | null {
    return this.users$.value.find(u => u.userId === userId) ?? null;
  }

  getAllFields(): LearningField[] {
    return this.fields;
  }

  generateKey(year: 1 | 2 | 3, issuedBy: string = 'Admin'): RegistrationKey {
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    const key: RegistrationKey = {
      key: `J${year}-${rand}`,
      year,
      createdAt: Date.now(),
      uses: 0,
      issuedBy,
    };
    this.keys$.next([key, ...this.keys$.value]);
    return key;
  }

  resolveYearForKey(key: string): 1 | 2 | 3 | null {
    const entry = this.keys$.value.find(k => k.key.toUpperCase() === key.toUpperCase());
    return entry ? entry.year : null;
  }

  recordKeyUse(key: string): void {
    this.keys$.next(
      this.keys$.value.map(entry =>
        entry.key.toUpperCase() === key.toUpperCase() ? { ...entry, uses: entry.uses + 1 } : entry
      )
    );
  }

  registerUser(fullName: string, key: string): UserRecord | null {
    const year = this.resolveYearForKey(key);
    if (!year) {
      return null;
    }
    const userId = `user-${Date.now().toString(36)}`;
    const record: UserRecord = {
      userId,
      fullName,
      role: 'user',
      year,
      keyUsed: key,
      progress: this.seedProgress(),
    };
    this.users$.next([...this.users$.value, record]);
    this.recordKeyUse(key);
    return record;
  }

  getTilesForUser(user: UserRecord | null): Array<{ year: 1 | 2 | 3; fields: Array<LearningField & { progress: number; mistakes: number }> }> {
    const progress = user?.progress ?? {};
    const grouped: Record<number, Array<LearningField & { progress: number; mistakes: number }>> = {};
    this.fields.forEach(field => {
      const stats = progress[field.id] ?? { progress: 0, mistakes: 0 };
      if (!grouped[field.year]) {
        grouped[field.year] = [];
      }
      grouped[field.year].push({ ...field, progress: stats.progress, mistakes: stats.mistakes });
    });
    return (Object.keys(grouped) as Array<'1' | '2' | '3'>)
      .map(yearKey => ({ year: Number(yearKey) as 1 | 2 | 3, fields: grouped[Number(yearKey)] }))
      .sort((a, b) => a.year - b.year);
  }

  getUserSnapshot(userId: string): UserSnapshot | null {
    const user = this.users$.value.find(u => u.userId === userId);
    if (!user) return null;
    const tileView = this.getTilesForUser(user).reduce(
      (acc: Array<LearningField & { progress: number; mistakes: number }>, g) => acc.concat(g.fields),
      [],
    );
    const completed = tileView.filter((t) => t.progress >= 1).length;
    const inProgress = tileView.filter((t) => t.progress > 0 && t.progress < 1).length;
    const planned = tileView.filter((t) => t.progress === 0).length;
    const mistakesTotal = tileView.reduce((sum, t) => sum + t.mistakes, 0);
    const completionRate = tileView.length ? completed / tileView.length : 0;

    return {
      userId: user.userId,
      fullName: user.fullName,
      year: user.year,
      completionRate,
      completed,
      inProgress,
      planned,
      mistakesTotal,
      mistakesByField: tileView.map(t => ({ fieldId: t.id, fieldTitle: t.title, mistakes: t.mistakes })),
    };
  }

  getAllSnapshots(): UserSnapshot[] {
    return this.users$.value
      .filter(u => u.role !== 'admin')
      .map(u => this.getUserSnapshot(u.userId))
      .filter((s): s is UserSnapshot => !!s);
  }

  recordMistake(userId: string, fieldId: string): void {
    this.users$.next(
      this.users$.value.map(u => {
        if (u.userId !== userId) return u;
        const current = u.progress[fieldId] ?? { progress: 0, mistakes: 0 };
        return {
          ...u,
          progress: {
            ...u.progress,
            [fieldId]: { ...current, mistakes: current.mistakes + 1 },
          },
        };
      })
    );
  }

  updateProgress(userId: string, fieldId: string, progress: number): void {
    this.users$.next(
      this.users$.value.map(u => {
        if (u.userId !== userId) return u;
        const current = u.progress[fieldId] ?? { progress: 0, mistakes: 0 };
        return {
          ...u,
          progress: {
            ...u.progress,
            [fieldId]: { ...current, progress },
          },
        };
      })
    );
  }

  private seedProgress(custom?: Record<string, number>): Record<string, FieldProgress> {
    const progress: Record<string, FieldProgress> = {};
    this.fields.forEach(field => {
      const pct = custom && custom[field.id] !== undefined ? custom[field.id] : this.randomProgress(field.year);
      progress[field.id] = { progress: pct, mistakes: Math.random() > 0.6 ? Math.floor(Math.random() * 3) : 0 };
    });
    return progress;
  }

  private randomProgress(year: 1 | 2 | 3): number {
    const presets: Record<number, number[]> = {
      1: [1, 0.82, 0.6, 0.35, 0],
      2: [0.65, 0.4, 0.1, 0],
      3: [0.6, 0.35, 0.2, 0],
    };
    const pool = presets[year] ?? [0];
    return pool[Math.floor(Math.random() * pool.length)];
  }
}
