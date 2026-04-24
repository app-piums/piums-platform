'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'next-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/contexts/ThemeContext';
import { sdk } from '@piums/sdk';

// ─── Notification Bell ───────────────────────────────────────────────────────

function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sdk.getNotifications({ status: 'PENDING', limit: 20 })
      .then((data) => setNotifications(data.notifications ?? []))
      .catch(() => { /* notifications non-critical */ });
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const markAllRead = async () => {
    const ids = notifications.map((n) => n.id);
    if (!ids.length) return;
    try {
      await sdk.markNotificationsAsRead(ids);
      setNotifications([]);
    } catch { /* non-critical */ }
    setIsOpen(false);
  };

  const unreadCount = notifications.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        aria-label="Notificaciones"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Notificaciones</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-orange-600 hover:text-orange-700 font-medium"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="text-sm text-gray-500 px-4 py-6 text-center">Sin notificaciones nuevas</p>
          ) : (
            <ul className="max-h-72 overflow-y-auto divide-y divide-gray-100">
              {notifications.slice(0, 10).map((n) => (
                <li key={n.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                  <p className="text-sm text-gray-800 font-medium">{n.title || n.type || 'Notificación'}</p>
                  {n.message && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>}
                  {n.createdAt && (
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(n.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

interface DashboardTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
}

const tabs: DashboardTab[] = [
  {
    id: 'overview', 
    label: 'Inicio', 
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>, 
    href: '/artist/dashboard' 
  },
  { 
    id: 'gigs', 
    label: 'Reservas', 
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>, 
    href: '/artist/dashboard/bookings' 
  },
  { 
    id: 'messages', 
    label: 'Mensajes', 
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>, 
    href: '/chat',
    badge: 3
  },
  { 
    id: 'schedule', 
    label: 'Agenda', 
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>, 
    href: '/artist/dashboard/calendar' 
  },
  {
    id: 'services',
    label: 'Servicios',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
    href: '/artist/dashboard/services'
  },
  {
    id: 'ausencias',
    label: 'Ausencias / Viajes',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    href: '/artist/dashboard/ausencias'
  },
  {
    id: 'tutorial',
    label: 'Tutorial',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
    href: '/artist/tutorial'
  },
];

const financeLinks = [
  {
    id: 'wallet',
    label: 'Billetera',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
    href: '/artist/dashboard/wallet'
  },
  {
    id: 'invoices',
    label: 'Facturas',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    href: '/artist/dashboard/invoices'
  }
];

interface NavContentProps {
  pathname: string | null;
  t: (key: string) => string;
  onNavigate: () => void;
  user: any;
  onLogout: () => void;
}

const SidebarNavContent: React.FC<NavContentProps> = ({ pathname, t, onNavigate, user, onLogout }) => (
  <>
    {/* Logo */}
    <div className="px-6 py-2 border-b border-gray-100 flex items-center justify-between">
      <Link href="/artist/dashboard" className="flex items-center gap-2" onClick={onNavigate}>
        <Image src="/logo.png" alt="PIUMS" width={64} height={64} className="h-16 w-auto" unoptimized priority />
      </Link>
      <div className="flex items-center gap-1">
        <NotificationBell />
        {/* Close button — mobile only */}
        <button
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
          onClick={onNavigate}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    {/* Main Menu */}
    <div className="flex-1 px-4 py-6 overflow-y-auto">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
        {t('main')}
      </p>
      <nav className="space-y-1">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.id}
              id={`artist-nav-${tab.id}`}
              href={tab.href}
              onClick={onNavigate}
              className={`
                  flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                  ${isActive ? 'bg-orange-50 text-orange-600' : 'text-gray-700 hover:bg-gray-50'}
                `}
            >
              <div className="flex items-center gap-3">
                <div className={isActive ? 'text-orange-600' : 'text-gray-400'}>{tab.icon}</div>
                <span>{tab.label}</span>
              </div>
              {tab.badge && (
                <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {tab.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Finance Section */}
      <div className="mt-8">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
          {t('finance')}
        </p>
        <nav className="space-y-1">
          {financeLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.id}
                id={`artist-nav-${link.id}`}
                href={link.href}
                onClick={onNavigate}
                className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                    ${isActive ? 'bg-orange-50 text-orange-600' : 'text-gray-700 hover:bg-gray-50'}
                  `}
              >
                <div className={isActive ? 'text-orange-600' : 'text-gray-400'}>{link.icon}</div>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Settings Section */}
      <div className="mt-8">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
          Cuenta
        </p>
        <nav className="space-y-1">
          {[
            {
              id: 'quejas',
              label: 'Quejas',
              href: '/artist/dashboard/quejas',
              icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
            },
            {
              id: 'settings',
              label: 'Configuración',
              href: '/artist/dashboard/settings',
              icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
            },
          ].map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.id}
                id={`artist-nav-${link.id}`}
                href={link.href}
                onClick={onNavigate}
                className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                    ${isActive ? 'bg-orange-50 text-orange-600' : 'text-gray-700 hover:bg-gray-50'}
                  `}
              >
                <div className={isActive ? 'text-orange-600' : 'text-gray-400'}>{link.icon}</div>
                <span>{link.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => {
              onLogout();
              onNavigate();
            }}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-150"
          >
            <div className="text-red-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <span>Cerrar Sesión</span>
          </button>
        </nav>
      </div>
    </div>

    {/* User Profile */}
    <div className="p-4 border-t border-gray-200">
      <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
          {user?.nombre?.charAt(0).toUpperCase() || 'A'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{user?.nombre || 'Artista'}</p>
          <p className="text-xs text-gray-500 truncate">{user?.role === 'artista' ? 'Artista Pro' : 'Cliente'}</p>
        </div>
        <ThemeToggle />
      </div>
    </div>
  </>
);

export const DashboardSidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t } = useTranslation('menu');
  const [isOpen, setIsOpen] = useState(false);
  const handleClose = () => setIsOpen(false);

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-gray-200 min-h-screen flex-col">
        <SidebarNavContent pathname={pathname} t={t} onNavigate={() => {}} user={user} onLogout={logout} />
      </aside>

      {/* ── Mobile: top bar with hamburger ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <Link href="/artist/dashboard" className="flex items-center gap-2">
          <Image src="/logo.png" alt="PIUMS" width={64} height={64} className="h-16 w-auto" unoptimized priority />
        </Link>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            aria-label="Abrir menú"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Mobile drawer ── */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={handleClose}
          />
          {/* Drawer panel */}
          <aside className="relative w-72 max-w-[85vw] bg-white flex flex-col h-full shadow-xl">
            <SidebarNavContent pathname={pathname} t={t} onNavigate={handleClose} user={user} onLogout={logout} />
          </aside>
        </div>
      )}
    </>
  );
};
