import { NextRequest, NextResponse } from 'next/server';

// Redirects the browser to the external auth-service Google Calendar OAuth flow.
// The auth-service handles the OAuth exchange and callbacks back to the frontend.
export function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const backendBase = process.env.NEXT_PUBLIC_CHAT_SERVICE_URL ?? 'https://backend.piums.io';
  const target = `${backendBase}/api/auth/google/calendar-connect?token=${encodeURIComponent(token)}`;
  return NextResponse.redirect(target);
}
