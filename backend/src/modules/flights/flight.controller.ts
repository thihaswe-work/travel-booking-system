import { Request, Response } from 'express';
import * as flightService from './flight.service';

export async function list(req: Request, res: Response): Promise<void> {
  const filters = {
    departureCity: req.query.departure_city as string | undefined,
    arrivalCity: req.query.arrival_city as string | undefined,
    date: req.query.date as string | undefined,
    seatClass: req.query.seat_class as string | undefined,
    minPrice: req.query.min_price ? parseFloat(req.query.min_price as string) : undefined,
    maxPrice: req.query.max_price ? parseFloat(req.query.max_price as string) : undefined,
    destinationId: req.query.destination_id as string | undefined,
    sort: req.query.sort as string | undefined,
  };

  const result = await flightService.list(filters, req.query);
  res.json({ success: true, data: result.data, pagination: result.pagination });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const flight = await flightService.getById(req.params.id);
  res.json({ success: true, data: flight });
}

export async function create(req: Request, res: Response): Promise<void> {
  const flight = await flightService.create(req.body);
  res.status(201).json({ success: true, data: flight });
}

export async function update(req: Request, res: Response): Promise<void> {
  const flight = await flightService.update(req.params.id, req.body);
  res.json({ success: true, data: flight });
}

export async function remove(req: Request, res: Response): Promise<void> {
  await flightService.softDelete(req.params.id);
  res.json({ success: true, message: 'Flight deleted successfully' });
}

export async function updateSeats(req: Request, res: Response): Promise<void> {
  const flight = await flightService.updateSeats(req.params.id, req.body.available_seats);
  res.json({ success: true, data: flight });
}
