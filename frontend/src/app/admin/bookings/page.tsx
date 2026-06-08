'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { get, patch, getApiError } from '@/lib/api';
import BookingsTable from '@/components/admin/BookingsTable';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import BookingSummary from '@/components/booking/BookingSummary';
import type { Booking, PaginatedApiResponse } from '@/types';
import toast from 'react-hot-toast';
import { BookOpen } from 'lucide-react';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<PaginatedApiResponse<Booking> | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.bookingType = typeFilter;
      const data = await get<PaginatedApiResponse<Booking>>('/admin/bookings', params);
      setBookings(data);
    } catch {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, typeFilter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleStatusChange = async (booking: Booking, status: string) => {
    try {
      await patch(`/bookings/${booking.id}/status`, { status });
      toast.success(`Booking ${status}`);
      fetchBookings();
      if (viewBooking?.id === booking.id) {
        const res = await get<import('@/types').ApiResponse<Booking>>(`/bookings/${booking.id}`); const updated = res.data;
        setViewBooking(updated);
      }
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  const handleView = (booking: Booking) => {
    setViewBooking(booking);
    setViewModalOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="w-full sm:w-48">
          <Select
            options={[
              { value: '', label: 'All Status' },
              { value: 'pending', label: 'Pending' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'cancelled', label: 'Cancelled' },
              { value: 'completed', label: 'Completed' },
            ]}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            options={[
              { value: '', label: 'All Types' },
              { value: 'flight', label: 'Flight' },
              { value: 'hotel', label: 'Hotel' },
              { value: 'tour', label: 'Tour' },
            ]}
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <BookingsTable
        bookings={bookings?.data || []}
        onView={handleView}
        onStatusChange={handleStatusChange}
        loading={loading}
      />

      {bookings && bookings.pagination.totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <span className="flex items-center text-sm text-gray-500 px-3">
              Page {bookings.pagination.page} of {bookings.pagination.totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={page >= bookings.pagination.totalPages} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      <Modal
        isOpen={viewModalOpen}
        onClose={() => { setViewModalOpen(false); setViewBooking(null); }}
        title="Booking Details"
        size="xl"
      >
        {viewBooking && (
          <BookingSummary
            booking={viewBooking}
            onCancel={() => handleStatusChange(viewBooking, 'cancelled')}
          />
        )}
      </Modal>
    </div>
  );
}
