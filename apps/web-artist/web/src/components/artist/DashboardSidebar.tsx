'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface DashboardTab {
  id: string;
  label: string;
  icon: string;
  href: string;
}

const tabs: DashboardTab[] = [
  { id: 'overview', label: 'Vista General', icon: '📊', href: '/artist/dashboard' },
  { id: 'bookings', label: 'Reservas', icon: '📅', href: '/artist/dashboard/bookings' },
  { id: 'calendar', label: 'Calendario', icon: '🗓️', href: '/artist/dashboard/calendar' },
  { id: 'services', label: 'Servicios', icon: '⚙️', href: '/artist/dashboard/services' },
  { id: 'reviews', label: 'Reviews', icon: '⭐', href: '/artist/dashboard/reviews' },
  { id: 'settings', label: 'Configuración', icon: '⚙️', href: '/artist/dashboard/settings' },
];

export const DashboardSidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Dashboard de Artista</h2>
      </div>
      
      <nav className="px-3">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`
                flex items-center gap-3 px-4 py-3 mb-2 rounded-lg text-sm font-medium transition-colors
                ${
                  isActive
                    ? 'bg-purple-100 text-purple-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }
              `}
            >
              <span className="text-xl">{tab.icon}</span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <span>←</span>
          <span>Volver a Dashboard</span>
        </Link>
      </div>
    </aside>
  );
};
