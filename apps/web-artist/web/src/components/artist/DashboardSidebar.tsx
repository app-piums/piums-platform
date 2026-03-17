'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'next-i18next';

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

export const DashboardSidebar: React.FC = () => {
  const pathname = usePathname();
  const { t } = useTranslation('menu');

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <Link href="/artist/dashboard" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">P</span>
          </div>
          <span className="text-xl font-bold text-gray-900">PIUMS</span>
        </Link>
      </div>
      
      {/* Main Menu */}
      <div className="flex-1 px-4 py-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
          {t('main')}
        </p>
        <nav className="space-y-1">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`
                  flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                  ${
                    isActive
                      ? 'bg-orange-50 text-orange-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={isActive ? 'text-orange-600' : 'text-gray-400'}>
                    {tab.icon}
                  </div>
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
                  href={link.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                    ${
                      isActive
                        ? 'bg-orange-50 text-orange-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className={isActive ? 'text-orange-600' : 'text-gray-400'}>
                    {link.icon}
                  </div>
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
                  href={link.href}
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

      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
            AM
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">Alex Morgan</p>
            <p className="text-xs text-gray-500">Pro Creative</p>
          </div>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </aside>
  );
};
