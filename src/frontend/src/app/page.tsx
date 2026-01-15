'use client';

import { useState } from 'react';
import { SearchForm } from '@/components/SearchForm';
import CustomerResultsTable from '@/components/CustomerResultsTable';
import { customerApi } from '@/lib/api/customerApi';
import { ApiError } from '@/lib/api/customerApi';
import type { Customer, CustomerSearchParams } from '@/lib/api/types';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (params: CustomerSearchParams) => {
    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await customerApi.searchCustomers(params);
      setCustomers(response.items);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomerClick = (customer: Customer) => {
    // TODO: Will implement customer details modal in US-010
    console.log('Customer clicked:', customer);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-12 lg:p-24">
      <div className="w-full max-w-6xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Customer Search</h1>
          <p className="text-muted-foreground">
            Search for customers by name, email, or phone number
          </p>
        </div>

        <SearchForm onSearch={handleSearch} isLoading={isLoading} />

        {hasSearched && (
          <CustomerResultsTable
            customers={customers}
            loading={isLoading}
            error={error}
            onCustomerClick={handleCustomerClick}
          />
        )}
      </div>
    </main>
  );
}
