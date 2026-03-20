'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loading } from '@/components/Loading';
import { useAuth } from '@/contexts/AuthContext';
import ClientSidebar from '@/components/ClientSidebar';

import PersonalInfoTab from './personal/page';
import SecurityTab from './security/page';
import NotificationsTab from './notifications/page';
import PaymentsTab from './payments/page';
import DeleteAccountTab from './delete/page';

type TabId = 'personal' | 'security' | 'notifications' | 'payments' | 'delete';

const TABS: Array<{ id: TabId; label: string; icon: React.ReactNode; danger?: boolean }> = [
  { id: 'personal',      label: 'Información personal', icon: <UserIcon className="h-4 w-4" /> },
  { id: 'security',      label: 'Seguridad',            icon: <LockIcon className="h-4 w-4" /> },
  { id: 'notifications', label: 'Notificaciones',       icon: <BellIcon className="h-4 w-4" /> },
  { id: 'payments',      label: 'Métodos de pago',      icon: <CardIcon className="h-4 w-4" /> },
  { id: 'delete',        label: 'Eliminar cuenta',      icon: <TrashIcon className="h-4 w-4" />, danger: true },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) return <Loading fullScreen />;

  const userName = user?.nombre ?? 'Usuario';

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
      <ClientSidebar userName={userName} />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Desktop header */}
        <header className="hidden lg:flex bg-white border-b border-gray-100 px-8 py-4 items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Volver"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#FF6A00] to-pink-500 flex items-center justify-center text-white text-lg font-bold shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{userName}</h1>
            <p className="text-sm text-gray-400">{user?.email ?? ''}</p>
          </div>
        </header>

        <div className="flex-1 p-4 pt-20 lg:p-8 lg:pt-8">
          {/* Mobile: back button + avatar */}
          <div className="lg:hidden flex items-center gap-3 mb-5">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Volver"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="h-11 w-11 rounded-full bg-gradient-to-br from-[#FF6A00] to-pink-500 flex items-center justify-center text-white text-lg font-bold shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-gray-900">{userName}</p>
              <p className="text-sm text-gray-400">{user?.email ?? ''}</p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar nav — visible on desktop always; on mobile only when no tab selected */}
            <nav className={`lg:w-56 shrink-0 ${activeTab ? 'hidden lg:block' : 'block'}`}>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {TABS.map(tab => {
                  const active = (activeTab ?? 'personal') === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-left transition-colors border-b border-gray-50 last:border-b-0
                        ${
                          active
                            ? tab.danger ? 'bg-red-50 text-red-600' : 'bg-[#FF6A00]/10 text-[#FF6A00]'
                            : tab.danger ? 'text-red-500 hover:bg-red-50' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    >
                      <span className={active ? (tab.danger ? 'text-red-500' : 'text-[#FF6A00]') : 'text-gray-400'}>
                        {tab.icon}
                      </span>
                      {tab.label}
                      <svg className="ml-auto h-4 w-4 text-gray-300 lg:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      {active && (
                        <span className={`hidden lg:inline ml-auto h-1.5 w-1.5 rounded-full ${tab.danger ? 'bg-red-500' : 'bg-[#FF6A00]'}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* Tab content — visible on desktop always; on mobile only when tab selected */}
            <div className={`flex-1 min-w-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 ${activeTab ? 'block' : 'hidden lg:block'}`}>
              {/* Mobile back button */}
              <button
                onClick={() => setActiveTab(null)}
                className="lg:hidden flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800 mb-5 -mt-1 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver a configuración
              </button>
              {(activeTab ?? 'personal') === 'personal'      && <PersonalInfoTab />}
              {(activeTab ?? 'personal') === 'security'      && <SecurityTab />}
              {(activeTab ?? 'personal') === 'notifications' && <NotificationsTab />}
              {(activeTab ?? 'personal') === 'payments'      && <PaymentsTab />}
              {(activeTab ?? 'personal') === 'delete'        && <DeleteAccountTab />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function UserIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
}
function LockIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
}
function BellIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
}
function CardIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
}
function TrashIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
}
