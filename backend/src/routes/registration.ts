import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { asyncHandler } from '../middleware/async-handler';
import { httpError } from '../middleware/error-handler';

const registrationSchema = z.object({
  email: z.string().email(),
  key: z.string().min(6),
});

export const registrationRouter = Router();

registrationRouter.post('/', asyncHandler(async (req, res) => {
  const { email, key } = registrationSchema.parse(req.body);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: keyRows } = await client.query(
      'SELECT key, year, full_name, uses, max_uses FROM registration_keys WHERE key = $1 FOR UPDATE',
      [key],
    );

    if (!keyRows.length) {
      throw httpError(404, 'Registration key not found');
    }

    const registrationKey = keyRows[0];
    if (registrationKey.uses >= registrationKey.max_uses) {
      throw httpError(409, 'Registration key has no remaining uses');
    }

    const { rows: userRows } = await client.query(
      `INSERT INTO users (full_name, email, password_hash, role, year, key_used)
       VALUES ($1, $2, NULL, 'user', $3, $4)
       RETURNING id, full_name, email, role, year, key_used, created_at`,
      [registrationKey.full_name, email, registrationKey.year, registrationKey.key],
    );

    await client.query('UPDATE registration_keys SET uses = uses + 1 WHERE key = $1', [registrationKey.key]);
    await client.query('COMMIT');

    res.status(201).json({ user: userRows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    if ((err as { code?: string }).code === '23505') {
      throw httpError(409, 'User already exists');
    }
    throw err;
  } finally {
    client.release();
  }
}));
