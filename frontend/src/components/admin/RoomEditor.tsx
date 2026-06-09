'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export interface RoomEntry {
  roomType: string;
  pricePerNight: number;
  maxGuests: number;
  totalRooms: number;
  availableRooms: number;
}

interface RoomEditorProps {
  rooms: RoomEntry[];
  onChange: (rooms: RoomEntry[]) => void;
}

const emptyRoom = (): RoomEntry => ({
  roomType: '',
  pricePerNight: 0,
  maxGuests: 1,
  totalRooms: 1,
  availableRooms: 1,
});

export default function RoomEditor({ rooms, onChange }: RoomEditorProps) {
  const addRoom = () => onChange([...rooms, emptyRoom()]);

  const removeRoom = (i: number) => {
    const next = rooms.filter((_, idx) => idx !== i);
    onChange(next);
  };

  const updateRoom = (i: number, field: keyof RoomEntry, value: string) => {
    const next = rooms.map((r, idx) =>
      idx === i
        ? { ...r, [field]: field === 'roomType' ? value : Number(value) || 0 }
        : r,
    );
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">Room Types</label>
        <Button type="button" variant="outline" size="sm" onClick={addRoom}>
          <Plus className="w-4 h-4 mr-1" /> Add Room
        </Button>
      </div>
      {rooms.length === 0 && (
        <p className="text-sm text-gray-400 italic">No rooms added yet. Click "Add Room" to add one.</p>
      )}
      {rooms.map((room, i) => (
        <div key={i} className="p-3 border border-gray-200 rounded-lg space-y-3 relative">
          <button
            type="button"
            onClick={() => removeRoom(i)}
            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <div className="grid grid-cols-2 gap-3 pr-8">
            <Input
              label="Room Type"
              placeholder="e.g. Deluxe, Standard"
              value={room.roomType}
              onChange={(e) => updateRoom(i, 'roomType', e.target.value)}
            />
            <Input
              label="Price/Night"
              type="number"
              value={String(room.pricePerNight)}
              onChange={(e) => updateRoom(i, 'pricePerNight', e.target.value)}
            />
            <Input
              label="Max Guests"
              type="number"
              value={String(room.maxGuests)}
              onChange={(e) => updateRoom(i, 'maxGuests', e.target.value)}
            />
            <Input
              label="Total Rooms"
              type="number"
              value={String(room.totalRooms)}
              onChange={(e) => updateRoom(i, 'totalRooms', e.target.value)}
            />
            <Input
              label="Available Rooms"
              type="number"
              value={String(room.availableRooms)}
              onChange={(e) => updateRoom(i, 'availableRooms', e.target.value)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
