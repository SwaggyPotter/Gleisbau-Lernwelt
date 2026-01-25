import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { asyncHandler } from '../middleware/async-handler';
import { httpError } from '../middleware/error-handler';

const keySchema = z.object({
  year: z.number().int().min(1).max(3),
  issuedBy: z.string().min(1).optional(),
});

export const keysRouter = Router();

keysRouter.get('/', asyncHandler(async (_req, res) => {
  const { rows } = await pool.query(
    'SELECT key, year, created_at, uses, max_uses, issued_by FROM registration_keys ORDER BY created_at DESC',
  );
  res.json({ keys: rows });
}));

keysRouter.post('/', asyncHandler(async (req, res) => {
  const { year, issuedBy } = keySchema.parse(req.body);
  const maxUses = 1; // single-use keys only
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  const key = `J${year}-${rand}`;

  try {
    const { rows } = await pool.query(
      `INSERT INTO registration_keys (key, year, max_uses, issued_by)
       VALUES ($1, $2, $3, $4)
       RETURNING key, year, created_at, uses, max_uses, issued_by`,
      [key, year, maxUses, issuedBy ?? 'Admin'],
    );
    res.status(201).json({ key: rows[0] });
  } catch (err) {
    throw httpError(500, 'Key konnte nicht erstellt werden');
  }
}));

keysRouter.delete('/:key', asyncHandler(async (req, res) => {
  const keyParam = z.string().min(1).parse(req.params.key);

  const { rowCount } = await pool.query('DELETE FROM registration_keys WHERE key = $1', [keyParam]);

  if (!rowCount) {
    throw httpError(404, 'Key nicht gefunden');
  }

  res.status(204).send();
}));
