import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CustomerResultsTable from './CustomerResultsTable';
import { Customer } from '@/lib/api/types';

describe('CustomerResultsTable', () => {
  const mockCustomers: Customer[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '555-1234',
      address: '123 Main St',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: null,
      address: null,
      createdAt: '2024-01-16T11:00:00Z',
      updatedAt: '2024-01-16T11:00:00Z',
    },
  ];

  const defaultProps = {
    customers: [],
    loading: false,
    error: null,
    onCustomerClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    test('renders loading spinner when loading is true', () => {
      render(<CustomerResultsTable {...defaultProps} loading={true} />);

      expect(screen.getByText('Loading customers...')).toBeInTheDocument();
      // Check for spinner element (div with animate-spin class)
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    test('does not render table when loading', () => {
      render(<CustomerResultsTable {...defaultProps} loading={true} />);

      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    test('renders error message when error is provided', () => {
      const errorMessage = 'Failed to fetch customers';
      render(<CustomerResultsTable {...defaultProps} error={errorMessage} />);

      expect(screen.getByText('Error Loading Customers')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    test('renders error icon', () => {
      render(<CustomerResultsTable {...defaultProps} error="Error" />);

      const errorIcon = document.querySelector('.text-destructive');
      expect(errorIcon).toBeInTheDocument();
    });

    test('does not render table when error is present', () => {
      render(<CustomerResultsTable {...defaultProps} error="Error" />);

      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    test('renders empty state when no customers', () => {
      render(<CustomerResultsTable {...defaultProps} />);

      expect(screen.getByText('No Customers Found')).toBeInTheDocument();
      expect(
        screen.getByText(/Try adjusting your search filters/i)
      ).toBeInTheDocument();
    });

    test('renders empty state icon', () => {
      render(<CustomerResultsTable {...defaultProps} />);

      const emptyIcon = document.querySelector('.text-muted-foreground');
      expect(emptyIcon).toBeInTheDocument();
    });

    test('does not render table when no customers', () => {
      render(<CustomerResultsTable {...defaultProps} />);

      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });

  describe('Success State - Desktop Table View', () => {
    test('renders table with customer data', () => {
      render(<CustomerResultsTable {...defaultProps} customers={mockCustomers} />);

      // Check table headers
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Phone')).toBeInTheDocument();
      expect(screen.getByText('Created At')).toBeInTheDocument();
    });

    test('renders all customer rows', () => {
      render(<CustomerResultsTable {...defaultProps} customers={mockCustomers} />);

      // Names and emails appear in both desktop table and mobile cards
      expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
      expect(screen.getAllByText('john@example.com').length).toBeGreaterThan(0);
      expect(screen.getAllByText('555-1234').length).toBeGreaterThan(0);

      expect(screen.getAllByText('Jane Smith').length).toBeGreaterThan(0);
      expect(screen.getAllByText('jane@example.com').length).toBeGreaterThan(0);
    });

    test('renders N/A for null phone numbers', () => {
      render(<CustomerResultsTable {...defaultProps} customers={mockCustomers} />);

      // Jane Smith has null phone - should show N/A
      const naCells = screen.getAllByText('N/A');
      expect(naCells.length).toBeGreaterThan(0);
    });

    test('formats dates correctly', () => {
      render(<CustomerResultsTable {...defaultProps} customers={mockCustomers} />);

      // Check that dates are formatted (not raw ISO strings)
      expect(screen.queryByText('2024-01-15T10:00:00Z')).not.toBeInTheDocument();
      // Should have formatted date like "Jan 15, 2024" - appears in both desktop and mobile
      expect(screen.getAllByText(/Jan 15, 2024/i).length).toBeGreaterThan(0);
    });

    test('calls onCustomerClick when row is clicked', () => {
      const onCustomerClick = jest.fn();
      render(
        <CustomerResultsTable
          {...defaultProps}
          customers={mockCustomers}
          onCustomerClick={onCustomerClick}
        />
      );

      // Get all table rows (excluding header)
      const rows = screen.getAllByRole('row');
      // First row is header, second is first customer
      fireEvent.click(rows[1]);

      expect(onCustomerClick).toHaveBeenCalledTimes(1);
      expect(onCustomerClick).toHaveBeenCalledWith(mockCustomers[0]);
    });

    test('row has cursor-pointer class for hover effect', () => {
      render(<CustomerResultsTable {...defaultProps} customers={mockCustomers} />);

      const rows = screen.getAllByRole('row');
      // Check data row (not header)
      expect(rows[1]).toHaveClass('cursor-pointer');
    });
  });

  describe('Success State - Mobile Card View', () => {
    test('renders customer cards', () => {
      render(<CustomerResultsTable {...defaultProps} customers={mockCustomers} />);

      // Cards should contain customer names (appear in both desktop and mobile)
      expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Jane Smith').length).toBeGreaterThan(0);
    });

    test('renders phone label in cards', () => {
      render(<CustomerResultsTable {...defaultProps} customers={mockCustomers} />);

      const phoneLabels = screen.getAllByText('Phone:');
      expect(phoneLabels.length).toBeGreaterThan(0);
    });

    test('renders created label in cards', () => {
      render(<CustomerResultsTable {...defaultProps} customers={mockCustomers} />);

      const createdLabels = screen.getAllByText('Created:');
      expect(createdLabels.length).toBeGreaterThan(0);
    });

    test('calls onCustomerClick when card is clicked', () => {
      const onCustomerClick = jest.fn();
      const { container } = render(
        <CustomerResultsTable
          {...defaultProps}
          customers={mockCustomers}
          onCustomerClick={onCustomerClick}
        />
      );

      // Find card divs (they have border, rounded-lg, p-4 classes)
      const cards = container.querySelectorAll('.cursor-pointer');
      const mobileCards = Array.from(cards).filter(
        (card) => !card.closest('table')
      );

      fireEvent.click(mobileCards[0]);

      expect(onCustomerClick).toHaveBeenCalledTimes(1);
      expect(onCustomerClick).toHaveBeenCalledWith(mockCustomers[0]);
    });

    test('cards have hover effect class', () => {
      const { container } = render(
        <CustomerResultsTable {...defaultProps} customers={mockCustomers} />
      );

      const cards = container.querySelectorAll('.hover\\:bg-muted\\/50');
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Design', () => {
    test('desktop table has hidden class on mobile', () => {
      const { container } = render(
        <CustomerResultsTable {...defaultProps} customers={mockCustomers} />
      );

      const desktopView = container.querySelector('.hidden.md\\:block');
      expect(desktopView).toBeInTheDocument();
    });

    test('mobile cards have hidden class on desktop', () => {
      const { container } = render(
        <CustomerResultsTable {...defaultProps} customers={mockCustomers} />
      );

      const mobileView = container.querySelector('.md\\:hidden');
      expect(mobileView).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles single customer', () => {
      render(
        <CustomerResultsTable
          {...defaultProps}
          customers={[mockCustomers[0]]}
        />
      );

      expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });

    test('handles many customers', () => {
      const manyCustomers = Array.from({ length: 50 }, (_, i) => ({
        ...mockCustomers[0],
        id: `${i}`,
        name: `Customer ${i}`,
        email: `customer${i}@example.com`,
      }));

      render(<CustomerResultsTable {...defaultProps} customers={manyCustomers} />);

      expect(screen.getAllByText('Customer 0').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Customer 49').length).toBeGreaterThan(0);
    });

    test('loading takes precedence over error', () => {
      render(
        <CustomerResultsTable
          {...defaultProps}
          loading={true}
          error="Some error"
        />
      );

      expect(screen.getByText('Loading customers...')).toBeInTheDocument();
      expect(screen.queryByText('Some error')).not.toBeInTheDocument();
    });

    test('loading takes precedence over customers', () => {
      render(
        <CustomerResultsTable
          {...defaultProps}
          loading={true}
          customers={mockCustomers}
        />
      );

      expect(screen.getByText('Loading customers...')).toBeInTheDocument();
      expect(screen.queryAllByText('John Doe').length).toBe(0);
    });

    test('error takes precedence over empty state', () => {
      render(
        <CustomerResultsTable
          {...defaultProps}
          error="Error message"
          customers={[]}
        />
      );

      expect(screen.getByText('Error Loading Customers')).toBeInTheDocument();
      expect(screen.queryByText('No Customers Found')).not.toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    test('formats various date formats correctly', () => {
      const customerWithDate: Customer = {
        ...mockCustomers[0],
        createdAt: '2023-12-25T00:00:00Z',
      };

      render(
        <CustomerResultsTable
          {...defaultProps}
          customers={[customerWithDate]}
        />
      );

      expect(screen.getAllByText(/Dec 25, 2023/i).length).toBeGreaterThan(0);
    });
  });
});
