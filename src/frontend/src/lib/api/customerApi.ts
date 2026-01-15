import type { Customer, PaginatedResponse, CustomerSearchParams } from './types';

/**
 * Custom error class for API-related errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Customer API client service
 */
class CustomerApiClient {
  private baseUrl: string;

  constructor() {
    // Get API URL from environment variable
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  }

  /**
   * Performs a GET request with error handling
   */
  private async fetchWithErrorHandling<T>(url: string): Promise<T> {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Try to parse error response
        let errorMessage = `HTTP error! status: ${response.status}`;
        let errors: Record<string, string[]> | undefined;

        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
          if (errorData.errors) {
            errors = errorData.errors;
          }
        } catch {
          // If JSON parsing fails, use default error message
        }

        throw new ApiError(errorMessage, response.status, errors);
      }

      return await response.json();
    } catch (error) {
      // Network error or other fetch-related error
      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof TypeError) {
        throw new ApiError('Network error: Unable to reach the API server. Please check your connection.');
      }

      throw new ApiError('An unexpected error occurred while communicating with the API.');
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
}

// Export a singleton instance
export const customerApi = new CustomerApiClient();

// Also export the class for testing purposes
export { CustomerApiClient };
