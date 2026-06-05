'use client';

import React, { useState, useMemo } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Hotel, HotelRoom } from '@/types';
import { Users, Bed } from 'lucide-react';

interface HotelBookingFormProps {
  hotel: Hotel;
  rooms: HotelRoom[];
  onComplete: (roomId: string, checkIn: string, checkOut: string, quantity: number) => void;
}

export default function HotelBookingForm({ hotel, rooms, onComplete }: HotelBookingFormProps) {
  const today = new Date().toISOString().split('T')[0];
  const [selectedRoomId, setSelectedRoomId] = useState<string>(rooms[0]?.id || '');
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [quantity, setQuantity] = useState(1);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = Math.floor((end.getTime() - start.getTime()) / 86400000);
    return Math.max(0, diff);
  }, [checkIn, checkOut]);

  const totalPrice = useMemo(
    () => (selectedRoom ? selectedRoom.pricePerNight * nights * quantity : 0),
    [selectedRoom, nights, quantity]
  );

  const canSubmit = selectedRoom && checkIn && checkOut && nights > 0 && quantity > 0 && selectedRoom.availableRooms >= quantity;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Check-in"
          type="date"
          value={checkIn}
          min={today}
          onChange={(e) => setCheckIn(e.target.value)}
        />
        <Input
          label="Check-out"
          type="date"
          value={checkOut}
          min={checkIn || today}
          onChange={(e) => setCheckOut(e.target.value)}
        />
      </div>

      {nights > 0 && (
        <p className="text-sm text-gray-500">
          {nights} night{nights !== 1 ? 's' : ''}
        </p>
      )}

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Select Room Type</h4>
        <div className="space-y-3">
          {rooms.map((room) => (
            <label
              key={room.id}
              className={`block p-4 rounded-lg border cursor-pointer transition-colors ${
                selectedRoomId === room.id
                  ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                  : 'border-gray-200 hover:border-gray-300'
              } ${room.availableRooms === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="room"
                      value={room.id}
                      checked={selectedRoomId === room.id}
                      onChange={() => setSelectedRoomId(room.id)}
                      className="text-primary-600"
                      disabled={room.availableRooms === 0}
                    />
                    <span className="font-medium text-gray-900">{room.roomType}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 ml-5">{room.description}</p>
                  <div className="flex items-center gap-4 mt-2 ml-5 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> Max {room.maxGuests} guests
                    </span>
                    <span className="flex items-center gap-1">
                      <Bed className="w-3 h-3" /> {room.availableRooms} rooms left
                    </span>
                  </div>
                  {room.amenities && room.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 ml-5">
                      {room.amenities.slice(0, 4).map((a, i) => (
                        <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {a}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary-600">
                    {formatCurrency(room.pricePerNight)}
                  </p>
                  <p className="text-xs text-gray-500">per night</p>
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {selectedRoom && selectedRoom.availableRooms > 1 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Number of Rooms
          </label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
            >
              -
            </Button>
            <span className="text-sm font-medium text-gray-700 w-8 text-center">{quantity}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuantity(Math.min(selectedRoom.availableRooms, quantity + 1))}
              disabled={quantity >= selectedRoom.availableRooms}
            >
              +
            </Button>
          </div>
        </div>
      )}

      {nights > 0 && selectedRoom && (
        <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>{formatCurrency(selectedRoom.pricePerNight)} x {nights} nights</span>
              <span>{formatCurrency(selectedRoom.pricePerNight * nights)}</span>
            </div>
            {quantity > 1 && (
              <div className="flex justify-between">
                <span>x {quantity} room{quantity > 1 ? 's' : ''}</span>
                <span>{formatCurrency(selectedRoom.pricePerNight * nights * quantity)}</span>
              </div>
            )}
          </div>
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-primary-200">
            <span className="font-semibold text-gray-900">Total</span>
            <span className="text-xl font-bold text-primary-700">{formatCurrency(totalPrice)}</span>
          </div>
        </div>
      )}

      <Button
        variant="primary"
        size="lg"
        fullWidth
        disabled={!canSubmit}
        onClick={() => onComplete(selectedRoomId, checkIn, checkOut, quantity)}
      >
        Continue to Booking
      </Button>
    </div>
  );
}
