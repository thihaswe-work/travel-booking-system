'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

export interface SeatEntry {
  seatClass: 'economy' | 'business' | 'first';
  price: number;
  availableSeats: number;
  totalSeats: number;
}

interface SeatEditorProps {
  seats: SeatEntry[];
  onChange: (seats: SeatEntry[]) => void;
}

const emptySeat = (): SeatEntry => ({
  seatClass: 'economy',
  price: 0,
  availableSeats: 1,
  totalSeats: 1,
});

const seatClassOptions = [
  { value: 'economy', label: 'Economy' },
  { value: 'business', label: 'Business' },
  { value: 'first', label: 'First' },
];

export default function SeatEditor({ seats, onChange }: SeatEditorProps) {
  const addSeat = () => onChange([...seats, emptySeat()]);

  const removeSeat = (i: number) => {
    const next = seats.filter((_, idx) => idx !== i);
    onChange(next);
  };

  const updateSeat = (i: number, field: keyof SeatEntry, value: string) => {
    const next = seats.map((s, idx) =>
      idx === i
        ? { ...s, [field]: field === 'seatClass' ? value : Number(value) || 0 }
        : s,
    );
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">Seat Classes</label>
        <Button type="button" variant="outline" size="sm" onClick={addSeat}>
          <Plus className="w-4 h-4 mr-1" /> Add Seat Class
        </Button>
      </div>
      {seats.length === 0 && (
        <p className="text-sm text-gray-400 italic">No seat classes added yet. Click &quot;Add Seat Class&quot; to add one.</p>
      )}
      {seats.map((seat, i) => (
        <div key={i} className="p-3 border border-gray-200 rounded-lg space-y-3 relative">
          <button
            type="button"
            onClick={() => removeSeat(i)}
            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <div className="grid grid-cols-2 gap-3 pr-8">
            <Select
              label="Seat Class"
              options={seatClassOptions}
              value={seat.seatClass}
              onChange={(e) => updateSeat(i, 'seatClass', e.target.value)}
            />
            <Input
              label="Price"
              type="number"
              value={String(seat.price)}
              onChange={(e) => updateSeat(i, 'price', e.target.value)}
            />
            <Input
              label="Total Seats"
              type="number"
              value={String(seat.totalSeats)}
              onChange={(e) => updateSeat(i, 'totalSeats', e.target.value)}
            />
            <Input
              label="Available Seats"
              type="number"
              value={String(seat.availableSeats)}
              onChange={(e) => updateSeat(i, 'availableSeats', e.target.value)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
