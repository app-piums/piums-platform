import { NextRequest, NextResponse } from 'next/server';

const BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL || 'http://booking-service:4005';

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ message: 'Token requerido' }, { status: 400 });
    }

    const res = await fetch(
      `${BOOKING_SERVICE_URL}/api/reschedule-requests/confirm?token=${encodeURIComponent(token)}`
    );

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
