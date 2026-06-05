export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'customer' | 'travel_agent' | 'admin';
  isActive: boolean;
  preferences?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
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

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface Destination {
  id: string;
  name: string;
  country: string;
  description: string;
  imageUrl?: string;
  isActive: boolean;
  popularity: number;
  createdAt: string;
  updatedAt: string;
}

export interface Flight {
  id: string;
  airline: string;
  flightNumber: string;
  departureCity: string;
  departureAirport: string;
  departureTime: string;
  arrivalCity: string;
  arrivalAirport: string;
  arrivalTime: string;
  duration: number;
  economyPrice: number;
  businessPrice: number;
  firstClassPrice: number;
  availableEconomySeats: number;
  availableBusinessSeats: number;
  availableFirstClassSeats: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Hotel {
  id: string;
  name: string;
  starRating: number;
  address: string;
  city: string;
  country: string;
  description: string;
  imageUrl?: string;
  isActive: boolean;
  rooms: HotelRoom[];
  createdAt: string;
  updatedAt: string;
}

export interface HotelRoom {
  id: string;
  hotelId: string;
  roomType: string;
  description: string;
  pricePerNight: number;
  maxGuests: number;
  availableRooms: number;
  amenities: string[];
  isActive: boolean;
}

export interface Tour {
  id: string;
  name: string;
  description: string;
  duration: number;
  durationUnit: string;
  pricePerPerson: number;
  maxParticipants: number;
  availableSlots: number;
  includes: string[];
  itinerary: string[];
  imageUrl?: string;
  destinationId?: string;
  destination?: Destination;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  userId: string;
  referenceId: string;
  bookingType: 'flight' | 'hotel' | 'tour';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  totalAmount: number;
  currency: string;
  passengers?: BookingPassenger[];
  flightId?: string;
  flight?: Flight;
  hotelId?: string;
  hotel?: Hotel;
  tourId?: string;
  tour?: Tour;
  roomId?: string;
  room?: HotelRoom;
  checkIn?: string;
  checkOut?: string;
  roomQuantity?: number;
  seatClass?: string;
  participants?: number;
  payment?: Payment;
  createdAt: string;
  updatedAt: string;
}

export interface BookingDetail {
  id: string;
  bookingId: string;
  itemType: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface BookingPassenger {
  id: string;
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  seatClass?: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  method: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  cardLastFour?: string;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
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
}

export interface SearchFilters {
  // Flight filters
  departureCity?: string;
  arrivalCity?: string;
  departureDate?: string;
  returnDate?: string;
  seatClass?: string;
  minPrice?: number;
  maxPrice?: number;

  // Hotel filters
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  starRating?: number;
  minPricePerNight?: number;
  maxPricePerNight?: number;

  // Tour filters
  tourDestination?: string;
  minDuration?: number;
  maxDuration?: number;
  tourMinPrice?: number;
  tourMaxPrice?: number;

  // Common
  query?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
