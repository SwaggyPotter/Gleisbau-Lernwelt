import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { pool } from '../db/pool';
import { asyncHandler } from '../middleware/async-handler';
import { httpError } from '../middleware/error-handler';
import { deletionNoticeMessage, purgeDueDeletedUsers } from '../user-deletion';
import { createSession, deleteSession } from '../sessions';
import { requireAuth } from '../middleware/auth';

const loginSchema = z.object({
  email: z.string().min(1), // accept admin username without @
  password: z.string().min(1),
});

const loginWithKeySchema = z.object({
  email: z.string().email(),
  key: z.string().min(6),
  newPassword: z.string().min(8, 'Passwort muss mindestens 8 Zeichen haben'),
});

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  role: 'user' | 'admin';
  year: number | null;
}

const toPublicUser = (row: UserRow) => ({
  id: row.id,
  fullName: row.full_name,
  email: row.email,
  role: row.role,
  year: row.year,
});

export const authRouter = Router();

authRouter.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  await purgeDueDeletedUsers();

  const { rows } = await pool.query(
    'SELECT id, full_name, email, password_hash, role, year, key_used, deletion_due_at FROM users WHERE email = $1',
    [email],
  );

  if (!rows.length) {
    throw httpError(401, 'Ungueltige Anmeldedaten');
  }

  const user = rows[0];
  if (user.deletion_due_at) {
    throw httpError(403, deletionNoticeMessage(user.deletion_due_at));
  }

  if (!user.password_hash) {
    throw httpError(401, 'Passwort noch nicht gesetzt. Bitte Key-Login verwenden.');
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    throw httpError(401, 'Ungueltige Anmeldedaten');
  }

  const token = await createSession(user.id);
  res.json({ user: toPublicUser(user), token });
}));

authRouter.post('/login-key', asyncHandler(async (req, res) => {
  const { email, key, newPassword } = loginWithKeySchema.parse(req.body);
  await purgeDueDeletedUsers();

  const { rows } = await pool.query(
    'SELECT id, full_name, email, password_hash, role, year, key_used, deletion_due_at FROM users WHERE email = $1',
    [email],
  );

  if (!rows.length) {
    throw httpError(404, 'User nicht gefunden');
  }

  const user = rows[0];
  if (user.deletion_due_at) {
    throw httpError(403, deletionNoticeMessage(user.deletion_due_at));
  }

  if (user.key_used !== key) {
    throw httpError(401, 'Key stimmt nicht mit dem Account ueberein');
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  const { rows: updated } = await pool.query(
    `UPDATE users SET password_hash = $1
     WHERE id = $2
     RETURNING id, full_name, email, role, year`,
    [passwordHash, user.id],
  );

  const token = await createSession(user.id);
  res.json({ user: toPublicUser(updated[0]), token });
}));

authRouter.post('/logout', requireAuth, asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization ?? '';
  const token = /^Bearer\s+(.+)$/i.exec(authHeader)?.[1]?.trim();
  if (token) await deleteSession(token);
  res.status(204).send();
}));

authRouter.get('/me', requireAuth, asyncHandler(async (req, res) => {
  res.json({ user: req.user });
}));

const updateMeSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  email: z.string().min(1).optional(), // admin-Login darf ein einfacher Benutzername ohne @ sein
  newPassword: z.string().min(8, 'Passwort muss mindestens 8 Zeichen haben').optional(),
});

authRouter.patch('/me', requireAuth, asyncHandler(async (req, res) => {
  const { fullName, email, newPassword } = updateMeSchema.parse(req.body);
  if (!fullName && !email && !newPassword) {
    throw httpError(400, 'Keine Aenderung angegeben');
  }

  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  if (fullName) { sets.push(`full_name = $${i++}`); values.push(fullName); }
  if (email) { sets.push(`email = $${i++}`); values.push(email); }
  if (newPassword) { sets.push(`password_hash = $${i++}`); values.push(await bcrypt.hash(newPassword, 10)); }
  values.push(req.user!.id);

  try {
    const { rows } = await pool.query(
      `UPDATE users SET ${sets.join(', ')} WHERE id = $${i} RETURNING id, full_name, email, role, year`,
      values,
    );
    res.json({ user: toPublicUser(rows[0]) });
  } catch (err) {
    if ((err as { code?: string }).code === '23505') {
      throw httpError(409, 'Diese E-Mail wird bereits verwendet');
    }
    throw err;
  }
}));
