'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/navigation';
import { Loading } from '@/components/Loading';
import { useAuth } from '@/contexts/AuthContext';
import ClientSidebar from '@/components/ClientSidebar';

// Import tab components
import PersonalInfoTab from './personal/page';
import SecurityTab from './security/page';
import NotificationsTab from './notifications/page';
import PaymentsTab from './payments/page';
import DeleteAccountTab from './delete/page';

  const { t } = useTranslation('profile');
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'personal' | 'security' | 'notifications' | 'payments' | 'delete'>('personal');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return <Loading fullScreen />;
  }

  const tabs = [
    { id: 'personal' as const, label: t('personalTab'), icon: '👤' },
    { id: 'security' as const, label: t('securityTab'), icon: '🔒' },
    { id: 'notifications' as const, label: t('notificationsTab'), icon: '🔔' },
    { id: 'payments' as const, label: t('paymentsTab'), icon: '💳' },
    { id: 'delete' as const, label: t('deleteTab'), icon: '⚠️' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return <PersonalInfoTab />;
      case 'security':
        return <SecurityTab />;
      case 'notifications':
        return <NotificationsTab />;
      case 'payments':
        return <PaymentsTab />;
      case 'delete':
        return <DeleteAccountTab />;
      default:
        return <PersonalInfoTab />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ClientSidebar userName={user?.nombre ?? 'Usuario'} />

      <div className="flex-1 overflow-y-auto p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">{t('title')}</h1>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <nav className="flex flex-col sm:flex-row border-b border-gray-200 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
