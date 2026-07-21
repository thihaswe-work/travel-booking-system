import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date, dateFormat: string = 'MMM dd, yyyy'): string {
  if (typeof date === 'string') {
    return format(parseISO(date), dateFormat);
  }
  return format(date, dateFormat);
}

export function formatDateTime(date: string | Date): string {
  if (typeof date === 'string') {
    return format(parseISO(date), 'MMM dd, yyyy HH:mm');
  }
  return format(date, 'MMM dd, yyyy HH:mm');
}

export function getStatusColor(status?: string): string {
  if (!status) return 'bg-gray-100 text-gray-800 border-gray-200';
  const statusMap: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    confirmed: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
    completed: 'bg-blue-100 text-blue-800 border-blue-200',
    failed: 'bg-red-100 text-red-800 border-red-200',
    refunded: 'bg-purple-100 text-purple-800 border-purple-200',
  };
  return statusMap[status.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
}

export function getBookingTypeLabel(type?: string): string {
  if (!type) return '';
  const typeMap: Record<string, string> = {
    flight: 'Flight',
    hotel: 'Hotel',
    tour: 'Tour',
    package: 'Package',
  };
  return typeMap[type.toLowerCase()] || type;
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}
