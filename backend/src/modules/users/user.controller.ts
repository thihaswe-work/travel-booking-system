import { Request, Response } from 'express';
import * as userService from './user.service';

export async function getMe(req: Request, res: Response): Promise<void> {
  const user = await userService.getProfile(req.user!.id);
  res.json({ success: true, data: user });
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  const user = await userService.updateProfile(req.user!.id, req.body);
  res.json({ success: true, data: user });
}

export async function getMyBookings(req: Request, res: Response): Promise<void> {
  const bookings = await userService.getUserBookings(req.user!.id);
  res.json({ success: true, data: bookings });
}

export async function listAllUsers(req: Request, res: Response): Promise<void> {
  const filters = {
    role: req.query.role as string | undefined,
    isActive: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined,
    search: req.query.search as string | undefined,
  };

  const result = await userService.listUsers(filters, req.query);
  res.json({ success: true, data: result.users, pagination: result.pagination });
}

export async function getUserById(req: Request, res: Response): Promise<void> {
  const user = await userService.getUserById(req.params.id);
  res.json({ success: true, data: user });
}

export async function updateUserById(req: Request, res: Response): Promise<void> {
  const user = await userService.updateUser(req.params.id, req.body);
  res.json({ success: true, data: user });
}
