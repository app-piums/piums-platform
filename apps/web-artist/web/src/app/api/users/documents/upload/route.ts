import { NextRequest, NextResponse } from 'next/server';

const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || 'http://users-service:4002';

export async function POST(request: NextRequest) {
  try {
    // Re-create FormData to fix multipart boundary in proxy chain.
    const incoming = await request.formData();
    const file = incoming.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No se encontró el archivo' }, { status: 400 });
    }

    const outgoing = new FormData();
    outgoing.append('file', file, file.name);

    const folder = request.nextUrl.searchParams.get('folder') || 'misc';
    const res = await fetch(
      `${USERS_SERVICE_URL}/api/users/documents/upload?folder=${encodeURIComponent(folder)}`,
      { method: 'POST', body: outgoing }
    );
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  try {
    const { url } = await request.json();
    const res = await fetch(`${USERS_SERVICE_URL}/api/users/me/documents`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ url }),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
