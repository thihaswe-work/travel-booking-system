import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../middleware/asyncHandler';
import * as userController from './user.controller';
import { updateProfileSchema } from './user.validation';

const router = Router();

router.get('/me', authenticate, asyncHandler(userController.getMe));
router.patch('/me', authenticate, validate({ body: updateProfileSchema }), asyncHandler(userController.updateMe));
router.get('/me/bookings', authenticate, asyncHandler(userController.getMyBookings));

router.get('/', authenticate, authorize('admin'), asyncHandler(userController.listAllUsers));
router.get('/:id', authenticate, authorize('admin'), asyncHandler(userController.getUserById));
router.patch('/:id', authenticate, authorize('admin'), validate({ body: updateProfileSchema }), asyncHandler(userController.updateUserById));

export default router;
