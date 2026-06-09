import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import userRoutes from '../modules/users/user.routes';
import destinationRoutes from '../modules/destinations/destination.routes';
import flightRoutes from '../modules/flights/flight.routes';
import hotelRoutes from '../modules/hotels/hotel.routes';
import tourRoutes from '../modules/tours/tour.routes';
import bookingRoutes from '../modules/bookings/booking.routes';
import paymentRoutes from '../modules/payments/payment.routes';
import notificationRoutes from '../modules/notifications/notification.routes';
import adminRoutes from '../modules/admin/admin.routes';
import uploadRoutes from '../modules/upload/upload.routes';
import apiKeyRoutes from '../modules/api-keys/api-key.routes';
import publicRoutes from '../modules/api-keys/public.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/destinations', destinationRoutes);
router.use('/flights', flightRoutes);
router.use('/hotels', hotelRoutes);
router.use('/tours', tourRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/upload', uploadRoutes);
router.use('/api-keys', apiKeyRoutes);
router.use('/public', publicRoutes);

export default router;
