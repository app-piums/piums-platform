import { NextRequest, NextResponse } from 'next/server';

const GATEWAY_URL = process.env.GATEWAY_INTERNAL_URL || 'http://host.docker.internal:80';

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

    const res = await fetch(`${GATEWAY_URL}/api/bookings/${id}/pdf`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Host: 'backend.piums.io',
      },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return NextResponse.json(
        { message: (body as any)?.message ?? `Error ${res.status}` },
        { status: res.status }
      );
    }

    const pdfBuffer = await res.arrayBuffer();
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="reserva-${id}.pdf"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ message: 'Error al generar el PDF' }, { status: 500 });
  }
}
