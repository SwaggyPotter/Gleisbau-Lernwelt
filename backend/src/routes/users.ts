import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { asyncHandler } from '../middleware/async-handler';
import { httpError } from '../middleware/error-handler';
import { ACCOUNT_DELETION_GRACE_DAYS, purgeDueDeletedUsers } from '../user-deletion';

const progressSchema = z.object({
  fieldId: z.string().min(1),
  progress: z.number().min(0).max(1),
  mistakes: z.number().int().min(0).optional(),
});

const deleteModeSchema = z.enum(['grace', 'immediate']);

export const usersRouter = Router();

usersRouter.get('/', asyncHandler(async (_req, res) => {
  await purgeDueDeletedUsers();
  const { rows } = await pool.query(
    `SELECT id, full_name, email, role, year, key_used, created_at, deletion_scheduled_at, deletion_due_at
     FROM users
     ORDER BY created_at DESC`,
  );
  res.json({ users: rows });
}));

usersRouter.get('/snapshots', asyncHandler(async (_req, res) => {
  await purgeDueDeletedUsers();
  const { rows: users } = await pool.query(
    'SELECT id, full_name, email, role, year, key_used FROM users WHERE role <> \'admin\' ORDER BY created_at DESC',
  );

  const { rows: fields } = await pool.query(
    'SELECT id, title, year FROM learning_fields ORDER BY year, id',
  );
  const { rows: progressRows } = await pool.query(
    'SELECT user_id, field_id, progress, mistakes FROM user_progress',
  );

  const progressByUser = new Map<string, Array<{ field_id: string; progress: number; mistakes: number }>>();
  progressRows.forEach(row => {
    const arr = progressByUser.get(row.user_id) ?? [];
    arr.push({ field_id: row.field_id, progress: Number(row.progress), mistakes: Number(row.mistakes) });
    progressByUser.set(row.user_id, arr);
  });

  const snapshots = users.map(user => {
    const tileView = fields.map(field => {
      const stats = (progressByUser.get(user.id) || []).find(p => p.field_id === field.id) ?? { progress: 0, mistakes: 0 };
      return { ...field, progress: stats.progress, mistakes: stats.mistakes };
    });

    const completed = tileView.filter(t => t.progress >= 1).length;
    const inProgress = tileView.filter(t => t.progress > 0 && t.progress < 1).length;
    const planned = tileView.filter(t => t.progress === 0).length;
    const mistakesTotal = tileView.reduce((sum, t) => sum + t.mistakes, 0);
    const completionRate = tileView.length ? completed / tileView.length : 0;

    return {
      userId: user.id,
      fullName: user.full_name,
      year: user.year,
      completionRate,
      completed,
      inProgress,
      planned,
      mistakesTotal,
      mistakesByField: tileView.map(t => ({
        fieldId: t.id,
        fieldTitle: t.title,
        mistakes: t.mistakes,
      })),
    };
  });

  res.json({ snapshots });
}));

usersRouter.get('/:id/snapshot', asyncHandler(async (req, res) => {
  await purgeDueDeletedUsers();
  const userId = req.params.id;
  const { rows: userRows } = await pool.query(
    'SELECT id, full_name, email, role, year, key_used FROM users WHERE id = $1',
    [userId],
  );

  if (!userRows.length) {
    throw httpError(404, 'User not found');
  }

  const user = userRows[0];
  const { rows: fields } = await pool.query(
    'SELECT id, title, year FROM learning_fields ORDER BY year, id',
  );
  const { rows: progressRows } = await pool.query(
    'SELECT field_id, progress, mistakes FROM user_progress WHERE user_id = $1',
    [userId],
  );

  const progressMap = new Map(progressRows.map((row) => [row.field_id, {
    progress: Number(row.progress),
    mistakes: Number(row.mistakes),
  }]));

  const tileView = fields.map(field => {
    const stats = progressMap.get(field.id) ?? { progress: 0, mistakes: 0 };
    return { ...field, progress: stats.progress, mistakes: stats.mistakes };
  });

  const completed = tileView.filter(t => t.progress >= 1).length;
  const inProgress = tileView.filter(t => t.progress > 0 && t.progress < 1).length;
  const planned = tileView.filter(t => t.progress === 0).length;
  const mistakesTotal = tileView.reduce((sum, t) => sum + t.mistakes, 0);
  const completionRate = tileView.length ? completed / tileView.length : 0;

  res.json({
    snapshot: {
      userId: user.id,
      fullName: user.full_name,
      year: user.year,
      completionRate,
      completed,
      inProgress,
      planned,
      mistakesTotal,
      mistakesByField: tileView.map(t => ({
        fieldId: t.id,
        fieldTitle: t.title,
        mistakes: t.mistakes,
      })),
      fields: tileView,
    },
  });
}));

usersRouter.post('/:id/progress', asyncHandler(async (req, res) => {
  await purgeDueDeletedUsers();
  const userId = req.params.id;
  const { fieldId, progress, mistakes = 0 } = progressSchema.parse(req.body);

  const { rowCount: userExists } = await pool.query('SELECT 1 FROM users WHERE id = $1', [userId]);
  if (!userExists) {
    throw httpError(404, 'User not found');
  }

  const { rowCount: fieldExists } = await pool.query('SELECT 1 FROM learning_fields WHERE id = $1', [fieldId]);
  if (!fieldExists) {
    throw httpError(404, 'Field not found');
  }

  await pool.query(
    `INSERT INTO user_progress (user_id, field_id, progress, mistakes)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, field_id)
     DO UPDATE SET progress = EXCLUDED.progress, mistakes = EXCLUDED.mistakes, updated_at = now()`,
    [userId, fieldId, progress, mistakes],
  );

  res.status(204).send();
}));

usersRouter.delete('/:id', asyncHandler(async (req, res) => {
  await purgeDueDeletedUsers();
  const userId = z.string().min(1).parse(req.params.id);
  const mode = deleteModeSchema.parse(Array.isArray(req.query.mode) ? req.query.mode[0] : req.query.mode ?? 'grace');

  // Prevent accidental admin deletion
  const { rows } = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
  if (!rows.length) {
    throw httpError(404, 'User not found');
  }
  if (rows[0].role === 'admin') {
    throw httpError(403, 'Admin accounts koennen nicht geloescht werden');
  }

  if (mode === 'immediate') {
    const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    if (!rowCount) {
      throw httpError(404, 'User not found');
    }

    res.status(204).send();
    return;
  }

  await pool.query(
    `UPDATE users
     SET deletion_scheduled_at = COALESCE(deletion_scheduled_at, now()),
         deletion_due_at = COALESCE(deletion_due_at, now() + INTERVAL '${ACCOUNT_DELETION_GRACE_DAYS} days')
     WHERE id = $1`,
    [userId],
  );

  res.status(204).send();
}));
