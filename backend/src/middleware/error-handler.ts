import { ZodError } from 'zod';
import type { ErrorRequestHandler } from 'express';
import { logger } from '../logger';

export type HttpError = Error & { status?: number; expose?: boolean };

export const httpError = (status: number, message: string, expose = true): HttpError => {
  const err = new Error(message) as HttpError;
  err.status = status;
  err.expose = expose;
  return err;
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Invalid request payload', issues: err.issues });
  }

  const status = (err as HttpError).status ?? 500;
  const expose = (err as HttpError).expose ?? status < 500;
  const message = expose ? err.message : 'Internal server error';

  const logPayload = { err, path: req.path };
  if (status >= 500) {
    logger.error(logPayload, 'Unhandled error');
  } else {
    logger.warn(logPayload, 'Request error');
  }

  res.status(status).json({ error: message });
};
