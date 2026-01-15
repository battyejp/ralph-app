import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CustomerDetailsDialog } from './CustomerDetailsDialog';
import { customerApi, ApiError } from '@/lib/api/customerApi';
import type { Customer } from '@/lib/api/types';

// Mock the customer API
jest.mock('@/lib/api/customerApi');

const mockCustomer: Customer = {
  id: '123',
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1-555-1234',
  address: '123 Main St, Anytown, USA',
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-20T15:45:00Z',
};

const mockCustomerWithNulls: Customer = {
  id: '456',
  name: 'Jane Smith',
  email: 'jane.smith@example.com',
  phone: null,
  address: null,
  createdAt: '2024-02-01T08:00:00Z',
  updatedAt: '2024-02-01T08:00:00Z',
};

describe('CustomerDetailsDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Dialog Rendering', () => {
    it('should not render when open is false', () => {
      const mockOnOpenChange = jest.fn();
      render(
        <CustomerDetailsDialog
          customerId="123"
          open={false}
          onOpenChange={mockOnOpenChange}
        />
      );

      // Dialog should not be visible
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render dialog header when open is true', () => {
      const mockOnOpenChange = jest.fn();
      (customerApi.getCustomerById as jest.Mock).mockResolvedValue(mockCustomer);

      render(
        <CustomerDetailsDialog
          customerId="123"
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(screen.getByText('Customer Details')).toBeInTheDocument();
      expect(screen.getByText('View complete customer information')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading state when fetching customer details', () => {
      const mockOnOpenChange = jest.fn();
      (customerApi.getCustomerById as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(
        <CustomerDetailsDialog
          customerId="123"
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(screen.getByText('Loading customer details...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should call customerApi.getCustomerById when dialog opens with customerId', async () => {
      const mockOnOpenChange = jest.fn();
      (customerApi.getCustomerById as jest.Mock).mockResolvedValue(mockCustomer);

      render(
        <CustomerDetailsDialog
          customerId="123"
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      await waitFor(() => {
        expect(customerApi.getCustomerById).toHaveBeenCalledWith('123');
      });
    });

    it('should not call API when customerId is null', () => {
      const mockOnOpenChange = jest.fn();

      render(
        <CustomerDetailsDialog
          customerId={null}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(customerApi.getCustomerById).not.toHaveBeenCalled();
    });

    it('should not call API when open is false', () => {
      const mockOnOpenChange = jest.fn();

      render(
        <CustomerDetailsDialog
          customerId="123"
          open={false}
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(customerApi.getCustomerById).not.toHaveBeenCalled();
    });
  });

  describe('Success State - Display All Fields', () => {
    it('should display all customer fields when loaded successfully', async () => {
      const mockOnOpenChange = jest.fn();
      (customerApi.getCustomerById as jest.Mock).mockResolvedValue(mockCustomer);

      render(
        <CustomerDetailsDialog
          customerId="123"
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Check all fields are displayed
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();

      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();

      expect(screen.getByText('Phone')).toBeInTheDocument();
      expect(screen.getByText('+1-555-1234')).toBeInTheDocument();

      expect(screen.getByText('Address')).toBeInTheDocument();
      expect(screen.getByText('123 Main St, Anytown, USA')).toBeInTheDocument();

      expect(screen.getByText('Created At')).toBeInTheDocument();
      expect(screen.getByText('Updated At')).toBeInTheDocument();
    });

    it('should format dates correctly', async () => {
      const mockOnOpenChange = jest.fn();
      (customerApi.getCustomerById as jest.Mock).mockResolvedValue(mockCustomer);

      render(
        <CustomerDetailsDialog
          customerId="123"
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Check that dates are formatted (contains year, month, etc.)
      const dateElements = screen.getAllByText(/January|February|2024/);
      expect(dateElements.length).toBeGreaterThan(0);
    });
  });

  describe('Success State - Handle Null Fields', () => {
    it('should display N/A for null phone field', async () => {
      const mockOnOpenChange = jest.fn();
      (customerApi.getCustomerById as jest.Mock).mockResolvedValue(mockCustomerWithNulls);

      render(
        <CustomerDetailsDialog
          customerId="456"
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      expect(screen.getByText('Phone')).toBeInTheDocument();
      const naElements = screen.getAllByText('N/A');
      expect(naElements.length).toBe(2); // Phone and Address should both be N/A
    });

    it('should display N/A for null address field', async () => {
      const mockOnOpenChange = jest.fn();
      (customerApi.getCustomerById as jest.Mock).mockResolvedValue(mockCustomerWithNulls);

      render(
        <CustomerDetailsDialog
          customerId="456"
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      expect(screen.getByText('Address')).toBeInTheDocument();
      const naElements = screen.getAllByText('N/A');
      expect(naElements.length).toBe(2); // Phone and Address should both be N/A
    });
  });

  describe('Error State', () => {
    it('should display error message for network failures', async () => {
      const mockOnOpenChange = jest.fn();
      (customerApi.getCustomerById as jest.Mock).mockRejectedValue(
        new Error('Unknown error')
      );

      render(
        <CustomerDetailsDialog
          customerId="123"
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      // Use findBy which handles async waiting automatically
      expect(await screen.findByText('Failed to load customer details. Please try again.')).toBeInTheDocument();
    });
  });

  describe('Dialog State Management', () => {
    it('should reset state when dialog is closed', async () => {
      const mockOnOpenChange = jest.fn();
      (customerApi.getCustomerById as jest.Mock).mockResolvedValue(mockCustomer);

      const { rerender } = render(
        <CustomerDetailsDialog
          customerId="123"
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      // Wait for customer to load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Close the dialog
      rerender(
        <CustomerDetailsDialog
          customerId="123"
          open={false}
          onOpenChange={mockOnOpenChange}
        />
      );

      // Reopen with a different customer
      (customerApi.getCustomerById as jest.Mock).mockResolvedValue(mockCustomerWithNulls);
      rerender(
        <CustomerDetailsDialog
          customerId="456"
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      // Should load the new customer
      await waitFor(() => {
        expect(customerApi.getCustomerById).toHaveBeenCalledWith('456');
      });
    });

    it('should reload data when customerId changes while dialog is open', async () => {
      const mockOnOpenChange = jest.fn();
      (customerApi.getCustomerById as jest.Mock).mockResolvedValue(mockCustomer);

      const { rerender } = render(
        <CustomerDetailsDialog
          customerId="123"
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      await waitFor(() => {
        expect(customerApi.getCustomerById).toHaveBeenCalledWith('123');
      });

      // Change customer ID while dialog is still open
      (customerApi.getCustomerById as jest.Mock).mockResolvedValue(mockCustomerWithNulls);
      rerender(
        <CustomerDetailsDialog
          customerId="456"
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      await waitFor(() => {
        expect(customerApi.getCustomerById).toHaveBeenCalledWith('456');
      });
    });
  });

  describe('Close Button', () => {
    it('should have a close button in the dialog', async () => {
      const mockOnOpenChange = jest.fn();
      (customerApi.getCustomerById as jest.Mock).mockResolvedValue(mockCustomer);

      render(
        <CustomerDetailsDialog
          customerId="123"
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Check for close button (should have sr-only text "Close")
      const closeButton = screen.getByText('Close');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria labels and roles', async () => {
      const mockOnOpenChange = jest.fn();
      (customerApi.getCustomerById as jest.Mock).mockResolvedValue(mockCustomer);

      render(
        <CustomerDetailsDialog
          customerId="123"
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Dialog should have proper role
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have field labels for all customer data', async () => {
      const mockOnOpenChange = jest.fn();
      (customerApi.getCustomerById as jest.Mock).mockResolvedValue(mockCustomer);

      render(
        <CustomerDetailsDialog
          customerId="123"
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // All fields should have labels
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Phone')).toBeInTheDocument();
      expect(screen.getByText('Address')).toBeInTheDocument();
      expect(screen.getByText('Created At')).toBeInTheDocument();
      expect(screen.getByText('Updated At')).toBeInTheDocument();
    });
  });
});
