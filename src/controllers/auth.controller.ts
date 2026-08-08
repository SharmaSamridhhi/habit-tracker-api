import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { authService } from '../services/auth.service';
import { RegisterInput } from '../validators/auth.validators';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as RegisterInput;
  const user = await authService.register(input);

  res.status(201).json({
    message: 'User registered successfully',
    user,
  });
});
