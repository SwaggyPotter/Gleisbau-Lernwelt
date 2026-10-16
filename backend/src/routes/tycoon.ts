import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { asyncHandler } from '../middleware/async-handler';
import { httpError } from '../middleware/error-handler';

/**
 * Gleisbau Tycoon (nur angemeldete Nutzer, siehe api.ts: requireAuth).
 * Der Spielstand liegt als JSON pro Konto in der Datenbank. Wer seinen Spielstand "freigibt",
 * kann von anderen angesehen werden (Staedte + Strecken, nur lesen). Besucher werden pro Person
 * einmal gezaehlt. Rangliste = Guthaben. Hinweis: Der Client rechnet das Spiel, die Werte sind
 * daher nur grob plausibilisiert, nicht manipulationssicher.
 */
export const tycoonRouter = Router();

const stateSchema = z.object({
  money: z.number().finite().min(-1e9).max(1e12),
  time: z.number().finite().min(0),
  lines: z.array(z.object({ a: z.number().int().min(0).max(99), b: z.number().int().min(0).max(99) }).passthrough()).max(80),
  own: z.array(z.object({}).passthrough()).max(400),
}).passthrough();

tycoonRouter.get('/me', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT state, shared, (SELECT count(*)::int FROM tycoon_visits v WHERE v.owner_id = $1) AS visitors
       FROM tycoon_saves WHERE user_id = $1`,
    [req.user!.id],
  );
  const r = rows[0];
  res.json({ state: r?.state ?? null, shared: r?.shared ?? false, visitors: r?.visitors ?? 0 });
}));

tycoonRouter.put('/me', asyncHandler(async (req, res) => {
  const state = stateSchema.parse(req.body.state);
  await pool.query(
    `INSERT INTO tycoon_saves (user_id, state, money, line_count, train_count, updated_at)
     VALUES ($1, $2, $3, $4, $5, now())
     ON CONFLICT (user_id) DO UPDATE SET state = $2, money = $3, line_count = $4, train_count = $5, updated_at = now()`,
    [req.user!.id, JSON.stringify(state), Math.round(state.money), state.lines.length, state.own.length],
  );
  res.json({ ok: true });
}));

tycoonRouter.delete('/me', asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM tycoon_saves WHERE user_id = $1', [req.user!.id]);
  await pool.query('DELETE FROM tycoon_visits WHERE owner_id = $1', [req.user!.id]);
  res.status(204).end();
}));

tycoonRouter.put('/share', asyncHandler(async (req, res) => {
  const { shared } = z.object({ shared: z.boolean() }).parse(req.body);
  const r = await pool.query('UPDATE tycoon_saves SET shared = $2 WHERE user_id = $1', [req.user!.id, shared]);
  if (!r.rowCount) throw httpError(409, 'Bitte zuerst eine Strecke bauen und speichern.');
  res.json({ shared });
}));

tycoonRouter.get('/leaderboard', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT s.user_id, u.full_name, s.money, s.line_count, s.train_count, s.shared,
            COALESCE((s.state->>'mode')::int, 0) AS mode,
            (SELECT count(*)::int FROM tycoon_visits v WHERE v.owner_id = s.user_id) AS visitors
       FROM tycoon_saves s JOIN users u ON u.id = s.user_id
      ORDER BY s.money DESC LIMIT 50`,
  );
  res.json({
    entries: rows.map((r, i) => ({
      rank: i + 1,
      userId: r.user_id,
      name: r.full_name,
      money: Number(r.money),
      lines: r.line_count,
      trains: r.train_count,
      visitors: r.visitors,
      mode: r.mode,
      shared: r.shared,
      isMe: r.user_id === req.user!.id,
    })),
  });
}));

tycoonRouter.get('/view/:userId', asyncHandler(async (req, res) => {
  const ownerId = z.string().uuid().parse(req.params.userId);
  const { rows } = await pool.query(
    `SELECT s.state, s.shared, s.money, u.full_name,
            (SELECT count(*)::int FROM tycoon_visits v WHERE v.owner_id = s.user_id) AS visitors
       FROM tycoon_saves s JOIN users u ON u.id = s.user_id WHERE s.user_id = $1`,
    [ownerId],
  );
  const r = rows[0];
  if (!r || (!r.shared && ownerId !== req.user!.id)) throw httpError(403, 'Dieser Spielstand ist nicht freigegeben.');
  let visitors: number = r.visitors;
  if (ownerId !== req.user!.id) {
    const ins = await pool.query(
      `INSERT INTO tycoon_visits (owner_id, visitor_id) VALUES ($1, $2)
       ON CONFLICT (owner_id, visitor_id) DO UPDATE SET last_at = now() RETURNING (xmax = 0) AS fresh`,
      [ownerId, req.user!.id],
    );
    if (ins.rows[0]?.fresh) visitors += 1;
  }
  res.json({ name: r.full_name, money: Number(r.money), visitors, state: r.state });
}));
