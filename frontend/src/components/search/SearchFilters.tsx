'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { SearchFilters as SearchFiltersType } from '@/types';
import { SlidersHorizontal, X } from 'lucide-react';

interface SearchFiltersProps {
  filters: SearchFiltersType;
  onChange: (filters: SearchFiltersType) => void;
  type: 'flight' | 'hotel' | 'tour';
}

export default function SearchFilters({ filters, onChange, type }: SearchFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (key: keyof SearchFiltersType, value: string | number | undefined) => {
    onChange({ ...filters, [key]: value || undefined });
  };

  const handleReset = () => {
    onChange({});
  };

  const seatClassOptions = [
    { value: 'economy', label: 'Economy' },
    { value: 'business', label: 'Business' },
    { value: 'first', label: 'First Class' },
  ];

  const starOptions = [
    { value: '1', label: '1 Star' },
    { value: '2', label: '2 Stars' },
    { value: '3', label: '3 Stars' },
    { value: '4', label: '4 Stars' },
    { value: '5', label: '5 Stars' },
  ];

  const content = (
    <div className="space-y-4">
      {type === 'flight' && (
        <>
          <Input
            label="From"
            placeholder="Departure city"
            value={filters.departureCity || ''}
            onChange={(e) => handleChange('departureCity', e.target.value)}
          />
          <Input
            label="To"
            placeholder="Arrival city"
            value={filters.arrivalCity || ''}
            onChange={(e) => handleChange('arrivalCity', e.target.value)}
          />
          <Input
            label="Departure Date"
            type="date"
            value={filters.departureDate || ''}
            onChange={(e) => handleChange('departureDate', e.target.value)}
          />
          <Select
            label="Seat Class"
            options={seatClassOptions}
            placeholder="All classes"
            value={filters.seatClass || ''}
            onChange={(e) => handleChange('seatClass', e.target.value || undefined)}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Min Price"
              type="number"
              placeholder="$0"
              value={filters.minPrice || ''}
              onChange={(e) => handleChange('minPrice', e.target.value ? Number(e.target.value) : undefined)}
            />
            <Input
              label="Max Price"
              type="number"
              placeholder="$9999"
              value={filters.maxPrice || ''}
              onChange={(e) => handleChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
        </>
      )}

      {type === 'hotel' && (
        <>
          <Input
            label="Destination"
            placeholder="City or hotel name"
            value={filters.destination || ''}
            onChange={(e) => handleChange('destination', e.target.value)}
          />
          <Input
            label="Check-in"
            type="date"
            value={filters.checkIn || ''}
            onChange={(e) => handleChange('checkIn', e.target.value)}
          />
          <Input
            label="Check-out"
            type="date"
            value={filters.checkOut || ''}
            onChange={(e) => handleChange('checkOut', e.target.value)}
          />
          <Input
            label="Guests"
            type="number"
            min={1}
            placeholder="1"
            value={filters.guests || ''}
            onChange={(e) => handleChange('guests', e.target.value ? Number(e.target.value) : undefined)}
          />
          <Select
            label="Star Rating"
            options={starOptions}
            placeholder="Any rating"
            value={filters.starRating?.toString() || ''}
            onChange={(e) => handleChange('starRating', e.target.value ? Number(e.target.value) : undefined)}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Min Price/Night"
              type="number"
              placeholder="$0"
              value={filters.minPricePerNight || ''}
              onChange={(e) => handleChange('minPricePerNight', e.target.value ? Number(e.target.value) : undefined)}
            />
            <Input
              label="Max Price/Night"
              type="number"
              placeholder="$9999"
              value={filters.maxPricePerNight || ''}
              onChange={(e) => handleChange('maxPricePerNight', e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
        </>
      )}

      {type === 'tour' && (
        <>
          <Input
            label="Destination"
            placeholder="Tour destination"
            value={filters.tourDestination || ''}
            onChange={(e) => handleChange('tourDestination', e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Min Duration (days)"
              type="number"
              placeholder="1"
              value={filters.minDuration || ''}
              onChange={(e) => handleChange('minDuration', e.target.value ? Number(e.target.value) : undefined)}
            />
            <Input
              label="Max Duration (days)"
              type="number"
              placeholder="30"
              value={filters.maxDuration || ''}
              onChange={(e) => handleChange('maxDuration', e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Min Price"
              type="number"
              placeholder="$0"
              value={filters.tourMinPrice || ''}
              onChange={(e) => handleChange('tourMinPrice', e.target.value ? Number(e.target.value) : undefined)}
            />
            <Input
              label="Max Price"
              type="number"
              placeholder="$9999"
              value={filters.tourMaxPrice || ''}
              onChange={(e) => handleChange('tourMaxPrice', e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
        </>
      )}

      <div className="flex gap-2 pt-2">
        <Button variant="primary" onClick={() => onChange(filters)} fullWidth>
          Apply Filters
        </Button>
        <Button variant="outline" onClick={handleReset}>
          Reset
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 mb-4"
      >
        <SlidersHorizontal className="w-4 h-4" />
        Filters
      </button>

      <div className="hidden md:block bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
        {content}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
              <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            {content}
          </div>
        </div>
      )}
    </>
  );
}
