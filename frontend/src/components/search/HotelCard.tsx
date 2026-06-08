'use client';

import React from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import Button from '@/components/ui/Button';
import type { Hotel } from '@/types';
import { MapPin, Star } from 'lucide-react';

interface HotelCardProps {
  hotel: Hotel;
}

export default function HotelCard({ hotel }: HotelCardProps) {
  const lowestPrice = hotel.rooms && hotel.rooms.length > 0
    ? Math.min(...hotel.rooms.map((r) => r.pricePerNight))
    : null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden card-hover flex flex-col md:flex-row">
      <div className="md:w-72 h-48 md:h-auto relative overflow-hidden bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center">
        {hotel.imageUrl ? (
          <img
            src={hotel.imageUrl}
            alt={hotel.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-white text-lg font-bold opacity-50">{hotel.name.charAt(0)}</span>
        )}
      </div>
      <div className="flex-1 p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900">{hotel.name}</h3>
            <div className="flex items-center">
              {Array.from({ length: hotel.starRating }).map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
            <MapPin className="w-3.5 h-3.5" />
            {hotel.address}
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">{hotel.description}</p>
        </div>
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <div>
            {lowestPrice !== null ? (
              <>
                <p className="text-2xl font-bold text-primary-600">
                  {formatCurrency(lowestPrice)}
                </p>
                <p className="text-xs text-gray-500">per night</p>
              </>
            ) : (
              <p className="text-sm text-gray-500">No rooms available</p>
            )}
          </div>
          <Link href={`/hotels/${hotel.id}`}>
            <Button variant="primary" size="sm">
              View Rooms
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
