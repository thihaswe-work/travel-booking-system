'use client';

import React, { useState } from 'react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import { CreditCard, Banknote, Lock } from 'lucide-react';

interface PaymentFormProps {
  amount: number;
  currency?: string;
  onProcess: (method: string, cardLastFour?: string) => void;
}

const paymentMethods = [
  { value: 'card', label: 'Credit / Debit Card' },
  { value: 'cash_on_arrival', label: 'Cash on Arrival' },
];

export default function PaymentForm({ amount, currency = 'USD', onProcess }: PaymentFormProps) {
  const [method, setMethod] = useState('card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleProcess = async () => {
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1500));
    const lastFour = method === 'card' ? cardNumber.slice(-4) : undefined;
    onProcess(method, lastFour);
    setProcessing(false);
  };

  const isValidCard =
    cardNumber.replace(/\s/g, '').length >= 13 &&
    expiry.length === 5 &&
    cvv.length >= 3;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>

        <div className="space-y-3">
          {paymentMethods.map((pm) => (
            <label
              key={pm.value}
              className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                method === pm.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={pm.value}
                checked={method === pm.value}
                onChange={() => setMethod(pm.value)}
                className="text-primary-600"
              />
              {pm.value === 'card' ? (
                <CreditCard className="w-5 h-5 text-gray-500" />
              ) : (
                <Banknote className="w-5 h-5 text-gray-500" />
              )}
              <span className="text-sm font-medium text-gray-900">{pm.label}</span>
            </label>
          ))}
        </div>

        {method === 'card' && (
          <div className="mt-4 space-y-3">
            <Input
              label="Cardholder Name"
              placeholder="John Doe"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
            />
            <Input
              label="Card Number"
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChange={(e) =>
                setCardNumber(
                  e.target.value
                    .replace(/\D/g, '')
                    .replace(/(\d{4})/g, '$1 ')
                    .trim()
                    .slice(0, 19)
                )
              }
              icon={<CreditCard className="w-4 h-4" />}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Expiry Date"
                placeholder="MM/YY"
                value={expiry}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 4) {
                    setExpiry(val.length >= 3 ? `${val.slice(0, 2)}/${val.slice(2)}` : val);
                  }
                }}
              />
              <Input
                label="CVV"
                type="password"
                placeholder="***"
                maxLength={4}
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
              />
            </div>
          </div>
        )}

        {method === 'cash_on_arrival' && (
          <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-800">
              Pay with cash upon arrival at the hotel or our office. No advance payment required.
              Please have the exact amount ready.
            </p>
          </div>
        )}
      </div>

      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-600">Total Amount</span>
          <span className="text-2xl font-bold text-gray-900">
            {formatCurrency(amount, currency)}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
          <Lock className="w-3 h-3" />
          <span>Your payment information is secure</span>
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        fullWidth
        loading={processing}
        disabled={method === 'card' && !isValidCard}
        onClick={handleProcess}
      >
        {method === 'card' ? 'Pay Now' : 'Confirm Booking'}
      </Button>
    </div>
  );
}
