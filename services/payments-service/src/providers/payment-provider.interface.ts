export interface CheckoutParams {
  bookingId: string;
  amount: number;       // centavos (e.g. 5000 = $50.00)
  currency: string;
  description?: string;
  metadata?: Record<string, string>;
  userId: string;
  userEmail?: string;   // requerido por Tilopay (billToEmail)
  returnUrl?: string;
}

export interface CheckoutResult {
  providerRef: string;        // Stripe paymentIntentId | Tilopay orderId
  clientSecret?: string;      // Stripe Elements — frontend lo usa para confirmar
  redirectUrl?: string;       // Tilopay — redirigir al usuario para 3DS
  requiresAction: boolean;
  status: 'pending' | 'requires_action' | 'succeeded';
  provider: 'STRIPE' | 'TILOPAY';
}

export interface RefundPaymentParams {
  providerRef: string;        // Stripe paymentIntentId | Tilopay orderId
  amount?: number;            // parcial en centavos; undefined = reembolso total
  reason?: string;
  metadata?: Record<string, string>;
}

export interface RefundPaymentResult {
  refundId: string;
  status: string;
  amount: number;
}

export interface IPaymentProvider {
  createCheckout(params: CheckoutParams): Promise<CheckoutResult>;
  refundPayment(params: RefundPaymentParams): Promise<RefundPaymentResult>;
}
