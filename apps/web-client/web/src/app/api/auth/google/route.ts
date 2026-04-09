import { NextRequest, NextResponse } from 'next/server';
// Google auth is handled via Firebase popup — redirect to login if navigated directly.
export function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/login', request.url));
}
