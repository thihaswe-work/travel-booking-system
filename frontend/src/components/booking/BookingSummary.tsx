'use client';

import React from 'react';
import { formatCurrency, formatDate, formatDateTime, getStatusColor, getBookingTypeLabel } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import type { Booking } from '@/types';
import { Plane, Building2, Compass, Calendar, CreditCard, Download, XCircle } from 'lucide-react';

interface BookingSummaryProps {
  booking: Booking;
  onCancel?: () => void;
}

export default function BookingSummary({ booking, onCancel }: BookingSummaryProps) {
  const getIcon = () => {
    switch (booking.bookingType) {
      case 'flight':
        return <Plane className="w-5 h-5" />;
      case 'hotel':
        return <Building2 className="w-5 h-5" />;
      case 'tour':
        return <Compass className="w-5 h-5" />;
    }
  };

  const canCancel = booking.status === 'pending' || booking.status === 'confirmed';

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600">
              {getIcon()}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {getBookingTypeLabel(booking.bookingType)} Booking
              </h3>
              <p className="text-sm text-gray-500">Ref: {booking.referenceId}</p>
            </div>
          </div>
          <Badge variant={
            booking.status === 'confirmed' ? 'success' :
            booking.status === 'cancelled' ? 'danger' :
            booking.status === 'completed' ? 'info' : 'warning'
          } size="md">
            {booking.status.toUpperCase()}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {booking.flight && (
            <>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Plane className="w-4 h-4" />
                <span>{booking.flight.airline} - {booking.flight.flightNumber}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(booking.flight.departureTime)}</span>
              </div>
              <div className="text-sm text-gray-600">
                {booking.flight.departureCity} ({booking.flight.departureAirport}) → {booking.flight.arrivalCity} ({booking.flight.arrivalAirport})
              </div>
              <div className="text-sm text-gray-600">
                Seat Class: {(booking.seatClass || 'economy').charAt(0).toUpperCase() + (booking.seatClass || 'economy').slice(1)}
              </div>
            </>
          )}

          {booking.hotel && (
            <>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Building2 className="w-4 h-4" />
                <span>{booking.hotel.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{booking.checkIn && formatDate(booking.checkIn)} - {booking.checkOut && formatDate(booking.checkOut)}</span>
              </div>
              {booking.room && (
                <div className="text-sm text-gray-600">
                  Room: {booking.room.roomType} x {booking.roomQuantity || 1}
                </div>
              )}
            </>
          )}

          {booking.tour && (
            <>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Compass className="w-4 h-4" />
                <span>{booking.tour.name}</span>
              </div>
              <div className="text-sm text-gray-600">
                Duration: {booking.tour.duration} {booking.tour.durationUnit}
              </div>
              <div className="text-sm text-gray-600">
                Participants: {booking.participants}
              </div>
            </>
          )}
        </div>
      </div>

      {booking.passengers && booking.passengers.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-3">Passengers</h4>
          <div className="space-y-2">
            {booking.passengers.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{p.firstName} {p.lastName}</p>
                  <p className="text-xs text-gray-500">{p.documentType}: {p.documentNumber}</p>
                </div>
                {p.seatClass && (
                  <Badge variant="primary" size="sm">
                    {p.seatClass}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {booking.payment && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4 text-gray-500" />
            <h4 className="font-semibold text-gray-900">Payment</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Amount</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(booking.payment.amount, booking.payment.currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Method</span>
              <span className="text-gray-900 capitalize">{booking.payment.method}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <Badge variant={
                booking.payment.status === 'completed' ? 'success' :
                booking.payment.status === 'failed' ? 'danger' : 'warning'
              } size="sm">
                {booking.payment.status}
              </Badge>
            </div>
            {booking.payment.cardLastFour && (
              <div className="flex justify-between">
                <span className="text-gray-500">Card ending in</span>
                <span className="text-gray-900">**** {booking.payment.cardLastFour}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Total Amount</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(booking.totalAmount, booking.currency)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" /> Invoice
          </Button>
          {canCancel && onCancel && (
            <Button variant="danger" size="sm" onClick={onCancel}>
              <XCircle className="w-4 h-4 mr-1" /> Cancel Booking
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
