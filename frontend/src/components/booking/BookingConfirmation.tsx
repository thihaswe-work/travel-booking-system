'use client';

import React from 'react';
import Link from 'next/link';
import { formatCurrency, formatDateTime, getStatusColor } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import type { Booking } from '@/types';
import { CheckCircle, ArrowRight, Home } from 'lucide-react';

interface BookingConfirmationProps {
  booking: Booking;
}

export default function BookingConfirmation({ booking }: BookingConfirmationProps) {
  return (
    <div className="max-w-lg mx-auto text-center">
      <div className="mb-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Booking Confirmed!</h1>
        <p className="text-gray-500 mt-1">Your booking has been successfully confirmed.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-1">Booking Reference</p>
          <p className="text-2xl font-bold text-primary-600 tracking-wider">
            {booking.referenceId}
          </p>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-t border-gray-100">
            <span className="text-gray-500">Type</span>
            <span className="font-medium text-gray-900 capitalize">{booking.bookingType}</span>
          </div>
          {booking.totalAmount && (
            <div className="flex justify-between py-2 border-t border-gray-100">
              <span className="text-gray-500">Total Paid</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(booking.totalAmount, booking.currency)}
              </span>
            </div>
          )}
          {booking.payment?.status && (
            <div className="flex justify-between py-2 border-t border-gray-100">
              <span className="text-gray-500">Payment Status</span>
              <Badge
                variant={
                  booking.payment.status === 'completed'
                    ? 'success'
                    : booking.payment.status === 'failed'
                    ? 'danger'
                    : 'warning'
                }
                size="sm"
              >
                {booking.payment.status}
              </Badge>
            </div>
          )}
          <div className="flex justify-between py-2 border-t border-gray-100">
            <span className="text-gray-500">Booked On</span>
            <span className="font-medium text-gray-900">{formatDateTime(booking.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 mb-6">
        <p className="text-sm text-blue-800">
          A confirmation email has been sent to your registered email address.
          Please keep your booking reference for future inquiries.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/profile/bookings">
          <Button variant="primary" size="md">
            View My Bookings
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
        <Link href="/">
          <Button variant="outline" size="md">
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
