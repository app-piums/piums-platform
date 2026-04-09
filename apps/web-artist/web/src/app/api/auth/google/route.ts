import { NextRequest, NextResponse } from 'next/server';
// Google auth is handled via Firebase popup — this route is no longer used.
// Redirect to login if someone navigates here directly.
export function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/login', request.url));
}
