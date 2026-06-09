import { Request, Response } from 'express';
import * as hotelService from './hotel.service';
import { agentNeedsApproval, recountApprovedItems } from '../../utils/agentTrust';

export async function list(req: Request, res: Response): Promise<void> {
  const filters = {
    destinationId: req.query.destination_id as string | undefined,
    minRating: req.query.min_rating ? parseInt(req.query.min_rating as string, 10) : undefined,
    maxPrice: req.query.max_price ? parseFloat(req.query.max_price as string) : undefined,
    search: req.query.search as string | undefined,
    sort: req.query.sort as string | undefined,
  };

  const result = await hotelService.list(filters, req.query);
  res.json({ success: true, data: result.data, pagination: result.pagination });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const hotel = await hotelService.getById(req.params.id);
  res.json({ success: true, data: hotel });
}

export async function adminList(req: Request, res: Response): Promise<void> {
  const filters = {
    destinationId: req.query.destination_id as string | undefined,
    minRating: req.query.min_rating ? parseInt(req.query.min_rating as string, 10) : undefined,
    maxPrice: req.query.max_price ? parseFloat(req.query.max_price as string) : undefined,
    search: req.query.search as string | undefined,
    sort: req.query.sort as string | undefined,
  };
  const result = await hotelService.adminList(filters, req.query, req.user!);
  res.json({ success: true, data: result.data, pagination: result.pagination });
}

export async function create(req: Request, res: Response): Promise<void> {
  const data = { ...req.body, createdById: req.user!.id };
  if (agentNeedsApproval(req.user!)) {
    data.isActive = false;
  }
  const hotel = await hotelService.create(data);
  res.status(201).json({ success: true, data: hotel });
}

export async function update(req: Request, res: Response): Promise<void> {
  const { createdById, ...rest } = req.body;
  const hotel = await hotelService.update(req.params.id, rest);
  res.json({ success: true, data: hotel });
}

export async function remove(req: Request, res: Response): Promise<void> {
  await hotelService.softDelete(req.params.id);
  res.json({ success: true, message: 'Hotel deleted successfully' });
}

export async function approve(req: Request, res: Response): Promise<void> {
  const hotel = await hotelService.approve(req.params.id);
  if (hotel.createdById) {
    await recountApprovedItems(hotel.createdById);
  }
  res.json({ success: true, data: hotel });
}

export async function deactivate(req: Request, res: Response): Promise<void> {
  const hotel = await hotelService.deactivate(req.params.id, req.user!.id, req.user!.role);
  res.json({ success: true, data: hotel });
}
