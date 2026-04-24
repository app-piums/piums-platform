import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_HOST = 'res.cloudinary.com';
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dumqooqjv';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('u');
  if (!url) return new NextResponse('Missing url', { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new NextResponse('Invalid url', { status: 400 });
  }

  if (
    parsed.protocol !== 'https:' ||
    parsed.hostname !== ALLOWED_HOST ||
    !parsed.pathname.startsWith(`/${CLOUD_NAME}/`)
  ) {
    return new NextResponse('Not allowed', { status: 403 });
  }

  try {
    const upstream = await fetch(url);
    if (!upstream.ok) return new NextResponse('Upstream error', { status: upstream.status });

    return new NextResponse(upstream.body, {
      headers: {
        'Content-Type': upstream.headers.get('Content-Type') ?? 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new NextResponse('Proxy error', { status: 502 });
  }
}
