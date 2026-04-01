import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const userRole = request.cookies.get('user_role')?.value;

  // Si el usuario es artista, redirigir a la app de artistas
  if (token && userRole === 'artista') {
    const artistUrl = process.env.NEXT_PUBLIC_ARTIST_URL || 'http://localhost:3001';
    return NextResponse.redirect(new URL(request.nextUrl.pathname, artistUrl));
  }

  // Si el usuario es admin, redirigir a la app de admin (si existe)
  if (token && userRole === 'admin') {
    // Por ahora permitir acceso, en el futuro redirigir a app de admin
    // const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3002';
    // return NextResponse.redirect(new URL('/admin', adminUrl));
  }

  // Proteger rutas que requieren autenticación
  const protectedRoutes = ['/dashboard', '/bookings', '/profile', '/chat', '/onboarding', '/services'];
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Para clientes autenticados: redirigir al onboarding si no lo han completado
  const onboardingCompleted = request.cookies.get('onboarding_completed')?.value;
  const isOnboardingRoute = request.nextUrl.pathname.startsWith('/onboarding');

  if (
    token &&
    userRole === 'cliente' &&
    onboardingCompleted !== 'true' &&
    !isOnboardingRoute &&
    request.nextUrl.pathname.startsWith('/dashboard')
  ) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  // Si ya completó onboarding e intenta ir a /onboarding, al dashboard
  if (
    token &&
    userRole === 'cliente' &&
    onboardingCompleted === 'true' &&
    isOnboardingRoute
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
