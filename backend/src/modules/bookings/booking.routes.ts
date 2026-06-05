import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { createBookingSchema, updateBookingStatusSchema, cancelBookingSchema } from './booking.validation';
import * as bookingController from './booking.controller';

const router = Router();

router.post('/', authenticate, validate({ body: createBookingSchema }), bookingController.create);
router.get('/', authenticate, bookingController.list);
router.get('/:id', authenticate, bookingController.getById);
router.patch('/:id/status', authenticate, authorize('admin', 'travel_agent'), validate({ body: updateBookingStatusSchema }), bookingController.updateStatus);
router.post('/:id/cancel', authenticate, validate({ body: cancelBookingSchema }), bookingController.cancel);

export default router;
