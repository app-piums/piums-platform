// ============================================================================
// @piums/shared-types — Search domain types
// ============================================================================

export interface SearchQuery {
  q?: string;
  category?: string;
  cityId?: string;
  priceMin?: number;
  priceMax?: number;
  rating?: number;
  isVerified?: boolean;
  isPremium?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'rating' | 'price' | 'reviews' | 'relevance';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult<T = unknown> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  query: string;
  took?: number; // milliseconds
}

export interface AutocompleteResult {
  id: string;
  label: string;
  type: 'ARTIST' | 'SERVICE' | 'CATEGORY' | 'CITY';
  slug?: string;
  avatar?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  parentId?: string;
  isActive: boolean;
  sortOrder?: number;
}

export interface PopularSearch {
  query: string;
  count: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export type NotificationType =
  | 'BOOKING_CREATED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_COMPLETED'
  | 'BOOKING_REMINDER'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'REVIEW_RECEIVED'
  | 'MESSAGE_RECEIVED'
  | 'PAYOUT_PROCESSED'
  | 'ACCOUNT_VERIFIED'
  | 'SYSTEM';
