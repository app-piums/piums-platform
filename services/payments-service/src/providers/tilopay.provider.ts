import crypto from 'crypto';
import { getTilopayToken } from '../utils/tilopay-token-cache';
import { logger } from '../utils/logger';
import type {
  IPaymentProvider,
  CheckoutParams,
  CheckoutResult,
  RefundPaymentParams,
  RefundPaymentResult,
} from './payment-provider.interface';

const TILOPAY_API_URL = process.env.TILOPAY_API_URL || 'https://app.tilopay.com/api/v1';
const TILOPAY_WEBHOOK_SECRET = process.env.TILOPAY_WEBHOOK_SECRET || '';
const TILOPAY_API_KEY = process.env.TILOPAY_API_KEY || '';
const TILOPAY_API_SECRET = process.env.TILOPAY_API_SECRET || '';
const TILOPAY_API_USER = process.env.TILOPAY_API_USER || '';

export class TilopayProvider implements IPaymentProvider {
  async createCheckout(params: CheckoutParams): Promise<CheckoutResult> {
    const token = await getTilopayToken();

    // Tilopay expects amount in dollars with 2 decimals, not centavos
    const amountDecimal = (params.amount / 100).toFixed(2);
    const orderNumber = `piums_${params.bookingId}_${Date.now()}`;

    // POST /processPayment — hosted redirect flow
    // Fields per official Tilopay Postman collection
    const orderPayload: Record<string, string> = {
      key: TILOPAY_API_KEY,
      amount: amountDecimal,
      currency: params.currency.toUpperCase(),
      orderNumber,
      capture: '1',
      tokenize: '1',  // request card tokenization — Tilopay returns hash in redirect URL
      // redirect = página del frontend a la que Tilopay redirige al usuario tras el pago
      redirect: params.returnUrl ||
        `${process.env.CLIENT_APP_URL || 'http://localhost:3000'}/booking/confirmation/${params.bookingId}`,
      // billToEmail es requerido por Tilopay
      billToEmail: params.userEmail || 'noreply@piums.io',
    };

    let res: Response;
    try {
      res = await fetch(`${TILOPAY_API_URL}/processPayment`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      });
    } catch (networkErr: any) {
      logger.error('Tilopay processPayment network error', 'TILOPAY_PROVIDER', { error: networkErr.message });
      throw new Error(`Tilopay network error: ${networkErr.message}`);
    }

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      logger.error('Tilopay processPayment failed', 'TILOPAY_PROVIDER', {
        status: res.status,
        body: errBody,
        bookingId: params.bookingId,
      });
      throw new Error(`Tilopay order creation failed: HTTP ${res.status}`);
    }

    const data = await res.json() as any;
    // Tilopay returns the hosted payment URL in data.url or data.redirect
    const redirectUrl: string = data.url || data.redirect || data.redirectUrl;
    const providerRef: string = data.orderNumber || data.order_number || orderNumber;

    logger.info('Tilopay order created', 'TILOPAY_PROVIDER', {
      providerRef,
      hasRedirect: !!redirectUrl,
      bookingId: params.bookingId,
    });

    return {
      providerRef,
      redirectUrl,
      requiresAction: !!redirectUrl,
      status: redirectUrl ? 'requires_action' : 'pending',
      provider: 'TILOPAY',
    };
  }

  async refundPayment(params: RefundPaymentParams): Promise<RefundPaymentResult> {
    const token = await getTilopayToken();

    // POST /processModification with type=2 (refund)
    const refundPayload: Record<string, any> = {
      key: TILOPAY_API_KEY,
      orderNumber: params.providerRef,
      type: '2',
    };

    if (params.amount) {
      refundPayload.amount = (params.amount / 100).toFixed(2);
    }

    let res: Response;
    try {
      res = await fetch(`${TILOPAY_API_URL}/processModification`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(refundPayload),
      });
    } catch (networkErr: any) {
      logger.error('Tilopay refund network error', 'TILOPAY_PROVIDER', { error: networkErr.message });
      throw new Error(`Tilopay network error: ${networkErr.message}`);
    }

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      logger.error('Tilopay refund failed', 'TILOPAY_PROVIDER', {
        status: res.status,
        body: errBody,
        orderNumber: params.providerRef,
      });
      throw new Error(`Tilopay refund failed: HTTP ${res.status}`);
    }

    const data = await res.json() as any;

    logger.info('Tilopay refund created', 'TILOPAY_PROVIDER', {
      refundId: data.refundId || data.id,
      orderNumber: params.providerRef,
    });

    return {
      refundId: data.refundId || data.id || `tilopay_refund_${Date.now()}`,
      status: data.status || 'pending',
      amount: params.amount ?? 0,
    };
  }

  /**
   * One-click charge using a previously tokenized card hash.
   * Uses Tilopay's subscriptionPayment endpoint.
   */
  async chargeToken(params: {
    hash: string;
    amount: number;  // in cents
    currency: string;
    bookingId: string;
  }): Promise<{ orderNumber: string; approved: boolean; responseCode: string }> {
    const token = await getTilopayToken();
    const amountDecimal = (params.amount / 100).toFixed(2);
    const orderNumber = `piums_${params.bookingId}_${Date.now()}`;

    let res: Response;
    try {
      res = await fetch(`${TILOPAY_API_URL}/subscriptionPayment`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: TILOPAY_API_KEY,
          hash: params.hash,
          amount: amountDecimal,
          currency: params.currency.toUpperCase(),
          orderNumber,
        }),
      });
    } catch (networkErr: any) {
      logger.error('Tilopay chargeToken network error', 'TILOPAY_PROVIDER', { error: networkErr.message });
      throw new Error(`Tilopay network error: ${networkErr.message}`);
    }

    const data = await res.json() as any;
    const responseCode: string = data.responseCode || data.response_code || '';
    const approved = responseCode === '00';

    logger.info('Tilopay chargeToken result', 'TILOPAY_PROVIDER', {
      orderNumber,
      approved,
      responseCode,
      bookingId: params.bookingId,
    });

    return { orderNumber, approved, responseCode };
  }

  /**
   * OrderHash V2 — verifica la firma del webhook de Tilopay.
   *
   * Algoritmo (fuente: plugin WooCommerce oficial de Tilopay):
   *   key     = "{tilopay_orderId}|{api_Key}|{api_password}"
   *   message = http_build_query({ api_Key, api_user, orderId, external_orden_id,
   *                                amount, currency, responseCode, auth, email })
   *   hash    = HMAC-SHA256(key, message) → hex lowercase
   */
  verifyOrderHashV2(payload: {
    orderId: string;
    external_orden_id?: string;
    amount: string;
    currency: string;
    responseCode?: string;
    auth?: string;
    email?: string;
    orderHash: string;
  }): boolean {
    if (!TILOPAY_API_KEY || !TILOPAY_API_SECRET) {
      logger.warn('Tilopay credentials no configuradas — saltando verificación OrderHash V2', 'TILOPAY_PROVIDER');
      return false;
    }
    try {
      const hmacKey = `${payload.orderId}|${TILOPAY_API_KEY}|${TILOPAY_API_SECRET}`;

      const fields: [string, string][] = [
        ['api_Key',           TILOPAY_API_KEY],
        ['api_user',          TILOPAY_API_USER],
        ['orderId',           payload.orderId],
        ['external_orden_id', payload.external_orden_id ?? ''],
        ['amount',            payload.amount],
        ['currency',          payload.currency],
        ['responseCode',      payload.responseCode ?? ''],
        ['auth',              payload.auth ?? ''],
        ['email',             payload.email ?? ''],
      ];
      const message = fields
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');

      const expected = crypto
        .createHmac('sha256', hmacKey)
        .update(message)
        .digest('hex');

      const receivedBuf = Buffer.from((payload.orderHash ?? '').toLowerCase());
      const expectedBuf = Buffer.from(expected.toLowerCase());
      if (receivedBuf.length !== expectedBuf.length) return false;
      return crypto.timingSafeEqual(receivedBuf, expectedBuf);
    } catch {
      return false;
    }
  }

  // Legado — HMAC sobre el raw body con TILOPAY_WEBHOOK_SECRET (V1)
  verifyWebhookSignature(rawPayload: string, signature: string): boolean {
    if (!TILOPAY_WEBHOOK_SECRET) return false;
    try {
      const expected = crypto
        .createHmac('sha256', TILOPAY_WEBHOOK_SECRET)
        .update(rawPayload)
        .digest('hex');
      return crypto.timingSafeEqual(
        Buffer.from(signature.toLowerCase()),
        Buffer.from(expected.toLowerCase()),
      );
    } catch {
      return false;
    }
  }
}

export const tilopayProvider = new TilopayProvider();
