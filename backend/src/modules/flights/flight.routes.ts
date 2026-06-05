import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../middleware/asyncHandler';
import * as flightController from './flight.controller';
import { createFlightSchema, updateFlightSchema, updateSeatsSchema } from './flight.validation';

const router = Router();

router.get('/', asyncHandler(flightController.list));
router.get('/:id', asyncHandler(flightController.getById));
router.post('/', authenticate, authorize('admin'), validate({ body: createFlightSchema }), asyncHandler(flightController.create));
router.put('/:id', authenticate, authorize('admin'), validate({ body: updateFlightSchema }), asyncHandler(flightController.update));
router.delete('/:id', authenticate, authorize('admin'), asyncHandler(flightController.remove));
router.patch('/:id/seats', authenticate, authorize('admin'), validate({ body: updateSeatsSchema }), asyncHandler(flightController.updateSeats));

export default router;
