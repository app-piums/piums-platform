'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const errorParam = params.get('error');

        // Handle errors from OAuth provider
        if (errorParam) {
          setError(`Error de autenticación: ${errorParam}`);
          setTimeout(() => router.push('/login'), 3000);
          return;
        }

        // Validate token
        if (!token) {
          setError('No se recibió token de autenticación');
          setTimeout(() => router.push('/login'), 3000);
          return;
        }

        // Save token to localStorage
        localStorage.setItem('token', token);

        // Decode JWT to get user info (basic decode without verification - verification happens on backend)
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const decoded = JSON.parse(jsonPayload);

          // Update auth context with user info
          const user = {
            id: decoded.id ?? decoded.sub ?? crypto.randomUUID(),
            nombre: decoded.nombre || decoded.name || decoded.email || 'Usuario',
            email: decoded.email ?? '',
            role: decoded.role || 'cliente',
            token,
          };

          login(user);

          // Para clientes OAuth: resetear onboarding para que el middleware
          // redirija si es primer ingreso
          if ((decoded.role || 'cliente') === 'cliente') {
            document.cookie = 'onboarding_completed=false; path=/; max-age=86400; SameSite=strict';
          }

          router.push('/dashboard');
        } catch (decodeError) {
          console.error('Error decoding token:', decodeError);
          router.push('/');
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError('Error procesando autenticación');
        setTimeout(() => router.push('/login'), 3000);
      }
    };

    handleOAuthCallback();
  }, [router, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
      <div className="text-center">
        {error ? (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
              Error de Autenticación
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">{error}</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-4">
              Redirigiendo al login...
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto mb-4">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-zinc-300 dark:border-zinc-700 border-t-zinc-900 dark:border-t-zinc-50"></div>
            </div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
              Completando Autenticación
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              Verificando credenciales y configurando tu sesión...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
