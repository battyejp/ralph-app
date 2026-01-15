'use client';

import { useState } from 'react';
import { SearchForm } from '@/components/SearchForm';
import type { CustomerSearchParams } from '@/lib/api/types';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (params: CustomerSearchParams) => {
    setIsLoading(true);
    try {
      // TODO: Will implement actual search in US-007
      console.log('Search params:', params);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-12 lg:p-24">
      <div className="w-full max-w-6xl space-y-8">
        <SearchForm onSearch={handleSearch} isLoading={isLoading} />
      </div>
    </main>
  );
}
