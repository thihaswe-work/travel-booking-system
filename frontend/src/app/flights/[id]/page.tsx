'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { get, post, getApiError } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import FlightBookingForm from '@/components/booking/FlightBookingForm';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import type { Flight, Booking, BookingPassenger, ApiResponse } from '@/types';
import { Plane, Clock, Calendar, Users, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function FlightDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [flight, setFlight] = useState<Flight | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    const fetchFlight = async () => {
      try {
        const data = await get<ApiResponse<Flight>>(`/flights/${params.id}`);
        setFlight(data.data);
      } catch {
        toast.error('Failed to load flight details');
      } finally {
        setLoading(false);
      }
    };
    fetchFlight();
  }, [params.id]);

  const handleBooking = async (passengers: BookingPassenger[], seatClass: string) => {
    setBooking(true);
    try {
      const bookingData = await post<ApiResponse<Booking>>('/bookings', {
        bookingType: 'flight',
        items: [{
          itemType: 'flight',
          itemId: flight!.id,
          quantity: passengers.length,
          passengers: passengers.map((p) => ({
            firstName: p.firstName,
            lastName: p.lastName,
            documentType: p.documentType,
            documentNumber: p.documentNumber,
            seatClass,
          })),
        }],
        paymentMethod: 'cash_on_arrival',
      });
      const booking = bookingData.data;
      toast.success('Booking created!');
      router.push(`/booking/checkout/${booking.id}`);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" label="Loading flight details..." />
      </div>
    );
  }

  if (!flight) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Flight Not Found</h2>
        <Link href="/search?type=flights">
          <Button variant="primary">Back to Search</Button>
        </Link>
      </div>
    );
  }

  const hours = Math.floor(flight.durationMin / 60);
  const mins = flight.durationMin % 60;
  const seats = flight.seats || [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/search?type=flights"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to search
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <Plane className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{flight.airline}</h1>
                <p className="text-sm text-gray-500">{flight.flightNumber}</p>
              </div>
            </div>

            <div className="flex items-center justify-between py-6 border-y border-gray-100">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {new Date(flight.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-xs text-gray-400">{flight.departureCity}</p>
              </div>
              <div className="flex flex-col items-center px-6">
                <span className="text-xs text-gray-500">
                  {formatDate(flight.departureTime)}
                </span>
                <div className="relative w-32 my-2">
                  <div className="border-t-2 border-dashed border-gray-300 w-full" />
                  <Plane className="w-4 h-4 text-primary-500 absolute -top-2 right-0" />
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Clock className="w-3.5 h-3.5" />
                  {hours}h {mins}m
                </div>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {new Date(flight.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-xs text-gray-400">{flight.arrivalCity}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6">
              {seats.map((seat) => (
                <div key={seat.id} className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(Number(seat.price))}</p>
                  <p className="text-xs text-gray-500">
                    {seat.seatClass === 'economy' ? 'Economy' : seat.seatClass === 'business' ? 'Business' : 'First Class'}
                  </p>
                  <p className="text-xs text-gray-400">{seat.availableSeats} seats</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Book This Flight</h2>
            <FlightBookingForm flight={flight} onComplete={handleBooking} />
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
            <h3 className="font-semibold text-gray-900 mb-4">Flight Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Airline</span>
                <span className="font-medium text-gray-900">{flight.airline}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Flight</span>
                <span className="font-medium text-gray-900">{flight.flightNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">From</span>
                <span className="font-medium text-gray-900">{flight.departureCity}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">To</span>
                <span className="font-medium text-gray-900">{flight.arrivalCity}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Duration</span>
                <span className="font-medium text-gray-900">{hours}h {mins}m</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
