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
  email: string;
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
    { id: 'gb-01', title: 'Einrichten einer Baustelle', description: 'Baustellenvorbereitung, Absicherung und Vermessung vor Beginn der Bauarbeiten.', year: 1, tag: 'Baustelle' },
    { id: 'gb-02', title: 'Erschliessen und Gruenden eines Bauwerks', description: 'Aushub von Baugruben, Herstellen von Fundamenten und Grundlagen der Erdarbeiten.', year: 1, tag: 'Erdarbeiten' },
    { id: 'gb-03', title: 'Mauern eines einschaligen Baukoerpers', description: 'Errichten einfacher Mauerwerke, z. B. eine gerade Wand aus Steinen.', year: 1, tag: 'Mauerwerk' },
    { id: 'gb-04', title: 'Herstellen einer Holzkonstruktion', description: 'Grundlegende Zimmerer- und Schalungsarbeiten in Holz.', year: 1, tag: 'Holzbau' },
    { id: 'gb-05', title: 'Herstellen eines Stahlbetonbauteiles', description: 'Bewehrungsstahl verarbeiten, Schalung bauen und Beton giessen fuer einfache Bauteile.', year: 1, tag: 'Stahlbeton' },
    { id: 'gb-06', title: 'Beschichten und Bekleiden eines Bauteiles', description: 'Oberflaechenbehandlung, Daemmung oder Verkleidung als Schutz und Finish.', year: 1, tag: 'Ausbau' },
    { id: 'vert-01', title: 'Herstellen eines Erdkorpers', description: 'Aufschuetten und Verdichten eines Gleisdamms oder Ausheben eines Einschnitts als Unterbau fuer das Gleisbett.', year: 2, tag: 'Erdarbeiten' },
    { id: 'vert-02', title: 'Entwaessern von Verkehrsflaechen', description: 'Drainagen entlang des Gleiskoerpers anlegen und Oberflaechenwasser ableiten.', year: 2, tag: 'Entwaesserung' },
    { id: 'vert-03', title: 'Herstellen einer Gleisanlage', description: 'Schwellen und Schienen verlegen, Gleis ausrichten, einschottern und Grundjustierung der Gleislage.', year: 2, tag: 'Gleisbau' },
    { id: 'vert-04', title: 'Pflastern von Verkehrsflächen', description: 'Pflaster- und Wegebauarbeiten wie Bahnsteigbelaege, Randwege oder Strassenanteile an Gleisanlagen.', year: 2, tag: 'Pflaster' },
    { id: 'pro-01', title: 'Herstellen eines Gleisbogens', description: 'Gleisanlagen in Kurvenlage bauen und vermessen: Radius und Ueberhoehung festlegen, Schienen biegen und verlegen.', year: 3, tag: 'Gleisbau' },
    { id: 'pro-02', title: 'Montieren einer Weiche', description: 'Weichenkomponenten montieren, Zungen und Herzstuecke justieren und in bestehende Gleise einpassen.', year: 3, tag: 'Weichen' },
    { id: 'pro-03', title: 'Herstellen einer Festen Fahrbahn', description: 'Schotterlosen Oberbau erstellen, Gleise auf Betonplatten oder -troegen verlegen, z. B. in Tunneln oder Hochgeschwindigkeitsstrecken.', year: 3, tag: 'Feste Fahrbahn' },
    { id: 'pro-04', title: 'Instandhalten von Gleisanlagen', description: 'Inspektion und Wartung von Gleisen und Weichen: Gleislage pruefen, nachstopfen, Verschleissteile tauschen, Sicherungen setzen.', year: 3, tag: 'Instandhaltung' },
    { id: 'pro-05', title: 'Beheben eines Schienenbruchs', description: 'Defekte Schienenstuecke ausbauen und instandsetzen, z. B. per Thermitschweissen oder Schraubverbindung; Notfallbereitschaft sicherstellen.', year: 3, tag: 'Notfall' },
    { id: 'pro-06', title: 'Herstellen eines Bahnuebergangs', description: 'Hoehengleichen Bahnuebergang bauen: Gleise im Strassenbereich einbauen, Gummimatten/Asphalt verlegen, Sicherungseinrichtungen anbringen.', year: 3, tag: 'Bahnuebergang' },
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
      email: 'admin@example.de',
      role: 'admin',
      progress: {},
    },
    {
      userId: 'user-anna',
      fullName: 'Anna Bauer',
      email: 'anna.bauer@example.de',
      role: 'user',
      year: 1,
      keyUsed: 'J1-DEMO-001',
      progress: this.seedProgress({ 'gb-01': 1, 'gb-02': 0.82, 'gb-03': 0.35, 'gb-04': 0.2 }),
    },
    {
      userId: 'user-lukas',
      fullName: 'Lukas Meier',
      email: 'lukas.meier@example.de',
      role: 'user',
      year: 2,
      keyUsed: 'J2-DEMO-002',
      progress: this.seedProgress({ 'gb-01': 1, 'gb-02': 1, 'gb-03': 0.8, 'gb-04': 0.6, 'vert-01': 0.65, 'vert-02': 0.35, 'vert-03': 0.1 }),
    },
    {
      userId: 'user-samira',
      fullName: 'Samira Roth',
      email: 'samira.roth@example.de',
      role: 'user',
      year: 3,
      keyUsed: 'J3-DEMO-003',
      progress: this.seedProgress({
        'gb-01': 1,
        'gb-02': 1,
        'gb-03': 1,
        'gb-04': 1,
        'gb-05': 0.6,
        'gb-06': 0.25,
        'vert-01': 1,
        'vert-02': 1,
        'vert-03': 1,
        'vert-04': 0.6,
        'pro-01': 0.6,
        'pro-02': 0.35,
        'pro-03': 0.25,
        'pro-04': 0.1,
        'pro-05': 0,
        'pro-06': 0,
      }),
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

  registerUser(fullName: string, email: string, key: string): UserRecord | null {
    const year = this.resolveYearForKey(key);
    if (!year) {
      return null;
    }
    const userId = `user-${Date.now().toString(36)}`;
    const record: UserRecord = {
      userId,
      fullName,
      email,
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
