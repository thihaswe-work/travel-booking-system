import { Request, Response } from 'express';
import * as destinationService from './destination.service';

export async function list(req: Request, res: Response): Promise<void> {
  const filters = {
    country: req.query.country as string | undefined,
    isActive: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined,
    search: req.query.search as string | undefined,
  };

  const result = await destinationService.list(filters, req.query);
  res.json({ success: true, data: result.data, pagination: result.pagination });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const destination = await destinationService.getById(req.params.id);
  res.json({ success: true, data: destination });
}

export async function create(req: Request, res: Response): Promise<void> {
  const destination = await destinationService.create(req.body);
  res.status(201).json({ success: true, data: destination });
}

export async function update(req: Request, res: Response): Promise<void> {
  const destination = await destinationService.update(req.params.id, req.body);
  res.json({ success: true, data: destination });
}

export async function remove(req: Request, res: Response): Promise<void> {
  await destinationService.softDelete(req.params.id);
  res.json({ success: true, message: 'Destination deleted successfully' });
}
