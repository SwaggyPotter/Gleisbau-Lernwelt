import type { RequestHandler } from 'express';
import { resolveSession, SessionUser } from '../sessions';
import { httpError } from './error-handler';
import { asyncHandler } from './async-handler';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

const extractToken = (authHeader: string | undefined): string | null => {
  if (!authHeader) return null;
  const match = /^Bearer\s+(.+)$/i.exec(authHeader);
  return match ? match[1].trim() : null;
};

export const requireAuth: RequestHandler = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req.headers.authorization);
  if (!token) throw httpError(401, 'Nicht angemeldet');

  const user = await resolveSession(token);
  if (!user) throw httpError(401, 'Sitzung abgelaufen, bitte erneut anmelden');

  req.user = user;
  next();
});

export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (req.user?.role !== 'admin') {
    throw httpError(403, 'Nur fuer Administratoren');
  }
  next();
};
