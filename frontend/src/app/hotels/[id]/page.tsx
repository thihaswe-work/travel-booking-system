'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { get, post, getApiError } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import HotelBookingForm from '@/components/booking/HotelBookingForm';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import type { Hotel, Booking, ApiResponse } from '@/types';
import { MapPin, Star, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function HotelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingBooking, setPendingBooking] = useState<{ roomId: string; checkIn: string; checkOut: string; quantity: number } | null>(null);

  useEffect(() => {
    const fetchHotel = async () => {
      try {
        const data = await get<ApiResponse<Hotel>>(`/hotels/${params.id}`);
        setHotel(data.data);
      } catch {
        toast.error('Failed to load hotel details');
      } finally {
        setLoading(false);
      }
    };
    fetchHotel();
  }, [params.id]);

  const handleBooking = async (roomId: string, checkIn: string, checkOut: string, quantity: number) => {
    setPendingBooking({ roomId, checkIn, checkOut, quantity });
    setConfirmOpen(true);
  };

  const confirmBooking = async () => {
    if (!hotel || !pendingBooking) return;
    setConfirmOpen(false);
    setBooking(true);
    try {
      const res = await post<ApiResponse<Booking>>('/bookings', {
        bookingType: 'hotel',
        items: [{
          itemType: 'hotel',
          itemId: pendingBooking.roomId,
          quantity: pendingBooking.quantity,
          checkInDate: pendingBooking.checkIn,
          checkOutDate: pendingBooking.checkOut,
        }],
        paymentMethod: 'cash_on_arrival',
      });
      toast.success('Booking created!');
      router.push(`/booking/checkout/${res.data.id}`);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setBooking(false);
      setPendingBooking(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" label="Loading hotel details..." />
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Hotel Not Found</h2>
        <Link href="/search?type=hotels">
          <Button variant="primary">Back to Search</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/search?type=hotels"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to search
      </Link>

      <div className="h-64 md:h-80 rounded-xl overflow-hidden mb-8 bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center">
        {hotel.imageUrl ? (
          <img src={hotel.imageUrl} alt={hotel.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-white text-6xl font-bold opacity-30">{hotel.name.charAt(0)}</span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{hotel.name}</h1>
                <div className="flex items-center gap-1 mt-1">
                  {Array.from({ length: hotel.starRating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
              <MapPin className="w-4 h-4" />
              {hotel.address}
            </div>
            <p className="text-gray-700 leading-relaxed">{hotel.description}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Book a Room</h2>
            <HotelBookingForm
              hotel={hotel}
              rooms={hotel.rooms || []}
              onComplete={handleBooking}
            />
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
            <h3 className="font-semibold text-gray-900 mb-4">Hotel Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Rating</span>
                <span className="font-medium text-gray-900">{hotel.starRating} Stars</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Rooms</span>
                <span className="font-medium text-gray-900">{hotel.rooms?.length || 0} types</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Location</span>
                <span className="font-medium text-gray-900">{hotel.address}</span>
              </div>
              <div className="pt-3 border-t border-gray-100">
                <p className="text-gray-500 text-xs mb-1">Price per night</p>
                <p className="text-xl font-bold text-primary-600">
                  {formatCurrency(hotel.pricePerNight || (hotel.rooms && hotel.rooms.length > 0 ? Math.min(...hotel.rooms.map((r) => r.pricePerNight)) : 0))}
                </p>
                <p className="text-xs text-gray-400">per night</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => { setConfirmOpen(false); setPendingBooking(null); }}
        onConfirm={confirmBooking}
        title="Confirm Booking"
        message={`Book ${hotel.name}${pendingBooking ? ` (${pendingBooking.checkIn} to ${pendingBooking.checkOut}, ${pendingBooking.quantity} room${pendingBooking.quantity > 1 ? 's' : ''})` : ''}?`}
        confirmLabel="Confirm Booking"
        loading={booking}
        variant="primary"
      />
    </div>
  );
}
