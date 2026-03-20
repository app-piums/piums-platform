'use client';

import React from 'react';
import Link from 'next/link';
import ClientSidebar from '@/components/ClientSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Loading } from '@/components/Loading';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function BookmarksPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) return <Loading fullScreen />;

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
      <ClientSidebar userName={user?.nombre ?? 'Usuario'} />

      <div className="flex-1 min-w-0 overflow-y-auto">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-4 lg:px-8 py-4 flex items-center justify-between mt-14 lg:mt-0">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Favoritos</h1>
            <p className="text-sm text-gray-400">Artistas que has guardado</p>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-4 lg:px-6 py-8">
          {/* Empty state */}
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-20 w-20 rounded-full bg-[#FF6A00]/10 flex items-center justify-center mb-6">
              <svg className="h-10 w-10 text-[#FF6A00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Aún no tienes favoritos</h2>
            <p className="text-gray-500 mb-8 max-w-sm">
              Explora artistas y guarda los que más te gusten para encontrarlos fácilmente.
            </p>
            <Link
              href="/artists"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF6A00] text-white font-semibold rounded-xl hover:bg-[#e55d00] transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Explorar artistas
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
