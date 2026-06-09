import { Router } from 'express';
import { apiKeyAuth } from '../../middleware/apiKeyAuth';
import * as publicController from './public.controller';

const router = Router();

router.use(apiKeyAuth);

router.get('/destinations', publicController.listDestinations);
router.get('/flights', publicController.listFlights);
router.get('/hotels', publicController.listHotels);
router.get('/tours', publicController.listTours);
router.get('/bookings', publicController.listBookings);

export default router;
