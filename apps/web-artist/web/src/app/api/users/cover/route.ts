import { NextRequest, NextResponse } from 'next/server';

const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || 'http://users-service:4002';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  try {
    // Re-create FormData to fix multipart boundary in proxy chain (same reason as avatar proxy).
    const incoming = await request.formData();
    const file = incoming.get('cover') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No se encontró el archivo' }, { status: 400 });
    }

    const outgoing = new FormData();
    outgoing.append('cover', file, file.name);

    const res = await fetch(`${USERS_SERVICE_URL}/api/users/me/profile/cover`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: outgoing,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
