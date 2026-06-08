'use client';

import React, { Suspense } from 'react';
import SearchView from '@/components/search/SearchView';
import Spinner from '@/components/ui/Spinner';

function FlightsContent() {
  return <SearchView type="flight" />;
}

export default function FlightsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Spinner size="lg" label="Loading flights..." /></div>}>
      <FlightsContent />
    </Suspense>
  );
}
