'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardSidebar } from '@/components/artist/DashboardSidebar';
import { sdk } from '@piums/sdk';
import { useAuth } from '@/contexts/AuthContext';

type Notification = {
  id: string;
  title?: string;
  message?: string;
  type?: string;
  status?: string;
  isRead?: boolean;
  createdAt?: string;
  metadata?: { disputeId?: string; bookingId?: string };
};

const TYPE_ICONS: Record<string, string> = {
  BOOKING_REQUEST: '📋',
  BOOKING_CONFIRMED: '✅',
  BOOKING_CANCELLED: '❌',
  BOOKING_COMPLETED: '🎉',
  PAYMENT_RECEIVED: '💰',
  NEW_REVIEW: '⭐',
  NEW_MESSAGE: '💬',
  RESCHEDULE_REQUEST: '📅',
  BOOKING_NO_SHOW: '🚨',
  SYSTEM: 'ℹ️',
};

const NO_SHOW_TYPES = new Set(['BOOKING_NO_SHOW', 'ARTIST_NO_SHOW']);

function NotificationItem({ n, onMarkRead }: { n: Notification; onMarkRead: (id: string) => void }) {
  const icon = TYPE_ICONS[n.type ?? ''] ?? '🔔';
  const isUnread = n.status === 'PENDING' || n.isRead === false;
  const isNoShow = NO_SHOW_TYPES.has(n.type ?? '');
  const disputeId = n.metadata?.disputeId;
  const date = n.createdAt
    ? new Date(n.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div
      className={`flex gap-4 p-4 rounded-xl border transition-colors ${
        isNoShow
          ? 'bg-red-50 border-red-200'
          : isUnread
          ? 'bg-orange-50 border-orange-100'
          : 'bg-white border-gray-100'
      }`}
    >
      <span className="text-2xl shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${isNoShow ? 'text-red-900' : isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
          {n.title || n.type || 'Notificación'}
        </p>
        {n.message && (
          <p className={`text-sm mt-0.5 leading-snug ${isNoShow ? 'text-red-700' : 'text-gray-500'}`}>{n.message}</p>
        )}
        {isNoShow && (
          <div className="mt-2">
            <Link
              href={disputeId ? `/artist/dashboard/quejas/${disputeId}` : '/artist/dashboard/quejas'}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              Ver queja y responder
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <p className="text-xs text-red-600 mt-1.5">Tienes 24h para responder antes de que se procesen acciones automáticas.</p>
          </div>
        )}
        {date && <p className="text-xs text-gray-400 mt-1.5">{date}</p>}
      </div>
      {isUnread && (
        <button
          onClick={() => onMarkRead(n.id)}
          className="shrink-0 text-xs font-medium text-orange-600 hover:text-orange-700 transition-colors"
        >
          Leída
        </button>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
  }, [isAuthenticated, authLoading, router]);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await sdk.getNotifications({ limit: 50 });
      setNotifications(data.notifications ?? []);
    } catch {
      setError('No se pudieron cargar las notificaciones.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchNotifications();
  }, [isAuthenticated, fetchNotifications]);

  const handleMarkRead = async (id: string) => {
    try {
      await sdk.markNotificationsAsRead([id]);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: 'READ', isRead: true } : n))
      );
    } catch { /* non-critical */ }
  };

  const handleMarkAllRead = async () => {
    const unreadIds = notifications
      .filter((n) => n.status === 'PENDING' || n.isRead === false)
      .map((n) => n.id);
    if (!unreadIds.length) return;
    setMarkingAll(true);
    try {
      await sdk.markNotificationsAsRead(unreadIds);
      setNotifications((prev) => prev.map((n) => ({ ...n, status: 'READ', isRead: true })));
    } catch { /* non-critical */ } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => n.status === 'PENDING' || n.isRead === false).length;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DashboardSidebar />
      <main className="flex-1 lg:ml-72 p-6 pt-20 lg:pt-6 max-w-2xl mx-auto w-full">

        <div className="flex items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500 mt-0.5">
                <span className="font-semibold text-orange-600">{unreadCount}</span> sin leer
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="text-sm font-medium text-orange-600 hover:text-orange-700 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {markingAll ? 'Marcando…' : 'Marcar todas como leídas'}
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Cargando notificaciones…</div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-600">{error}</div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-20 text-center">
            <span className="text-4xl block mb-3">🔔</span>
            <p className="text-sm font-medium text-gray-600">Sin notificaciones por ahora</p>
            <p className="text-xs text-gray-400 mt-1">Te avisaremos cuando recibas nuevas solicitudes o pagos.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <NotificationItem key={n.id} n={n} onMarkRead={handleMarkRead} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
