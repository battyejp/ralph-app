'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useDebounce } from '@/hooks/useDebounce';
import type { CustomerSearchParams } from '@/lib/api/types';

interface SearchFormProps {
  onSearch: (params: CustomerSearchParams) => void;
  isLoading?: boolean;
  onValidationError?: (error: string) => void;
}

/**
 * Simple email validation
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function SearchForm({ onSearch, isLoading = false, onValidationError }: SearchFormProps) {
  const [search, setSearch] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [emailError, setEmailError] = useState('');

  // Debounce search inputs with 500ms delay
  const debouncedSearch = useDebounce(search, 500);
  const debouncedEmail = useDebounce(email, 500);
  const debouncedPhone = useDebounce(phone, 500);

  const handleSearch = () => {
    // Clear previous errors
    setEmailError('');

    // Validate email if provided
    if (debouncedEmail.trim() && !isValidEmail(debouncedEmail.trim())) {
      const error = 'Please enter a valid email address';
      setEmailError(error);
      if (onValidationError) {
        onValidationError(error);
      }
      return;
    }

    const params: CustomerSearchParams = {};

    if (debouncedSearch.trim()) {
      params.search = debouncedSearch.trim();
    }

    if (debouncedEmail.trim()) {
      params.email = debouncedEmail.trim();
    }

    // Phone is stored in search parameter in backend API
    // We'll add it to the general search if provided
    if (debouncedPhone.trim()) {
      params.search = params.search
        ? `${params.search} ${debouncedPhone.trim()}`
        : debouncedPhone.trim();
    }

    onSearch(params);
  };

  const handleClear = () => {
    setSearch('');
    setEmail('');
    setPhone('');
    setEmailError('');
    onSearch({});
  };

  return (
    <div className="w-full max-w-4xl space-y-4 p-6 bg-card rounded-lg border shadow-md">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Customer Search</h2>
        <p className="text-sm text-muted-foreground">
          Search for customers by name, email, or phone number
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* General Search Field */}
        <div className="space-y-2">
          <Label htmlFor="search">Name or General Search</Label>
          <Input
            id="search"
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={isLoading}
            className="w-full"
          />
        </div>

        {/* Email Exact Match Field */}
        <div className="space-y-2">
          <Label htmlFor="email">Email (Exact Match)</Label>
          <Input
            id="email"
            type="email"
            placeholder="customer@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className={`w-full ${emailError ? 'border-red-500' : ''}`}
            aria-invalid={!!emailError}
            aria-describedby={emailError ? 'email-error' : undefined}
          />
          {emailError && (
            <p id="email-error" className="text-sm text-red-500" role="alert">
              {emailError}
            </p>
          )}
        </div>

        {/* Phone Search Field */}
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="555-0123"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={isLoading}
            className="w-full"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          onClick={handleSearch}
          disabled={isLoading}
          className="flex-1 sm:flex-none"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </Button>
        <Button
          onClick={handleClear}
          variant="outline"
          disabled={isLoading}
          className="flex-1 sm:flex-none"
        >
          Clear Filters
        </Button>
      </div>

      {isLoading && (
        <div className="text-sm text-muted-foreground">
          Searching customers...
        </div>
      )}
    </div>
  );
}
