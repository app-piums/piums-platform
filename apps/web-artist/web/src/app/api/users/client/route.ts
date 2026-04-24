import { NextRequest, NextResponse } from 'next/server';

const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || 'http://users-service:4002';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ message: 'userId requerido' }, { status: 400 });

  try {
    const res = await fetch(`${USERS_SERVICE_URL}/api/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return NextResponse.json({}, { status: res.status });
    const data = await res.json();
    // users-service returns { user: {...} }
    return NextResponse.json(data.user ?? data);
  } catch (err: any) {
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
