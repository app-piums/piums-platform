'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ClientSidebar from '@/components/ClientSidebar';
import { Loading } from '@/components/Loading';
import { sdk } from '@piums/sdk';
import { useAuth } from '@/contexts/AuthContext';
import {
  CheckCircle, XCircle, Clock, DollarSign,
  Star, MessageCircle, Info, Bell
} from 'lucide-react';

type NotificationIconKey =
  | 'BOOKING_CONFIRMED' | 'BOOKING_CANCELLED' | 'BOOKING_REJECTED'
  | 'BOOKING_PENDING' | 'PAYMENT_RECEIVED' | 'NEW_REVIEW'
  | 'NEW_MESSAGE' | 'SYSTEM';

const TYPE_ICON_MAP: Record<NotificationIconKey, React.ReactElement> = {
  BOOKING_CONFIRMED:  <CheckCircle   size={20} className="text-green-500" />,
  BOOKING_CANCELLED:  <XCircle       size={20} className="text-red-500" />,
  BOOKING_REJECTED:   <XCircle       size={20} className="text-red-500" />,
  BOOKING_PENDING:    <Clock         size={20} className="text-orange-400" />,
  PAYMENT_RECEIVED:   <DollarSign    size={20} className="text-green-600" />,
  NEW_REVIEW:         <Star          size={20} className="text-yellow-500" />,
  NEW_MESSAGE:        <MessageCircle size={20} className="text-blue-400" />,
  SYSTEM:             <Info          size={20} className="text-gray-400" />,
};

const DEFAULT_ICON = <Bell size={20} className="text-gray-400" />;

type Notification = {
  id: string;
  title?: string;
  message?: string;
  type?: string;
  status?: string;
  isRead?: boolean;
  createdAt?: string;
  data?: Record<string, string>;
};

function NotificationItem({ n, onMarkRead }: { n: Notification; onMarkRead: (id: string) => void }) {
  const icon = TYPE_ICON_MAP[n.type as NotificationIconKey] ?? DEFAULT_ICON;
  const isUnread = n.status === 'PENDING' || n.isRead === false;
  const date = n.createdAt
    ? new Date(n.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div
      className={`flex gap-4 p-4 rounded-xl border transition-colors ${
        isUnread ? 'bg-orange-50 border-orange-100' : 'bg-white border-gray-100'
      }`}
    >
      <div className="flex items-start gap-3 p-1 shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
          {n.title || n.type || 'Notificación'}
        </p>
        {n.message && (
          <p className="text-sm text-gray-500 mt-0.5 leading-snug">{n.message}</p>
        )}
        {date && <p className="text-xs text-gray-400 mt-1.5">{date}</p>}
      </div>
      {isUnread && (
        <button
          onClick={() => onMarkRead(n.id)}
          className="shrink-0 text-xs font-medium text-[#FF6B35] hover:text-orange-700 transition-colors"
        >
          Marcar leída
        </button>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const userName = user?.nombre ?? user?.email ?? 'Usuario';

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
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, status: 'READ', isRead: true }))
      );
    } catch { /* non-critical */ } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => n.status === 'PENDING' || n.isRead === false).length;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#FAFAFA] overflow-x-hidden">
      <ClientSidebar userName={userName} />
      <main className="flex-1 min-w-0 max-w-2xl mx-auto w-full px-4 md:px-6 py-6 lg:py-8 pt-20 lg:pt-8">

        <div className="flex items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500 mt-0.5">
                Tienes <span className="font-semibold text-[#FF6B35]">{unreadCount}</span> sin leer
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="text-sm font-medium text-[#FF6B35] hover:text-orange-700 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {markingAll ? 'Marcando…' : 'Marcar todas como leídas'}
            </button>
          )}
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-600">{error}</div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-20 text-center">
            <Bell size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-medium text-gray-600">Sin notificaciones por ahora</p>
            <p className="text-xs text-gray-400 mt-1">Te avisaremos cuando haya novedades en tus reservas.</p>
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
