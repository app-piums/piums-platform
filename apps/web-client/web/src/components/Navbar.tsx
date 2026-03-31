'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Avatar } from './ui/Avatar';
import { Button } from './ui/Button';
import { useAuth } from '@/contexts/AuthContext';

export const Navbar: React.FC = () => {
  const { t } = useTranslation('menu');
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Nav Links */}
          <div className="flex">
            <Link href="/dashboard" className="flex items-center">
              <Image 
                src="/logo.png" 
                alt="Piúms" 
                width={120} 
                height={40}
                priority
              />
            </Link>
            
            <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
              <Link
                href="/dashboard"
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  pathname === '/dashboard'
                    ? 'text-[#FF6A00] bg-[#FF6A00]/10'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {t('dashboard')}
              </Link>
              <Link
                href="/artists"
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  pathname?.startsWith('/artists')
                    ? 'text-[#FF6A00] bg-[#FF6A00]/10'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {t('artists')}
              </Link>
              <Link
                href="/bookings"
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  pathname?.startsWith('/bookings')
                    ? 'text-[#FF6A00] bg-[#FF6A00]/10'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {t('bookings')}
              </Link>
              <Link
                href="/events"
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  pathname?.startsWith('/events')
                    ? 'text-[#FF6A00] bg-[#FF6A00]/10'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Eventos
              </Link>
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 hover:opacity-80"
                >
                  <Avatar src={undefined} fallback={user.nombre} size="sm" />
                  <span className="hidden sm:block text-sm font-medium text-gray-700">
                    {user.nombre}
                  </span>
                </button>

                {isUserMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-20 border border-gray-200">
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        {t('profile')}
                      </Link>
                      <Link
                        href="/bookings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        {t('bookings')}
                      </Link>
                      <Link
                        href="/events"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Eventos
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        {t('logout')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">{t('login')}</Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">{t('register')}</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
