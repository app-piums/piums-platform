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
      return NextResponse.json({ hasProfile: true });
    }
    return NextResponse.json({ hasProfile: false }, { status: 404 });
  } catch {
    return NextResponse.json({ hasProfile: false }, { status: 503 });
  }
}
