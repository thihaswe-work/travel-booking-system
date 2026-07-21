'use client';

import React from 'react';
import { formatCurrency, formatDate, getBookingTypeLabel } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import type { Booking } from '@/types';
import { Eye, XCircle } from 'lucide-react';

interface BookingsTableProps {
  bookings: Booking[];
  onView: (booking: Booking) => void;
  onStatusChange?: (booking: Booking, status: string) => void;
  loading?: boolean;
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded" />
        </td>
      ))}
    </tr>
  );
}

export default function BookingsTable({
  bookings,
  onView,
  onStatusChange,
  loading,
}: BookingsTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Reference', 'Customer', 'Type', 'Status', 'Amount', 'Date', 'Actions'].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonRow key={i} />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
        No bookings found
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Reference', 'Customer', 'Type', 'Status', 'Amount', 'Date', 'Actions'].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {bookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {booking.referenceId}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {booking.userId?.slice(0, 8) || 'N/A'}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      booking.bookingType === 'flight'
                        ? 'info'
                        : booking.bookingType === 'hotel'
                        ? 'primary'
                        : 'success'
                    }
                    size="sm"
                  >
                    {getBookingTypeLabel(booking.bookingType)}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      booking.status === 'confirmed'
                        ? 'success'
                        : booking.status === 'cancelled'
                        ? 'danger'
                        : booking.status === 'completed'
                        ? 'info'
                        : 'warning'
                    }
                    size="sm"
                  >
                    {booking.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {formatCurrency(booking.totalAmount, booking.currency)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {formatDate(booking.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(booking)}
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {(booking.status === 'pending' || booking.status === 'confirmed') &&
                      onStatusChange && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onStatusChange(booking, 'cancelled')}
                          title="Cancel booking"
                          className="text-red-500 hover:text-red-700"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
