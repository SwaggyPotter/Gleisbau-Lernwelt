import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { asyncHandler } from '../middleware/async-handler';
import { requireAuth } from '../middleware/auth';
import { checkAndUnlockAchievements } from '../achievements';

export const statsRouter = Router();
statsRouter.use(requireAuth);

const syncSchema = z.object({
  moduleKey: z.string().min(1).max(80),
  correct: z.boolean(),
});

statsRouter.get('/me', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT module_key, correct, wrong, streak, best_streak, updated_at FROM module_stats WHERE user_id = $1 ORDER BY module_key',
    [req.user!.id],
  );

  const totalCorrect = rows.reduce((sum, r) => sum + r.correct, 0);
  const totalWrong = rows.reduce((sum, r) => sum + r.wrong, 0);
  const bestStreakOverall = rows.reduce((max, r) => Math.max(max, r.best_streak), 0);

  res.json({
    module: rows.map(r => ({
      moduleKey: r.module_key,
      correct: r.correct,
      wrong: r.wrong,
      streak: r.streak,
      bestStreak: r.best_streak,
      updatedAt: r.updated_at,
    })),
    summe: {
      beantwortet: totalCorrect + totalWrong,
      richtig: totalCorrect,
      quote: totalCorrect + totalWrong === 0 ? 0 : Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100),
      bestStreakOverall,
    },
  });
}));

statsRouter.post('/sync', asyncHandler(async (req, res) => {
  const { moduleKey, correct } = syncSchema.parse(req.body);
  const userId = req.user!.id;

  const { rows: existingRows } = await pool.query(
    'SELECT correct, wrong, streak, best_streak FROM module_stats WHERE user_id = $1 AND module_key = $2',
    [userId, moduleKey],
  );
  const existing = existingRows[0] ?? { correct: 0, wrong: 0, streak: 0, best_streak: 0 };

  const nextCorrect = existing.correct + (correct ? 1 : 0);
  const nextWrong = existing.wrong + (correct ? 0 : 1);
  const nextStreak = correct ? existing.streak + 1 : 0;
  const nextBestStreak = Math.max(existing.best_streak, nextStreak);

  await pool.query(
    `INSERT INTO module_stats (user_id, module_key, correct, wrong, streak, best_streak, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, now())
     ON CONFLICT (user_id, module_key)
     DO UPDATE SET correct = $3, wrong = $4, streak = $5, best_streak = $6, updated_at = now()`,
    [userId, moduleKey, nextCorrect, nextWrong, nextStreak, nextBestStreak],
  );

  const neu = await checkAndUnlockAchievements(userId);

  res.json({
    module: { moduleKey, correct: nextCorrect, wrong: nextWrong, streak: nextStreak, bestStreak: nextBestStreak },
    neueErrungenschaften: neu,
  });
}));
