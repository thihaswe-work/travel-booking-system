import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../middleware/asyncHandler';
import * as destinationController from './destination.controller';
import { createDestinationSchema, updateDestinationSchema } from './destination.validation';

const router = Router();

router.get('/', asyncHandler(destinationController.list));
router.get('/:id', asyncHandler(destinationController.getById));
router.post('/', authenticate, authorize('admin'), validate({ body: createDestinationSchema }), asyncHandler(destinationController.create));
router.put('/:id', authenticate, authorize('admin'), validate({ body: updateDestinationSchema }), asyncHandler(destinationController.update));
router.delete('/:id', authenticate, authorize('admin'), asyncHandler(destinationController.remove));

export default router;
