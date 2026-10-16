import express, { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { asyncHandler } from '../middleware/async-handler';
import { httpError } from '../middleware/error-handler';

/**
 * Foto-Upload fuer die Bilder-Verwaltung (nur Admin, siehe api.ts). Die Bilder
 * werden vom Browser verkleinert (Vollbild ~1400 px + Vorschau ~400 px, JPEG) und
 * als base64 gesendet; gespeichert wird in Postgres (bytea), damit kein
 * zusaetzliches Docker-Volume noetig ist. Loeschen entfernt die Zeile -- das Bild
 * verschwindet damit auch aus der Bilder-Verwaltung.
 */
export const photosRouter = Router();

const uploadSchema = z.object({
  name: z.string().trim().max(200).default('foto.jpg'),
  full: z.string().min(100),
  thumb: z.string().min(100),
});

const b64 = (s: string) => Buffer.from(s.replace(/^data:image\/jpeg;base64,/, ''), 'base64');

const isJpeg = (buf: Buffer) => buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8;

photosRouter.get('/', asyncHandler(async (_req, res) => {
  const { rows } = await pool.query(
    'SELECT id, original_name, size_bytes, uploaded_by, created_at, thumb_jpeg FROM photos ORDER BY created_at DESC',
  );
  res.json({
    photos: rows.map(r => ({
      id: r.id,
      name: r.original_name,
      sizeBytes: r.size_bytes,
      uploadedBy: r.uploaded_by,
      createdAt: r.created_at,
      thumb: `data:image/jpeg;base64,${r.thumb_jpeg.toString('base64')}`,
    })),
  });
}));

photosRouter.post('/', express.json({ limit: '8mb' }), asyncHandler(async (req, res) => {
  const body = uploadSchema.parse(req.body);
  const full = b64(body.full);
  const thumb = b64(body.thumb);
  if (!isJpeg(full) || !isJpeg(thumb)) throw httpError(400, 'Nur JPEG-Bilder erlaubt');

  const { rows } = await pool.query(
    `INSERT INTO photos (original_name, full_jpeg, thumb_jpeg, size_bytes, uploaded_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, original_name, size_bytes, uploaded_by, created_at`,
    [body.name, full, thumb, full.length, req.user?.email ?? 'admin'],
  );
  const r = rows[0];
  res.status(201).json({
    photo: { id: r.id, name: r.original_name, sizeBytes: r.size_bytes, uploadedBy: r.uploaded_by, createdAt: r.created_at },
  });
}));

const sendImage = (column: 'full_jpeg' | 'thumb_jpeg') =>
  asyncHandler(async (req, res) => {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const { rows } = await pool.query(`SELECT ${column} AS img FROM photos WHERE id = $1`, [id]);
    if (!rows[0]) throw httpError(404, 'Foto nicht gefunden');
    res.type('image/jpeg').set('Cache-Control', 'private, max-age=3600').send(rows[0].img);
  });

photosRouter.get('/:id/full', sendImage('full_jpeg'));
photosRouter.get('/:id/thumb', sendImage('thumb_jpeg'));

photosRouter.delete('/:id', asyncHandler(async (req, res) => {
  const id = z.coerce.number().int().positive().parse(req.params.id);
  const { rowCount } = await pool.query('DELETE FROM photos WHERE id = $1', [id]);
  if (!rowCount) throw httpError(404, 'Foto nicht gefunden');
  // Zugehoerige Bild-Entscheidung gleich mit entfernen.
  await pool.query('DELETE FROM image_reviews WHERE image_id = $1', [`up:${id}`]);
  res.status(204).send();
}));
