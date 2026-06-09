import { Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { asyncHandler } from '../../middleware/asyncHandler';
import prisma from '../../config/database';
import { getPagination, getPaginationMeta } from '../../utils/pagination';

export const listDestinations = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const data = await prisma.destination.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
  res.json({ success: true, data });
});

export const listFlights = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { skip, take, page, limit } = getPagination(req.query);
  const where: any = { isActive: true };
  if (req.query.destination_id) where.destinationId = req.query.destination_id;

  const [data, total] = await Promise.all([
    prisma.flight.findMany({
      where,
      include: {
        destination: true,
        seats: { where: { isActive: true } },
      },
      orderBy: { departureTime: 'asc' },
      skip,
      take,
    }),
    prisma.flight.count({ where }),
  ]);
  res.json({ success: true, data, pagination: getPaginationMeta(total, page, limit) });
});

export const listHotels = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { skip, take, page, limit } = getPagination(req.query);
  const where: any = { isActive: true };
  if (req.query.destination_id) where.destinationId = req.query.destination_id;

  const [data, total] = await Promise.all([
    prisma.hotel.findMany({
      where,
      include: {
        destination: true,
        rooms: { where: { isActive: true } },
      },
      orderBy: { name: 'asc' },
      skip,
      take,
    }),
    prisma.hotel.count({ where }),
  ]);
  res.json({ success: true, data, pagination: getPaginationMeta(total, page, limit) });
});

export const listTours = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { skip, take, page, limit } = getPagination(req.query);
  const where: any = { isActive: true };
  if (req.query.destination_id) where.destinationId = req.query.destination_id;

  const [data, total] = await Promise.all([
    prisma.tour.findMany({
      where,
      include: { destination: true },
      orderBy: { name: 'asc' },
      skip,
      take,
    }),
    prisma.tour.count({ where }),
  ]);
  res.json({ success: true, data, pagination: getPaginationMeta(total, page, limit) });
});

export const listBookings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { skip, take, page, limit } = getPagination(req.query);
  const where: any = { userId: req.user!.id };
  if (req.query.status) where.status = req.query.status;

  const [data, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        details: { include: { passengers: true } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.booking.count({ where }),
  ]);
  res.json({ success: true, data, pagination: getPaginationMeta(total, page, limit) });
});
