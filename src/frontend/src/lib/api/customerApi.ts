import type { Customer, PaginatedResponse, CustomerSearchParams, CreateCustomerData } from './types';

/**
 * Custom error class for API-related errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public errors?: Record<string, string[]>,
    public isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Get user-friendly error message based on status code
 */
function getUserFriendlyErrorMessage(status: number, defaultMessage?: string): string {
  switch (status) {
    case 400:
      return defaultMessage || 'The request was invalid. Please check your input and try again.';
    case 401:
      return 'You are not authorized to perform this action. Please log in.';
    case 403:
      return 'You do not have permission to access this resource.';
    case 404:
      return 'The requested resource could not be found.';
    case 408:
      return 'The request took too long to complete. Please try again.';
    case 409:
      return defaultMessage || 'A customer with this email already exists';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'A server error occurred. Please try again later.';
    case 502:
      return 'The service is temporarily unavailable. Please try again later.';
    case 503:
      return 'The service is currently undergoing maintenance. Please try again later.';
    case 504:
      return 'The request timed out. Please try again.';
    default:
      return defaultMessage || `An error occurred (Status: ${status}). Please try again.`;
  }
}

/**
 * Determines if an error is retryable based on status code
 */
function isRetryableError(status?: number): boolean {
  if (!status) return true; // Network errors are retryable
  return status === 408 || status === 429 || status >= 500;
}

/**
 * Customer API client service
 */
class CustomerApiClient {
  private baseUrl: string;
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // 1 second

  constructor() {
    // Get API URL from environment variable
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  }

  /**
   * Delays execution for specified milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Performs a GET request with error handling and retry mechanism
   */
  private async fetchWithErrorHandling<T>(
    url: string,
    retryCount: number = 0
  ): Promise<T> {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Try to parse error response
        let errorMessage: string;
        let errors: Record<string, string[]> | undefined;

        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else {
            errorMessage = getUserFriendlyErrorMessage(response.status);
          }
          if (errorData.errors) {
            errors = errorData.errors;
          }
        } catch {
          // If JSON parsing fails, use user-friendly error message
          errorMessage = getUserFriendlyErrorMessage(response.status);
        }

        const isRetryable = isRetryableError(response.status);

        // Retry if error is retryable and we haven't exceeded max retries
        if (isRetryable && retryCount < this.maxRetries) {
          const delayMs = this.retryDelay * Math.pow(2, retryCount); // Exponential backoff
          await this.delay(delayMs);
          return this.fetchWithErrorHandling<T>(url, retryCount + 1);
        }

        throw new ApiError(errorMessage, response.status, errors, isRetryable);
      }

      return await response.json();
    } catch (error) {
      // Network error or other fetch-related error
      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof TypeError) {
        // Network errors are retryable
        if (retryCount < this.maxRetries) {
          const delayMs = this.retryDelay * Math.pow(2, retryCount);
          await this.delay(delayMs);
          return this.fetchWithErrorHandling<T>(url, retryCount + 1);
        }

        throw new ApiError(
          'Network error: Unable to reach the API server. Please check your connection.',
          undefined,
          undefined,
          true
        );
      }

      throw new ApiError(
        'An unexpected error occurred while communicating with the API.',
        undefined,
        undefined,
        false
      );
    }
  }

  /**
   * Performs a POST request with error handling and retry mechanism
   */
  private async postWithErrorHandling<T>(
    url: string,
    data: unknown,
    retryCount: number = 0
  ): Promise<T> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        // Try to parse error response
        let errorMessage: string;
        let errors: Record<string, string[]> | undefined;

        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else {
            errorMessage = getUserFriendlyErrorMessage(response.status);
          }
          if (errorData.errors) {
            errors = errorData.errors;
          }
        } catch {
          // If JSON parsing fails, use user-friendly error message
          errorMessage = getUserFriendlyErrorMessage(response.status);
        }

        const isRetryable = isRetryableError(response.status);

        // Retry if error is retryable and we haven't exceeded max retries
        if (isRetryable && retryCount < this.maxRetries) {
          const delayMs = this.retryDelay * Math.pow(2, retryCount); // Exponential backoff
          await this.delay(delayMs);
          return this.postWithErrorHandling<T>(url, data, retryCount + 1);
        }

        throw new ApiError(errorMessage, response.status, errors, isRetryable);
      }

      return await response.json();
    } catch (error) {
      // Network error or other fetch-related error
      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof TypeError) {
        // Network errors are retryable
        if (retryCount < this.maxRetries) {
          const delayMs = this.retryDelay * Math.pow(2, retryCount);
          await this.delay(delayMs);
          return this.postWithErrorHandling<T>(url, data, retryCount + 1);
        }

        throw new ApiError(
          'Network error: Unable to reach the API server. Please check your connection.',
          undefined,
          undefined,
          true
        );
      }

      throw new ApiError(
        'An unexpected error occurred while communicating with the API.',
        undefined,
        undefined,
        false
      );
    }
  }

  /**
   * Builds query string from search parameters
   */
  private buildQueryString(params: CustomerSearchParams): string {
    const queryParams = new URLSearchParams();

    if (params.page !== undefined) {
      queryParams.append('page', params.page.toString());
    }
    if (params.pageSize !== undefined) {
      queryParams.append('pageSize', params.pageSize.toString());
    }
    if (params.search) {
      queryParams.append('search', params.search);
    }
    if (params.email) {
      queryParams.append('email', params.email);
    }
    if (params.sortBy) {
      queryParams.append('sortBy', params.sortBy);
    }
    if (params.sortOrder) {
      queryParams.append('sortOrder', params.sortOrder);
    }

    const queryString = queryParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * Search for customers with optional filters and pagination
   */
  async searchCustomers(
    params: CustomerSearchParams = {}
  ): Promise<PaginatedResponse<Customer>> {
    const queryString = this.buildQueryString(params);
    const url = `${this.baseUrl}/api/customers${queryString}`;

    return this.fetchWithErrorHandling<PaginatedResponse<Customer>>(url);
  }

  /**
   * Get a single customer by ID
   */
  async getCustomerById(id: string): Promise<Customer> {
    const url = `${this.baseUrl}/api/customers/${id}`;
    return this.fetchWithErrorHandling<Customer>(url);
  }

  /**
   * Create a new customer
   * @param data - The customer data to create
   * @returns The created customer object
   * @throws ApiError with status 400 if validation fails (errors contain field-level messages)
   * @throws ApiError with status 409 if email already exists
   */
  async createCustomer(data: CreateCustomerData): Promise<Customer> {
    const url = `${this.baseUrl}/api/customers`;
    return this.postWithErrorHandling<Customer>(url, data);
  }
}

// Export a singleton instance
export const customerApi = new CustomerApiClient();

// Also export the class for testing purposes
export { CustomerApiClient };
