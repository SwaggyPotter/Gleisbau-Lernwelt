import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { pool } from '../db/pool';
import { asyncHandler } from '../middleware/async-handler';
import { httpError } from '../middleware/error-handler';

const loginSchema = z.object({
  email: z.string().min(1), // accept admin username without @
  password: z.string().min(1),
});

const loginWithKeySchema = z.object({
  email: z.string().email(),
  key: z.string().min(6),
  newPassword: z.string().min(8, 'Passwort muss mindestens 8 Zeichen haben'),
});

export const authRouter = Router();

authRouter.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  const { rows } = await pool.query(
    'SELECT id, full_name, email, password_hash, role, year, key_used FROM users WHERE email = $1',
    [email],
  );

  if (!rows.length) {
    throw httpError(401, 'Ungueltige Anmeldedaten');
  }

  const user = rows[0];
  if (!user.password_hash) {
    throw httpError(401, 'Passwort noch nicht gesetzt. Bitte Key-Login verwenden.');
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    throw httpError(401, 'Ungueltige Anmeldedaten');
  }

  const { password_hash, ...publicUser } = user;
  res.json({ user: publicUser });
}));

authRouter.post('/login-key', asyncHandler(async (req, res) => {
  const { email, key, newPassword } = loginWithKeySchema.parse(req.body);

  const { rows } = await pool.query(
    'SELECT id, full_name, email, password_hash, role, year, key_used FROM users WHERE email = $1',
    [email],
  );

  if (!rows.length) {
    throw httpError(404, 'User nicht gefunden');
  }

  const user = rows[0];
  if (user.key_used !== key) {
    throw httpError(401, 'Key stimmt nicht mit dem Account ueberein');
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  const { rows: updated } = await pool.query(
    `UPDATE users SET password_hash = $1
     WHERE id = $2
     RETURNING id, full_name, email, role, year, key_used`,
    [passwordHash, user.id],
  );

  res.json({ user: updated[0] });
}));
