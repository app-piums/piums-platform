// ============================================================================
// @piums/shared-types — API response shapes
// ============================================================================

export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
}

export interface ApiErrorResponse {
  status: 'error';
  message: string;
  errors?: ValidationError[];
  code?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface PaginatedResponse<T> {
  status: 'success';
  data: T[];
  pagination: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
