// ============================================================================
// Piums SDK - Types
// ============================================================================

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nombre: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface User {
  id: string;
  email: string;
  nombre: string;
  avatar?: string;
  createdAt: string;
}

// Artist Types
export interface Artist {
  id: string;
  userId: string;
  nombre: string;
  slug: string;
  bio?: string;
  avatar?: string;
  coverPhoto?: string;
  category?: string;
  city?: string; // Nombre legible (ej: Ciudad de Guatemala)
  cityId?: string;
  baseLocationLabel?: string;
  baseLocationLat?: number;
  baseLocationLng?: number;
  coverageRadius?: number;
  experienceYears?: number;
  rating?: number;
  reviewsCount?: number;
  bookingsCount?: number;
  isVerified: boolean;
  isActive: boolean;
  isPremium: boolean;
  createdAt: string;
}

export interface ArtistProfile extends Artist {
  specialties?: string[];
  portfolio?: PortfolioItem[];
  certifications?: Certification[];
  services?: Service[];
  reviews?: Review[];
  instagram?: string;
  facebook?: string;
  youtube?: string;
  tiktok?: string;
  website?: string;
}

export interface PortfolioItem {
  id: string;
  artistId: string;
  title: string;
  description?: string;
  imageUrl: string;
  category?: string;
  order: number;
  createdAt: string;
}

export interface Certification {
  id: string;
  artistId: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  certificateUrl?: string;
}

// Service Types
export interface Service {
  id: string;
  artistId: string;
  name: string;
  description: string;
  categoryId?: string;
  basePrice: number;
  duration: number;
  isActive: boolean;
  createdAt: string;
}

// Booking Types
export interface Booking {
  id: string;
  code: string;
  userId: string;
  artistId: string;
  status: BookingStatus;
  scheduledAt: string;
  totalAmount: number;
  currency: string;
  quoteSnapshot?: any;
  createdAt: string;
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface CreateBookingRequest {
  artistId: string;
  serviceId: string;
  scheduledAt: string;
  notes?: string;
}

// Review Types
export interface Review {
  id: string;
  userId: string;
  artistId: string;
  bookingId?: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

// Search Types
export interface SearchParams {
  query?: string;
  category?: string;
  cityId?: string;
  minRating?: number;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export interface SearchResults<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// City Types
export interface City {
  id: string;
  name: string;
  stateCode: string;
  countryCode: string;
  slug: string;
  latitude?: number;
  longitude?: number;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parentId?: string;
}

// ============================================================================
// Event Types
// ============================================================================

export type EventStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface PiumsEvent {
  id: string;
  code: string;
  clientId: string;
  name: string;
  description?: string;
  location?: string;
  locationLat?: number;
  locationLng?: number;
  notes?: string;
  status: EventStatus;
  bookings?: EventBookingRef[];
  createdAt: string;
  updatedAt: string;
}

export interface EventBookingRef {
  id: string;
  code: string;
  artistId: string;
  serviceId: string;
  scheduledDate: string;
  status: string;
  totalPrice: number;
  currency: string;
}

export interface CreateEventPayload {
  name: string;
  description?: string;
  location?: string;
  locationLat?: number;
  locationLng?: number;
  notes?: string;
}

export interface UpdateEventPayload {
  name?: string;
  description?: string;
  location?: string;
  locationLat?: number;
  locationLng?: number;
  notes?: string;
}

export interface EventBreakdown {
  eventId: string;
  eventCode: string;
  eventName: string;
  bookings: {
    bookingId: string;
    code: string;
    artistId: string;
    serviceId: string;
    scheduledDate: string;
    status: string;
    totalPrice: number;
    currency: string;
  }[];
  grandTotalCents: number;
  currency: string;
}
