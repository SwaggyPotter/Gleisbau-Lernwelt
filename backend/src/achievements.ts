import { pool } from './db/pool';

export interface AchievementDef {
  key: string;
  title: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { key: 'erste-schritte', title: 'Erste Schritte', description: 'Die erste Aufgabe in einem beliebigen Modul beantwortet.', icon: 'footsteps-outline' },
  { key: 'streak-10', title: 'Zehnerserie', description: '10 Aufgaben in Folge richtig in einem Modul.', icon: 'flame-outline' },
  { key: 'streak-25', title: 'Serientäter', description: '25 Aufgaben in Folge richtig in einem Modul.', icon: 'flame-outline' },
  { key: 'streak-50', title: 'Unaufhaltsam', description: '50 Aufgaben in Folge richtig in einem Modul.', icon: 'flash-outline' },
  { key: 'hundert-richtig', title: 'Hundertschaft', description: '100 richtig beantwortete Aufgaben insgesamt.', icon: 'ribbon-outline' },
  { key: 'fuenfhundert-richtig', title: 'Vielübung', description: '500 richtig beantwortete Aufgaben insgesamt.', icon: 'trophy-outline' },
  { key: 'tausend-richtig', title: 'Marathon', description: '1000 richtig beantwortete Aufgaben insgesamt.', icon: 'medal-outline' },
  { key: 'alle-rechentrainer', title: 'Allrounder', description: 'In jedem Rechentrainer-Modul mindestens eine Aufgabe richtig gelöst.', icon: 'apps-outline' },
  { key: 'alle-themen', title: 'Vollständig', description: 'In jedem Wissenstest-Thema mindestens eine Frage beantwortet.', icon: 'library-outline' },
  { key: 'pruefung-bestanden', title: 'Bestanden', description: 'Die Prüfungssimulation mit mindestens 50 % abgeschlossen.', icon: 'checkmark-circle-outline' },
  { key: 'pruefung-90', title: 'Musterschüler', description: 'Die Prüfungssimulation mit mindestens 90 % abgeschlossen.', icon: 'star-outline' },
  { key: 'fehlerfrei-20', title: 'Fehlerfrei', description: '20 Aufgaben in einem Modul ohne einen einzigen Fehler.', icon: 'shield-checkmark-outline' },
  { key: 'baumaschinen-kenner', title: 'Baumaschinen-Kenner', description: 'Alle Baumaschinen im Bilderquiz mindestens einmal richtig erkannt.', icon: 'construct-outline' },
];

const RECHENTRAINER_KEYS = [
  'zusatz:materialrechner', 'zusatz:trassierung', 'zusatz:weichenrechner',
  'zusatz:schienendehnung', 'zusatz:volumen', 'zusatz:prozentrechnung', 'zusatz:nivellieren',
];
const THEMENQUIZ_TOPIC_COUNT = 25;
const BAUMASCHINEN_COUNT = 5;

export const seedAchievements = async (): Promise<void> => {
  for (const a of ACHIEVEMENTS) {
    await pool.query(
      `INSERT INTO achievements (key, title, description, icon)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (key) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, icon = EXCLUDED.icon`,
      [a.key, a.title, a.description, a.icon],
    );
  }
};

interface ModuleStatRow {
  module_key: string;
  correct: number;
  wrong: number;
  streak: number;
  best_streak: number;
}

/** Prueft nach einem Stats-Sync, welche neuen Errungenschaften freigeschaltet wurden. Gibt die neu freigeschalteten Keys zurueck. */
export const checkAndUnlockAchievements = async (userId: string): Promise<AchievementDef[]> => {
  const { rows: statRows } = await pool.query<ModuleStatRow>(
    'SELECT module_key, correct, wrong, streak, best_streak FROM module_stats WHERE user_id = $1',
    [userId],
  );
  const { rows: unlockedRows } = await pool.query('SELECT achievement_key FROM user_achievements WHERE user_id = $1', [userId]);
  const alreadyUnlocked = new Set(unlockedRows.map(r => r.achievement_key as string));

  const totalCorrect = statRows.reduce((sum, r) => sum + r.correct, 0);
  const totalAttempts = statRows.reduce((sum, r) => sum + r.correct + r.wrong, 0);
  const bestStreakOverall = Math.max(0, ...statRows.map(r => r.best_streak));
  const rechentrainerDone = RECHENTRAINER_KEYS.every(k => statRows.some(r => r.module_key === k && r.correct > 0));
  const themenquizCount = statRows.filter(r => r.module_key.startsWith('themenquiz:') && r.correct + r.wrong > 0).length;
  const perfektModul = statRows.some(r => r.wrong === 0 && r.correct >= 20);
  const pruefung = statRows.find(r => r.module_key === 'zusatz:pruefungssimulation');
  const pruefungProzent = pruefung && pruefung.correct + pruefung.wrong > 0
    ? (pruefung.correct / (pruefung.correct + pruefung.wrong)) * 100
    : 0;
  const baumaschinenModul = statRows.find(r => r.module_key === 'zusatz:baumaschinen');
  const baumaschinenAlle = (baumaschinenModul?.correct ?? 0) >= BAUMASCHINEN_COUNT;

  const qualifiesFor: Record<string, boolean> = {
    'erste-schritte': totalAttempts >= 1,
    'streak-10': bestStreakOverall >= 10,
    'streak-25': bestStreakOverall >= 25,
    'streak-50': bestStreakOverall >= 50,
    'hundert-richtig': totalCorrect >= 100,
    'fuenfhundert-richtig': totalCorrect >= 500,
    'tausend-richtig': totalCorrect >= 1000,
    'alle-rechentrainer': rechentrainerDone,
    'alle-themen': themenquizCount >= THEMENQUIZ_TOPIC_COUNT,
    'pruefung-bestanden': pruefungProzent >= 50,
    'pruefung-90': pruefungProzent >= 90,
    'fehlerfrei-20': perfektModul,
    'baumaschinen-kenner': baumaschinenAlle,
  };

  const neuFreigeschaltet: AchievementDef[] = [];
  for (const def of ACHIEVEMENTS) {
    if (alreadyUnlocked.has(def.key)) continue;
    if (!qualifiesFor[def.key]) continue;
    await pool.query(
      'INSERT INTO user_achievements (user_id, achievement_key) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, def.key],
    );
    neuFreigeschaltet.push(def);
  }
  return neuFreigeschaltet;
};
