import prisma from '../../config/database';
import { AppError } from '../../utils/AppError';

interface ProcessPaymentInput {
  paymentMethod: 'card' | 'cash_on_arrival';
  cardLastFour?: string;
  mockSuccess?: boolean;
}

export const paymentService = {
  async processPayment(paymentId: string, userId: string, userRole: string, data: ProcessPaymentInput) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: { include: { user: true } },
      },
    });

    if (!payment) throw new AppError('Payment not found', 404, 'NOT_FOUND');
    if (userRole !== 'admin' && payment.booking.userId !== userId) {
      throw new AppError('Access denied', 403, 'FORBIDDEN');
    }
    if (payment.paymentStatus !== 'pending') {
      throw new AppError('Payment cannot be processed. Current status: ' + payment.paymentStatus, 400, 'INVALID_STATUS');
    }

    const mockSuccess = data.mockSuccess ?? true;
    const gatewayResponse = {
      transactionId: 'mock_txn_' + Date.now(),
      status: mockSuccess ? 'completed' : 'declined',
      cardLastFour: data.cardLastFour || null,
      processedAt: new Date().toISOString(),
      mock: true,
    };

    const [updatedPayment] = await prisma.$transaction(async (tx) => {
      const updated = await tx.payment.update({
        where: { id: paymentId },
        data: {
          paymentStatus: mockSuccess ? 'paid' : 'failed',
          paidAt: mockSuccess ? new Date() : null,
          gatewayResponse,
        },
      });

      if (mockSuccess) {
        await tx.booking.update({
          where: { id: payment.bookingId },
          data: { status: 'confirmed' },
        });

        await tx.notification.create({
          data: {
            userId: payment.booking.userId,
            type: 'payment_receipt',
            channel: 'email',
            subject: 'Payment Receipt',
            message: `Your payment of $${Number(payment.amount).toFixed(2)} for booking ${payment.booking.referenceId} has been processed successfully.`,
          },
        });
      }

      return [updated];
    });

    return prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
            details: true,
          },
        },
      },
    });
  },

  async getPayment(paymentId: string, userId: string, userRole: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
            details: true,
          },
        },
      },
    });

    if (!payment) throw new AppError('Payment not found', 404, 'NOT_FOUND');
    if (userRole !== 'admin' && payment.booking.userId !== userId) {
      throw new AppError('Access denied', 403, 'FORBIDDEN');
    }

    return payment;
  },

  async getInvoice(invoiceNumber: string, userId: string, userRole: string) {
    const payment = await prisma.payment.findUnique({
      where: { invoiceNumber },
      include: {
        booking: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
            details: { include: { passengers: true } },
          },
        },
      },
    });

    if (!payment) throw new AppError('Invoice not found', 404, 'NOT_FOUND');
    if (userRole !== 'admin' && payment.booking.userId !== userId) {
      throw new AppError('Access denied', 403, 'FORBIDDEN');
    }

    return {
      invoiceNumber: payment.invoiceNumber,
      issueDate: payment.createdAt,
      paidAt: payment.paidAt,
      status: payment.paymentStatus,
      paymentMethod: payment.paymentMethod,
      booking: {
        referenceId: payment.booking.referenceId,
        bookingType: payment.booking.bookingType,
        status: payment.booking.status,
        createdAt: payment.booking.createdAt,
      },
      customer: payment.booking.user,
      items: payment.booking.details.map((d) => ({
        itemType: d.itemType,
        quantity: d.quantity,
        unitPrice: d.unitPrice,
        subtotal: d.subtotal,
      })),
      total: payment.amount,
      currency: payment.currency,
    };
  },
};
