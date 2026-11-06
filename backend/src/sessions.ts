import { randomBytes } from 'crypto';
import { pool } from './db/pool';

const SESSION_TTL_DAYS = 30;

export interface SessionUser {
  id: string;
  fullName: string;
  email: string;
  role: 'user' | 'admin';
  year: number | null;
  /** Nur bei Gast-Kurzzeitkonten: Zeitpunkt, an dem der Zugang endet (ISO). */
  gastBis: string | null;
}

/** Legt eine Sitzung an; `bis` begrenzt sie (Gastkonten), sonst gilt die Standard-Laufzeit. */
export const createSession = async (userId: string, bis?: Date): Promise<string> => {
  const token = randomBytes(32).toString('hex');
  if (bis) {
    await pool.query('INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3)', [token, userId, bis]);
  } else {
    await pool.query(
      `INSERT INTO sessions (token, user_id, expires_at)
       VALUES ($1, $2, now() + INTERVAL '${SESSION_TTL_DAYS} days')`,
      [token, userId],
    );
  }
  return token;
};

export const deleteSession = async (token: string): Promise<void> => {
  await pool.query('DELETE FROM sessions WHERE token = $1', [token]);
};

export const resolveSession = async (token: string): Promise<SessionUser | null> => {
  const { rows } = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.role, u.year, u.expires_at
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token = $1 AND s.expires_at > now() AND u.deletion_due_at IS NULL
       AND (u.expires_at IS NULL OR u.expires_at > now())`,
    [token],
  );
  if (!rows.length) return null;
  const row = rows[0];
  return {
    id: row.id, fullName: row.full_name, email: row.email, role: row.role, year: row.year,
    gastBis: row.expires_at ? new Date(row.expires_at).toISOString() : null,
  };
};
