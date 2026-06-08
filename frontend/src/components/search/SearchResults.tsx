'use client';

import React from 'react';
import FlightCard from './FlightCard';
import HotelCard from './HotelCard';
import TourCard from './TourCard';
import Pagination from '@/components/ui/Pagination';
import Spinner from '@/components/ui/Spinner';
import type { Flight, Hotel, Tour, PaginatedApiResponse } from '@/types';
import { SearchX } from 'lucide-react';

interface SearchResultsProps {
  results: PaginatedApiResponse<Flight> | PaginatedApiResponse<Hotel> | PaginatedApiResponse<Tour> | null;
  type: 'flight' | 'hotel' | 'tour';
  loading: boolean;
  onPageChange: (page: number) => void;
  emptyMessage?: string;
}

export default function SearchResults({
  results,
  type,
  loading,
  onPageChange,
  emptyMessage,
}: SearchResultsProps) {
  if (loading && !results) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse"
          >
            <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!results || results.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <SearchX className="w-16 h-16 mb-4" />
        <p className="text-lg font-medium text-gray-600">
          {emptyMessage || `No ${type}s found`}
        </p>
        <p className="text-sm mt-1">Try adjusting your search filters</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        {results.pagination.total} {type}{results.pagination.total !== 1 ? 's' : ''} found
      </p>
      <div className={`space-y-4 ${loading ? 'opacity-50 pointer-events-none transition-opacity' : ''}`}>
        {type === 'flight' &&
          (results as PaginatedApiResponse<Flight>).data.map((flight) => (
            <FlightCard key={flight.id} flight={flight} />
          ))}
        {type === 'hotel' &&
          (results as PaginatedApiResponse<Hotel>).data.map((hotel) => (
            <HotelCard key={hotel.id} hotel={hotel} />
          ))}
        {type === 'tour' &&
          (results as PaginatedApiResponse<Tour>).data.map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
      </div>
      <Pagination
        page={results.pagination.page}
        totalPages={results.pagination.totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}
