import { NextRequest, NextResponse } from 'next/server';

const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || 'http://users-service:4002';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  try {
    // Parse FormData and reconstruct it fresh.
    // Forwarding the raw body (arrayBuffer) breaks in the proxy chain because
    // Node.js fetch omits Content-Length, causing busboy "Unexpected end of form".
    // Re-creating FormData from the File lets the runtime set boundary + length correctly.
    const incoming = await request.formData();
    const file = incoming.get('avatar') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No se encontró el archivo' }, { status: 400 });
    }

    const outgoing = new FormData();
    outgoing.append('avatar', file, file.name);

    const res = await fetch(`${USERS_SERVICE_URL}/api/users/me/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: outgoing,
    });
    const data = await res.json();

    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    console.error('[avatar-proxy] ERROR:', err?.message ?? err);
    return NextResponse.json({ message: 'Error interno', detail: err?.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  try {
    const res = await fetch(`${USERS_SERVICE_URL}/api/users/me/avatar`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return NextResponse.json({}, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
