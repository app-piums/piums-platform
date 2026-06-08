import { NextRequest, NextResponse } from 'next/server';

const CATALOG_API = process.env.CATALOG_API_URL || 'http://catalog-service:4004/api/services';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) {
    return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  }
  try {
    const res = await fetch(`${CATALOG_API}/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({ services: [] }));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
