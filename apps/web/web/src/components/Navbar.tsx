'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar } from './ui/Avatar';
import { Button } from './ui/Button';
import { useAuth } from '@/contexts/AuthContext';

export const Navbar: React.FC = () => {
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
              <span className="text-2xl font-bold text-blue-600">Piums</span>
            </Link>
            
            <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
              <Link
                href="/dashboard"
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  pathname === '/dashboard'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/artists"
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  pathname?.startsWith('/artists')
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Artistas
              </Link>
              <Link
                href="/search"
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  pathname === '/search'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Buscar
              </Link>
              <Link
                href="/bookings"
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  pathname?.startsWith('/bookings')
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Mis Reservas
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
                  <Avatar src={user.avatar} fallback={user.nombre} size="sm" />
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
                        Mi Perfil
                      </Link>
                      <Link
                        href="/bookings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Mis Reservas
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        Cerrar Sesión
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">Iniciar Sesión</Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">Registrarse</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
