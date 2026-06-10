'use client';

import { useState, useEffect, useCallback } from 'react';
import { WifiOff, RefreshCw, Home, Plane, Building2, Compass } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export default function OfflinePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checking, setChecking] = useState(false);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      await fetch(`${API_URL}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      const online = await checkConnection();
      if (online) {
        const redirect = searchParams.get('redirect') || '/';
        router.push(redirect);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [checkConnection, router, searchParams]);

  const handleRetry = async () => {
    setChecking(true);
    const online = await checkConnection();
    if (online) {
      const redirect = searchParams.get('redirect') || '/';
      router.push(redirect);
    }
    setChecking(false);
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 mb-6">
          <WifiOff className="w-10 h-10 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re Offline</h1>
        <p className="text-gray-600 mb-6">
          We can&apos;t reach our servers right now. This could be a network issue
          or our servers may be temporarily unavailable.
        </p>
        <p className="text-xs text-gray-400 mb-6">
          Auto-reconnecting every 5 seconds...
        </p>
        <button
          onClick={handleRetry}
          disabled={checking}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-8"
        >
          <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
          {checking ? 'Checking...' : 'Try Again'}
        </button>
        <div className="border-t border-gray-200 pt-6">
          <p className="text-sm text-gray-500 mb-4">In the meantime, you can browse:</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              <Home className="w-4 h-4" /> Home
            </Link>
            <Link
              href="/flights"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              <Plane className="w-4 h-4" /> Flights
            </Link>
            <Link
              href="/hotels"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              <Building2 className="w-4 h-4" /> Hotels
            </Link>
            <Link
              href="/tours"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              <Compass className="w-4 h-4" /> Tours
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
