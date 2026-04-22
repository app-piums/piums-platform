import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ARTISTS_SERVICE_URL = process.env.ARTISTS_SERVICE_URL || "http://artists-service:4003";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ hasProfile: false }, { status: 401 });
  }

  try {
    const res = await fetch(`${ARTISTS_SERVICE_URL}/artists/dashboard/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      // Distinguish bootstrap stub from a completed onboarding.
      // A freshly bootstrapped artist has category='OTRO', no specialties and no basePrice.
      const data = await res.json().catch(() => null);
      const artist = data?.artist ?? data;
      const specialties: unknown[] = Array.isArray(artist?.specialties) ? artist.specialties : [];
      const hasRealCategory = artist?.category && artist.category !== 'OTRO';
      const hasPricing = artist?.basePrice != null || artist?.hourlyRateMin != null;
      const onboarded = hasRealCategory || specialties.length > 0 || hasPricing;
      return NextResponse.json({ hasProfile: onboarded }, { status: onboarded ? 200 : 404 });
    }
    return NextResponse.json({ hasProfile: false }, { status: 404 });
  } catch {
    return NextResponse.json({ hasProfile: false }, { status: 503 });
  }
}
