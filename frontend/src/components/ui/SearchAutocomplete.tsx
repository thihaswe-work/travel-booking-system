'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { get } from '@/lib/api';
import type { SearchResult, SearchResultItem, ApiResponse } from '@/types';
import {
  Search,
  MapPin,
  Plane,
  Building2,
  Compass,
  Clock,
  Loader2,
  X,
  ArrowRight,
} from 'lucide-react';

const RECENT_SEARCHES_KEY = 'travel_recent_searches';
const MAX_RECENT = 5;
const DEBOUNCE_MS = 280;

interface SearchAutocompleteProps {
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  onSearch?: (query: string) => void;
  variant?: 'default' | 'hero';
}

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  if (typeof window === 'undefined') return;
  try {
    const recent = getRecentSearches().filter((r) => r.toLowerCase() !== query.toLowerCase());
    recent.unshift(query);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
  } catch {
    // localStorage may be full or unavailable
  }
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const words = query.trim().split(/\s+/).filter(Boolean);
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    words.some((w) => part.toLowerCase() === w.toLowerCase()) ? (
      <mark key={i} className="bg-yellow-100 text-yellow-900 rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

const TYPE_META: Record<string, { icon: React.FC<{ className?: string }>; label: string; colors: string }> = {
  destination: { icon: MapPin, label: 'Destinations', colors: 'text-emerald-600 bg-emerald-50' },
  flight: { icon: Plane, label: 'Flights', colors: 'text-blue-600 bg-blue-50' },
  hotel: { icon: Building2, label: 'Hotels', colors: 'text-purple-600 bg-purple-50' },
  tour: { icon: Compass, label: 'Tours', colors: 'text-amber-600 bg-amber-50' },
  airport: { icon: Plane, label: 'Airports', colors: 'text-indigo-600 bg-indigo-50' },
};

const GROUP_ORDER: Array<keyof SearchResult> = ['destinations', 'flights', 'hotels', 'tours', 'airports'];

interface FlatItem extends SearchResultItem {
  groupKey: string;
  groupLabel: string;
  isFirstInGroup: boolean;
}

function useFlatResults(results: SearchResult | null): FlatItem[] {
  return useMemo(() => {
    if (!results) return [];
    const items: FlatItem[] = [];
    for (const key of GROUP_ORDER) {
      const arr = results[key];
      if (!Array.isArray(arr) || arr.length === 0) continue;
      const meta = TYPE_META[key];
      for (let i = 0; i < arr.length; i++) {
        items.push({
          ...arr[i],
          groupKey: key,
          groupLabel: meta?.label || key,
          isFirstInGroup: i === 0,
        });
      }
    }
    return items;
  }, [results]);
}

export default function SearchAutocomplete({
  placeholder = 'Search destinations, flights, hotels, tours...',
  autoFocus = false,
  className = '',
  onSearch,
  variant = 'default',
}: SearchAutocompleteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const flatResults = useFlatResults(results);

  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 1) {
      setResults(null);
      setError(false);
      setLoading(false);
      return;
    }

    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(false);

    try {
      const response = await get<ApiResponse<SearchResult>>('/search', { q }, controller.signal);
      if (!controller.signal.aborted) {
        setResults(response.data);
        setLoading(false);
      }
    } catch {
      if (!controller.signal.aborted) {
        setError(true);
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (query.trim().length < 1) {
      setResults(null);
      setLoading(false);
      setError(false);
      return;
    }
    timerRef.current = setTimeout(() => doSearch(query), DEBOUNCE_MS);
    return () => clearTimeout(timerRef.current);
  }, [query, doSearch]);

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
      clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex]);

  const handleSelect = useCallback((item: SearchResultItem) => {
    setQuery(item.title);
    setOpen(false);
    setActiveIndex(-1);
    saveRecentSearch(item.title);
    setRecentSearches(getRecentSearches());
    router.push(item.url);
  }, [router]);

  const handleSubmit = useCallback(() => {
    if (query.trim().length < 1) return;
    setOpen(false);
    setActiveIndex(-1);
    saveRecentSearch(query.trim());
    setRecentSearches(getRecentSearches());
    if (onSearch) {
      onSearch(query.trim());
    } else {
      const q = query.trim();
      const lower = q.toLowerCase();
      if (['flights', 'flight'].includes(lower)) {
        router.push('/flights');
      } else if (['hotels', 'hotel'].includes(lower)) {
        router.push('/hotels');
      } else if (['tours', 'tour'].includes(lower)) {
        router.push('/tours');
      } else {
        router.push(`/search?type=hotels&destination=${encodeURIComponent(q)}`);
      }
    }
  }, [query, onSearch, router]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setOpen(true);
        setActiveIndex(flatResults.length > 0 ? 0 : -1);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        setActiveIndex((prev) => (prev < flatResults.length - 1 ? prev + 1 : 0));
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : flatResults.length - 1));
        break;
      }
      case 'Enter': {
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < flatResults.length) {
          handleSelect(flatResults[activeIndex]);
        } else {
          handleSubmit();
        }
        break;
      }
      case 'Escape': {
        setOpen(false);
        setActiveIndex(-1);
        inputRef.current?.blur();
        break;
      }
    }
  }, [open, activeIndex, flatResults, handleSelect, handleSubmit]);

  const handleClear = useCallback(() => {
    setQuery('');
    setResults(null);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }, []);

  const handleRecentClick = useCallback((term: string) => {
    setQuery(term);
    inputRef.current?.focus();
  }, []);

  const handleRemoveRecent = useCallback((term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter((r) => r !== term);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    setRecentSearches(updated);
  }, [recentSearches]);

  const showDropdown = open && (query.trim().length > 0 || recentSearches.length > 0);
  const showRecent = query.trim().length === 0 && recentSearches.length > 0;
  const showResults = query.trim().length > 0;
  const isHero = variant === 'hero';
  const inputId = 'search-autocomplete';

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="relative">
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${isHero ? 'w-5 h-5 text-gray-400' : 'w-4 h-4 text-gray-400'}`} />
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={`${inputId}-listbox`}
          aria-activedescendant={activeIndex >= 0 ? `${inputId}-option-${activeIndex}` : undefined}
          aria-autocomplete="list"
          aria-label="Search"
          className={`w-full bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            isHero
              ? 'pl-11 pr-10 py-3.5 text-base rounded-xl border border-gray-300 shadow-sm'
              : 'pl-9 pr-9 py-2 text-sm rounded-lg border border-gray-300'
          }`}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 ${isHero ? 'right-3' : 'right-2'}`}
            aria-label="Clear search"
          >
            <X className={isHero ? 'w-5 h-5' : 'w-4 h-4'} />
          </button>
        )}
      </div>

      {showDropdown && (
        <div
          id={`${inputId}-listbox`}
          ref={listRef}
          role="listbox"
          aria-label="Search suggestions"
          className={`absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden ${isHero ? 'max-h-[70vh]' : 'max-h-96'} overflow-y-auto`}
        >
          {showRecent && !loading && (
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Recent Searches</span>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem(RECENT_SEARCHES_KEY);
                    setRecentSearches([]);
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Clear
                </button>
              </div>
              {recentSearches.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => handleRecentClick(term)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 group"
                >
                  <Clock className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  <span className="flex-1 text-left truncate">{term}</span>
                  <button
                    type="button"
                    onClick={(e) => handleRemoveRecent(term, e)}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-gray-500 transition-opacity"
                    aria-label={`Remove ${term} from recent searches`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </button>
              ))}
            </div>
          )}

          {showResults && loading && (
            <div className="flex items-center justify-center gap-2 p-6 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Searching...</span>
            </div>
          )}

          {showResults && error && (
            <div className="flex flex-col items-center justify-center p-6 text-gray-400">
              <Search className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm font-medium text-gray-500">Search failed</p>
              <p className="text-xs text-gray-400 mt-1">Please try again</p>
            </div>
          )}

          {showResults && !loading && !error && results && flatResults.length === 0 && (
            <div className="flex flex-col items-center justify-center p-6 text-gray-400">
              <Search className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm font-medium text-gray-500">No results found</p>
              <p className="text-xs text-gray-400 mt-1">Try different keywords</p>
            </div>
          )}

          {showResults && !loading && !error && flatResults.length > 0 && (
            <div className="py-2">
              {flatResults.map((item, idx) => {
                const meta = TYPE_META[item.groupKey];
                const Icon = meta?.icon || MapPin;
                const isActive = idx === activeIndex;
                return (
                  <React.Fragment key={item.id}>
                    {item.isFirstInGroup && (
                      <div className="px-3 pt-2.5 pb-1">
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                          {item.groupLabel}
                        </span>
                      </div>
                    )}
                    <button
                      id={`${inputId}-option-${idx}`}
                      data-active={isActive}
                      role="option"
                      aria-selected={isActive}
                      type="button"
                      onClick={() => handleSelect(item)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                        isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${meta?.colors || 'text-gray-600 bg-gray-50'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {highlightMatch(item.title, query)}
                        </div>
                        <div className="text-xs text-gray-400 truncate">
                          {highlightMatch(item.subtitle, query)}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {!showRecent && showResults && !loading && query.trim().length > 0 && (
            <div className="border-t border-gray-100 p-2">
              <button
                type="button"
                onClick={handleSubmit}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                <Search className="w-4 h-4" />
                Search for &ldquo;{query}&rdquo;
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
