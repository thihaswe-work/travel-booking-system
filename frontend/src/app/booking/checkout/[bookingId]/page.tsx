'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { get, patch, getApiError } from '@/lib/api';
import BookingSummary from '@/components/booking/BookingSummary';
import PaymentForm from '@/components/booking/PaymentForm';
import Spinner from '@/components/ui/Spinner';
import type { Booking } from '@/types';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const data = await get<Booking>(`/bookings/${params.bookingId}`);
        setBooking(data);
      } catch {
        toast.error('Failed to load booking');
        router.push('/');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [params.bookingId, router]);

  const handlePayment = async (method: string, cardLastFour?: string) => {
    setPaymentProcessing(true);
    try {
      await patch<Booking>(`/bookings/${params.bookingId}/payment`, {
        method,
        cardLastFour,
        status: method === 'cash_on_arrival' ? 'pending' : 'completed',
      });
      await patch<Booking>(`/bookings/${params.bookingId}/status`, {
        status: 'confirmed',
      });
      toast.success('Booking confirmed!');
      router.push(`/booking/${params.bookingId}`);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setPaymentProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" label="Loading checkout..." />
      </div>
    );
  }

  if (!booking) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href={`/bookings/${params.bookingId}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h2>
          <BookingSummary booking={booking} />
        </div>
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment</h2>
          <PaymentForm
            amount={booking.totalAmount}
            currency={booking.currency}
            onProcess={handlePayment}
          />
        </div>
      </div>
    </div>
  );
}
