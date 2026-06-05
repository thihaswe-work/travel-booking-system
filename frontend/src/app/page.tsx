'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { Plane, Building2, Compass, Search, Shield, Clock, CreditCard, ArrowRight, Star } from 'lucide-react';

const tabs = [
  { id: 'flights', label: 'Flights', icon: Plane },
  { id: 'hotels', label: 'Hotels', icon: Building2 },
  { id: 'tours', label: 'Tours', icon: Compass },
];

const featuredDestinations = [
  { name: 'Tokyo', country: 'Japan', gradient: 'from-red-500 to-orange-500', tag: 'Cultural' },
  { name: 'Paris', country: 'France', gradient: 'from-blue-500 to-purple-500', tag: 'Romantic' },
  { name: 'New York', country: 'USA', gradient: 'from-green-500 to-blue-500', tag: 'Iconic' },
  { name: 'Bali', country: 'Indonesia', gradient: 'from-emerald-500 to-teal-500', tag: 'Tropical' },
];

const whyChooseUs = [
  {
    icon: CreditCard,
    title: 'Best Prices',
    description: 'We guarantee the best prices on flights, hotels, and tours worldwide.',
    color: 'text-green-600 bg-green-100',
  },
  {
    icon: Shield,
    title: '24/7 Support',
    description: 'Our support team is available around the clock to help you with any queries.',
    color: 'text-blue-600 bg-blue-100',
  },
  {
    icon: Clock,
    title: 'Easy Booking',
    description: 'Book your entire trip in minutes with our simple and intuitive platform.',
    color: 'text-purple-600 bg-purple-100',
  },
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('flights');
  const router = useRouter();

  const [flightSearch, setFlightSearch] = useState({ from: '', to: '', date: '' });
  const [hotelSearch, setHotelSearch] = useState({ destination: '', checkIn: '', checkOut: '', guests: '1' });
  const [tourSearch, setTourSearch] = useState({ destination: '', duration: '' });

  const handleSearch = () => {
    const params = new URLSearchParams();
    params.set('type', activeTab);

    if (activeTab === 'flights') {
      if (flightSearch.from) params.set('departureCity', flightSearch.from);
      if (flightSearch.to) params.set('arrivalCity', flightSearch.to);
      if (flightSearch.date) params.set('departureDate', flightSearch.date);
    } else if (activeTab === 'hotels') {
      if (hotelSearch.destination) params.set('destination', hotelSearch.destination);
      if (hotelSearch.checkIn) params.set('checkIn', hotelSearch.checkIn);
      if (hotelSearch.checkOut) params.set('checkOut', hotelSearch.checkOut);
      if (hotelSearch.guests) params.set('guests', hotelSearch.guests);
    } else if (activeTab === 'tours') {
      if (tourSearch.destination) params.set('tourDestination', tourSearch.destination);
    }

    router.push(`/search?${params.toString()}`);
  };

  return (
    <div>
      <section className="hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="text-center mb-10">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
              Discover Your Next Adventure
            </h1>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto">
              Book flights, hotels, and tours at the best prices. Your journey begins here.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl p-2">
              <div className="flex border-b border-gray-200 mb-4">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'text-primary-600 border-primary-600'
                          : 'text-gray-500 border-transparent hover:text-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="p-4">
                {activeTab === 'flights' && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      placeholder="From (city)"
                      value={flightSearch.from}
                      onChange={(e) => setFlightSearch({ ...flightSearch, from: e.target.value })}
                    />
                    <Input
                      placeholder="To (city)"
                      value={flightSearch.to}
                      onChange={(e) => setFlightSearch({ ...flightSearch, to: e.target.value })}
                    />
                    <Input
                      type="date"
                      value={flightSearch.date}
                      onChange={(e) => setFlightSearch({ ...flightSearch, date: e.target.value })}
                    />
                    <Button variant="primary" onClick={handleSearch} className="flex-shrink-0">
                      <Search className="w-4 h-4 mr-2" /> Search
                    </Button>
                  </div>
                )}

                {activeTab === 'hotels' && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      placeholder="Destination"
                      value={hotelSearch.destination}
                      onChange={(e) => setHotelSearch({ ...hotelSearch, destination: e.target.value })}
                    />
                    <Input
                      type="date"
                      placeholder="Check-in"
                      value={hotelSearch.checkIn}
                      onChange={(e) => setHotelSearch({ ...hotelSearch, checkIn: e.target.value })}
                    />
                    <Input
                      type="date"
                      placeholder="Check-out"
                      value={hotelSearch.checkOut}
                      onChange={(e) => setHotelSearch({ ...hotelSearch, checkOut: e.target.value })}
                    />
                    <Input
                      type="number"
                      min={1}
                      placeholder="Guests"
                      className="w-24"
                      value={hotelSearch.guests}
                      onChange={(e) => setHotelSearch({ ...hotelSearch, guests: e.target.value })}
                    />
                    <Button variant="primary" onClick={handleSearch} className="flex-shrink-0">
                      <Search className="w-4 h-4 mr-2" /> Search
                    </Button>
                  </div>
                )}

                {activeTab === 'tours' && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      placeholder="Destination"
                      value={tourSearch.destination}
                      onChange={(e) => setTourSearch({ ...tourSearch, destination: e.target.value })}
                    />
                    <Select
                      options={[
                        { value: '1-3', label: '1-3 Days' },
                        { value: '4-7', label: '4-7 Days' },
                        { value: '8-14', label: '1-2 Weeks' },
                        { value: '15+', label: '2+ Weeks' },
                      ]}
                      placeholder="Duration"
                      value={tourSearch.duration}
                      onChange={(e) => setTourSearch({ ...tourSearch, duration: e.target.value })}
                    />
                    <Button variant="primary" onClick={handleSearch} className="flex-shrink-0">
                      <Search className="w-4 h-4 mr-2" /> Search
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Destinations</h2>
          <p className="text-gray-500">Popular destinations our travelers love</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredDestinations.map((dest) => (
            <Link
              key={dest.name}
              href={`/search?type=hotels&destination=${dest.name}`}
              className="group relative h-64 rounded-xl overflow-hidden card-hover"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${dest.gradient}`} />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-1 bg-white/90 rounded-full text-xs font-medium text-gray-700">
                  {dest.tag}
                </span>
              </div>
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-xl font-bold">{dest.name}</h3>
                <p className="text-sm text-white/80">{dest.country}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Why Choose Us</h2>
            <p className="text-gray-500">We make travel booking simple and affordable</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {whyChooseUs.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="text-center p-6">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 ${item.color}`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="hero-gradient rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Ready for Your Next Trip?
            </h2>
            <p className="text-blue-100 max-w-md">
              Join thousands of happy travelers. Start planning your dream vacation today.
            </p>
          </div>
          <Link href="/register">
            <Button
              variant="secondary"
              size="lg"
              className="bg-white text-primary-700 hover:bg-gray-100 whitespace-nowrap"
            >
              Get Started <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
