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
      linkedin: body.linkedin || undefined,
      spotify: body.spotify || undefined,
      youtube: body.youtube || undefined,
      extraLinks: body.extraLinks?.length ? body.extraLinks : undefined,
      equipment: body.equipment || [],
      hourlyRateMin: body.hourlyRateMin ?? undefined,
      hourlyRateMax: body.hourlyRateMax ?? undefined,
      currency: body.currency || 'USD',
      coverageRadius: 'coverageRadius' in body ? body.coverageRadius : 30,
      requiresDeposit: body.requiresDeposit ?? false,
      depositPercentage: body.depositPercentage ?? undefined,
      baseLocationLabel: body.baseLocationLabel || undefined,
      baseLocationLat: body.baseLocationLat ?? undefined,
      baseLocationLng: body.baseLocationLng ?? undefined,
    };

    let res = await fetch(`${ARTISTS_SERVICE_URL}/artists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    let data = await res.json().catch(() => ({}));

    // 409 = already exists (bootstrap stub); 429 = rate-limited — both cases: update existing profile.
    // Only send fields explicitly provided by the user — never override existing data with defaults.
    if (res.status === 409 || res.status === 429) {
      const meRes = await fetch(`${ARTISTS_SERVICE_URL}/artists/dashboard/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const meData = await meRes.json().catch(() => ({}));
      const artistId = meData?.artist?.id ?? meData?.id;
      if (artistId) {
        const updatePayload: Record<string, unknown> = {};
        if (body.category) updatePayload.category = body.category;
        if (body.specialties?.length) updatePayload.specialties = body.specialties;
        if (body.city) updatePayload.city = body.city;
        if (body.country) updatePayload.country = body.country;
        if (body.bio) updatePayload.bio = body.bio;
        if (body.instagram) updatePayload.instagram = body.instagram;
        if (body.website) updatePayload.website = body.website;
        if (body.youtube) updatePayload.youtube = body.youtube;
        if (body.hourlyRateMin != null) updatePayload.hourlyRateMin = body.hourlyRateMin;
        if (body.hourlyRateMax != null) updatePayload.hourlyRateMax = body.hourlyRateMax;
        if ('coverageRadius' in body) updatePayload.coverageRadius = body.coverageRadius;
        if (body.equipment?.length) updatePayload.equipment = body.equipment;
        if (body.baseLocationLabel) updatePayload.baseLocationLabel = body.baseLocationLabel;
        if (body.baseLocationLat != null) updatePayload.baseLocationLat = body.baseLocationLat;
        if (body.baseLocationLng != null) updatePayload.baseLocationLng = body.baseLocationLng;
        res = await fetch(`${ARTISTS_SERVICE_URL}/artists/${artistId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(updatePayload),
        });
        data = await res.json().catch(() => ({}));
      } else {
        return NextResponse.json({ message: 'No se pudo obtener el perfil existente' }, { status: 503 });
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
