'use client';

import React, { useState, useRef, useEffect } from 'react';
import { get } from '@/lib/api';
import type { PaginatedApiResponse, Flight, Hotel, Tour } from '@/types';


interface AutocompleteInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  endpoint: '/flights' | '/hotels' | '/tours';
  field: string;
  apiParam?: string;
}

export default function AutocompleteInput({
  label,
  placeholder,
  value,
  onChange,
  endpoint,
  field,
  apiParam,
}: AutocompleteInputProps) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const ref = useRef<HTMLDivElement>(null);
  const inputId = label ? label.toLowerCase().replace(/\s+/g, '-') : 'autocomplete-input';

  useEffect(() => {
    if (!value || value.length < 1) { setSuggestions([]); return; }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await get<PaginatedApiResponse<Flight | Hotel | Tour>>(endpoint, {
          [apiParam || field]: value,
          limit: 10,
        });
        const unique = [...new Set(data.data.map((item) => {
          const v = (item as unknown as Record<string, unknown>)[field];
          return v != null ? String(v) : '';
        }).filter(Boolean))];
        setSuggestions(unique);
      } catch { setSuggestions([]); }
      finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(timer.current);
  }, [value, endpoint, field]);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  return (
    <div className="w-full relative" ref={ref}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        id={inputId}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => { if (suggestions.length) setOpen(true); }}
        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder-gray-400 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      />
      {loading && (
        <div className="absolute right-3 top-[38px]">
          <div className="w-3 h-3 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {open && suggestions.length > 0 && (
        <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700"
              onClick={() => { onChange(s); setOpen(false); }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
