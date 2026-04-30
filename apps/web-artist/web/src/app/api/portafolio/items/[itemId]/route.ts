import { NextRequest, NextResponse } from 'next/server';

const ARTISTS_SERVICE_URL = process.env.ARTISTS_SERVICE_URL || 'http://artists-service:4003';

// DELETE /api/portfolio/items/[itemId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  try {
    const { itemId } = await params;
    const meRes = await fetch(`${ARTISTS_SERVICE_URL}/artists/dashboard/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!meRes.ok) return NextResponse.json({ message: 'Artista no encontrado' }, { status: 404 });
    const meData = await meRes.json();
    const artistId = meData?.artist?.id ?? meData?.id;
    if (!artistId) return NextResponse.json({ message: 'Artista no encontrado' }, { status: 404 });

    const res = await fetch(`${ARTISTS_SERVICE_URL}/artists/${artistId}/portfolio/${itemId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
