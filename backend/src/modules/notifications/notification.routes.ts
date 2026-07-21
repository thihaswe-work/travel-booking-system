import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { markReadSchema } from './notification.validation';
import * as notificationController from './notification.controller';

const router = Router();

router.get('/', authenticate, notificationController.list);
router.patch('/:id/read', authenticate, validate({ body: markReadSchema }), notificationController.markAsRead);
router.post('/read-all', authenticate, notificationController.markAllAsRead);

export default router;
