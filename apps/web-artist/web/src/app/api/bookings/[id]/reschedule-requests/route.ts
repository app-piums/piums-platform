import { NextRequest, NextResponse } from 'next/server';

const BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL || 'http://booking-service:4008';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
    }

    const res = await fetch(`${BOOKING_SERVICE_URL}/api/bookings/${id}/reschedule-requests`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
