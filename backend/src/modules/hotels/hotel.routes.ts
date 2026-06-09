import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../middleware/asyncHandler';
import * as hotelController from './hotel.controller';
import { createHotelSchema, updateHotelSchema } from './hotel.validation';

const router = Router();

router.get('/', asyncHandler(hotelController.list));
router.get('/all', authenticate, authorize('admin', 'travel_agent'), asyncHandler(hotelController.adminList));
router.get('/:id', asyncHandler(hotelController.getById));
router.post('/', authenticate, authorize('admin', 'travel_agent'), validate({ body: createHotelSchema }), asyncHandler(hotelController.create));
router.put('/:id', authenticate, authorize('admin', 'travel_agent'), validate({ body: updateHotelSchema }), asyncHandler(hotelController.update));
router.delete('/:id', authenticate, authorize('admin'), asyncHandler(hotelController.remove));
router.patch('/:id/approve', authenticate, authorize('admin'), asyncHandler(hotelController.approve));
router.patch('/:id/deactivate', authenticate, authorize('admin', 'travel_agent'), asyncHandler(hotelController.deactivate));

export default router;
