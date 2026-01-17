/**
 * TypeScript interfaces matching backend API DTOs
 */

/**
 * Customer response from the API
 */
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Generic paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Search parameters for customer search
 */
export interface CustomerSearchParams {
  page?: number;
  pageSize?: number;
  search?: string;
  email?: string;
  sortBy?: 'name' | 'email' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * API error response
 */
export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}

/**
 * Data for creating a new customer
 */
export interface CreateCustomerData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
}
