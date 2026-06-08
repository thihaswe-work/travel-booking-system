'use client';

import React, { useState, useMemo } from 'react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import type { Flight, BookingPassenger } from '@/types';
import { Plus, Minus, User } from 'lucide-react';

interface FlightBookingFormProps {
  flight: Flight;
  onComplete: (passengers: BookingPassenger[], seatClass: string) => void;
}

interface PassengerInput {
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
}

const docTypeOptions = [
  { value: 'passport', label: 'Passport' },
  { value: 'id', label: 'ID Card' },
];

const seatClassOptions = [
  { value: 'economy', label: 'Economy' },
  { value: 'business', label: 'Business' },
  { value: 'first', label: 'First Class' },
];

export default function FlightBookingForm({ flight, onComplete }: FlightBookingFormProps) {
  const [passengerCount, setPassengerCount] = useState(1);
  const [seatClass, setSeatClass] = useState('economy');
  const [passengers, setPassengers] = useState<PassengerInput[]>([
    { firstName: '', lastName: '', documentType: 'passport', documentNumber: '' },
  ]);

  const getPriceForClass = (seatClass: string): number => {
    return flight.basePrice;
  };

  const totalPrice = useMemo(
    () => getPriceForClass(seatClass) * passengerCount,
    [seatClass, passengerCount]
  );

  const updatePassenger = (index: number, field: keyof PassengerInput, value: string) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    setPassengers(updated);
  };

  const addPassenger = () => {
    if (passengerCount < 9) {
      setPassengerCount(passengerCount + 1);
      setPassengers([
        ...passengers,
        { firstName: '', lastName: '', documentType: 'passport', documentNumber: '' },
      ]);
    }
  };

  const removePassenger = () => {
    if (passengerCount > 1) {
      setPassengerCount(passengerCount - 1);
      setPassengers(passengers.slice(0, -1));
    }
  };

  const validate = (): boolean => {
    return passengers.every(
      (p) => p.firstName.trim() && p.lastName.trim() && p.documentNumber.trim()
    );
  };

  const handleSubmit = () => {
    if (!validate()) {
      alert('Please fill in all passenger details');
      return;
    }
    const bookingPassengers: BookingPassenger[] = passengers.map((p, i) => ({
      id: `temp-${i}`,
      firstName: p.firstName,
      lastName: p.lastName,
      documentType: p.documentType,
      documentNumber: p.documentNumber,
      seatClass,
    }));
    onComplete(bookingPassengers, seatClass);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Passengers</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={removePassenger}
            disabled={passengerCount <= 1}
          >
            <Minus className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-8 text-center">
            {passengerCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={addPassenger}
            disabled={passengerCount >= 9}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div>
        <Select
          label="Seat Class"
          options={seatClassOptions.map((o) => ({
            ...o,
            label: `${o.label} (${formatCurrency(getPriceForClass(o.value))})`,
          }))}
          value={seatClass}
          onChange={(e) => setSeatClass(e.target.value)}
        />
      </div>

      {passengers.map((passenger, index) => (
        <div
          key={index}
          className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Passenger {index + 1}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="First Name"
              placeholder="John"
              value={passenger.firstName}
              onChange={(e) => updatePassenger(index, 'firstName', e.target.value)}
            />
            <Input
              label="Last Name"
              placeholder="Doe"
              value={passenger.lastName}
              onChange={(e) => updatePassenger(index, 'lastName', e.target.value)}
            />
            <Select
              label="Document Type"
              options={docTypeOptions}
              value={passenger.documentType}
              onChange={(e) => updatePassenger(index, 'documentType', e.target.value)}
            />
            <Input
              label="Document Number"
              placeholder="AB123456"
              value={passenger.documentNumber}
              onChange={(e) => updatePassenger(index, 'documentNumber', e.target.value)}
            />
          </div>
        </div>
      ))}

      <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4 border border-primary-200 dark:border-primary-800">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {formatCurrency(getPriceForClass(seatClass))} x {passengerCount} passenger{passengerCount > 1 ? 's' : ''}
          </span>
          <span className="text-xl font-bold text-primary-700 dark:text-primary-300">
            {formatCurrency(totalPrice)}
          </span>
        </div>
      </div>

      <Button variant="primary" size="lg" fullWidth onClick={handleSubmit}>
        Continue to Booking
      </Button>
    </div>
  );
}
