'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { get, patch, getApiError } from '@/lib/api';
import BookingSummary from '@/components/booking/BookingSummary';
import BookingConfirmation from '@/components/booking/BookingConfirmation';
import Spinner from '@/components/ui/Spinner';
import type { Booking, ApiResponse } from '@/types';
import toast from 'react-hot-toast';

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const data = await get<ApiResponse<Booking>>(`/bookings/${params.id}`);
        setBooking(data.data);
      } catch {
        toast.error('Failed to load booking');
        router.push('/');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [params.id, router]);

  const handleCancel = async () => {
    if (!booking) return;
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await patch(`/bookings/${booking.id}/status`, { status: 'cancelled' });
      toast.success('Booking cancelled');
      const updated = await get<ApiResponse<Booking>>(`/bookings/${params.id}`);
      setBooking(updated.data);
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" label="Loading booking..." />
      </div>
    );
  }

  if (!booking) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {booking?.status === 'confirmed' || booking?.status === 'completed' ? (
        <BookingConfirmation booking={booking} />
      ) : (
        <>
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Booking Details</h1>
          <BookingSummary booking={booking} onCancel={handleCancel} />
        </>
      )}
    </div>
  );
}
