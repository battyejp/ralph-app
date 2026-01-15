'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { customerApi, ApiError } from '@/lib/api/customerApi';
import type { Customer } from '@/lib/api/types';

interface CustomerDetailsDialogProps {
  customerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerDetailsDialog({
  customerId,
  open,
  onOpenChange,
}: CustomerDetailsDialogProps) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (customerId && open) {
      loadCustomerDetails(customerId);
    } else {
      // Reset state when dialog closes
      setCustomer(null);
      setError(null);
    }
  }, [customerId, open]);

  const loadCustomerDetails = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const customerData = await customerApi.getCustomerById(id);
      setCustomer(customerData);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) {
          setError('Customer not found.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to load customer details. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Customer Details</DialogTitle>
          <DialogDescription>
            View complete customer information
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12" role="status">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">Loading customer details...</span>
          </div>
        )}

        {error && (
          <div className="rounded-md bg-destructive/15 p-4 text-destructive">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {customer && !isLoading && !error && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Name
                </label>
                <p className="text-base">{customer.name}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Email
                </label>
                <p className="text-base">{customer.email}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Phone
                </label>
                <p className="text-base">{customer.phone || 'N/A'}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Address
                </label>
                <p className="text-base">{customer.address || 'N/A'}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Created At
                  </label>
                  <p className="text-sm">{formatDate(customer.createdAt)}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Updated At
                  </label>
                  <p className="text-sm">{formatDate(customer.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
