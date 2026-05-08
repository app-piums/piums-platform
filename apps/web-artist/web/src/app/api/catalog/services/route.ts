import { NextRequest, NextResponse } from 'next/server';

const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || 'http://catalog-service:4004';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { searchParams } = new URL(request.url);
  try {
    const res = await fetch(
      `${CATALOG_SERVICE_URL}/api/services?${searchParams.toString()}`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) {
    return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    console.log('[catalog/services POST] artistId:', body.artistId, 'name:', body.name);
    const res = await fetch(`${CATALOG_SERVICE_URL}/api/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    console.log('[catalog/services POST] status:', res.status, 'response:', JSON.stringify(data).slice(0, 200));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[catalog/services POST] Error:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
