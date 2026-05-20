'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { sdk, TicketPurchase } from '@piums/sdk';
import Link from 'next/link';
import ClientSidebar from '@/components/ClientSidebar';

function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('es-CR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

export default function TicketConfirmationPage() {
  const params = useParams();
  const purchaseId = params['purchaseId'] as string;

  const [purchase, setPurchase] = useState<TicketPurchase | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pollingAttempts, setPollingAttempts] = useState(0);

  const loadQr = useCallback(async (code: string) => {
    try {
      const QRCode = (await import('qrcode')).default;
      const url = await QRCode.toDataURL(code, { width: 220, margin: 2 });
      setQrDataUrl(url);
    } catch {
      // QR generation failed — non-critical
    }
  }, []);

  const fetchPurchase = useCallback(async () => {
    try {
      const p = await (sdk as any).getTicketPurchase(purchaseId) as TicketPurchase;
      setPurchase(p);
      if (p.status === 'PAGADO' || p.status === 'USADO') {
        setLoading(false);
        loadQr(p.code);
      }
      return p.status;
    } catch (err: any) {
      setError(err.message || 'Error al cargar el boleto');
      setLoading(false);
      return 'ERROR';
    }
  }, [purchaseId, loadQr]);

  useEffect(() => {
    fetchPurchase();
  }, [fetchPurchase]);

  // Poll until PAGADO (max 10 attempts, 3s apart)
  useEffect(() => {
    if (!loading) return;
    if (pollingAttempts >= 10) { setLoading(false); return; }
    const timer = setTimeout(async () => {
      const status = await fetchPurchase();
      if (status !== 'PAGADO' && status !== 'USADO' && status !== 'ERROR') {
        setPollingAttempts(a => a + 1);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [loading, pollingAttempts, fetchPurchase]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
        <ClientSidebar userName="" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Verificando tu pago...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !purchase) {
    return (
      <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
        <ClientSidebar userName="" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm px-4">
            <p className="text-red-500 mb-4">{error || 'No se encontro el boleto'}</p>
            <Link href="/mis-tickets" className="text-indigo-600 hover:underline text-sm">Ver mis boletos</Link>
          </div>
        </main>
      </div>
    );
  }

  const isPaid = purchase.status === 'PAGADO' || purchase.status === 'USADO';

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
      <ClientSidebar userName="" />
    <main className="flex-1 flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm max-w-sm w-full overflow-hidden">

        {/* Header */}
        <div className={`p-5 text-center ${isPaid ? 'bg-green-50' : 'bg-yellow-50'}`}>
          {isPaid ? (
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-7 h-7 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
          <h1 className="text-lg font-bold text-gray-900">{isPaid ? 'Pago confirmado' : 'Pago pendiente'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{isPaid ? 'Tu boleto esta listo' : 'Esperando confirmacion del pago'}</p>
        </div>

        {/* Ticket details */}
        <div className="p-5">
          {purchase.ticketEvent && (
            <div className="mb-4">
              <p className="font-semibold text-gray-900 text-base">{(purchase.ticketEvent as any).name}</p>
              {(purchase.ticketEvent as any).eventDate && (
                <p className="text-sm text-gray-500 mt-0.5">{formatDate((purchase.ticketEvent as any).eventDate)}</p>
              )}
            </div>
          )}

          <div className="space-y-2 text-sm mb-5">
            <div className="flex justify-between">
              <span className="text-gray-500">Codigo</span>
              <span className="font-mono font-semibold text-gray-900">{purchase.code}</span>
            </div>
            {purchase.tier && (
              <div className="flex justify-between">
                <span className="text-gray-500">Tipo</span>
                <span className="text-gray-900">{(purchase.tier as any).name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Cantidad</span>
              <span className="text-gray-900">{purchase.quantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total</span>
              <span className="font-semibold text-gray-900">
                {purchase.totalCents === 0 ? 'Gratis' : `$${(purchase.totalCents / 100).toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Comprador</span>
              <span className="text-gray-900">{purchase.buyerName}</span>
            </div>
          </div>

          {/* QR code */}
          {isPaid && qrDataUrl && (
            <div className="text-center border-t border-gray-100 pt-5">
              <p className="text-xs text-gray-500 mb-3">Presenta este codigo en la entrada</p>
              <img src={qrDataUrl} alt="QR del boleto" className="w-40 h-40 mx-auto" />
              <p className="text-xs font-mono text-gray-400 mt-2">{purchase.code}</p>
            </div>
          )}

          {isPaid && !qrDataUrl && (
            <div className="text-center border-t border-gray-100 pt-5">
              <p className="text-xs text-gray-500">Codigo: <span className="font-mono font-semibold text-gray-900">{purchase.code}</span></p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <Link
            href="/mis-tickets"
            className="block w-full text-center py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            Ver mis boletos
          </Link>
        </div>
      </div>
    </main>
    </div>
  );
}
