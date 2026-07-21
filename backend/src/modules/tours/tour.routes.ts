import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../middleware/asyncHandler';
import * as tourController from './tour.controller';
import { createTourSchema, updateTourSchema, listToursQuerySchema } from './tour.validation';

const router = Router();

router.get('/', validate({ query: listToursQuerySchema }), asyncHandler(tourController.list));
router.get('/all', authenticate, authorize('admin', 'travel_agent'), asyncHandler(tourController.adminList));
router.get('/:id', asyncHandler(tourController.getById));
router.post('/', authenticate, authorize('admin', 'travel_agent'), validate({ body: createTourSchema }), asyncHandler(tourController.create));
router.put('/:id', authenticate, authorize('admin', 'travel_agent'), validate({ body: updateTourSchema }), asyncHandler(tourController.update));
router.delete('/:id', authenticate, authorize('admin'), asyncHandler(tourController.remove));
router.patch('/:id/approve', authenticate, authorize('admin'), asyncHandler(tourController.approve));
router.patch('/:id/deactivate', authenticate, authorize('admin', 'travel_agent'), asyncHandler(tourController.deactivate));

export default router;
