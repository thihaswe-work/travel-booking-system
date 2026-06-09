'use client';

import React, { useState, useEffect } from 'react';
import { get } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import AnalyticsCards from '@/components/admin/AnalyticsCards';
import RevenueChart from '@/components/admin/RevenueChart';
import BookingsTable from '@/components/admin/BookingsTable';
import type { AnalyticsOverview, Booking, ApiResponse } from '@/types';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function PendingCard({ count, label, href, color }: { count: number; label: string; href: string; color: string }) {
  return (
    <Link href={href} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <span className="text-white font-bold text-lg">{count}</span>
        </div>
        <div>
          <p className="text-sm text-gray-500">Pending</p>
          <p className="font-semibold text-gray-900">{label}</p>
        </div>
      </div>
    </Link>
  );
}

export default function AdminDashboard() {
  const { isAdmin, user } = useAuth();
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [revenueData, setRevenueData] = useState<{ date: string; amount: number }[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isAdmin) {
          const [overviewRes, revenueRes] = await Promise.all([
            get<ApiResponse<AnalyticsOverview>>('/admin/analytics/overview'),
            get<ApiResponse<{ date: string; amount: number }[]>>('/admin/analytics/revenue'),
          ]);
          setOverview(overviewRes.data);
          setRevenueData(revenueRes.data);
        }
        const bookings = await get<{ data: Booking[] }>('/bookings', { limit: 5, page: 1 });
        setRecentBookings(bookings.data);
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin]);

  const hasPending = overview && (overview.pendingFlights > 0 || overview.pendingHotels > 0 || overview.pendingTours > 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <AnalyticsCards overview={overview} loading={loading} />
      {overview && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Pending Approvals {hasPending && <span className="text-sm font-normal text-gray-500">— items created by agents awaiting activation</span>}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <PendingCard count={overview.pendingFlights} label="Flights" href="/admin/flights" color="bg-blue-500" />
            <PendingCard count={overview.pendingHotels} label="Hotels" href="/admin/hotels" color="bg-green-500" />
            <PendingCard count={overview.pendingTours} label="Tours" href="/admin/tours" color="bg-purple-500" />
          </div>
        </div>
      )}
      <RevenueChart data={revenueData} loading={loading} />
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Bookings</h2>
        <BookingsTable
          bookings={recentBookings}
          onView={(booking) => router.push(`/booking/${booking.id}`)}
          loading={loading}
        />
      </div>
    </div>
  );
}
