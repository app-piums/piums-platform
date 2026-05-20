import { NextRequest, NextResponse } from 'next/server';

// Redirects the browser to the external auth-service Google Calendar OAuth flow.
// Reads JWT from the auth_token cookie so the client never needs to expose it in the URL.
export function GET(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const backendBase = process.env.NEXT_PUBLIC_CHAT_SERVICE_URL ?? 'https://backend.piums.io';
  const target = `${backendBase}/api/auth/google/calendar-connect?token=${encodeURIComponent(token)}`;
  return NextResponse.redirect(target);
}
