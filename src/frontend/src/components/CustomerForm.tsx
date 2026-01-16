'use client';

import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { customerApi, ApiError } from '@/lib/api/customerApi';
import type { Customer, CreateCustomerData } from '@/lib/api/types';

interface CustomerFormProps {
  onSuccess?: (customer: Customer) => void;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface TouchedFields {
  name: boolean;
  email: boolean;
  phone: boolean;
  address: boolean;
}

/**
 * Validates email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Form component for creating new customers with validation
 */
export function CustomerForm({ onSuccess }: CustomerFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({
    name: false,
    email: false,
    phone: false,
    address: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Validates a single field and returns error message if invalid
   */
  const validateField = useCallback((field: keyof FormErrors, value: string): string | undefined => {
    switch (field) {
      case 'name':
        if (!value.trim()) {
          return 'Name is required';
        }
        return undefined;
      case 'email':
        if (!value.trim()) {
          return 'Email is required';
        }
        if (!isValidEmail(value.trim())) {
          return 'Please enter a valid email address';
        }
        return undefined;
      default:
        return undefined;
    }
  }, []);

  /**
   * Validates all form fields
   */
  const validateAllFields = useCallback((): FormErrors => {
    return {
      name: validateField('name', name),
      email: validateField('email', email),
    };
  }, [name, email, validateField]);

  /**
   * Handles blur event for a field
   */
  const handleBlur = (field: keyof TouchedFields) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    const fieldValue = field === 'name' ? name : field === 'email' ? email : field === 'phone' ? phone : address;
    const error = validateField(field, fieldValue);

    setErrors((prev) => ({
      ...prev,
      [field]: error,
    }));
  };

  /**
   * Handles field change and clears error when user starts typing
   */
  const handleChange = (field: keyof FormErrors, value: string) => {
    switch (field) {
      case 'name':
        setName(value);
        break;
      case 'email':
        setEmail(value);
        break;
      case 'phone':
        setPhone(value);
        break;
      case 'address':
        setAddress(value);
        break;
    }

    // Clear error for this field when user corrects it
    if (errors[field]) {
      const error = validateField(field, value);
      setErrors((prev) => ({
        ...prev,
        [field]: error,
      }));
    }
  };

  /**
   * Handles form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      name: true,
      email: true,
      phone: true,
      address: true,
    });

    // Validate all fields
    const validationErrors = validateAllFields();
    setErrors(validationErrors);

    // Check if there are any errors
    if (validationErrors.name || validationErrors.email) {
      return;
    }

    setIsSubmitting(true);

    try {
      const data: CreateCustomerData = {
        name: name.trim(),
        email: email.trim(),
      };

      if (phone.trim()) {
        data.phone = phone.trim();
      }

      if (address.trim()) {
        data.address = address.trim();
      }

      const customer = await customerApi.createCustomer(data);

      // Clear form on success
      setName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setErrors({});
      setTouched({
        name: false,
        email: false,
        phone: false,
        address: false,
      });

      if (onSuccess) {
        onSuccess(customer);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        // Handle server-side validation errors
        if (error.errors) {
          const serverErrors: FormErrors = {};

          // Map server errors to form fields
          for (const [field, messages] of Object.entries(error.errors)) {
            const fieldKey = field.toLowerCase() as keyof FormErrors;
            if (messages && messages.length > 0) {
              serverErrors[fieldKey] = messages[0];
            }
          }

          setErrors((prev) => ({
            ...prev,
            ...serverErrors,
          }));
        } else {
          // General API error - display as general form error
          setErrors((prev) => ({
            ...prev,
            email: error.message,
          }));
        }
      } else {
        // Unknown error
        setErrors((prev) => ({
          ...prev,
          email: 'An unexpected error occurred. Please try again.',
        }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name Field */}
      <div className="space-y-2">
        <Label htmlFor="customer-name">
          Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="customer-name"
          type="text"
          placeholder="Enter customer name"
          value={name}
          onChange={(e) => handleChange('name', e.target.value)}
          onBlur={() => handleBlur('name')}
          disabled={isSubmitting}
          className={errors.name && touched.name ? 'border-red-500' : ''}
          aria-invalid={!!(errors.name && touched.name)}
          aria-describedby={errors.name && touched.name ? 'name-error' : undefined}
        />
        {errors.name && touched.name && (
          <p id="name-error" className="text-sm text-red-500" role="alert">
            {errors.name}
          </p>
        )}
      </div>

      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="customer-email">
          Email <span className="text-red-500">*</span>
        </Label>
        <Input
          id="customer-email"
          type="email"
          placeholder="Enter customer email"
          value={email}
          onChange={(e) => handleChange('email', e.target.value)}
          onBlur={() => handleBlur('email')}
          disabled={isSubmitting}
          className={errors.email && touched.email ? 'border-red-500' : ''}
          aria-invalid={!!(errors.email && touched.email)}
          aria-describedby={errors.email && touched.email ? 'email-error' : undefined}
        />
        {errors.email && touched.email && (
          <p id="email-error" className="text-sm text-red-500" role="alert">
            {errors.email}
          </p>
        )}
      </div>

      {/* Phone Field (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="customer-phone">Phone</Label>
        <Input
          id="customer-phone"
          type="tel"
          placeholder="Enter phone number (optional)"
          value={phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          onBlur={() => handleBlur('phone')}
          disabled={isSubmitting}
          className={errors.phone && touched.phone ? 'border-red-500' : ''}
          aria-invalid={!!(errors.phone && touched.phone)}
          aria-describedby={errors.phone && touched.phone ? 'phone-error' : undefined}
        />
        {errors.phone && touched.phone && (
          <p id="phone-error" className="text-sm text-red-500" role="alert">
            {errors.phone}
          </p>
        )}
      </div>

      {/* Address Field (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="customer-address">Address</Label>
        <Input
          id="customer-address"
          type="text"
          placeholder="Enter address (optional)"
          value={address}
          onChange={(e) => handleChange('address', e.target.value)}
          onBlur={() => handleBlur('address')}
          disabled={isSubmitting}
          className={errors.address && touched.address ? 'border-red-500' : ''}
          aria-invalid={!!(errors.address && touched.address)}
          aria-describedby={errors.address && touched.address ? 'address-error' : undefined}
        />
        {errors.address && touched.address && (
          <p id="address-error" className="text-sm text-red-500" role="alert">
            {errors.address}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? 'Creating...' : 'Create Customer'}
      </Button>
    </form>
  );
}
