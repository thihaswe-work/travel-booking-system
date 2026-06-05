import prisma from '../../config/database';
import { AppError } from '../../utils/AppError';
import { getPagination, getPaginationMeta } from '../../utils/pagination';

interface NotificationFilters {
  is_read?: string;
  type?: string;
}

export const notificationService = {
  async list(userId: string, filters: NotificationFilters, query: Record<string, any>) {
    const { skip, take, page, limit } = getPagination(query);
    const where: any = { userId };

    if (filters.is_read !== undefined) {
      where.isRead = filters.is_read === 'true';
    }
    if (filters.type) {
      where.type = filters.type;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.notification.count({ where }),
    ]);

    return { notifications, meta: getPaginationMeta(total, page, limit) };
  },

  async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) throw new AppError('Notification not found', 404, 'NOT_FOUND');
    if (notification.userId !== userId) {
      throw new AppError('Access denied', 403, 'FORBIDDEN');
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  },

  async markAllAsRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { count: result.count };
  },

  async create(data: {
    userId: string;
    type: string;
    channel: string;
    subject: string;
    message: string;
  }) {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type as any,
        channel: data.channel as any,
        subject: data.subject,
        message: data.message,
      },
    });

    return notification;
  },
};
