import { CustomerApiClient, ApiError } from './customerApi';
import type { Customer, PaginatedResponse, CreateCustomerData } from './types';

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

  describe('retry mechanism', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should retry on 500 server error', async () => {
      const mockResponse = {
        items: [],
        totalCount: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      };

      // Fail twice, then succeed
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ message: 'Server error' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ message: 'Server error' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

      const resultPromise = apiClient.searchCustomers();

      // Fast-forward through retries
      await jest.runAllTimersAsync();

      const result = await resultPromise;

      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(result).toEqual(mockResponse);
    });

    it('should retry on network error', async () => {
      const mockResponse = {
        items: [],
        totalCount: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      };

      // Fail with network error, then succeed
      global.fetch = jest
        .fn()
        .mockRejectedValueOnce(new TypeError('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

      const resultPromise = apiClient.searchCustomers();

      await jest.runAllTimersAsync();

      const result = await resultPromise;

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockResponse);
    });

    it('should fail after max retries on 500 error', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Server error' }),
      });

      const resultPromise = apiClient.searchCustomers();

      await jest.runAllTimersAsync();

      await expect(resultPromise).rejects.toThrow(ApiError);
      await expect(resultPromise).rejects.toThrow('Server error');

      // Should try 4 times total (initial + 3 retries)
      expect(global.fetch).toHaveBeenCalledTimes(4);
    });

    it('should not retry on 400 bad request error', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Bad request' }),
      });

      await expect(apiClient.searchCustomers()).rejects.toThrow(ApiError);

      // Should only call once (no retries)
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should not retry on 404 not found error', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not found' }),
      });

      await expect(apiClient.searchCustomers()).rejects.toThrow(ApiError);

      // Should only call once (no retries)
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should retry on 429 rate limit error', async () => {
      const mockResponse = {
        items: [],
        totalCount: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      };

      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          json: async () => ({ message: 'Too many requests' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

      const resultPromise = apiClient.searchCustomers();

      await jest.runAllTimersAsync();

      const result = await resultPromise;

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockResponse);
    });

    it('should use exponential backoff for retries', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Server error' }),
      });

      const resultPromise = apiClient.searchCustomers();

      // Don't advance timers yet
      await Promise.resolve();

      // First retry should wait 1000ms (1s * 2^0)
      jest.advanceTimersByTime(999);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1);
      await Promise.resolve();
      expect(global.fetch).toHaveBeenCalledTimes(2);

      // Second retry should wait 2000ms (1s * 2^1)
      jest.advanceTimersByTime(1999);
      expect(global.fetch).toHaveBeenCalledTimes(2);

      jest.advanceTimersByTime(1);
      await Promise.resolve();
      expect(global.fetch).toHaveBeenCalledTimes(3);

      // Complete remaining retries
      await jest.runAllTimersAsync();

      await expect(resultPromise).rejects.toThrow(ApiError);
    });
  });

  describe('user-friendly error messages', () => {
    it('should return user-friendly message for 400 error', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({}),
      });

      await expect(apiClient.searchCustomers()).rejects.toThrow(
        'The request was invalid. Please check your input and try again.'
      );
    });

    it('should return user-friendly message for 401 error', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({}),
      });

      await expect(apiClient.searchCustomers()).rejects.toThrow(
        'You are not authorized to perform this action. Please log in.'
      );
    });

    it('should return user-friendly message for 403 error', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({}),
      });

      await expect(apiClient.searchCustomers()).rejects.toThrow(
        'You do not have permission to access this resource.'
      );
    });

    it('should return user-friendly message for 404 error', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({}),
      });

      await expect(apiClient.searchCustomers()).rejects.toThrow(
        'The requested resource could not be found.'
      );
    });

    it('should return user-friendly message for 500 error', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      await expect(apiClient.searchCustomers()).rejects.toThrow(
        'A server error occurred. Please try again later.'
      );
    });

    it('should return user-friendly message for 503 error', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({}),
      });

      await expect(apiClient.searchCustomers()).rejects.toThrow(
        'The service is currently undergoing maintenance. Please try again later.'
      );
    });

    it('should prefer server error message over default', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Custom error from server' }),
      });

      await expect(apiClient.searchCustomers()).rejects.toThrow('Custom error from server');
    });
  });

  describe('ApiError with isRetryable flag', () => {
    it('should mark 500 errors as retryable', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      try {
        await apiClient.searchCustomers();
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).isRetryable).toBe(true);
      }
    });

    it('should mark 400 errors as not retryable', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({}),
      });

      try {
        await apiClient.searchCustomers();
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).isRetryable).toBe(false);
      }
    });

    it('should mark network errors as retryable', async () => {
      global.fetch = jest.fn().mockRejectedValue(new TypeError('Network error'));

      try {
        await apiClient.searchCustomers();
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).isRetryable).toBe(true);
      }
    });
  });

  describe('createCustomer', () => {
    const mockCustomerData: CreateCustomerData = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '555-1234',
      address: '123 Main St',
    };

    const mockCreatedCustomer: Customer = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '555-1234',
      address: '123 Main St',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    it('should create a customer successfully', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockCreatedCustomer,
      });

      const result = await apiClient.createCustomer(mockCustomerData);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/customers',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockCustomerData),
        }
      );
      expect(result).toEqual(mockCreatedCustomer);
    });

    it('should create a customer with only required fields', async () => {
      const minimalData: CreateCustomerData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
      };

      const minimalCustomer: Customer = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: null,
        address: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => minimalCustomer,
      });

      const result = await apiClient.createCustomer(minimalData);

      expect(result).toEqual(minimalCustomer);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/customers',
        expect.objectContaining({
          body: JSON.stringify(minimalData),
        })
      );
    });

    it('should handle 400 validation error with field-level errors', async () => {
      const validationErrors = {
        Name: ['Name is required'],
        Email: ['Email is invalid', 'Email is required'],
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          message: 'Validation failed',
          errors: validationErrors,
        }),
      });

      try {
        await apiClient.createCustomer(mockCustomerData);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.status).toBe(400);
        expect(apiError.message).toBe('Validation failed');
        expect(apiError.errors).toEqual(validationErrors);
        expect(apiError.isRetryable).toBe(false);
      }
    });

    it('should handle 400 error without field-level errors', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          message: 'Bad request',
        }),
      });

      try {
        await apiClient.createCustomer(mockCustomerData);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.status).toBe(400);
        expect(apiError.message).toBe('Bad request');
        expect(apiError.errors).toBeUndefined();
      }
    });

    it('should handle 409 duplicate email error', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({
          message: 'A customer with this email already exists',
        }),
      });

      try {
        await apiClient.createCustomer(mockCustomerData);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.status).toBe(409);
        expect(apiError.message).toBe('A customer with this email already exists');
        expect(apiError.isRetryable).toBe(false);
      }
    });

    it('should handle 409 error with fallback message when server message is missing', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({}),
      });

      try {
        await apiClient.createCustomer(mockCustomerData);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.status).toBe(409);
        expect(apiError.message).toBe('A customer with this email already exists');
      }
    });

    describe('error handling with retries', () => {
      beforeEach(() => {
        jest.useFakeTimers();
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      it('should handle network error after retries', async () => {
        global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));

        const resultPromise = apiClient.createCustomer(mockCustomerData);

        // Set up expectation before running timers
        const expectation = expect(resultPromise).rejects.toMatchObject({
          message: 'Network error: Unable to reach the API server. Please check your connection.',
          isRetryable: true,
        });

        // Run all timers to exhaust retries
        await jest.runAllTimersAsync();

        await expectation;
      });

      it('should handle HTTP error without JSON body after retries', async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 500,
          json: async () => {
            throw new Error('Invalid JSON');
          },
        });

        const resultPromise = apiClient.createCustomer(mockCustomerData);

        const expectation = expect(resultPromise).rejects.toMatchObject({
          status: 500,
          message: 'A server error occurred. Please try again later.',
        });

        await jest.runAllTimersAsync();

        await expectation;
      });

      it('should handle unknown error types after retries', async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error('Unknown error'));

        const resultPromise = apiClient.createCustomer(mockCustomerData);

        const expectation = expect(resultPromise).rejects.toMatchObject({
          message: 'An unexpected error occurred while communicating with the API.',
        });

        await jest.runAllTimersAsync();

        await expectation;
      });
    });

    it('should not retry on 400 validation error', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Validation failed' }),
      });

      await expect(apiClient.createCustomer(mockCustomerData)).rejects.toThrow(ApiError);

      // Should only call once (no retries)
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should not retry on 409 duplicate email error', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ message: 'Email already exists' }),
      });

      await expect(apiClient.createCustomer(mockCustomerData)).rejects.toThrow(ApiError);

      // Should only call once (no retries)
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    describe('retry mechanism for createCustomer', () => {
      beforeEach(() => {
        jest.useFakeTimers();
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      it('should retry on 500 server error', async () => {
        // Fail once, then succeed
        global.fetch = jest
          .fn()
          .mockResolvedValueOnce({
            ok: false,
            status: 500,
            json: async () => ({ message: 'Server error' }),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => mockCreatedCustomer,
          });

        const resultPromise = apiClient.createCustomer(mockCustomerData);

        await jest.runAllTimersAsync();

        const result = await resultPromise;

        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(result).toEqual(mockCreatedCustomer);
      });

      it('should retry on network error', async () => {
        // Fail with network error, then succeed
        global.fetch = jest
          .fn()
          .mockRejectedValueOnce(new TypeError('Network error'))
          .mockResolvedValueOnce({
            ok: true,
            json: async () => mockCreatedCustomer,
          });

        const resultPromise = apiClient.createCustomer(mockCustomerData);

        await jest.runAllTimersAsync();

        const result = await resultPromise;

        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(result).toEqual(mockCreatedCustomer);
      });

      it('should fail after max retries on 500 error', async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 500,
          json: async () => ({ message: 'Server error' }),
        });

        const resultPromise = apiClient.createCustomer(mockCustomerData);

        const expectation = expect(resultPromise).rejects.toMatchObject({
          message: 'Server error',
        });

        await jest.runAllTimersAsync();

        await expectation;

        // Should try 4 times total (initial + 3 retries)
        expect(global.fetch).toHaveBeenCalledTimes(4);
      });

      it('should retry on 429 rate limit error', async () => {
        global.fetch = jest
          .fn()
          .mockResolvedValueOnce({
            ok: false,
            status: 429,
            json: async () => ({ message: 'Too many requests' }),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => mockCreatedCustomer,
          });

        const resultPromise = apiClient.createCustomer(mockCustomerData);

        await jest.runAllTimersAsync();

        const result = await resultPromise;

        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(result).toEqual(mockCreatedCustomer);
      });
    });
  });
});
