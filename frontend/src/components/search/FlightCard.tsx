'use client';

import React from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import type { Flight } from '@/types';
import { Plane, Clock, Users } from 'lucide-react';
interface FlightCardProps {
  flight: Flight;
}

export default function FlightCard({ flight }: FlightCardProps) {
  const depTime = format(parseISO(flight.departureTime), 'HH:mm');
  const arrTime = format(parseISO(flight.arrivalTime), 'HH:mm');
  const depDate = format(parseISO(flight.departureTime), 'MMM dd, yyyy');
  const hours = Math.floor(flight.durationMin / 60);
  const mins = flight.durationMin % 60;
  const seats = flight.seats || [];
  const totalAvailable = seats.reduce((sum, s) => sum + s.availableSeats, 0);
  const hasSeats = totalAvailable > 0;
  const minPrice = seats.length > 0 ? Math.min(...seats.map((s) => Number(s.price))) : 0;
  const seatClasses = seats.map((s) => s.seatClass).join(', ');

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 card-hover">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <Plane className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{flight.airline}</p>
            <p className="text-sm text-gray-500">{flight.flightNumber}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 lg:gap-8">
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">{depTime}</p>
            <p className="text-xs text-gray-400">{depDate}</p>
          </div>

          <div className="flex flex-col items-center px-4">
            <span className="text-xs text-gray-500">{flight.departureCity}</span>
            <div className="relative w-20 lg:w-32">
              <div className="border-t border-gray-300 w-full" />
              <Plane className="w-3.5 h-3.5 text-primary-500 absolute -top-2 right-0 rotate-90" />
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
              <Clock className="w-3 h-3" />
              {hours}h {mins}m
            </div>
            <span className="text-xs text-gray-500 mt-1">{flight.arrivalCity}</span>
          </div>

          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">{arrTime}</p>
            <p className="text-xs text-gray-400">{depDate}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 lg:flex-col lg:items-end">
          <div className="text-right">
            <p className="text-2xl font-bold text-primary-600">
              from {formatCurrency(minPrice)}
            </p>
            <p className="text-xs text-gray-500">per person</p>
          </div>
          <div className="flex items-center gap-2">
            {!hasSeats && (
              <Badge variant="danger" size="sm">Sold Out</Badge>
            )}
            <Link href={`/flights/${flight.id}`}>
              <Button variant="primary" size="sm" disabled={!hasSeats}>
                Book Now
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          <span>{totalAvailable} seats available</span>
        </div>
        {seatClasses && <span>{seatClasses}</span>}
      </div>
    </div>
  );
}
