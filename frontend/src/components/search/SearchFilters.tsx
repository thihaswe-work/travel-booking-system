'use client';

import React, { useState, useEffect, useRef } from 'react';
import Input from '@/components/ui/Input';
import AutocompleteInput from '@/components/ui/AutocompleteInput';
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
  const [local, setLocal] = useState<SearchFiltersType>(filters);
  const initial = useRef(filters);

  useEffect(() => {
    if (JSON.stringify(filters) !== JSON.stringify(initial.current)) {
      setLocal(filters);
      initial.current = filters;
    }
  }, [filters]);

  const update = (key: keyof SearchFiltersType, value: string | number | undefined) => {
    setLocal((prev) => ({ ...prev, [key]: value || undefined }));
  };

  const handleApply = () => {
    onChange(local);
  };

  const handleReset = () => {
    const empty: SearchFiltersType = {};
    setLocal(empty);
    onChange(empty);
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
          <AutocompleteInput
            label="From"
            placeholder="Departure city"
            value={local.departureCity || ''}
            onChange={(v) => update('departureCity', v)}
            endpoint="/flights"
            field="departureCity"
            apiParam="departure_city"
          />
          <AutocompleteInput
            label="To"
            placeholder="Arrival city"
            value={local.arrivalCity || ''}
            onChange={(v) => update('arrivalCity', v)}
            endpoint="/flights"
            field="arrivalCity"
            apiParam="arrival_city"
          />
          <Input
            label="Departure Date"
            type="date"
            value={local.departureDate || ''}
            onChange={(e) => update('departureDate', e.target.value)}
          />
          <Select
            label="Seat Class"
            options={seatClassOptions}
            placeholder="All classes"
            value={local.seatClass || ''}
            onChange={(e) => update('seatClass', e.target.value || undefined)}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Min Price"
              type="number"
              placeholder="$0"
              value={local.minPrice || ''}
              onChange={(e) => update('minPrice', e.target.value ? Number(e.target.value) : undefined)}
            />
            <Input
              label="Max Price"
              type="number"
              placeholder="$9999"
              value={local.maxPrice || ''}
              onChange={(e) => update('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
        </>
      )}

      {type === 'hotel' && (
        <>
          <AutocompleteInput
            label="Destination"
            placeholder="City or hotel name"
            value={local.destination || ''}
            onChange={(v) => update('destination', v)}
            endpoint="/hotels"
            field="name"
            apiParam="search"
          />
          <Input
            label="Check-in"
            type="date"
            value={local.checkIn || ''}
            onChange={(e) => update('checkIn', e.target.value)}
          />
          <Input
            label="Check-out"
            type="date"
            value={local.checkOut || ''}
            onChange={(e) => update('checkOut', e.target.value)}
          />
          <Input
            label="Guests"
            type="number"
            min={1}
            placeholder="1"
            value={local.guests || ''}
            onChange={(e) => update('guests', e.target.value ? Number(e.target.value) : undefined)}
          />
          <Select
            label="Star Rating"
            options={starOptions}
            placeholder="Any rating"
            value={local.starRating?.toString() || ''}
            onChange={(e) => update('starRating', e.target.value ? Number(e.target.value) : undefined)}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Min Price/Night"
              type="number"
              placeholder="$0"
              value={local.minPricePerNight || ''}
              onChange={(e) => update('minPricePerNight', e.target.value ? Number(e.target.value) : undefined)}
            />
            <Input
              label="Max Price/Night"
              type="number"
              placeholder="$9999"
              value={local.maxPricePerNight || ''}
              onChange={(e) => update('maxPricePerNight', e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
        </>
      )}

      {type === 'tour' && (
        <>
          <AutocompleteInput
            label="Destination"
            placeholder="Tour destination"
            value={local.tourDestination || ''}
            onChange={(v) => update('tourDestination', v)}
            endpoint="/tours"
            field="name"
            apiParam="search"
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Min Duration (days)"
              type="number"
              placeholder="1"
              value={local.minDuration || ''}
              onChange={(e) => update('minDuration', e.target.value ? Number(e.target.value) : undefined)}
            />
            <Input
              label="Max Duration (days)"
              type="number"
              placeholder="30"
              value={local.maxDuration || ''}
              onChange={(e) => update('maxDuration', e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Min Price"
              type="number"
              placeholder="$0"
              value={local.tourMinPrice || ''}
              onChange={(e) => update('tourMinPrice', e.target.value ? Number(e.target.value) : undefined)}
            />
            <Input
              label="Max Price"
              type="number"
              placeholder="$9999"
              value={local.tourMaxPrice || ''}
              onChange={(e) => update('tourMaxPrice', e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
        </>
      )}

      <div className="flex gap-2 pt-2">
        <Button variant="primary" onClick={handleApply} fullWidth>
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
