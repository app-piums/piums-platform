import { NextRequest, NextResponse } from 'next/server';

const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || 'http://users-service:4002';

export async function POST(request: NextRequest) {
  const authToken = request.cookies.get('auth_token')?.value;
  if (!authToken) {
    return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  }

  try {
    const incoming = await request.formData();
    const file = incoming.get('avatar') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No se encontró el archivo' }, { status: 400 });
    }

    const outgoing = new FormData();
    outgoing.append('avatar', file, file.name);

    const res = await fetch(`${USERS_SERVICE_URL}/api/users/me/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: outgoing,
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
