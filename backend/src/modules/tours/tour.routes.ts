import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../middleware/asyncHandler';
import * as tourController from './tour.controller';
import { createTourSchema, updateTourSchema } from './tour.validation';

const router = Router();

router.get('/', asyncHandler(tourController.list));
router.get('/:id', asyncHandler(tourController.getById));
router.post('/', authenticate, authorize('admin'), validate({ body: createTourSchema }), asyncHandler(tourController.create));
router.put('/:id', authenticate, authorize('admin'), validate({ body: updateTourSchema }), asyncHandler(tourController.update));
router.delete('/:id', authenticate, authorize('admin'), asyncHandler(tourController.remove));

export default router;
