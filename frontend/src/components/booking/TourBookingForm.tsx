'use client';

import React, { useState, useMemo } from 'react';
import Button from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import type { Tour } from '@/types';
import { Users, Minus, Plus } from 'lucide-react';

interface TourBookingFormProps {
  tour: Tour;
  onComplete: (participants: number) => void;
}

export default function TourBookingForm({ tour, onComplete }: TourBookingFormProps) {
  const [participants, setParticipants] = useState(1);

  const totalPrice = useMemo(
    () => tour.pricePerPerson * participants,
    [tour.pricePerPerson, participants]
  );

  const canBook = participants > 0 && participants <= tour.availableSlots;

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Available Slots</span>
          <span className="text-sm font-semibold text-gray-900">{tour.availableSlots}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-500 h-2 rounded-full"
            style={{
              width: `${Math.min(100, (tour.availableSlots / tour.maxCapacity) * 100)}%`,
            }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {tour.availableSlots} of {tour.maxCapacity} spots remaining
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Number of Participants
        </label>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setParticipants(Math.max(1, participants - 1))}
            disabled={participants <= 1}
          >
            <Minus className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-lg font-semibold text-gray-900">{participants}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setParticipants(Math.min(tour.availableSlots, participants + 1))}
            disabled={participants >= tour.availableSlots}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
        <div className="space-y-1 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>{formatCurrency(tour.pricePerPerson)} per person</span>
            <span>{formatCurrency(tour.pricePerPerson)}</span>
          </div>
          <div className="flex justify-between">
            <span>x {participants} participant{participants > 1 ? 's' : ''}</span>
            <span>{formatCurrency(totalPrice)}</span>
          </div>
        </div>
        <div className="flex justify-between items-center mt-2 pt-2 border-t border-primary-200">
          <span className="font-semibold text-gray-900">Total</span>
          <span className="text-xl font-bold text-primary-700">{formatCurrency(totalPrice)}</span>
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        fullWidth
        disabled={!canBook}
        onClick={() => onComplete(participants)}
      >
        {canBook ? 'Continue to Booking' : 'No Slots Available'}
      </Button>
    </div>
  );
}
