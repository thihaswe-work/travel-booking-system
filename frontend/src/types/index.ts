export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export type AgentTrustLevel = 'new' | 'trusted';

export interface User {
  id: string;
  email: string;
  role: 'customer' | 'travel_agent' | 'admin';
  firstName: string;
  lastName: string;
  phone?: string;
  preferences?: Record<string, unknown>;
  isActive: boolean;
  trustLevel?: AgentTrustLevel;
  approvedItemsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: 'customer' | 'travel_agent';
}

export interface Destination {
  id: string;
  name: string;
  country: string;
  description: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FlightSeat {
  id: string;
  flightId: string;
  seatClass: 'economy' | 'business' | 'first';
  price: number;
  availableSeats: number;
  totalSeats: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Flight {
  id: string;
  destinationId: string;
  airline: string;
  flightNumber: string;
  departureCity: string;
  arrivalCity: string;
  departureTime: string;
  arrivalTime: string;
  durationMin: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  destination?: Destination;
  seats?: FlightSeat[];
}

export interface Hotel {
  id: string;
  destinationId: string;
  name: string;
  address: string;
  starRating: number;
  pricePerNight: number;
  description: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  destination?: Destination;
  rooms?: HotelRoom[];
}

export interface HotelRoom {
  id: string;
  hotelId: string;
  roomType: string;
  pricePerNight: number;
  maxGuests: number;
  totalRooms: number;
  availableRooms: number;
  amenities: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TourItineraryItem {
  day: number;
  title: string;
  description: string;
}

export interface Tour {
  id: string;
  destinationId: string;
  name: string;
  description: string;
  durationDays: number;
  pricePerPerson: number;
  maxCapacity: number;
  availableSlots: number;
  includes: string[];
  itinerary: TourItineraryItem[];
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  destination?: Destination;
}

export interface Booking {
  id: string;
  userId: string;
  bookingType: 'flight' | 'hotel' | 'tour' | 'package';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  totalAmount: number;
  currency: string;
  referenceId: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  details?: BookingDetail[];
  payments?: Payment[];
}

export interface BookingDetail {
  id: string;
  bookingId: string;
  itemType: 'flight' | 'hotel' | 'tour';
  itemId: string;
  checkInDate?: string;
  checkOutDate?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  createdAt: string;
  passengers?: BookingPassenger[];
}

export interface BookingPassenger {
  id: string;
  bookingDetailId?: string;
  firstName: string;
  lastName: string;
  documentType?: string;
  documentNumber?: string;
  seatClass?: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  paymentMethod: 'card' | 'cash_on_arrival';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  invoiceNumber: string;
  paidAt?: string;
  gatewayResponse?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'booking_confirmation' | 'cancellation' | 'payment_receipt' | 'reminder' | 'promotional';
  channel: 'email' | 'sms' | 'in_app';
  subject?: string;
  message: string;
  isRead: boolean;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsDaily {
  id: string;
  date: string;
  totalBookings: number;
  totalRevenue: number;
  totalUsers: number;
  popularDestination?: string;
  bookingsByType: Record<string, number>;
  revenueByType: Record<string, number>;
}

export interface AnalyticsOverview {
  totalBookings: number;
  totalRevenue: number;
  totalUsers: number;
  todayBookings: number;
  bookingTrend: number;
  revenueTrend: number;
  userTrend: number;
  todayBookingTrend: number;
  pendingFlights: number;
  pendingHotels: number;
  pendingTours: number;
}

export interface ApiError {
  success: boolean;
  error: {
    code: string;
    message: string;
  };
}

export interface SearchFilters {
  departureCity?: string;
  arrivalCity?: string;
  departureDate?: string;
  departureTime?: string;
  arrivalTime?: string;
  returnDate?: string;
  seatClass?: string;
  minPrice?: number;
  maxPrice?: number;
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  starRating?: number;
  minPricePerNight?: number;
  maxPricePerNight?: number;
  tourDestination?: string;
  minDuration?: number;
  maxDuration?: number;
  tourMinPrice?: number;
  tourMaxPrice?: number;
  query?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
  plainKey?: string;
}
