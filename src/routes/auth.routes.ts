import { Router } from 'express';
import { register } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { registerSchema } from '../validators/auth.validators';

export const authRouter = Router();

authRouter.post('/register', validate({ body: registerSchema }), register);
