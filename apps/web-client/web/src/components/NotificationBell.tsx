'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useNotifications } from '@/hooks/useNotifications';

const formatTimeAgo = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Justo ahora';
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} día${days === 1 ? '' : 's'}`;
};

const BellIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

export function NotificationBell() {
  const { notifications, unreadCount, loading, error, refresh, markAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    markAsRead();
  }, [open, markAsRead]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
        aria-label="Notificaciones"
        aria-expanded={open}
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-[#FF6B35] rounded-full" aria-hidden />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl z-50">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Notificaciones</p>
              <p className="text-xs text-gray-400">{unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al día'}</p>
            </div>
            <button
              onClick={refresh}
              className="text-xs font-medium text-[#FF6B35] hover:text-[#db5800]"
            >
              Actualizar
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
            {loading && (
              <div className="px-4 py-6 text-center text-sm text-gray-500">Cargando...</div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-gray-500">
                Aún no tienes notificaciones
              </div>
            )}

            {!loading && notifications.map((notification) => {
              const content = (
                <div className={`px-4 py-3 transition-colors ${notification.read ? 'bg-white' : 'bg-[#FFFAF6]'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap">{formatTimeAgo(notification.createdAt)}</span>
                  </div>
                </div>
              );

              if (notification.actionUrl) {
                return (
                  <Link
                    key={notification.id}
                    href={notification.actionUrl}
                    className="block focus:outline-none focus:bg-gray-50"
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <div key={notification.id} className="block">
                  {content}
                </div>
              );
            })}
          </div>

          <div className="px-4 py-3 border-t border-gray-100">
            {error && <p className="text-xs text-amber-600 mb-2">{error}</p>}
            <Link
              href="/profile"
              className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold text-[#FF6B35] hover:text-[#db5800]"
            >
              Ver configuración
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
