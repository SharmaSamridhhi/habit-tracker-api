import { Router } from 'express';
import { login, register } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { loginSchema, registerSchema } from '../validators/auth.validators';

// OpenAPI docs for these routes: src/docs/auth.openapi.ts
export const authRouter = Router();

authRouter.post('/register', validate({ body: registerSchema }), register);
authRouter.post('/login', validate({ body: loginSchema }), login);
