import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const userRole = request.cookies.get('user_role')?.value;
  const onboardingCompleted = request.cookies.get('onboarding_completed')?.value;

  // Rutas públicas que NO deben redirigir
  const publicPrefixes = ['/', '/login', '/register'];
  const isPublicRoute = publicPrefixes.some(prefix =>
    request.nextUrl.pathname === prefix ||
    request.nextUrl.pathname.startsWith('/register/')
  );

  // Si está en una ruta pública, permitir acceso
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Rutas protegidas de artista (requieren autenticación)
  const protectedRoutes = ['/artist/dashboard', '/artist/onboarding'];
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  // Si es una ruta protegida y no hay token, redirigir a login
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Si es una ruta protegida y el usuario NO es artista, redirigir a home
  // IMPORTANTE: Usar request.url para mantener el mismo puerto
  // El backend devuelve 'artista' en español
  if (isProtectedRoute && token && userRole && userRole !== 'artista') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Si el usuario está autenticado como artista pero no ha completado onboarding
  // y NO está en la ruta de onboarding, redirigir a onboarding
  if (
    token &&
    userRole === 'artista' &&
    onboardingCompleted !== 'true' &&
    !request.nextUrl.pathname.startsWith('/artist/onboarding')
  ) {
    return NextResponse.redirect(new URL('/artist/onboarding', request.url));
  }

  // Si ya completó onboarding e intenta acceder a /artist/onboarding, redirigir al dashboard
  if (
    token &&
    userRole === 'artista' &&
    onboardingCompleted === 'true' &&
    request.nextUrl.pathname.startsWith('/artist/onboarding')
  ) {
    return NextResponse.redirect(new URL('/artist/dashboard', request.url));
  }

  // Permitir acceso a artistas autenticados
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
