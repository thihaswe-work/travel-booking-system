'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import type { Tour } from '@/types';
import { Clock, Users, Check } from 'lucide-react';

interface TourCardProps {
  tour: Tour;
}

export default function TourCard({ tour }: TourCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden card-hover flex flex-col md:flex-row">
      <div className="md:w-72 h-48 md:h-auto relative overflow-hidden bg-gradient-to-br from-secondary-400 to-primary-400 flex items-center justify-center">
        {tour.imageUrl ? (
          <Image
            src={tour.imageUrl}
            alt={tour.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 288px"
          />
        ) : (
          <span className="text-white text-lg font-bold opacity-50">{tour.name.charAt(0)}</span>
        )}
        <div className="absolute top-3 left-3">
          <Badge variant="primary" size="sm">
            <Clock className="w-3 h-3 mr-1 inline" />
            {tour.durationDays} days
          </Badge>
        </div>
      </div>
      <div className="flex-1 p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between mb-1">
            <h3 className="text-lg font-semibold text-gray-900">{tour.name}</h3>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Users className="w-3.5 h-3.5" />
              <span>{tour.availableSlots} left</span>
            </div>
          </div>
          {tour.destination && (
            <p className="text-sm text-gray-500 mb-2">
              {tour.destination.name}, {tour.destination.country}
            </p>
          )}
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{tour.description}</p>
          {tour.includes && tour.includes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tour.includes.slice(0, 3).map((item, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-md"
                >
                  <Check className="w-3 h-3 text-green-500" />
                  {item}
                </span>
              ))}
              {tour.includes.length > 3 && (
                <span className="text-xs text-gray-400">+{tour.includes.length - 3} more</span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <div>
            <p className="text-2xl font-bold text-primary-600">
              {formatCurrency(tour.pricePerPerson)}
            </p>
            <p className="text-xs text-gray-500">per person</p>
          </div>
          <Link href={`/tours/${tour.id}`}>
            <Button variant="primary" size="sm">
              View Details
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
