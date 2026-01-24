import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { pool } from '../db/pool';
import { asyncHandler } from '../middleware/async-handler';
import { httpError } from '../middleware/error-handler';

const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

export const authRouter = Router();

authRouter.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  const { rows } = await pool.query(
    'SELECT id, full_name, email, password_hash, role, year, key_used FROM users WHERE email = $1',
    [email],
  );

  if (!rows.length) {
    throw httpError(401, 'Ungültige Anmeldedaten');
  }

  const user = rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    throw httpError(401, 'Ungültige Anmeldedaten');
  }

  const { password_hash, ...publicUser } = user;
  res.json({ user: publicUser });
}));
