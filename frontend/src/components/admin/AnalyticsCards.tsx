'use client';

import React from 'react';
import { formatCurrency } from '@/lib/utils';
import type { AnalyticsOverview } from '@/types';
import { BookOpen, DollarSign, Users, CalendarCheck, TrendingUp, TrendingDown } from 'lucide-react';

interface AnalyticsCardsProps {
  overview: AnalyticsOverview | null;
  loading?: boolean;
}

function StatCard({
  icon,
  label,
  value,
  trend,
  trendLabel,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: number;
  trendLabel: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <div className={`flex items-center gap-0.5 text-xs font-medium ${
          trend >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {trend >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          {Math.abs(trend).toFixed(1)}%
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

export default function AnalyticsCards({ overview, loading }: AnalyticsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
            <div className="w-10 h-10 bg-gray-200 rounded-lg" />
            <div className="mt-3 h-7 bg-gray-200 rounded w-20" />
            <div className="mt-1 h-4 bg-gray-200 rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (!overview) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={<BookOpen className="w-5 h-5 text-white" />}
        label="Total Bookings"
        value={overview.totalBookings.toLocaleString()}
        trend={overview.bookingTrend}
        trendLabel="vs last month"
        color="bg-blue-500"
      />
      <StatCard
        icon={<DollarSign className="w-5 h-5 text-white" />}
        label="Total Revenue"
        value={formatCurrency(overview.totalRevenue)}
        trend={overview.revenueTrend}
        trendLabel="vs last month"
        color="bg-green-500"
      />
      <StatCard
        icon={<Users className="w-5 h-5 text-white" />}
        label="Total Users"
        value={overview.totalUsers.toLocaleString()}
        trend={overview.userTrend}
        trendLabel="vs last month"
        color="bg-purple-500"
      />
      <StatCard
        icon={<CalendarCheck className="w-5 h-5 text-white" />}
        label="Today's Bookings"
        value={overview.todayBookings.toString()}
        trend={overview.todayBookingTrend}
        trendLabel="vs yesterday"
        color="bg-amber-500"
      />
    </div>
  );
}
