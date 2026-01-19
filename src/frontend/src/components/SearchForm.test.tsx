import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SearchForm } from './SearchForm';
import type { CustomerSearchParams } from '@/lib/api/types';

// Mock useDebounce hook to make tests synchronous
jest.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: any) => value,
}));

describe('SearchForm', () => {
  const mockOnSearch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all form fields', () => {
      render(<SearchForm onSearch={mockOnSearch} />);

      expect(screen.getByLabelText(/name or general search/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email \(exact match\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    });

    it('should render search and clear buttons', () => {
      render(<SearchForm onSearch={mockOnSearch} />);

      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument();
    });

    it('should render title and description', () => {
      render(<SearchForm onSearch={mockOnSearch} />);

      expect(screen.getByText('Search Customers')).toBeInTheDocument();
      expect(screen.getByText(/find customers by name, email, or phone number/i)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should update search input value when typing', () => {
      render(<SearchForm onSearch={mockOnSearch} />);

      const searchInput = screen.getByLabelText(/name or general search/i) as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: 'John Doe' } });

      expect(searchInput.value).toBe('John Doe');
    });

    it('should update email input value when typing', () => {
      render(<SearchForm onSearch={mockOnSearch} />);

      const emailInput = screen.getByLabelText(/email \(exact match\)/i) as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

      expect(emailInput.value).toBe('john@example.com');
    });

    it('should update phone input value when typing', () => {
      render(<SearchForm onSearch={mockOnSearch} />);

      const phoneInput = screen.getByLabelText(/phone number/i) as HTMLInputElement;
      fireEvent.change(phoneInput, { target: { value: '555-0123' } });

      expect(phoneInput.value).toBe('555-0123');
    });
  });

  describe('Search Functionality', () => {
    it('should call onSearch with search parameter when search button is clicked', () => {
      render(<SearchForm onSearch={mockOnSearch} />);

      const searchInput = screen.getByLabelText(/name or general search/i);
      fireEvent.change(searchInput, { target: { value: 'John Doe' } });

      const searchButton = screen.getByRole('button', { name: /search/i });
      fireEvent.click(searchButton);

      expect(mockOnSearch).toHaveBeenCalledWith({
        search: 'John Doe',
      });
    });

    it('should call onSearch with email parameter when email is provided', () => {
      render(<SearchForm onSearch={mockOnSearch} />);

      const emailInput = screen.getByLabelText(/email \(exact match\)/i);
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

      const searchButton = screen.getByRole('button', { name: /search/i });
      fireEvent.click(searchButton);

      expect(mockOnSearch).toHaveBeenCalledWith({
        email: 'john@example.com',
      });
    });

    it('should call onSearch with phone in search parameter when phone is provided', () => {
      render(<SearchForm onSearch={mockOnSearch} />);

      const phoneInput = screen.getByLabelText(/phone number/i);
      fireEvent.change(phoneInput, { target: { value: '555-0123' } });

      const searchButton = screen.getByRole('button', { name: /search/i });
      fireEvent.click(searchButton);

      expect(mockOnSearch).toHaveBeenCalledWith({
        search: '555-0123',
      });
    });

    it('should call onSearch with multiple parameters when multiple fields are filled', () => {
      render(<SearchForm onSearch={mockOnSearch} />);

      const searchInput = screen.getByLabelText(/name or general search/i);
      const emailInput = screen.getByLabelText(/email \(exact match\)/i);
      const phoneInput = screen.getByLabelText(/phone number/i);

      fireEvent.change(searchInput, { target: { value: 'John' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(phoneInput, { target: { value: '555-0123' } });

      const searchButton = screen.getByRole('button', { name: /search/i });
      fireEvent.click(searchButton);

      expect(mockOnSearch).toHaveBeenCalledWith({
        search: 'John 555-0123',
        email: 'john@example.com',
      });
    });

    it('should trim whitespace from search parameters', () => {
      render(<SearchForm onSearch={mockOnSearch} />);

      const searchInput = screen.getByLabelText(/name or general search/i);
      fireEvent.change(searchInput, { target: { value: '  John Doe  ' } });

      const searchButton = screen.getByRole('button', { name: /search/i });
      fireEvent.click(searchButton);

      expect(mockOnSearch).toHaveBeenCalledWith({
        search: 'John Doe',
      });
    });

    it('should not include empty parameters in search', () => {
      render(<SearchForm onSearch={mockOnSearch} />);

      const searchButton = screen.getByRole('button', { name: /search/i });
      fireEvent.click(searchButton);

      expect(mockOnSearch).toHaveBeenCalledWith({});
    });
  });

  describe('Clear Functionality', () => {
    it('should clear all input fields when clear button is clicked', () => {
      render(<SearchForm onSearch={mockOnSearch} />);

      const searchInput = screen.getByLabelText(/name or general search/i) as HTMLInputElement;
      const emailInput = screen.getByLabelText(/email \(exact match\)/i) as HTMLInputElement;
      const phoneInput = screen.getByLabelText(/phone number/i) as HTMLInputElement;

      fireEvent.change(searchInput, { target: { value: 'John' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(phoneInput, { target: { value: '555-0123' } });

      const clearButton = screen.getByRole('button', { name: /clear filters/i });
      fireEvent.click(clearButton);

      expect(searchInput.value).toBe('');
      expect(emailInput.value).toBe('');
      expect(phoneInput.value).toBe('');
    });

    it('should call onSearch with empty parameters when clear is clicked', () => {
      render(<SearchForm onSearch={mockOnSearch} />);

      const searchInput = screen.getByLabelText(/name or general search/i);
      fireEvent.change(searchInput, { target: { value: 'John' } });

      const clearButton = screen.getByRole('button', { name: /clear filters/i });
      fireEvent.click(clearButton);

      expect(mockOnSearch).toHaveBeenCalledWith({});
    });
  });

  describe('Loading State', () => {
    it('should disable inputs when isLoading is true', () => {
      render(<SearchForm onSearch={mockOnSearch} isLoading={true} />);

      const searchInput = screen.getByLabelText(/name or general search/i);
      const emailInput = screen.getByLabelText(/email \(exact match\)/i);
      const phoneInput = screen.getByLabelText(/phone number/i);

      expect(searchInput).toBeDisabled();
      expect(emailInput).toBeDisabled();
      expect(phoneInput).toBeDisabled();
    });

    it('should disable buttons when isLoading is true', () => {
      render(<SearchForm onSearch={mockOnSearch} isLoading={true} />);

      const searchButton = screen.getByRole('button', { name: /searching.../i });
      const clearButton = screen.getByRole('button', { name: /clear filters/i });

      expect(searchButton).toBeDisabled();
      expect(clearButton).toBeDisabled();
    });

    it('should show loading text in search button when isLoading is true', () => {
      render(<SearchForm onSearch={mockOnSearch} isLoading={true} />);

      expect(screen.getByRole('button', { name: /searching.../i })).toBeInTheDocument();
    });

    it('should show loading indicator text when isLoading is true', () => {
      render(<SearchForm onSearch={mockOnSearch} isLoading={true} />);

      expect(screen.getByText('Searching customers...')).toBeInTheDocument();
    });

    it('should not show loading indicator when isLoading is false', () => {
      render(<SearchForm onSearch={mockOnSearch} isLoading={false} />);

      expect(screen.queryByText('Searching customers...')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive grid classes', () => {
      const { container } = render(<SearchForm onSearch={mockOnSearch} />);

      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-3');
    });

    it('should have responsive button layout', () => {
      const { container } = render(<SearchForm onSearch={mockOnSearch} />);

      const buttonContainers = container.querySelectorAll('.flex');
      // Find the button container (not input elements which also have flex class)
      const buttonContainer = Array.from(buttonContainers).find(el =>
        el.querySelector('button')
      );
      expect(buttonContainer).toHaveClass('flex-col', 'sm:flex-row');
    });
  });

  describe('Edge Cases', () => {
    it('should handle only whitespace in search field', () => {
      render(<SearchForm onSearch={mockOnSearch} />);

      const searchInput = screen.getByLabelText(/name or general search/i);
      fireEvent.change(searchInput, { target: { value: '   ' } });

      const searchButton = screen.getByRole('button', { name: /search/i });
      fireEvent.click(searchButton);

      expect(mockOnSearch).toHaveBeenCalledWith({});
    });

    it('should combine search and phone when both provided', () => {
      render(<SearchForm onSearch={mockOnSearch} />);

      const searchInput = screen.getByLabelText(/name or general search/i);
      const phoneInput = screen.getByLabelText(/phone number/i);

      fireEvent.change(searchInput, { target: { value: 'John' } });
      fireEvent.change(phoneInput, { target: { value: '555-0123' } });

      const searchButton = screen.getByRole('button', { name: /search/i });
      fireEvent.click(searchButton);

      expect(mockOnSearch).toHaveBeenCalledWith({
        search: 'John 555-0123',
      });
    });

    it('should handle only phone number provided', () => {
      render(<SearchForm onSearch={mockOnSearch} />);

      const phoneInput = screen.getByLabelText(/phone number/i);
      fireEvent.change(phoneInput, { target: { value: '555-0123' } });

      const searchButton = screen.getByRole('button', { name: /search/i });
      fireEvent.click(searchButton);

      expect(mockOnSearch).toHaveBeenCalledWith({
        search: '555-0123',
      });
    });
  });
});
