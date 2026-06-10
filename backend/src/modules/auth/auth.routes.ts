import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authLimiter } from '../../middleware/rateLimiter';
import { csrfProtection } from '../../middleware/csrf';
import * as authController from './auth.controller';
import { registerSchema, loginSchema, refreshSchema } from './auth.validation';

const router = Router();

router.post('/register', authLimiter, validate({ body: registerSchema }), asyncHandler(authController.register));
router.post('/login', authLimiter, validate({ body: loginSchema }), asyncHandler(authController.login));
router.post('/logout', authenticate, asyncHandler(authController.logout));
router.post('/refresh', csrfProtection, validate({ body: refreshSchema }), asyncHandler(authController.refresh));

export default router;
