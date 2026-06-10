'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { get, post, getApiError } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import TourBookingForm from '@/components/booking/TourBookingForm';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import type { Tour, Booking, ApiResponse } from '@/types';
import { Clock, Users, Check, MapPin, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function TourDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingParticipants, setPendingParticipants] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash_on_arrival');
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchTour = async () => {
      try {
        const data = await get<ApiResponse<Tour>>(`/tours/${params.id}`);
        setTour(data.data);
      } catch {
        toast.error('Failed to load tour details');
      } finally {
        setLoading(false);
      }
    };
    fetchTour();
  }, [params.id]);

  useEffect(() => {
    if (!tour) return;
    const saved = sessionStorage.getItem(`pendingTourBooking_${tour.id}`);
    if (saved) {
      sessionStorage.removeItem(`pendingTourBooking_${tour.id}`);
      setPendingParticipants(JSON.parse(saved).participants);
      setConfirmOpen(true);
    }
  }, [tour]);

  const handleBooking = async (participants: number) => {
    if (!isAuthenticated) {
      sessionStorage.setItem(`pendingTourBooking_${tour?.id}`, JSON.stringify({ participants, paymentMethod }));
      router.push(`/login?redirect=/tours/${tour?.id}`);
      return;
    }
    setPendingParticipants(participants);
    setPaymentMethod('cash_on_arrival');
    setConfirmOpen(true);
  };

  const confirmBooking = async () => {
    if (!tour || pendingParticipants === null) return;
    setConfirmOpen(false);
    setBooking(true);
    try {
      const res = await post<ApiResponse<Booking>>('/bookings', {
        bookingType: 'tour',
        items: [{
          itemType: 'tour',
          itemId: tour.id,
          quantity: pendingParticipants,
        }],
        paymentMethod,
      });
      toast.success('Booking created!');
      if (paymentMethod === 'card') {
        router.push(`/booking/checkout/${res.data.id}`);
      } else {
        router.push(`/booking/${res.data.id}`);
      }
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setBooking(false);
      setPendingParticipants(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" label="Loading tour details..." />
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tour Not Found</h2>
        <Link href="/search?type=tours">
          <Button variant="primary">Back to Search</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/search?type=tours"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to search
      </Link>

      <div className="h-64 md:h-80 rounded-xl overflow-hidden mb-8 relative bg-gradient-to-br from-secondary-400 to-primary-400 flex items-center justify-center">
        {tour.imageUrl ? (
          <img src={tour.imageUrl} alt={tour.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-white text-6xl font-bold opacity-30">{tour.name.charAt(0)}</span>
        )}
        <div className="absolute top-4 left-4 flex gap-2">
          <Badge variant="primary" size="md">
            <Clock className="w-3.5 h-3.5 mr-1 inline" />
            {tour.durationDays} days
          </Badge>
          <Badge variant="success" size="md">
            <Users className="w-3.5 h-3.5 mr-1 inline" />
            {tour.availableSlots} spots left
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{tour.name}</h1>
            {tour.destination && (
              <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
                <MapPin className="w-4 h-4" />
                {tour.destination.name}, {tour.destination.country}
              </div>
            )}
            <p className="text-gray-700 leading-relaxed">{tour.description}</p>
          </div>

          {tour.includes && tour.includes.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">What&apos;s Included</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {tour.includes.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tour.itinerary && tour.itinerary.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Itinerary</h2>
              <div className="space-y-4">
                {tour.itinerary.map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-primary-600">{item.day}</span>
                      </div>
                      {i < tour.itinerary.length - 1 && (
                        <div className="w-px flex-1 bg-gray-200 my-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-medium text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-700">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Book This Tour</h2>
            <TourBookingForm tour={tour} onComplete={handleBooking} />
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
            <h3 className="font-semibold text-gray-900 mb-4">Tour Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Duration</span>
                <span className="font-medium text-gray-900">{tour.durationDays} days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Max Participants</span>
                <span className="font-medium text-gray-900">{tour.maxCapacity}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Available</span>
                <span className="font-medium text-gray-900">{tour.availableSlots} spots</span>
              </div>
              <div className="pt-3 border-t border-gray-100">
                <p className="text-gray-500 text-xs mb-1">Price per person</p>
                <p className="text-2xl font-bold text-primary-600">
                  {formatCurrency(tour.pricePerPerson)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => { setConfirmOpen(false); setPendingParticipants(null); }}
        onConfirm={confirmBooking}
        title="Confirm Booking"
        message={`Book ${tour.name} for ${pendingParticipants} participant${(pendingParticipants || 0) > 1 ? 's' : ''}?`}
        confirmLabel="Confirm Booking"
        loading={booking}
        variant="primary"
      >
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
          <div className="space-y-2">
            <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${paymentMethod === 'cash_on_arrival' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}>
              <input type="radio" name="method" value="cash_on_arrival" checked={paymentMethod === 'cash_on_arrival'} onChange={() => setPaymentMethod('cash_on_arrival')} className="text-primary-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Cash on Arrival</p>
                <p className="text-xs text-gray-500">Pay when you arrive</p>
              </div>
            </label>
            <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${paymentMethod === 'card' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}>
              <input type="radio" name="method" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="text-primary-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Card Payment</p>
                <p className="text-xs text-gray-500">Pay online now</p>
              </div>
            </label>
          </div>
        </div>
      </ConfirmDialog>
    </div>
  );
}
