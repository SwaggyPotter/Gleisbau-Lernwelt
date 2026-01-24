import { Router } from 'express';
import { fieldsRouter } from './fields';
import { keysRouter } from './keys';
import { registrationRouter } from './registration';
import { usersRouter } from './users';
import { authRouter } from './auth';

export const apiRouter = Router();

apiRouter.use('/fields', fieldsRouter);
apiRouter.use('/register', registrationRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/keys', keysRouter);
apiRouter.use('/auth', authRouter);
