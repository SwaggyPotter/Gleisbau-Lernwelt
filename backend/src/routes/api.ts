import { Router } from 'express';
import { fieldsRouter } from './fields';
import { registrationRouter } from './registration';
import { usersRouter } from './users';

export const apiRouter = Router();

apiRouter.use('/fields', fieldsRouter);
apiRouter.use('/register', registrationRouter);
apiRouter.use('/users', usersRouter);
