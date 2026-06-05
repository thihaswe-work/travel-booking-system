import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import * as notificationController from './notification.controller';

const router = Router();

router.get('/', authenticate, notificationController.list);
router.patch('/:id/read', authenticate, notificationController.markAsRead);
router.post('/read-all', authenticate, notificationController.markAllAsRead);

export default router;
