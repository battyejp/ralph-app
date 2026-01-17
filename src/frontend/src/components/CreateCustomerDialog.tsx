'use client';

import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { CustomerForm } from '@/components/CustomerForm';
import type { Customer } from '@/lib/api/types';

interface CreateCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerCreated?: (customer: Customer) => void;
}

/**
 * Dialog modal for creating new customers.
 * Contains the CustomerForm component and handles the success flow.
 */
export function CreateCustomerDialog({
  open,
  onOpenChange,
  onCustomerCreated,
}: CreateCustomerDialogProps) {
  const handleSuccess = (customer: Customer) => {
    // Close this dialog
    onOpenChange(false);

    // Notify parent that a customer was created
    if (onCustomerCreated) {
      onCustomerCreated(customer);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Customer</DialogTitle>
          <DialogDescription>
            Fill in the details below to add a new customer.
            Prefer a full page?{' '}
            <Link
              href="/customers/new"
              className="text-primary underline hover:text-primary/80"
              onClick={() => onOpenChange(false)}
            >
              Open full form
            </Link>
          </DialogDescription>
        </DialogHeader>
        <CustomerForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
