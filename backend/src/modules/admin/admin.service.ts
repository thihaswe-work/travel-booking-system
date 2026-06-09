import prisma from '../../config/database';
import { AppError } from '../../utils/AppError';

export const adminService = {
  async getOverview(from?: string, to?: string) {
    const dateFilter: any = {};
    if (from || to) {
      dateFilter.createdAt = {};
      if (from) dateFilter.createdAt.gte = new Date(from);
      if (to) dateFilter.createdAt.lte = new Date(to);
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [totalBookings, paidAgg, totalUsers, todayBookings, todayPaidAgg, bookingsByType,
           pendingFlights, pendingHotels, pendingTours] =
      await Promise.all([
        prisma.booking.count({ where: dateFilter }),
        prisma.payment.aggregate({
          where: { paymentStatus: 'paid', ...dateFilter },
          _sum: { amount: true },
        }),
        prisma.user.count({ where: { isActive: true } }),
        prisma.booking.count({
          where: { createdAt: { gte: todayStart, lte: todayEnd } },
        }),
        prisma.payment.aggregate({
          where: { paymentStatus: 'paid', createdAt: { gte: todayStart, lte: todayEnd } },
          _sum: { amount: true },
        }),
        prisma.booking.groupBy({
          by: ['bookingType'],
          where: dateFilter,
          _count: true,
        }),
        prisma.flight.count({ where: { isActive: false } }),
        prisma.hotel.count({ where: { isActive: false } }),
        prisma.tour.count({ where: { isActive: false } }),
      ]);

    const revenueByType = await Promise.all(
      bookingsByType.map(async (bt) => {
        const agg = await prisma.payment.aggregate({
          where: {
            paymentStatus: 'paid',
            booking: { bookingType: bt.bookingType, ...dateFilter },
          },
          _sum: { amount: true },
        });
        return { bookingType: bt.bookingType, revenue: agg._sum.amount || 0 };
      }),
    );

    const popularDestinations = await this.getPopularDestinations(5);

    return {
      totalBookings,
      totalRevenue: paidAgg._sum.amount || 0,
      totalUsers,
      todayBookings,
      todayRevenue: todayPaidAgg._sum.amount || 0,
      bookingsByType: bookingsByType.map((bt) => ({
        bookingType: bt.bookingType,
        count: bt._count,
      })),
      revenueByType,
      popularDestinations,
      pendingFlights,
      pendingHotels,
      pendingTours,
    };
  },

  async getBookingsAnalytics(from?: string, to?: string, groupBy: string = 'day') {
    const trunc = groupBy === 'week' ? 'week' : groupBy === 'month' ? 'month' : 'day';
    const fromDate = from ? new Date(from) : new Date(new Date().setFullYear(new Date().getFullYear() - 1));
    const toDate = to ? new Date(to) : new Date();
    const results: Array<{ date: Date; count: bigint; revenue: string }> = await prisma.$queryRawUnsafe(
      `SELECT DATE_TRUNC($1, created_at) as date,
              COUNT(*)::int as count,
              COALESCE(SUM(total_amount)::float, 0) as revenue
       FROM bookings
       WHERE created_at >= $2 AND created_at <= $3
       GROUP BY DATE_TRUNC($1, created_at)
       ORDER BY date ASC`,
      trunc,
      fromDate,
      toDate,
    );

    return results.map((r) => ({
      date: r.date,
      count: Number(r.count),
      revenue: Number(r.revenue),
    }));
  },

  async getRevenueAnalytics(from?: string, to?: string, groupBy: string = 'day') {
    const trunc = groupBy === 'week' ? 'week' : groupBy === 'month' ? 'month' : 'day';
    const fromDate = from ? new Date(from) : new Date(new Date().setFullYear(new Date().getFullYear() - 1));
    const toDate = to ? new Date(to) : new Date();
    const results: Array<{ date: Date; amount: string }> = await prisma.$queryRawUnsafe(
      `SELECT DATE_TRUNC($1, paid_at) as date,
              COALESCE(SUM(amount)::float, 0) as amount
       FROM payments
       WHERE payment_status = 'paid' AND paid_at >= $2 AND paid_at <= $3
       GROUP BY DATE_TRUNC($1, paid_at)
       ORDER BY date ASC`,
       trunc,
      fromDate,
      toDate,
    );

    return results.map((r) => ({
      date: r.date,
      amount: Number(r.amount),
    }));
  },

  async getPopularDestinations(limit: number = 10) {
    const popularItems = await prisma.bookingDetail.groupBy({
      by: ['itemId', 'itemType'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    const destinations = await Promise.all(
      popularItems.map(async (item) => {
        let destinationName = 'Unknown';
        try {
          if (item.itemType === 'flight') {
            const flight = await prisma.flight.findUnique({
              where: { id: item.itemId },
              include: { destination: true },
            });
            if (flight?.destination) destinationName = flight.destination.name;
          } else if (item.itemType === 'hotel') {
            const room = await prisma.hotelRoom.findUnique({
              where: { id: item.itemId },
              include: { hotel: { include: { destination: true } } },
            });
            if (room?.hotel?.destination) destinationName = room.hotel.destination.name;
          } else if (item.itemType === 'tour') {
            const tour = await prisma.tour.findUnique({
              where: { id: item.itemId },
              include: { destination: true },
            });
            if (tour?.destination) destinationName = tour.destination.name;
          }
        } catch {
          destinationName = 'Unknown';
        }
        return { itemId: item.itemId, itemType: item.itemType, bookings: item._count.id, destinationName };
      }),
    );

    const grouped: Record<string, { destinationName: string; totalBookings: number }> = {};
    for (const d of destinations) {
      if (grouped[d.destinationName]) {
        grouped[d.destinationName].totalBookings += d.bookings;
      } else {
        grouped[d.destinationName] = { destinationName: d.destinationName, totalBookings: d.bookings };
      }
    }

    return Object.values(grouped).sort((a, b) => b.totalBookings - a.totalBookings).slice(0, limit);
  },
};
