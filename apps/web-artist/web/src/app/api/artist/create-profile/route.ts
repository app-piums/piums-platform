import { NextRequest, NextResponse } from 'next/server';

const ARTISTS_SERVICE_URL = process.env.ARTISTS_SERVICE_URL || 'http://artists-service:4003';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:4001';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) {
    return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Get user info from auth-service to fill required fields
    const verifyRes = await fetch(`${AUTH_SERVICE_URL}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
    if (!verifyRes.ok) {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
    }
    const userData = await verifyRes.json();

    const payload = {
      authId: userData.id || userData.userId,
      email: userData.email,
      nombre: userData.nombre || userData.email?.split('@')[0] || 'Artista',
      category: body.category || 'OTRO',
      specialties: body.specialties || [body.category || 'OTRO'],
      country: body.country || 'GT',
      city: body.city || userData.ciudad || 'Guatemala',
      bio: body.bio || undefined,
      instagram: body.instagram || undefined,
      website: body.website || undefined,
      equipment: body.equipment || [],
      hourlyRateMin: body.hourlyRateMin ?? undefined,
      hourlyRateMax: body.hourlyRateMax ?? undefined,
      currency: body.currency || 'USD',
      coverageRadius: 'coverageRadius' in body ? body.coverageRadius : 30,
      requiresDeposit: body.requiresDeposit ?? false,
      depositPercentage: body.depositPercentage ?? undefined,
    };

    let res = await fetch(`${ARTISTS_SERVICE_URL}/artists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    let data = await res.json().catch(() => ({}));

    // If the artist already exists (bootstrap stub from Google signup), update instead.
    if (res.status === 409) {
      const meRes = await fetch(`${ARTISTS_SERVICE_URL}/artists/dashboard/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (meRes.ok) {
        const meData = await meRes.json().catch(() => ({}));
        const artistId = meData?.artist?.id ?? meData?.id;
        if (artistId) {
          res = await fetch(`${ARTISTS_SERVICE_URL}/artists/${artistId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload),
          });
          data = await res.json().catch(() => ({}));
        }
      }
    }

    if (!res.ok) {
      return NextResponse.json({ message: data.message || 'Error al crear perfil' }, { status: res.status });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating artist profile:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
