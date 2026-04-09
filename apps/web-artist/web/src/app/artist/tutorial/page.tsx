'use client';

import React from 'react';
import { useNextStep } from 'nextstepjs';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loading } from '@/components/Loading';
import { DashboardSidebar } from '@/components/artist/DashboardSidebar';

const QUICK_STEPS = [
  { icon: '📊', label: 'Estadísticas clave' },
  { icon: '⏰', label: 'Próximas presentaciones' },
  { icon: '💪', label: 'Fortaleza del perfil' },
  { icon: '📋', label: 'Gestión de reservas' },
  { icon: '🗓️', label: 'Agenda de disponibilidad' },
  { icon: '🎭', label: 'Tus servicios' },
  { icon: '💳', label: 'Billetera e ingresos' },
  { icon: '⚙️', label: 'Configuración' },
];

export default function ArtistTutorialPage() {
  const { startNextStep } = useNextStep();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading || !isAuthenticated) return <Loading fullScreen />;

  function handleStart() {
    router.push('/artist/dashboard');
    setTimeout(() => startNextStep('artistTour'), 400);
  }

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
      <DashboardSidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="hidden lg:flex bg-white border-b border-gray-100 px-8 py-4 items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Tutorial</h1>
            <p className="text-sm text-gray-400">Tour guiado interactivo para artistas</p>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 pt-20 lg:p-8 lg:pt-8 flex items-center justify-center">
          <div className="max-w-lg w-full text-center">

            {/* Icon */}
            <div className="mx-auto mb-6 w-24 h-24 rounded-full bg-[#FF6A00]/10 flex items-center justify-center">
              <svg className="w-12 h-12 text-[#FF6A00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">Tour para Artistas</h1>
            <p className="text-gray-500 mb-2 leading-relaxed">
              Tour interactivo de <span className="font-semibold text-gray-700">16 pasos</span> que recorre cada herramienta de gestión artística.
            </p>
            <p className="text-sm text-gray-400 mb-8">Tiempo estimado: ~2 minutos</p>

            {/* Steps grid */}
            <div className="grid grid-cols-2 gap-2.5 mb-8 text-left">
              {QUICK_STEPS.map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-2.5 bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                  <div className="h-7 w-7 rounded-lg bg-[#FF6A00]/10 flex items-center justify-center text-sm shrink-0">
                    {icon}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={handleStart}
              className="w-full py-4 bg-[#FF6A00] text-white font-semibold rounded-2xl text-lg hover:bg-[#e55f00] active:scale-95 transition-all shadow-lg shadow-orange-200"
            >
              Iniciar tour interactivo ✨
            </button>
            <p className="mt-4 text-xs text-gray-400">
              Puedes cerrar el tour en cualquier momento pulsando Saltar
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
