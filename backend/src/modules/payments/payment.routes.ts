import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { processPaymentSchema } from './payment.validation';
import * as paymentController from './payment.controller';

const router = Router();

router.post('/:id/process', authenticate, validate({ body: processPaymentSchema }), paymentController.process);
router.get('/:id', authenticate, paymentController.getPayment);
router.get('/invoice/:invoiceNumber', authenticate, paymentController.getInvoice);

export default router;
