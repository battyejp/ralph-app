import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from './page';
import { customerApi, ApiError } from '@/lib/api/customerApi';
import type { BulkCreateResponse, PaginatedResponse, Customer } from '@/lib/api/types';

// Mock the customer API
jest.mock('@/lib/api/customerApi', () => {
  const actual = jest.requireActual('@/lib/api/customerApi');
  return {
    ...actual,
    customerApi: {
      searchCustomers: jest.fn(),
      bulkCreateRandom: jest.fn(),
    },
  };
});

// Mock next/navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => mockSearchParams,
}));

// Mock useToast hook
const mockToast = jest.fn();
jest.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    toast: mockToast,
    toasts: [],
    dismiss: jest.fn(),
  }),
}));

const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1-555-1234',
    address: '123 Main St',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+1-555-5678',
    address: '456 Oak Ave',
    createdAt: '2024-01-16T14:00:00Z',
    updatedAt: '2024-01-16T14:00:00Z',
  },
];

const mockSearchResponse: PaginatedResponse<Customer> = {
  items: mockCustomers,
  page: 1,
  pageSize: 25,
  totalPages: 1,
  totalCount: 2,
};

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

describe('Home Page - Bulk Generate Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams.delete('page');
    mockSearchParams.delete('pageSize');
    mockSearchParams.delete('sortBy');
    mockSearchParams.delete('sortOrder');
    mockSearchParams.delete('showCustomer');
  });

  describe('Generate Random Customers Button', () => {
    it('should render Generate Random Customers button', () => {
      render(<Home />);

      const generateButton = screen.getByRole('button', { name: /Generate Random Customers/i });
      expect(generateButton).toBeInTheDocument();
    });

    it('should render Generate Random Customers button with outline variant', () => {
      const { container } = render(<Home />);

      const generateButton = screen.getByRole('button', { name: /Generate Random Customers/i });
      // The button should have the outline variant class (from shadcn/ui Button component)
      expect(generateButton.className).toContain('outline');
    });

    it('should open GenerateCustomersDialog when Generate Random Customers button is clicked', async () => {
      render(<Home />);

      const generateButton = screen.getByRole('button', { name: /Generate Random Customers/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Generate Random Customers' })).toBeInTheDocument();
      });
    });
  });

  describe('Bulk Generation Success - Full Success', () => {
    it('should show success toast on successful bulk generation', async () => {
      (customerApi.bulkCreateRandom as jest.Mock).mockResolvedValue(mockBulkCreateResponse);

      render(<Home />);

      // Open the generate dialog
      const generateButton = screen.getByRole('button', { name: /Generate Random Customers/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Fill in the count and submit
      const countInput = screen.getByLabelText(/Number of Customers/);
      fireEvent.change(countInput, { target: { value: '10' } });

      const submitButton = screen.getByRole('button', { name: /Generate/i });
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: 'default',
          title: 'Success',
          description: 'Successfully created 10 customers',
        });
      });
    });

    it('should close dialog on successful bulk generation', async () => {
      (customerApi.bulkCreateRandom as jest.Mock).mockResolvedValue(mockBulkCreateResponse);

      render(<Home />);

      // Open the generate dialog
      const generateButton = screen.getByRole('button', { name: /Generate Random Customers/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Fill in the count and submit
      const countInput = screen.getByLabelText(/Number of Customers/);
      fireEvent.change(countInput, { target: { value: '10' } });

      const submitButton = screen.getByRole('button', { name: /Generate/i });
      await act(async () => {
        fireEvent.click(submitButton);
      });

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Bulk Generation Success - Partial Failure', () => {
    it('should show partial failure toast when some customers fail', async () => {
      (customerApi.bulkCreateRandom as jest.Mock).mockResolvedValue(mockPartialFailureResponse);

      render(<Home />);

      // Open the generate dialog
      const generateButton = screen.getByRole('button', { name: /Generate Random Customers/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Fill in the count and submit
      const countInput = screen.getByLabelText(/Number of Customers/);
      fireEvent.change(countInput, { target: { value: '10' } });

      const submitButton = screen.getByRole('button', { name: /Generate/i });
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: 'default',
          title: 'Bulk Creation Completed',
          description: 'Created 8 customers. 2 failed.',
        });
      });
    });
  });

  describe('Customer List Refresh After Bulk Generation', () => {
    it('should refresh customer list after successful bulk generation if search was performed', async () => {
      (customerApi.searchCustomers as jest.Mock).mockResolvedValue(mockSearchResponse);
      (customerApi.bulkCreateRandom as jest.Mock).mockResolvedValue(mockBulkCreateResponse);

      render(<Home />);

      // Perform a search first
      const searchInput = screen.getByPlaceholderText(/Search by name or email/i);
      fireEvent.change(searchInput, { target: { value: 'John' } });

      const searchButton = screen.getByRole('button', { name: /Search/i });
      await act(async () => {
        fireEvent.click(searchButton);
      });

      await waitFor(() => {
        expect(customerApi.searchCustomers).toHaveBeenCalledTimes(1);
      });

      // Clear the mock to track new calls
      jest.clearAllMocks();

      // Now perform bulk generation
      const generateButton = screen.getByRole('button', { name: /Generate Random Customers/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const countInput = screen.getByLabelText(/Number of Customers/);
      fireEvent.change(countInput, { target: { value: '10' } });

      const submitButton = screen.getByRole('button', { name: /Generate/i });
      await act(async () => {
        fireEvent.click(submitButton);
      });

      // Customer list should be refreshed
      await waitFor(() => {
        expect(customerApi.searchCustomers).toHaveBeenCalled();
      });
    });

    it('should not refresh customer list if no search was performed', async () => {
      (customerApi.bulkCreateRandom as jest.Mock).mockResolvedValue(mockBulkCreateResponse);

      render(<Home />);

      // Don't perform a search - just open and generate

      const generateButton = screen.getByRole('button', { name: /Generate Random Customers/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const countInput = screen.getByLabelText(/Number of Customers/);
      fireEvent.change(countInput, { target: { value: '10' } });

      const submitButton = screen.getByRole('button', { name: /Generate/i });
      await act(async () => {
        fireEvent.click(submitButton);
      });

      // Customer list should NOT be refreshed (no search was performed)
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalled();
      });

      expect(customerApi.searchCustomers).not.toHaveBeenCalled();
    });

    it('should show error toast if list refresh fails', async () => {
      (customerApi.searchCustomers as jest.Mock)
        .mockResolvedValueOnce(mockSearchResponse) // First search succeeds
        .mockRejectedValueOnce(new ApiError('Failed to load customers', 500)); // Refresh fails
      (customerApi.bulkCreateRandom as jest.Mock).mockResolvedValue(mockBulkCreateResponse);

      render(<Home />);

      // Perform a search first
      const searchInput = screen.getByPlaceholderText(/Search by name or email/i);
      fireEvent.change(searchInput, { target: { value: 'John' } });

      const searchButton = screen.getByRole('button', { name: /Search/i });
      await act(async () => {
        fireEvent.click(searchButton);
      });

      await waitFor(() => {
        expect(customerApi.searchCustomers).toHaveBeenCalledTimes(1);
      });

      // Clear the mock to track new calls
      jest.clearAllMocks();

      // Now perform bulk generation
      const generateButton = screen.getByRole('button', { name: /Generate Random Customers/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const countInput = screen.getByLabelText(/Number of Customers/);
      fireEvent.change(countInput, { target: { value: '10' } });

      const submitButton = screen.getByRole('button', { name: /Generate/i });
      await act(async () => {
        fireEvent.click(submitButton);
      });

      // Should show success toast first, then error toast for failed refresh
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: 'default',
          title: 'Success',
          description: 'Successfully created 10 customers',
        });
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: 'destructive',
          title: 'Failed to Refresh List',
          description: 'Failed to load customers',
        });
      });
    });
  });

  describe('Dialog State Management', () => {
    it('should maintain separate state for Create and Generate dialogs', async () => {
      render(<Home />);

      // Open Generate dialog
      const generateButton = screen.getByRole('button', { name: /Generate Random Customers/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Generate Random Customers' })).toBeInTheDocument();
      });

      // Close Generate dialog by clicking the close button
      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: 'Generate Random Customers' })).not.toBeInTheDocument();
      });

      // Open Create Customer dialog
      const createButton = screen.getByRole('button', { name: /Create Customer/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Create New Customer')).toBeInTheDocument();
      });
    });
  });

  describe('Button Layout', () => {
    it('should render both Create Customer and Generate Random Customers buttons in the header', () => {
      render(<Home />);

      const createButton = screen.getByRole('button', { name: /Create Customer/i });
      const generateButton = screen.getByRole('button', { name: /Generate Random Customers/i });

      expect(createButton).toBeInTheDocument();
      expect(generateButton).toBeInTheDocument();
    });

    it('should position Generate button before Create button', () => {
      render(<Home />);

      const buttons = screen.getAllByRole('button');
      const generateButtonIndex = buttons.findIndex(btn => btn.textContent?.includes('Generate Random Customers'));
      const createButtonIndex = buttons.findIndex(btn => btn.textContent === 'Create Customer');

      // Generate button should come before Create button in the DOM
      expect(generateButtonIndex).toBeLessThan(createButtonIndex);
    });
  });
});
