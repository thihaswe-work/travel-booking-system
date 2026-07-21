import { Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { asyncHandler } from '../../middleware/asyncHandler';
import { paymentService } from './payment.service';

export const process = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const payment = await paymentService.processPayment(req.params.id, req.user!.id, req.user!.role, req.body);
  res.status(200).json({ success: true, data: payment });
});

export const getPayment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const payment = await paymentService.getPayment(req.params.id, req.user!.id, req.user!.role);
  res.status(200).json({ success: true, data: payment });
});

export const getInvoice = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const invoice = await paymentService.getInvoice(req.params.invoiceNumber, req.user!.id, req.user!.role);
  res.status(200).json({ success: true, data: invoice });
});
