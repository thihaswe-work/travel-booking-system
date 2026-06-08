'use client';

import React, { Suspense } from 'react';
import SearchView from '@/components/search/SearchView';
import Spinner from '@/components/ui/Spinner';

function HotelsContent() {
  return <SearchView type="hotel" />;
}

export default function HotelsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Spinner size="lg" label="Loading hotels..." /></div>}>
      <HotelsContent />
    </Suspense>
  );
}
