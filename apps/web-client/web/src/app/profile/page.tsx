'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { PageHelpButton } from '@/components/PageHelpButton';
import { useRouter } from 'next/navigation';
import { Loading } from '@/components/Loading';
import { useAuth } from '@/contexts/AuthContext';
import ClientSidebar from '@/components/ClientSidebar';
import { UNSAVED_CHANGES_MESSAGE } from '@/hooks/useUnsavedChangesPrompt';

import PersonalInfoTab from './personal/page';
import SecurityTab from './security/page';
import NotificationsTab from './notifications/page';
import PaymentsTab from './payments/page';
import DeleteAccountTab from './delete/page';
import LegalTab from './legal/page';
import VerifyClientTab from './verify/page';

type TabId = 'personal' | 'security' | 'notifications' | 'payments' | 'delete' | 'legal' | 'verificar';

const TABS: Array<{ id: TabId; label: string; icon: React.ReactNode; danger?: boolean; badge?: boolean }> = [
  { id: 'personal',      label: 'Információn personal', icon: <UserIcon className="h-4 w-4" /> },
  { id: 'verificar',     label: 'Verificar cuenta',   icon: <ShieldIcon className="h-4 w-4" /> },
  { id: 'security',      label: 'Seguridad',            icon: <LockIcon className="h-4 w-4" /> },
  { id: 'notifications', label: 'Notificaciones',       icon: <BellIcon className="h-4 w-4" /> },
  { id: 'payments',      label: 'Métodos de pago',      icon: <CardIcon className="h-4 w-4" /> },
  { id: 'delete',        label: 'Eliminar cuenta',      icon: <TrashIcon className="h-4 w-4" />, danger: true },
  { id: 'legal',         label: 'Legal',                icon: <ScaleIcon className="h-4 w-4" /> },
];

const DEFAULT_DIRTY_STATE: Record<TabId, boolean> = {
  personal: false,
  security: false,
  notifications: false,
  payments: false,
  delete: false,
  legal: false,
  verificar: false,
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId | null>(null);
  const [dirtyTabs, setDirtyTabs] = useState<Record<TabId, boolean>>(DEFAULT_DIRTY_STATE);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isLoading, isAuthenticated, router]);

  const currentTab = activeTab ?? 'personal';

  const confirmLeaveCurrentTab = useCallback(() => {
    if (!dirtyTabs[currentTab]) return true;
    return window.confirm(UNSAVED_CHANGES_MESSAGE);
  }, [currentTab, dirtyTabs]);

  const handleDirtyChange = useCallback((tabId: TabId, isDirty: boolean) => {
    setDirtyTabs((prev) => (prev[tabId] === isDirty ? prev : { ...prev, [tabId]: isDirty }));
  }, []);

  const handleGlobalNavigationAttempt = useCallback(() => {
    return confirmLeaveCurrentTab();
  }, [confirmLeaveCurrentTab]);

  const handleBackNavigation = () => {
    if (!confirmLeaveCurrentTab()) return;
    router.back();
  };

  const handleTabSelection = (tabId: TabId) => {
    if (currentTab !== tabId && !confirmLeaveCurrentTab()) return;
    setActiveTab(tabId);
  };

  const handleCloseContent = () => {
    if (!confirmLeaveCurrentTab()) return;
    setActiveTab(null);
  };

  if (isLoading || !isAuthenticated) return <Loading fullScreen />;

  const userName = user?.nombre ?? 'Usuario';
  const needsVerification = !user?.ciudad || !user?.birthDate;

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
      <ClientSidebar userName={userName} onNavigateAttempt={handleGlobalNavigationAttempt} />
        <PageHelpButton tourId="profileTour" />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Desktop header */}
        <header className="hidden lg:flex bg-white border-b border-gray-100 px-8 py-4 items-center gap-4">
          <button
            onClick={handleBackNavigation}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Volver"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#FF6B35] to-pink-500 flex items-center justify-center text-white text-lg font-bold shrink-0">
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
              onClick={handleBackNavigation}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Volver"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="h-11 w-11 rounded-full bg-gradient-to-br from-[#FF6B35] to-pink-500 flex items-center justify-center text-white text-lg font-bold shrink-0">
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
                  const active = currentTab === tab.id;
                  const showBadge = tab.id === 'verificar' && needsVerification;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabSelection(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-left transition-colors border-b border-gray-50 last:border-b-0
                        ${
                          active
                            ? tab.danger ? 'bg-red-50 text-red-600' : 'bg-[#FF6B35]/10 text-[#FF6B35]'
                            : tab.danger ? 'text-red-500 hover:bg-red-50' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    >
                      <span className={active ? (tab.danger ? 'text-red-500' : 'text-[#FF6B35]') : 'text-gray-400'}>
                        {tab.icon}
                      </span>
                      {tab.label}
                      {showBadge && (
                        <span className="ml-1 h-2 w-2 rounded-full bg-amber-400 shrink-0" />
                      )}
                      <svg className="ml-auto h-4 w-4 text-gray-300 lg:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      {active && !showBadge && (
                        <span className={`hidden lg:inline ml-auto h-1.5 w-1.5 rounded-full ${tab.danger ? 'bg-red-500' : 'bg-[#FF6B35]'}`} />
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
                onClick={handleCloseContent}
                className="lg:hidden flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800 mb-5 -mt-1 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver a configuración
              </button>
              {currentTab === 'personal'      && (
                <PersonalInfoTab onDirtyChange={(dirty) => handleDirtyChange('personal', dirty)} />
              )}
              {currentTab === 'verificar'     && <VerifyClientTab />}
              {currentTab === 'security'      && (
                <SecurityTab onDirtyChange={(dirty) => handleDirtyChange('security', dirty)} />
              )}
              {currentTab === 'notifications' && (
                <NotificationsTab onDirtyChange={(dirty) => handleDirtyChange('notifications', dirty)} />
              )}
              {currentTab === 'payments'      && <PaymentsTab />}
              {currentTab === 'delete'        && <DeleteAccountTab />}
              {currentTab === 'legal'         && <LegalTab />}
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
function ShieldIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
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
function ScaleIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>;
}
