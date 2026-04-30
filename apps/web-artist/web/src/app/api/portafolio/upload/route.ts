import { NextRequest, NextResponse } from 'next/server';

const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || 'http://users-service:4002';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  try {
    const incoming = await request.formData();
    const file = incoming.get('image') as File | null;
    if (!file) return NextResponse.json({ message: 'No se encontró el archivo' }, { status: 400 });

    // Convert to Buffer so Node.js fetch serializes multipart correctly
    // (appending a raw File object can omit Content-Length, breaking busboy)
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: file.type || 'image/jpeg' });

    const outgoing = new FormData();
    outgoing.append('image', blob, file.name);

    const res = await fetch(`${USERS_SERVICE_URL}/api/users/me/profile/portfolio-upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: outgoing,
    });

    // Safely parse JSON — backend may return HTML on unexpected errors
    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      console.error('[portfolio-upload] Backend returned non-JSON:', res.status, text.slice(0, 200));
      return NextResponse.json(
        { message: `Error del servidor (${res.status})` },
        { status: res.status >= 400 ? res.status : 500 }
      );
    }

    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    console.error('[portfolio-upload] Proxy error:', err?.message ?? err);
    return NextResponse.json({ message: 'Error interno', detail: err?.message }, { status: 500 });
  }
}
