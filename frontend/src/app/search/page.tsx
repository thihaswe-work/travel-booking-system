'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import SearchView from '@/components/search/SearchView';
import Spinner from '@/components/ui/Spinner';

function SearchContent() {
  const searchParams = useSearchParams();
  const rawType = searchParams.get('type') || 'flights';
  const type: 'flight' | 'hotel' | 'tour' = rawType === 'flights' ? 'flight' : rawType === 'hotels' ? 'hotel' : 'tour';
  return <SearchView type={type} />;
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Spinner size="lg" label="Loading search..." /></div>}>
      <SearchContent />
    </Suspense>
  );
}
