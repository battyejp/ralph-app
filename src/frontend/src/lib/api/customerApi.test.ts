import { CustomerApiClient, ApiError } from './customerApi';
import type { Customer, PaginatedResponse } from './types';

describe('CustomerApiClient', () => {
  let apiClient: CustomerApiClient;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    // Create a new instance for each test
    apiClient = new CustomerApiClient();

    // Store original fetch
    originalFetch = global.fetch;

    // Mock environment variable
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:5000';
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;

    // Clean up environment
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  describe('searchCustomers', () => {
    it('should fetch customers with default parameters', async () => {
      const mockResponse: PaginatedResponse<Customer> = {
        items: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '555-1234',
            address: '123 Main St',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
        totalCount: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiClient.searchCustomers();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/customers',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should include search parameters in query string', async () => {
      const mockResponse: PaginatedResponse<Customer> = {
        items: [],
        totalCount: 0,
        page: 2,
        pageSize: 25,
        totalPages: 0,
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await apiClient.searchCustomers({
        page: 2,
        pageSize: 25,
        search: 'john',
        email: 'john@example.com',
        sortBy: 'name',
        sortOrder: 'asc',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('pageSize=25'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=john'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('email=john%40example.com'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('sortBy=name'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('sortOrder=asc'),
        expect.any(Object)
      );
    });

    it('should handle API error response', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          message: 'Invalid request',
          errors: { page: ['Page must be greater than 0'] },
        }),
      });

      await expect(apiClient.searchCustomers()).rejects.toThrow(ApiError);
      await expect(apiClient.searchCustomers()).rejects.toThrow('Invalid request');
    });

    it('should handle network error', async () => {
      global.fetch = jest.fn().mockRejectedValue(new TypeError('Network error'));

      await expect(apiClient.searchCustomers()).rejects.toThrow(ApiError);
      await expect(apiClient.searchCustomers()).rejects.toThrow(
        'Network error: Unable to reach the API server'
      );
    });

    it('should handle HTTP error without JSON body', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(apiClient.searchCustomers()).rejects.toThrow(ApiError);
      await expect(apiClient.searchCustomers()).rejects.toThrow('HTTP error! status: 500');
    });
  });

  describe('getCustomerById', () => {
    it('should fetch a customer by ID', async () => {
      const mockCustomer: Customer = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-1234',
        address: '123 Main St',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockCustomer,
      });

      const result = await apiClient.getCustomerById('123e4567-e89b-12d3-a456-426614174000');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/customers/123e4567-e89b-12d3-a456-426614174000',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual(mockCustomer);
    });

    it('should handle 404 not found error', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({
          message: 'Customer with ID 123 not found.',
        }),
      });

      await expect(apiClient.getCustomerById('123')).rejects.toThrow(ApiError);
      await expect(apiClient.getCustomerById('123')).rejects.toThrow(
        'Customer with ID 123 not found.'
      );
    });

    it('should handle network error', async () => {
      global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(apiClient.getCustomerById('123')).rejects.toThrow(ApiError);
      await expect(apiClient.getCustomerById('123')).rejects.toThrow(
        'Network error: Unable to reach the API server'
      );
    });
  });

  describe('ApiError', () => {
    it('should create ApiError with message only', () => {
      const error = new ApiError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('ApiError');
      expect(error.status).toBeUndefined();
      expect(error.errors).toBeUndefined();
    });

    it('should create ApiError with status and errors', () => {
      const errors = { field: ['Error message'] };
      const error = new ApiError('Test error', 400, errors);
      expect(error.message).toBe('Test error');
      expect(error.status).toBe(400);
      expect(error.errors).toEqual(errors);
    });

    it('should be an instance of Error', () => {
      const error = new ApiError('Test error');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
    });
  });

  describe('buildQueryString', () => {
    it('should handle empty parameters', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 }),
      });

      await apiClient.searchCustomers({});

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/customers',
        expect.any(Object)
      );
    });

    it('should handle partial parameters', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 }),
      });

      await apiClient.searchCustomers({ search: 'test', page: 1 });

      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain('search=test');
      expect(callUrl).toContain('page=1');
      expect(callUrl).not.toContain('pageSize');
      expect(callUrl).not.toContain('email');
    });
  });

  describe('error handling', () => {
    it('should handle unknown error types', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Unknown error'));

      await expect(apiClient.searchCustomers()).rejects.toThrow(ApiError);
      await expect(apiClient.searchCustomers()).rejects.toThrow(
        'An unexpected error occurred while communicating with the API.'
      );
    });

    it('should preserve ApiError when thrown', async () => {
      const customError = new ApiError('Custom error', 400);
      global.fetch = jest.fn().mockRejectedValue(customError);

      await expect(apiClient.searchCustomers()).rejects.toThrow(customError);
    });
  });
});
