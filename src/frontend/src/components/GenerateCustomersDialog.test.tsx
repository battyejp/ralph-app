import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GenerateCustomersDialog } from './GenerateCustomersDialog';
import type { BulkCreateResponse } from '@/lib/api/types';

// Import the real ApiError class and the customerApi
import { customerApi, ApiError } from '@/lib/api/customerApi';

// Mock only the customerApi methods, not the whole module
jest.mock('@/lib/api/customerApi', () => {
  const actual = jest.requireActual('@/lib/api/customerApi');
  return {
    ...actual,
    customerApi: {
      bulkCreateRandom: jest.fn(),
    },
  };
});

const mockBulkCreateResponse: BulkCreateResponse = {
  successCount: 10,
  failureCount: 0,
  createdCustomers: [],
  errors: [],
};

const mockPartialFailureResponse: BulkCreateResponse = {
  successCount: 8,
  failureCount: 2,
  createdCustomers: [],
  errors: [
    { index: 3, message: 'Email already exists' },
    { index: 7, message: 'Email already exists' },
  ],
};

describe('GenerateCustomersDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Dialog Rendering', () => {
    it('should not render when open is false', () => {
      const mockOnOpenChange = jest.fn();
      render(
        <GenerateCustomersDialog
          open={false}
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render dialog with correct title when open is true', () => {
      const mockOnOpenChange = jest.fn();
      render(
        <GenerateCustomersDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Generate Random Customers')).toBeInTheDocument();
      expect(screen.getByText(/Create multiple random customers at once/)).toBeInTheDocument();
    });

    it('should render number input with proper attributes', () => {
      const mockOnOpenChange = jest.fn();
      render(
        <GenerateCustomersDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const input = screen.getByLabelText(/Number of Customers/);
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'number');
      expect(input).toHaveAttribute('min', '1');
      expect(input).toHaveAttribute('max', '1000');
      expect(input).toHaveAttribute('placeholder', 'Enter a number between 1 and 1000');
    });

    it('should render Cancel and Generate buttons', () => {
      const mockOnOpenChange = jest.fn();
      render(
        <GenerateCustomersDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Generate/i })).toBeInTheDocument();
    });

    it('should have a close button', () => {
      const mockOnOpenChange = jest.fn();
      render(
        <GenerateCustomersDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const closeButton = screen.getByText('Close');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Input Validation', () => {
    it('should not show error for empty input (empty is allowed before blur)', () => {
      const mockOnOpenChange = jest.fn();
      render(
        <GenerateCustomersDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const input = screen.getByLabelText(/Number of Customers/);

      // Empty input should not show error until blur
      expect(screen.queryByText('Please enter a number')).not.toBeInTheDocument();

      // Button should be disabled for empty input
      const generateButton = screen.getByRole('button', { name: /Generate/i });
      expect(generateButton).toBeDisabled();
    });

    it('should disable button for non-numeric input', () => {
      const mockOnOpenChange = jest.fn();
      render(
        <GenerateCustomersDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const input = screen.getByLabelText(/Number of Customers/) as HTMLInputElement;
      const generateButton = screen.getByRole('button', { name: /Generate/i });

      // Number inputs ignore non-numeric text, resulting in empty value
      fireEvent.change(input, { target: { value: '' } });

      // Button should be disabled for empty/invalid input
      expect(generateButton).toBeDisabled();
    });

    it('should show error for non-integer input on blur', () => {
      const mockOnOpenChange = jest.fn();
      render(
        <GenerateCustomersDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const input = screen.getByLabelText(/Number of Customers/);

      fireEvent.change(input, { target: { value: '10.5' } });
      fireEvent.blur(input);

      expect(screen.getByText('Please enter a whole number')).toBeInTheDocument();
    });

    it('should show error for count less than 1 on blur', () => {
      const mockOnOpenChange = jest.fn();
      render(
        <GenerateCustomersDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const input = screen.getByLabelText(/Number of Customers/);

      fireEvent.change(input, { target: { value: '0' } });
      fireEvent.blur(input);

      expect(screen.getByText('Minimum is 1 customer')).toBeInTheDocument();
    });

    it('should show error for count greater than 1000 on blur', () => {
      const mockOnOpenChange = jest.fn();
      render(
        <GenerateCustomersDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const input = screen.getByLabelText(/Number of Customers/);

      fireEvent.change(input, { target: { value: '1001' } });
      fireEvent.blur(input);

      expect(screen.getByText('Maximum is 1000 customers')).toBeInTheDocument();
    });

    it('should clear error when user starts typing', () => {
      const mockOnOpenChange = jest.fn();
      render(
        <GenerateCustomersDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const input = screen.getByLabelText(/Number of Customers/);

      // Trigger an error
      fireEvent.change(input, { target: { value: '0' } });
      fireEvent.blur(input);
      expect(screen.getByText('Minimum is 1 customer')).toBeInTheDocument();

      // Start typing a valid value
      fireEvent.change(input, { target: { value: '10' } });
      expect(screen.queryByText('Minimum is 1 customer')).not.toBeInTheDocument();
    });
  });

  describe('Button State', () => {
    it('should disable Generate button when input is invalid', () => {
      const mockOnOpenChange = jest.fn();
      render(
        <GenerateCustomersDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const generateButton = screen.getByRole('button', { name: /Generate/i });

      // Empty input - button should be disabled
      expect(generateButton).toBeDisabled();

      const input = screen.getByLabelText(/Number of Customers/);

      // Invalid input - button should be disabled
      fireEvent.change(input, { target: { value: '0' } });
      expect(generateButton).toBeDisabled();

      fireEvent.change(input, { target: { value: '1001' } });
      expect(generateButton).toBeDisabled();

      // Valid input - button should be enabled
      fireEvent.change(input, { target: { value: '10' } });
      expect(generateButton).not.toBeDisabled();
    });

    it('should disable both buttons while loading', async () => {
      const mockOnOpenChange = jest.fn();
      (customerApi.bulkCreateRandom as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockBulkCreateResponse), 100))
      );

      render(
        <GenerateCustomersDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const input = screen.getByLabelText(/Number of Customers/);
      const generateButton = screen.getByRole('button', { name: /Generate/i });
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });

      // Enter valid count
      fireEvent.change(input, { target: { value: '10' } });

      // Click generate
      await act(async () => {
        fireEvent.click(generateButton);
      });

      // Both buttons should be disabled while loading
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Generating.../i })).toBeDisabled();
        expect(cancelButton).toBeDisabled();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading message while generating', async () => {
      const mockOnOpenChange = jest.fn();
      (customerApi.bulkCreateRandom as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockBulkCreateResponse), 100))
      );

      render(
        <GenerateCustomersDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const input = screen.getByLabelText(/Number of Customers/);
      const generateButton = screen.getByRole('button', { name: /Generate/i });

      fireEvent.change(input, { target: { value: '50' } });

      await act(async () => {
        fireEvent.click(generateButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Creating 50 customers...')).toBeInTheDocument();
      });
    });

    it('should show "Generating..." on button while loading', async () => {
      const mockOnOpenChange = jest.fn();
      (customerApi.bulkCreateRandom as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockBulkCreateResponse), 100))
      );

      render(
        <GenerateCustomersDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const input = screen.getByLabelText(/Number of Customers/);
      const generateButton = screen.getByRole('button', { name: /Generate/i });

      fireEvent.change(input, { target: { value: '10' } });

      await act(async () => {
        fireEvent.click(generateButton);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Generating.../i })).toBeInTheDocument();
      });
    });

    it('should disable input while loading', async () => {
      const mockOnOpenChange = jest.fn();
      (customerApi.bulkCreateRandom as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockBulkCreateResponse), 100))
      );

      render(
        <GenerateCustomersDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const input = screen.getByLabelText(/Number of Customers/) as HTMLInputElement;
      const generateButton = screen.getByRole('button', { name: /Generate/i });

      fireEvent.change(input, { target: { value: '10' } });

      await act(async () => {
        fireEvent.click(generateButton);
      });

      await waitFor(() => {
        expect(input).toBeDisabled();
      });
    });
  });

  describe('Successful Generation', () => {
    it('should call API with correct count', async () => {
      const mockOnOpenChange = jest.fn();
      const mockOnSuccess = jest.fn();
      (customerApi.bulkCreateRandom as jest.Mock).mockResolvedValue(mockBulkCreateResponse);

      render(
        <GenerateCustomersDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByLabelText(/Number of Customers/);
      const generateButton = screen.getByRole('button', { name: /Generate/i });

      fireEvent.change(input, { target: { value: '100' } });

      await act(async () => {
        fireEvent.click(generateButton);
      });

      await waitFor(() => {
        expect(customerApi.bulkCreateRandom).toHaveBeenCalledWith(100);
      });
    });

    it('should close dialog on successful generation', async () => {
      const mockOnOpenChange = jest.fn();
      (customerApi.bulkCreateRandom as jest.Mock).mockResolvedValue(mockBulkCreateResponse);

      render(
        <GenerateCustomersDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const input = screen.getByLabelText(/Number of Customers/);
      const generateButton = screen.getByRole('button', { name: /Generate/i });

      fireEvent.change(input, { target: { value: '10' } });

      await act(async () => {
        fireEvent.click(generateButton);
      });

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('should call onSuccess callback with response', async () => {
      const mockOnOpenChange = jest.fn();
      const mockOnSuccess = jest.fn();
      (customerApi.bulkCreateRandom as jest.Mock).mockResolvedValue(mockBulkCreateResponse);

      render(
        <GenerateCustomersDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByLabelText(/Number of Customers/);
      const generateButton = screen.getByRole('button', { name: /Generate/i });

      fireEvent.change(input, { target: { value: '10' } });

      await act(async () => {
        fireEvent.click(generateButton);
      });

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(mockBulkCreateResponse);
      });
    });

    it('should work without onSuccess callback', async () => {
      const mockOnOpenChange = jest.fn();
      (customerApi.bulkCreateRandom as jest.Mock).mockResolvedValue(mockBulkCreateResponse);

      render(
        <GenerateCustomersDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const input = screen.getByLabelText(/Number of Customers/);
      const generateButton = screen.getByRole('button', { name: /Generate/i });

      fireEvent.change(input, { target: { value: '10' } });

      await act(async () => {
        fireEvent.click(generateButton);
      });

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('should reset form after successful generation', async () => {
      const mockOnOpenChange = jest.fn();
      const mockOnSuccess = jest.fn();
      (customerApi.bulkCreateRandom as jest.Mock).mockResolvedValue(mockBulkCreateResponse);

      const { rerender } = render(
        <GenerateCustomersDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByLabelText(/Number of Customers/) as HTMLInputElement;
      const generateButton = screen.getByRole('button', { name: /Generate/i });

      fireEvent.change(input, { target: { value: '50' } });

      await act(async () => {
        fireEvent.click(generateButton);
      });

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });

      // Reopen the dialog
      rerender(
        <GenerateCustomersDialog
          open={false}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      rerender(
        <GenerateCustomersDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const newInput = screen.getByLabelText(/Number of Customers/) as HTMLInputElement;
      expect(newInput.value).toBe('');
    });

    it('should handle partial failure response', async () => {
      const mockOnOpenChange = jest.fn();
      const mockOnSuccess = jest.fn();
      (customerApi.bulkCreateRandom as jest.Mock).mockResolvedValue(mockPartialFailureResponse);

      render(
        <GenerateCustomersDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByLabelText(/Number of Customers/);
      const generateButton = screen.getByRole('button', { name: /Generate/i });

      fireEvent.change(input, { target: { value: '10' } });

      await act(async () => {
        fireEvent.click(generateButton);
      });

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(mockPartialFailureResponse);
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('Failed Generation', () => {
    it('should show error message when API call fails', async () => {
      const mockOnOpenChange = jest.fn();
      const mockOnSuccess = jest.fn();
      (customerApi.bulkCreateRandom as jest.Mock).mockRejectedValue(
        new ApiError('Server error', 500)
      );

      render(
        <GenerateCustomersDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByLabelText(/Number of Customers/);
      const generateButton = screen.getByRole('button', { name: /Generate/i });

      fireEvent.change(input, { target: { value: '10' } });

      await act(async () => {
        fireEvent.click(generateButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });
    });

    it('should show generic error message for non-Error exceptions', async () => {
      const mockOnOpenChange = jest.fn();
      const mockOnSuccess = jest.fn();
      (customerApi.bulkCreateRandom as jest.Mock).mockRejectedValue('Unknown error');

      render(
        <GenerateCustomersDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByLabelText(/Number of Customers/);
      const generateButton = screen.getByRole('button', { name: /Generate/i });

      fireEvent.change(input, { target: { value: '10' } });

      await act(async () => {
        fireEvent.click(generateButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to generate customers. Please try again.')).toBeInTheDocument();
      });
    });

    it('should not close dialog when API call fails', async () => {
      const mockOnOpenChange = jest.fn();
      const mockOnSuccess = jest.fn();
      (customerApi.bulkCreateRandom as jest.Mock).mockRejectedValue(
        new ApiError('Server error', 500)
      );

      render(
        <GenerateCustomersDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByLabelText(/Number of Customers/);
      const generateButton = screen.getByRole('button', { name: /Generate/i });

      fireEvent.change(input, { target: { value: '10' } });

      await act(async () => {
        fireEvent.click(generateButton);
      });

      await waitFor(() => {
        expect(customerApi.bulkCreateRandom).toHaveBeenCalled();
      });

      // Dialog should stay open
      expect(mockOnOpenChange).not.toHaveBeenCalledWith(false);
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('should re-enable buttons after error', async () => {
      const mockOnOpenChange = jest.fn();
      (customerApi.bulkCreateRandom as jest.Mock).mockRejectedValue(
        new ApiError('Server error', 500)
      );

      render(
        <GenerateCustomersDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const input = screen.getByLabelText(/Number of Customers/);
      const generateButton = screen.getByRole('button', { name: /Generate/i });

      fireEvent.change(input, { target: { value: '10' } });

      await act(async () => {
        fireEvent.click(generateButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });

      // Buttons should be re-enabled
      expect(screen.getByRole('button', { name: /Generate/i })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: /Cancel/i })).not.toBeDisabled();
    });
  });

  describe('Cancel Button', () => {
    it('should close dialog when Cancel is clicked', () => {
      const mockOnOpenChange = jest.fn();
      render(
        <GenerateCustomersDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should reset form when Cancel is clicked', () => {
      const mockOnOpenChange = jest.fn();
      render(
        <GenerateCustomersDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const input = screen.getByLabelText(/Number of Customers/) as HTMLInputElement;
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });

      // Enter a value and trigger an error
      fireEvent.change(input, { target: { value: '0' } });
      fireEvent.blur(input);
      expect(screen.getByText('Minimum is 1 customer')).toBeInTheDocument();

      // Click cancel
      fireEvent.click(cancelButton);

      // Should close the dialog
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should not call onSuccess when cancelled', () => {
      const mockOnOpenChange = jest.fn();
      const mockOnSuccess = jest.fn();
      render(
        <GenerateCustomersDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria roles', () => {
      const mockOnOpenChange = jest.fn();
      render(
        <GenerateCustomersDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have proper dialog title for screen readers', () => {
      const mockOnOpenChange = jest.fn();
      render(
        <GenerateCustomersDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(screen.getByRole('heading', { name: 'Generate Random Customers' })).toBeInTheDocument();
    });

    it('should have aria-invalid when there is an error', () => {
      const mockOnOpenChange = jest.fn();
      render(
        <GenerateCustomersDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const input = screen.getByLabelText(/Number of Customers/);

      // Trigger an error via blur
      fireEvent.change(input, { target: { value: '0' } });
      fireEvent.blur(input);

      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby', 'count-error');
    });

    it('should not have aria-invalid when there is no error', () => {
      const mockOnOpenChange = jest.fn();
      render(
        <GenerateCustomersDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const input = screen.getByLabelText(/Number of Customers/);

      expect(input).toHaveAttribute('aria-invalid', 'false');
      expect(input).not.toHaveAttribute('aria-describedby');
    });
  });

  describe('Edge Cases', () => {
    it('should handle count of 1 (minimum)', async () => {
      const mockOnOpenChange = jest.fn();
      const mockOnSuccess = jest.fn();
      (customerApi.bulkCreateRandom as jest.Mock).mockResolvedValue(mockBulkCreateResponse);

      render(
        <GenerateCustomersDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByLabelText(/Number of Customers/);
      const generateButton = screen.getByRole('button', { name: /Generate/i });

      fireEvent.change(input, { target: { value: '1' } });

      expect(generateButton).not.toBeDisabled();

      await act(async () => {
        fireEvent.click(generateButton);
      });

      await waitFor(() => {
        expect(customerApi.bulkCreateRandom).toHaveBeenCalledWith(1);
      });
    });

    it('should handle count of 1000 (maximum)', async () => {
      const mockOnOpenChange = jest.fn();
      const mockOnSuccess = jest.fn();
      (customerApi.bulkCreateRandom as jest.Mock).mockResolvedValue(mockBulkCreateResponse);

      render(
        <GenerateCustomersDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByLabelText(/Number of Customers/);
      const generateButton = screen.getByRole('button', { name: /Generate/i });

      fireEvent.change(input, { target: { value: '1000' } });

      expect(generateButton).not.toBeDisabled();

      await act(async () => {
        fireEvent.click(generateButton);
      });

      await waitFor(() => {
        expect(customerApi.bulkCreateRandom).toHaveBeenCalledWith(1000);
      });
    });

    it('should handle negative numbers', () => {
      const mockOnOpenChange = jest.fn();
      render(
        <GenerateCustomersDialog
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const input = screen.getByLabelText(/Number of Customers/);

      fireEvent.change(input, { target: { value: '-5' } });
      fireEvent.blur(input);

      expect(screen.getByText('Minimum is 1 customer')).toBeInTheDocument();
    });
  });
});
