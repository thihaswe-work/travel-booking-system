import prisma from '../../config/database';
import { AppError } from '../../utils/AppError';
import { generateReferenceId, generateInvoiceNumber } from '../../utils/reference';
import { getPagination, getPaginationMeta } from '../../utils/pagination';
import { createAuditLog } from '../../utils/auditLogger';

interface CreateItemInput {
  itemType: 'flight' | 'hotel' | 'tour';
  itemId: string;
  quantity: number;
  checkInDate?: string;
  checkOutDate?: string;
  passengers?: Array<{
    firstName: string;
    lastName: string;
    documentType?: string;
    documentNumber?: string;
    seatClass?: string;
  }>;
}

interface CreateBookingInput {
  bookingType: 'flight' | 'hotel' | 'tour' | 'package';
  items: CreateItemInput[];
  paymentMethod: 'card' | 'cash_on_arrival';
  notes?: string;
}

interface BookingFilters {
  status?: string;
  bookingType?: string;
  fromDate?: string;
  toDate?: string;
}

export const bookingService = {
  async create(data: CreateBookingInput, userId: string) {
    const referenceId = generateReferenceId();
    let totalAmount = 0;
    const detailInputs: Array<{
      item: CreateItemInput;
      unitPrice: number;
      subtotal: number;
    }> = [];

    for (const item of data.items) {
      let unitPrice = 0;

      if (item.itemType === 'flight') {
        const flight = await prisma.flight.findUnique({
          where: { id: item.itemId },
          include: { seats: true },
        });
        if (!flight) throw new AppError('Flight not found', 404, 'ITEM_NOT_FOUND');
        if (!flight.isActive) throw new AppError('Flight is not available', 400, 'ITEM_NOT_AVAILABLE');

        const seatClass = item.passengers?.[0]?.seatClass || 'economy';
        const seat = flight.seats.find((s) => s.seatClass === seatClass);
        if (!seat) throw new AppError('Seat class not available on this flight', 400, 'SEAT_CLASS_NOT_FOUND');
        if (seat.availableSeats < item.quantity) {
          throw new AppError('Insufficient available seats', 400, 'INSUFFICIENT_SEATS');
        }
        const numPassengers = item.passengers?.length || item.quantity;
        unitPrice = Number(seat.price) * numPassengers;
      } else if (item.itemType === 'hotel') {
        const room = await prisma.hotelRoom.findUnique({ where: { id: item.itemId } });
        if (!room) throw new AppError('Hotel room not found', 404, 'ITEM_NOT_FOUND');
        if (!room.isActive) throw new AppError('Room is not available', 400, 'ITEM_NOT_AVAILABLE');
        if (room.availableRooms < item.quantity) {
          throw new AppError('Insufficient available rooms', 400, 'INSUFFICIENT_SEATS');
        }
        if (!item.checkInDate || !item.checkOutDate) {
          throw new AppError('Check-in and check-out dates are required for hotel bookings', 400, 'VALIDATION_ERROR');
        }
        const nights = Math.ceil(
          (new Date(item.checkOutDate).getTime() - new Date(item.checkInDate).getTime()) / (1000 * 60 * 60 * 24),
        );
        if (nights <= 0) throw new AppError('Check-out date must be after check-in date', 400, 'VALIDATION_ERROR');
        unitPrice = Number(room.pricePerNight) * nights;
      } else if (item.itemType === 'tour') {
        const tour = await prisma.tour.findUnique({ where: { id: item.itemId } });
        if (!tour) throw new AppError('Tour not found', 404, 'ITEM_NOT_FOUND');
        if (!tour.isActive) throw new AppError('Tour is not available', 400, 'ITEM_NOT_AVAILABLE');
        if (tour.availableSlots < item.quantity) {
          throw new AppError('Insufficient available slots', 400, 'INSUFFICIENT_SEATS');
        }
        unitPrice = Number(tour.pricePerPerson);
      }

      const subtotal = unitPrice * item.quantity;
      totalAmount += subtotal;
      detailInputs.push({ item, unitPrice, subtotal });
    }

    const bookingId = await prisma.$transaction(async (tx) => {
      for (const d of detailInputs) {
        if (d.item.itemType === 'flight') {
          const seatClass = d.item.passengers?.[0]?.seatClass || 'economy';
          const { count } = await tx.flightSeat.updateMany({
            where: { flightId: d.item.itemId, seatClass: seatClass as any, availableSeats: { gte: d.item.quantity } },
            data: { availableSeats: { decrement: d.item.quantity } },
          });
          if (count === 0) {
            const flightSeat = await tx.flightSeat.findUnique({
              where: { flightId_seatClass: { flightId: d.item.itemId, seatClass: seatClass as any } },
            });
            if (!flightSeat) throw new AppError('Seat class not available', 400, 'SEAT_CLASS_NOT_FOUND');
            throw new AppError('Insufficient available seats', 400, 'INSUFFICIENT_SEATS');
          }
        } else if (d.item.itemType === 'hotel') {
          const { count } = await tx.hotelRoom.updateMany({
            where: { id: d.item.itemId, availableRooms: { gte: d.item.quantity } },
            data: { availableRooms: { decrement: d.item.quantity } },
          });
          if (count === 0) {
            const room = await tx.hotelRoom.findUnique({ where: { id: d.item.itemId } });
            if (!room) throw new AppError('Hotel room not found', 404, 'ITEM_NOT_FOUND');
            throw new AppError('Insufficient available rooms', 400, 'INSUFFICIENT_ROOMS');
          }
        } else if (d.item.itemType === 'tour') {
          const { count } = await tx.tour.updateMany({
            where: { id: d.item.itemId, availableSlots: { gte: d.item.quantity } },
            data: { availableSlots: { decrement: d.item.quantity } },
          });
          if (count === 0) {
            const tour = await tx.tour.findUnique({ where: { id: d.item.itemId } });
            if (!tour) throw new AppError('Tour not found', 404, 'ITEM_NOT_FOUND');
            throw new AppError('Insufficient available slots', 400, 'INSUFFICIENT_SLOTS');
          }
        }
      }

      const booking = await tx.booking.create({
        data: {
          userId,
          bookingType: data.bookingType,
          status: 'pending',
          totalAmount,
          referenceId,
          notes: data.notes,
          details: {
            create: detailInputs.map((d) => ({
              itemType: d.item.itemType,
              itemId: d.item.itemId,
              checkInDate: d.item.checkInDate ? new Date(d.item.checkInDate) : undefined,
              checkOutDate: d.item.checkOutDate ? new Date(d.item.checkOutDate) : undefined,
              quantity: d.item.quantity,
              unitPrice: d.unitPrice,
              subtotal: d.subtotal,
              ...(d.item.passengers && d.item.passengers.length > 0
                ? {
                    passengers: {
                      create: d.item.passengers.map((p) => ({
                        firstName: p.firstName,
                        lastName: p.lastName,
                        documentType: p.documentType,
                        documentNumber: p.documentNumber,
                        seatClass: p.seatClass,
                      })),
                    },
                  }
                : {}),
            })),
          },
        },
      });

      await tx.payment.create({
        data: {
          bookingId: booking.id,
          amount: totalAmount,
          paymentMethod: data.paymentMethod,
          invoiceNumber: generateInvoiceNumber(),
        },
      });

      if (data.paymentMethod === 'cash_on_arrival') {
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: 'confirmed' },
        });
      }

      return booking.id;
    });

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        details: { include: { passengers: true } },
        payments: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    createAuditLog({
      userId,
      action: 'create',
      entity: 'booking',
      entityId: bookingId,
      newValue: { bookingType: data.bookingType, totalAmount, status: data.paymentMethod === 'cash_on_arrival' ? 'confirmed' : 'pending' },
    });

    return booking;
  },

  async getById(bookingId: string, userId: string, userRole: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        details: { include: { passengers: true } },
        payments: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    if (!booking) throw new AppError('Booking not found', 404, 'NOT_FOUND');
    if (userRole !== 'admin' && booking.userId !== userId) {
      throw new AppError('Access denied', 403, 'FORBIDDEN');
    }

    return booking;
  },

  async list(userId: string, userRole: string, filters: BookingFilters, query: Record<string, any>) {
    const { skip, take, page, limit } = getPagination(query);
    const where: any = {};

    if (userRole !== 'admin') {
      where.userId = userId;
    }
    if (filters.status) where.status = filters.status;
    if (filters.bookingType) where.bookingType = filters.bookingType;
    if (filters.fromDate || filters.toDate) {
      where.createdAt = {};
      if (filters.fromDate) where.createdAt.gte = new Date(filters.fromDate);
      if (filters.toDate) where.createdAt.lte = new Date(filters.toDate);
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          user: userRole === 'admin'
            ? { select: { id: true, firstName: true, lastName: true, email: true } }
            : undefined,
          details: true,
          payments: {
            select: { id: true, paymentStatus: true, amount: true, paymentMethod: true, invoiceNumber: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.booking.count({ where }),
    ]);

    return { bookings, meta: getPaginationMeta(total, page, limit) };
  },

  async updateStatus(bookingId: string, status: string, userId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payments: true },
    });

    if (!booking) throw new AppError('Booking not found', 404, 'NOT_FOUND');

    const allowedTransitions: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['completed', 'cancelled'],
      cancelled: [],
      completed: [],
    };

    if (!allowedTransitions[booking.status]?.includes(status)) {
      throw new AppError(
        `Cannot change status from ${booking.status} to ${status}`,
        400,
        'INVALID_TRANSITION',
      );
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: { status: status as any },
      });

      if (status === 'cancelled') {
        const paidPayment = booking.payments.find((p) => p.paymentStatus === 'paid');
        if (paidPayment) {
          await tx.payment.update({
            where: { id: paidPayment.id },
            data: { paymentStatus: 'refunded' },
          });
        }
      }

      createAuditLog({
        userId,
        action: 'status_change',
        entity: 'booking',
        entityId: bookingId,
        oldValue: { status: booking.status },
        newValue: { status },
      });

      return updated;
    });
  },

  async cancel(bookingId: string, userId: string, userRole: string, reason?: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { details: { include: { passengers: true } }, payments: true },
    });

    if (!booking) throw new AppError('Booking not found', 404, 'NOT_FOUND');
    if (userRole !== 'admin' && booking.userId !== userId) {
      throw new AppError('Access denied', 403, 'FORBIDDEN');
    }
    if (!['pending', 'confirmed'].includes(booking.status)) {
      throw new AppError('Only pending or confirmed bookings can be cancelled', 400, 'INVALID_STATUS');
    }

    return prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'cancelled', ...(reason ? { notes: reason } : {}) },
      });

      for (const detail of booking.details) {
        if (detail.itemType === 'flight') {
          const seatClass = detail.passengers?.[0]?.seatClass || 'economy';
          await tx.flightSeat.update({
            where: { flightId_seatClass: { flightId: detail.itemId, seatClass: seatClass as any } },
            data: { availableSeats: { increment: detail.quantity } },
          });
        } else if (detail.itemType === 'hotel') {
          await tx.hotelRoom.update({
            where: { id: detail.itemId },
            data: { availableRooms: { increment: detail.quantity } },
          });
        } else if (detail.itemType === 'tour') {
          await tx.tour.update({
            where: { id: detail.itemId },
            data: { availableSlots: { increment: detail.quantity } },
          });
        }
      }

      const paidPayment = booking.payments.find((p) => p.paymentStatus === 'paid');
      if (paidPayment) {
        await tx.payment.update({
          where: { id: paidPayment.id },
          data: { paymentStatus: 'refunded' },
        });
      }

      createAuditLog({
        userId,
        action: 'cancel',
        entity: 'booking',
        entityId: bookingId,
        oldValue: { status: booking.status },
        newValue: { status: 'cancelled', reason },
      });

      return tx.booking.findUnique({
        where: { id: bookingId },
        include: {
          details: { include: { passengers: true } },
          payments: true,
        },
      });
    });
  },

  async getInventoryStatus(itemType: string, itemId: string) {
    if (itemType === 'flight') {
      const flight = await prisma.flight.findUnique({
        where: { id: itemId },
        include: { seats: true },
      });
      if (!flight) throw new AppError('Flight not found', 404, 'NOT_FOUND');
      return { itemType, itemId, seats: flight.seats, isActive: flight.isActive };
    }
    if (itemType === 'hotel') {
      const room = await prisma.hotelRoom.findUnique({ where: { id: itemId } });
      if (!room) throw new AppError('Hotel room not found', 404, 'NOT_FOUND');
      return { itemType, itemId, available: room.availableRooms, isActive: room.isActive };
    }
    if (itemType === 'tour') {
      const tour = await prisma.tour.findUnique({ where: { id: itemId } });
      if (!tour) throw new AppError('Tour not found', 404, 'NOT_FOUND');
      return { itemType, itemId, available: tour.availableSlots, isActive: tour.isActive };
    }
    throw new AppError('Invalid item type', 400, 'VALIDATION_ERROR');
  },
};
