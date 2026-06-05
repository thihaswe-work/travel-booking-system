import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { analyticsQuerySchema } from './admin.validation';
import * as adminController from './admin.controller';

const router = Router();

router.get('/analytics/overview', authenticate, authorize('admin'), validate({ query: analyticsQuerySchema }), adminController.overview);
router.get('/analytics/bookings', authenticate, authorize('admin'), adminController.bookings);
router.get('/analytics/revenue', authenticate, authorize('admin'), adminController.revenue);
router.get('/analytics/popular', authenticate, authorize('admin'), adminController.popular);

export default router;
