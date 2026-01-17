'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { customerApi } from '@/lib/api/customerApi';
import type { BulkCreateResponse } from '@/lib/api/types';

interface GenerateCustomersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (response: BulkCreateResponse) => void;
}

/**
 * Dialog modal for generating random customers in bulk.
 * Allows users to specify the number of random customers to create (1-1000).
 */
export function GenerateCustomersDialog({
  open,
  onOpenChange,
  onSuccess,
}: GenerateCustomersDialogProps) {
  const [count, setCount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Validate the count input
  const validateCount = (value: string): string => {
    if (!value || value.trim() === '') {
      return 'Please enter a number';
    }

    const num = Number(value);

    // Check if it's a valid number
    if (isNaN(num)) {
      return 'Please enter a valid number';
    }

    // Check if it's an integer
    if (!Number.isInteger(num)) {
      return 'Please enter a whole number';
    }

    // Check range
    if (num < 1) {
      return 'Minimum is 1 customer';
    }

    if (num > 1000) {
      return 'Maximum is 1000 customers';
    }

    return '';
  };

  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCount(value);

    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleBlur = () => {
    // Show validation error on blur if input is not empty
    if (count.trim() !== '') {
      const validationError = validateCount(count);
      if (validationError) {
        setError(validationError);
      }
    }
  };

  const handleGenerate = async () => {
    // Validate before submitting
    const validationError = validateCount(count);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await customerApi.bulkCreateRandom(Number(count));

      // Close dialog
      onOpenChange(false);

      // Reset form
      setCount('');

      // Notify parent of success
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (err) {
      // Set error message
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to generate customers. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form state
    setCount('');
    setError('');

    // Close dialog
    onOpenChange(false);
  };

  // Determine if the Generate button should be disabled
  const isGenerateDisabled = isLoading || validateCount(count) !== '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate Random Customers</DialogTitle>
          <DialogDescription>
            Create multiple random customers at once for testing purposes.
            Enter the number of customers to generate (1-1000).
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="count">Number of Customers</Label>
            <Input
              id="count"
              type="number"
              min={1}
              max={1000}
              placeholder="Enter a number between 1 and 1000"
              value={count}
              onChange={handleCountChange}
              onBlur={handleBlur}
              disabled={isLoading}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? 'count-error' : undefined}
            />
            {error && (
              <p id="count-error" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>

          {isLoading && (
            <p className="text-sm text-muted-foreground">
              Creating {count} customers...
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerateDisabled}
          >
            {isLoading ? 'Generating...' : 'Generate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
