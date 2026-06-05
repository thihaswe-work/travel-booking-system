import { Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { asyncHandler } from '../../middleware/asyncHandler';
import { notificationService } from './notification.service';

export const list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const filters = {
    is_read: req.query.is_read as string | undefined,
    type: req.query.type as string | undefined,
  };
  const result = await notificationService.list(req.user!.id, filters, req.query);
  res.status(200).json({ success: true, data: result.notifications, pagination: result.meta });
});

export const markAsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const notification = await notificationService.markAsRead(req.params.id, req.user!.id);
  res.status(200).json({ success: true, data: notification });
});

export const markAllAsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await notificationService.markAllAsRead(req.user!.id);
  res.status(200).json({ success: true, data: result });
});
