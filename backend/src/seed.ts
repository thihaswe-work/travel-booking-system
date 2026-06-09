import { PrismaClient, UserRole, AgentTrustLevel, SeatClass } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.bookingPassenger.deleteMany();
  await prisma.bookingDetail.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.analyticsDaily.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.hotelRoom.deleteMany();
  await prisma.tour.deleteMany();
  await prisma.flightSeat.deleteMany();
  await prisma.flight.deleteMany();
  await prisma.hotel.deleteMany();
  await prisma.destination.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cleared existing data');

  const passwordHash = await bcrypt.hash('Password123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@travel.com' },
    update: {},
    create: {
      id: uuidv4(),
      email: 'admin@travel.com',
      passwordHash,
      role: UserRole.admin,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+1234567890',
      isActive: true,
    },
  });

  const agent = await prisma.user.upsert({
    where: { email: 'agent@travel.com' },
    update: {},
    create: {
      id: uuidv4(),
      email: 'agent@travel.com',
      passwordHash,
      role: UserRole.travel_agent,
      firstName: 'Travel',
      lastName: 'Agent',
      phone: '+1234567891',
      isActive: true,
      trustLevel: AgentTrustLevel.trusted,
      approvedItemsCount: 0,
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      id: uuidv4(),
      email: 'customer@example.com',
      passwordHash,
      role: UserRole.customer,
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567892',
      isActive: true,
    },
  });

  console.log('Users seeded');

  const [tokyo, paris, newyork] = await Promise.all([
    prisma.destination.create({
      data: {
        id: uuidv4(),
        name: 'Tokyo',
        country: 'Japan',
        description: 'Tokyo, the bustling capital of Japan, blends ultramodern and traditional experiences.',
        imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
        isActive: true,
      },
    }),
    prisma.destination.create({
      data: {
        id: uuidv4(),
        name: 'Paris',
        country: 'France',
        description: 'The City of Light, known for its art, fashion, gastronomy, and culture.',
        imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
        isActive: true,
      },
    }),
    prisma.destination.create({
      data: {
        id: uuidv4(),
        name: 'New York',
        country: 'United States',
        description: 'The Big Apple, a global hub for finance, culture, and entertainment.',
        imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800',
        isActive: true,
      },
    }),
  ]);

  console.log('Destinations seeded');

  const flightSeeds = [
    {
      destId: tokyo.id, airline: 'Japan Airlines', flightNumber: 'JL001', dep: 'Los Angeles', arr: 'Tokyo',
      depTime: new Date('2026-06-10T10:00:00Z'), arrTime: new Date('2026-06-11T14:00:00Z'), dur: 600, isActive: true,
      seats: [
        { seatClass: SeatClass.economy, price: 850.00, total: 120, avail: 120 },
        { seatClass: SeatClass.business, price: 3200.00, total: 48, avail: 48 },
      ],
    },
    {
      destId: paris.id, airline: 'Air France', flightNumber: 'AF001', dep: 'New York', arr: 'Paris',
      depTime: new Date('2026-06-10T18:00:00Z'), arrTime: new Date('2026-06-11T07:30:00Z'), dur: 450, isActive: true,
      seats: [
        { seatClass: SeatClass.economy, price: 720.00, total: 150, avail: 150 },
        { seatClass: SeatClass.business, price: 1800.00, total: 36, avail: 36 },
      ],
    },
    {
      destId: paris.id, airline: 'British Airways', flightNumber: 'BA002', dep: 'London', arr: 'Paris',
      depTime: new Date('2026-06-10T14:00:00Z'), arrTime: new Date('2026-06-10T16:30:00Z'), dur: 150, isActive: true,
      seats: [
        { seatClass: SeatClass.economy, price: 250.00, total: 80, avail: 80 },
        { seatClass: SeatClass.business, price: 450.00, total: 36, avail: 36 },
      ],
    },
    {
      destId: newyork.id, airline: 'American Airlines', flightNumber: 'AA001', dep: 'Miami', arr: 'New York',
      depTime: new Date('2026-06-10T08:00:00Z'), arrTime: new Date('2026-06-10T11:00:00Z'), dur: 180, isActive: true,
      seats: [
        { seatClass: SeatClass.economy, price: 250.00, total: 160, avail: 160 },
        { seatClass: SeatClass.business, price: 890.00, total: 40, avail: 40 },
      ],
    },
    {
      destId: newyork.id, airline: 'JetBlue', flightNumber: 'B6002', dep: 'Los Angeles', arr: 'New York',
      depTime: new Date('2026-06-10T22:00:00Z'), arrTime: new Date('2026-06-11T06:00:00Z'), dur: 360, isActive: true,
      seats: [
        { seatClass: SeatClass.economy, price: 320.00, total: 130, avail: 130 },
        { seatClass: SeatClass.first, price: 1200.00, total: 24, avail: 24 },
      ],
    },
  ];

  for (const f of flightSeeds) {
    const flight = await prisma.flight.create({
      data: {
        id: uuidv4(),
        destinationId: f.destId,
        airline: f.airline,
        flightNumber: f.flightNumber,
        departureCity: f.dep,
        arrivalCity: f.arr,
        departureTime: f.depTime,
        arrivalTime: f.arrTime,
        durationMin: f.dur,
        isActive: f.isActive,
        createdById: admin.id,
      },
    });

    for (const s of f.seats) {
      await prisma.flightSeat.create({
        data: {
          id: uuidv4(),
          flightId: flight.id,
          seatClass: s.seatClass,
          price: s.price,
          totalSeats: s.total,
          availableSeats: s.avail,
        },
      });
    }
  }

  console.log('Flights seeded');

  const hotelsData = [
    {
      destId: tokyo.id, name: 'Park Hyatt Tokyo', address: '3-7-1-2 Nishi Shinjuku, Shinjuku-ku, Tokyo', stars: 5,
      rooms: [
        { type: 'Deluxe Room', price: 450.00, maxGuests: 2, total: 50, avail: 30, amenities: ['WiFi', 'Mini Bar', 'City View'] },
        { type: 'Executive Suite', price: 950.00, maxGuests: 3, total: 20, avail: 8, amenities: ['WiFi', 'Jacuzzi', 'Panoramic View', 'Butler'] },
      ],
    },
    {
      destId: tokyo.id, name: 'APA Hotel Shinjuku', address: '1-21-1 Kabukicho, Shinjuku-ku, Tokyo', stars: 3,
      rooms: [
        { type: 'Standard Room', price: 120.00, maxGuests: 2, total: 100, avail: 45, amenities: ['WiFi', 'TV'] },
        { type: 'Superior Room', price: 180.00, maxGuests: 2, total: 40, avail: 20, amenities: ['WiFi', 'Breakfast', 'City View'] },
      ],
    },
    {
      destId: paris.id, name: 'Hotel Ritz Paris', address: '15 Place Vendôme, 75001 Paris', stars: 5,
      rooms: [
        { type: 'Junior Suite', price: 1200.00, maxGuests: 2, total: 30, avail: 10, amenities: ['WiFi', 'Spa', 'Fine Dining'] },
        { type: 'Prestige Suite', price: 2800.00, maxGuests: 4, total: 15, avail: 5, amenities: ['WiFi', 'Butler', 'Eiffel View', 'Jacuzzi'] },
      ],
    },
    {
      destId: paris.id, name: 'Ibis Paris Tour Eiffel', address: '2 Rue Linois, 75015 Paris', stars: 3,
      rooms: [
        { type: 'Standard Room', price: 150.00, maxGuests: 2, total: 80, avail: 50, amenities: ['WiFi', 'TV'] },
        { type: 'Family Room', price: 220.00, maxGuests: 4, total: 30, avail: 15, amenities: ['WiFi', 'Breakfast', 'Eiffel View'] },
      ],
    },
    {
      destId: newyork.id, name: 'The Plaza Hotel', address: '768 5th Ave, New York, NY 10019', stars: 5,
      rooms: [
        { type: 'Grand Room', price: 1100.00, maxGuests: 2, total: 40, avail: 15, amenities: ['WiFi', 'Concierge', 'Central Park View'] },
        { type: 'Royal Suite', price: 3500.00, maxGuests: 4, total: 10, avail: 3, amenities: ['WiFi', 'Butler', 'Living Room', 'Kitchen'] },
      ],
    },
    {
      destId: newyork.id, name: 'Hampton Inn Times Square', address: '220 W 41st St, New York, NY 10036', stars: 3,
      rooms: [
        { type: 'Double Room', price: 280.00, maxGuests: 2, total: 120, avail: 70, amenities: ['WiFi', 'Breakfast', 'Gym'] },
        { type: 'King Suite', price: 400.00, maxGuests: 3, total: 30, avail: 18, amenities: ['WiFi', 'Breakfast', 'City View', 'Sofa Bed'] },
      ],
    },
  ];

  for (const h of hotelsData) {
    const hotel = await prisma.hotel.create({
      data: {
        id: uuidv4(),
        destinationId: h.destId,
        name: h.name,
        address: h.address,
        description: `Experience luxury and comfort at ${h.name}.`,
        imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
        starRating: h.stars,
        pricePerNight: Math.min(...h.rooms.map((r) => r.price)),
        isActive: true,
        createdById: admin.id,
      },
    });

    for (const r of h.rooms) {
      await prisma.hotelRoom.create({
        data: {
          id: uuidv4(),
          hotelId: hotel.id,
          roomType: r.type,
          pricePerNight: r.price,
          maxGuests: r.maxGuests,
          totalRooms: r.total,
          availableRooms: r.avail,
          amenities: r.amenities,
          isActive: true,
        },
      });
    }
  }

  console.log('Hotels seeded');

  const toursData = [
    {
      destId: tokyo.id, name: 'Tokyo Cultural Experience', desc: 'Explore ancient temples, modern districts, and authentic cuisine in Tokyo.', days: 5, price: 1500.00, max: 20, slots: 14,
      includes: ['Accommodation', 'Guide', 'Meals', 'Transport'], itinerary: [
        { day: 1, title: 'Arrival & Asakusa', description: 'Visit Senso-ji temple and explore Nakamise street' },
        { day: 2, title: 'Shibuya & Harajuku', description: 'Explore Shibuya crossing and Harajuku fashion' },
        { day: 3, title: 'Akihabara & Ueno', description: 'Electronics district and Ueno Park museums' },
        { day: 4, title: 'Mount Fuji Day Trip', description: 'Scenic trip to Mount Fuji and Hakone' },
        { day: 5, title: 'Departure', description: 'Free morning and transfer to airport' },
      ],
    },
    {
      destId: tokyo.id, name: 'Tokyo Food Tour', desc: 'Taste the best of Japanese cuisine from street food to Michelin-starred restaurants.', days: 3, price: 900.00, max: 12, slots: 8,
      includes: ['Food tastings', 'Guide', 'Transportation pass'], itinerary: [
        { day: 1, title: 'Shinjuku Food Walk', description: 'Izakaya hopping and ramen tasting' },
        { day: 2, title: 'Tsukiji & Ginza', description: 'Sushi masterclass and fine dining' },
        { day: 3, title: 'Osaka Day Trip', description: 'Street food tour in Dotonbori' },
      ],
    },
    {
      destId: paris.id, name: 'Paris Romance & Art', desc: 'Experience the romance of Paris with art, cuisine, and iconic landmarks.', days: 4, price: 1800.00, max: 16, slots: 10,
      includes: ['Accommodation', 'Guide', 'Museum passes', 'Seine cruise'], itinerary: [
        { day: 1, title: 'Arrival & Montmartre', description: 'Explore Sacré-Cœur and artists square' },
        { day: 2, title: 'Louvre & Tuileries', description: 'Full day at Louvre Museum and gardens' },
        { day: 3, title: 'Versailles', description: 'Day trip to Palace of Versailles' },
        { day: 4, title: 'Departure', description: 'Morning cruise on Seine and departure' },
      ],
    },
    {
      destId: paris.id, name: 'Paris Wine & Cheese', desc: 'Discover French wine regions and artisanal cheese making.', days: 3, price: 1200.00, max: 10, slots: 6,
      includes: ['Wine tastings', 'Cheese workshop', 'Guide', 'Transport'], itinerary: [
        { day: 1, title: 'Champagne Region', description: 'Visit Moët & Chandon and taste champagne' },
        { day: 2, title: 'Bordeaux Tasting', description: 'Wine pairing lunch and cellar tour' },
        { day: 3, title: 'Paris Cheese Walk', description: 'Fromageries tour and cheese platter lunch' },
      ],
    },
    {
      destId: newyork.id, name: 'NYC Landmarks Tour', desc: 'See all the iconic New York landmarks in one comprehensive tour.', days: 4, price: 1400.00, max: 20, slots: 16,
      includes: ['Accommodation', 'Guide', 'Attraction passes', 'Metro card'], itinerary: [
        { day: 1, title: 'Arrival & Times Square', description: 'Evening walk through Times Square and Broadway' },
        { day: 2, title: 'Statue of Liberty & Ellis Island', description: 'Full day visiting Liberty Island and Ellis Island' },
        { day: 3, title: 'Central Park & Museums', description: 'Central Park, Met Museum and MoMA' },
        { day: 4, title: 'Departure', description: 'Brooklyn Bridge walk and departure' },
      ],
    },
    {
      destId: newyork.id, name: 'NYC Food & Culture', desc: 'Dive into New Yorks diverse culinary scene and cultural neighborhoods.', days: 3, price: 950.00, max: 12, slots: 8,
      includes: ['Food tours', 'Guide', 'Subway pass'], itinerary: [
        { day: 1, title: 'Lower East Side', description: 'Bagels, pizza, and tenement museum tour' },
        { day: 2, title: 'Greenwich & Chelsea', description: 'Brunch tour and Chelsea Market exploration' },
        { day: 3, title: 'Brooklyn', description: 'Smorgasburg food market and Williamsburg walk' },
      ],
    },
  ];

  for (const t of toursData) {
    await prisma.tour.create({
      data: {
        id: uuidv4(),
        destinationId: t.destId,
        name: t.name,
        description: t.desc,
        durationDays: t.days,
        pricePerPerson: t.price,
        maxCapacity: t.max,
        availableSlots: t.slots,
        includes: t.includes,
        itinerary: t.itinerary,
        isActive: true,
        createdById: admin.id,
      },
    });
  }

  console.log('Tours seeded');
  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
