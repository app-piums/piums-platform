/**
 * test-order-hash.ts
 *
 * Prueba la verificación OrderHash V2 de Tilopay sin credenciales reales.
 *
 * Uso:
 *   cd services/payments-service
 *   npx tsx scripts/test-order-hash.ts
 *
 * El servidor de payments-service debe estar corriendo en localhost:4007.
 * Las credenciales de TEST_* deben coincidir con las de tu .env local.
 */

import crypto from 'crypto';

// ─── Credenciales de prueba (deben coincidir con tu .env) ────────────────────
// Pon cualquier valor mientras sean consistentes entre .env y este script.
const TEST_API_KEY    = process.env.TILOPAY_API_KEY    || 'test_api_key_abc123';
const TEST_API_SECRET = process.env.TILOPAY_API_SECRET || 'test_api_secret_xyz789';
const TEST_API_USER   = process.env.TILOPAY_API_USER   || 'test@example.com';
const WEBHOOK_URL     = process.env.WEBHOOK_URL        || 'http://localhost:4007/callbacks/tilopay';

// ─── Función que replica el algoritmo del servidor ───────────────────────────

function computeOrderHashV2(params: {
  orderId: string;
  external_orden_id: string;
  amount: string;
  currency: string;
  responseCode: string;
  auth: string;
  email: string;
}): string {
  const hmacKey = `${params.orderId}|${TEST_API_KEY}|${TEST_API_SECRET}`;

  const fields: [string, string][] = [
    ['api_Key',          TEST_API_KEY],
    ['api_user',         TEST_API_USER],
    ['orderId',          params.orderId],
    ['external_orden_id', params.external_orden_id],
    ['amount',           params.amount],
    ['currency',         params.currency],
    ['responseCode',     params.responseCode],
    ['auth',             params.auth],
    ['email',            params.email],
  ];

  const message = fields
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  return crypto
    .createHmac('sha256', hmacKey)
    .update(message)
    .digest('hex');
}

// ─── Payload de prueba ───────────────────────────────────────────────────────

const testPayload = {
  orderId:          'tilopay_order_999',
  external_orden_id: 'piums_booking-test-123_1746000000000',
  amount:           '150.00',
  currency:         'USD',
  responseCode:     '00',
  auth:             'AUTH123456',
  email:            'cliente@example.com',
  status:           'approved',
  metadata: {
    bookingId: 'booking-test-123',
    userId:    'user-test-456',
  },
};

// ─── Casos de prueba ─────────────────────────────────────────────────────────

async function sendWebhook(label: string, body: object) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`▶ ${label}`);
  console.log('  Body:', JSON.stringify(body, null, 2).replace(/\n/g, '\n  '));

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    console.log(`  HTTP: ${res.status} ${res.statusText}`);
    const text = await res.text().catch(() => '');
    if (text) console.log(`  Resp: ${text}`);
  } catch (err: any) {
    console.error(`  ✗ Error de red: ${err.message}`);
    console.error('    ¿Está corriendo el servidor? npm run dev en payments-service');
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║         Test OrderHash V2 — Tilopay webhook            ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`\nCredenciales de prueba:`);
  console.log(`  TILOPAY_API_KEY    = ${TEST_API_KEY}`);
  console.log(`  TILOPAY_API_SECRET = ${TEST_API_SECRET}`);
  console.log(`  TILOPAY_API_USER   = ${TEST_API_USER}`);
  console.log(`  Webhook URL        = ${WEBHOOK_URL}`);

  // 1. Calcular el hash correcto
  const validHash = computeOrderHashV2(testPayload);
  console.log(`\nOrderHash calculado: ${validHash}`);

  // ── Test 1: hash válido — debe procesarse ─────────────────────────────────
  await sendWebhook(
    'Test 1: hash VÁLIDO (debe procesarse y loguear "aprobado")',
    { ...testPayload, orderHash: validHash },
  );

  // ── Test 2: hash inválido — debe descartarse ──────────────────────────────
  await sendWebhook(
    'Test 2: hash INVÁLIDO (debe descartarse con log ERROR)',
    { ...testPayload, orderHash: 'aabbccdd' + 'x'.repeat(56) },
  );

  // ── Test 3: sin hash — debe aceptarse con SECURITY_WARNING ───────────────
  await sendWebhook(
    'Test 3: sin orderHash (debe aceptarse con SECURITY_WARNING en log)',
    { ...testPayload },
  );

  // ── Test 4: payload incompleto ────────────────────────────────────────────
  await sendWebhook(
    'Test 4: payload incompleto — sin orderId (debe loguar advertencia)',
    { status: 'approved', orderHash: validHash },
  );

  // ── Test 5: declined ─────────────────────────────────────────────────────
  const declinedHash = computeOrderHashV2({ ...testPayload, responseCode: '51' });
  await sendWebhook(
    'Test 5: pago DECLINED con hash válido',
    { ...testPayload, status: 'declined', responseCode: '51', orderHash: declinedHash },
  );

  console.log(`\n${'─'.repeat(60)}`);
  console.log('✓ Tests enviados. Revisa los logs del servidor para confirmar');
  console.log('  el comportamiento esperado en cada caso.\n');
}

main();
