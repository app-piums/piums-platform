import { NextRequest, NextResponse } from 'next/server';

const GATEWAY_URL = process.env.GATEWAY_INTERNAL_URL || 'http://host.docker.internal:80';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const res = await fetch(`${GATEWAY_URL}/api/notifications/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Host: 'backend.piums.io',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { error: (data as any)?.error ?? 'Error al enviar el mensaje' },
        { status: res.status }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
