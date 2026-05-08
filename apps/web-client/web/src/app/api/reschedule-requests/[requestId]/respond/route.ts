import { NextRequest, NextResponse } from 'next/server';

const BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL || 'http://booking-service:4008';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();

    const res = await fetch(
      `${BOOKING_SERVICE_URL}/api/reschedule-requests/${requestId}/respond`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      }
    );

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
