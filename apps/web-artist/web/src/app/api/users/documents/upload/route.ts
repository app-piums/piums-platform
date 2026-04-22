import { NextRequest, NextResponse } from 'next/server';

const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || 'http://users-service:4002';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const folder = request.nextUrl.searchParams.get('folder') || 'misc';
    const res = await fetch(
      `${USERS_SERVICE_URL}/users/documents/upload?folder=${encodeURIComponent(folder)}`,
      { method: 'POST', body: formData }
    );
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
