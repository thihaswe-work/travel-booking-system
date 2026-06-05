'use client';

import React, { useState, useEffect } from 'react';
import { get } from '@/lib/api';
import AnalyticsCards from '@/components/admin/AnalyticsCards';
import RevenueChart from '@/components/admin/RevenueChart';
import BookingsTable from '@/components/admin/BookingsTable';
import type { AnalyticsOverview, Booking } from '@/types';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [revenueData, setRevenueData] = useState<{ date: string; amount: number }[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewData, revenue, bookings] = await Promise.all([
          get<AnalyticsOverview>('/admin/analytics/overview'),
          get<{ date: string; amount: number }[]>('/admin/analytics/revenue'),
          get<{ data: Booking[] }>('/admin/bookings?limit=5'),
        ]);
        setOverview(overviewData);
        setRevenueData(revenue);
        setRecentBookings(bookings.data);
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <AnalyticsCards overview={overview} loading={loading} />
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
