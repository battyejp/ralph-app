'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchForm } from '@/components/SearchForm';
import CustomerResultsTable from '@/components/CustomerResultsTable';
import { PaginationControls } from '@/components/PaginationControls';
import { CustomerDetailsDialog } from '@/components/CustomerDetailsDialog';
import { customerApi } from '@/lib/api/customerApi';
import { ApiError } from '@/lib/api/customerApi';
import type { Customer, CustomerSearchParams } from '@/lib/api/types';
import { useToast } from '@/hooks/useToast';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Search filters state
  const [searchFilters, setSearchFilters] = useState<CustomerSearchParams>({});

  // Sort state
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'createdAt' | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | undefined>(undefined);

  // Dialog state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Initialize state from URL parameters
  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1', 10);
    const size = parseInt(searchParams.get('pageSize') || '25', 10);
    const urlSortBy = searchParams.get('sortBy') as 'name' | 'email' | 'createdAt' | null;
    const urlSortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' | null;

    setCurrentPage(page);
    setPageSize(size);
    if (urlSortBy) setSortBy(urlSortBy);
    if (urlSortOrder) setSortOrder(urlSortOrder);
  }, [searchParams]);

  const updateURL = (params: CustomerSearchParams) => {
    const urlParams = new URLSearchParams();

    if (params.page && params.page > 1) {
      urlParams.set('page', params.page.toString());
    }
    if (params.pageSize && params.pageSize !== 25) {
      urlParams.set('pageSize', params.pageSize.toString());
    }
    if (params.search) {
      urlParams.set('search', params.search);
    }
    if (params.email) {
      urlParams.set('email', params.email);
    }
    if (params.sortBy) {
      urlParams.set('sortBy', params.sortBy);
    }
    if (params.sortOrder) {
      urlParams.set('sortOrder', params.sortOrder);
    }

    const queryString = urlParams.toString();
    router.push(queryString ? `/?${queryString}` : '/');
  };

  const handleSearch = async (params: CustomerSearchParams) => {
    // Reset to page 1 when new search is triggered
    const searchParams = { ...params, page: 1, pageSize, sortBy, sortOrder };
    setSearchFilters(params);
    setCurrentPage(1);
    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await customerApi.searchCustomers(searchParams);
      setCustomers(response.items);
      setTotalPages(response.totalPages);
      setTotalCount(response.totalCount);
      updateURL(searchParams);
    } catch (err) {
      let errorMessage = 'An unexpected error occurred. Please try again.';
      if (err instanceof ApiError) {
        errorMessage = err.message;
        setError(err.message);
      } else {
        setError(errorMessage);
      }

      // Show error toast
      toast({
        variant: 'destructive',
        title: 'Search Failed',
        description: errorMessage,
      });

      setCustomers([]);
      setTotalPages(0);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = async (page: number) => {
    const params = { ...searchFilters, page, pageSize, sortBy, sortOrder };
    setCurrentPage(page);
    setIsLoading(true);
    setError(null);

    try {
      const response = await customerApi.searchCustomers(params);
      setCustomers(response.items);
      setTotalPages(response.totalPages);
      setTotalCount(response.totalCount);
      updateURL(params);
    } catch (err) {
      let errorMessage = 'An unexpected error occurred. Please try again.';
      if (err instanceof ApiError) {
        errorMessage = err.message;
        setError(err.message);
      } else {
        setError(errorMessage);
      }

      toast({
        variant: 'destructive',
        title: 'Failed to Load Page',
        description: errorMessage,
      });

      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageSizeChange = async (newPageSize: number) => {
    // Reset to page 1 when page size changes
    const params = { ...searchFilters, page: 1, pageSize: newPageSize, sortBy, sortOrder };
    setPageSize(newPageSize);
    setCurrentPage(1);
    setIsLoading(true);
    setError(null);

    try {
      const response = await customerApi.searchCustomers(params);
      setCustomers(response.items);
      setTotalPages(response.totalPages);
      setTotalCount(response.totalCount);
      updateURL(params);
    } catch (err) {
      let errorMessage = 'An unexpected error occurred. Please try again.';
      if (err instanceof ApiError) {
        errorMessage = err.message;
        setError(err.message);
      } else {
        setError(errorMessage);
      }

      toast({
        variant: 'destructive',
        title: 'Failed to Update Page Size',
        description: errorMessage,
      });

      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSortChange = async (column: 'name' | 'email' | 'createdAt') => {
    // Toggle sort order if clicking the same column, default to 'asc' for new column
    let newSortOrder: 'asc' | 'desc' = 'asc';
    if (sortBy === column) {
      newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    }

    setSortBy(column);
    setSortOrder(newSortOrder);

    // Preserve current search and pagination, but stay on current page
    const params = { ...searchFilters, page: currentPage, pageSize, sortBy: column, sortOrder: newSortOrder };
    setIsLoading(true);
    setError(null);

    try {
      const response = await customerApi.searchCustomers(params);
      setCustomers(response.items);
      setTotalPages(response.totalPages);
      setTotalCount(response.totalCount);
      updateURL(params);
    } catch (err) {
      let errorMessage = 'An unexpected error occurred. Please try again.';
      if (err instanceof ApiError) {
        errorMessage = err.message;
        setError(err.message);
      } else {
        setError(errorMessage);
      }

      toast({
        variant: 'destructive',
        title: 'Failed to Sort',
        description: errorMessage,
      });

      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomerClick = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    setIsDialogOpen(true);
  };

  const handleValidationError = (error: string) => {
    toast({
      variant: 'destructive',
      title: 'Validation Error',
      description: error,
    });
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

        <SearchForm
          onSearch={handleSearch}
          isLoading={isLoading}
          onValidationError={handleValidationError}
        />

        {hasSearched && (
          <>
            <CustomerResultsTable
              customers={customers}
              loading={isLoading}
              error={error}
              onCustomerClick={handleCustomerClick}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={handleSortChange}
            />

            {!error && totalCount > 0 && (
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={totalCount}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                disabled={isLoading}
              />
            )}
          </>
        )}

        <CustomerDetailsDialog
          customerId={selectedCustomerId}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
