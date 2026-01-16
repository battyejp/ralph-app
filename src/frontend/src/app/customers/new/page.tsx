'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CustomerForm } from '@/components/CustomerForm';
import { Button } from '@/components/ui/button';
import type { Customer } from '@/lib/api/types';

export default function CreateCustomerPage() {
  const router = useRouter();

  const handleSuccess = (customer: Customer) => {
    // Navigate to home page with the new customer ID to show details dialog
    router.push(`/?showCustomer=${customer.id}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-12 lg:p-24">
      <div className="w-full max-w-lg space-y-8">
        <div className="space-y-2">
          <Link href="/">
            <Button variant="ghost" className="mb-4 -ml-4">
              &larr; Back to Search
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Create New Customer</h1>
          <p className="text-muted-foreground">
            Fill out the form below to add a new customer
          </p>
        </div>

        <CustomerForm onSuccess={handleSuccess} />
      </div>
    </main>
  );
}
