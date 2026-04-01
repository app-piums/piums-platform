'use client';

import React from 'react';
import { useNextStep } from 'nextstepjs';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loading } from '@/components/Loading';
import ClientSidebar from '@/components/ClientSidebar';
import { NotificationBell } from '@/components/NotificationBell';

const QUICK_STEPS: { icon: React.ReactNode; label: string }[] = [
  {
    icon: <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>,
    label: 'Panel principal',
  },
  {
    icon: <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 9v7.5" /></svg>,
    label: 'Calendario & reservas',
  },
  {
    icon: <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>,
    label: 'Buscar por fecha y lugar',
  },
  {
    icon: <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>,
    label: 'Explorar artistas',
  },
  {
    icon: <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>,
    label: 'Eventos',
  },
  {
    icon: <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>,
    label: 'Favoritos',
  },
  {
    icon: <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg>,
    label: 'Mensajes',
  },
  {
    icon: <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>,
    label: 'Configuración',
  },
];

export default function TutorialPage() {
  const { startNextStep } = useNextStep();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading || !isAuthenticated) return <Loading fullScreen />;

  const displayName = user?.nombre ?? 'Usuario';

  function handleStart() {
    router.push('/dashboard');
    setTimeout(() => startNextStep('clientTour'), 400);
  }

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
      <ClientSidebar userName={displayName} />
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="hidden lg:flex bg-white border-b border-gray-100 px-8 py-4 items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Tutorial</h1>
            <p className="text-sm text-gray-400">Tour guiado interactivo de la plataforma</p>
          </div>
          <NotificationBell />
        </header>
        <div className="flex-1 overflow-y-auto p-4 pt-20 lg:p-8 lg:pt-8 flex items-center justify-center">
          <div className="max-w-lg w-full text-center">

            {/* Icon */}
            <div className="mx-auto mb-6 w-24 h-24 rounded-full bg-[#FF6A00]/10 flex items-center justify-center">
              <svg className="w-12 h-12 text-[#FF6A00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">Tour guiado de Piums</h1>
            <p className="text-gray-500 mb-2 leading-relaxed">
              Tour interactivo de <span className="font-semibold text-gray-700">14 pasos</span> que destaca cada funcionalidad directamente en la plataforma.
            </p>
            <p className="text-sm text-gray-400 mb-8">Tiempo estimado: ~2 minutos</p>

            {/* Steps grid */}
            <div className="grid grid-cols-2 gap-2.5 mb-8 text-left">
              {QUICK_STEPS.map(({ icon, label }, i) => (
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
              Iniciar tour interactivo
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
