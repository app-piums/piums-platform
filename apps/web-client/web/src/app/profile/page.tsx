'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Loading } from '@/components/Loading';
import { useAuth } from '@/contexts/AuthContext';

// Import tab components
import PersonalInfoTab from './personal/page';
import SecurityTab from './security/page';
import NotificationsTab from './notifications/page';
import PaymentsTab from './payments/page';
import DeleteAccountTab from './delete/page';

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'personal' | 'security' | 'notifications' | 'payments' | 'delete'>('personal');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div>
        <Navbar />
        <Loading />
      </div>
    );
  }

  const tabs = [
    { id: 'personal' as const, label: 'Información Personal', icon: '👤' },
    { id: 'security' as const, label: 'Seguridad', icon: '🔒' },
    { id: 'notifications' as const, label: 'Notificaciones', icon: '🔔' },
    { id: 'payments' as const, label: 'Métodos de Pago', icon: '💳' },
    { id: 'delete' as const, label: 'Eliminar Cuenta', icon: '⚠️' },
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs 
          items={[
            { label: 'Inicio', href: '/' },
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Mi Perfil' }
          ]}
          className="mb-6"
        />
        
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mi Perfil</h1>

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
      
      <Footer />
    </div>
  );
}
