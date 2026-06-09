import { Request, Response } from 'express';
import * as tourService from './tour.service';
import { agentNeedsApproval, recountApprovedItems } from '../../utils/agentTrust';

export async function list(req: Request, res: Response): Promise<void> {
  const filters = {
    destinationId: req.query.destination_id as string | undefined,
    minPrice: req.query.min_price ? parseFloat(req.query.min_price as string) : undefined,
    maxPrice: req.query.max_price ? parseFloat(req.query.max_price as string) : undefined,
    minDuration: req.query.min_duration ? parseInt(req.query.min_duration as string, 10) : undefined,
    maxDuration: req.query.max_duration ? parseInt(req.query.max_duration as string, 10) : undefined,
    search: req.query.search as string | undefined,
    sort: req.query.sort as string | undefined,
  };

  const result = await tourService.list(filters, req.query);
  res.json({ success: true, data: result.data, pagination: result.pagination });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const tour = await tourService.getById(req.params.id);
  res.json({ success: true, data: tour });
}

export async function adminList(req: Request, res: Response): Promise<void> {
  const filters = {
    destinationId: req.query.destination_id as string | undefined,
    search: req.query.search as string | undefined,
    sort: req.query.sort as string | undefined,
  };
  const result = await tourService.adminList(filters, req.query, req.user!);
  res.json({ success: true, data: result.data, pagination: result.pagination });
}

export async function create(req: Request, res: Response): Promise<void> {
  const data = { ...req.body, createdById: req.user!.id };
  if (agentNeedsApproval(req.user!)) {
    data.isActive = false;
  }
  const tour = await tourService.create(data);
  res.status(201).json({ success: true, data: tour });
}

export async function update(req: Request, res: Response): Promise<void> {
  const { createdById, ...rest } = req.body;
  const tour = await tourService.update(req.params.id, rest);
  res.json({ success: true, data: tour });
}

export async function remove(req: Request, res: Response): Promise<void> {
  await tourService.softDelete(req.params.id);
  res.json({ success: true, message: 'Tour deleted successfully' });
}

export async function approve(req: Request, res: Response): Promise<void> {
  const tour = await tourService.approve(req.params.id);
  if (tour.createdById) {
    await recountApprovedItems(tour.createdById);
  }
  res.json({ success: true, data: tour });
}

export async function deactivate(req: Request, res: Response): Promise<void> {
  const tour = await tourService.deactivate(req.params.id, req.user!.id, req.user!.role);
  res.json({ success: true, data: tour });
}
