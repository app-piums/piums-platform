// ============================================================================
// @piums/shared-types — Booking domain types
// ============================================================================

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED_BY_CLIENT'
  | 'CANCELLED_BY_ARTIST'
  | 'DISPUTED'
  | 'REFUNDED';

export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';
export type DisputeReason = 'NO_SHOW' | 'QUALITY' | 'PAYMENT' | 'BEHAVIOR' | 'OTHER';

export interface Booking {
  id: string;
  code: string;
  userId: string;
  artistId: string;
  serviceId?: string;
  status: BookingStatus;
  scheduledAt: string;
  durationMinutes?: number;
  address?: string;
  notes?: string;
  totalAmount: number;
  depositAmount?: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingDetail extends Booking {
  user?: {
    id: string;
    nombre: string;
    avatar?: string;
    email?: string;
  };
  artist?: {
    id: string;
    nombre: string;
    avatar?: string;
    slug?: string;
  };
  service?: {
    id: string;
    name: string;
    basePrice: number;
  };
}

export interface CreateBookingRequest {
  artistId: string;
  serviceId?: string;
  scheduledAt: string;
  durationMinutes?: number;
  address?: string;
  notes?: string;
}

export interface CheckAvailabilityRequest {
  artistId: string;
  date: string;       // YYYY-MM-DD
  duration?: number;  // minutes
}

export interface TimeSlot {
  startTime: string;  // ISO 8601
  endTime: string;
  available: boolean;
}

export interface Dispute {
  id: string;
  bookingId: string;
  reportedBy: string;
  reason: DisputeReason;
  description: string;
  status: DisputeStatus;
  resolution?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDisputeRequest {
  bookingId: string;
  reason: DisputeReason;
  description: string;
  evidence?: string[]; // URLs
}
