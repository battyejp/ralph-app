import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PaginationControls } from './PaginationControls';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ChevronLeft: () => <span data-testid="chevron-left">←</span>,
  ChevronRight: () => <span data-testid="chevron-right">→</span>,
  Check: () => <span data-testid="check">✓</span>,
  ChevronDown: () => <span data-testid="chevron-down">▼</span>,
  ChevronUp: () => <span data-testid="chevron-up">▲</span>,
}));

describe('PaginationControls', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 5,
    totalCount: 125,
    pageSize: 25,
    onPageChange: jest.fn(),
    onPageSizeChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render pagination controls', () => {
      render(<PaginationControls {...defaultProps} />);

      expect(screen.getByText(/Showing 1 to 25 of 125 results/i)).toBeInTheDocument();
      expect(screen.getByText(/Page 1 of 5/i)).toBeInTheDocument();
      expect(screen.getByText(/Rows per page:/i)).toBeInTheDocument();
    });

    it('should display correct item range on first page', () => {
      render(<PaginationControls {...defaultProps} />);

      expect(screen.getByText(/Showing 1 to 25 of 125 results/i)).toBeInTheDocument();
    });

    it('should display correct item range on middle page', () => {
      render(
        <PaginationControls
          {...defaultProps}
          currentPage={3}
        />
      );

      expect(screen.getByText(/Showing 51 to 75 of 125 results/i)).toBeInTheDocument();
    });

    it('should display correct item range on last page', () => {
      render(
        <PaginationControls
          {...defaultProps}
          currentPage={5}
        />
      );

      expect(screen.getByText(/Showing 101 to 125 of 125 results/i)).toBeInTheDocument();
    });

    it('should handle partial last page correctly', () => {
      render(
        <PaginationControls
          {...defaultProps}
          totalCount={103}
          currentPage={5}
          totalPages={5}
        />
      );

      expect(screen.getByText(/Showing 101 to 103 of 103 results/i)).toBeInTheDocument();
    });

    it('should display 0 to 0 when totalCount is 0', () => {
      render(
        <PaginationControls
          {...defaultProps}
          totalCount={0}
          totalPages={0}
          currentPage={1}
        />
      );

      expect(screen.getByText(/Showing 0 to 0 of 0 results/i)).toBeInTheDocument();
    });
  });

  describe('Navigation Buttons', () => {
    it('should render Previous and Next buttons', () => {
      render(<PaginationControls {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Previous page/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Next page/i })).toBeInTheDocument();
    });

    it('should disable Previous button on first page', () => {
      render(<PaginationControls {...defaultProps} currentPage={1} />);

      const previousButton = screen.getByRole('button', { name: /Previous page/i });
      expect(previousButton).toBeDisabled();
    });

    it('should enable Previous button when not on first page', () => {
      render(<PaginationControls {...defaultProps} currentPage={2} />);

      const previousButton = screen.getByRole('button', { name: /Previous page/i });
      expect(previousButton).not.toBeDisabled();
    });

    it('should disable Next button on last page', () => {
      render(<PaginationControls {...defaultProps} currentPage={5} />);

      const nextButton = screen.getByRole('button', { name: /Next page/i });
      expect(nextButton).toBeDisabled();
    });

    it('should enable Next button when not on last page', () => {
      render(<PaginationControls {...defaultProps} currentPage={1} />);

      const nextButton = screen.getByRole('button', { name: /Next page/i });
      expect(nextButton).not.toBeDisabled();
    });

    it('should call onPageChange with previous page when Previous is clicked', () => {
      const onPageChange = jest.fn();
      render(
        <PaginationControls
          {...defaultProps}
          currentPage={3}
          onPageChange={onPageChange}
        />
      );

      const previousButton = screen.getByRole('button', { name: /Previous page/i });
      fireEvent.click(previousButton);

      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('should call onPageChange with next page when Next is clicked', () => {
      const onPageChange = jest.fn();
      render(
        <PaginationControls
          {...defaultProps}
          currentPage={3}
          onPageChange={onPageChange}
        />
      );

      const nextButton = screen.getByRole('button', { name: /Next page/i });
      fireEvent.click(nextButton);

      expect(onPageChange).toHaveBeenCalledWith(4);
    });

    it('should not call onPageChange when Previous is clicked on first page', () => {
      const onPageChange = jest.fn();
      render(
        <PaginationControls
          {...defaultProps}
          currentPage={1}
          onPageChange={onPageChange}
        />
      );

      const previousButton = screen.getByRole('button', { name: /Previous page/i });
      fireEvent.click(previousButton);

      expect(onPageChange).not.toHaveBeenCalled();
    });

    it('should not call onPageChange when Next is clicked on last page', () => {
      const onPageChange = jest.fn();
      render(
        <PaginationControls
          {...defaultProps}
          currentPage={5}
          onPageChange={onPageChange}
        />
      );

      const nextButton = screen.getByRole('button', { name: /Next page/i });
      fireEvent.click(nextButton);

      expect(onPageChange).not.toHaveBeenCalled();
    });
  });

  describe('Page Size Selector', () => {
    it('should display current page size', () => {
      render(<PaginationControls {...defaultProps} pageSize={25} />);

      // The Select component displays the value in its trigger
      expect(screen.getByText('25')).toBeInTheDocument();
    });

    it('should call onPageSizeChange when page size is changed', () => {
      const onPageSizeChange = jest.fn();
      render(
        <PaginationControls
          {...defaultProps}
          onPageSizeChange={onPageSizeChange}
        />
      );

      // Click on the select trigger to open dropdown
      const selectTrigger = screen.getByRole('combobox');
      fireEvent.click(selectTrigger);

      // Select the 50 option
      const option50 = screen.getByRole('option', { name: '50' });
      fireEvent.click(option50);

      expect(onPageSizeChange).toHaveBeenCalledWith(50);
    });

    it('should display all page size options', () => {
      render(<PaginationControls {...defaultProps} />);

      // Click on the select trigger to open dropdown
      const selectTrigger = screen.getByRole('combobox');
      fireEvent.click(selectTrigger);

      // Check all options are present
      expect(screen.getByRole('option', { name: '10' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '25' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '50' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '100' })).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should disable all controls when disabled prop is true', () => {
      render(<PaginationControls {...defaultProps} disabled={true} currentPage={2} />);

      const previousButton = screen.getByRole('button', { name: /Previous page/i });
      const nextButton = screen.getByRole('button', { name: /Next page/i });
      const selectTrigger = screen.getByRole('combobox');

      expect(previousButton).toBeDisabled();
      expect(nextButton).toBeDisabled();
      expect(selectTrigger).toBeDisabled();
    });

    it('should not disable controls when disabled prop is false', () => {
      render(<PaginationControls {...defaultProps} disabled={false} currentPage={2} />);

      const previousButton = screen.getByRole('button', { name: /Previous page/i });
      const nextButton = screen.getByRole('button', { name: /Next page/i });
      const selectTrigger = screen.getByRole('combobox');

      expect(previousButton).not.toBeDisabled();
      expect(nextButton).not.toBeDisabled();
      expect(selectTrigger).not.toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle single page correctly', () => {
      render(
        <PaginationControls
          {...defaultProps}
          currentPage={1}
          totalPages={1}
          totalCount={10}
        />
      );

      expect(screen.getByText(/Page 1 of 1/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Previous page/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /Next page/i })).toBeDisabled();
    });

    it('should handle page size of 10 correctly', () => {
      render(
        <PaginationControls
          {...defaultProps}
          pageSize={10}
          totalCount={100}
          totalPages={10}
        />
      );

      expect(screen.getByText(/Showing 1 to 10 of 100 results/i)).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('should handle page size of 100 correctly', () => {
      render(
        <PaginationControls
          {...defaultProps}
          pageSize={100}
          totalCount={250}
          totalPages={3}
          currentPage={2}
        />
      );

      expect(screen.getByText(/Showing 101 to 200 of 250 results/i)).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on navigation buttons', () => {
      render(<PaginationControls {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Previous page/i })).toHaveAttribute('aria-label', 'Previous page');
      expect(screen.getByRole('button', { name: /Next page/i })).toHaveAttribute('aria-label', 'Next page');
    });

    it('should have proper role on select element', () => {
      render(<PaginationControls {...defaultProps} />);

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });
});
