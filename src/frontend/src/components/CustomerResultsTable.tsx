'use client';

import React from 'react';
import { Customer } from '@/lib/api/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface CustomerResultsTableProps {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  onCustomerClick: (customer: Customer) => void;
  sortBy?: 'name' | 'email' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (sortBy: 'name' | 'email' | 'createdAt') => void;
}

/**
 * Formats ISO date string to readable format
 */
function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * SortableTableHeader - Renders a clickable column header with sort indicator
 */
interface SortableHeaderProps {
  column: 'name' | 'email' | 'createdAt';
  label: string;
  sortBy?: 'name' | 'email' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (column: 'name' | 'email' | 'createdAt') => void;
}

function SortableTableHeader({
  column,
  label,
  sortBy,
  sortOrder,
  onSortChange,
}: SortableHeaderProps) {
  const isActive = sortBy === column;
  const showUpArrow = isActive && sortOrder === 'asc';
  const showDownArrow = isActive && sortOrder === 'desc';

  return (
    <TableHead
      onClick={() => onSortChange?.(column)}
      className={onSortChange ? 'cursor-pointer select-none hover:bg-muted/50' : ''}
    >
      <div className="flex items-center gap-1">
        <span>{label}</span>
        {onSortChange && (
          <div className="flex flex-col">
            <svg
              className={`h-3 w-3 ${showUpArrow ? 'text-primary' : 'text-muted-foreground/30'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L10 6.414l-3.293 3.293a1 1 0 01-1.414 0z" />
            </svg>
            <svg
              className={`h-3 w-3 -mt-1 ${showDownArrow ? 'text-primary' : 'text-muted-foreground/30'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L10 13.586l3.293-3.293a1 1 0 011.414 0z" />
            </svg>
          </div>
        )}
      </div>
    </TableHead>
  );
}

/**
 * CustomerResultsTable - Displays customer search results in a table format
 *
 * Features:
 * - Loading state with spinner
 * - Empty state when no results
 * - Error state when API fails
 * - Clickable rows to view customer details
 * - Sortable columns (Name, Email, Created At)
 * - Responsive design: table on desktop, card view on mobile
 */
export default function CustomerResultsTable({
  customers,
  loading,
  error,
  onCustomerClick,
  sortBy,
  sortOrder,
  onSortChange,
}: CustomerResultsTableProps) {
  // Loading State
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading customers...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="flex flex-col items-center gap-3 max-w-md text-center">
          <div className="rounded-full bg-destructive/10 p-3">
            <svg
              className="h-6 w-6 text-destructive"
              fill="none"
              strokeWidth="2"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-1">Error Loading Customers</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty State
  if (customers.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="flex flex-col items-center gap-3 max-w-md text-center">
          <div className="rounded-full bg-muted p-3">
            <svg
              className="h-6 w-6 text-muted-foreground"
              fill="none"
              strokeWidth="2"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-1">No Customers Found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search filters to find what you&apos;re looking for.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Success State - Desktop Table View (hidden on mobile)
  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHeader
                column="name"
                label="Name"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={onSortChange}
              />
              <SortableTableHeader
                column="email"
                label="Email"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={onSortChange}
              />
              <TableHead>Phone</TableHead>
              <SortableTableHeader
                column="createdAt"
                label="Created At"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={onSortChange}
              />
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow
                key={customer.id}
                onClick={() => onCustomerClick(customer)}
                className="cursor-pointer"
              >
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell>{customer.email}</TableCell>
                <TableCell>{customer.phone || 'N/A'}</TableCell>
                <TableCell>{formatDate(customer.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {customers.map((customer) => (
          <div
            key={customer.id}
            onClick={() => onCustomerClick(customer)}
            className="border rounded-lg p-4 space-y-2 cursor-pointer hover:bg-muted/50 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-base">{customer.name}</h3>
                <p className="text-sm text-muted-foreground">{customer.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t text-sm">
              <div>
                <span className="text-muted-foreground">Phone:</span>
                <p className="font-medium">{customer.phone || 'N/A'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Created:</span>
                <p className="font-medium">{formatDate(customer.createdAt)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
