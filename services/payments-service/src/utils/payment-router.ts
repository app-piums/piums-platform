import type { IPaymentProvider } from '../providers/payment-provider.interface';

// Países donde Tilopay es el procesador principal (LATAM)
const TILOPAY_COUNTRIES = new Set(['CR', 'PA', 'GT', 'HN', 'NI', 'SV', 'MX', 'BO', 'EC', 'PE']);

export type ProviderName = 'STRIPE' | 'TILOPAY';

export function getProviderName(countryCode?: string | null): ProviderName {
  // Sin country code → proveedor por defecto según env (TILOPAY para LATAM)
  if (!countryCode) {
    return (process.env.DEFAULT_PAYMENT_PROVIDER as ProviderName) || 'TILOPAY';
  }
  const upper = countryCode.toUpperCase();
  if (TILOPAY_COUNTRIES.has(upper)) return 'TILOPAY';
  // Stripe solo si está configurado y el país no es LATAM
  if (process.env.STRIPE_SECRET_KEY) return 'STRIPE';
  return 'TILOPAY';
}

// Lazy imports to avoid circular deps at module load time
export async function getProvider(countryCode?: string | null): Promise<IPaymentProvider> {
  if (getProviderName(countryCode) === 'TILOPAY') {
    const { tilopayProvider } = await import('../providers/tilopay.provider');
    return tilopayProvider;
  }
  const { stripeProvider } = await import('../providers/stripe.provider');
  return stripeProvider as unknown as IPaymentProvider;
}
