import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { asyncHandler } from '../middleware/async-handler';
import { optionalAuth, requireAdmin, requireAuth } from '../middleware/auth';

/**
 * Aktivität der Nutzer (Tim, 2026-11-11): wann war jemand zuletzt aktiv, wie oft, welche Apps.
 * Gemeldet wird beim Öffnen einer Seite/App und höchstens alle paar Minuten bei Bedienung (Tippen, Klicken).
 * Mit Konto (auch Gastkonto) wird die Aktivität dem Konto zugeordnet, sonst nur einer zufälligen
 * Geräte-ID aus dem localStorage. Keine IP-Adressen, keine Inhalte – nur Zeitpunkt, Seite/App, Anzahl.
 * Einträge älter als 180 Tage (Tageswerte) werden gelöscht.
 */
export const aktivitaetRouter = Router();

const meldeSchema = z.object({
  clientId: z.string().regex(/^[A-Za-z0-9-]{8,64}$/),
  art: z.enum(['seite', 'aktion']),
  pfad: z.string().max(200).regex(/^\/[A-Za-z0-9/_\-]*$/).optional(),
});

/** Pfad → App-Schlüssel (erste zwei Ebenen, z. B. /zusatz/schotterbett, /berufsschule/formelsammlung/pfeilhoehe) */
function appAusPfad(pfad?: string): string | null {
  if (!pfad || pfad === '/') return null;
  const teile = pfad.split('/').filter(Boolean);
  if (!teile.length) return null;
  if (teile[0] === 'berufsschule') return '/' + teile.slice(0, 3).join('/');
  return '/' + teile.slice(0, 2).join('/');
}

aktivitaetRouter.post('/', optionalAuth, asyncHandler(async (req, res) => {
  const { clientId, art, pfad } = meldeSchema.parse(req.body);
  const userId = req.user?.id ?? null;
  const schluessel = userId ? `user:${userId}` : `geraet:${clientId}`;
  const app = art === 'seite' ? appAusPfad(pfad) : null;

  await pool.query(
    `INSERT INTO aktivitaet (schluessel, user_id, client_id, erste, zuletzt, letzte_seite)
     VALUES ($1, $2, $3, now(), now(), $4)
     ON CONFLICT (schluessel) DO UPDATE SET zuletzt = now(), client_id = $3,
       letzte_seite = COALESCE($4, aktivitaet.letzte_seite)`,
    [schluessel, userId, clientId, app],
  );
  await pool.query(
    `INSERT INTO aktivitaet_tage (schluessel, tag, aktionen, seiten)
     VALUES ($1, (now() AT TIME ZONE 'Europe/Berlin')::date, 1, $2)
     ON CONFLICT (schluessel, tag) DO UPDATE SET aktionen = aktivitaet_tage.aktionen + 1, seiten = aktivitaet_tage.seiten + $2`,
    [schluessel, art === 'seite' ? 1 : 0],
  );
  if (app) {
    await pool.query(
      `INSERT INTO aktivitaet_apps (schluessel, app, anzahl, zuletzt) VALUES ($1, $2, 1, now())
       ON CONFLICT (schluessel, app) DO UPDATE SET anzahl = aktivitaet_apps.anzahl + 1, zuletzt = now()`,
      [schluessel, app],
    );
  }
  if (Math.random() < 0.01) {
    await pool.query("DELETE FROM aktivitaet_tage WHERE tag < (now() - interval '180 days')::date");
  }
  res.status(204).end();
}));

/** Übersicht für den Admin: je Konto/Gerät zuletzt aktiv, aktive Tage, Aufrufe, meistgenutzte Apps. */
aktivitaetRouter.get('/', requireAuth, requireAdmin, asyncHandler(async (_req, res) => {
  const { rows } = await pool.query(`
    SELECT a.schluessel, a.user_id, u.full_name, u.email, u.role, (u.gast_code IS NOT NULL) AS gast,
           a.erste, a.zuletzt, a.letzte_seite,
           COALESCE(t7.tage, 0)::int AS tage7, COALESCE(t30.tage, 0)::int AS tage30,
           COALESCE(t30.aktionen, 0)::int AS aktionen30, COALESCE(tg.tage, 0)::int AS tage_gesamt,
           COALESCE(heute.aktionen, 0)::int AS aktionen_heute,
           (SELECT json_agg(x ORDER BY x.anzahl DESC) FROM (
              SELECT app, anzahl, zuletzt FROM aktivitaet_apps p WHERE p.schluessel = a.schluessel ORDER BY anzahl DESC LIMIT 5
            ) x) AS apps
    FROM aktivitaet a
    LEFT JOIN users u ON u.id = a.user_id
    LEFT JOIN LATERAL (SELECT count(*) AS tage FROM aktivitaet_tage d WHERE d.schluessel = a.schluessel AND d.tag > current_date - 7) t7 ON true
    LEFT JOIN LATERAL (SELECT count(*) AS tage, sum(aktionen) AS aktionen FROM aktivitaet_tage d WHERE d.schluessel = a.schluessel AND d.tag > current_date - 30) t30 ON true
    LEFT JOIN LATERAL (SELECT count(*) AS tage FROM aktivitaet_tage d WHERE d.schluessel = a.schluessel) tg ON true
    LEFT JOIN LATERAL (SELECT aktionen FROM aktivitaet_tage d WHERE d.schluessel = a.schluessel AND d.tag = (now() AT TIME ZONE 'Europe/Berlin')::date) heute ON true
    ORDER BY a.zuletzt DESC
    LIMIT 500`);
  res.set('Cache-Control', 'no-store').json({ eintraege: rows });
}));
