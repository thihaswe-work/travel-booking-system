import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../middleware/asyncHandler';
import * as flightController from './flight.controller';
import { createFlightSchema, updateFlightSchema, listFlightsQuerySchema } from './flight.validation';

const router = Router();

router.get('/', validate({ query: listFlightsQuerySchema }), asyncHandler(flightController.list));
router.get('/all', authenticate, authorize('admin', 'travel_agent'), asyncHandler(flightController.adminList));
router.get('/:id', asyncHandler(flightController.getById));
router.post('/', authenticate, authorize('admin', 'travel_agent'), validate({ body: createFlightSchema }), asyncHandler(flightController.create));
router.put('/:id', authenticate, authorize('admin', 'travel_agent'), validate({ body: updateFlightSchema }), asyncHandler(flightController.update));
router.delete('/:id', authenticate, authorize('admin'), asyncHandler(flightController.remove));
router.patch('/:id/approve', authenticate, authorize('admin'), asyncHandler(flightController.approve));
router.patch('/:id/deactivate', authenticate, authorize('admin', 'travel_agent'), asyncHandler(flightController.deactivate));

export default router;
