import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { asyncHandler } from '../middleware/async-handler';
import { httpError } from '../middleware/error-handler';

/**
 * Globaler Chat (nur angemeldete Nutzer, siehe api.ts: requireAuth). Einfaches Polling:
 * GET /chat?after=<id> liefert nur neue Nachrichten, ohne after die letzten 100.
 * Absender erscheint mit dem Namen des Kontos. Admins koennen Nachrichten loeschen.
 */
export const chatRouter = Router();

const sendSchema = z.object({ body: z.string().trim().min(1).max(500) });
const querySchema = z.object({ after: z.coerce.number().int().min(0).optional() });

const toMessage = (r: { id: number; author_id: string; author_name: string; body: string; created_at: string }, userId?: string) => ({
  id: r.id,
  authorName: r.author_name,
  body: r.body,
  createdAt: r.created_at,
  mine: r.author_id === userId,
});

chatRouter.get('/', asyncHandler(async (req, res) => {
  const { after } = querySchema.parse(req.query);
  const { rows } = after
    ? await pool.query(
        `SELECT m.id, m.author_id, u.full_name AS author_name, m.body, m.created_at
           FROM chat_messages m JOIN users u ON u.id = m.author_id
          WHERE m.id > $1 ORDER BY m.id LIMIT 200`,
        [after],
      )
    : await pool.query(
        `SELECT * FROM (
           SELECT m.id, m.author_id, u.full_name AS author_name, m.body, m.created_at
             FROM chat_messages m JOIN users u ON u.id = m.author_id
            ORDER BY m.id DESC LIMIT 100
         ) t ORDER BY id`,
      );
  res.json({ messages: rows.map(r => toMessage(r, req.user?.id)) });
}));

chatRouter.post('/', asyncHandler(async (req, res) => {
  const { body } = sendSchema.parse(req.body);
  // Einfacher Spam-Schutz: hoechstens eine Nachricht pro Sekunde und Konto.
  const last = await pool.query(
    "SELECT 1 FROM chat_messages WHERE author_id = $1 AND created_at > now() - interval '1 second'",
    [req.user!.id],
  );
  if (last.rowCount) throw httpError(429, 'Bitte etwas langsamer schreiben');
  const { rows } = await pool.query(
    `INSERT INTO chat_messages (author_id, body) VALUES ($1, $2)
     RETURNING id, author_id, $3::text AS author_name, body, created_at`,
    [req.user!.id, body, req.user!.fullName],
  );
  // Nur die letzten 1000 Nachrichten behalten.
  await pool.query('DELETE FROM chat_messages WHERE id < (SELECT max(id) FROM chat_messages) - 1000');
  res.status(201).json({ message: toMessage(rows[0], req.user?.id) });
}));

chatRouter.delete('/:id', asyncHandler(async (req, res) => {
  if (req.user?.role !== 'admin') throw httpError(403, 'Nur fuer Administratoren');
  const id = z.coerce.number().int().positive().parse(req.params.id);
  await pool.query('DELETE FROM chat_messages WHERE id = $1', [id]);
  res.status(204).send();
}));
