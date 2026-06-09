import { Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { asyncHandler } from '../../middleware/asyncHandler';
import { apiKeyService } from './api-key.service';

export const create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await apiKeyService.create(req.body, req.user!.id);
  res.status(201).json({ success: true, data: result });
});

export const list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const keys = await apiKeyService.list(req.user!.id);
  res.json({ success: true, data: keys });
});

export const update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const key = await apiKeyService.update(req.params.id, req.user!.id, req.body);
  res.json({ success: true, data: key });
});

export const revoke = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const key = await apiKeyService.revoke(req.params.id, req.user!.id);
  res.json({ success: true, data: key });
});
