'use client';

import React, { Suspense } from 'react';
import SearchView from '@/components/search/SearchView';
import Spinner from '@/components/ui/Spinner';

function ToursContent() {
  return <SearchView type="tour" />;
}

export default function ToursPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Spinner size="lg" label="Loading tours..." /></div>}>
      <ToursContent />
    </Suspense>
  );
}
