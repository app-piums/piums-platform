// ============================================================================
// @piums/shared-types — Payment domain types
// ============================================================================

export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
export type PaymentMethod = 'CARD' | 'BANK_TRANSFER' | 'CASH' | 'STRIPE';
export type PayoutStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface Payment {
  id: string;
  bookingId: string;
  userId: string;
  artistId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentRequest {
  bookingId: string;
  method: PaymentMethod;
  paymentMethodId?: string;
  returnUrl?: string;
}

export interface Payout {
  id: string;
  artistId: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  stripePayoutId?: string;
  bankAccountLast4?: string;
  scheduledAt?: string;
  processedAt?: string;
  createdAt: string;
}

export interface PayoutRequest {
  amount: number;
  currency?: string;
}

export interface SavedPaymentMethod {
  id: string;
  userId: string;
  type: 'CARD' | 'BANK_ACCOUNT';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  stripePaymentMethodId: string;
  createdAt: string;
}

export interface PricingCalculation {
  basePrice: number;
  platformFeePercent: number;
  platformFee: number;
  depositPercent?: number;
  depositAmount?: number;
  total: number;
  currency: string;
}
