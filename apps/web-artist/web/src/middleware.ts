import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const userRole = request.cookies.get('user_role')?.value;

  // Si el usuario NO es artista, redirigir a la app de clientes
  if (token && userRole !== 'artist') {
    const clientUrl = process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost:3000';
    return NextResponse.redirect(new URL(request.nextUrl.pathname, clientUrl));
  }

  // Proteger rutas que requieren autenticación de artista
  const protectedRoutes = ['/artist/dashboard'];
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isProtectedRoute && userRole !== 'artist') {
    const clientUrl = process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost:3000';
    return NextResponse.redirect(new URL('/', clientUrl));
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
