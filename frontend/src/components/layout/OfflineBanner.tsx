'use client';

import { useState, useEffect, useCallback } from 'react';
import { WifiOff, X, RefreshCw } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [checking, setChecking] = useState(false);

  const checkConnection = useCallback(async () => {
    setChecking(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      await fetch(`${API_URL}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      setIsOffline(false);
    } catch {
      setIsOffline(true);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      checkConnection();
    };
    const handleOffline = () => setIsOffline(true);

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      checkConnection();
    }

    const interval = setInterval(checkConnection, 30000);

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
      clearInterval(interval);
    };
  }, [checkConnection]);

  if (!isOffline || dismissed) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-amber-800 text-sm">
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          <span>You are currently offline. Some features may be unavailable.</span>
          <button
            onClick={checkConnection}
            disabled={checking}
            className="ml-1 text-amber-700 underline hover:text-amber-900 font-medium disabled:opacity-50 inline-flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${checking ? 'animate-spin' : ''}`} />
            Retry
          </button>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-400 hover:text-amber-600 transition-colors flex-shrink-0 ml-4"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
