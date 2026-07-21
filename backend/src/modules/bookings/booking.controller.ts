import { Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { asyncHandler } from '../../middleware/asyncHandler';
import { bookingService } from './booking.service';

export const create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const booking = await bookingService.create(req.body, req.user!.id);
  res.status(201).json({ success: true, data: booking });
});

export const getById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const booking = await bookingService.getById(req.params.id, req.user!.id, req.user!.role);
  res.status(200).json({ success: true, data: booking });
});

export const list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const filters = {
    status: req.query.status as string | undefined,
    bookingType: req.query.bookingType as string | undefined,
    fromDate: req.query.fromDate as string | undefined,
    toDate: req.query.toDate as string | undefined,
  };
  const result = await bookingService.list(req.user!.id, req.user!.role, filters, req.query);
  res.status(200).json({ success: true, data: result.bookings, pagination: result.meta });
});

export const updateStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const booking = await bookingService.updateStatus(req.params.id, req.body.status, req.user!.id, req.user!.role);
  res.status(200).json({ success: true, data: booking });
});

export const cancel = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const booking = await bookingService.cancel(req.params.id, req.user!.id, req.user!.role, req.body.reason);
  res.status(200).json({ success: true, data: booking });
});
