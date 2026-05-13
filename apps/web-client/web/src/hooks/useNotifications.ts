'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';

type RawNotification = {
  id?: string | number;
  title?: string;
  subject?: string;
  body?: string;
  message?: string;
  description?: string;
  createdAt?: string;
  created_at?: string;
  readAt?: string | null;
  status?: string;
  metadata?: { actionUrl?: string };
  actionUrl?: string;
  category?: string;
  channel?: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  actionUrl?: string | null;
  category?: string;
};

const FALLBACK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'demo-1',
    title: 'Reserva confirmada',
    message: 'Tu sesión con DJ Alex quedó confirmada para el 28 de marzo a las 20:00.',
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    read: false,
    actionUrl: '/bookings',
    category: 'booking',
  },
  {
    id: 'demo-2',
    title: 'Nuevo mensaje',
    message: 'Sarah J. respondió a tu consulta sobre paquetes de fotografía.',
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    read: false,
    actionUrl: '/chat',
    category: 'chat',
  },
  {
    id: 'demo-3',
    title: 'Pago recibido',
    message: 'Registramos el pago parcial de tu evento corporativo.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    read: true,
    actionUrl: '/payments',
    category: 'payments',
  },
];

const safeId = (value?: string | number) => {
  if (value !== undefined && value !== null) return String(value);
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

const normalizeNotifications = (input: RawNotification[] = []): NotificationItem[] =>
  input.map((item) => ({
    id: safeId(item.id),
    title: item.title ?? item.subject ?? 'Notificación',
    message: item.message ?? item.body ?? item.description ?? 'Tienes una actualización pendiente.',
    createdAt: item.createdAt ?? item.created_at ?? new Date().toISOString(),
    read: item.status ? item.status.toLowerCase() === 'read' : Boolean(item.readAt),
    actionUrl: item.metadata?.actionUrl ?? item.actionUrl ?? null,
    category: item.category ?? item.channel,
  }));

const CHAT_SOCKET_URL =
  typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? (process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || 'https://backend.piums.io')
    : (process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || 'http://localhost:4010');

export function useNotifications(limit: number = 6) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Real-time: connect to chat-service socket and listen for new notifications
  useEffect(() => {
    let socket: Socket | null = null;

    fetch('/api/chat/token', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (!data?.token) return;

        socket = io(CHAT_SOCKET_URL, {
          path: '/socket.io/',
          transports: ['polling', 'websocket'],
          auth: { token: data.token },
          reconnectionAttempts: 3,
        });

        socket.on('notification:new', (notif: RawNotification) => {
          setNotifications((prev) => {
            const normalized = normalizeNotifications([notif]);
            return [...normalized, ...prev];
          });
        });
      })
      .catch(() => { /* auth not available — skip socket */ });

    return () => {
      socket?.disconnect();
    };
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/notifications?limit=${limit}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Error al cargar notificaciones');
      }

      const payload = await response.json();
      const list: RawNotification[] =
        payload.notifications || payload.data || payload.items || payload.results || [];

      const normalized = normalizeNotifications(list);
      setNotifications(normalized.length ? normalized : FALLBACK_NOTIFICATIONS);
    } catch (err) {
      setError('Mostrando tus últimas notificaciones guardadas.');
      setNotifications((prev) => (prev.length ? prev : FALLBACK_NOTIFICATIONS));
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const markAsRead = useCallback(
    async (targetIds?: string[]) => {
      const ids = targetIds && targetIds.length ? targetIds : notifications.filter((n) => !n.read).map((n) => n.id);
      if (!ids.length) return;

      setNotifications((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)));

      try {
        await fetch('/api/notifications/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ notificationIds: ids }),
        });
      } catch (err) {
        // Best-effort: keep optimistic state but log in console
        console.warn('No se pudo sincronizar estado de notificaciones', err);
      }
    },
    [notifications]
  );

  return {
    notifications,
    loading,
    error,
    unreadCount,
    refresh: fetchNotifications,
    markAsRead,
  };
}
