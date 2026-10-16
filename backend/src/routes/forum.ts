import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { asyncHandler } from '../middleware/async-handler';
import { httpError } from '../middleware/error-handler';

/**
 * Forum (nur angemeldete Nutzer, siehe api.ts: requireAuth). Themen mit Antworten.
 * Autor wird mit dem Namen des Kontos angezeigt. Loeschen darf der Autor selbst
 * oder ein Admin (Moderation).
 */
export const forumRouter = Router();

const threadSchema = z.object({
  title: z.string().trim().min(3).max(120),
  body: z.string().trim().min(1).max(5000),
});
const postSchema = z.object({ body: z.string().trim().min(1).max(5000) });

interface ThreadRow {
  id: number;
  title: string;
  author_id: string;
  author_name: string;
  created_at: string;
  last_post_at: string;
  post_count: number;
}

const toThread = (r: ThreadRow, userId?: string, isAdmin?: boolean) => ({
  id: r.id,
  title: r.title,
  authorName: r.author_name,
  createdAt: r.created_at,
  lastPostAt: r.last_post_at,
  postCount: r.post_count,
  canDelete: isAdmin === true || r.author_id === userId,
});

forumRouter.get('/threads', asyncHandler(async (req, res) => {
  const { rows } = await pool.query<ThreadRow>(
    `SELECT t.id, t.title, t.author_id, u.full_name AS author_name, t.created_at, t.last_post_at,
            (SELECT count(*)::int FROM forum_posts p WHERE p.thread_id = t.id) AS post_count
       FROM forum_threads t JOIN users u ON u.id = t.author_id
      ORDER BY t.last_post_at DESC LIMIT 200`,
  );
  res.json({ threads: rows.map(r => toThread(r, req.user?.id, req.user?.role === 'admin')) });
}));

forumRouter.post('/threads', asyncHandler(async (req, res) => {
  const { title, body } = threadSchema.parse(req.body);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const t = await client.query(
      'INSERT INTO forum_threads (title, author_id) VALUES ($1, $2) RETURNING id',
      [title, req.user!.id],
    );
    await client.query('INSERT INTO forum_posts (thread_id, author_id, body) VALUES ($1, $2, $3)', [t.rows[0].id, req.user!.id, body]);
    await client.query('COMMIT');
    res.status(201).json({ id: t.rows[0].id });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}));

forumRouter.get('/threads/:id', asyncHandler(async (req, res) => {
  const id = z.coerce.number().int().positive().parse(req.params.id);
  const t = await pool.query<ThreadRow>(
    `SELECT t.id, t.title, t.author_id, u.full_name AS author_name, t.created_at, t.last_post_at, 0 AS post_count
       FROM forum_threads t JOIN users u ON u.id = t.author_id WHERE t.id = $1`,
    [id],
  );
  if (!t.rows[0]) throw httpError(404, 'Thema nicht gefunden');
  const posts = await pool.query(
    `SELECT p.id, p.author_id, u.full_name AS author_name, p.body, p.created_at
       FROM forum_posts p JOIN users u ON u.id = p.author_id WHERE p.thread_id = $1 ORDER BY p.created_at`,
    [id],
  );
  const isAdmin = req.user?.role === 'admin';
  res.json({
    thread: toThread(t.rows[0], req.user?.id, isAdmin),
    posts: posts.rows.map(p => ({
      id: p.id,
      authorName: p.author_name,
      body: p.body,
      createdAt: p.created_at,
      canDelete: isAdmin || p.author_id === req.user?.id,
    })),
  });
}));

forumRouter.post('/threads/:id/posts', asyncHandler(async (req, res) => {
  const id = z.coerce.number().int().positive().parse(req.params.id);
  const { body } = postSchema.parse(req.body);
  const exists = await pool.query('SELECT 1 FROM forum_threads WHERE id = $1', [id]);
  if (!exists.rowCount) throw httpError(404, 'Thema nicht gefunden');
  await pool.query('INSERT INTO forum_posts (thread_id, author_id, body) VALUES ($1, $2, $3)', [id, req.user!.id, body]);
  await pool.query('UPDATE forum_threads SET last_post_at = now() WHERE id = $1', [id]);
  res.status(201).json({ ok: true });
}));

forumRouter.delete('/posts/:id', asyncHandler(async (req, res) => {
  const id = z.coerce.number().int().positive().parse(req.params.id);
  const { rows } = await pool.query('SELECT author_id FROM forum_posts WHERE id = $1', [id]);
  if (!rows[0]) throw httpError(404, 'Beitrag nicht gefunden');
  if (req.user?.role !== 'admin' && rows[0].author_id !== req.user?.id) throw httpError(403, 'Nicht erlaubt');
  await pool.query('DELETE FROM forum_posts WHERE id = $1', [id]);
  res.status(204).send();
}));

forumRouter.delete('/threads/:id', asyncHandler(async (req, res) => {
  const id = z.coerce.number().int().positive().parse(req.params.id);
  const { rows } = await pool.query('SELECT author_id FROM forum_threads WHERE id = $1', [id]);
  if (!rows[0]) throw httpError(404, 'Thema nicht gefunden');
  if (req.user?.role !== 'admin' && rows[0].author_id !== req.user?.id) throw httpError(403, 'Nicht erlaubt');
  await pool.query('DELETE FROM forum_threads WHERE id = $1', [id]);
  res.status(204).send();
}));
