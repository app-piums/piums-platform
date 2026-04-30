import { NextRequest, NextResponse } from 'next/server';

const ARTISTS_SERVICE_URL = process.env.ARTISTS_SERVICE_URL || 'http://artists-service:4003';

// GET /api/portfolio/items — fetch portfolio for the authenticated artist
export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  try {
    // First resolve artistId from dashboard me endpoint
    const meRes = await fetch(`${ARTISTS_SERVICE_URL}/artists/dashboard/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!meRes.ok) return NextResponse.json({ message: 'Artista no encontrado' }, { status: 404 });
    const meData = await meRes.json();
    const artistId = meData?.artist?.id ?? meData?.id;
    if (!artistId) return NextResponse.json({ message: 'Artista no encontrado' }, { status: 404 });

    const res = await fetch(`${ARTISTS_SERVICE_URL}/artists/${artistId}/portfolio`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}

// POST /api/portfolio/items — add a portfolio item
export async function POST(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  try {
    const meRes = await fetch(`${ARTISTS_SERVICE_URL}/artists/dashboard/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!meRes.ok) return NextResponse.json({ message: 'Artista no encontrado' }, { status: 404 });
    const meData = await meRes.json();
    const artistId = meData?.artist?.id ?? meData?.id;
    if (!artistId) return NextResponse.json({ message: 'Artista no encontrado' }, { status: 404 });

    const body = await request.json();
    const res = await fetch(`${ARTISTS_SERVICE_URL}/artists/${artistId}/portfolio`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
