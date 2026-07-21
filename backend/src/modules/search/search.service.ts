import prisma from '../../config/database';
import type { Prisma } from '@prisma/client';

const MAX_RESULTS_PER_TYPE = 5;
const CACHE_TTL_MS = 30_000;
const searchCache = new Map<string, { data: SearchResult; expiresAt: number }>();

export interface SearchResult {
  destinations: SearchResultItem[];
  flights: SearchResultItem[];
  hotels: SearchResultItem[];
  tours: SearchResultItem[];
  airports: SearchResultItem[];
  totalResults: number;
}

export interface SearchResultItem {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  imageUrl?: string;
  url: string;
  metadata?: Record<string, unknown>;
}

function sanitizeQuery(q: string): string {
  return q.replace(/[^\w\s\u00C0-\u024F\u0400-\u04FF-]/g, '').trim();
}

export async function search(query: string): Promise<SearchResult> {
  const sanitized = sanitizeQuery(query);
  if (sanitized.length < 1) {
    return { destinations: [], flights: [], hotels: [], tours: [], airports: [], totalResults: 0 };
  }

  const cacheKey = sanitized.toLowerCase();
  const cached = searchCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const [destinations, flights, hotels, tours] = await Promise.all([
    searchDestinations(sanitized),
    searchFlights(sanitized),
    searchHotels(sanitized),
    searchTours(sanitized),
  ]);

  const airports = extractAirports(destinations, flights);

  const result: SearchResult = {
    destinations,
    flights,
    hotels,
    tours,
    airports,
    totalResults: destinations.length + flights.length + hotels.length + tours.length + airports.length,
  };

  searchCache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });

  if (searchCache.size > 500) {
    const now = Date.now();
    for (const [key, entry] of searchCache.entries()) {
      if (entry.expiresAt <= now) {
        searchCache.delete(key);
      }
    }
  }

  return result;
}

async function searchDestinations(query: string): Promise<SearchResultItem[]> {
  const where: Prisma.DestinationWhereInput = {
    isActive: true,
    OR: [
      { name: { contains: query, mode: 'insensitive' } },
      { country: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
    ],
  };

  const items = await prisma.destination.findMany({
    where,
    take: MAX_RESULTS_PER_TYPE,
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { flights: true, hotels: true, tours: true } },
    },
  });

  return items.map((d) => ({
    id: d.id,
    type: 'destination',
    title: d.name,
    subtitle: d.country,
    imageUrl: d.imageUrl || undefined,
    url: `/search?type=hotels&destination=${encodeURIComponent(d.name)}`,
    metadata: {
      flights: d._count.flights,
      hotels: d._count.hotels,
      tours: d._count.tours,
    },
  }));
}

async function searchFlights(query: string): Promise<SearchResultItem[]> {
  const where: Prisma.FlightWhereInput = {
    isActive: true,
    OR: [
      { departureCity: { contains: query, mode: 'insensitive' } },
      { arrivalCity: { contains: query, mode: 'insensitive' } },
      { airline: { contains: query, mode: 'insensitive' } },
      { flightNumber: { contains: query, mode: 'insensitive' } },
    ],
  };

  const items = await prisma.flight.findMany({
    where,
    take: MAX_RESULTS_PER_TYPE,
    orderBy: { departureTime: 'asc' },
    include: {
      destination: { select: { name: true } },
      seats: { select: { price: true }, orderBy: { price: 'asc' } },
    },
  });

  return items.map((f) => {
    const minPrice = f.seats.length > 0 ? Number(f.seats[0].price) : null;
    return {
      id: f.id,
      type: 'flight',
      title: `${f.departureCity} → ${f.arrivalCity}`,
      subtitle: `${f.airline} · ${f.flightNumber}`,
      url: `/flights/${f.id}`,
      metadata: {
        departureCity: f.departureCity,
        arrivalCity: f.arrivalCity,
        airline: f.airline,
        flightNumber: f.flightNumber,
        minPrice,
        destination: f.destination?.name,
      },
    };
  });
}

async function searchHotels(query: string): Promise<SearchResultItem[]> {
  const where: Prisma.HotelWhereInput = {
    isActive: true,
    OR: [
      { name: { contains: query, mode: 'insensitive' } },
      { address: { contains: query, mode: 'insensitive' } },
      { destination: { name: { contains: query, mode: 'insensitive' } } },
      { destination: { country: { contains: query, mode: 'insensitive' } } },
    ],
  };

  const items = await prisma.hotel.findMany({
    where,
    take: MAX_RESULTS_PER_TYPE,
    orderBy: { starRating: 'desc' },
    include: {
      destination: { select: { name: true, country: true } },
      rooms: {
        where: { isActive: true },
        select: { pricePerNight: true },
        orderBy: { pricePerNight: 'asc' },
        take: 1,
      },
    },
  });

  return items.map((h) => {
    const minPrice = h.rooms.length > 0 ? Number(h.rooms[0].pricePerNight) : null;
    return {
      id: h.id,
      type: 'hotel',
      title: h.name,
      subtitle: `${h.destination?.name || ''} · ${h.starRating}★${minPrice != null ? ` · From $${minPrice}/night` : ''}`,
      imageUrl: h.imageUrl || undefined,
      url: `/hotels/${h.id}`,
      metadata: {
        starRating: h.starRating,
        minPrice,
        destination: h.destination?.name,
        country: h.destination?.country,
      },
    };
  });
}

async function searchTours(query: string): Promise<SearchResultItem[]> {
  const where: Prisma.TourWhereInput = {
    isActive: true,
    OR: [
      { name: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { destination: { name: { contains: query, mode: 'insensitive' } } },
      { destination: { country: { contains: query, mode: 'insensitive' } } },
    ],
  };

  const items = await prisma.tour.findMany({
    where,
    take: MAX_RESULTS_PER_TYPE,
    orderBy: { name: 'asc' },
    include: {
      destination: { select: { name: true, country: true } },
    },
  });

  return items.map((t) => ({
    id: t.id,
    type: 'tour',
    title: t.name,
    subtitle: `${t.destination?.name || ''} · ${t.durationDays} days · From $${Number(t.pricePerPerson)}/person`,
    url: `/tours/${t.id}`,
    metadata: {
      durationDays: t.durationDays,
      pricePerPerson: Number(t.pricePerPerson),
      destination: t.destination?.name,
      country: t.destination?.country,
    },
  }));
}

function extractAirports(destinations: SearchResultItem[], flights: SearchResultItem[]): SearchResultItem[] {
  const airports = new Map<string, { city: string; count: number }>();

  for (const f of flights) {
    const dep = f.metadata?.departureCity as string | undefined;
    const arr = f.metadata?.arrivalCity as string | undefined;
    if (dep) {
      const key = dep.toLowerCase();
      const existing = airports.get(key);
      if (existing) existing.count++;
      else airports.set(key, { city: dep, count: 1 });
    }
    if (arr) {
      const key = arr.toLowerCase();
      const existing = airports.get(key);
      if (existing) existing.count++;
      else airports.set(key, { city: arr, count: 1 });
    }
  }

  return Array.from(airports.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((a) => ({
      id: `airport-${a.city.toLowerCase().replace(/\s+/g, '-')}`,
      type: 'airport',
      title: `${a.city} Airport`,
      subtitle: `Flights to/from ${a.city}`,
      url: `/flights?departure_city=${encodeURIComponent(a.city)}`,
      metadata: { city: a.city },
    }));
}
