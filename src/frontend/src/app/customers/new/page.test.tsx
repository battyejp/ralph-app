import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import CreateCustomerPage from './page';
import { customerApi, ApiError } from '@/lib/api/customerApi';
import type { Customer } from '@/lib/api/types';

// Mock the customer API
jest.mock('@/lib/api/customerApi');

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
  }),
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

const mockCreatedCustomer: Customer = {
  id: '456',
  name: 'Jane Smith',
  email: 'jane.smith@example.com',
  phone: '+1-555-5678',
  address: '456 Oak Ave',
  createdAt: '2024-01-16T14:00:00Z',
  updatedAt: '2024-01-16T14:00:00Z',
};

describe('CreateCustomerPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Page Rendering', () => {
    it('should render page with correct heading', () => {
      render(<CreateCustomerPage />);

      expect(screen.getByRole('heading', { name: 'Create New Customer' })).toBeInTheDocument();
    });

    it('should render page description', () => {
      render(<CreateCustomerPage />);

      expect(screen.getByText('Fill out the form below to add a new customer')).toBeInTheDocument();
    });

    it('should render Back to Search link', () => {
      render(<CreateCustomerPage />);

      const backLink = screen.getByRole('link', { name: /Back to Search/i });
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/');
    });

    it('should render CustomerForm', () => {
      render(<CreateCustomerPage />);

      expect(screen.getByLabelText(/Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Phone/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Address/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Create Customer/i })).toBeInTheDocument();
    });
  });

  describe('Page Layout', () => {
    it('should have main element as wrapper', () => {
      render(<CreateCustomerPage />);

      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should use responsive layout with proper styling', () => {
      const { container } = render(<CreateCustomerPage />);

      const main = container.querySelector('main');
      expect(main).toHaveClass('flex', 'min-h-screen', 'flex-col', 'items-center');
    });
  });

  describe('Form Submission Success', () => {
    it('should navigate to home with showCustomer param on successful creation', async () => {
      (customerApi.createCustomer as jest.Mock).mockResolvedValue(mockCreatedCustomer);

      render(<CreateCustomerPage />);

      // Fill in the form
      fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'Jane Smith' } });
      fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'jane.smith@example.com' } });

      // Submit the form
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Create Customer/i }));
      });

      // Wait for navigation
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(`/?showCustomer=${mockCreatedCustomer.id}`);
      });
    });

    it('should show success toast on successful creation', async () => {
      (customerApi.createCustomer as jest.Mock).mockResolvedValue(mockCreatedCustomer);

      render(<CreateCustomerPage />);

      // Fill in the form
      fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'Jane Smith' } });
      fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'jane.smith@example.com' } });

      // Submit the form
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Create Customer/i }));
      });

      // Wait for toast
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Customer created successfully',
          })
        );
      });
    });
  });

  describe('Form Submission Failure', () => {
    it('should not navigate when form validation fails', async () => {
      render(<CreateCustomerPage />);

      // Submit without filling in required fields
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Create Customer/i }));
      });

      // Navigation should not occur
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should not navigate when API call fails', async () => {
      (customerApi.createCustomer as jest.Mock).mockRejectedValue(
        new ApiError('Server error', 500)
      );

      render(<CreateCustomerPage />);

      // Fill in the form
      fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'Jane Smith' } });
      fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'jane.smith@example.com' } });

      // Submit the form
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Create Customer/i }));
      });

      // Wait for API call to complete
      await waitFor(() => {
        expect(customerApi.createCustomer).toHaveBeenCalled();
      });

      // Navigation should not occur
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should show error toast when API call fails', async () => {
      (customerApi.createCustomer as jest.Mock).mockRejectedValue(
        new ApiError('Server error', 500)
      );

      render(<CreateCustomerPage />);

      // Fill in the form
      fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'Jane Smith' } });
      fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'jane.smith@example.com' } });

      // Submit the form
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Create Customer/i }));
      });

      // Wait for error toast
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            variant: 'destructive',
          })
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('should have heading hierarchy', () => {
      render(<CreateCustomerPage />);

      // There should be an h1 heading
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Create New Customer');
    });

    it('should have accessible form labels', () => {
      render(<CreateCustomerPage />);

      // Form inputs should be properly labeled
      expect(screen.getByLabelText(/Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Phone/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Address/)).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive padding classes', () => {
      const { container } = render(<CreateCustomerPage />);

      const main = container.querySelector('main');
      expect(main).toHaveClass('p-6', 'md:p-12', 'lg:p-24');
    });

    it('should use max-width for form container', () => {
      const { container } = render(<CreateCustomerPage />);

      const formContainer = container.querySelector('.max-w-lg');
      expect(formContainer).toBeInTheDocument();
    });
  });
});
