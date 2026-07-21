'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { get } from '@/lib/api';
import { formatCurrency, formatDate, getBookingTypeLabel } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Pagination from '@/components/ui/Pagination';
import type { Booking, PaginatedApiResponse } from '@/types';
import { BookOpen, Eye } from 'lucide-react';

const statusTabs = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function MyBookingsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<PaginatedApiResponse<Booking> | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      const data = await get<PaginatedApiResponse<Booking>>('/bookings', params);
      setBookings(data);
    } catch {
      setBookings(null);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) return;
    fetchBookings();
  }, [fetchBookings, isAuthenticated, authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-sm text-gray-500">View and manage your bookings</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setStatusFilter(tab.value);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              statusFilter === tab.value
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : bookings && bookings.data.length > 0 ? (
        <div className="space-y-4">
          {bookings.data.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-xl border border-gray-200 p-5 card-hover"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={
                      booking.bookingType === 'flight' ? 'info' :
                      booking.bookingType === 'hotel' ? 'primary' : 'success'
                    } size="sm">
                      {getBookingTypeLabel(booking.bookingType)}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      Ref: {booking.referenceId}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {booking.details?.[0]?.itemType === 'flight'
                      ? 'Flight Booking'
                      : booking.details?.[0]?.itemType === 'hotel'
                      ? 'Hotel Booking'
                      : booking.details?.[0]?.itemType === 'tour'
                      ? 'Tour Booking'
                      : 'Booking'}
                  </p>
                </div>
                <Badge variant={
                  booking.status === 'confirmed' ? 'success' :
                  booking.status === 'cancelled' ? 'danger' :
                  booking.status === 'completed' ? 'info' : 'warning'
                } size="sm">
                  {booking.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold text-primary-600">
                    {formatCurrency(booking.totalAmount, booking.currency)}
                  </p>
                  <p className="text-xs text-gray-500">{formatDate(booking.createdAt)}</p>
                </div>
                <Link href={`/booking/${booking.id}`}>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-1" /> View Details
                  </Button>
                </Link>
              </div>
            </div>
          ))}
          {bookings.pagination.totalPages > 1 && (
            <Pagination
              page={bookings.pagination.page}
              totalPages={bookings.pagination.totalPages}
              onPageChange={setPage}
            />
          )}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium text-gray-600">No bookings found</p>
          <p className="text-sm mt-1">Start by searching for flights, hotels, or tours</p>
          <Link href="/">
            <Button variant="primary" size="md" className="mt-4">
              Start Exploring
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
