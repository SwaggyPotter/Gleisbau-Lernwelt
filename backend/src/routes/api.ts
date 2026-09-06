import { Router } from 'express';
import { fieldsRouter } from './fields';
import { keysRouter } from './keys';
import { registrationRouter } from './registration';
import { usersRouter } from './users';
import { authRouter } from './auth';
import { quizzesRouter } from './quizzes';
import { statsRouter } from './stats';
import { achievementsRouter } from './achievements';
import { settingsRouter } from './settings';
import { requireAuth, requireAdmin } from '../middleware/auth';

export const apiRouter = Router();

apiRouter.use('/fields', fieldsRouter);
apiRouter.use('/register', registrationRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/keys', requireAuth, requireAdmin, keysRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/quizzes', quizzesRouter);
apiRouter.use('/stats', statsRouter);
apiRouter.use('/achievements', achievementsRouter);
apiRouter.use('/settings', settingsRouter);
