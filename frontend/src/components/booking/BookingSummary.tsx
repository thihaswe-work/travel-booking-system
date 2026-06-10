'use client';

import React from 'react';
import { formatCurrency, formatDate, formatDateTime, getStatusColor, getBookingTypeLabel } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import type { Booking } from '@/types';
import { Plane, Building2, Compass, Calendar, CreditCard, Download, XCircle } from 'lucide-react';

interface BookingSummaryProps {
  booking: Booking;
  onCancel?: () => void;
}

export default function BookingSummary({ booking, onCancel }: BookingSummaryProps) {
  const getIcon = () => {
    switch (booking.bookingType) {
      case 'flight':
        return <Plane className="w-5 h-5" />;
      case 'hotel':
        return <Building2 className="w-5 h-5" />;
      case 'tour':
        return <Compass className="w-5 h-5" />;
      default:
        return <Compass className="w-5 h-5" />;
    }
  };

  const canCancel = booking.status === 'pending' || booking.status === 'confirmed';
  const detail = booking.details?.[0];
  const payment = booking.payments?.[0];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600">
              {getIcon()}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {getBookingTypeLabel(booking.bookingType)} Booking
              </h3>
              <p className="text-sm text-gray-500">Ref: {booking.referenceId}</p>
            </div>
          </div>
          <Badge variant={
            booking.status === 'confirmed' ? 'success' :
            booking.status === 'cancelled' ? 'danger' :
            booking.status === 'completed' ? 'info' : 'warning'
          } size="md">
            {(booking.status || '').toUpperCase()}
          </Badge>
        </div>

        {detail && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Item: {detail.itemType} - {detail.itemId}</span>
            </div>
            {detail.checkInDate && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(detail.checkInDate)} - {detail.checkOutDate ? formatDate(detail.checkOutDate) : ''}</span>
              </div>
            )}
            <div className="text-sm text-gray-600">
              Quantity: {detail.quantity} x {formatCurrency(detail.unitPrice)}
            </div>
            <div className="text-sm text-gray-600">
              Subtotal: {formatCurrency(detail.subtotal)}
            </div>
          </div>
        )}

        {detail?.passengers && detail.passengers.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="font-semibold text-gray-900 mb-3">Passengers</h4>
            <div className="space-y-2">
              {detail.passengers.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.firstName} {p.lastName}</p>
                    {p.documentType && <p className="text-xs text-gray-500">{p.documentType}: {p.documentNumber}</p>}
                  </div>
                  {p.seatClass && (
                    <Badge variant="primary" size="sm">{p.seatClass}</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {payment && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4 text-gray-500" />
            <h4 className="font-semibold text-gray-900">Payment</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Amount</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(payment.amount, payment.currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Method</span>
              <span className="text-gray-900 capitalize">{payment.paymentMethod.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <Badge variant={
                payment.paymentStatus === 'paid' ? 'success' :
                payment.paymentStatus === 'failed' ? 'danger' : 'warning'
              } size="sm">
                {payment.paymentStatus}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Invoice</span>
              <span className="text-gray-900">{payment.invoiceNumber}</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Total Amount</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(booking.totalAmount, booking.currency)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" /> Invoice
          </Button>
          {canCancel && onCancel && (
            <Button variant="danger" size="sm" onClick={onCancel}>
              <XCircle className="w-4 h-4 mr-1" /> Cancel Booking
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
