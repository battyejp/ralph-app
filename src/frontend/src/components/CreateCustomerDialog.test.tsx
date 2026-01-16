import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CreateCustomerDialog } from './CreateCustomerDialog';
import { customerApi, ApiError } from '@/lib/api/customerApi';
import type { Customer } from '@/lib/api/types';

// Mock the customer API
jest.mock('@/lib/api/customerApi');

// Mock useToast hook
const mockToast = jest.fn();
jest.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    toast: mockToast,
    toasts: [],
    dismiss: jest.fn(),
  }),
}));

const mockCreatedCustomer: Customer = {
  id: '123',
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1-555-1234',
  address: '123 Main St',
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-15T10:30:00Z',
};

describe('CreateCustomerDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Dialog Rendering', () => {
    it('should not render when open is false', () => {
      const mockOnOpenChange = jest.fn();
      render(
        <CreateCustomerDialog
          open={false}
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render dialog with correct title when open is true', () => {
      const mockOnOpenChange = jest.fn();
      render(
        <CreateCustomerDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Create New Customer')).toBeInTheDocument();
      expect(screen.getByText(/Fill in the details below to add a new customer/)).toBeInTheDocument();
    });

    it('should render link to dedicated page', () => {
      const mockOnOpenChange = jest.fn();
      render(
        <CreateCustomerDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const fullFormLink = screen.getByRole('link', { name: /Open full form/i });
      expect(fullFormLink).toBeInTheDocument();
      expect(fullFormLink).toHaveAttribute('href', '/customers/new');
    });

    it('should close dialog when clicking the dedicated page link', () => {
      const mockOnOpenChange = jest.fn();
      render(
        <CreateCustomerDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const fullFormLink = screen.getByRole('link', { name: /Open full form/i });
      fireEvent.click(fullFormLink);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should render CustomerForm inside the dialog', () => {
      const mockOnOpenChange = jest.fn();
      render(
        <CreateCustomerDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      // Check that form fields are present (from CustomerForm)
      expect(screen.getByLabelText(/Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Phone/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Address/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Create Customer/i })).toBeInTheDocument();
    });

    it('should have a close button', () => {
      const mockOnOpenChange = jest.fn();
      render(
        <CreateCustomerDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      // Check for close button (should have sr-only text "Close")
      const closeButton = screen.getByText('Close');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Form Submission Success', () => {
    it('should close dialog when customer is created successfully', async () => {
      const mockOnOpenChange = jest.fn();
      const mockOnCustomerCreated = jest.fn();
      (customerApi.createCustomer as jest.Mock).mockResolvedValue(mockCreatedCustomer);

      render(
        <CreateCustomerDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onCustomerCreated={mockOnCustomerCreated}
        />
      );

      // Fill in the form
      fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'john.doe@example.com' } });

      // Submit the form
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Create Customer/i }));
      });

      // Wait for the API call and dialog close
      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('should call onCustomerCreated callback with created customer', async () => {
      const mockOnOpenChange = jest.fn();
      const mockOnCustomerCreated = jest.fn();
      (customerApi.createCustomer as jest.Mock).mockResolvedValue(mockCreatedCustomer);

      render(
        <CreateCustomerDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onCustomerCreated={mockOnCustomerCreated}
        />
      );

      // Fill in the form
      fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'john.doe@example.com' } });

      // Submit the form
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Create Customer/i }));
      });

      // Wait for the callback to be called
      await waitFor(() => {
        expect(mockOnCustomerCreated).toHaveBeenCalledWith(mockCreatedCustomer);
      });
    });

    it('should work without onCustomerCreated callback', async () => {
      const mockOnOpenChange = jest.fn();
      (customerApi.createCustomer as jest.Mock).mockResolvedValue(mockCreatedCustomer);

      render(
        <CreateCustomerDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      // Fill in the form
      fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'john.doe@example.com' } });

      // Submit the form
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Create Customer/i }));
      });

      // Should still close the dialog without error
      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('Form Submission Failure', () => {
    it('should not close dialog when form validation fails', async () => {
      const mockOnOpenChange = jest.fn();
      const mockOnCustomerCreated = jest.fn();

      render(
        <CreateCustomerDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onCustomerCreated={mockOnCustomerCreated}
        />
      );

      // Submit without filling in required fields
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Create Customer/i }));
      });

      // Dialog should stay open (onOpenChange should not be called with false)
      expect(mockOnOpenChange).not.toHaveBeenCalledWith(false);
      expect(mockOnCustomerCreated).not.toHaveBeenCalled();
    });

    it('should not close dialog when API call fails', async () => {
      const mockOnOpenChange = jest.fn();
      const mockOnCustomerCreated = jest.fn();
      (customerApi.createCustomer as jest.Mock).mockRejectedValue(
        new ApiError('Server error', 500)
      );

      render(
        <CreateCustomerDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onCustomerCreated={mockOnCustomerCreated}
        />
      );

      // Fill in the form
      fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'john.doe@example.com' } });

      // Submit the form
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Create Customer/i }));
      });

      // Wait for the API call to complete
      await waitFor(() => {
        expect(customerApi.createCustomer).toHaveBeenCalled();
      });

      // Dialog should stay open
      expect(mockOnOpenChange).not.toHaveBeenCalledWith(false);
      expect(mockOnCustomerCreated).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria roles', () => {
      const mockOnOpenChange = jest.fn();
      render(
        <CreateCustomerDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have proper dialog title for screen readers', () => {
      const mockOnOpenChange = jest.fn();
      render(
        <CreateCustomerDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      // Dialog should have a heading
      expect(screen.getByRole('heading', { name: 'Create New Customer' })).toBeInTheDocument();
    });
  });

  describe('Desktop and Mobile Visibility', () => {
    it('should render form with full fields on all screen sizes', () => {
      const mockOnOpenChange = jest.fn();
      render(
        <CreateCustomerDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      // All form fields should be present regardless of screen size
      expect(screen.getByLabelText(/Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Phone/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Address/)).toBeInTheDocument();
    });
  });

  describe('Dialog State Management', () => {
    it('should reset form when dialog is reopened after success', async () => {
      const mockOnOpenChange = jest.fn();
      const mockOnCustomerCreated = jest.fn();
      (customerApi.createCustomer as jest.Mock).mockResolvedValue(mockCreatedCustomer);

      const { rerender } = render(
        <CreateCustomerDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onCustomerCreated={mockOnCustomerCreated}
        />
      );

      // Fill in some data
      fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'john.doe@example.com' } });

      // Submit and wait for success
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Create Customer/i }));
      });

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });

      // Close and reopen the dialog
      rerender(
        <CreateCustomerDialog
          open={false}
          onOpenChange={mockOnOpenChange}
          onCustomerCreated={mockOnCustomerCreated}
        />
      );

      rerender(
        <CreateCustomerDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onCustomerCreated={mockOnCustomerCreated}
        />
      );

      // Form should be empty (CustomerForm resets on successful submission)
      expect(screen.getByLabelText(/Name/)).toHaveValue('');
      expect(screen.getByLabelText(/Email/)).toHaveValue('');
    });
  });
});
