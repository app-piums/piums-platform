import { NextRequest, NextResponse } from 'next/server';

const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || 'http://users-service:4002';

// GET /api/users/me — returns the authenticated user including avatar + profile (coverPhoto)
export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  try {
    // Fetch both user and profile in parallel
    const [userRes, profileRes] = await Promise.all([
      fetch(`${USERS_SERVICE_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${USERS_SERVICE_URL}/api/users/me/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const user = userRes.ok ? await userRes.json() : null;
    const profileData = profileRes.ok ? await profileRes.json() : null;

    return NextResponse.json({
      user: user?.user ?? user,
      profile: profileData?.profile ?? profileData,
    });
  } catch {
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
