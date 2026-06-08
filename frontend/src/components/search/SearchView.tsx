'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SearchFilters from '@/components/search/SearchFilters';
import SearchResults from '@/components/search/SearchResults';
import Spinner from '@/components/ui/Spinner';
import { get } from '@/lib/api';
import type { SearchFilters as SearchFiltersType, PaginatedApiResponse, Flight, Hotel, Tour } from '@/types';
import { Search } from 'lucide-react';

interface SearchViewProps {
  type: 'flight' | 'hotel' | 'tour';
}

export default function SearchView({ type }: SearchViewProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [filters, setFilters] = useState<SearchFiltersType>({});
  const [results, setResults] = useState<PaginatedApiResponse<Flight> | PaginatedApiResponse<Hotel> | PaginatedApiResponse<Tour> | null>(null);
  const [loading, setLoading] = useState(true);

  const camelToSnake = (key: string): string => {
    const map: Record<string, string> = {
      departureCity: 'departure_city',
      arrivalCity: 'arrival_city',
      departureDate: 'date',
      seatClass: 'seat_class',
      minPrice: 'min_price',
      maxPrice: 'max_price',
      destination: 'search',
      checkIn: 'check_in',
      checkOut: 'check_out',
      guests: 'guests',
      starRating: 'min_rating',
      minPricePerNight: 'min_price_per_night',
      maxPricePerNight: 'max_price',
      tourDestination: 'search',
      minDuration: 'min_duration',
      maxDuration: 'max_duration',
      tourMinPrice: 'min_price',
      tourMaxPrice: 'max_price',
    };
    return map[key] || key;
  };

  const doFetch = useCallback(async (f: SearchFiltersType, page: string) => {
    setLoading(true);
    try {
      const apiFilters: Record<string, unknown> = {};
      Object.entries(f).forEach(([key, value]) => {
        if (key !== 'page' && value !== undefined && value !== '') {
          apiFilters[camelToSnake(key)] = value;
        }
      });
      const params = { ...apiFilters, page, limit: 10 };
      const endpoint = type === 'flight' ? '/flights' : type === 'hotel' ? '/hotels' : '/tours';
      const data = await get<PaginatedApiResponse<Flight> | PaginatedApiResponse<Hotel> | PaginatedApiResponse<Tour>>(endpoint, params);
      setResults(data);
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    const f: SearchFiltersType = {};
    searchParams.forEach((value, key) => {
      if (key !== 'type') (f as Record<string, string>)[key] = value;
    });
    setFilters(f);
    doFetch(f, searchParams.get('page') || '1');
  }, [searchParams, doFetch]);

  const handleFilterChange = (newFilters: SearchFiltersType) => {
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && key !== 'page') {
        params.set(key, String(value));
      }
    });
    const prefix = type === 'flight' ? '/flights' : type === 'hotel' ? '/hotels' : '/tours';
    router.replace(`${prefix}?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    const prefix = type === 'flight' ? '/flights' : type === 'hotel' ? '/hotels' : '/tours';
    router.replace(`${prefix}?${params.toString()}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Search className="w-5 h-5 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900 capitalize">{type} Search</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-72 flex-shrink-0">
          <SearchFilters filters={filters} onChange={handleFilterChange} type={type} />
        </div>
        <div className="flex-1 min-w-0">
          <SearchResults
            results={results}
            type={type}
            loading={loading}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
}
