import { NextRequest, NextResponse } from 'next/server';

// CATALOG_API_URL includes the full base path, e.g. http://host.docker.internal:80/api/catalog/services
const CATALOG_API = process.env.CATALOG_API_URL || 'http://catalog-service:4004/api/services';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { searchParams } = new URL(request.url);
  try {
    const res = await fetch(
      `${CATALOG_API}?${searchParams.toString()}`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  try {
    const body = await request.json();
    const res = await fetch(`${CATALOG_API}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
