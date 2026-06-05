import { Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { asyncHandler } from '../../middleware/asyncHandler';
import { adminService } from './admin.service';

export const overview = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await adminService.getOverview(req.query.from as string, req.query.to as string);
  res.status(200).json({ success: true, data: result });
});

export const bookings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await adminService.getBookingsAnalytics(
    req.query.from as string,
    req.query.to as string,
    (req.query.groupBy as string) || 'day',
  );
  res.status(200).json({ success: true, data: result });
});

export const revenue = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await adminService.getRevenueAnalytics(
    req.query.from as string,
    req.query.to as string,
    (req.query.groupBy as string) || 'day',
  );
  res.status(200).json({ success: true, data: result });
});

export const popular = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const result = await adminService.getPopularDestinations(limit);
  res.status(200).json({ success: true, data: result });
});
