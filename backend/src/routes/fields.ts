import { Router } from 'express';
import { pool } from '../db/pool';
import { asyncHandler } from '../middleware/async-handler';

export const fieldsRouter = Router();

fieldsRouter.get('/', asyncHandler(async (_req, res) => {
  const { rows } = await pool.query(
    'SELECT id, title, description, year, tag FROM learning_fields ORDER BY year, id',
  );
  res.json({ fields: rows });
}));
