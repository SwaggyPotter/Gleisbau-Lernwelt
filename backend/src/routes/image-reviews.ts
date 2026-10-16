import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { asyncHandler } from '../middleware/async-handler';
import { httpError } from '../middleware/error-handler';

/**
 * Bilder-Verwaltung (nur Admin, siehe api.ts): Tim beurteilt auf der Webseite jedes
 * Bild (behalten/entfernen/unsicher), ordnet eine Kategorie zu und kann eine
 * Notiz hinterlassen. Die Entscheidungen liegen in image_reviews und werden von
 * Claude ueber denselben gesicherten Admin-Endpunkt (GET /api/image-reviews)
 * ausgelesen -- kein direkter DB-Zugriff noetig.
 */
export const imageReviewsRouter = Router();

const reviewSchema = z.object({
  decision: z.enum(['keep', 'remove', 'unsure']).nullable(),
  category: z.string().trim().max(80).nullable().optional(),
  note: z.string().trim().max(500).nullable().optional(),
  name: z.string().trim().max(120).optional(),
  source: z.enum(['foto', 'app']).optional(),
});

interface ReviewRow {
  image_id: string;
  source: string;
  decision: string | null;
  category: string | null;
  note: string | null;
  name: string | null;
  updated_by: string | null;
  updated_at: string;
}

const toPublic = (row: ReviewRow) => ({
  imageId: row.image_id,
  source: row.source,
  decision: row.decision,
  category: row.category,
  note: row.note,
  name: row.name,
  updatedBy: row.updated_by,
  updatedAt: row.updated_at,
});

imageReviewsRouter.get('/', asyncHandler(async (_req, res) => {
  const { rows } = await pool.query<ReviewRow>(
    'SELECT image_id, source, decision, category, note, name, updated_by, updated_at FROM image_reviews ORDER BY image_id',
  );
  res.json({ reviews: rows.map(toPublic) });
}));

imageReviewsRouter.put('/:imageId', asyncHandler(async (req, res) => {
  const imageId = z.string().min(1).max(200).parse(req.params.imageId);
  const body = reviewSchema.parse(req.body);
  const source = body.source ?? (imageId.startsWith('app:') ? 'app' : 'foto');

  try {
    const { rows } = await pool.query<ReviewRow>(
      `INSERT INTO image_reviews (image_id, source, decision, category, note, name, updated_by, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, now())
       ON CONFLICT (image_id) DO UPDATE SET
         decision = EXCLUDED.decision,
         category = EXCLUDED.category,
         note = EXCLUDED.note,
         name = COALESCE(EXCLUDED.name, image_reviews.name),
         updated_by = EXCLUDED.updated_by,
         updated_at = now()
       RETURNING image_id, source, decision, category, note, name, updated_by, updated_at`,
      [imageId, source, body.decision, body.category ?? null, body.note ?? null, body.name ?? null, req.user?.email ?? 'admin'],
    );
    res.json({ review: toPublic(rows[0]) });
  } catch (err) {
    throw httpError(500, 'Bild-Entscheidung konnte nicht gespeichert werden');
  }
}));
