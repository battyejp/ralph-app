import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CustomerForm } from './CustomerForm';
import { customerApi, ApiError } from '@/lib/api/customerApi';
import { useToast } from '@/hooks/useToast';
import type { Customer } from '@/lib/api/types';

// Mock the customerApi
jest.mock('@/lib/api/customerApi', () => ({
  customerApi: {
    createCustomer: jest.fn(),
  },
  ApiError: class ApiError extends Error {
    constructor(
      message: string,
      public status?: number,
      public errors?: Record<string, string[]>,
      public isRetryable: boolean = false
    ) {
      super(message);
      this.name = 'ApiError';
    }
  },
}));

// Mock the useToast hook
const mockToast = jest.fn();
jest.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    toast: mockToast,
    toasts: [],
    dismiss: jest.fn(),
  }),
}));

const mockCustomerApi = customerApi as jest.Mocked<typeof customerApi>;

describe('CustomerForm', () => {
  const mockOnSuccess = jest.fn();
  const mockCustomer: Customer = {
    id: '123',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '555-0123',
    address: '123 Main St',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockToast.mockClear();
  });

  describe('Rendering', () => {
    it('should render all form fields', () => {
      render(<CustomerForm />);

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
    });

    it('should render submit button', () => {
      render(<CustomerForm />);

      expect(screen.getByRole('button', { name: /create customer/i })).toBeInTheDocument();
    });

    it('should mark required fields with asterisk', () => {
      render(<CustomerForm />);

      const nameLabel = screen.getByText(/name/i).closest('label');
      const emailLabel = screen.getByText(/email/i).closest('label');

      expect(nameLabel).toHaveTextContent('*');
      expect(emailLabel).toHaveTextContent('*');
    });

    it('should render placeholders for all fields', () => {
      render(<CustomerForm />);

      expect(screen.getByPlaceholderText(/enter customer name/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter customer email/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter phone number/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter address/i)).toBeInTheDocument();
    });
  });

  describe('User Input', () => {
    it('should update name input value when typing', () => {
      render(<CustomerForm />);

      const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });

      expect(nameInput.value).toBe('John Doe');
    });

    it('should update email input value when typing', () => {
      render(<CustomerForm />);

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

      expect(emailInput.value).toBe('john@example.com');
    });

    it('should update phone input value when typing', () => {
      render(<CustomerForm />);

      const phoneInput = screen.getByLabelText(/phone/i) as HTMLInputElement;
      fireEvent.change(phoneInput, { target: { value: '555-0123' } });

      expect(phoneInput.value).toBe('555-0123');
    });

    it('should update address input value when typing', () => {
      render(<CustomerForm />);

      const addressInput = screen.getByLabelText(/address/i) as HTMLInputElement;
      fireEvent.change(addressInput, { target: { value: '123 Main St' } });

      expect(addressInput.value).toBe('123 Main St');
    });
  });

  describe('Client-side Validation', () => {
    it('should show error for empty name on blur', async () => {
      render(<CustomerForm />);

      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.focus(nameInput);
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });
    });

    it('should show error for empty email on blur', async () => {
      render(<CustomerForm />);

      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.focus(emailInput);
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    it('should show error for invalid email format on blur', async () => {
      render(<CustomerForm />);

      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    it('should clear name error when valid input is provided', async () => {
      render(<CustomerForm />);

      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.focus(nameInput);
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });

      fireEvent.change(nameInput, { target: { value: 'John Doe' } });

      await waitFor(() => {
        expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument();
      });
    });

    it('should clear email error when valid input is provided', async () => {
      render(<CustomerForm />);

      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'invalid' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });

      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
      });
    });

    it('should show all validation errors on submit with empty form', async () => {
      render(<CustomerForm />);

      const submitButton = screen.getByRole('button', { name: /create customer/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    it('should not submit form with validation errors', async () => {
      render(<CustomerForm />);

      const submitButton = screen.getByRole('button', { name: /create customer/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCustomerApi.createCustomer).not.toHaveBeenCalled();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call createCustomer with form data on valid submit', async () => {
      mockCustomerApi.createCustomer.mockResolvedValue(mockCustomer);
      render(<CustomerForm onSuccess={mockOnSuccess} />);

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '555-0123' } });
      fireEvent.change(screen.getByLabelText(/address/i), { target: { value: '123 Main St' } });

      const submitButton = screen.getByRole('button', { name: /create customer/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCustomerApi.createCustomer).toHaveBeenCalledWith({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-0123',
          address: '123 Main St',
        });
      });
    });

    it('should call createCustomer with only required fields', async () => {
      mockCustomerApi.createCustomer.mockResolvedValue(mockCustomer);
      render(<CustomerForm onSuccess={mockOnSuccess} />);

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });

      const submitButton = screen.getByRole('button', { name: /create customer/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCustomerApi.createCustomer).toHaveBeenCalledWith({
          name: 'John Doe',
          email: 'john@example.com',
        });
      });
    });

    it('should trim whitespace from input values', async () => {
      mockCustomerApi.createCustomer.mockResolvedValue(mockCustomer);
      render(<CustomerForm />);

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: '  John Doe  ' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: '  john@example.com  ' } });

      const submitButton = screen.getByRole('button', { name: /create customer/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCustomerApi.createCustomer).toHaveBeenCalledWith({
          name: 'John Doe',
          email: 'john@example.com',
        });
      });
    });

    it('should call onSuccess callback with created customer', async () => {
      mockCustomerApi.createCustomer.mockResolvedValue(mockCustomer);
      render(<CustomerForm onSuccess={mockOnSuccess} />);

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });

      const submitButton = screen.getByRole('button', { name: /create customer/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(mockCustomer);
      });
    });

    it('should clear form after successful submission', async () => {
      mockCustomerApi.createCustomer.mockResolvedValue(mockCustomer);
      render(<CustomerForm />);

      const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      const phoneInput = screen.getByLabelText(/phone/i) as HTMLInputElement;
      const addressInput = screen.getByLabelText(/address/i) as HTMLInputElement;

      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(phoneInput, { target: { value: '555-0123' } });
      fireEvent.change(addressInput, { target: { value: '123 Main St' } });

      const submitButton = screen.getByRole('button', { name: /create customer/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(nameInput.value).toBe('');
        expect(emailInput.value).toBe('');
        expect(phoneInput.value).toBe('');
        expect(addressInput.value).toBe('');
      });
    });
  });

  describe('Loading State', () => {
    it('should disable submit button during submission', async () => {
      mockCustomerApi.createCustomer.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockCustomer), 100))
      );
      render(<CustomerForm />);

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });

      const submitButton = screen.getByRole('button', { name: /create customer/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /creating.../i })).toBeDisabled();
      });
    });

    it('should disable input fields during submission', async () => {
      mockCustomerApi.createCustomer.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockCustomer), 100))
      );
      render(<CustomerForm />);

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });

      const submitButton = screen.getByRole('button', { name: /create customer/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeDisabled();
        expect(screen.getByLabelText(/email/i)).toBeDisabled();
        expect(screen.getByLabelText(/phone/i)).toBeDisabled();
        expect(screen.getByLabelText(/address/i)).toBeDisabled();
      });
    });

    it('should show loading text in submit button during submission', async () => {
      mockCustomerApi.createCustomer.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockCustomer), 100))
      );
      render(<CustomerForm />);

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });

      const submitButton = screen.getByRole('button', { name: /create customer/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /creating.../i })).toBeInTheDocument();
      });
    });

    it('should re-enable form after submission completes', async () => {
      mockCustomerApi.createCustomer.mockResolvedValue(mockCustomer);
      render(<CustomerForm />);

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });

      const submitButton = screen.getByRole('button', { name: /create customer/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create customer/i })).not.toBeDisabled();
      });
    });
  });

  describe('Server-side Error Handling', () => {
    it('should display server validation errors for specific fields', async () => {
      const serverError = new ApiError('Validation failed', 400, {
        Name: ['Name must be at least 2 characters'],
        Email: ['Email format is invalid'],
      });
      mockCustomerApi.createCustomer.mockRejectedValue(serverError);
      render(<CustomerForm />);

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'J' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } });

      const submitButton = screen.getByRole('button', { name: /create customer/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();
        expect(screen.getByText(/email format is invalid/i)).toBeInTheDocument();
      });
    });

    it('should display duplicate email error', async () => {
      const duplicateError = new ApiError('A customer with this email already exists', 409);
      mockCustomerApi.createCustomer.mockRejectedValue(duplicateError);
      render(<CustomerForm />);

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });

      const submitButton = screen.getByRole('button', { name: /create customer/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/a customer with this email already exists/i)).toBeInTheDocument();
      });
    });

    it('should display generic error for unknown errors', async () => {
      mockCustomerApi.createCustomer.mockRejectedValue(new Error('Unknown error'));
      render(<CustomerForm />);

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });

      const submitButton = screen.getByRole('button', { name: /create customer/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();
      });
    });

    it('should re-enable form after submission error', async () => {
      mockCustomerApi.createCustomer.mockRejectedValue(new ApiError('Error', 500));
      render(<CustomerForm />);

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });

      const submitButton = screen.getByRole('button', { name: /create customer/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create customer/i })).not.toBeDisabled();
        expect(screen.getByLabelText(/name/i)).not.toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have aria-invalid attribute on fields with errors', async () => {
      render(<CustomerForm />);

      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.focus(nameInput);
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(nameInput).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should have aria-describedby pointing to error message', async () => {
      render(<CustomerForm />);

      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.focus(nameInput);
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(nameInput).toHaveAttribute('aria-describedby', 'name-error');
      });
    });

    it('should have role="alert" on error messages', async () => {
      render(<CustomerForm />);

      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.focus(nameInput);
      fireEvent.blur(nameInput);

      await waitFor(() => {
        const errorMessage = screen.getByText(/name is required/i);
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });
  });

  describe('Responsive Design', () => {
    it('should have full-width submit button', () => {
      render(<CustomerForm />);

      const submitButton = screen.getByRole('button', { name: /create customer/i });
      expect(submitButton).toHaveClass('w-full');
    });

    it('should have stacked layout for form fields', () => {
      const { container } = render(<CustomerForm />);

      const form = container.querySelector('form');
      expect(form).toHaveClass('space-y-4');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty optional fields correctly', async () => {
      mockCustomerApi.createCustomer.mockResolvedValue(mockCustomer);
      render(<CustomerForm />);

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '' } });
      fireEvent.change(screen.getByLabelText(/address/i), { target: { value: '' } });

      const submitButton = screen.getByRole('button', { name: /create customer/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCustomerApi.createCustomer).toHaveBeenCalledWith({
          name: 'John Doe',
          email: 'john@example.com',
        });
      });
    });

    it('should handle whitespace-only optional fields as empty', async () => {
      mockCustomerApi.createCustomer.mockResolvedValue(mockCustomer);
      render(<CustomerForm />);

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '   ' } });
      fireEvent.change(screen.getByLabelText(/address/i), { target: { value: '   ' } });

      const submitButton = screen.getByRole('button', { name: /create customer/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCustomerApi.createCustomer).toHaveBeenCalledWith({
          name: 'John Doe',
          email: 'john@example.com',
        });
      });
    });

    it('should handle whitespace-only required fields as invalid', async () => {
      render(<CustomerForm />);

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: '   ' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: '   ' } });

      const submitButton = screen.getByRole('button', { name: /create customer/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    it('should not call onSuccess if not provided', async () => {
      mockCustomerApi.createCustomer.mockResolvedValue(mockCustomer);
      render(<CustomerForm />);

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });

      const submitButton = screen.getByRole('button', { name: /create customer/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCustomerApi.createCustomer).toHaveBeenCalled();
      });

      // Should not throw error when onSuccess is undefined
    });
  });

  describe('Toast Notifications', () => {
    it('should show success toast when customer is created', async () => {
      mockCustomerApi.createCustomer.mockResolvedValue(mockCustomer);
      render(<CustomerForm />);

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });

      const submitButton = screen.getByRole('button', { name: /create customer/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Customer created successfully',
          description: 'John Doe has been added.',
        });
      });
    });

    it('should show error toast with validation errors message', async () => {
      const serverError = new ApiError('Validation failed', 400, {
        Name: ['Name must be at least 2 characters'],
      });
      mockCustomerApi.createCustomer.mockRejectedValue(serverError);
      render(<CustomerForm />);

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'J' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } });

      const submitButton = screen.getByRole('button', { name: /create customer/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Failed to create customer',
          description: 'Please fix the validation errors and try again.',
          variant: 'destructive',
        });
      });
    });

    it('should show error toast for duplicate email error', async () => {
      const duplicateError = new ApiError('A customer with this email already exists', 409);
      mockCustomerApi.createCustomer.mockRejectedValue(duplicateError);
      render(<CustomerForm />);

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });

      const submitButton = screen.getByRole('button', { name: /create customer/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Failed to create customer',
          description: 'A customer with this email already exists',
          variant: 'destructive',
        });
      });
    });

    it('should show error toast for unknown errors', async () => {
      mockCustomerApi.createCustomer.mockRejectedValue(new Error('Unknown error'));
      render(<CustomerForm />);

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });

      const submitButton = screen.getByRole('button', { name: /create customer/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Failed to create customer',
          description: 'An unexpected error occurred. Please try again.',
          variant: 'destructive',
        });
      });
    });

    it('should show toast in addition to inline validation errors', async () => {
      const serverError = new ApiError('Validation failed', 400, {
        Name: ['Name must be at least 2 characters'],
        Email: ['Email format is invalid'],
      });
      mockCustomerApi.createCustomer.mockRejectedValue(serverError);
      render(<CustomerForm />);

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'J' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } });

      const submitButton = screen.getByRole('button', { name: /create customer/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        // Check that inline errors are displayed
        expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();
        expect(screen.getByText(/email format is invalid/i)).toBeInTheDocument();

        // Check that toast was also called
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Failed to create customer',
          description: 'Please fix the validation errors and try again.',
          variant: 'destructive',
        });
      });
    });

    it('should use destructive variant for error toasts', async () => {
      const serverError = new ApiError('Server error', 500);
      mockCustomerApi.createCustomer.mockRejectedValue(serverError);
      render(<CustomerForm />);

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });

      const submitButton = screen.getByRole('button', { name: /create customer/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            variant: 'destructive',
          })
        );
      });
    });
  });
});
