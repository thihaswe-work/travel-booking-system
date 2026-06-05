import React from 'react';
import Link from 'next/link';

const footerSections = [
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Press', href: '#' },
      { label: 'Blog', href: '#' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Center', href: '#' },
      { label: 'Cancellation Policy', href: '#' },
      { label: 'Refund Policy', href: '#' },
      { label: 'Contact Us', href: '#' },
    ],
  },
  {
    title: 'Destinations',
    links: [
      { label: 'Tokyo', href: '/search?type=hotels&destination=Tokyo' },
      { label: 'Paris', href: '/search?type=hotels&destination=Paris' },
      { label: 'New York', href: '/search?type=hotels&destination=New+York' },
      { label: 'London', href: '/search?type=hotels&destination=London' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Cookie Policy', href: '#' },
      { label: 'FAQs', href: '#' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
                {section.title}
              </h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-secondary-500 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">TA</span>
              </div>
              <span className="text-sm font-semibold text-white">TravelAgent</span>
            </div>
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} TravelAgent. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
