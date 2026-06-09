'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Plane,
  Building2,
  Compass,
  MapPin,
  Key,
  ChevronLeft,
} from 'lucide-react';

const sidebarLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true, roles: ['admin', 'travel_agent'] as const },
  { href: '/admin/users', label: 'Users', icon: Users, roles: ['admin'] as const },
  { href: '/admin/bookings', label: 'Bookings', icon: BookOpen, roles: ['admin', 'travel_agent'] as const },
  { href: '/admin/flights', label: 'Flights', icon: Plane, roles: ['admin', 'travel_agent'] as const },
  { href: '/admin/hotels', label: 'Hotels', icon: Building2, roles: ['admin', 'travel_agent'] as const },
  { href: '/admin/tours', label: 'Tours', icon: Compass, roles: ['admin', 'travel_agent'] as const },
  { href: '/admin/destinations', label: 'Destinations', icon: MapPin, roles: ['admin'] as const },
  { href: '/admin/api-keys', label: 'API Integration', icon: Key, roles: ['admin', 'travel_agent'] as const },
];

interface SidebarProps {
  role: 'admin' | 'travel_agent' | 'customer';
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ role, collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const visibleLinks = sidebarLinks.filter((link) => (link.roles as readonly string[]).includes(role));

  const isActive = (link: (typeof sidebarLinks)[0]) => {
    if (link.exact) return pathname === link.href;
    return pathname.startsWith(link.href);
  };

  return (
    <aside
      className={cn(
        'fixed md:sticky top-16 md:top-16 left-0 z-30 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 transition-all duration-300 flex flex-col',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className="flex items-center justify-end p-2">
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          <ChevronLeft
            className={cn('w-4 h-4 transition-transform', collapsed && 'rotate-180')}
          />
        </button>
      </div>
      <nav className="flex-1 px-2 pb-4 space-y-1 overflow-y-auto">
        {visibleLinks.map((link) => {
          const Icon = link.icon;
          const active = isActive(link);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
              title={collapsed ? link.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{link.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
